// Converter Tool (Images, Audio & Video) - 100% Browser-Only
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
    let progressContainer = document.getElementById('conversionProgressContainer');

    // Video-specific elements
    let videoPreviewContainer = document.getElementById('videoPreviewContainer');
    let videoInputPreview = document.getElementById('videoInputPreview');
    let videoOutputWrapper = document.getElementById('videoOutputWrapper');
    let videoOutputPreview = document.getElementById('videoOutputPreview');
    let videoQualityField = document.getElementById('videoQualityField');
    let videoQualitySelect = document.getElementById('videoQualitySelect');
    let reduce720pField = document.getElementById('reduce720pField');
    let reduce720pCheckbox = document.getElementById('reduce720pCheckbox');
    let fullResolutionNotice = document.getElementById('fullResolutionNotice');

    ensureMediaUIElements();

    let currentFile = null;
    let currentMediaType = null; // 'image', 'audio', or 'video'
    let imgElement = null;
    let currentBlob = null;
    let currentConvertedBlob = null;
    let currentAudioBuffer = null;
    let audioWorker = null;
    let isConvertingAudio = false;

    // Video conversion state
    let currentVideoMetadata = null; // { duration, width, height, hasAudio }
    let isConvertingVideo = false;
    let activeConversionSeq = 0;

    // Unified cancel callback for progress component
    function onCancelConversion() {
        if (currentMediaType === 'video') {
            cancelVideoConversion();
        } else if (currentMediaType === 'audio') {
            cancelAudioConversion();
        }
    }

    // Progress component via MediaUI
    const progressComponent = (window.MediaUI && window.MediaUI.createProgressComponent)
        ? window.MediaUI.createProgressComponent(progressContainer, onCancelConversion)
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

    function throttle(fn, delayMs) {
        let last = 0;
        let timer = null;
        return function (...args) {
            const now = Date.now();
            if (now - last >= delayMs) {
                last = now;
                if (timer) { clearTimeout(timer); timer = null; }
                fn.apply(this, args);
            } else if (!timer) {
                timer = setTimeout(() => {
                    last = Date.now();
                    timer = null;
                    fn.apply(this, args);
                }, delayMs - (now - last));
            }
        };
    }

    function ensureMediaUIElements() {
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
                            <span id="audioOutputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('convertedAudio') : 'Converted Audio'}</span>
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

        // 2. Video preview container
        if (!videoPreviewContainer && imagePreview) {
            const previewBox = imagePreview.parentElement;
            if (previewBox) {
                videoPreviewContainer = document.createElement('div');
                videoPreviewContainer.id = 'videoPreviewContainer';
                videoPreviewContainer.className = 'media-preview-box';
                videoPreviewContainer.style.display = 'none';

                videoPreviewContainer.innerHTML = `
                    <div class="media-video-container">
                        <div style="width:100%; text-align:left;">
                            <span id="videoInputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('originalVideo') : 'Original Video'}</span>
                            <video id="videoInputPreview" class="media-video-preview" controls preload="metadata"></video>
                        </div>
                        <div id="videoOutputWrapper" class="media-video-output-wrapper" style="display:none; width:100%; text-align:left; margin-top:12px;">
                            <span id="videoOutputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('convertedVideo') : 'Converted Video'}</span>
                            <video id="videoOutputPreview" class="media-video-preview" controls preload="metadata"></video>
                        </div>
                    </div>
                `;
                previewBox.appendChild(videoPreviewContainer);
                videoInputPreview = videoPreviewContainer.querySelector('#videoInputPreview');
                videoOutputWrapper = videoPreviewContainer.querySelector('#videoOutputWrapper');
                videoOutputPreview = videoPreviewContainer.querySelector('#videoOutputPreview');
            }
        }

        // 3. Audio Bitrate select field
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

        // 4. Video Quality select field
        if (!videoQualityField && formatSelect) {
            const formatField = formatSelect.closest('.setting-field');
            if (formatField) {
                videoQualityField = document.createElement('div');
                videoQualityField.id = 'videoQualityField';
                videoQualityField.className = 'setting-field';
                videoQualityField.style.display = 'none';
                videoQualityField.style.marginBottom = '20px';

                videoQualityField.innerHTML = `
                    <label id="videoQualityLabel" class="setting-label" style="display:block; font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">${window.tMedia ? window.tMedia('videoQuality') : 'Video quality'}</label>
                    <select id="videoQualitySelect" class="setting-select" style="width:100%; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border); font-family:inherit; font-size:14px; background:var(--bg-light); color:var(--text-primary);">
                        <option value="high">${window.tMedia ? window.tMedia('qualityHigh') : 'High'}</option>
                        <option value="medium" selected>${window.tMedia ? window.tMedia('qualityMedium') : 'Medium'}</option>
                        <option value="low">${window.tMedia ? window.tMedia('qualityLow') : 'Low'}</option>
                    </select>
                `;
                formatField.parentNode.insertBefore(videoQualityField, formatField.nextSibling);
                videoQualitySelect = videoQualityField.querySelector('#videoQualitySelect');
            }
        }

        // 5. Reduce to 720p Checkbox field
        if (!reduce720pField && videoQualityField) {
            reduce720pField = document.createElement('div');
            reduce720pField.id = 'reduce720pField';
            reduce720pField.className = 'setting-field';
            reduce720pField.style.display = 'none';
            reduce720pField.style.marginBottom = '20px';

            reduce720pField.innerHTML = `
                <label class="media-checkbox-field">
                    <input type="checkbox" id="reduce720pCheckbox" class="media-checkbox-input" checked>
                    <span id="reduce720pLabel" class="media-checkbox-label">${window.tMedia ? window.tMedia('reduce720p') : 'Reduce to 720p (faster, uses less memory)'}</span>
                </label>
                <p id="fullResolutionNotice" class="media-note" style="display:none; color:#b45309; margin-top:6px; font-size:13px;"></p>
            `;
            videoQualityField.parentNode.insertBefore(reduce720pField, videoQualityField.nextSibling);
            reduce720pCheckbox = reduce720pField.querySelector('#reduce720pCheckbox');
            fullResolutionNotice = reduce720pField.querySelector('#fullResolutionNotice');

            reduce720pCheckbox.addEventListener('change', () => {
                if (!reduce720pCheckbox.checked && currentVideoMetadata && currentVideoMetadata.duration > 60) {
                    reduce720pCheckbox.checked = true;
                    if (fullResolutionNotice) {
                        fullResolutionNotice.textContent = window.tMedia
                            ? window.tMedia('fullResolutionNotice')
                            : 'Full resolution is limited to 60 seconds. Keep 720p for longer videos.';
                        fullResolutionNotice.style.display = 'block';
                    }
                } else {
                    if (fullResolutionNotice) {
                        fullResolutionNotice.style.display = 'none';
                    }
                }
                onVideoSettingChanged();
            });
        }

        // 6. Target size notice
        if (!targetSizeNotice && targetFileSizeField) {
            targetSizeNotice = document.createElement('p');
            targetSizeNotice.id = 'targetSizeNotice';
            targetSizeNotice.className = 'media-note';
            targetSizeNotice.style.display = 'none';
            targetFileSizeField.appendChild(targetSizeNotice);
        }

        // 7. Progress container
        if (!progressContainer && downloadBtn) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'conversionProgressContainer';
            downloadBtn.parentNode.insertBefore(progressContainer, downloadBtn);
        }
    }

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

    async function handleFile(file) {
        if (window.MediaUI && window.MediaUI.clearError) {
            window.MediaUI.clearError(settingsSection);
            window.MediaUI.clearError(uploadDropzone);
        }

        if (currentConvertedBlob) currentConvertedBlob = null;
        if (currentBlob) currentBlob = null;
        currentVideoMetadata = null;

        if (audioInputPreview && audioInputPreview.src && audioInputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioInputPreview.src);
            audioInputPreview.src = '';
        }
        if (audioOutputPreview && audioOutputPreview.src && audioOutputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioOutputPreview.src);
            audioOutputPreview.src = '';
        }
        if (videoInputPreview && videoInputPreview.src && videoInputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoInputPreview.src);
            videoInputPreview.src = '';
        }
        if (videoOutputPreview && videoOutputPreview.src && videoOutputPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoOutputPreview.src);
            videoOutputPreview.src = '';
        }

        const mediaType = (window.MediaUI && window.MediaUI.detectMediaType)
            ? window.MediaUI.detectMediaType(file)
            : (file.type.startsWith('audio/') ? 'audio' : (file.type.startsWith('video/') ? 'video' : 'image'));

        if (mediaType !== 'image' && mediaType !== 'audio' && mediaType !== 'video') {
            const errMsg = window.tMedia ? window.tMedia('unsupportedFileType') : 'This file type is not supported here. Please select an image, audio or video file.';
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

        // Audio checks
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

        // Video checks
        if (mediaType === 'video') {
            // First check 0-byte or empty file
            if (!file || file.size === 0) {
                const err = window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.';
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }

            let meta = null;
            if (window.MediaUI && window.MediaUI.getVideoMetadata) {
                meta = await window.MediaUI.getVideoMetadata(file);
            }

            // Fallback probe using ffmpeg engine if browser metadata fails
            if (!meta) {
                try {
                    meta = await probeVideoWithEngine(file);
                } catch (probeErr) {
                    console.error('Video probe error:', probeErr);
                    const err = probeErr.message || (window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.');
                    window.MediaUI.showError(uploadDropzone, err);
                    return;
                }
            }

            if (!meta || !meta.width || !meta.height) {
                const err = window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.';
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }

            // Duration check: max 5 minutes (300 s)
            const maxVideoMin = window.MAX_VIDEO_MIN || 5;
            if (meta.duration > (maxVideoMin * 60)) {
                const err = window.tMedia ? window.tMedia('videoTooLong', { maxMin: maxVideoMin }) : `Video is too long. Maximum video length is ${maxVideoMin} minutes.`;
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }

            // Resolution check: long side <= 1920 AND short side <= 1080
            const longSide = Math.max(meta.width, meta.height);
            const shortSide = Math.min(meta.width, meta.height);
            if (longSide > 1920 || shortSide > 1080) {
                const err = window.tMedia ? window.tMedia('videoResolutionTooHigh') : 'Maximum video resolution is 1920x1080 (Full HD).';
                window.MediaUI.showError(uploadDropzone, err);
                return;
            }

            currentVideoMetadata = meta;
        }

        currentFile = file;
        currentMediaType = mediaType;
        const ext = file.name.split('.').pop().toUpperCase();
        originalFormatEl.textContent = ext || (mediaType === 'audio' ? 'AUDIO' : (mediaType === 'video' ? 'VIDEO' : 'IMAGE'));

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
        } else if (mediaType === 'video') {
            setupVideoUI();
            uploadHero.style.display = 'none';
            settingsSection.style.display = 'block';
            if (videoInputPreview) {
                videoInputPreview.src = URL.createObjectURL(file);
            }
        }
    }

    async function probeVideoWithEngine(file) {
        if (progressComponent) {
            progressComponent.show(window.tMedia ? window.tMedia('engineDownloading') : 'Downloading the conversion engine (first time only, about 31 MB)...');
            progressComponent.update(0);
        }

        const throttledProbeProgress = throttle((p) => {
            if (progressComponent) {
                progressComponent.update(p, window.tMedia ? window.tMedia('engineDownloading') : 'Downloading the conversion engine (first time only, about 31 MB)...');
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

    function setupImageUI() {
        if (imagePreview) imagePreview.style.display = 'block';
        if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
        if (videoPreviewContainer) videoPreviewContainer.style.display = 'none';
        if (bitrateField) bitrateField.style.display = 'none';
        if (videoQualityField) videoQualityField.style.display = 'none';
        if (reduce720pField) reduce720pField.style.display = 'none';
        if (bitrateSelect) bitrateSelect.disabled = false;

        if (targetFileSizeField) {
            targetFileSizeField.style.display = 'block';
            if (targetFileSize) targetFileSize.disabled = false;
            if (targetFileSizeUnit) targetFileSizeUnit.disabled = false;
        }
        if (targetSizeNotice) targetSizeNotice.style.display = 'none';
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
        if (videoPreviewContainer) videoPreviewContainer.style.display = 'none';
        if (videoQualityField) videoQualityField.style.display = 'none';
        if (reduce720pField) reduce720pField.style.display = 'none';
        if (audioOutputWrapper) audioOutputWrapper.style.display = 'none';

        formatSelect.innerHTML = `
            <option value="audio/mpeg" selected>MP3 (.mp3)</option>
            <option value="audio/wav">WAV (.wav)</option>
        `;

        updateAudioFieldVisibility();
    }

    function setupVideoUI() {
        if (imagePreview) imagePreview.style.display = 'none';
        if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
        if (bitrateField) bitrateField.style.display = 'none';

        if (videoPreviewContainer) videoPreviewContainer.style.display = 'block';
        if (videoOutputWrapper) videoOutputWrapper.style.display = 'none';
        if (videoQualityField) {
            videoQualityField.style.display = 'block';
            if (videoQualitySelect) videoQualitySelect.value = 'medium';
        }

        // Reduce to 720p checkbox: shown ONLY when source height > 720 (or width > 1280)
        if (reduce720pField) {
            const needs720 = currentVideoMetadata && (currentVideoMetadata.height > 720 || currentVideoMetadata.width > 1280);
            reduce720pField.style.display = needs720 ? 'block' : 'none';
            if (reduce720pCheckbox) reduce720pCheckbox.checked = true;
            if (fullResolutionNotice) fullResolutionNotice.style.display = 'none';
        }

        formatSelect.innerHTML = `
            <option value="video/mp4" selected>MP4 (.mp4)</option>
            <option value="video/webm">WebM (.webm)</option>
        `;

        targetFormatEl.textContent = 'MP4';
        convertedSizeEl.textContent = '0 KB';

        // Target File Size field disabled in video mode with translated hint
        if (targetFileSizeField) {
            targetFileSizeField.style.display = 'block';
            if (targetFileSize) targetFileSize.disabled = true;
            if (targetFileSizeUnit) targetFileSizeUnit.disabled = true;
        }
        if (targetSizeNotice) {
            targetSizeNotice.textContent = window.tMedia
                ? window.tMedia('videoNoTargetSize')
                : 'Target file size cannot be set for video. Use the video quality setting to control size.';
            targetSizeNotice.style.color = '#b45309';
            targetSizeNotice.style.display = 'block';
        }

        if (downloadBtn) {
            downloadBtn.textContent = window.tMedia ? window.tMedia('convertVideo') : 'Convert Video';
            downloadBtn.style.display = 'block';
        }
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

    function onVideoSettingChanged() {
        if (currentMediaType !== 'video') return;
        targetFormatEl.textContent = formatSelect.value === 'video/webm' ? 'WEBM' : 'MP4';
        if (currentConvertedBlob) {
            currentConvertedBlob = null;
            if (currentBlob) currentBlob = null;
            if (videoOutputWrapper) videoOutputWrapper.style.display = 'none';
            if (videoOutputPreview && videoOutputPreview.src && videoOutputPreview.src.startsWith('blob:')) {
                URL.revokeObjectURL(videoOutputPreview.src);
                videoOutputPreview.src = '';
            }
            convertedSizeEl.textContent = '0 KB';
            if (downloadBtn) {
                downloadBtn.textContent = window.tMedia ? window.tMedia('convertVideo') : 'Convert Video';
            }
        }
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

    function computeTargetBitrate(targetBytes, durationSec) {
        if (window.MediaUI && window.MediaUI.computeTargetBitrate) {
            return window.MediaUI.computeTargetBitrate(targetBytes, durationSec);
        }
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

                if (audioOutputPreview) {
                    if (audioOutputPreview.src && audioOutputPreview.src.startsWith('blob:')) {
                        URL.revokeObjectURL(audioOutputPreview.src);
                    }
                    audioOutputPreview.src = URL.createObjectURL(blob);
                    if (audioOutputWrapper) audioOutputWrapper.style.display = 'block';
                }

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

    // --- Video Conversion Implementation ---

    async function startVideoConversion() {
        if (!currentFile || currentMediaType !== 'video' || isConvertingVideo) return;

        if (window.MediaUI && window.MediaUI.clearError) {
            window.MediaUI.clearError(settingsSection);
        }

        activeConversionSeq++;
        const seq = activeConversionSeq;
        isConvertingVideo = true;

        if (window.MediaUI && window.MediaUI.requestWakeLock) {
            await window.MediaUI.requestWakeLock();
        }

        const isWebm = formatSelect.value === 'video/webm';
        const outExt = isWebm ? '.webm' : '.mp4';
        targetFormatEl.textContent = isWebm ? 'WEBM' : 'MP4';

        if (progressComponent) {
            progressComponent.show(window.tMedia ? window.tMedia('engineDownloading') : 'Downloading the conversion engine (first time only, about 31 MB)...');
            progressComponent.update(0);
        }

        const throttledDownloadProgress = throttle((p) => {
            if (seq !== activeConversionSeq) return;
            if (progressComponent) {
                progressComponent.update(p, window.tMedia ? window.tMedia('engineDownloading') : 'Downloading the conversion engine (first time only, about 31 MB)...');
            }
        }, 150);

        const throttledConvertProgress = throttle((p) => {
            if (seq !== activeConversionSeq) return;
            if (progressComponent) {
                progressComponent.update(p, window.tMedia ? window.tMedia('convertingVideo') : 'Converting video...');
            }
        }, 150);

        let ffmpeg = null;
        let inFileName = null;
        let outFileName = null;

        try {
            ffmpeg = await ensureFFmpegLoaded(throttledDownloadProgress);
            if (seq !== activeConversionSeq) return;

            if (progressComponent) {
                progressComponent.update(0, window.tMedia ? window.tMedia('convertingVideo') : 'Converting video...');
            }

            const inExt = '.' + (currentFile.name.split('.').pop().toLowerCase() || 'mp4');
            inFileName = 'in' + inExt;
            outFileName = 'out' + outExt;

            const fileBuf = await currentFile.arrayBuffer();
            if (seq !== activeConversionSeq) return;
            await ffmpeg.writeFile(inFileName, new Uint8Array(fileBuf));

            // Probe input for audio stream existence if not known
            let hasAudio = currentVideoMetadata ? currentVideoMetadata.hasAudio : true;
            if (hasAudio === undefined) {
                const probeLogs = [];
                const probeHandler = ({ message }) => probeLogs.push(message);
                ffmpeg.on('log', probeHandler);
                try { await ffmpeg.exec(['-i', inFileName]); } catch (e) {}
                ffmpeg.off('log', probeHandler);
                hasAudio = /Stream #\d+:\d+.*?: Audio:/.test(probeLogs.join('\n'));
            }

            // Build arguments
            const args = ['-i', inFileName];

            // Scale argument if 720p reduction requested
            const is720pChecked = reduce720pField && (reduce720pField.style.display !== 'none') && reduce720pCheckbox && reduce720pCheckbox.checked;
            if (is720pChecked && currentVideoMetadata) {
                const isPortrait = currentVideoMetadata.height > currentVideoMetadata.width;
                if (isPortrait) {
                    args.push('-vf', "scale='min(720,iw)':-2");
                } else {
                    args.push('-vf', "scale=-2:'min(720,ih)'");
                }
            }

            const quality = videoQualitySelect ? videoQualitySelect.value : 'medium';

            if (!isWebm) {
                // MP4 encoding: libx264, veryfast, crf Q
                const crfMap = { high: 23, medium: 28, low: 32 };
                const q = crfMap[quality] || 28;
                args.push(
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-crf', String(q),
                    '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart'
                );
                if (hasAudio) {
                    args.push('-c:a', 'aac', '-b:a', '128k');
                } else {
                    args.push('-an');
                }
            } else {
                // WebM encoding: libvpx, realtime, cpu-used 4, -b:v B, -crf C
                const webmConfig = {
                    high: { b: '1800k', crf: '18' },
                    medium: { b: '900k', crf: '26' },
                    low: { b: '450k', crf: '36' }
                };
                const cfg = webmConfig[quality] || webmConfig.medium;
                args.push(
                    '-c:v', 'libvpx',
                    '-deadline', 'realtime',
                    '-cpu-used', '4',
                    '-b:v', cfg.b,
                    '-crf', cfg.crf
                );
                if (hasAudio) {
                    args.push('-c:a', 'libvorbis', '-b:a', '128k');
                } else {
                    args.push('-an');
                }
            }

            args.push(outFileName);

            const progressHandler = ({ progress }) => {
                if (seq !== activeConversionSeq) return;
                const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
                throttledConvertProgress(percent);
            };
            ffmpeg.on('progress', progressHandler);

            const code = await ffmpeg.exec(args);
            ffmpeg.off('log', () => {});
            ffmpeg.off('progress', progressHandler);

            if (seq !== activeConversionSeq) return;

            if (code !== 0) {
                throw new Error(window.tMedia ? window.tMedia('cannotReadVideo') : 'Video conversion failed.');
            }

            const outData = await ffmpeg.readFile(outFileName);
            if (seq !== activeConversionSeq) return;

            // Delete virtual files
            try { await ffmpeg.deleteFile(inFileName); } catch (e) {}
            try { await ffmpeg.deleteFile(outFileName); } catch (e) {}

            // Always terminate engine after conversion to free memory
            await window.FFmpegLoader.terminate();

            if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                window.MediaUI.releaseWakeLock();
            }

            isConvertingVideo = false;
            if (progressComponent) progressComponent.hide();

            const mime = isWebm ? 'video/webm' : 'video/mp4';
            const blob = new Blob([outData.buffer], { type: mime });
            currentConvertedBlob = blob;
            currentBlob = blob;

            convertedSizeEl.textContent = formatBytes(blob.size);

            if (videoOutputPreview) {
                if (videoOutputPreview.src && videoOutputPreview.src.startsWith('blob:')) {
                    URL.revokeObjectURL(videoOutputPreview.src);
                }
                videoOutputPreview.src = URL.createObjectURL(blob);
                if (videoOutputWrapper) videoOutputWrapper.style.display = 'block';
            }

            if (downloadBtn) {
                downloadBtn.textContent = window.tMedia ? window.tMedia('downloadConvertedVideo') : 'Download Converted Video';
                downloadBtn.style.display = 'block';
            }
        } catch (err) {
            console.error('Video conversion error:', err);
            if (seq === activeConversionSeq) {
                isConvertingVideo = false;
                if (window.FFmpegLoader) {
                    try { await window.FFmpegLoader.terminate(); } catch (e) {}
                }
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) progressComponent.hide();

                const errMsg = err.message || (window.tMedia ? window.tMedia('cannotReadVideo') : 'Video conversion failed.');
                if (window.MediaUI && window.MediaUI.showError) {
                    window.MediaUI.showError(settingsSection, errMsg);
                }
            }
        }
    }

    function cancelVideoConversion() {
        activeConversionSeq++;
        isConvertingVideo = false;

        if (window.FFmpegLoader) {
            try { window.FFmpegLoader.terminate(); } catch (e) {}
        }

        if (window.MediaUI && window.MediaUI.releaseWakeLock) {
            window.MediaUI.releaseWakeLock();
        }

        if (progressComponent) {
            progressComponent.update(0, window.tMedia ? window.tMedia('conversionCancelled') : 'Conversion cancelled.');
            setTimeout(() => progressComponent.hide(), 1000);
        }

        if (downloadBtn) {
            downloadBtn.textContent = window.tMedia ? window.tMedia('convertVideo') : 'Convert Video';
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
        } else if (currentMediaType === 'video') {
            onVideoSettingChanged();
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

    if (videoQualitySelect) {
        videoQualitySelect.addEventListener('change', onVideoSettingChanged);
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
            if (currentMediaType === 'video') {
                if (currentConvertedBlob) {
                    // Result exists: download converted video
                    const isWebm = formatSelect.value === 'video/webm';
                    const ext = isWebm ? '.webm' : '.mp4';
                    const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'converted-video';
                    const fileName = originalName + '-converted' + ext;

                    if (window.MediaUI && window.MediaUI.triggerDownload) {
                        window.MediaUI.triggerDownload(currentConvertedBlob, fileName);
                    } else {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(currentConvertedBlob);
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                } else {
                    // No result yet: trigger video conversion
                    startVideoConversion();
                }
                return;
            }

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
