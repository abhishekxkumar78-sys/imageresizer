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

    function setUIMode(mode) {
        uploadHero.style.display = 'none';
        settingsSection.style.display = 'block';

        if (mode === 'pdf') {
            if (imagePreview) imagePreview.style.display = 'none';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'flex';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'block';
            if (pdfLargeNotice) {
                pdfLargeNotice.style.display = pdfPageCount > 50 ? 'block' : 'none';
            }
            if (downloadBtn) downloadBtn.textContent = 'Download Compressed PDF';
            if (pdfFileName) pdfFileName.textContent = currentFile ? currentFile.name : 'Document.pdf';
            if (pdfPageBadge) pdfPageBadge.textContent = `${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}`;
            updateFormatDropdown('pdf');
        } else {
            if (imagePreview) imagePreview.style.display = 'block';
            if (pdfCompressPreviewCard) pdfCompressPreviewCard.style.display = 'none';
            if (pdfHonestNotice) pdfHonestNotice.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            if (downloadBtn) downloadBtn.textContent = 'Download Compressed Image';
            updateFormatDropdown('image');
        }
    }

    async function handleFile(file) {
        const isPdfFile = isPdf(file);
        const isImgFile = file.type.startsWith('image/');

        if (!isPdfFile && !isImgFile) {
            alert('Please select a valid image or PDF file.');
            return;
        }

        currentFile = file;

        if (isPdfFile) {
            await handlePdfFile(file);
            return;
        }

        // Image flow (intact)
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

            // CRITICAL: Always use { ignoreEncryption: true } to safely handle owner passwords
            const pdfDoc = await window.PDFLib.PDFDocument.load(
                arrayBuffer.slice ? arrayBuffer.slice(0) : arrayBuffer,
                { ignoreEncryption: true }
            );
            pdfPageCount = pdfDoc.getPageCount();

            setUIMode('pdf');
            await renderPdfPagesPreview();
        } catch (err) {
            console.error('Error loading PDF:', err);
            alert('Could not load the PDF file: ' + (err && err.message ? err.message : 'Unknown error') + '. Please ensure it is a valid, uncorrupted PDF.');
        }
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
            if (downloadBtn) downloadBtn.textContent = 'Download Compressed Image';
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
            if (currentFileType === 'pdf') {
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
            if (currentFileType === 'pdf') {
                updatePdfPreview();
            } else {
                processCompression();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
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
