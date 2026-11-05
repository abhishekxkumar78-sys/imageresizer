(function(window) {
  'use strict';

  var EXPECTED_WASM_SHA256 = '9f57947a5bd530d8f00c5b3f2cb2a3492faa7e5d823315342d6a8656d0a6b7b7';

  var instancePromise = null;
  var ffmpegInstance = null;
  var coreBlobUrl = null;
  var wasmBlobUrl = null;

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      if (window.FFmpegWASM) {
        return resolve();
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function() { resolve(); };
      script.onerror = function() { reject(new Error('Failed to load script: ' + src)); };
      document.head.appendChild(script);
    });
  }

  function fetchPartWithProgress(url, partIndex, progressState, onProgress) {
    return fetch(url).then(function(res) {
      if (!res.ok) {
        throw new Error('Failed to fetch ' + url + ': HTTP ' + res.status);
      }
      var cl = res.headers.get('content-length');
      if (cl) {
        progressState.totals[partIndex] = parseInt(cl, 10);
      }

      function updateProgress() {
        if (typeof onProgress !== 'function') return;
        var loadedSum = progressState.loaded[0] + progressState.loaded[1];
        var totalSum = progressState.totals[0] + progressState.totals[1];
        var percent = 0;
        if (totalSum > 0) {
          percent = Math.min(100, Math.round((loadedSum / totalSum) * 100));
        } else {
          percent = Math.min(100, Math.round((loadedSum / 32232419) * 100));
        }
        onProgress(percent);
      }

      if (!res.body || typeof res.body.getReader !== 'function') {
        return res.arrayBuffer().then(function(buf) {
          progressState.loaded[partIndex] = buf.byteLength;
          updateProgress();
          return buf;
        });
      }

      var reader = res.body.getReader();
      var chunks = [];
      var received = 0;

      function pump() {
        return reader.read().then(function(result) {
          if (result.done) {
            var combined = new Uint8Array(received);
            var offset = 0;
            for (var i = 0; i < chunks.length; i++) {
              combined.set(chunks[i], offset);
              offset += chunks[i].byteLength;
            }
            return combined.buffer;
          }
          chunks.push(result.value);
          received += result.value.byteLength;
          progressState.loaded[partIndex] = received;
          updateProgress();
          return pump();
        });
      }

      return pump();
    });
  }

  function bufferToHex(buf) {
    var bytes = new Uint8Array(buf);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  function load(onProgress) {
    if (ffmpegInstance) {
      if (typeof onProgress === 'function') onProgress(100);
      return Promise.resolve(ffmpegInstance);
    }
    if (instancePromise) {
      return instancePromise;
    }

    instancePromise = (async function() {
      // (a) Load /ffmpeg/ffmpeg.js lazily with a <script> tag if window.FFmpegWASM is not defined
      await loadScript('/ffmpeg/ffmpeg.js');
      if (!window.FFmpegWASM || !window.FFmpegWASM.FFmpeg) {
        throw new Error('FFmpegWASM is not available after loading ffmpeg.js');
      }

      // (b) Fetch the two wasm parts in parallel with fetch(), report progress 0-100 through onProgress
      var progressState = {
        loaded: [0, 0],
        totals: [0, 0]
      };

      if (typeof onProgress === 'function') onProgress(0);

      var parts = await Promise.all([
        fetchPartWithProgress('/ffmpeg/ffmpeg-core.part1.bin', 0, progressState, onProgress),
        fetchPartWithProgress('/ffmpeg/ffmpeg-core.part2.bin', 1, progressState, onProgress)
      ]);

      var buf1 = parts[0];
      var buf2 = parts[1];

      // (c) Concatenate them into one ArrayBuffer
      var totalBytes = buf1.byteLength + buf2.byteLength;
      var combinedWasm = new Uint8Array(totalBytes);
      combinedWasm.set(new Uint8Array(buf1), 0);
      combinedWasm.set(new Uint8Array(buf2), buf1.byteLength);
      var wasmArrayBuffer = combinedWasm.buffer;

      // (d) Verify its SHA-256 with crypto.subtle.digest against EXPECTED_WASM_SHA256
      var hashBuffer = await crypto.subtle.digest('SHA-256', wasmArrayBuffer);
      var hashHex = bufferToHex(hashBuffer);

      if (hashHex.toLowerCase() !== EXPECTED_WASM_SHA256.toLowerCase()) {
        throw new Error('ffmpeg wasm integrity check failed');
      }

      // (e) Create blob URLs for core JS and wasm (type application/wasm), then call ffmpeg.load()
      var coreRes = await fetch('/ffmpeg/ffmpeg-core.js');
      if (!coreRes.ok) {
        throw new Error('Failed to fetch /ffmpeg/ffmpeg-core.js: HTTP ' + coreRes.status);
      }
      var coreText = await coreRes.text();
      coreBlobUrl = URL.createObjectURL(new Blob([coreText], { type: 'text/javascript' }));
      wasmBlobUrl = URL.createObjectURL(new Blob([wasmArrayBuffer], { type: 'application/wasm' }));

      var FFmpegClass = window.FFmpegWASM.FFmpeg;
      var ffmpeg = new FFmpegClass();

      var classWorkerURL = undefined;
      await ffmpeg.load({
        coreURL: coreBlobUrl,
        wasmURL: wasmBlobUrl,
        classWorkerURL: classWorkerURL
      });

      if (typeof onProgress === 'function') onProgress(100);

      // (f) Cache instance
      ffmpegInstance = ffmpeg;
      return ffmpegInstance;
    })().catch(function(err) {
      instancePromise = null;
      throw err;
    });

    return instancePromise;
  }

  function terminate() {
    if (ffmpegInstance) {
      try {
        ffmpegInstance.terminate();
      } catch (e) {
        console.warn('FFmpeg terminate error:', e);
      }
    }
    ffmpegInstance = null;
    instancePromise = null;
    if (coreBlobUrl) {
      try { URL.revokeObjectURL(coreBlobUrl); } catch (e) {}
      coreBlobUrl = null;
    }
    if (wasmBlobUrl) {
      try { URL.revokeObjectURL(wasmBlobUrl); } catch (e) {}
      wasmBlobUrl = null;
    }
  }

  window.FFmpegLoader = {
    load: load,
    terminate: terminate,
    EXPECTED_WASM_SHA256: EXPECTED_WASM_SHA256
  };
})(window);

