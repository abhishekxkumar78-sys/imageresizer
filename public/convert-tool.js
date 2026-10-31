// Converter Tool (Images & Audio) - 100% Browser-Only
// freeeimageresizer.com

document.addEventListener('DOMContentLoaded', () => {
    const uploadHero = document.getElementById('uploadHero');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.getElementById('settingsSection');
    const imagePreview = document.getElementById('imagePreview');

    const formatSelect = document.getElementById('formatSelect');
    const originalFormatEl = document.getElementById('originalFormat');
    const targetFormatEl = document.getElementById('targetFormat');
    const convertedSizeEl = document.getElementById('convertedSize');
    const downloadBtn = document.getElementById('downloadBtn');

    const targetFileSize = document.getElementById('targetFileSize');
    const targetFileSizeUnit = document.getElementById('targetFileSizeUnit');
    const targetFileSizeField = targetFileSize ? targetFileSize.closest('.setting-field') : null;

    // Audio-specific elements
    let audioPreviewContainer = document.getElementById('audioPreviewContainer');
    let audioInputPreview = document.getElementById('audioInputPreview');
    let audioOutputWrapper = document.getElementById('audioOutputWrapper');
    let audioOutputPreview = document.getElementById('audioOutputPreview');
    let bitrateField = document.getElementById('bitrateField');
    let bitrateSelect = document.getElementById('bitrateSelect');
    let targetSizeNotice = document.getElementById('targetSizeNotice');
    let licenseCreditNotice = document.getElementById('licenseCreditNotice');
    let progressContainer = document.getElementById('conversionProgressContainer');

    ensureAudioUIElements();

    let currentFile = null;
    let currentMediaType = null; // 'image' or 'audio'
    let imgElement = null;
    let currentBlob = null;
    let currentConvertedBlob = null;
    let currentAudioBuffer = null;
    let audioWorker = null;
    let isConvertingAudio = false;

    // Progress component via MediaUI
    const progressComponent = (window.MediaUI && window.MediaUI.createProgressComponent)
        ? window.MediaUI.createProgressComponent(progressContainer, cancelAudioConversion)
        : null;

    if (selectImagesBtn && fileInput) {
        selectImagesBtn.addEventListener('click', () => fileInput.click());
    }

    if (uploadDropzone) {
        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.style.borderColor = 'var(--primary)';
        });
        uploadDropzone.addEventListener('dragleave', () => {
            uploadDropzone.style.borderColor = '';
        });
        uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDropzone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
            }
        });
    }

    function formatBytes(bytes) {
        if (window.MediaUI && window.MediaUI.formatBytes) {
            return window.MediaUI.formatBytes(bytes);
        }
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function ensureAudioUIElements() {
        if (!settingsSection) return;

        // 1. Audio preview container
        if (!audioPreviewContainer && imagePreview) {
            const previewBox = imagePreview.parentElement;
            if (previewBox) {
                audioPreviewContainer = document.createElement('div');
                audioPreviewContainer.id = 'audioPreviewContainer';
                audioPreviewContainer.className = 'media-preview-box';
                audioPreviewContainer.style.display = 'none';

                audioPreviewContainer.innerHTML = `
                    <div class="media-audio-player-wrapper">
                        <div class="media-audio-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                        </div>
                        <div style="width:100%; text-align:left;">
                            <span id="audioInputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('originalAudio') : 'Original Audio'}</span>
                            <audio id="audioInputPreview" class="media-audio-element" controls style="width:100%;"></audio>
                        </div>
                        <div id="audioOutputWrapper" style="display:none; width:100%; text-align:left; margin-top:12px;">
                            <span id="audioOutputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('downloadAudio') : 'Converted Audio'}</span>
                            <audio id="audioOutputPreview" class="media-audio-element" controls style="width:100%;"></audio>
                        </div>
                    </div>
                `;
                previewBox.appendChild(audioPreviewContainer);
                audioInputPreview = audioPreviewContainer.querySelector('#audioInputPreview');
                audioOutputWrapper = audioPreviewContainer.querySelector('#audioOutputWrapper');
                audioOutputPreview = audioPreviewContainer.querySelector('#audioOutputPreview');
            }
        }

        // 2. Audio Bitrate select field with all 13 standard MP3 bitrates
        if (!bitrateField && formatSelect) {
            const formatField = formatSelect.closest('.setting-field');
            if (formatField) {
                bitrateField = document.createElement('div');
                bitrateField.id = 'bitrateField';
                bitrateField.className = 'setting-field';
                bitrateField.style.display = 'none';
                bitrateField.style.marginBottom = '20px';

                bitrateField.innerHTML = `
                    <label id="bitrateLabel" class="setting-label" style="display:block; font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">${window.tMedia ? window.tMedia('audioBitrate') : 'Audio Bitrate'}</label>
                    <select id="bitrateSelect" class="setting-select" style="width:100%; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border); font-family:inherit; font-size:14px; background:var(--bg-light); color:var(--text-primary);">
                        <option value="320">320 kbps</option>
                        <option value="256">256 kbps</option>
                        <option value="192">192 kbps</option>
                        <option value="160">160 kbps</option>
                        <option value="128" selected>128 kbps</option>
                        <option value="112">112 kbps</option>
                        <option value="96">96 kbps</option>
                        <option value="80">80 kbps</option>
                        <option value="64">64 kbps</option>
                        <option value="56">56 kbps</option>
                        <option value="48">48 kbps</option>
                        <option value="40">40 kbps</option>
                        <option value="32">32 kbps</option>
                    </select>
                `;
                formatField.parentNode.insertBefore(bitrateField, formatField.nextSibling);
                bitrateSelect = bitrateField.querySelector('#bitrateSelect');
            }
        }

        // 3. Target size notice
        if (!targetSizeNotice && targetFileSizeField) {
            targetSizeNotice = document.createElement('p');
            targetSizeNotice.id = 'targetSizeNotice';
            targetSizeNotice.className = 'media-note';
            targetSizeNotice.style.display = 'none';
            targetFileSizeField.appendChild(targetSizeNotice);
        }

        // License credit is permanently in dropzone formats paragraph in HTML (single link per page)

        // 5. Progress container
        if (!progressContainer && downloadBtn) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'conversionProgressContainer';
            downloadBtn.parentNode.insertBefore(progressContainer, downloadBtn);
        }
    }

    async function handleFile(file) {
        if (window.MediaUI && window.MediaUI.clearError) {
            window.MediaUI.clearError(settingsSection);
            window.MediaUI.clearError(uploadDropzone);
        }

        if (currentConvertedBlob) currentConvertedBlob = null;
        if (currentBlob) currentBlob = null;
        if (audioInputPreview && audioInputPreview.src && audioInputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioInputPreview.src);
            audioInputPreview.src = '';
        }
        if (audioOutputPreview && audioOutputPreview.src && audioOutputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioOutputPreview.src);
            audioOutputPreview.src = '';
        }

        const mediaType = (window.MediaUI && window.MediaUI.detectMediaType)
            ? window.MediaUI.detectMediaType(file)
            : (file.type.startsWith('audio/') ? 'audio' : 'image');

        if (mediaType !== 'image' && mediaType !== 'audio') {
            const errMsg = window.tMedia ? window.tMedia('unsupportedFileType') : 'This file type is not supported here. Please select an image or audio file.';
            if (window.MediaUI && window.MediaUI.showError) {
                window.MediaUI.showError(uploadDropzone, errMsg);
            }
            return;
        }

        // Check file size limits BEFORE processing
        if (window.MediaUI && window.MediaUI.checkFileSizeLimit) {
            const sizeCheck = window.MediaUI.checkFileSizeLimit(file, mediaType);
            if (!sizeCheck.ok) {
                if (window.MediaUI.showError) {
                    window.MediaUI.showError(uploadDropzone, sizeCheck.error);
                } else {
                    alert(sizeCheck.error);
                }
                return;
            }
        }

        // Check browser capabilities for audio
        if (mediaType === 'audio') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                const err = window.tMedia ? window.tMedia('webAudioNotSupported') : 'Web Audio API is not supported by your browser.';
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }
            if (typeof window.Worker === 'undefined') {
                const err = window.tMedia ? window.tMedia('webWorkerNotSupported') : 'Web Workers are not supported by your browser.';
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }

            // Duration check BEFORE decoding using metadata
            if (window.MediaUI && window.MediaUI.getAudioMetadataDuration) {
                const metaDur = await window.MediaUI.getAudioMetadataDuration(file);
                const maxMin = window.MAX_AUDIO_MIN || 10;
                const maxAudioSec = maxMin * 60;
                if (metaDur !== null && metaDur > (maxAudioSec + 2)) {
                    const err = window.tMedia ? window.tMedia('audioTooLong', { maxMin }) : `Audio is too long. Maximum audio length is ${maxMin} minutes.`;
                    window.MediaUI.showError(uploadDropzone, err);
                    return;
                }
            }
        }

        currentFile = file;
        currentMediaType = mediaType;
        const ext = file.name.split('.').pop().toUpperCase();
        originalFormatEl.textContent = ext || (mediaType === 'audio' ? 'AUDIO' : 'IMAGE');

        if (mediaType === 'image') {
            setupImageUI();
            const reader = new FileReader();
            reader.onload = (e) => {
                imgElement = new Image();
                imgElement.onload = () => {
                    uploadHero.style.display = 'none';
                    settingsSection.style.display = 'block';
                    processImageConversion();
                };
                imgElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else if (mediaType === 'audio') {
            setupAudioUI();
            uploadHero.style.display = 'none';
            settingsSection.style.display = 'block';
            loadAndProcessAudio(file);
        }
    }

    function setupImageUI() {
        if (imagePreview) imagePreview.style.display = 'block';
        if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
        if (bitrateField) bitrateField.style.display = 'none';
        if (bitrateSelect) bitrateSelect.disabled = false;
        if (targetFileSizeField) {
            targetFileSizeField.style.display = 'block';
            if (targetFileSize) targetFileSize.disabled = false;
            if (targetFileSizeUnit) targetFileSizeUnit.disabled = false;
        }
        if (targetSizeNotice) targetSizeNotice.style.display = 'none';
        // licenseCreditNotice removed
        if (downloadBtn) {
            downloadBtn.textContent = 'Download Converted File';
            downloadBtn.style.display = 'block';
        }

        formatSelect.innerHTML = `
            <option value="image/png">PNG (.png) — Lossless, Transparent</option>
            <option value="image/jpeg">JPG / JPEG (.jpg) — Universal Photo Standard</option>
            <option value="image/webp">WebP (.webp) — Modern Web Format</option>
        `;
    }

    function setupAudioUI() {
        if (imagePreview) imagePreview.style.display = 'none';
        if (audioPreviewContainer) audioPreviewContainer.style.display = 'block';
        if (audioOutputWrapper) audioOutputWrapper.style.display = 'none';
        // licenseCreditNotice removed

        formatSelect.innerHTML = `
            <option value="audio/mpeg" selected>MP3 (.mp3)</option>
            <option value="audio/wav">WAV (.wav)</option>
        `;

        updateAudioFieldVisibility();
    }

    function updateAudioFieldVisibility() {
        if (currentMediaType !== 'audio') return;
        const isMp3 = formatSelect.value === 'audio/mpeg';

        if (bitrateField) {
            bitrateField.style.display = isMp3 ? 'block' : 'none';
        }

        if (isMp3) {
            if (targetFileSizeField) {
                targetFileSizeField.style.display = 'block';
                if (targetFileSize) targetFileSize.disabled = false;
                if (targetFileSizeUnit) targetFileSizeUnit.disabled = false;
            }
            if (targetSizeNotice) {
                targetSizeNotice.style.color = 'var(--text-muted)';
                updateTargetSizeNoticeForMp3();
            }
        } else {
            // For WAV output: disable target size and show translated hint
            if (targetFileSizeField) {
                targetFileSizeField.style.display = 'block';
                if (targetFileSize) targetFileSize.disabled = true;
                if (targetFileSizeUnit) targetFileSizeUnit.disabled = true;
            }
            if (targetSizeNotice) {
                targetSizeNotice.textContent = window.tMedia
                    ? window.tMedia('wavNoTargetSize')
                    : 'Target file size cannot be set for WAV because WAV uses uncompressed, fixed-size PCM audio.';
                targetSizeNotice.style.color = '#b45309';
                targetSizeNotice.style.display = 'block';
            }
        }

        targetFormatEl.textContent = isMp3 ? 'MP3' : 'WAV';
    }

    async function loadAndProcessAudio(file) {
        if (audioInputPreview) {
            if (audioInputPreview.src && audioInputPreview.src.startsWith('blob:')) {
                URL.revokeObjectURL(audioInputPreview.src);
            }
            audioInputPreview.src = URL.createObjectURL(file);
        }

        if (progressComponent) {
            progressComponent.show(window.tMedia ? window.tMedia('decodingAudio') : 'Decoding audio...');
            progressComponent.update(5, window.tMedia ? window.tMedia('decodingAudio') : 'Decoding audio...');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);

            // Double-check duration after decode in case metadata was missing
            if (window.MediaUI && window.MediaUI.checkAudioDurationLimit) {
                const durCheck = window.MediaUI.checkAudioDurationLimit(decoded.duration);
                if (!durCheck.ok) {
                    if (progressComponent) progressComponent.hide();
                    window.MediaUI.showError(settingsSection, durCheck.error);
                    return;
                }
            }

            // Resample or downmix if necessary before encoding
            currentAudioBuffer = await prepareAudioBuffer(decoded);
            processAudioConversion();
        } catch (err) {
            console.error('Audio decode error:', err);
            if (progressComponent) progressComponent.hide();
            const errMsg = window.tMedia ? window.tMedia('audioDecodeError') : 'Could not decode this audio file.';
            window.MediaUI.showError(settingsSection, errMsg);
        }
    }

    // Prepare audio buffer: handle non-standard sample rates and downmixing
    async function prepareAudioBuffer(buffer) {
        const sr = buffer.sampleRate;
        const channels = buffer.numberOfChannels;
        const supportedRates = [44100, 48000, 32000, 24000, 22050, 16000];

        let targetSr = sr;
        if (sr > 48000) {
            targetSr = (sr % 48000 === 0) ? 48000 : 44100;
        } else if (!supportedRates.includes(sr)) {
            targetSr = 44100;
        }

        const targetChannels = Math.min(2, channels);
        const needsResample = (targetSr !== sr);
        const needsDownmix = (channels > 2);

        if (!needsResample && !needsDownmix) {
            return buffer;
        }

        const targetLength = Math.round(buffer.duration * targetSr);
        const offlineCtx = new OfflineAudioContext(targetChannels, targetLength, targetSr);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(offlineCtx.destination);
        source.start(0);
        return await offlineCtx.startRendering();
    }

    // Pick HIGHEST bitrate from [320, 256, 192, 160, 128, 112, 96, 80, 64, 56, 48, 40, 32]
    // whose estimated size (bitrate x duration / 8) is <= target.
    // If even 32 kbps is above target, use 32 kbps and note it's unreachable.
    function computeTargetBitrate(targetBytes, durationSec) {
        const bitrates = [320, 256, 192, 160, 128, 112, 96, 80, 64, 56, 48, 40, 32];
        let chosen = null;
        let isUnreachable = false;

        for (const b of bitrates) {
            const estBytes = (b * 1000 / 8) * durationSec;
            if (estBytes <= targetBytes) {
                chosen = b;
                break;
            }
        }

        if (!chosen) {
            chosen = 32;
            isUnreachable = true;
        }

        const estBytes = Math.round((chosen * 1000 / 8) * durationSec);
        return {
            bitrate: chosen,
            estBytes: estBytes,
            isUnreachable: isUnreachable
        };
    }

    function updateTargetSizeNoticeForMp3() {
        if (!currentAudioBuffer || formatSelect.value !== 'audio/mpeg') return;
        const targetBytes = getTargetBytes();
        if (!targetBytes || !targetSizeNotice) {
            if (targetSizeNotice) targetSizeNotice.style.display = 'none';
            if (bitrateSelect) bitrateSelect.disabled = false;
            return;
        }

        const calc = computeTargetBitrate(targetBytes, currentAudioBuffer.duration);
        if (bitrateSelect) {
            bitrateSelect.value = String(calc.bitrate);
            bitrateSelect.disabled = true;
        }

        const estFormatted = formatBytes(calc.estBytes);
        if (calc.isUnreachable) {
            targetSizeNotice.textContent = window.tMedia
                ? window.tMedia('targetSizeUnreachable', { estSize: estFormatted })
                : `Target size is below minimum audio bitrate. Using 32 kbps as the closest possible result (estimated size: ${estFormatted}).`;
        } else {
            targetSizeNotice.textContent = window.tMedia
                ? window.tMedia('targetSizeEst', { estSize: estFormatted, kbps: calc.bitrate })
                : `Estimated size: ${estFormatted} (bitrate: ${calc.bitrate} kbps)`;
        }
        targetSizeNotice.style.display = 'block';
    }

    async function processAudioConversion() {
        if (!currentAudioBuffer || currentMediaType !== 'audio') return;

        const isMp3 = formatSelect.value === 'audio/mpeg';
        const targetFormatStr = isMp3 ? 'MP3' : 'WAV';
        targetFormatEl.textContent = targetFormatStr;

        let bitrate = 128;
        let targetBytes = null;
        let isUnreachable = false;

        if (isMp3) {
            targetBytes = getTargetBytes();
            if (targetBytes) {
                const calc = computeTargetBitrate(targetBytes, currentAudioBuffer.duration);
                bitrate = calc.bitrate;
                isUnreachable = calc.isUnreachable;
                if (bitrateSelect) bitrateSelect.value = String(bitrate);
                updateTargetSizeNoticeForMp3();
            } else {
                bitrate = bitrateSelect ? parseInt(bitrateSelect.value, 10) : 128;
                if (targetSizeNotice) targetSizeNotice.style.display = 'none';
            }
        } else {
            if (targetSizeNotice) {
                targetSizeNotice.textContent = window.tMedia
                    ? window.tMedia('wavNoTargetSize')
                    : 'Target file size cannot be set for WAV because WAV uses uncompressed, fixed-size PCM audio.';
                targetSizeNotice.style.display = 'block';
            }
        }

        // Cancel any existing worker
        if (audioWorker) {
            audioWorker.terminate();
            audioWorker = null;
        }

        if (window.MediaUI && window.MediaUI.requestWakeLock) {
            await window.MediaUI.requestWakeLock();
        }

        isConvertingAudio = true;
        if (progressComponent) {
            progressComponent.show(window.tMedia ? window.tMedia('convertingAudio') : 'Converting audio...');
            progressComponent.update(10);
        }

        // LAZY LOADING: Web Worker is loaded ONLY when audio conversion is requested!
        audioWorker = new Worker('/audio-worker.js');

        const channels = currentAudioBuffer.numberOfChannels;
        const channelData = [];
        for (let ch = 0; ch < channels; ch++) {
            const f32 = new Float32Array(currentAudioBuffer.length);
            currentAudioBuffer.copyFromChannel(f32, ch);
            channelData.push(f32);
        }

        audioWorker.onmessage = function (e) {
            const msg = e.data;
            if (!msg) return;

            if (msg.type === 'progress') {
                if (progressComponent) {
                    progressComponent.update(msg.percent, window.tMedia ? window.tMedia('convertingAudio') : 'Converting audio...');
                }
            } else if (msg.type === 'complete') {
                isConvertingAudio = false;
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) progressComponent.hide();

                let blob;
                if (msg.pcmChunks) {
                    blob = new Blob([msg.header, ...msg.pcmChunks], { type: msg.mimeType });
                } else {
                    blob = new Blob([msg.buffer], { type: msg.mimeType });
                }
                currentBlob = blob;
                currentConvertedBlob = blob;
                convertedSizeEl.textContent = formatBytes(blob.size);

                // Update audio output preview
                if (audioOutputPreview) {
                    if (audioOutputPreview.src && audioOutputPreview.src.startsWith('blob:')) {
                        URL.revokeObjectURL(audioOutputPreview.src);
                    }
                    audioOutputPreview.src = URL.createObjectURL(blob);
                    if (audioOutputWrapper) audioOutputWrapper.style.display = 'block';
                }

                // Target size achieved notice
                if (isMp3 && targetBytes && targetSizeNotice) {
                    const realFormatted = formatBytes(blob.size);
                    if (isUnreachable) {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeUnreachable', { estSize: realFormatted })
                            : `Target size is below minimum audio bitrate. Using 32 kbps as the closest possible result (achieved size: ${realFormatted}).`;
                    } else if (blob.size <= targetBytes * 1.03) {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeAchieved', { realSize: realFormatted, kbps: bitrate })
                            : `Achieved size: ${realFormatted} (${bitrate} kbps)`;
                    } else {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeExceeded', { realSize: realFormatted, kbps: bitrate })
                            : `Achieved size: ${realFormatted} (${bitrate} kbps). Note: slightly exceeds target due to audio frame structure.`;
                    }
                    targetSizeNotice.style.display = 'block';
                }

                if (downloadBtn) {
                    downloadBtn.textContent = window.tMedia ? window.tMedia('downloadAudio') : 'Download Converted Audio';
                    downloadBtn.style.display = 'block';
                }
            } else if (msg.type === 'error') {
                isConvertingAudio = false;
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) progressComponent.hide();
                window.MediaUI.showError(settingsSection, msg.message);
            } else if (msg.type === 'cancelled') {
                isConvertingAudio = false;
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) {
                    progressComponent.update(0, window.tMedia ? window.tMedia('conversionCancelled') : 'Conversion cancelled.');
                    setTimeout(() => progressComponent.hide(), 1200);
                }
            }
        };

        audioWorker.onerror = function (err) {
            console.error('Audio worker error:', err);
            isConvertingAudio = false;
            if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                window.MediaUI.releaseWakeLock();
            }
            if (progressComponent) progressComponent.hide();
            const errMsg = window.tMedia ? window.tMedia('audioProcessError') : 'Audio conversion failed.';
            window.MediaUI.showError(settingsSection, errMsg);
        };

        const transferables = channelData.map(c => c.buffer);
        audioWorker.postMessage({
            command: 'convert',
            format: isMp3 ? 'mp3' : 'wav',
            sampleRate: currentAudioBuffer.sampleRate,
            channels: channels,
            bitrate: bitrate,
            channelData: channelData
        }, transferables);
    }

    function cancelAudioConversion() {
        if (audioWorker) {
            audioWorker.postMessage({ command: 'cancel' });
            setTimeout(() => {
                if (audioWorker) {
                    audioWorker.terminate();
                    audioWorker = null;
                }
            }, 100);
        }
        isConvertingAudio = false;
        if (window.MediaUI && window.MediaUI.releaseWakeLock) {
            window.MediaUI.releaseWakeLock();
        }
        if (progressComponent) {
            progressComponent.update(0, window.tMedia ? window.tMedia('conversionCancelled') : 'Conversion cancelled.');
            setTimeout(() => progressComponent.hide(), 1000);
        }
    }

    // --- Image Processing (Preserved Exactly) ---
    async function processImageConversion() {
        if (!imgElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (formatSelect.value === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(imgElement, 0, 0);

        const mimeType = formatSelect.value;
        const extName = mimeType === 'image/png' ? 'PNG' : (mimeType === 'image/webp' ? 'WEBP' : 'JPG');
        targetFormatEl.textContent = extName;

        const targetBytes = getTargetBytes();
        let blob = null;
        if (targetBytes) {
            blob = await adjustCanvasToTarget(canvas, mimeType, targetBytes, 0.92);
        }
        if (!blob) {
            blob = await new Promise(r => canvas.toBlob(r, mimeType, 0.92));
        }
        if (!blob) return;
        currentBlob = blob;

        if (imagePreview.src && imagePreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview.src);
        }
        const url = URL.createObjectURL(blob);
        imagePreview.src = url;
        convertedSizeEl.textContent = formatBytes(blob.size);
    }

    function onFormatOrSettingsChanged() {
        if (currentMediaType === 'audio') {
            updateAudioFieldVisibility();
            processAudioConversion();
        } else if (currentMediaType === 'image') {
            processImageConversion();
        }
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', onFormatOrSettingsChanged);
    }

    if (bitrateSelect) {
        bitrateSelect.addEventListener('change', () => {
            if (currentMediaType === 'audio') processAudioConversion();
        });
    }

    if (targetFileSize) {
        targetFileSize.addEventListener('input', onFormatOrSettingsChanged);
        targetFileSize.addEventListener('change', onFormatOrSettingsChanged);
    }
    if (targetFileSizeUnit) {
        targetFileSizeUnit.addEventListener('change', onFormatOrSettingsChanged);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentBlob || !currentFile) return;

            let ext = '.jpg';
            if (currentMediaType === 'audio') {
                ext = formatSelect.value === 'audio/mpeg' ? '.mp3' : '.wav';
            } else {
                const extMap = {
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/webp': '.webp'
                };
                ext = extMap[formatSelect.value] || '.jpg';
            }

            const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'converted-file';
            const fileName = originalName + ext;

            if (window.MediaUI && window.MediaUI.triggerDownload) {
                window.MediaUI.triggerDownload(currentBlob, fileName);
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(currentBlob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    function getTargetBytes() {
        if (!targetFileSize || targetFileSize.disabled) return null;
        const val = parseFloat(targetFileSize.value);
        if (isNaN(val) || val <= 0) return null;
        const multiplier = (targetFileSizeUnit && targetFileSizeUnit.value === 'MB') ? (1024 * 1024) : 1024;
        return Math.round(val * multiplier);
    }

    async function adjustCanvasToTarget(canvas, mimeType, targetBytes, initialQuality = 0.85) {
        if (!targetBytes || targetBytes <= 0) return null;
        const isLossy = mimeType === 'image/jpeg' || mimeType === 'image/webp';
        let bestBlob = null;
        let bestDiff = Infinity;

        if (isLossy) {
            let low = 0.02;
            let high = 0.98;
            for (let i = 0; i < 7; i++) {
                const mid = (low + high) / 2;
                const b = await new Promise(r => canvas.toBlob(r, mimeType, mid));
                if (!b) break;
                const diff = Math.abs(b.size - targetBytes);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestBlob = b;
                }
                if (b.size > targetBytes) high = mid;
                else low = mid;
            }

            if (bestBlob && bestBlob.size > targetBytes * 1.15) {
                let scale = Math.min(0.9, Math.sqrt(targetBytes / bestBlob.size));
                for (let step = 0; step < 4; step++) {
                    if (scale < 0.1) break;
                    const sw = Math.max(10, Math.round(canvas.width * scale));
                    const sh = Math.max(10, Math.round(canvas.height * scale));
                    const sc = document.createElement('canvas');
                    sc.width = sw;
                    sc.height = sh;
                    const sctx = sc.getContext('2d');
                    sctx.drawImage(canvas, 0, 0, sw, sh);

                    let sLow = 0.05, sHigh = 0.95;
                    for (let j = 0; j < 5; j++) {
                        const q = (sLow + sHigh) / 2;
                        const b = await new Promise(r => sc.toBlob(r, mimeType, q));
                        if (!b) break;
                        const diff = Math.abs(b.size - targetBytes);
                        if (diff < bestDiff) {
                            bestDiff = diff;
                            bestBlob = b;
                        }
                        if (b.size > targetBytes) sHigh = q;
                        else sLow = q;
                    }
                    if (bestBlob && bestBlob.size <= targetBytes * 1.05) break;
                    scale *= 0.85;
                }
            }
        } else {
            let initialBlob = await new Promise(r => canvas.toBlob(r, mimeType));
            if (initialBlob && initialBlob.size <= targetBytes) return initialBlob;
            bestBlob = initialBlob;
            let currentSize = initialBlob ? initialBlob.size : targetBytes * 2;
            let scale = 1.0;

            for (let i = 0; i < 6; i++) {
                scale = Math.min(scale * 0.95, Math.sqrt(targetBytes / currentSize) * 0.95);
                if (scale < 0.05) break;
                const sw = Math.max(10, Math.round(canvas.width * scale));
                const sh = Math.max(10, Math.round(canvas.height * scale));
                const sc = document.createElement('canvas');
                sc.width = sw;
                sc.height = sh;
                const sctx = sc.getContext('2d');
                sctx.drawImage(canvas, 0, 0, sw, sh);
                const b = await new Promise(r => sc.toBlob(r, mimeType));
                if (!b) break;
                currentSize = b.size;
                const diff = Math.abs(b.size - targetBytes);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestBlob = b;
                }
                if (b.size <= targetBytes) break;
            }
        }
        return bestBlob;
    }
});
