// public/media-video.js
// Shared Video Processing Library for freeeimageresizer.com
// Uses single-thread ffmpeg.wasm loaded lazily via window.FFmpegLoader

const MediaVideo = (function () {
  const MAX_VIDEO_MB = 100;
  const MAX_VIDEO_MIN = 5;
  const MAX_FULL_RES_SEC = 60;

  function throttle(fn, wait) {
    let last = 0;
    let timer = null;
    let lastArgs = null;
    return function (...args) {
      const now = Date.now();
      lastArgs = args;
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, lastArgs);
        }, wait - (now - last));
      }
    };
  }

  // Ensure FFmpeg is loaded with lazy script injection
  async function ensureFFmpegLoaded(onProgress) {
    if (!window.FFmpegLoader) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/ffmpeg/ffmpeg-loader.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load /ffmpeg/ffmpeg-loader.js'));
        document.head.appendChild(script);
      });
    }
    return await window.FFmpegLoader.load(onProgress);
  }

  // Probe video metadata (duration, width, height, hasAudio)
  // 1. Cheap HTML5 <video> metadata probe
  // 2. Fallback to FFmpeg CLI (-i) probe for formats browser cannot decode (e.g. AVI, MKV)
  async function probeVideo(file, progressComponent) {
    if (!file || file.size === 0) {
      const err = window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.';
      throw new Error(err);
    }

    let meta = null;
    if (window.MediaUI && window.MediaUI.getVideoMetadata) {
      meta = await window.MediaUI.getVideoMetadata(file);
    }

    if (!meta) {
      meta = await probeVideoWithEngine(file, progressComponent);
    }

    if (!meta || !meta.width || !meta.height) {
      const err = window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.';
      throw new Error(err);
    }

    // Duration limit: max 5 minutes (300 s)
    if (meta.duration > (MAX_VIDEO_MIN * 60)) {
      const err = window.tMedia ? window.tMedia('videoTooLong', { maxMin: MAX_VIDEO_MIN }) : `Video is too long. Maximum video length is ${MAX_VIDEO_MIN} minutes.`;
      throw new Error(err);
    }

    // Resolution limit: long side <= 1920 AND short side <= 1080
    const longSide = Math.max(meta.width, meta.height);
    const shortSide = Math.min(meta.width, meta.height);
    if (longSide > 1920 || shortSide > 1080) {
      const err = window.tMedia ? window.tMedia('videoResolutionTooHigh') : 'Maximum video resolution is 1920x1080 (Full HD).';
      throw new Error(err);
    }

    return meta;
  }

  async function probeVideoWithEngine(file, progressComponent) {
    const downloadMsg = window.tMedia ? (window.tMedia('engineDownloadingCompress') || window.tMedia('engineDownloading')) : 'Downloading the conversion engine (first time only, about 31 MB)...';
    if (progressComponent) {
      progressComponent.show(downloadMsg);
      progressComponent.update(0);
    }

    const throttledProbeProgress = throttle((p) => {
      if (progressComponent) {
        progressComponent.update(p, downloadMsg);
      }
    }, 150);

    let ffmpeg = null;
    try {
      ffmpeg = await ensureFFmpegLoaded(throttledProbeProgress);
      const ext = '.' + (file.name.split('.').pop().toLowerCase() || 'mp4');
      const probeName = 'probe_' + Date.now() + ext;

      const buf = await file.arrayBuffer();
      await ffmpeg.writeFile(probeName, new Uint8Array(buf));

      const logs = [];
      const handler = ({ message }) => logs.push(message);
      ffmpeg.on('log', handler);

      try {
        await ffmpeg.exec(['-i', probeName]);
      } catch (e) {}

      ffmpeg.off('log', handler);
      try { await ffmpeg.deleteFile(probeName); } catch (e) {}
      await window.FFmpegLoader.terminate();

      if (progressComponent) progressComponent.hide();

      const fullLog = logs.join('\n');
      const durMatch = fullLog.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      const dur = durMatch ? (parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60 + parseFloat(durMatch[3])) : null;
      const vidMatch = fullLog.match(/Stream #\d+:\d+.*?: Video:.*?,\s*(\d+)x(\d+)/);
      const hasAudio = /Stream #\d+:\d+.*?: Audio:/.test(fullLog);

      if (!vidMatch) {
        if (hasAudio) {
          throw new Error(window.tMedia ? window.tMedia('noVideoStream') : 'No video stream found in this file.');
        }
        throw new Error(window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.');
      }

      return {
        duration: dur || 0,
        width: parseInt(vidMatch[1], 10),
        height: parseInt(vidMatch[2], 10),
        hasAudio
      };
    } catch (err) {
      if (window.FFmpegLoader) {
        try { await window.FFmpegLoader.terminate(); } catch (e) {}
      }
      if (progressComponent) progressComponent.hide();
      throw err;
    }
  }

  // Compress video to MP4 using libx264
  async function compressVideo(opts) {
    const {
      file,
      metadata,
      compressionLevel = 'balanced',
      reduce720p = false,
      progressComponent = null,
      onProgress = null,
      signal = null
    } = opts;

    if (!file) throw new Error('No file provided for compression.');

    if (window.MediaUI && window.MediaUI.requestWakeLock) {
      await window.MediaUI.requestWakeLock();
    }

    const downloadMsg = window.tMedia ? (window.tMedia('engineDownloadingCompress') || window.tMedia('engineDownloading')) : 'Downloading the compression engine (first time only, about 31 MB)...';
    const compressingMsg = window.tMedia ? window.tMedia('compressingVideo') : 'Compressing video...';

    if (progressComponent) {
      progressComponent.show(downloadMsg);
      progressComponent.update(0);
    }

    const throttledProgress = throttle((p, msg) => {
      if (progressComponent) progressComponent.update(p, msg);
      if (onProgress) onProgress(p, msg);
    }, 150);

    let ffmpeg = null;
    try {
      if (signal && signal.cancelled) throw new Error('Cancelled');

      ffmpeg = await ensureFFmpegLoaded((p) => {
        throttledProgress(p, downloadMsg);
      });

      if (signal && signal.cancelled) throw new Error('Cancelled');

      const ext = '.' + (file.name.split('.').pop().toLowerCase() || 'mp4');
      const inFileName = 'input_' + Date.now() + ext;
      const outFileName = 'output_' + Date.now() + '.mp4';

      const fileBuf = await file.arrayBuffer();
      if (signal && signal.cancelled) throw new Error('Cancelled');

      await ffmpeg.writeFile(inFileName, new Uint8Array(fileBuf));

      // Audio stream presence check
      let hasAudio = metadata ? metadata.hasAudio : undefined;
      if (hasAudio === undefined) {
        const probeLogs = [];
        const probeHandler = ({ message }) => probeLogs.push(message);
        ffmpeg.on('log', probeHandler);
        try { await ffmpeg.exec(['-i', inFileName]); } catch (e) {}
        ffmpeg.off('log', probeHandler);
        hasAudio = /Stream #\d+:\d+.*?: Audio:/.test(probeLogs.join('\n'));
      }

      const args = ['-i', inFileName];

      // 720p scale rule
      if (reduce720p && metadata) {
        const isPortrait = metadata.height > metadata.width;
        if (isPortrait) {
          args.push('-vf', "scale='min(720,iw)':-2");
        } else {
          args.push('-vf', "scale=-2:'min(720,ih)'");
        }
      }

      // CRF and Audio bitrate mapping:
      // Light: Q=26, A=128k
      // Balanced: Q=30, A=96k
      // Strong: Q=34, A=64k
      const crfMap = { light: 26, balanced: 30, strong: 34 };
      const audioBitrateMap = { light: '128k', balanced: '96k', strong: '64k' };

      const crf = crfMap[compressionLevel] || 30;
      const aBitrate = audioBitrateMap[compressionLevel] || '96k';

      args.push(
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      );

      if (hasAudio) {
        args.push('-c:a', 'aac', '-b:a', aBitrate);
      } else {
        args.push('-an');
      }

      args.push(outFileName);

      if (progressComponent) {
        progressComponent.update(0, compressingMsg);
      }

      const progressHandler = ({ progress }) => {
        if (signal && signal.cancelled) return;
        const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
        throttledProgress(percent, compressingMsg);
      };
      ffmpeg.on('progress', progressHandler);

      const code = await ffmpeg.exec(args);
      ffmpeg.off('log', () => {});
      ffmpeg.off('progress', progressHandler);

      if (signal && signal.cancelled) throw new Error('Cancelled');

      if (code !== 0) {
        throw new Error(window.tMedia ? window.tMedia('cannotReadVideo') : 'Video compression failed.');
      }

      const outData = await ffmpeg.readFile(outFileName);
      if (signal && signal.cancelled) throw new Error('Cancelled');

      // Cleanup virtual files
      try { await ffmpeg.deleteFile(inFileName); } catch (e) {}
      try { await ffmpeg.deleteFile(outFileName); } catch (e) {}

      // Terminate engine after every run
      await window.FFmpegLoader.terminate();

      if (window.MediaUI && window.MediaUI.releaseWakeLock) {
        window.MediaUI.releaseWakeLock();
      }
      if (progressComponent) progressComponent.hide();

      const blob = new Blob([outData.buffer], { type: 'video/mp4' });
      return { blob, size: blob.size };
    } catch (err) {
      if (window.FFmpegLoader) {
        try { await window.FFmpegLoader.terminate(); } catch (e) {}
      }
      if (window.MediaUI && window.MediaUI.releaseWakeLock) {
        window.MediaUI.releaseWakeLock();
      }
      if (progressComponent) progressComponent.hide();
      throw err;
    }
  }

  async function cancel() {
    if (window.FFmpegLoader) {
      try { await window.FFmpegLoader.terminate(); } catch (e) {}
    }
    if (window.MediaUI && window.MediaUI.releaseWakeLock) {
      window.MediaUI.releaseWakeLock();
    }
  }

  // Watermark video by overlaying a transparent PNG watermark
  async function watermarkVideo(opts) {
    const {
      file,
      metadata,
      watermarkPngBlob,
      videoQuality = 'high',
      reduce720p = false,
      progressComponent = null,
      onProgress = null,
      signal = null
    } = opts;

    if (!file) throw new Error('No file provided for watermarking.');
    if (!watermarkPngBlob) throw new Error('No watermark PNG provided.');

    if (window.MediaUI && window.MediaUI.requestWakeLock) {
      await window.MediaUI.requestWakeLock();
    }

    const downloadMsg = window.tMedia ? (window.tMedia('engineDownloadingWatermark') || window.tMedia('engineDownloading')) : 'Downloading the watermarking engine (first time only, about 31 MB)...';
    const watermarkingMsg = window.tMedia ? window.tMedia('watermarkingVideo') : 'Applying watermark to video...';

    if (progressComponent) {
      progressComponent.show(downloadMsg);
      progressComponent.update(0);
    }

    const throttledProgress = throttle((p, msg) => {
      if (progressComponent) progressComponent.update(p, msg);
      if (onProgress) onProgress(p, msg);
    }, 150);

    let ffmpeg = null;
    try {
      if (signal && signal.cancelled) throw new Error('Cancelled');

      ffmpeg = await ensureFFmpegLoaded((p) => {
        throttledProgress(p, downloadMsg);
      });

      if (signal && signal.cancelled) throw new Error('Cancelled');

      const ext = '.' + (file.name.split('.').pop().toLowerCase() || 'mp4');
      const inFileName = 'input_' + Date.now() + ext;
      const wmFileName = 'wm_' + Date.now() + '.png';
      const outFileName = 'output_' + Date.now() + '.mp4';

      const [fileBuf, wmBuf] = await Promise.all([
        file.arrayBuffer(),
        watermarkPngBlob.arrayBuffer()
      ]);

      if (signal && signal.cancelled) throw new Error('Cancelled');

      await ffmpeg.writeFile(inFileName, new Uint8Array(fileBuf));
      await ffmpeg.writeFile(wmFileName, new Uint8Array(wmBuf));

      // Audio stream presence check
      let hasAudio = metadata ? metadata.hasAudio : undefined;
      if (hasAudio === undefined) {
        const probeLogs = [];
        const probeHandler = ({ message }) => probeLogs.push(message);
        ffmpeg.on('log', probeHandler);
        try { await ffmpeg.exec(['-i', inFileName]); } catch (e) {}
        ffmpeg.off('log', probeHandler);
        hasAudio = /Stream #\d+:\d+.*?: Audio:/.test(probeLogs.join('\n'));
      }

      const args = ['-i', inFileName, '-i', wmFileName];

      // Scale argument if 720p reduction requested
      if (reduce720p && metadata) {
        const isPortrait = metadata.height > metadata.width;
        const scaleFilter = isPortrait ? 'scale=720:-2' : 'scale=-2:720';
        args.push('-filter_complex', `[0:v]${scaleFilter}[v0];[v0][1:v]overlay=0:0:format=auto`);
      } else {
        args.push('-filter_complex', '[0:v][1:v]overlay=0:0:format=auto');
      }

      const crfMap = { high: 23, medium: 28, low: 32 };
      const crf = crfMap[videoQuality] || 23;

      args.push(
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart'
      );

      if (hasAudio) {
        args.push('-c:a', 'aac', '-b:a', '128k');
      } else {
        args.push('-an');
      }

      args.push(outFileName);

      if (progressComponent) {
        progressComponent.update(0, watermarkingMsg);
      }

      const progressHandler = ({ progress }) => {
        if (signal && signal.cancelled) return;
        const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
        throttledProgress(percent, watermarkingMsg);
      };
      ffmpeg.on('progress', progressHandler);

      const code = await ffmpeg.exec(args);
      ffmpeg.off('log', () => {});
      ffmpeg.off('progress', progressHandler);

      if (signal && signal.cancelled) throw new Error('Cancelled');

      if (code !== 0) {
        throw new Error(window.tMedia ? window.tMedia('cannotReadVideo') : 'Video watermarking failed.');
      }

      const outData = await ffmpeg.readFile(outFileName);
      if (signal && signal.cancelled) throw new Error('Cancelled');

      // Cleanup virtual files
      try { await ffmpeg.deleteFile(inFileName); } catch (e) {}
      try { await ffmpeg.deleteFile(wmFileName); } catch (e) {}
      try { await ffmpeg.deleteFile(outFileName); } catch (e) {}

      // Terminate engine after every run
      await window.FFmpegLoader.terminate();

      if (window.MediaUI && window.MediaUI.releaseWakeLock) {
        window.MediaUI.releaseWakeLock();
      }
      if (progressComponent) progressComponent.hide();

      const blob = new Blob([outData.buffer], { type: 'video/mp4' });
      return { blob, size: blob.size };
    } catch (err) {
      if (window.FFmpegLoader) {
        try { await window.FFmpegLoader.terminate(); } catch (e) {}
      }
      if (window.MediaUI && window.MediaUI.releaseWakeLock) {
        window.MediaUI.releaseWakeLock();
      }
      if (progressComponent) progressComponent.hide();
      throw err;
    }
  }

  return {
    MAX_VIDEO_MB,
    MAX_VIDEO_MIN,
    MAX_FULL_RES_SEC,
    throttle,
    probeVideo,
    compressVideo,
    watermarkVideo,
    cancel
  };

  return {
    MAX_VIDEO_MB,
    MAX_VIDEO_MIN,
    MAX_FULL_RES_SEC,
    throttle,
    probeVideo,
    compressVideo,
    cancel
  };
})();

if (typeof window !== 'undefined') {
  window.MediaVideo = MediaVideo;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaVideo;
}
