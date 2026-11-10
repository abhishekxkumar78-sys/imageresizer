document.addEventListener('DOMContentLoaded', () => {
    const uploadHero = document.getElementById('uploadHero');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.getElementById('settingsSection');
    const imagePreview = document.getElementById('imagePreview');

    const formatSelect = document.getElementById('formatSelect');
    const formatLabel = document.getElementById('formatLabel');
    const jpegOption = document.getElementById('jpegOption');
    const webpOption = document.getElementById('webpOption');
    const pngOption = document.getElementById('pngOption');

    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const originalSizeEl = document.getElementById('originalSize');
    const compressedSizeEl = document.getElementById('compressedSize');
    const savedPercentageEl = document.getElementById('savedPercentage');
    const downloadBtn = document.getElementById('downloadBtn');

    // PDF Elements
    const pdfCompressPreviewCard = document.getElementById('pdfCompressPreviewCard');
    const removePdfBtn = document.getElementById('removePdfBtn');
    const pdfFileName = document.getElementById('pdfFileName');
    const pdfPageBadge = document.getElementById('pdfPageBadge');
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    const pdfPreviewFootnote = document.getElementById('pdfPreviewFootnote');
    const pdfHonestNotice = document.getElementById('pdfHonestNotice');
    const pdfLargeNotice = document.getElementById('pdfLargeNotice');

    const targetFileSize = document.getElementById('targetFileSize');
    const targetFileSizeUnit = document.getElementById('targetFileSizeUnit');

    // Pin pdf.js worker URL
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const PREVIEW_PAGE_LIMIT = 4;

    let currentFile = null;
    let currentFileType = 'image';
    let imgElement = null;
    let currentBlob = null;

    let originalPdfBytes = null;
    let pdfPageCount = 0;
    let cachedPreviewPages = []; // [{ pageNum, canvas, unscaledWidth, unscaledHeight, readoutEl }]
    let pdfCompressSeq = 0;

    // Audio State
    let currentAudioBuffer = null;
    let currentCompressedAudioBlob = null;
    let audioWorker = null;
    let isConvertingAudio = false;
    let audioCompressionSeq = 0;

    let audioPreviewContainer = null;
    let audioInputPreview = null;
    let audioOutputWrapper = null;
    let audioOutputPreview = null;
    let bitrateField = null;
    let audioBitrateSelect = null;
    let monoField = null;
    let monoCheckbox = null;
    let targetSizeNotice = null;
    let progressContainer = null;
    let progressComponent = null;

    // Video State
    let currentVideoMetadata = null;
    let currentCompressedVideoBlob = null;
    let isCompressingVideo = false;
    let videoCompressionSeq = 0;

    let videoPreviewContainer = null;
    let videoInputPreview = null;
    let videoOutputWrapper = null;
    let videoOutputPreview = null;
    let videoCompressionLevelField = null;
    let videoCompressionLevel = null;
    let reduce720pField = null;
    let reduce720pCheckbox = null;
    let fullResolutionNotice = null;
    let videoNotSmallerNotice = null;

    // Trigger file dialog
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

    function isPdf(file) {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateFormatDropdown(mode) {
        if (mode === 'pdf') {
            if (formatLabel) formatLabel.textContent = 'Page Image Format';
            if (pngOption) {
                pngOption.style.display = 'none';
                pngOption.disabled = true;
            }
            if (webpOption) {
                webpOption.style.display = 'none';
                webpOption.disabled = true;
            }
            if (jpegOption) {
                jpegOption.style.display = '';
                jpegOption.disabled = false;
                jpegOption.textContent = 'JPEG';
            }
            if (formatSelect) {
                formatSelect.value = 'image/jpeg';
            }
        } else {
            if (formatLabel) formatLabel.textContent = 'Target Format';
            if (pngOption) {
                pngOption.style.display = '';
                pngOption.disabled = false;
            }
            if (webpOption) {
                webpOption.style.display = '';
                webpOption.disabled = false;
                webpOption.textContent = 'WebP (.webp - Recommended)';
            }
            if (jpegOption) {
                jpegOption.style.display = '';
                jpegOption.disabled = false;
                jpegOption.textContent = 'JPEG (.jpg)';
            }
        }
    }

    function ensureAudioElements() {
        if (!audioPreviewContainer && imagePreview) {
            const previewBox = imagePreview.parentNode;
            if (previewBox) {
                audioPreviewContainer = document.getElementById('audioPreviewContainer');
                if (!audioPreviewContainer) {
                    audioPreviewContainer = document.createElement('div');
                    audioPreviewContainer.id = 'audioPreviewContainer';
                    audioPreviewContainer.className = 'media-preview-box';
                    audioPreviewContainer.style.display = 'none';
                    audioPreviewContainer.innerHTML = `
                        <div class="media-audio-player-wrapper">
                            <div class="media-audio-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>
                            </div>
                            <div id="audioInputWrapper" style="width:100%; text-align:left;">
                                <span id="audioInputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('originalAudio') : 'Original Audio'}</span>
                                <audio id="audioInputPreview" class="media-audio-element" controls style="width:100%;"></audio>
                            </div>
                            <div id="audioOutputWrapper" style="display:none; width:100%; text-align:left; margin-top:12px;">
                                <span id="audioOutputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('compressedAudio') : 'Compressed Audio'}</span>
                                <audio id="audioOutputPreview" class="media-audio-element" controls style="width:100%;"></audio>
                            </div>
                        </div>
                    `;
                    previewBox.appendChild(audioPreviewContainer);
                }
                audioInputPreview = audioPreviewContainer.querySelector('#audioInputPreview');
                audioOutputWrapper = audioPreviewContainer.querySelector('#audioOutputWrapper');
                audioOutputPreview = audioPreviewContainer.querySelector('#audioOutputPreview');
            }
        }

        // Bitrate select
        if (!bitrateField && formatSelect) {
            const formatField = formatSelect.closest('.setting-field');
            if (formatField) {
                bitrateField = document.getElementById('bitrateField');
                if (!bitrateField) {
                    bitrateField = document.createElement('div');
                    bitrateField.id = 'bitrateField';
                    bitrateField.className = 'setting-field';
                    bitrateField.style.display = 'none';
                    bitrateField.style.marginBottom = '20px';
                    bitrateField.innerHTML = `
                        <label id="bitrateLabel" class="setting-label" style="display:block; font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">${window.tMedia ? window.tMedia('audioBitrate') : 'Audio Bitrate'}</label>
                        <select id="audioBitrateSelect" class="setting-select" style="width:100%; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border); font-family:inherit; font-size:14px; background:var(--bg-light); color:var(--text-primary);">
                            <option value="192">192 kbps</option>
                            <option value="160">160 kbps</option>
                            <option value="128">128 kbps</option>
                            <option value="112">112 kbps</option>
                            <option value="96" selected>96 kbps</option>
                            <option value="80">80 kbps</option>
                            <option value="64">64 kbps</option>
                            <option value="56">56 kbps</option>
                            <option value="48">48 kbps</option>
                            <option value="40">40 kbps</option>
                            <option value="32">32 kbps</option>
                        </select>
                    `;
                    formatField.parentNode.insertBefore(bitrateField, formatField.nextSibling);
                }
                audioBitrateSelect = bitrateField.querySelector('#audioBitrateSelect');
                if (audioBitrateSelect) {
                    audioBitrateSelect.addEventListener('change', () => {
                        if (currentFileType === 'audio') {
                            processAudioCompression();
                        }
                    });
                }
            }
        }

        // Mono checkbox
        if (!monoField && bitrateField) {
            monoField = document.getElementById('monoField');
            if (!monoField) {
                monoField = document.createElement('div');
                monoField.id = 'monoField';
                monoField.className = 'media-checkbox-field';
                monoField.style.display = 'none';
                monoField.style.marginBottom = '20px';
                monoField.innerHTML = `
                    <input type="checkbox" id="monoCheckbox" class="media-checkbox-input">
                    <label for="monoCheckbox" id="monoLabel" class="media-checkbox-label">${window.tMedia ? window.tMedia('mixDownToMono') : 'Mix down to mono'}</label>
                `;
                bitrateField.parentNode.insertBefore(monoField, bitrateField.nextSibling);
            }
            monoCheckbox = monoField.querySelector('#monoCheckbox');
            if (monoCheckbox) {
                monoCheckbox.addEventListener('change', () => {
                    if (currentFileType === 'audio') {
                        processAudioCompression();
                    }
                });
            }
        }

        // Target size notice
        if (!targetSizeNotice && targetFileSize) {
            const targetField = targetFileSize.closest('.setting-field');
            if (targetField) {
                targetSizeNotice = targetField.querySelector('#targetSizeNotice');
                if (!targetSizeNotice) {
                    targetSizeNotice = document.createElement('p');
                    targetSizeNotice.id = 'targetSizeNotice';
                    targetSizeNotice.className = 'media-note';
                    targetSizeNotice.style.display = 'none';
                    targetField.appendChild(targetSizeNotice);
                }
            }
        }

        // Progress component
        if (!progressContainer && downloadBtn) {
            progressContainer = document.getElementById('conversionProgressContainer');
            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.id = 'conversionProgressContainer';
                downloadBtn.parentNode.insertBefore(progressContainer, downloadBtn);
            }
            if (!progressComponent && window.MediaUI && window.MediaUI.createProgressComponent) {
                progressComponent = window.MediaUI.createProgressComponent(progressContainer, () => {
                    if (currentFileType === 'video') {
                        cancelVideoCompression();
                        return;
                    }
                    audioCompressionSeq++;
                    if (audioWorker) {
                        try { audioWorker.postMessage({ command: 'cancel' }); } catch (e) {}
                        audioWorker.terminate();
                        audioWorker = null;
                    }
                    currentAudioBuffer = null;
                    currentCompressedAudioBlob = null;
                    isConvertingAudio = false;
                    if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                        window.MediaUI.releaseWakeLock();
                    }
                    if (progressComponent) progressComponent.hide();
                    if (downloadBtn) {
                        downloadBtn.disabled = false;
                        downloadBtn.textContent = window.tMedia ? window.tMedia('downloadCompressedAudio') : 'Download Compressed Audio';
                    }
                });
            }
        }
    }

    function ensureVideoElements() {
        if (!videoPreviewContainer && imagePreview) {
            const previewBox = imagePreview.parentNode;
            if (previewBox) {
                videoPreviewContainer = document.getElementById('videoPreviewContainer');
                if (!videoPreviewContainer) {
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
                                <span id="videoOutputLabel" style="display:block; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:6px;">${window.tMedia ? window.tMedia('compressedVideo') : 'Compressed Video'}</span>
                                <video id="videoOutputPreview" class="media-video-preview" controls preload="metadata"></video>
                            </div>
                        </div>
                    `;
                    previewBox.appendChild(videoPreviewContainer);
                }
                videoInputPreview = videoPreviewContainer.querySelector('#videoInputPreview');
                videoOutputWrapper = videoPreviewContainer.querySelector('#videoOutputWrapper');
                videoOutputPreview = videoPreviewContainer.querySelector('#videoOutputPreview');
            }
        }

        if (!videoCompressionLevelField && formatSelect) {
            const formatField = formatSelect.closest('.setting-field');
            if (formatField) {
                videoCompressionLevelField = document.getElementById('videoCompressionLevelField');
                if (!videoCompressionLevelField) {
                    videoCompressionLevelField = document.createElement('div');
                    videoCompressionLevelField.id = 'videoCompressionLevelField';
                    videoCompressionLevelField.className = 'setting-field';
                    videoCompressionLevelField.style.display = 'none';
                    videoCompressionLevelField.style.marginBottom = '20px';
                    videoCompressionLevelField.innerHTML = `
                        <label id="compressionLevelLabel" for="videoCompressionLevel" class="setting-label" style="display:block; font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">${window.tMedia ? window.tMedia('compressionLevel') : 'Compression level'}</label>
                        <select id="videoCompressionLevel" class="setting-select" style="width:100%; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border); font-family:inherit; font-size:14px; background:var(--bg-light); color:var(--text-primary);">
                            <option value="light">${window.tMedia ? window.tMedia('levelLight') : 'Light (best quality)'}</option>
                            <option value="balanced" selected>${window.tMedia ? window.tMedia('levelBalanced') : 'Balanced (recommended)'}</option>
                            <option value="strong">${window.tMedia ? window.tMedia('levelStrong') : 'Strong (smallest file)'}</option>
                        </select>
                    `;
                    formatField.parentNode.insertBefore(videoCompressionLevelField, formatField.nextSibling);
                }
                videoCompressionLevel = videoCompressionLevelField.querySelector('#videoCompressionLevel');
                if (videoCompressionLevel) {
                    videoCompressionLevel.addEventListener('change', () => {
                        if (currentFileType === 'video') {
                            currentCompressedVideoBlob = null;
                            if (downloadBtn) downloadBtn.textContent = window.tMedia ? window.tMedia('compressVideo') : 'Compress Video';
                            if (videoOutputWrapper) videoOutputWrapper.style.display = 'none';
                            if (videoNotSmallerNotice) videoNotSmallerNotice.style.display = 'none';
                            if (compressedSizeEl) compressedSizeEl.textContent = '0 KB';
                            if (savedPercentageEl) {
                                savedPercentageEl.textContent = '0% Saved';
                                savedPercentageEl.style.background = '#10b981';
                            }
                        }
                    });
                }
            }
        }

        if (!reduce720pField && videoCompressionLevelField) {
            reduce720pField = document.getElementById('reduce720pField');
            if (!reduce720pField) {
                reduce720pField = document.createElement('div');
                reduce720pField.id = 'reduce720pField';
                reduce720pField.className = 'media-checkbox-field';
                reduce720pField.style.display = 'none';
                reduce720pField.style.marginBottom = '20px';
                reduce720pField.innerHTML = `
                    <input type="checkbox" id="reduce720pCheckbox" class="media-checkbox-input" checked>
                    <label for="reduce720pCheckbox" id="reduce720pLabel" class="media-checkbox-label">${window.tMedia ? window.tMedia('reduce720p') : 'Reduce to 720p (faster, uses less memory)'}</label>
                    <p id="fullResolutionNotice" class="media-note" style="display:none; color:#b45309; margin-top:8px; width:100%;">${window.tMedia ? window.tMedia('fullResolutionNotice') : 'Full resolution is limited to 60 seconds. Keep 720p for longer videos.'}</p>
                `;
                videoCompressionLevelField.parentNode.insertBefore(reduce720pField, videoCompressionLevelField.nextSibling);
            }
            reduce720pCheckbox = reduce720pField.querySelector('#reduce720pCheckbox');
            fullResolutionNotice = reduce720pField.querySelector('#fullResolutionNotice');
            if (reduce720pCheckbox) {
                reduce720pCheckbox.addEventListener('change', () => {
                    if (!reduce720pCheckbox.checked && currentVideoMetadata && currentVideoMetadata.duration > 60) {
                        reduce720pCheckbox.checked = true;
                        if (fullResolutionNotice) fullResolutionNotice.style.display = 'block';
                    } else {
                        if (fullResolutionNotice) fullResolutionNotice.style.display = 'none';
                    }
                    if (currentFileType === 'video') {
                        currentCompressedVideoBlob = null;
                        if (downloadBtn) downloadBtn.textContent = window.tMedia ? window.tMedia('compressVideo') : 'Compress Video';
                        if (videoOutputWrapper) videoOutputWrapper.style.display = 'none';
                        if (videoNotSmallerNotice) videoNotSmallerNotice.style.display = 'none';
                        if (compressedSizeEl) compressedSizeEl.textContent = '0 KB';
                        if (savedPercentageEl) {
                            savedPercentageEl.textContent = '0% Saved';
                            savedPercentageEl.style.background = '#10b981';
                        }
                    }
                });
            }
        }

        if (!videoNotSmallerNotice && originalSizeEl) {
            const badgeWrapper = originalSizeEl.closest('div[style*="display:flex"]');
            if (badgeWrapper && badgeWrapper.parentNode) {
                videoNotSmallerNotice = document.getElementById('videoNotSmallerNotice');
                if (!videoNotSmallerNotice) {
                    videoNotSmallerNotice = document.createElement('div');
                    videoNotSmallerNotice.id = 'videoNotSmallerNotice';
                    videoNotSmallerNotice.className = 'media-note';
                    videoNotSmallerNotice.style.display = 'none';
                    videoNotSmallerNotice.style.color = '#b45309';
                    videoNotSmallerNotice.style.background = 'rgba(245, 158, 11, 0.1)';
                    videoNotSmallerNotice.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                    videoNotSmallerNotice.style.padding = '10px 14px';
                    videoNotSmallerNotice.style.borderRadius = 'var(--radius-md)';
                    videoNotSmallerNotice.style.marginBottom = '16px';
                    badgeWrapper.parentNode.insertBefore(videoNotSmallerNotice, badgeWrapper.nextSibling);
                }
            }
        }
    }

    async function processVideoCompression() {
        if (!currentFile || currentFileType !== 'video') return;
        videoCompressionSeq++;
        const seq = videoCompressionSeq;
        isCompressingVideo = true;

        if (downloadBtn) {
            downloadBtn.disabled = true;
        }
        if (videoNotSmallerNotice) videoNotSmallerNotice.style.display = 'none';

        const level = videoCompressionLevel ? videoCompressionLevel.value : 'balanced';
        const is720pChecked = reduce720pField && (reduce720pField.style.display !== 'none') && reduce720pCheckbox && reduce720pCheckbox.checked;

        try {
            const result = await window.MediaVideo.compressVideo({
                file: currentFile,
                metadata: currentVideoMetadata,
                compressionLevel: level,
                reduce720p: is720pChecked,
                progressComponent: progressComponent,
                signal: {
                    get cancelled() { return seq !== videoCompressionSeq; }
                }
            });

            if (seq !== videoCompressionSeq) return;

            isCompressingVideo = false;
            currentCompressedVideoBlob = result.blob;
            currentBlob = result.blob;

            if (compressedSizeEl) compressedSizeEl.textContent = formatBytes(result.size);

            const origBytes = currentFile.size;
            const newBytes = result.size;
            const saved = Math.round(((origBytes - newBytes) / origBytes) * 100);
            if (savedPercentageEl) {
                if (saved >= 0) {
                    savedPercentageEl.textContent = saved + '% Saved';
                    savedPercentageEl.style.background = '#10b981';
                } else {
                    savedPercentageEl.textContent = Math.abs(saved) + '% Larger';
                    savedPercentageEl.style.background = '#6b7280';
                }
            }

            if (newBytes >= origBytes && videoNotSmallerNotice) {
                videoNotSmallerNotice.textContent = window.tMedia
                    ? window.tMedia('videoNotSmaller')
                    : 'This video is already well compressed, so the result is not smaller. Try a stronger compression level.';
                videoNotSmallerNotice.style.display = 'block';
            } else if (videoNotSmallerNotice) {
                videoNotSmallerNotice.style.display = 'none';
            }

            if (videoOutputPreview) {
                if (videoOutputPreview.src && videoOutputPreview.src.startsWith('blob:')) {
                    URL.revokeObjectURL(videoOutputPreview.src);
                }
                videoOutputPreview.src = URL.createObjectURL(result.blob);
                if (videoOutputWrapper) videoOutputWrapper.style.display = 'block';
            }

            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = window.tMedia ? window.tMedia('downloadCompressedVideo') : 'Download Compressed Video';
            }
        } catch (err) {
            console.error('Video compression error:', err);
            if (seq === videoCompressionSeq) {
                isCompressingVideo = false;
                if (downloadBtn) {
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = window.tMedia ? window.tMedia('compressVideo') : 'Compress Video';
                }
                if (progressComponent) progressComponent.hide();
                if (err.message !== 'Cancelled') {
                    const msg = err.message || (window.tMedia ? window.tMedia('cannotReadVideo') : 'Video compression failed.');
                    if (window.MediaUI && window.MediaUI.showError) {
                        window.MediaUI.showError(settingsSection, msg);
                    }
                }
            }
        }
    }

    function cancelVideoCompression() {
        videoCompressionSeq++;
        isCompressingVideo = false;

        if (window.FFmpegLoader) {
            try { window.FFmpegLoader.terminate(); } catch (e) {}
        }
        if (window.MediaVideo && window.MediaVideo.cancel) {
            window.MediaVideo.cancel();
        }

        if (progressComponent) {
            progressComponent.update(0, window.tMedia ? window.tMedia('conversionCancelled') : 'Conversion cancelled.');
            setTimeout(() => progressComponent.hide(), 1000);
        }

        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = window.tMedia ? window.tMedia('compressVideo') : 'Compress Video';
        }
    }

    function setUIMode(mode) {
        uploadHero.style.display = 'none';
        settingsSection.style.display = 'block';
        ensureAudioElements();
        ensureVideoElements();

        const formatField = formatSelect ? formatSelect.closest('.setting-field') : null;
        const qualityField = qualitySlider ? qualitySlider.closest('.setting-field') : null;
        const targetFileSizeField = targetFileSize ? targetFileSize.closest('.setting-field') : null;

        // Reset target file size disabled state
        if (targetFileSize) targetFileSize.disabled = false;
        if (targetFileSizeUnit) targetFileSizeUnit.disabled = false;
        if (targetSizeNotice) targetSizeNotice.style.display = 'none';
        if (videoNotSmallerNotice) videoNotSmallerNotice.style.display = 'none';

        if (mode === 'video') {
            if (imagePreview) imagePreview.style.display = 'none';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'none';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
            if (videoPreviewContainer) videoPreviewContainer.style.display = 'block';

            if (formatField) formatField.style.display = 'none';
            if (qualityField) qualityField.style.display = 'none';
            if (bitrateField) bitrateField.style.display = 'none';
            if (monoField) monoField.style.display = 'none';

            if (videoCompressionLevelField) videoCompressionLevelField.style.display = 'block';
            if (videoCompressionLevel) videoCompressionLevel.value = 'balanced';

            if (reduce720pField) {
                const needs720 = currentVideoMetadata && (currentVideoMetadata.height > 720 || currentVideoMetadata.width > 1280);
                reduce720pField.style.display = needs720 ? 'flex' : 'none';
                if (reduce720pCheckbox) reduce720pCheckbox.checked = true;
                if (fullResolutionNotice) fullResolutionNotice.style.display = 'none';
            }

            if (videoOutputWrapper) videoOutputWrapper.style.display = 'none';

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
                downloadBtn.disabled = false;
                downloadBtn.textContent = window.tMedia ? window.tMedia('compressVideo') : 'Compress Video';
            }
        } else if (mode === 'audio') {
            if (videoPreviewContainer) videoPreviewContainer.style.display = 'none';
            if (videoCompressionLevelField) videoCompressionLevelField.style.display = 'none';
            if (reduce720pField) reduce720pField.style.display = 'none';

            if (imagePreview) imagePreview.style.display = 'none';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'none';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            if (audioPreviewContainer) audioPreviewContainer.style.display = 'block';

            if (formatField) formatField.style.display = 'none';
            if (qualityField) qualityField.style.display = 'none';
            if (bitrateField) bitrateField.style.display = 'block';
            if (monoField) {
                monoField.style.display = 'flex';
                const monoLabel = monoField.querySelector('#monoLabel');
                if (monoLabel) monoLabel.textContent = window.tMedia ? window.tMedia('mixDownToMono') : 'Mix down to mono';
            }

            if (downloadBtn) downloadBtn.textContent = window.tMedia ? window.tMedia('downloadCompressedAudio') : 'Download Compressed Audio';
        } else if (mode === 'pdf') {
            if (videoPreviewContainer) videoPreviewContainer.style.display = 'none';
            if (videoCompressionLevelField) videoCompressionLevelField.style.display = 'none';
            if (reduce720pField) reduce720pField.style.display = 'none';

            if (imagePreview) imagePreview.style.display = 'none';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'flex';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'block';
            if (pdfLargeNotice) {
                pdfLargeNotice.style.display = pdfPageCount > 50 ? 'block' : 'none';
            }
            if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
            if (formatField) formatField.style.display = 'block';
            if (qualityField) qualityField.style.display = 'block';
            if (bitrateField) bitrateField.style.display = 'none';
            if (monoField) monoField.style.display = 'none';

            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Compressed PDF';
            }
            if (pdfFileName) pdfFileName.textContent = currentFile ? currentFile.name : 'Document.pdf';
            if (pdfPageBadge) pdfPageBadge.textContent = `${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}`;
            updateFormatDropdown('pdf');
        } else {
            if (videoPreviewContainer) videoPreviewContainer.style.display = 'none';
            if (videoCompressionLevelField) videoCompressionLevelField.style.display = 'none';
            if (reduce720pField) reduce720pField.style.display = 'none';

            if (imagePreview) imagePreview.style.display = 'block';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'none';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            if (audioPreviewContainer) audioPreviewContainer.style.display = 'none';
            if (formatField) formatField.style.display = 'block';
            if (qualityField) qualityField.style.display = 'block';
            if (bitrateField) bitrateField.style.display = 'none';
            if (monoField) monoField.style.display = 'none';

            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Compressed Image';
            }
            updateFormatDropdown('image');
        }
    }

    async function handleFile(file) {
        if (!file) return;

        audioCompressionSeq++;
        if (audioWorker) {
            try { audioWorker.postMessage({ command: 'cancel' }); } catch (e) {}
            audioWorker.terminate();
            audioWorker = null;
        }
        isConvertingAudio = false;

        videoCompressionSeq++;
        if (isCompressingVideo) {
            cancelVideoCompression();
        }
        isCompressingVideo = false;

        if (window.MediaUI && window.MediaUI.releaseWakeLock) {
            window.MediaUI.releaseWakeLock();
        }
        if (progressComponent) progressComponent.hide();

        if (downloadBtn) downloadBtn.disabled = false;

        if (window.MediaUI && window.MediaUI.clearError) {
            window.MediaUI.clearError();
        }

        const isPdfFile = isPdf(file);
        const isImgFile = file.type.startsWith('image/');
        const mediaType = (window.MediaUI && window.MediaUI.detectMediaType)
            ? window.MediaUI.detectMediaType(file)
            : (isPdfFile ? 'pdf' : (isImgFile ? 'image' : (file.type.startsWith('audio/') ? 'audio' : (file.type.startsWith('video/') ? 'video' : 'unknown'))));

        const isAudioFile = (mediaType === 'audio') || (!isPdfFile && !isImgFile && file.type.startsWith('audio/'));
        const isVideoFile = (mediaType === 'video') || (!isPdfFile && !isImgFile && !isAudioFile && (file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name || '')));

        if (!isPdfFile && !isImgFile && !isAudioFile && !isVideoFile) {
            const hasPdf = !!window.PDFLib;
            const key = hasPdf ? 'unsupportedFileTypeWithPdf' : 'unsupportedFileType';
            const errMsg = window.tMedia ? window.tMedia(key) : (hasPdf ? 'This file type is not supported here. Please select an image, PDF, audio or video file.' : 'This file type is not supported here. Please select an image, audio or video file.');
            if (window.MediaUI && window.MediaUI.showError) {
                window.MediaUI.showError(uploadDropzone, errMsg);
            }
            return;
        }

        // Check if PDF on localized page
        if (isPdfFile && (!window.PDFLib || !window.pdfjsLib)) {
            const errMsg = window.tMedia ? window.tMedia('unsupportedFileType') : 'PDF compression is only supported on the English page.';
            if (window.MediaUI && window.MediaUI.showError) {
                window.MediaUI.showError(uploadDropzone, errMsg);
            }
            return;
        }

        // Video pre-flight checks
        if (isVideoFile) {
            if (window.MediaUI && window.MediaUI.checkFileSizeLimit) {
                const sizeCheck = window.MediaUI.checkFileSizeLimit(file, 'video');
                if (!sizeCheck.ok) {
                    if (window.MediaUI.showError) {
                        window.MediaUI.showError(uploadDropzone, sizeCheck.error);
                    }
                    return;
                }
            } else if (file.size > 100 * 1024 * 1024) {
                if (window.MediaUI && window.MediaUI.showError) {
                    window.MediaUI.showError(uploadDropzone, window.tMedia ? window.tMedia('fileTooLargeVideo') : 'File is too large. Maximum video size is 100MB.');
                }
                return;
            }

            let meta = null;
            try {
                if (!window.MediaVideo || !window.MediaVideo.probeVideo) {
                    throw new Error('Video processing library is not loaded.');
                }
                meta = await window.MediaVideo.probeVideo(file, progressComponent);
            } catch (probeErr) {
                console.error('Video probe error:', probeErr);
                const err = probeErr.message || (window.tMedia ? window.tMedia('cannotReadVideo') : 'Could not read this video file. The format may not be supported.');
                if (window.MediaUI && window.MediaUI.showError) {
                    window.MediaUI.showError(uploadDropzone, err);
                }
                return;
            }

            currentFile = file;
            currentFileType = 'video';
            currentVideoMetadata = meta;
            currentCompressedVideoBlob = null;

            setUIMode('video');

            if (videoInputPreview) {
                if (videoInputPreview.src && videoInputPreview.src.startsWith('blob:')) {
                    URL.revokeObjectURL(videoInputPreview.src);
                }
                videoInputPreview.src = URL.createObjectURL(file);
            }

            if (originalSizeEl) originalSizeEl.textContent = formatBytes(file.size);
            if (compressedSizeEl) compressedSizeEl.textContent = '0 KB';
            if (savedPercentageEl) {
                savedPercentageEl.textContent = '0% Saved';
                savedPercentageEl.style.background = '#10b981';
            }
            return;
        }

        // Check if PDF on localized page
        if (isPdfFile && (!window.PDFLib || !window.pdfjsLib)) {
            const errMsg = window.tMedia ? window.tMedia('unsupportedFileType') : 'PDF compression is only supported on the English page.';
            if (window.MediaUI && window.MediaUI.showError) {
                window.MediaUI.showError(uploadDropzone, errMsg);
            }
            return;
        }

        // Audio pre-flight checks
        if (isAudioFile) {
            if (window.MediaUI && window.MediaUI.checkFileSizeLimit) {
                const sizeCheck = window.MediaUI.checkFileSizeLimit(file, 'audio');
                if (!sizeCheck.ok) {
                    if (window.MediaUI.showError) {
                        window.MediaUI.showError(uploadDropzone, sizeCheck.error);
                    }
                    return;
                }
            } else if (file.size > 50 * 1024 * 1024) {
                if (window.MediaUI && window.MediaUI.showError) {
                    window.MediaUI.showError(uploadDropzone, window.tMedia ? window.tMedia('fileTooLargeAudio') : 'File is too large. Maximum audio size is 50MB.');
                }
                return;
            }

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
                    const err = window.tMedia ? window.tMedia('audioTooLong', { maxMin }) : `Audio is too long. Maximum audio duration is ${maxMin} minutes.`;
                    window.MediaUI.showError(uploadDropzone, err);
                    return;
                }
            }
        }

        currentFile = file;

        if (isPdfFile) {
            await handlePdfFile(file);
            return;
        }

        if (isAudioFile) {
            currentFileType = 'audio';
            setUIMode('audio');
            originalSizeEl.textContent = formatBytes(file.size);
            compressedSizeEl.textContent = '...';
            savedPercentageEl.textContent = '...';
            await loadAndProcessAudio(file);
            return;
        }

        // Image flow
        currentFileType = 'image';
        setUIMode('image');
        originalSizeEl.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement = new Image();
            imgElement.onload = () => {
                uploadHero.style.display = 'none';
                settingsSection.style.display = 'block';
                processCompression();
            };
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async function handlePdfFile(file) {
        currentFileType = 'pdf';
        try {
            let arrayBuffer;
            if (file.arrayBuffer) {
                arrayBuffer = await file.arrayBuffer();
            } else {
                arrayBuffer = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
            }
            originalPdfBytes = arrayBuffer;

            if (!window.PDFLib) {
                throw new Error('PDF library is loading or failed to load. Please refresh.');
            }
            if (!window.pdfjsLib) {
                throw new Error('PDF viewer library is loading or failed to load. Please refresh.');
            }

            const pdfDoc = await window.PDFLib.PDFDocument.load(
                arrayBuffer.slice ? arrayBuffer.slice(0) : arrayBuffer,
                { ignoreEncryption: true }
            );
            pdfPageCount = pdfDoc.getPageCount();

            setUIMode('pdf');
            await renderPdfPagesPreview();
        } catch (err) {
            console.error('Error loading PDF:', err);
            const errMsg = 'Could not load the PDF file: ' + (err && err.message ? err.message : 'Unknown error') + '. Please ensure it is a valid, uncorrupted PDF.';
            if (window.MediaUI && window.MediaUI.showError) {
                window.MediaUI.showError(uploadHero || settingsSection, errMsg);
            }
        }
    }

    async function loadAndProcessAudio(file) {
        ensureAudioElements();
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

        const seq = ++audioCompressionSeq;
        try {
            if (file.size === 0) {
                throw new Error('Empty audio file');
            }

            const arrayBuffer = await file.arrayBuffer();
            if (seq !== audioCompressionSeq) return;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContextClass();
            let decoded = null;
            try {
                decoded = await audioCtx.decodeAudioData(arrayBuffer);
            } finally {
                if (audioCtx && typeof audioCtx.close === 'function') {
                    try {
                        const closePromise = audioCtx.close();
                        if (closePromise && typeof closePromise.catch === 'function') {
                            closePromise.catch(() => {});
                        }
                    } catch (e) {}
                }
            }

            if (seq !== audioCompressionSeq) return;

            if (window.MediaUI && window.MediaUI.checkAudioDurationLimit) {
                const durCheck = window.MediaUI.checkAudioDurationLimit(decoded.duration);
                if (!durCheck.ok) {
                    if (progressComponent) progressComponent.hide();
                    window.MediaUI.showError(settingsSection, durCheck.error);
                    return;
                }
            }

            currentAudioBuffer = await prepareAudioBuffer(decoded);
            decoded = null;
            if (seq !== audioCompressionSeq) return;

            processAudioCompression();
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

    function updateTargetSizeForAudio() {
        if (!currentAudioBuffer || currentFileType !== 'audio') return;
        const targetBytes = getTargetBytes();
        if (!targetBytes || !targetSizeNotice) {
            if (targetSizeNotice) targetSizeNotice.style.display = 'none';
            if (audioBitrateSelect) audioBitrateSelect.disabled = false;
            return;
        }

        const calc = window.MediaUI.computeTargetBitrate(
            targetBytes,
            currentAudioBuffer.duration,
            [192, 160, 128, 112, 96, 80, 64, 56, 48, 40, 32]
        );

        if (audioBitrateSelect) {
            audioBitrateSelect.value = String(calc.bitrate);
            audioBitrateSelect.disabled = true;
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

    async function processAudioCompression() {
        if (!currentAudioBuffer || currentFileType !== 'audio') return;
        const seq = ++audioCompressionSeq;

        ensureAudioElements();

        let bitrate = 96;
        let targetBytes = getTargetBytes();
        let isUnreachable = false;

        if (targetBytes) {
            const calc = window.MediaUI.computeTargetBitrate(
                targetBytes,
                currentAudioBuffer.duration,
                [192, 160, 128, 112, 96, 80, 64, 56, 48, 40, 32]
            );
            bitrate = calc.bitrate;
            isUnreachable = calc.isUnreachable;
            if (audioBitrateSelect) {
                audioBitrateSelect.value = String(bitrate);
                audioBitrateSelect.disabled = true;
            }
            updateTargetSizeForAudio();
        } else {
            bitrate = audioBitrateSelect ? parseInt(audioBitrateSelect.value, 10) : 96;
            if (audioBitrateSelect) audioBitrateSelect.disabled = false;
            if (targetSizeNotice) targetSizeNotice.style.display = 'none';
        }

        const isMono = monoCheckbox ? monoCheckbox.checked : false;

        if (audioWorker) {
            audioWorker.terminate();
            audioWorker = null;
        }

        if (window.MediaUI && window.MediaUI.requestWakeLock) {
            await window.MediaUI.requestWakeLock();
        }

        isConvertingAudio = true;
        if (progressComponent) {
            progressComponent.show(window.tMedia ? window.tMedia('convertingAudio') : 'Compressing audio...');
            progressComponent.update(10);
        }

        if (downloadBtn) {
            downloadBtn.disabled = true;
        }

        // Lazy load worker
        try {
            audioWorker = new Worker('/audio-worker.js');
        } catch (err) {
            isConvertingAudio = false;
            if (window.MediaUI && window.MediaUI.releaseWakeLock) window.MediaUI.releaseWakeLock();
            if (progressComponent) progressComponent.hide();
            if (downloadBtn) downloadBtn.disabled = false;
            const errMsg = window.tMedia ? window.tMedia('audioProcessError') : 'Audio compression error.';
            window.MediaUI.showError(settingsSection, errMsg);
            return;
        }

        const channels = currentAudioBuffer.numberOfChannels;
        const channelData = [];
        for (let ch = 0; ch < channels; ch++) {
            const f32 = new Float32Array(currentAudioBuffer.length);
            currentAudioBuffer.copyFromChannel(f32, ch);
            channelData.push(f32);
        }

        audioWorker.onmessage = function (e) {
            if (seq !== audioCompressionSeq || currentFileType !== 'audio') return;
            const msg = e.data;
            if (!msg) return;

            if (msg.type === 'progress') {
                if (progressComponent) {
                    progressComponent.update(msg.percent, window.tMedia ? window.tMedia('convertingAudio') : 'Compressing audio...');
                }
            } else if (msg.type === 'complete') {
                isConvertingAudio = false;
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) progressComponent.hide();

                const blob = new Blob([msg.buffer], { type: msg.mimeType || 'audio/mpeg' });
                currentCompressedAudioBlob = blob;

                compressedSizeEl.textContent = formatBytes(blob.size);

                const saved = Math.round(((currentFile.size - blob.size) / currentFile.size) * 100);
                if (saved >= 0) {
                    savedPercentageEl.textContent = saved + '% Saved';
                    savedPercentageEl.style.background = '#10b981';
                } else {
                    savedPercentageEl.textContent = Math.abs(saved) + '% Larger';
                    savedPercentageEl.style.background = '#6b7280';
                }

                if (audioOutputPreview) {
                    if (audioOutputPreview.src && audioOutputPreview.src.startsWith('blob:')) {
                        URL.revokeObjectURL(audioOutputPreview.src);
                    }
                    audioOutputPreview.src = URL.createObjectURL(blob);
                    if (audioOutputWrapper) audioOutputWrapper.style.display = 'block';
                }

                if (targetBytes && targetSizeNotice) {
                    const realFormatted = formatBytes(blob.size);
                    const chosenBitrate = audioBitrateSelect ? audioBitrateSelect.value : bitrate;
                    if (isUnreachable) {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeUnreachable', { estSize: realFormatted })
                            : `Target size is below minimum audio bitrate. Using 32 kbps as the closest possible result (achieved size: ${realFormatted}).`;
                    } else if (blob.size <= targetBytes * 1.03) {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeAchieved', { realSize: realFormatted, kbps: chosenBitrate })
                            : `Achieved size: ${realFormatted} (${chosenBitrate} kbps)`;
                    } else {
                        targetSizeNotice.textContent = window.tMedia
                            ? window.tMedia('targetSizeExceeded', { realSize: realFormatted, kbps: chosenBitrate })
                            : `Achieved size: ${realFormatted} (${chosenBitrate} kbps). Note: slightly exceeds target due to audio frame structure.`;
                    }
                    targetSizeNotice.style.display = 'block';
                }

                if (downloadBtn) {
                    downloadBtn.disabled = false;
                    downloadBtn.textContent = window.tMedia ? window.tMedia('downloadCompressedAudio') : 'Download Compressed Audio';
                }
            } else if (msg.type === 'error') {
                isConvertingAudio = false;
                if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                    window.MediaUI.releaseWakeLock();
                }
                if (progressComponent) progressComponent.hide();
                if (downloadBtn) downloadBtn.disabled = false;
                const errMsg = window.tMedia ? window.tMedia('audioProcessError') : (msg.message || 'Error processing audio.');
                window.MediaUI.showError(settingsSection, errMsg);
            }
        };

        audioWorker.onerror = function (e) {
            if (seq !== audioCompressionSeq || currentFileType !== 'audio') return;
            isConvertingAudio = false;
            if (window.MediaUI && window.MediaUI.releaseWakeLock) {
                window.MediaUI.releaseWakeLock();
            }
            if (progressComponent) progressComponent.hide();
            if (downloadBtn) downloadBtn.disabled = false;
            const errMsg = window.tMedia ? window.tMedia('audioProcessError') : 'Audio compression error.';
            window.MediaUI.showError(settingsSection, errMsg);
        };

        audioWorker.postMessage({
            command: 'convert',
            format: 'mp3',
            sampleRate: currentAudioBuffer.sampleRate,
            channels: currentAudioBuffer.numberOfChannels,
            bitrate: bitrate,
            mono: isMono,
            channelData: channelData
        }, channelData.map(b => b.buffer));
    }

    async function renderPdfPagesPreview() {
        if (!pdfPagesContainer || !originalPdfBytes) return;
        pdfPagesContainer.innerHTML = '';
        cachedPreviewPages = [];

        try {
            const loadingTask = window.pdfjsLib.getDocument({
                data: new Uint8Array(originalPdfBytes.slice ? originalPdfBytes.slice(0) : originalPdfBytes)
            });
            const pdfDoc = await loadingTask.promise;
            const pagesToRender = Math.min(PREVIEW_PAGE_LIMIT, pdfDoc.numPages);
            pdfPageCount = pdfDoc.numPages;

            if (pdfPageBadge) {
                pdfPageBadge.textContent = `${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}`;
            }
            if (pdfFileName) {
                pdfFileName.textContent = currentFile ? currentFile.name : 'Document.pdf';
            }
            if (pdfLargeNotice) {
                pdfLargeNotice.style.display = pdfPageCount > 50 ? 'block' : 'none';
            }

            // DPI scale: PDF default is 72 dpi. Baseline target is ~150 dpi.
            const baselineScale = 150 / 72;

            for (let p = 1; p <= pagesToRender; p++) {
                const page = await pdfDoc.getPage(p);
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const baselineViewport = page.getViewport({ scale: baselineScale });

                // Render offscreen canvas ONCE at baseline scale for caching & fast re-compression
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = Math.floor(baselineViewport.width);
                offscreenCanvas.height = Math.floor(baselineViewport.height);
                const offCtx = offscreenCanvas.getContext('2d');

                // White paper background
                offCtx.fillStyle = '#ffffff';
                offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

                await page.render({ canvasContext: offCtx, viewport: baselineViewport }).promise;

                // Build thumbnail DOM
                const pageItem = document.createElement('div');
                pageItem.className = 'pdf-page-item';
                pageItem.dataset.pageNum = String(p);
                pageItem.style.position = 'relative';
                pageItem.style.display = 'flex';
                pageItem.style.flexDirection = 'column';
                pageItem.style.alignItems = 'center';
                pageItem.style.width = '100%';

                const pageLabel = document.createElement('div');
                pageLabel.style.fontSize = '11px';
                pageLabel.style.fontWeight = '600';
                pageLabel.style.color = 'var(--text-secondary, #4b5563)';
                pageLabel.style.marginBottom = '4px';
                pageLabel.style.alignSelf = 'flex-start';
                pageLabel.style.paddingLeft = '6px';
                pageLabel.textContent = `Page ${p}`;

                const canvasWrapper = document.createElement('div');
                canvasWrapper.className = 'pdf-canvas-wrapper';
                canvasWrapper.style.position = 'relative';
                canvasWrapper.style.display = 'inline-block';
                canvasWrapper.style.borderRadius = '4px';
                canvasWrapper.style.overflow = 'hidden';
                canvasWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
                canvasWrapper.style.border = '1px solid #e2e8f0';
                canvasWrapper.style.background = '#ffffff';

                const displayWidth = 230;
                const displayScale = displayWidth / unscaledViewport.width;
                const displayHeight = Math.floor(unscaledViewport.height * displayScale);

                canvasWrapper.style.width = `${displayWidth}px`;
                canvasWrapper.style.height = `${displayHeight}px`;

                const displayCanvas = document.createElement('canvas');
                displayCanvas.className = 'pdf-page-canvas';
                displayCanvas.width = offscreenCanvas.width;
                displayCanvas.height = offscreenCanvas.height;
                displayCanvas.style.display = 'block';
                displayCanvas.style.width = '100%';
                displayCanvas.style.height = '100%';
                const dispCtx = displayCanvas.getContext('2d');
                dispCtx.drawImage(offscreenCanvas, 0, 0);

                canvasWrapper.appendChild(displayCanvas);

                const sizeReadout = document.createElement('div');
                sizeReadout.className = 'pdf-page-size-readout';
                sizeReadout.style.fontSize = '12px';
                sizeReadout.style.fontWeight = '600';
                sizeReadout.style.color = 'var(--text-secondary, #4b5563)';
                sizeReadout.style.marginTop = '6px';
                sizeReadout.style.textAlign = 'center';
                sizeReadout.textContent = 'Calculating...';

                pageItem.appendChild(pageLabel);
                pageItem.appendChild(canvasWrapper);
                pageItem.appendChild(sizeReadout);
                pdfPagesContainer.appendChild(pageItem);

                cachedPreviewPages.push({
                    pageNum: p,
                    canvas: offscreenCanvas,
                    unscaledWidth: unscaledViewport.width,
                    unscaledHeight: unscaledViewport.height,
                    readoutEl: sizeReadout
                });
            }

            if (pdfPreviewFootnote) {
                if (pdfPageCount > PREVIEW_PAGE_LIMIT) {
                    pdfPreviewFootnote.textContent = `Showing preview of first ${PREVIEW_PAGE_LIMIT} pages. Compression will be applied to all ${pdfPageCount} pages on download.`;
                } else {
                    pdfPreviewFootnote.textContent = `Showing preview of all ${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}. Compression will be applied on download.`;
                }
            }

            await updatePdfPreview();
        } catch (err) {
            console.error('Error rendering PDF preview pages:', err);
            alert('Could not render PDF preview: ' + (err && err.message ? err.message : 'Unknown error'));
        }
    }

    async function estimateQualityForTarget(targetBytes) {
        if (!cachedPreviewPages.length) return 0.8;
        const mimeType = 'image/jpeg';
        let low = 0.05, high = 0.98;
        let bestQ = 0.8;
        let bestDiff = Infinity;
        const previewCount = cachedPreviewPages.length;
        const factor = pdfPageCount / previewCount;

        for (let iter = 0; iter < 7; iter++) {
            const mid = (low + high) / 2;
            let totalBytes = 0;
            for (const p of cachedPreviewPages) {
                const b = await new Promise(r => p.canvas.toBlob(r, mimeType, mid));
                if (b) totalBytes += b.size;
            }
            const estTotal = totalBytes * factor;
            const diff = Math.abs(estTotal - targetBytes);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestQ = mid;
            }
            if (estTotal > targetBytes) {
                high = mid;
            } else {
                low = mid;
            }
        }
        return bestQ;
    }

    async function updatePdfPreview() {
        if (currentFileType !== 'pdf' || !cachedPreviewPages.length || !currentFile) return;

        const seq = ++pdfCompressSeq;
        const mimeType = 'image/jpeg';

        const targetBytes = getTargetBytes();
        let qualityVal = parseInt(qualitySlider.value, 10);

        if (targetBytes) {
            const bestQ = await estimateQualityForTarget(targetBytes);
            if (seq !== pdfCompressSeq) return;
            qualityVal = Math.max(5, Math.min(100, Math.round(bestQ * 100)));
            qualitySlider.value = qualityVal;
        }

        qualityValue.textContent = qualityVal + '%';
        const quality = qualityVal / 100;

        const beforePageBytes = Math.round(currentFile.size / pdfPageCount);
        const beforeStr = formatBytes(beforePageBytes);

        let totalPreviewBytes = 0;

        // Fast re-compression against already-cached canvases using JPEG only (matching download)
        for (const item of cachedPreviewPages) {
            if (seq !== pdfCompressSeq) return;
            const blob = await new Promise(r => item.canvas.toBlob(r, mimeType, quality));
            if (!blob) continue;
            totalPreviewBytes += blob.size;
            item.readoutEl.innerHTML = `<span style="color:var(--text-primary); font-weight:600;">${beforeStr}</span> &rarr; <span style="color:var(--primary); font-weight:700;">${formatBytes(blob.size)}</span>`;
        }

        if (seq !== pdfCompressSeq) return;

        const previewCount = cachedPreviewPages.length;
        const factor = pdfPageCount / previewCount;
        const estimatedTotalBytes = Math.round(totalPreviewBytes * factor);

        originalSizeEl.textContent = formatBytes(currentFile.size);
        compressedSizeEl.textContent = (pdfPageCount > previewCount ? '~' : '') + formatBytes(estimatedTotalBytes);

        const saved = Math.round(((currentFile.size - estimatedTotalBytes) / currentFile.size) * 100);
        if (saved > 0) {
            savedPercentageEl.textContent = saved + '% Saved';
            savedPercentageEl.style.background = '#10b981';
        } else {
            savedPercentageEl.textContent = Math.abs(saved) + '% Larger';
            savedPercentageEl.style.background = '#6b7280';
        }
    }

    async function compressPdfAndDownload() {
        if (!originalPdfBytes || !currentFile) return;

        const originalBtnText = downloadBtn.textContent;
        downloadBtn.disabled = true;

        if (pdfPageCount > 50 && pdfLargeNotice) {
            pdfLargeNotice.style.display = 'block';
        }

        try {
            const targetBytes = getTargetBytes();
            let currentQuality = parseInt(qualitySlider.value, 10) / 100;

            if (targetBytes) {
                currentQuality = await estimateQualityForTarget(targetBytes);
            }

            const baselineScale = 150 / 72;
            const loadingTask = window.pdfjsLib.getDocument({
                data: new Uint8Array(originalPdfBytes.slice ? originalPdfBytes.slice(0) : originalPdfBytes)
            });
            const pdfDoc = await loadingTask.promise;

            let finalPdfBytes = null;
            const maxPasses = targetBytes ? 3 : 1;
            let pass = 0;

            while (pass < maxPasses) {
                pass++;
                const passLabel = maxPasses > 1 ? ` (Pass ${pass}/${maxPasses})` : '';

                const { PDFDocument } = window.PDFLib;
                const outPdf = await PDFDocument.create();

                for (let p = 1; p <= pdfPageCount; p++) {
                    const percent = Math.round((p / pdfPageCount) * 100);
                    downloadBtn.textContent = `Processing page ${p} of ${pdfPageCount} (${percent}%)${passLabel}...`;

                    let canvasToUse = null;
                    let unscaledWidth = 0;
                    let unscaledHeight = 0;

                    // Reuse the first 4 cached canvases to save re-rendering work
                    if (p <= cachedPreviewPages.length) {
                        canvasToUse = cachedPreviewPages[p - 1].canvas;
                        unscaledWidth = cachedPreviewPages[p - 1].unscaledWidth;
                        unscaledHeight = cachedPreviewPages[p - 1].unscaledHeight;
                    } else {
                        // Render fresh at baseline ~150 DPI
                        const page = await pdfDoc.getPage(p);
                        const unscaledViewport = page.getViewport({ scale: 1.0 });
                        unscaledWidth = unscaledViewport.width;
                        unscaledHeight = unscaledViewport.height;

                        const baselineViewport = page.getViewport({ scale: baselineScale });
                        const offCanvas = document.createElement('canvas');
                        offCanvas.width = Math.floor(baselineViewport.width);
                        offCanvas.height = Math.floor(baselineViewport.height);
                        const offCtx = offCanvas.getContext('2d');
                        offCtx.fillStyle = '#ffffff';
                        offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

                        await page.render({ canvasContext: offCtx, viewport: baselineViewport }).promise;
                        canvasToUse = offCanvas;
                    }

                    // Encode canvas as JPEG for pdf-lib embed (using currentQuality), matching the live preview and target size binary search exactly.
                    const imgBlob = await new Promise(r => canvasToUse.toBlob(r, 'image/jpeg', currentQuality));
                    const imgBytes = await imgBlob.arrayBuffer();
                    const embeddedImage = await outPdf.embedJpg(imgBytes);

                    const newPage = outPdf.addPage([unscaledWidth, unscaledHeight]);
                    newPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: unscaledWidth,
                        height: unscaledHeight
                    });

                    // Yield to event loop every 10 pages to avoid freezing the tab
                    if (p % 10 === 0) {
                        await new Promise(r => requestAnimationFrame(r));
                    }
                }

                downloadBtn.textContent = `Assembling PDF${passLabel}...`;
                finalPdfBytes = await outPdf.save();

                if (!targetBytes) {
                    break;
                }

                const actualSize = finalPdfBytes.length;
                const diffRatio = Math.abs(actualSize - targetBytes) / targetBytes;

                // Close enough if within 10% or if passes exhausted
                if (diffRatio <= 0.10 || pass >= maxPasses) {
                    break;
                }

                if (actualSize > targetBytes) {
                    currentQuality = Math.max(0.05, currentQuality * Math.sqrt(targetBytes / actualSize) * 0.95);
                } else {
                    currentQuality = Math.min(0.98, currentQuality * Math.sqrt(targetBytes / actualSize));
                }
            }

            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'document';
            const fileName = `${originalName}-compressed.pdf`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Error compressing PDF:', err);
            alert('Could not compress the PDF: ' + (err && err.message ? err.message : 'Unknown error') + '. Please try a different PDF or contact support.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalBtnText;
        }
    }

    if (removePdfBtn) {
        removePdfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            originalPdfBytes = null;
            pdfPageCount = 0;
            cachedPreviewPages = [];
            currentFile = null;
            currentFileType = 'image';
            if (pdfPagesContainer) pdfPagesContainer.innerHTML = '';
            if (fileInput) fileInput.value = '';
            if (settingsSection) settingsSection.style.display = 'none';
            if (uploadHero) uploadHero.style.display = 'block';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'none';
            if (imagePreview) imagePreview.style.display = 'block';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            updateFormatDropdown('image');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Compressed Image';
            }
            if (originalSizeEl) originalSizeEl.textContent = '0 KB';
            if (compressedSizeEl) compressedSizeEl.textContent = '0 KB';
            if (savedPercentageEl) {
                savedPercentageEl.textContent = '0% Saved';
                savedPercentageEl.style.background = '#10b981';
            }
        });
    }

    // ==========================================
    // Existing Image Compression Logic (Untouched)
    // ==========================================
    let compressionSeq = 0;

    function compressCanvas(quality, mimeType) {
        return new Promise((resolve) => {
            if (!imgElement) return resolve(null);

            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            const ctx = canvas.getContext('2d');

            if (mimeType === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(imgElement, 0, 0);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, mimeType, quality);
        });
    }

    async function processCompression() {
        if (!imgElement || !currentFile) return;

        const seq = ++compressionSeq;
        const mimeType = formatSelect.value;
        const qualityVal = parseInt(qualitySlider.value, 10);
        qualityValue.textContent = qualityVal + '%';
        const quality = qualityVal / 100;

        const targetBytes = getTargetBytes();
        let blob = null;
        if (targetBytes) {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (mimeType === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(imgElement, 0, 0);
            blob = await adjustCanvasToTarget(canvas, mimeType, targetBytes, quality);
        }
        if (!blob) {
            blob = await compressCanvas(quality, mimeType);
        }
        if (!blob || seq !== compressionSeq) return;

        currentBlob = blob;

        if (imagePreview.src && imagePreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview.src);
        }
        const url = URL.createObjectURL(blob);
        imagePreview.src = url;

        compressedSizeEl.textContent = formatBytes(blob.size);

        const saved = Math.round(((currentFile.size - blob.size) / currentFile.size) * 100);
        if (saved > 0) {
            savedPercentageEl.textContent = saved + '% Saved';
            savedPercentageEl.style.background = '#10b981';
        } else {
            savedPercentageEl.textContent = Math.abs(saved) + '% Larger';
            savedPercentageEl.style.background = '#6b7280';
        }
    }

    function onQualityChange() {
        qualityValue.textContent = qualitySlider.value + '%';
        if (currentFileType === 'pdf') {
            updatePdfPreview();
        } else {
            processCompression();
        }
    }

    if (qualitySlider) {
        qualitySlider.addEventListener('input', onQualityChange);
        qualitySlider.addEventListener('change', onQualityChange);
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', () => {
            if (currentFileType === 'pdf') {
                updatePdfPreview();
            } else {
                processCompression();
            }
        });
    }

    if (targetFileSize) {
        const onTargetChange = () => {
            if (currentFileType === 'audio') {
                updateTargetSizeForAudio();
                processAudioCompression();
            } else if (currentFileType === 'pdf') {
                updatePdfPreview();
            } else {
                processCompression();
            }
        };
        targetFileSize.addEventListener('input', onTargetChange);
        targetFileSize.addEventListener('change', onTargetChange);
    }
    if (targetFileSizeUnit) {
        targetFileSizeUnit.addEventListener('change', () => {
            if (currentFileType === 'audio') {
                updateTargetSizeForAudio();
                processAudioCompression();
            } else if (currentFileType === 'pdf') {
                updatePdfPreview();
            } else {
                processCompression();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            if (currentFileType === 'video') {
                if (currentCompressedVideoBlob && currentFile) {
                    const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'video';
                    const fileName = `${originalName}-compressed.mp4`;
                    if (window.MediaUI && window.MediaUI.triggerDownload) {
                        window.MediaUI.triggerDownload(currentCompressedVideoBlob, fileName);
                    } else {
                        const url = URL.createObjectURL(currentCompressedVideoBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }
                } else {
                    await processVideoCompression();
                }
                return;
            }

            if (currentFileType === 'audio') {
                if (!currentCompressedAudioBlob || !currentFile) return;
                const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'audio';
                const fileName = `${originalName}-compressed.mp3`;
                if (window.MediaUI && window.MediaUI.triggerDownload) {
                    window.MediaUI.triggerDownload(currentCompressedAudioBlob, fileName);
                } else {
                    const url = URL.createObjectURL(currentCompressedAudioBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
                return;
            }

            if (currentFileType === 'pdf') {
                await compressPdfAndDownload();
                return;
            }

            if (!imgElement || !currentFile) return;

            const mimeType = formatSelect.value;
            const qualityVal = parseInt(qualitySlider.value, 10);
            const quality = qualityVal / 100;

            const targetBytes = getTargetBytes();
            let blob = null;
            if (targetBytes) {
                const canvas = document.createElement('canvas');
                canvas.width = imgElement.naturalWidth;
                canvas.height = imgElement.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(imgElement, 0, 0);
                blob = await adjustCanvasToTarget(canvas, mimeType, targetBytes, quality);
            }
            if (!blob) {
                blob = await compressCanvas(quality, mimeType);
            }
            if (!blob) return;
            currentBlob = blob;

            const extMap = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp'
            };
            const ext = extMap[mimeType] || '.jpg';
            const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'compressed-image';
            const fileName = originalName + '-compressed' + ext;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }

    function getTargetBytes() {
        const input = document.getElementById('targetFileSize');
        const unit = document.getElementById('targetFileSizeUnit');
        if (!input) return null;
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0) return null;
        const multiplier = (unit && unit.value === 'MB') ? (1024 * 1024) : 1024;
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
