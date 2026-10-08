/* ============================================
   ImageResizer — Batch Resize Logic
   ============================================ */

(function () {
    'use strict';

    // ── DOM Elements ──
    const uploadHero = document.getElementById('uploadHero');
    const settingsSection = document.getElementById('settingsSection');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const selectImagesBtn = document.getElementById('selectImagesBtn');

    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const imageList = document.getElementById('imageList');

    const resizeBy = document.getElementById('resizeBy');
    const percentageMode = document.getElementById('percentageMode');
    const dimensionsMode = document.getElementById('dimensionsMode');

    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');

    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');

    const fitMode = document.getElementById('fitMode');
    const neverUpscale = document.getElementById('neverUpscale');

    const outputFormat = document.getElementById('outputFormat');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');

    const bgColor = document.getElementById('bgColor');
    const bgColorText = document.getElementById('bgColorText');

    const filenamePrefix = document.getElementById('filenamePrefix');

    // ── State ──
    /** @type {File[]} */
    let selectedFiles = [];

    // For mapping list items -> file
    let currentJobs = [];

    // ── Preview Pan & Zoom State ──
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let startPanX = 0;
    let startPanY = 0;

    // ── Init ──
    function init() {
        bindEvents();
        setModeUI();
        updateQualityUI();
        syncBgColorText();
    }

    // ── Events ──
    function bindEvents() {
        selectImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        uploadDropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (!e.target.files || !e.target.files.length) return;
            selectedFiles = Array.from(e.target.files);
            panX = 0;
            panY = 0;
            renderImageList();
            settingsSection.style.display = 'block';
            uploadHero.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        });

        resizeBy.addEventListener('change', setModeUI);
        scaleSlider.addEventListener('input', updateScaleUI);

        qualitySlider.addEventListener('input', updateQualityUI);

        bgColor.addEventListener('input', syncBgColorText);
        bgColorText.addEventListener('input', () => {
            const v = (bgColorText.value || '').trim();
            bgColor.value = v;
        });

        processBtn.addEventListener('click', () => {
            if (!selectedFiles.length) {
                alert('Please select images first.');
                return;
            }
            processAll();
        });

        downloadBtn.addEventListener('click', () => {
            if (currentJobs[0]?.outputUrl) downloadOne(0);
        });

        clearBtn.addEventListener('click', () => {
            clearAll();
        });

        // Change Image Button
        const changeImageBtn = document.getElementById('changeImageBtn');
        const changeImageInput = document.getElementById('changeImageInput');
        if (changeImageBtn && changeImageInput) {
            changeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeImageInput.click();
            });
        }
        if (changeImageInput) {
            changeImageInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    selectedFiles = Array.from(e.target.files);
                    panX = 0;
                    panY = 0;
                    renderImageList();
                }
            });
        }

        // Drag & drop
        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.classList.add('drag-over');
        });
        uploadDropzone.addEventListener('dragleave', () => {
            uploadDropzone.classList.remove('drag-over');
        });
        uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDropzone.classList.remove('drag-over');
            if (e.dataTransfer?.files?.length) {
                selectedFiles = Array.from(e.dataTransfer.files);
                panX = 0;
                panY = 0;
                renderImageList();
                settingsSection.style.display = 'block';
            }
        });

        // Pointer drag & pan inside preview box (mouse + touch)
        const previewBox = document.querySelector('.resize-preview-box');
        if (previewBox) {
            previewBox.addEventListener('pointerdown', (e) => {
                const preview = document.getElementById('resizePreview');
                if (!preview || !preview.src) return;
                isPanning = true;
                startPointerX = e.clientX;
                startPointerY = e.clientY;
                startPanX = panX;
                startPanY = panY;
                try {
                    previewBox.setPointerCapture(e.pointerId);
                } catch (_) {}
                updatePreviewTransform(false);
            });

            previewBox.addEventListener('pointermove', (e) => {
                if (!isPanning) return;
                const scale = (parseFloat(scaleSlider?.value || '100') || 100) / 100;
                const dx = e.clientX - startPointerX;
                const dy = e.clientY - startPointerY;
                panX = startPanX + (dx / scale);
                panY = startPanY + (dy / scale);
                updatePreviewTransform(false);
            });

            const stopPanning = (e) => {
                if (!isPanning) return;
                isPanning = false;
                try {
                    previewBox.releasePointerCapture(e.pointerId);
                } catch (_) {}
                updatePreviewTransform(true);
            };

            previewBox.addEventListener('pointerup', stopPanning);
            previewBox.addEventListener('pointercancel', stopPanning);
        }
    }

    function setModeUI() {
        const v = resizeBy.value;
        if (v === 'percentage') {
            percentageMode.style.display = 'block';
            dimensionsMode.style.display = 'none';
        } else {
            percentageMode.style.display = 'none';
            dimensionsMode.style.display = 'block';
        }
        updateScaleUI();
    }

    function updatePreviewTransform(smooth = false) {
        const preview = document.getElementById('resizePreview');
        if (!preview || !preview.src) return;
        const scale = (parseFloat(scaleSlider?.value || '100') || 100) / 100;
        preview.style.transition = smooth ? 'transform 0.1s ease' : 'none';
        preview.style.transform = `translate(${panX * scale}px, ${panY * scale}px) scale(${scale})`;
        preview.style.transformOrigin = 'center center';
    }

    function updateScaleUI() {
        const val = parseFloat(scaleSlider.value || '100');
        scaleValue.textContent = `${val}%`;
        updatePreviewTransform(true);
    }

    function updateQualityUI() {
        const val = parseInt(qualitySlider.value || '85', 10);
        qualityValue.textContent = `${val}%`;
    }

    function syncBgColorText() {
        bgColorText.value = bgColor.value;
    }

    function renderImageList() {
        // clear UI
        imageList.innerHTML = '';

        currentJobs = selectedFiles.map((file, idx) => ({
            file,
            idx,
            status: 'ready',
            outputUrl: null,
            outputBlob: null,
        }));

        selectedFiles.forEach((file, idx) => {
            const item = document.createElement('div');
            item.className = 'image-item';

            const thumb = document.createElement('img');
            thumb.className = 'image-item-thumb';

            const info = document.createElement('div');
            info.className = 'image-item-info';

            const name = document.createElement('div');
            name.className = 'image-item-name';
            name.textContent = file.name || `image-${idx + 1}`;

            const meta = document.createElement('div');
            meta.className = 'image-item-meta';
            meta.textContent = `${formatBytes(file.size)}`;

            const status = document.createElement('div');
            status.className = 'image-item-status';
            status.textContent = 'Ready';

            const actions = document.createElement('div');
            actions.className = 'image-item-actions';

            const dlBtn = document.createElement('button');
            dlBtn.type = 'button';
            dlBtn.dataset.idx = String(idx);
            dlBtn.title = 'Download';
            dlBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      `;

            dlBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const job = currentJobs[idx];
                if (!job) return;
                if (!job.outputUrl || !job.outputBlob) {
                    await processOne(idx);
                }
                downloadOne(idx);
            });

            actions.appendChild(dlBtn);

            info.appendChild(name);
            info.appendChild(meta);
            info.appendChild(status);

            item.appendChild(thumb);
            item.appendChild(info);
            item.appendChild(actions);

            imageList.appendChild(item);

            // thumb load
            const reader = new FileReader();
            reader.onload = (ev) => {
                thumb.src = ev.target.result;
                // Set preview image to first uploaded image
                if (idx === 0) {
                    const preview = document.getElementById('resizePreview');
                    if (preview) {
                        preview.src = ev.target.result;
                        panX = 0;
                        panY = 0;
                        updatePreviewTransform(false);
                    }
                }
            };
            reader.readAsDataURL(file);
        });

        // Hide settings if empty
        settingsSection.style.display = selectedFiles.length ? 'block' : 'none';
    }

    async function processAll() {
        processBtn.disabled = true;
        clearBtn.disabled = true;

        // Process sequentially to avoid memory spikes
        for (const job of currentJobs) {
            await processOne(job.idx);
        }

        processBtn.disabled = false;
        clearBtn.disabled = false;
    }

    async function processOne(idx) {
        const job = currentJobs[idx];
        if (!job) return;

        setItemStatus(idx, 'Processing...', false);

        try {
            const img = await loadImageFromFile(job.file);

            const target = computeTargetDimensions(img.naturalWidth, img.naturalHeight);

            const { outCanvas, mimeType, outExt } = await renderResizedImage(
                img,
                target
            );

            // create blob
            const targetBytes = getTargetBytes();
            let blob = null;
            if (targetBytes) {
                blob = await adjustCanvasToTarget(outCanvas, mimeType, targetBytes, getQuality() / 100);
            }
            if (!blob) {
                blob = await canvasToBlob(outCanvas, mimeType, getQuality());
            }
            const url = URL.createObjectURL(blob);

            job.status = 'done';
            job.outputBlob = blob;
            job.outputUrl = url;
            job.outputExt = outExt;

            const sizeLabel = formatBytes(blob.size);
            setItemStatus(idx, `Done (${sizeLabel})`, true);
            enableDownloadButton(idx, outExt);
            downloadBtn.style.display = 'inline-flex';

            // ensure we don't keep large canvases around
            outCanvas.width = 1;
            outCanvas.height = 1;
        } catch (err) {
            console.error(err);
            job.status = 'error';
            setItemStatus(idx, 'Error', false);
        }
    }

    function setItemStatus(idx, text, done) {
        const item = imageList.children[idx];
        if (!item) return;
        const statusEl = item.querySelector('.image-item-status');
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.classList.toggle('done', !!done);
    }

    function enableDownloadButton(idx, outExt) {
        const item = imageList.children[idx];
        if (!item) return;
        const btn = item.querySelector('.image-item-actions button');
        if (!btn) return;
        btn.disabled = false;
        btn.dataset.ext = outExt || 'png';
    }

    function downloadOne(idx) {
        const job = currentJobs[idx];
        if (!job?.outputUrl || !job.outputBlob) return;

        const prefix = (filenamePrefix.value || '').trim();
        const baseName = (job.file.name || `image-${idx + 1}`)
            .replace(/\.[^/.]+$/, '');

        const ext = (job.outputExt || getDefaultExt()).toLowerCase();
        const a = document.createElement('a');
        a.href = job.outputUrl;
        a.download = `${prefix ? prefix + '-' : ''}${baseName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    function getDefaultExt() {
        const f = outputFormat.value;
        if (f === 'jpeg') return 'jpg';
        if (f === 'png') return 'png';
        if (f === 'webp') return 'webp';
        return 'png';
    }

    function getQuality() {
        const q = parseInt(qualitySlider.value || '85', 10);
        return Math.max(1, Math.min(100, q));
    }

    function computeTargetDimensions(srcW, srcH) {
        const neverUp = !!neverUpscale.checked;

        let targetW;
        let targetH;

        if (resizeBy.value === 'percentage') {
            const scale = (parseFloat(scaleSlider.value || '100') || 100) / 100;
            targetW = Math.round(srcW * scale);
            targetH = Math.round(srcH * scale);
        } else {
            const wInput = resizeWidth.value;
            const hInput = resizeHeight.value;

            const w = wInput === '' ? null : parseInt(wInput, 10);
            const h = hInput === '' ? null : parseInt(hInput, 10);

            if (w && h) {
                targetW = w;
                targetH = h;
            } else if (w) {
                targetW = w;
                targetH = Math.round((w / srcW) * srcH);
            } else if (h) {
                targetH = h;
                targetW = Math.round((h / srcH) * srcW);
            } else {
                targetW = srcW;
                targetH = srcH;
            }
        }

        // Never upscale
        if (neverUp) {
            targetW = Math.min(targetW, srcW);
            targetH = Math.min(targetH, srcH);

            // keep aspect consistency when only one dimension was implied
            // (best-effort; we still honor fitMode later)
        }

        // Ensure non-zero
        targetW = Math.max(1, targetW);
        targetH = Math.max(1, targetH);

        return { targetW, targetH };
    }

    async function renderResizedImage(img, target) {
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;

        let outW = target.targetW;
        let outH = target.targetH;

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');

        // Background (only matters for cover when cropping; also for PNG output)
        // For PNG/JPEG transparency behavior is handled below.
        let bg = (bgColorText?.value || bgColor?.value || '#ffffff').trim();
        if (/^[0-9a-fA-F]{3,8}$/.test(bg)) {
            bg = '#' + bg;
        }

        // Modes
        const mode = fitMode.value;

        if (mode === 'stretch') {
            ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, outW, outH);
        } else if (mode === 'fit') {
            // letterbox with background
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, outW, outH);

            const scale = Math.min(outW / srcW, outH / srcH);
            const dw = srcW * scale;
            const dh = srcH * scale;
            const dx = Math.round((outW - dw) / 2);
            const dy = Math.round((outH - dh) / 2);
            ctx.drawImage(img, 0, 0, srcW, srcH, dx, dy, Math.round(dw), Math.round(dh));
        } else {
            // cover: crop to fill
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, outW, outH);

            const scale = Math.max(outW / srcW, outH / srcH);
            const sw = outW / scale;
            const sh = outH / scale;
            const sx = Math.round((srcW - sw) / 2);
            const sy = Math.round((srcH - sh) / 2);

            ctx.drawImage(img, sx, sy, Math.round(sw), Math.round(sh), 0, 0, outW, outH);
        }

        const { mimeType, outExt } = getMimeAndExt();
        return { outCanvas: canvas, mimeType, outExt };
    }

    function getMimeAndExt() {
        const f = outputFormat.value;
        if (f === 'jpeg') return { mimeType: 'image/jpeg', outExt: 'jpg' };
        if (f === 'png') return { mimeType: 'image/png', outExt: 'png' };
        if (f === 'webp') return { mimeType: 'image/webp', outExt: 'webp' };
        return { mimeType: 'image/png', outExt: 'png' };
    }

    function canvasToBlob(canvas, mimeType, quality) {
        return new Promise((resolve, reject) => {
            // quality ignored for png
            const q = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? quality / 100 : undefined;
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
                mimeType,
                q
            );
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


    function loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
            img.src = url;
        });
    }

    function formatBytes(bytes) {
        const num = Number(bytes || 0);
        if (num < 1024) return `${num} B`;
        const units = ['KB', 'MB', 'GB'];
        let u = -1;
        let n = num;
        do {
            n /= 1024;
            u++;
        } while (n >= 1024 && u < units.length - 1);
        return `${n.toFixed(n >= 10 ? 1 : 2)} ${units[u]}`;
    }

    function clearAll() {
        // revoke urls
        for (const job of currentJobs) {
            if (job?.outputUrl) URL.revokeObjectURL(job.outputUrl);
        }

        selectedFiles = [];
        currentJobs = [];
        panX = 0;
        panY = 0;
        const preview = document.getElementById('resizePreview');
        if (preview) {
            preview.src = '';
            preview.style.transform = '';
        }
        imageList.innerHTML = '';

        fileInput.value = '';
        settingsSection.style.display = 'none';
        downloadBtn.style.display = 'none';
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

