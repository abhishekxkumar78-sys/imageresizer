// Shared Media UI Utilities
// freeeimageresizer.com - Browser-only media tools

const MediaUI = (function () {
  let activeWakeLock = null;

  function detectMediaType(file) {
    if (!file) return 'unknown';
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i.test(name)) {
      return 'image';
    }
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|wma|aiff|opus)$/i.test(name)) {
      return 'audio';
    }
    if (type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(name)) {
      return 'video';
    }
    if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
      return 'pdf';
    }
    return 'unknown';
  }

  function checkFileSizeLimit(file, mediaType) {
    if (!file) return { ok: false, error: 'No file provided.' };
    const maxAudioBytes = (window.MAX_AUDIO_MB || 50) * 1024 * 1024;
    const maxVideoBytes = (window.MAX_VIDEO_MB || 100) * 1024 * 1024;

    if (mediaType === 'audio' && file.size > maxAudioBytes) {
      return { ok: false, error: window.tMedia ? window.tMedia('fileTooLargeAudio') : 'File is too large. Maximum audio size is 50MB.' };
    }
    if (mediaType === 'video' && file.size > maxVideoBytes) {
      return { ok: false, error: 'File is too large. Maximum video size is 100MB.' };
    }
    return { ok: true };
  }

  function checkAudioDurationLimit(durationSec) {
    const maxMin = window.MAX_AUDIO_MIN || 10;
    const maxAudioSec = maxMin * 60;
    if (durationSec > (maxAudioSec + 2)) {
      const msg = window.tMedia ? window.tMedia('audioTooLong', { maxMin }) : `Audio is too long. Maximum audio length is ${maxMin} minutes.`;
      return { ok: false, error: msg };
    }
    return { ok: true };
  }

  // Read audio duration cheaply from metadata without full decode
  function getAudioMetadataDuration(file) {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const url = URL.createObjectURL(file);
      let finished = false;

      function done(dur) {
        if (!finished) {
          finished = true;
          URL.revokeObjectURL(url);
          audio.removeAttribute('src');
          audio.load();
          resolve(dur);
        }
      }

      const timer = setTimeout(() => done(null), 2500);

      audio.onloadedmetadata = function () {
        clearTimeout(timer);
        const d = audio.duration;
        if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0) {
          done(d);
        } else {
          done(null);
        }
      };

      audio.onerror = function () {
        clearTimeout(timer);
        done(null);
      };

      audio.src = url;
    });
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !activeWakeLock) {
        activeWakeLock = await navigator.wakeLock.request('screen');
        activeWakeLock.addEventListener('release', () => {
          activeWakeLock = null;
        });
      }
    } catch (e) {
      activeWakeLock = null;
    }
  }

  function releaseWakeLock() {
    try {
      if (activeWakeLock) {
        activeWakeLock.release();
        activeWakeLock = null;
      }
    } catch (e) {
      activeWakeLock = null;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function triggerDownload(blobOrUrl, fileName) {
    const isBlob = blobOrUrl instanceof Blob;
    const url = isBlob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (isBlob) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function createProgressComponent(container, onCancel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'media-progress-container';
    wrapper.style.display = 'none';

    wrapper.innerHTML = `
      <div class="media-progress-header">
        <span class="media-progress-status">Processing...</span>
        <span class="media-progress-percent">0%</span>
      </div>
      <div class="media-progress-track">
        <div class="media-progress-fill" style="width: 0%;"></div>
      </div>
      <div class="media-progress-actions">
        <button type="button" class="media-progress-cancel-btn">${window.tMedia ? window.tMedia('cancel') : 'Cancel'}</button>
      </div>
    `;

    const statusEl = wrapper.querySelector('.media-progress-status');
    const percentEl = wrapper.querySelector('.media-progress-percent');
    const fillEl = wrapper.querySelector('.media-progress-fill');
    const cancelBtn = wrapper.querySelector('.media-progress-cancel-btn');

    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof onCancel === 'function') onCancel();
    });

    container.appendChild(wrapper);

    return {
      show(initialStatus) {
        if (initialStatus) statusEl.textContent = initialStatus;
        fillEl.style.width = '0%';
        percentEl.textContent = '0%';
        wrapper.style.display = 'block';
      },
      hide() {
        wrapper.style.display = 'none';
      },
      update(percent, statusText) {
        const p = Math.max(0, Math.min(100, Math.round(percent)));
        fillEl.style.width = p + '%';
        percentEl.textContent = p + '%';
        if (statusText) statusEl.textContent = statusText;
      },
      element: wrapper
    };
  }

  function showError(container, message) {
    if (!container) return;
    let errEl = container.querySelector('.media-error-message');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'media-error-message';
      container.prepend(errEl);
    }
    errEl.textContent = message;
    errEl.style.display = 'block';
  }

  function clearError(container) {
    if (!container) return;
    const errEl = container.querySelector('.media-error-message');
    if (errEl) {
      errEl.textContent = '';
      errEl.style.display = 'none';
    }
  }

  return {
    detectMediaType,
    checkFileSizeLimit,
    checkAudioDurationLimit,
    getAudioMetadataDuration,
    requestWakeLock,
    releaseWakeLock,
    formatBytes,
    formatDuration,
    triggerDownload,
    createProgressComponent,
    showError,
    clearError
  };
})();

if (typeof window !== 'undefined') {
  window.MediaUI = MediaUI;
}
