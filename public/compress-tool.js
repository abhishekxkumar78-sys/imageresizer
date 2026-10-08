document.addEventListener('DOMContentLoaded', () => {
    const uploadHero = document.getElementById('uploadHero');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const fileInput = document.getElementById('fileInput');
    const settingsSection = document.getElementById('settingsSection');
    const imagePreview = document.getElementById('imagePreview');

    const formatSelect = document.getElementById('formatSelect');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const originalSizeEl = document.getElementById('originalSize');
    const compressedSizeEl = document.getElementById('compressedSize');
    const savedPercentageEl = document.getElementById('savedPercentage');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let imgElement = null;
    let currentBlob = null;

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

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        currentFile = file;
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
        processCompression();
    }

    if (qualitySlider) {
        qualitySlider.addEventListener('input', onQualityChange);
        qualitySlider.addEventListener('change', onQualityChange);
    }

    if (formatSelect) {
        formatSelect.addEventListener('change', processCompression);
    }

    const targetFileSize = document.getElementById('targetFileSize');
    const targetFileSizeUnit = document.getElementById('targetFileSizeUnit');
    if (targetFileSize) {
        targetFileSize.addEventListener('input', processCompression);
        targetFileSize.addEventListener('change', processCompression);
    }
    if (targetFileSizeUnit) {
        targetFileSizeUnit.addEventListener('change', processCompression);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
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
