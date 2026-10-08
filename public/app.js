/* ============================================
   ImageResizer — App Logic
   ============================================ */

(function () {
    'use strict';

    // ── DOM Elements ──
    const uploadHero = document.getElementById('uploadHero');
    const cropToolSection = document.getElementById('cropToolSection');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInputSidebar = document.getElementById('fileInputSidebar');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const uploadSidebarBtn = document.getElementById('uploadSidebarBtn');

    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const canvasPlaceholder = document.getElementById('canvasPlaceholder');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropBox = document.getElementById('cropBox');

    const cropWidthInput = document.getElementById('cropWidth');
    const cropHeightInput = document.getElementById('cropHeight');
    const cropXInput = document.getElementById('cropX');
    const cropYInput = document.getElementById('cropY');
    const aspectRatioSelect = document.getElementById('aspectRatio');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    const rulerH = document.getElementById('rulerH');
    const rulerV = document.getElementById('rulerV');

    // ── State ──
    let originalImage = null;
    let imgWidth = 0;
    let imgHeight = 0;
    let displayScale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let zoom = 1;

    // Crop box state (in display pixels, relative to canvas wrapper)
    let crop = { x: 0, y: 0, w: 800, h: 550 };
    let isDragging = false;
    let isResizing = false;
    let activeHandle = '';
    let dragStart = { x: 0, y: 0 };
    let cropStart = { x: 0, y: 0, w: 0, h: 0 };

    // ── Initialization ──
    function init() {
        bindEvents();
        generateRulers();
    }

    // ── Event Bindings ──
    function bindEvents() {
        // File upload events
        selectImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        uploadDropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        fileInputSidebar.addEventListener('change', handleFileSelect);
        uploadSidebarBtn.addEventListener('click', () => fileInputSidebar.click());

        // Drag & Drop
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
            if (e.dataTransfer.files.length) {
                loadImage(e.dataTransfer.files[0]);
            }
        });

        // Crop box interactions
        cropBox.addEventListener('mousedown', onCropMouseDown);
        document.addEventListener('mousemove', onCropMouseMove);
        document.addEventListener('mouseup', onCropMouseUp);

        // Touch support
        cropBox.addEventListener('touchstart', onCropTouchStart, { passive: false });
        document.addEventListener('touchmove', onCropTouchMove, { passive: false });
        document.addEventListener('touchend', onCropTouchEnd);

        // Handle clicks
        document.querySelectorAll('.crop-handle').forEach(handle => {
            handle.addEventListener('mousedown', onHandleMouseDown);
            handle.addEventListener('touchstart', onHandleTouchStart, { passive: false });
        });

        // Sidebar inputs
        cropWidthInput.addEventListener('change', onDimensionChange);
        cropHeightInput.addEventListener('change', onDimensionChange);
        cropXInput.addEventListener('change', onPositionChange);
        cropYInput.addEventListener('change', onPositionChange);
        aspectRatioSelect.addEventListener('change', onAspectRatioChange);

        // Buttons
        resetBtn.addEventListener('click', resetCrop);
        downloadBtn.addEventListener('click', downloadCrop);

        // Zoom
        canvasWrapper.addEventListener('wheel', onWheel, { passive: false });

        // Window resize
        window.addEventListener('resize', () => {
            if (originalImage) {
                renderImage();
                generateRulers();
            }
        });
    }

    // ── File Handling ──
    function handleFileSelect(e) {
        if (e.target.files && e.target.files.length) {
            loadImage(e.target.files[0]);
        }
    }

    function loadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                imgWidth = img.naturalWidth;
                imgHeight = img.naturalHeight;
                zoom = 1;
                showCropTool();
                renderImage();
                resetCrop();
                generateRulers();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function showCropTool() {
        uploadHero.style.display = 'none';
        cropToolSection.style.display = 'block';
        canvasPlaceholder.style.display = 'none';
        cropOverlay.style.display = 'block';
    }

    // ── Rendering ──
    function renderImage() {
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const wW = wrapperRect.width;
        const wH = wrapperRect.height;

        // Calculate scale to fit image in wrapper
        const scaleX = wW / imgWidth;
        const scaleY = wH / imgHeight;
        displayScale = Math.min(scaleX, scaleY, 1) * zoom;

        const dw = imgWidth * displayScale;
        const dh = imgHeight * displayScale;

        // Center the image
        offsetX = (wW - dw) / 2;
        offsetY = (wH - dh) / 2;

        imageCanvas.width = wW;
        imageCanvas.height = wH;

        ctx.clearRect(0, 0, wW, wH);
        ctx.drawImage(originalImage, offsetX, offsetY, dw, dh);
    }

    // ── Crop Box Logic ──
    function resetCrop() {
        if (!originalImage) return;

        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const wW = wrapperRect.width;
        const wH = wrapperRect.height;

        const dw = imgWidth * displayScale;
        const dh = imgHeight * displayScale;

        // Set crop to cover the displayed image area
        crop.x = offsetX;
        crop.y = offsetY;
        crop.w = dw;
        crop.h = dh;

        updateCropBox();
        updateSidebarInputs();
    }

    function updateCropBox() {
        cropBox.style.left = crop.x + 'px';
        cropBox.style.top = crop.y + 'px';
        cropBox.style.width = crop.w + 'px';
        cropBox.style.height = crop.h + 'px';
    }

    function updateSidebarInputs() {
        // Convert display pixels to actual image pixels
        const realX = Math.max(0, Math.round((crop.x - offsetX) / displayScale));
        const realY = Math.max(0, Math.round((crop.y - offsetY) / displayScale));
        const realW = Math.round(crop.w / displayScale);
        const realH = Math.round(crop.h / displayScale);

        cropWidthInput.value = realW;
        cropHeightInput.value = realH;
        cropXInput.value = realX;
        cropYInput.value = realY;
    }

    // ── Mouse Events for Crop Box ──
    function onCropMouseDown(e) {
        if (e.target.classList.contains('crop-handle')) return;
        e.preventDefault();
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        cropStart = { ...crop };
    }

    function onCropMouseMove(e) {
        if (isDragging) {
            e.preventDefault();
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            moveCrop(dx, dy);
        }
        if (isResizing) {
            e.preventDefault();
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            resizeCrop(dx, dy);
        }
    }

    function onCropMouseUp() {
        isDragging = false;
        isResizing = false;
    }

    function onHandleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        activeHandle = e.target.dataset.handle;
        dragStart = { x: e.clientX, y: e.clientY };
        cropStart = { ...crop };
    }

    // ── Touch Events ──
    function onCropTouchStart(e) {
        if (e.target.classList.contains('crop-handle')) return;
        e.preventDefault();
        const t = e.touches[0];
        isDragging = true;
        dragStart = { x: t.clientX, y: t.clientY };
        cropStart = { ...crop };
    }

    function onCropTouchMove(e) {
        const t = e.touches[0];
        if (isDragging) {
            e.preventDefault();
            const dx = t.clientX - dragStart.x;
            const dy = t.clientY - dragStart.y;
            moveCrop(dx, dy);
        }
        if (isResizing) {
            e.preventDefault();
            const dx = t.clientX - dragStart.x;
            const dy = t.clientY - dragStart.y;
            resizeCrop(dx, dy);
        }
    }

    function onCropTouchEnd() {
        isDragging = false;
        isResizing = false;
    }

    function onHandleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const t = e.touches[0];
        isResizing = true;
        activeHandle = e.target.dataset.handle;
        dragStart = { x: t.clientX, y: t.clientY };
        cropStart = { ...crop };
    }

    // ── Movement & Resizing ──
    function moveCrop(dx, dy) {
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        let newX = cropStart.x + dx;
        let newY = cropStart.y + dy;

        // Constrain to wrapper
        newX = Math.max(0, Math.min(newX, wrapperRect.width - crop.w));
        newY = Math.max(0, Math.min(newY, wrapperRect.height - crop.h));

        crop.x = newX;
        crop.y = newY;
        updateCropBox();
        updateSidebarInputs();
    }

    function resizeCrop(dx, dy) {
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const minSize = 20;
        const ratio = getAspectRatio();

        let newX = cropStart.x;
        let newY = cropStart.y;
        let newW = cropStart.w;
        let newH = cropStart.h;

        switch (activeHandle) {
            case 'se':
                newW = Math.max(minSize, cropStart.w + dx);
                newH = ratio ? newW / ratio : Math.max(minSize, cropStart.h + dy);
                break;
            case 'sw':
                newW = Math.max(minSize, cropStart.w - dx);
                newH = ratio ? newW / ratio : Math.max(minSize, cropStart.h + dy);
                newX = cropStart.x + cropStart.w - newW;
                break;
            case 'ne':
                newW = Math.max(minSize, cropStart.w + dx);
                newH = ratio ? newW / ratio : Math.max(minSize, cropStart.h - dy);
                newY = ratio ? cropStart.y + cropStart.h - newH : cropStart.y + cropStart.h - newH;
                if (!ratio) newY = cropStart.y + cropStart.h - newH;
                break;
            case 'nw':
                newW = Math.max(minSize, cropStart.w - dx);
                newH = ratio ? newW / ratio : Math.max(minSize, cropStart.h - dy);
                newX = cropStart.x + cropStart.w - newW;
                newY = cropStart.y + cropStart.h - newH;
                break;
            case 'n':
                newH = Math.max(minSize, cropStart.h - dy);
                if (ratio) newW = newH * ratio;
                newY = cropStart.y + cropStart.h - newH;
                break;
            case 's':
                newH = Math.max(minSize, cropStart.h + dy);
                if (ratio) newW = newH * ratio;
                break;
            case 'e':
                newW = Math.max(minSize, cropStart.w + dx);
                if (ratio) newH = newW / ratio;
                break;
            case 'w':
                newW = Math.max(minSize, cropStart.w - dx);
                if (ratio) newH = newW / ratio;
                newX = cropStart.x + cropStart.w - newW;
                break;
        }

        // Constrain within wrapper
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newW > wrapperRect.width) newW = wrapperRect.width - newX;
        if (newY + newH > wrapperRect.height) newH = wrapperRect.height - newY;

        crop.x = newX;
        crop.y = newY;
        crop.w = newW;
        crop.h = newH;

        updateCropBox();
        updateSidebarInputs();
    }

    function getAspectRatio() {
        const val = aspectRatioSelect.value;
        if (val === 'free') return null;
        const parts = val.split(':');
        return parseFloat(parts[0]) / parseFloat(parts[1]);
    }

    // ── Sidebar Input Handlers ──
    function onDimensionChange() {
        let w = parseInt(cropWidthInput.value) || 100;
        let h = parseInt(cropHeightInput.value) || 100;

        // Clamp to image dimensions
        w = Math.min(w, imgWidth);
        h = Math.min(h, imgHeight);

        crop.w = w * displayScale;
        crop.h = h * displayScale;

        // Make sure crop fits in wrapper
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        if (crop.x + crop.w > wrapperRect.width) {
            crop.x = Math.max(0, wrapperRect.width - crop.w);
        }
        if (crop.y + crop.h > wrapperRect.height) {
            crop.y = Math.max(0, wrapperRect.height - crop.h);
        }

        updateCropBox();
        updateSidebarInputs();
    }

    function onPositionChange() {
        let x = parseInt(cropXInput.value) || 0;
        let y = parseInt(cropYInput.value) || 0;

        crop.x = offsetX + x * displayScale;
        crop.y = offsetY + y * displayScale;

        const wrapperRect = canvasWrapper.getBoundingClientRect();
        crop.x = Math.max(0, Math.min(crop.x, wrapperRect.width - crop.w));
        crop.y = Math.max(0, Math.min(crop.y, wrapperRect.height - crop.h));

        updateCropBox();
        updateSidebarInputs();
    }

    function onAspectRatioChange() {
        const ratio = getAspectRatio();
        if (!ratio) return;

        // Adjust height based on current width
        crop.h = crop.w / ratio;

        const wrapperRect = canvasWrapper.getBoundingClientRect();
        if (crop.y + crop.h > wrapperRect.height) {
            crop.h = wrapperRect.height - crop.y;
            crop.w = crop.h * ratio;
        }

        updateCropBox();
        updateSidebarInputs();
    }

    // ── Zoom ──
    function onWheel(e) {
        if (!originalImage) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoom = Math.max(0.1, Math.min(5, zoom + delta));

        renderImage();
        generateRulers();
    }

    // ── Download ──
    function downloadCrop() {
        if (!originalImage) {
            alert('Please upload an image first.');
            return;
        }

        // Calculate actual pixel coordinates from display coordinates
        const realX = Math.max(0, (crop.x - offsetX) / displayScale);
        const realY = Math.max(0, (crop.y - offsetY) / displayScale);
        const realW = crop.w / displayScale;
        const realH = crop.h / displayScale;

        // Create output canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = Math.round(realW);
        outCanvas.height = Math.round(realH);
        const outCtx = outCanvas.getContext('2d');

        outCtx.drawImage(
            originalImage,
            realX, realY, realW, realH,
            0, 0, outCanvas.width, outCanvas.height
        );

        // Check for optional target file size
        const targetBytes = getTargetBytes();
        if (targetBytes) {
            adjustCanvasToTarget(outCanvas, 'image/png', targetBytes).then(blob => {
                const link = document.createElement('a');
                link.download = 'cropped-image.png';
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            });
            return;
        }

        // Trigger download
        const link = document.createElement('a');
        link.download = 'cropped-image.png';
        link.href = outCanvas.toDataURL('image/png');
        link.click();
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

    async function adjustCanvasToTarget(canvas, mimeType, targetBytes) {
        if (!targetBytes || targetBytes <= 0) return null;
        let initialBlob = await new Promise(r => canvas.toBlob(r, mimeType));
        if (initialBlob && initialBlob.size <= targetBytes) return initialBlob;
        let bestBlob = initialBlob;
        let bestDiff = Math.abs((initialBlob ? initialBlob.size : 0) - targetBytes);
        let currentSize = initialBlob ? initialBlob.size : targetBytes * 2;
        let scale = 1.0;

        for (let i = 0; i < 7; i++) {
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
        return bestBlob;
    }

    // ── Rulers ──
    function generateRulers() {
        generateHorizontalRuler();
        generateVerticalRuler();
    }

    function generateHorizontalRuler() {
        rulerH.innerHTML = '';
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const width = wrapperRect.width;

        for (let px = 0; px < width; px += 10) {
            const isMajor = px % 50 === 0;
            const tick = document.createElement('div');
            tick.className = 'ruler-tick' + (isMajor ? '' : ' minor');
            tick.style.left = (px + 20) + 'px';
            if (isMajor) {
                const realPx = originalImage ? Math.round((px - offsetX) / displayScale) : px;
                tick.textContent = realPx;
            }
            rulerH.appendChild(tick);
        }
    }

    function generateVerticalRuler() {
        rulerV.innerHTML = '';
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        const height = wrapperRect.height;

        for (let px = 0; px < height; px += 10) {
            const isMajor = px % 50 === 0;
            const tick = document.createElement('div');
            tick.className = 'ruler-tick' + (isMajor ? '' : ' minor');
            tick.style.top = px + 'px';
            if (isMajor) {
                const realPx = originalImage ? Math.round((px - offsetY) / displayScale) : px;
                tick.textContent = realPx;
            }
            rulerV.appendChild(tick);
        }
    }

    // ── Scroll to Tool ──
    window.scrollToTool = function () {
        if (cropToolSection.style.display === 'none') {
            // If no image loaded yet, scroll to upload
            uploadHero.scrollIntoView({ behavior: 'smooth' });
        } else {
            cropToolSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // ── Start ──
    init();
})();
