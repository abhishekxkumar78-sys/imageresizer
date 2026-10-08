document.addEventListener('DOMContentLoaded', () => {
    const uploadHero = document.getElementById('uploadHero');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectImagesBtn = document.getElementById('selectImagesBtn');
    const fileInput = document.getElementById('fileInput');
    const addMoreInput = document.getElementById('addMoreInput');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const settingsSection = document.getElementById('settingsSection');
    const thumbnailGrid = document.getElementById('thumbnailGrid');

    const orientationSelect = document.getElementById('orientationSelect');
    const marginSelect = document.getElementById('marginSelect');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const imageCountBadge = document.getElementById('imageCountBadge');

    let imageList = [];

    if (selectImagesBtn && fileInput) {
        selectImagesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (addMoreBtn && addMoreInput) {
        addMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addMoreInput.click();
        });
    }

    if (uploadDropzone) {
        uploadDropzone.addEventListener('click', (e) => {
            // Don't trigger if clicking the button itself (it has its own handler)
            if (e.target !== selectImagesBtn && e.target !== addMoreBtn) {
                fileInput.click();
            }
        });
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
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(Array.from(e.target.files));
            }
        });
    }

    if (addMoreInput) {
        addMoreInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFiles(Array.from(e.target.files));
                addMoreInput.value = '';
            }
        });
    }

    function handleFiles(files) {
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }

        let loadedCount = 0;
        validFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    imageList.push({
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        file: file,
                        dataUrl: e.target.result,
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });

                    loadedCount++;
                    if (loadedCount === validFiles.length) {
                        uploadHero.style.display = 'none';
                        settingsSection.style.display = 'block';
                        renderThumbnails();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderThumbnails() {
        thumbnailGrid.innerHTML = '';
        imageCountBadge.textContent = `${imageList.length} ${imageList.length === 1 ? 'Image' : 'Images'}`;

        if (imageList.length === 0) {
            uploadHero.style.display = 'flex';
            settingsSection.style.display = 'none';
            return;
        }

        imageList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'pdf-thumb-card';
            card.style.cssText = 'width:100%; background:var(--bg-light); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; display:flex; align-items:center; gap:16px; margin-bottom:12px; box-sizing:border-box;';

            card.innerHTML = `
                <div style="width:60px; height:60px; border-radius:6px; overflow:hidden; background:#eee; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                    <img src="${item.dataUrl}" alt="${item.name}" style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
                <div style="flex:1; min-width:0;">
                    <strong style="display:block; font-size:14px; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Page ${index + 1}: ${item.name}</strong>
                    <span style="font-size:12px; color:var(--text-muted);">${item.width} × ${item.height} px</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button class="btn-move-up" data-index="${index}" ${index === 0 ? 'disabled style="opacity:0.4;"' : ''} style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:12px;">&uarr;</button>
                    <button class="btn-move-down" data-index="${index}" ${index === imageList.length - 1 ? 'disabled style="opacity:0.4;"' : ''} style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:12px;">&darr;</button>
                    <button class="btn-remove" data-index="${index}" style="padding:6px 10px; border-radius:6px; border:1px solid #fee2e2; background:#fff5f5; color:#ef4444; cursor:pointer; font-weight:700; font-size:12px;">✕</button>
                </div>
            `;

            thumbnailGrid.appendChild(card);
        });

        // Event delegation for reordering and removal
        thumbnailGrid.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                if (idx > 0) {
                    const temp = imageList[idx];
                    imageList[idx] = imageList[idx - 1];
                    imageList[idx - 1] = temp;
                    renderThumbnails();
                }
            });
        });

        thumbnailGrid.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                if (idx < imageList.length - 1) {
                    const temp = imageList[idx];
                    imageList[idx] = imageList[idx + 1];
                    imageList[idx + 1] = temp;
                    renderThumbnails();
                }
            });
        });

        thumbnailGrid.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                imageList.splice(idx, 1);
                renderThumbnails();
            });
        });
    }

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            if (imageList.length === 0) return;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('PDF library is loading. Please try again in a moment.');
                return;
            }

            const targetBytes = getTargetBytes();

            if (!targetBytes) {
                // Default behavior when no target size specified
                const doc = await createPdfDoc(null, 1.0);
                if (doc) doc.save('converted-images.pdf');
                return;
            }

            // Target size optimization
            let bestDoc = null;
            let bestBlob = null;
            let bestDiff = Infinity;

            let low = 0.05, high = 0.95;
            for (let iter = 0; iter < 6; iter++) {
                const midQ = (low + high) / 2;
                const doc = await createPdfDoc(midQ, 1.0);
                const blob = doc.output('blob');
                const diff = Math.abs(blob.size - targetBytes);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestBlob = blob;
                    bestDoc = doc;
                }
                if (blob.size > targetBytes) {
                    high = midQ;
                } else {
                    low = midQ;
                }
            }

            if (bestBlob && bestBlob.size > targetBytes * 1.15) {
                let scale = Math.min(0.9, Math.sqrt(targetBytes / bestBlob.size));
                for (let step = 0; step < 3; step++) {
                    if (scale < 0.1) break;
                    let sLow = 0.05, sHigh = 0.9;
                    for (let j = 0; j < 4; j++) {
                        const midQ = (sLow + sHigh) / 2;
                        const doc = await createPdfDoc(midQ, scale);
                        const blob = doc.output('blob');
                        const diff = Math.abs(blob.size - targetBytes);
                        if (diff < bestDiff) {
                            bestDiff = diff;
                            bestBlob = blob;
                            bestDoc = doc;
                        }
                        if (blob.size > targetBytes) sHigh = midQ;
                        else sLow = midQ;
                    }
                    if (bestBlob && bestBlob.size <= targetBytes * 1.05) break;
                    scale *= 0.85;
                }
            }

            if (bestDoc) {
                const pdfBlob = bestDoc.output('blob');
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'converted-images.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
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

    function getImageDataUrl(item, quality, scale = 1.0) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const w = Math.max(10, Math.round(img.naturalWidth * scale));
                const h = Math.max(10, Math.round(img.naturalHeight * scale));
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(item.dataUrl);
            img.src = item.dataUrl;
        });
    }

    async function createPdfDoc(quality, scale = 1.0) {
        const { jsPDF } = window.jspdf;
        const orientationMode = orientationSelect.value;
        const marginMode = marginSelect.value;
        let doc = null;

        for (let index = 0; index < imageList.length; index++) {
            const item = imageList[index];
            let orientation = 'portrait';
            if (orientationMode === 'landscape') orientation = 'landscape';
            else if (orientationMode === 'portrait') orientation = 'portrait';
            else orientation = item.width > item.height ? 'landscape' : 'portrait';

            if (index === 0) {
                doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
            } else {
                doc.addPage('a4', orientation);
            }

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = marginMode === 'small' ? 10 : 0;
            const printableWidth = pageWidth - (margin * 2);
            const printableHeight = pageHeight - (margin * 2);

            const imgAspect = item.width / item.height;
            const pageAspect = printableWidth / printableHeight;
            let drawWidth = printableWidth;
            let drawHeight = printableHeight;
            if (imgAspect > pageAspect) {
                drawHeight = printableWidth / imgAspect;
            } else {
                drawWidth = printableHeight * imgAspect;
            }
            const x = margin + (printableWidth - drawWidth) / 2;
            const y = margin + (printableHeight - drawHeight) / 2;

            let dataUrl = item.dataUrl;
            let format = item.file.type === 'image/png' ? 'PNG' : 'JPEG';
            if (quality !== null) {
                dataUrl = await getImageDataUrl(item, quality, scale);
                format = 'JPEG';
            }
            doc.addImage(dataUrl, format, x, y, drawWidth, drawHeight);
        }
        return doc;
    }
});
