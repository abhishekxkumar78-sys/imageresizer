document.addEventListener('DOMContentLoaded', () => {
    const uploadHero = document.getElementById('uploadHero');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.getElementById('settingsSection');
    const imagePreview = document.getElementById('imagePreview');

    const textInput = document.getElementById('watermarkText');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const colorSelect = document.getElementById('colorSelect');
    const customColorContainer = document.getElementById('customColorContainer');
    const customColorPicker = document.getElementById('customColorPicker');
    const customColorHex = document.getElementById('customColorHex');
    const positionSelect = document.getElementById('positionSelect');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let imgElement = null;
    let currentCanvas = null;

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

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement = new Image();
            imgElement.onload = () => {
                uploadHero.style.display = 'none';
                settingsSection.style.display = 'block';
                renderWatermark();
            };
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderWatermark() {
        if (!imgElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(imgElement, 0, 0);

        const text = textInput.value || '© Watermark';
        const fontSize = parseInt(fontSizeSlider.value, 10);
        const opacity = parseInt(opacitySlider.value, 10) / 100;
        const position = positionSelect.value;
        const baseColor = colorSelect.value;

        // Set text properties
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.globalAlpha = opacity;

        let color = '#ffffff';
        if (baseColor === 'black') {
            color = '#000000';
        } else if (baseColor === 'custom') {
            color = (customColorHex && customColorHex.value) || (customColorPicker && customColorPicker.value) || '#6366f1';
        }
        ctx.fillStyle = color;

        // Position math
        const margin = fontSize;
        let x = canvas.width / 2;
        let y = canvas.height / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (position === 'top-left') {
            x = margin;
            y = margin;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
        } else if (position === 'top-right') {
            x = canvas.width - margin;
            y = margin;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
        } else if (position === 'bottom-left') {
            x = margin;
            y = canvas.height - margin;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
        } else if (position === 'bottom-right') {
            x = canvas.width - margin;
            y = canvas.height - margin;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
        }

        // Draw text shadow for contrast
        ctx.shadowColor = opacity > 0.5 ? 'rgba(0, 0, 0, 0.4)' : 'transparent';
        ctx.shadowBlur = 6;
        ctx.fillText(text, x, y);

        currentCanvas = canvas;
        imagePreview.src = canvas.toDataURL('image/png');

        fontSizeValue.textContent = fontSize + 'px';
        opacityValue.textContent = opacitySlider.value + '%';
    }

    if (textInput) textInput.addEventListener('input', renderWatermark);
    if (fontSizeSlider) fontSizeSlider.addEventListener('input', renderWatermark);
    if (opacitySlider) opacitySlider.addEventListener('input', renderWatermark);
    if (colorSelect) {
        colorSelect.addEventListener('change', () => {
            if (customColorContainer) {
                customColorContainer.style.display = colorSelect.value === 'custom' ? 'block' : 'none';
            }
            renderWatermark();
        });
    }

    if (customColorPicker) {
        customColorPicker.addEventListener('input', (e) => {
            if (customColorHex) customColorHex.value = e.target.value;
            renderWatermark();
        });
    }

    if (customColorHex) {
        customColorHex.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value) && customColorPicker) {
                customColorPicker.value = e.target.value;
            }
            renderWatermark();
        });
    }
    if (positionSelect) positionSelect.addEventListener('change', renderWatermark);

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            if (!currentCanvas || !currentFile) return;

            const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'watermarked-image';
            const fileName = originalName + '-watermarked.png';

            const targetBytes = getTargetBytes();
            let blob = null;
            if (targetBytes) {
                blob = await adjustCanvasToTarget(currentCanvas, 'image/png', targetBytes);
            }
            if (!blob) {
                blob = await new Promise(r => currentCanvas.toBlob(r, 'image/png'));
            }
            if (!blob) return;

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
