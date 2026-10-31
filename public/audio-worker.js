// Audio Conversion Web Worker
// Supports MP3 (lamejs) and WAV (streaming RIFF PCM encoder)
// Runs fully client-side in a Web Worker without blocking the main UI thread.

let isCancelled = false;

self.onmessage = function (e) {
  const data = e.data;
  if (!data) return;

  if (data.command === 'cancel') {
    isCancelled = true;
    self.postMessage({ type: 'cancelled' });
    return;
  }

  if (data.command === 'convert') {
    isCancelled = false;
    const format = (data.format || 'mp3').toLowerCase();
    const sampleRate = data.sampleRate || 44100;
    const numberOfChannels = data.channels || (data.channelData ? data.channelData.length : 1);
    const channelData = data.channelData; // array of transferred Float32Arrays
    const bitrate = data.bitrate || 128; // kbps

    if (!channelData || channelData.length === 0) {
      self.postMessage({ type: 'error', message: 'No audio channel data provided.' });
      return;
    }

    try {
      if (format === 'wav') {
        convertWav(numberOfChannels, sampleRate, channelData);
      } else if (format === 'mp3') {
        convertMp3(numberOfChannels, sampleRate, channelData, bitrate);
      } else {
        self.postMessage({ type: 'error', message: 'Unsupported output audio format: ' + format });
      }
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message || 'Audio conversion failed.' });
    }
  }
};

function convertWav(numChannels, sampleRate, channelBuffers) {
  self.postMessage({ type: 'progress', percent: 5 });
  const actualChannels = Math.min(2, Math.max(1, numChannels));
  const numSamples = channelBuffers[0].length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = actualChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  // 44-byte WAV header
  const headerBuffer = new ArrayBuffer(44);
  const headerView = new DataView(headerBuffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      headerView.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  headerView.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  headerView.setUint32(16, 16, true);
  headerView.setUint16(20, 1, true); // Linear PCM
  headerView.setUint16(22, actualChannels, true);
  headerView.setUint32(24, sampleRate, true);
  headerView.setUint32(28, byteRate, true);
  headerView.setUint16(32, blockAlign, true);
  headerView.setUint16(34, 16, true); // 16 bits per sample
  writeString(36, 'data');
  headerView.setUint32(40, dataSize, true);

  // Convert float to Int16 in chunks and stream chunks directly
  const CHUNK_SAMPLES = 32768; // 64 KB per channel
  const pcmChunks = [];
  const progressInterval = Math.max(1, Math.floor((numSamples / CHUNK_SAMPLES) / 20));
  let chunkIndex = 0;

  for (let offset = 0; offset < numSamples; offset += CHUNK_SAMPLES) {
    if (isCancelled) {
      pcmChunks.length = 0;
      channelBuffers = null;
      return;
    }

    chunkIndex++;
    if (chunkIndex % progressInterval === 0) {
      const p = Math.min(95, 5 + Math.round((offset / numSamples) * 90));
      self.postMessage({ type: 'progress', percent: p });
    }

    const count = Math.min(CHUNK_SAMPLES, numSamples - offset);
    const chunkBuffer = new ArrayBuffer(count * blockAlign);
    const view = new DataView(chunkBuffer);
    let byteOffset = 0;

    for (let i = 0; i < count; i++) {
      const sampleIdx = offset + i;
      for (let ch = 0; ch < actualChannels; ch++) {
        let sample = channelBuffers[ch] ? channelBuffers[ch][sampleIdx] : 0;
        sample = Math.max(-1, Math.min(1, sample));
        const s = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(byteOffset, s, true);
        byteOffset += 2;
      }
    }
    pcmChunks.push(chunkBuffer);
  }

  // Release channel buffer references immediately
  channelBuffers = null;

  if (isCancelled) {
    pcmChunks.length = 0;
    return;
  }

  self.postMessage({ type: 'progress', percent: 100 });
  self.postMessage({
    type: 'complete',
    header: headerBuffer,
    pcmChunks: pcmChunks,
    mimeType: 'audio/wav',
    ext: '.wav'
  }, [headerBuffer, ...pcmChunks]);
}

function convertMp3(numChannels, sampleRate, channelBuffers, bitrate) {
  self.postMessage({ type: 'progress', percent: 5 });

  if (typeof self.lamejs === 'undefined') {
    self.importScripts('lame.min.js');
  }

  const Lame = self.lamejs || (typeof lamejs !== 'undefined' ? lamejs : null);
  if (!Lame || !Lame.Mp3Encoder) {
    throw new Error('LAME MP3 encoder library could not be loaded.');
  }

  const actualChannels = Math.min(2, Math.max(1, numChannels));
  const numSamples = channelBuffers[0].length;
  const encoder = new Lame.Mp3Encoder(actualChannels, sampleRate, bitrate);
  const mp3Data = [];

  // Reusable Int16 chunk buffers: 16128 samples (multiple of 1152) = ~32 KB
  const CHUNK_SAMPLES = 16128;
  const leftInt16 = new Int16Array(CHUNK_SAMPLES);
  const rightInt16 = actualChannels === 2 ? new Int16Array(CHUNK_SAMPLES) : null;

  const leftFloat = channelBuffers[0];
  const rightFloat = actualChannels === 2 ? channelBuffers[1] : null;

  const progressInterval = Math.max(1, Math.floor((numSamples / CHUNK_SAMPLES) / 25));
  let chunkIndex = 0;

  for (let offset = 0; offset < numSamples; offset += CHUNK_SAMPLES) {
    if (isCancelled) {
      mp3Data.length = 0;
      channelBuffers = null;
      return;
    }

    chunkIndex++;
    if (chunkIndex % progressInterval === 0) {
      const p = Math.min(95, 5 + Math.round((offset / numSamples) * 90));
      self.postMessage({ type: 'progress', percent: p });
    }

    const count = Math.min(CHUNK_SAMPLES, numSamples - offset);

    // Convert Float to Int16 in chunk
    for (let i = 0; i < count; i++) {
      const sampleIdx = offset + i;
      const sl = Math.max(-1, Math.min(1, leftFloat[sampleIdx]));
      leftInt16[i] = sl < 0 ? sl * 0x8000 : sl * 0x7FFF;
      if (rightInt16 && rightFloat) {
        const sr = Math.max(-1, Math.min(1, rightFloat[sampleIdx]));
        rightInt16[i] = sr < 0 ? sr * 0x8000 : sr * 0x7FFF;
      }
    }

    // Feed chunk to encoder in 1152 sample blocks
    for (let b = 0; b < count; b += 1152) {
      const bCount = Math.min(1152, count - b);
      const subLeft = (bCount === 1152) ? leftInt16.subarray(b, b + 1152) : leftInt16.subarray(b, b + bCount);
      let mp3buf;
      if (actualChannels === 1) {
        mp3buf = encoder.encodeBuffer(subLeft);
      } else {
        const subRight = (bCount === 1152) ? rightInt16.subarray(b, b + 1152) : rightInt16.subarray(b, b + bCount);
        mp3buf = encoder.encodeBuffer(subLeft, subRight);
      }

      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(mp3buf instanceof Uint8Array ? mp3buf : new Uint8Array(mp3buf));
      }
    }
  }

  // Release channel float buffer references immediately
  channelBuffers = null;

  if (isCancelled) {
    mp3Data.length = 0;
    return;
  }

  const flushBuf = encoder.flush();
  if (flushBuf && flushBuf.length > 0) {
    mp3Data.push(flushBuf instanceof Uint8Array ? flushBuf : new Uint8Array(flushBuf));
  }

  let totalLength = 0;
  for (let i = 0; i < mp3Data.length; i++) {
    totalLength += mp3Data[i].length;
  }

  const combined = new Uint8Array(totalLength);
  let pos = 0;
  for (let i = 0; i < mp3Data.length; i++) {
    combined.set(mp3Data[i], pos);
    pos += mp3Data[i].length;
  }
  mp3Data.length = 0;

  self.postMessage({ type: 'progress', percent: 100 });
  self.postMessage({
    type: 'complete',
    buffer: combined.buffer,
    mimeType: 'audio/mpeg',
    ext: '.mp3'
  }, [combined.buffer]);
}
