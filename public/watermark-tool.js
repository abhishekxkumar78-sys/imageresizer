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

    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const pdfPreviewCard = document.getElementById('pdfPreviewCard');
    const removePdfBtn = document.getElementById('removePdfBtn');
    const pdfFileName = document.getElementById('pdfFileName');
    const pdfPageBadge = document.getElementById('pdfPageBadge');
    const pdfPagesContainer = document.getElementById('pdfPagesContainer');
    const pdfPreviewFootnote = document.getElementById('pdfPreviewFootnote');
    const applyPagesContainer = document.getElementById('applyPagesContainer');
    const applyPagesSelect = document.getElementById('applyPagesSelect');
    const customRangeContainer = document.getElementById('customRangeContainer');
    const pageRangeInput = document.getElementById('pageRangeInput');
    const targetFileSizeContainer = document.getElementById('targetFileSizeContainer');
    const pdfTargetSizeNote = document.getElementById('pdfTargetSizeNote');
    const pdfLargeNotice = document.getElementById('pdfLargeNotice');

    const PREVIEW_PAGE_LIMIT = 4;

    let currentFile = null;
    let currentFileType = 'image';
    let imgElement = null;
    let currentCanvas = null;
    let originalPdfBytes = null;
    let pdfPageCount = 0;

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

    function parsePageRange(str, pageCount) {
        if (!str || typeof str !== 'string' || !pageCount || pageCount < 1) return [];
        const pages = new Set();
        const tokens = str.split(',');
        for (const rawToken of tokens) {
            const token = rawToken.trim();
            if (!token) continue;
            if (token.includes('-')) {
                const parts = token.split('-');
                if (parts.length !== 2) continue;
                const startStr = parts[0].trim();
                const endStr = parts[1].trim();
                if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) continue;
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (isNaN(start) || isNaN(end)) continue;
                const minVal = Math.min(start, end);
                const maxVal = Math.max(start, end);
                const from = Math.max(1, Math.min(minVal, pageCount));
                const to = Math.max(1, Math.min(maxVal, pageCount));
                for (let i = from; i <= to; i++) {
                    pages.add(i);
                }
            } else {
                if (!/^\d+$/.test(token)) continue;
                const num = parseInt(token, 10);
                if (isNaN(num)) continue;
                const clamped = Math.max(1, Math.min(num, pageCount));
                pages.add(clamped);
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }
    window.parsePageRange = parsePageRange;

    function hexToPdfRgb(hex) {
        if (!hex || typeof hex !== 'string') return window.PDFLib.rgb(1, 1, 1);
        let cleanHex = hex.replace('#', '').trim();
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        if (cleanHex.length !== 6) return window.PDFLib.rgb(1, 1, 1);
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
        return window.PDFLib.rgb(
            isNaN(r) ? 1 : Math.max(0, Math.min(1, r)),
            isNaN(g) ? 1 : Math.max(0, Math.min(1, g)),
            isNaN(b) ? 1 : Math.max(0, Math.min(1, b))
        );
    }

    function isColorLight(hex) {
        if (!hex || typeof hex !== 'string') return true;
        let clean = hex.replace('#', '').trim();
        if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
        if (clean.length !== 6) return true;
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 180;
    }

    function setUIMode(mode) {
        uploadHero.style.display = 'none';
        settingsSection.style.display = 'block';

        if (mode === 'pdf') {
            if (imagePreview) imagePreview.style.display = 'none';
            if (pdfPreviewCard) pdfPreviewCard.style.display = 'flex';
            if (applyPagesContainer) applyPagesContainer.style.display = 'block';
            if (targetFileSizeContainer) targetFileSizeContainer.style.display = 'none';
            if (pdfTargetSizeNote) pdfTargetSizeNote.style.display = 'block';
            if (downloadBtn) downloadBtn.textContent = 'Download Watermarked PDF';
            if (pdfLargeNotice) {
                pdfLargeNotice.style.display = pdfPageCount > 50 ? 'block' : 'none';
            }
            if (pdfFileName) pdfFileName.textContent = currentFile ? currentFile.name : 'Document.pdf';
            if (pdfPageBadge) pdfPageBadge.textContent = `${pdfPageCount} page${pdfPageCount === 1 ? '' : 's'}`;
            updatePdfFootnote();
        } else {
            if (imagePreview) imagePreview.style.display = 'block';
            if (pdfPreviewCard) pdfPreviewCard.style.display = 'none';
            if (applyPagesContainer) applyPagesContainer.style.display = 'none';
            if (targetFileSizeContainer) targetFileSizeContainer.style.display = 'block';
            if (pdfTargetSizeNote) pdfTargetSizeNote.style.display = 'none';
            if (pdfLargeNotice) pdfLargeNotice.style.display = 'none';
            if (downloadBtn) downloadBtn.textContent = 'Download Watermarked Image';
        }
    }

    function updatePdfFootnote() {
        if (!pdfPreviewFootnote) return;
        const isCustom = applyPagesSelect && applyPagesSelect.value === 'custom';
        const customRangeStr = pageRangeInput ? pageRangeInput.value.trim() : '';
        const targetPages = isCustom ? parsePageRange(customRangeStr, pdfPageCount) : null;

        let targetDesc = 'all pages';
        if (isCustom) {
            targetDesc = customRangeStr ? `your selected range (${customRangeStr})` : 'all pages';
        }

        const previewCount = Math.min(PREVIEW_PAGE_LIMIT, pdfPageCount);
        let anyPreviewedPageTargeted = false;
        for (let p = 1; p <= previewCount; p++) {
            if (!isCustom || (targetPages && targetPages.includes(p))) {
                anyPreviewedPageTargeted = true;
                break;
            }
        }

        if (isCustom && !anyPreviewedPageTargeted && targetPages && targetPages.length > 0) {
            pdfPreviewFootnote.textContent = `Your selected pages (${customRangeStr}) are beyond the preview — overlay not shown here, but will be applied on download.`;
        } else if (pdfPageCount > PREVIEW_PAGE_LIMIT) {
            pdfPreviewFootnote.textContent = `Showing preview of first ${PREVIEW_PAGE_LIMIT} pages. Watermark will still be applied to ${targetDesc} on download.`;
        } else {
            pdfPreviewFootnote.textContent = `PDF loaded • Watermark will be applied to ${targetDesc} on download.`;
        }
    }

    function renderPdfWatermarkOverlays() {
        if (!pdfPagesContainer) return;

        const text = (textInput && textInput.value) || '© Watermark';
        const fontSize = parseInt(fontSizeSlider ? fontSizeSlider.value : 48, 10);
        const opacity = parseInt(opacitySlider ? opacitySlider.value : 70, 10) / 100;
        const position = positionSelect ? positionSelect.value : 'center';
        const baseColor = colorSelect ? colorSelect.value : 'white';

        let color = '#ffffff';
        if (baseColor === 'black') {
            color = '#000000';
        } else if (baseColor === 'custom') {
            color = (customColorHex && customColorHex.value) || (customColorPicker && customColorPicker.value) || '#6366f1';
        }

        const isLightColor = (baseColor === 'white') || (baseColor === 'custom' && isColorLight(color));

        const isCustom = applyPagesSelect && applyPagesSelect.value === 'custom';
        const customRangeStr = pageRangeInput ? pageRangeInput.value.trim() : '';
        const targetPages = isCustom ? parsePageRange(customRangeStr, pdfPageCount) : null;

        const pageItems = pdfPagesContainer.querySelectorAll('.pdf-page-item');
        pageItems.forEach(item => {
            const pageNum = parseInt(item.dataset.pageNum, 10);
            const overlay = item.querySelector('.pdf-page-overlay');
            const wrapper = item.querySelector('.pdf-canvas-wrapper');
            if (!overlay || !wrapper) return;

            const isTargeted = !isCustom || (targetPages && targetPages.includes(pageNum));
            if (!isTargeted) {
                overlay.style.display = 'none';
                return;
            }

            overlay.style.display = 'block';
            overlay.textContent = text;
            overlay.style.color = color;
            overlay.style.opacity = opacity;

            if (isLightColor) {
                overlay.style.textShadow = '0 0 2px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(0, 0, 0, 0.4)';
            } else {
                overlay.style.textShadow = 'none';
            }

            const wrapperWidth = wrapper.offsetWidth || 230;
            const previewScale = wrapperWidth / 595;
            const scaledFontSize = Math.max(10, Math.round(fontSize * previewScale));
            overlay.style.fontSize = `${scaledFontSize}px`;

            const pad = `${Math.max(6, Math.round(scaledFontSize * 0.7))}px`;
            overlay.style.left = '';
            overlay.style.right = '';
            overlay.style.top = '';
            overlay.style.bottom = '';
            overlay.style.transform = '';

            if (position === 'center') {
                overlay.style.left = '50%';
                overlay.style.top = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
            } else if (position === 'top-left') {
                overlay.style.left = pad;
                overlay.style.top = pad;
            } else if (position === 'top-right') {
                overlay.style.right = pad;
                overlay.style.top = pad;
            } else if (position === 'bottom-left') {
                overlay.style.left = pad;
                overlay.style.bottom = pad;
            } else if (position === 'bottom-right') {
                overlay.style.right = pad;
                overlay.style.bottom = pad;
            }
        });

        if (fontSizeValue) fontSizeValue.textContent = fontSize + 'px';
        if (opacityValue) opacityValue.textContent = (opacitySlider ? opacitySlider.value : 70) + '%';

        updatePdfFootnote();
    }

    async function renderPdfPagesPreview() {
        if (!pdfPagesContainer || !originalPdfBytes) return;
        pdfPagesContainer.innerHTML = '';

        if (!window.pdfjsLib) {
            console.warn('pdfjsLib is not loaded');
            return;
        }

        try {
            const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(originalPdfBytes.slice(0)) });
            const pdfDoc = await loadingTask.promise;
            const pagesToRender = Math.min(PREVIEW_PAGE_LIMIT, pdfDoc.numPages);

            for (let p = 1; p <= pagesToRender; p++) {
                const page = await pdfDoc.getPage(p);
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const targetWidth = 230;
                const scale = targetWidth / unscaledViewport.width;
                const viewport = page.getViewport({ scale });

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
                pageLabel.style.color = 'var(--text-secondary, #94a3b8)';
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
                canvasWrapper.style.width = `${Math.floor(viewport.width)}px`;
                canvasWrapper.style.height = `${Math.floor(viewport.height)}px`;

                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page-canvas';
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                canvas.style.display = 'block';
                canvas.style.width = '100%';
                canvas.style.height = '100%';

                const overlay = document.createElement('span');
                overlay.className = 'pdf-page-overlay';
                overlay.style.position = 'absolute';
                overlay.style.fontFamily = "'Inter', sans-serif";
                overlay.style.fontWeight = '700';
                overlay.style.whiteSpace = 'nowrap';
                overlay.style.pointerEvents = 'none';

                canvasWrapper.appendChild(canvas);
                canvasWrapper.appendChild(overlay);
                pageItem.appendChild(pageLabel);
                pageItem.appendChild(canvasWrapper);
                pdfPagesContainer.appendChild(pageItem);

                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;
            }

            renderPdfWatermarkOverlays();
        } catch (err) {
            console.error('Error rendering PDF preview pages:', err);
        }
    }

    function renderPdfPreview() {
        renderPdfWatermarkOverlays();
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
                const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer.slice ? arrayBuffer.slice(0) : arrayBuffer, { ignoreEncryption: true });
                pdfPageCount = pdfDoc.getPageCount();

                setUIMode('pdf');
                await renderPdfPagesPreview();
            } catch (err) {
                console.error('Error loading PDF:', err);
                alert('Could not load the PDF file. Please ensure it is a valid, uncorrupted PDF.');
            }
        } else {
            currentFileType = 'image';
            setUIMode('image');
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

    function updatePreview() {
        if (currentFileType === 'pdf') {
            renderPdfPreview();
        } else {
            renderWatermark();
        }
    }

    if (textInput) textInput.addEventListener('input', updatePreview);
    if (fontSizeSlider) fontSizeSlider.addEventListener('input', updatePreview);
    if (opacitySlider) opacitySlider.addEventListener('input', updatePreview);
    if (colorSelect) {
        const onColorChange = () => {
            if (customColorContainer) {
                customColorContainer.style.display = colorSelect.value === 'custom' ? 'block' : 'none';
            }
            updatePreview();
        };
        colorSelect.addEventListener('change', onColorChange);
        colorSelect.addEventListener('input', onColorChange);
    }

    if (customColorPicker) {
        customColorPicker.addEventListener('input', (e) => {
            if (customColorHex) customColorHex.value = e.target.value;
            updatePreview();
        });
        customColorPicker.addEventListener('change', (e) => {
            if (customColorHex) customColorHex.value = e.target.value;
            updatePreview();
        });
    }

    if (customColorHex) {
        const onHexUpdate = (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#') && /^[0-9A-F]{3,6}$/i.test(val)) {
                val = '#' + val;
            }
            if (/^#[0-9A-F]{6}$/i.test(val) && customColorPicker) {
                customColorPicker.value = val;
            }
            updatePreview();
        };
        customColorHex.addEventListener('input', onHexUpdate);
        customColorHex.addEventListener('change', onHexUpdate);
    }
    if (positionSelect) {
        positionSelect.addEventListener('change', updatePreview);
        positionSelect.addEventListener('input', updatePreview);
    }

    if (applyPagesSelect) {
        applyPagesSelect.addEventListener('change', () => {
            if (customRangeContainer) {
                customRangeContainer.style.display = applyPagesSelect.value === 'custom' ? 'block' : 'none';
            }
            updatePreview();
        });
    }

    if (pageRangeInput) {
        pageRangeInput.addEventListener('input', updatePreview);
        pageRangeInput.addEventListener('change', updatePreview);
    }

    if (removePdfBtn) {
        removePdfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            originalPdfBytes = null;
            pdfPageCount = 0;
            currentFile = null;
            currentFileType = 'image';
            if (pdfPagesContainer) pdfPagesContainer.innerHTML = '';
            if (fileInput) fileInput.value = '';
            if (settingsSection) settingsSection.style.display = 'none';
            if (uploadHero) uploadHero.style.display = 'block';
            if (pdfPreviewCard) pdfPreviewCard.style.display = 'none';
            if (imagePreview) imagePreview.style.display = 'block';
        });
    }

    async function watermarkPdfAndDownload() {
        if (!originalPdfBytes || !currentFile) return;

        const originalBtnText = downloadBtn.textContent;
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Processing PDF...';

        if (pdfPageCount > 50 && pdfLargeNotice) {
            pdfLargeNotice.style.display = 'block';
        }

        try {
            const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
            const pdfDoc = await PDFDocument.load(originalPdfBytes.slice ? originalPdfBytes.slice(0) : originalPdfBytes, { ignoreEncryption: true });
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const text = (textInput && textInput.value) || '© Watermark';
            const fontSize = parseInt(fontSizeSlider ? fontSizeSlider.value : 48, 10);
            const opacity = parseInt(opacitySlider ? opacitySlider.value : 70, 10) / 100;
            const position = positionSelect ? positionSelect.value : 'center';
            const baseColor = colorSelect ? colorSelect.value : 'white';

            let pdfRgbColor = rgb(1, 1, 1);
            if (baseColor === 'black') {
                pdfRgbColor = rgb(0, 0, 0);
            } else if (baseColor === 'custom') {
                const hex = (customColorHex && customColorHex.value) || (customColorPicker && customColorPicker.value) || '#6366f1';
                pdfRgbColor = hexToPdfRgb(hex);
            }

            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textHeight = font.heightAtSize(fontSize);
            const margin = fontSize;

            let targetPageNumbers = [];
            if (applyPagesSelect && applyPagesSelect.value === 'custom') {
                targetPageNumbers = parsePageRange(pageRangeInput ? pageRangeInput.value : '', pdfPageCount);
                if (targetPageNumbers.length === 0) {
                    targetPageNumbers = Array.from({ length: pdfPageCount }, (_, i) => i + 1);
                }
            } else {
                targetPageNumbers = Array.from({ length: pdfPageCount }, (_, i) => i + 1);
            }

            for (let i = 0; i < targetPageNumbers.length; i++) {
                const pageIndex = targetPageNumbers[i] - 1;
                if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;

                const page = pdfDoc.getPage(pageIndex);
                const pageWidth = page.getWidth();
                const pageHeight = page.getHeight();

                let x = (pageWidth - textWidth) / 2;
                let y = (pageHeight - textHeight) / 2;

                if (position === 'top-left') {
                    x = margin;
                    y = pageHeight - margin - textHeight;
                } else if (position === 'top-right') {
                    x = pageWidth - margin - textWidth;
                    y = pageHeight - margin - textHeight;
                } else if (position === 'bottom-left') {
                    x = margin;
                    y = margin;
                } else if (position === 'bottom-right') {
                    x = pageWidth - margin - textWidth;
                    y = margin;
                }

                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: pdfRgbColor,
                    opacity
                });

                if (targetPageNumbers.length > 20 && i > 0 && i % 10 === 0) {
                    await new Promise(r => requestAnimationFrame(r));
                }
            }

            const watermarkedBytes = await pdfDoc.save();
            const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });

            const originalName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'watermarked-document';
            const fileName = `${originalName}-watermarked.pdf`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Error watermarking PDF:', err);
            alert('Could not generate the watermarked PDF: ' + (err && err.message ? err.message : 'Unknown error') + '. Please try a different PDF or contact support if this persists.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalBtnText;
        }
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            if (currentFileType === 'pdf') {
                await watermarkPdfAndDownload();
                return;
            }

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
