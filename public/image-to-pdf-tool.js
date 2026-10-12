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
    const pdfPageNotice = document.getElementById('pdfPageNotice');
    const largePdfNotice = document.getElementById('largePdfNotice');

    // Lightbox / Preview Modal elements
    const previewModal = document.getElementById('previewModal');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewModalTitle = document.getElementById('previewModalTitle');
    const previewModalBody = document.getElementById('previewModalBody');
    const previewLoadingIndicator = document.getElementById('previewLoadingIndicator');
    const previewModalImg = document.getElementById('previewModalImg');
    const previewZoomBar = document.getElementById('previewZoomBar');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomResetBtn = document.getElementById('zoomResetBtn');

    // Pin pdf.js worker URL
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    let imageList = [];
    const sourcePdfs = new Map(); // sourceId -> { bytes: ArrayBuffer, name: string }

    // Drag-and-drop, Auto-Scroll & Preview State
    let draggedItemIndex = null;
    let isDragging = false;
    let autoScrollRafId = null;
    let autoScrollVelocity = 0; // px/frame (< 0 for UP, > 0 for DOWN, 0 for idle)
    let dragPointerClientX = null;
    let dragPointerClientY = null;
    let currentDropTargetIndex = null;
    let activePreviewItemId = null;
    let currentZoom = 100;
    let baseFitWidth = 0;
    let baseFitHeight = 0;

    // Lightbox Zoom Controls
    function applyZoom(newZoom) {
        if (!previewModalImg) return;
        currentZoom = Math.max(30, Math.min(300, Math.round(newZoom)));
        if (zoomSlider) zoomSlider.value = currentZoom;
        if (zoomResetBtn) zoomResetBtn.textContent = currentZoom + '%';

        if (currentZoom === 100) {
            previewModalImg.style.maxWidth = '85vw';
            previewModalImg.style.maxHeight = '70vh';
            previewModalImg.style.width = 'auto';
            previewModalImg.style.height = 'auto';
        } else if (baseFitWidth > 0 && baseFitHeight > 0) {
            const factor = currentZoom / 100;
            previewModalImg.style.maxWidth = 'none';
            previewModalImg.style.maxHeight = 'none';
            previewModalImg.style.width = Math.round(baseFitWidth * factor) + 'px';
            previewModalImg.style.height = Math.round(baseFitHeight * factor) + 'px';
        }
    }

    // On-demand High-Resolution PDF Page Renderer for Crisp Zoom
    async function getHighResPdfPagePreview(item) {
        if (item._highResPreview) {
            return item._highResPreview;
        }

        const srcInfo = sourcePdfs.get(item.sourceId);
        if (!srcInfo || !srcInfo.bytes || !window.pdfjsLib) {
            return item.dataUrl;
        }

        // Re-slice ArrayBuffer to avoid detached buffer issues
        const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(srcInfo.bytes.slice(0)) });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(item.pageIndex + 1);
        const unscaledVp = page.getViewport({ scale: 1.0 });

        // Target ~2400px on the longer side for crisp detail up to 300% zoom
        const maxDim = Math.max(unscaledVp.width, unscaledVp.height);
        const targetLongerSide = 2400;
        const highScale = Math.max(1.5, targetLongerSide / maxDim);
        const viewport = page.getViewport({ scale: highScale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        const highResUrl = canvas.toDataURL('image/png');
        item._highResPreview = highResUrl;
        return highResUrl;
    }

    async function openPreviewModal(item, pageNumber) {
        if (!previewModal || !previewModalImg) return;
        activePreviewItemId = item.id;

        if (previewModalTitle) {
            previewModalTitle.textContent = `Page ${pageNumber}: ${item.name}`;
        }

        // Reset zoom to default 100% fit on each open
        currentZoom = 100;
        if (zoomSlider) zoomSlider.value = 100;
        if (zoomResetBtn) zoomResetBtn.textContent = '100%';

        previewModalImg.style.maxWidth = '85vw';
        previewModalImg.style.maxHeight = '70vh';
        previewModalImg.style.width = 'auto';
        previewModalImg.style.height = 'auto';

        if (previewModalBody) {
            previewModalBody.scrollTop = 0;
            previewModalBody.scrollLeft = 0;
        }

        previewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (item.type === 'pdf-page') {
            if (item._highResPreview) {
                // Use cached high-res render immediately
                if (previewLoadingIndicator) previewLoadingIndicator.style.display = 'none';
                previewModalImg.style.display = 'block';
                previewModalImg.onload = () => {
                    if (activePreviewItemId !== item.id) return;
                    baseFitWidth = previewModalImg.clientWidth || previewModalImg.naturalWidth;
                    baseFitHeight = previewModalImg.clientHeight || previewModalImg.naturalHeight;
                    applyZoom(100);
                };
                previewModalImg.src = item._highResPreview;
            } else {
                // Show loading state while generating high-res version on the fly
                if (previewLoadingIndicator) previewLoadingIndicator.style.display = 'flex';
                previewModalImg.style.display = 'none';

                try {
                    const highResUrl = await getHighResPdfPagePreview(item);
                    if (activePreviewItemId !== item.id) return; // switched or closed
                    if (previewLoadingIndicator) previewLoadingIndicator.style.display = 'none';
                    previewModalImg.style.display = 'block';
                    previewModalImg.onload = () => {
                        if (activePreviewItemId !== item.id) return;
                        baseFitWidth = previewModalImg.clientWidth || previewModalImg.naturalWidth;
                        baseFitHeight = previewModalImg.clientHeight || previewModalImg.naturalHeight;
                        applyZoom(100);
                    };
                    previewModalImg.src = highResUrl;
                } catch (err) {
                    console.error('Failed to render high-res PDF preview:', err);
                    if (activePreviewItemId !== item.id) return;
                    if (previewLoadingIndicator) previewLoadingIndicator.style.display = 'none';
                    previewModalImg.style.display = 'block';
                    previewModalImg.onload = () => {
                        if (activePreviewItemId !== item.id) return;
                        baseFitWidth = previewModalImg.clientWidth || previewModalImg.naturalWidth;
                        baseFitHeight = previewModalImg.clientHeight || previewModalImg.naturalHeight;
                        applyZoom(100);
                    };
                    previewModalImg.src = item.dataUrl;
                }
            }
        } else {
            // Image item: item.dataUrl is already the original full-resolution image
            if (previewLoadingIndicator) previewLoadingIndicator.style.display = 'none';
            previewModalImg.style.display = 'block';
            previewModalImg.onload = () => {
                if (activePreviewItemId !== item.id) return;
                baseFitWidth = previewModalImg.clientWidth || previewModalImg.naturalWidth;
                baseFitHeight = previewModalImg.clientHeight || previewModalImg.naturalHeight;
                applyZoom(100);
            };
            previewModalImg.src = item.dataUrl;
        }
    }

    function closePreviewModal() {
        if (!previewModal) return;
        activePreviewItemId = null;
        previewModal.style.display = 'none';
        if (previewModalImg) {
            previewModalImg.src = '';
            previewModalImg.style.display = 'block';
        }
        if (previewLoadingIndicator) {
            previewLoadingIndicator.style.display = 'none';
        }
        document.body.style.overflow = '';
        currentZoom = 100;
        baseFitWidth = 0;
        baseFitHeight = 0;
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closePreviewModal();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyZoom(currentZoom - 15);
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyZoom(currentZoom + 15);
        });
    }

    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            applyZoom(parseFloat(e.target.value));
        });
        zoomSlider.addEventListener('click', (e) => e.stopPropagation());
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyZoom(100);
        });
    }

    if (previewZoomBar) {
        previewZoomBar.addEventListener('click', (e) => e.stopPropagation());
    }

    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal || e.target === previewModalBody) {
                closePreviewModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && previewModal && previewModal.style.display !== 'none') {
            closePreviewModal();
        }
    });

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

    function isPdf(file) {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    }

    async function handleFiles(files) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        const pdfFiles = files.filter(f => isPdf(f));

        if (imageFiles.length === 0 && pdfFiles.length === 0) {
            alert('Please select valid image or PDF files.');
            return;
        }

        // Process images
        if (imageFiles.length > 0) {
            await processImageFiles(imageFiles);
        }

        // Process PDFs
        for (const pdfFile of pdfFiles) {
            await expandPdfIntoQueue(pdfFile);
        }

        uploadHero.style.display = 'none';
        settingsSection.style.display = 'block';
        renderThumbnails();
    }

    function processImageFiles(imageFiles) {
        return new Promise((resolve) => {
            let loadedCount = 0;
            imageFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        imageList.push({
                            id: Date.now() + Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            file: file,
                            type: 'image',
                            dataUrl: e.target.result,
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        });

                        loadedCount++;
                        if (loadedCount === imageFiles.length) {
                            resolve();
                        }
                    };
                    img.onerror = () => {
                        loadedCount++;
                        if (loadedCount === imageFiles.length) {
                            resolve();
                        }
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    loadedCount++;
                    if (loadedCount === imageFiles.length) {
                        resolve();
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }

    async function expandPdfIntoQueue(file) {
        if (!window.pdfjsLib) {
            alert('PDF viewer library is still loading. Please try again in a moment.');
            return;
        }

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

            const sourceId = 'src_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sourcePdfs.set(sourceId, { bytes: arrayBuffer, name: file.name });

            // Load via pdf.js with fresh buffer slice to prevent detached ArrayBuffer errors
            const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
            const pdfDoc = await loadingTask.promise;
            const numPages = pdfDoc.numPages;

            if (numPages > 50 && largePdfNotice) {
                largePdfNotice.textContent = `Large PDF — adding ${numPages} pages, this may take a moment...`;
                largePdfNotice.style.display = 'block';
            }

            for (let p = 1; p <= numPages; p++) {
                const page = await pdfDoc.getPage(p);
                const unscaledViewport = page.getViewport({ scale: 1.0 });

                // Render small thumbnail (~120px width)
                const targetWidth = 120;
                const scale = targetWidth / unscaledViewport.width;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                await page.render({ canvasContext: ctx, viewport }).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                imageList.push({
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: `${file.name} — Page ${p}`,
                    type: 'pdf-page',
                    sourceId: sourceId,
                    pageIndex: p - 1,
                    dataUrl: dataUrl,
                    width: Math.round(unscaledViewport.width),
                    height: Math.round(unscaledViewport.height)
                });

                // Yield to event loop periodically during thumbnail generation for large PDFs
                if (p % 10 === 0) {
                    await new Promise(r => requestAnimationFrame(r));
                }
            }
        } catch (err) {
            console.error('Error expanding PDF:', err);
            alert('Could not process PDF file "' + file.name + '": ' + (err && err.message ? err.message : 'Unknown error'));
        } finally {
            if (largePdfNotice) {
                largePdfNotice.style.display = 'none';
            }
        }
    }

    // Auto-Scroll Engine for Drag-and-Drop Reordering
    function getScrollContainer() {
        let el = thumbnailGrid ? thumbnailGrid.parentElement : null;
        while (el && el !== document.body && el !== document.documentElement) {
            const style = window.getComputedStyle(el);
            if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
                return el;
            }
            el = el.parentElement;
        }
        return window;
    }

    const ZONE_SIZE = 90; // Edge threshold in px (between 60-100px)
    const EDGE_ACCEL_ZONE = 30; // Close-to-edge acceleration zone in px (< 30px)
    const MIN_SPEED = 6;  // px/frame (fine control near 90px threshold)
    const MAX_SPEED = 60; // px/frame (fast travel near boundary)
    const SPEED_MULTIPLIER = 3; // 3x speed multiplier for both upward and downward auto-scrolling

    function updateAutoScrollVelocity(clientY) {
        if (!isDragging || clientY === null || clientY === undefined) {
            autoScrollVelocity = 0;
            return;
        }

        const container = getScrollContainer();
        let topBoundary = 0;
        let bottomBoundary = window.innerHeight;

        if (container !== window) {
            const rect = container.getBoundingClientRect();
            topBoundary = rect.top;
            bottomBoundary = rect.bottom;
        } else {
            const header = document.querySelector('.header') || document.querySelector('header');
            if (header) {
                const headerRect = header.getBoundingClientRect();
                if (headerRect.bottom > 0) {
                    topBoundary = headerRect.bottom;
                }
            }
        }

        if (clientY < topBoundary + ZONE_SIZE) {
            // Within top edge zone -> auto-scroll UP
            const dist = Math.max(0, clientY - topBoundary);
            const ratio = Math.max(0, Math.min(1, 1 - (dist / ZONE_SIZE)));
            const baseSpeed = Math.round(MIN_SPEED + (MAX_SPEED - MIN_SPEED) * ratio);
            const speed = (dist < EDGE_ACCEL_ZONE ? baseSpeed * 2 : baseSpeed) * SPEED_MULTIPLIER;
            autoScrollVelocity = -speed;
            startAutoScroll();
        } else if (clientY > bottomBoundary - ZONE_SIZE) {
            // Within bottom edge zone -> auto-scroll DOWN
            const dist = Math.max(0, bottomBoundary - clientY);
            const ratio = Math.max(0, Math.min(1, 1 - (dist / ZONE_SIZE)));
            const baseSpeed = Math.round(MIN_SPEED + (MAX_SPEED - MIN_SPEED) * ratio);
            const speed = (dist < EDGE_ACCEL_ZONE ? baseSpeed * 2 : baseSpeed) * SPEED_MULTIPLIER;
            autoScrollVelocity = speed;
            startAutoScroll();
        } else {
            // Safe middle zone -> stop scrolling immediately
            autoScrollVelocity = 0;
        }
    }

    function startAutoScroll() {
        if (autoScrollRafId !== null) return;

        function scrollStep() {
            if (!isDragging || autoScrollVelocity === 0) {
                autoScrollRafId = null;
                return;
            }

            const container = getScrollContainer();
            if (container === window) {
                if (typeof window.scrollBy === 'function') {
                    window.scrollBy({ top: autoScrollVelocity, behavior: 'instant' });
                } else {
                    if (document.documentElement) document.documentElement.scrollTop += autoScrollVelocity;
                    if (document.body) document.body.scrollTop += autoScrollVelocity;
                }
            } else {
                container.scrollTop += autoScrollVelocity;
            }

            // Real-time update of drop-target highlight as cards scroll past pointer
            updateCardUnderPointer();

            autoScrollRafId = requestAnimationFrame(scrollStep);
        }

        autoScrollRafId = requestAnimationFrame(scrollStep);
    }

    function stopAutoScroll() {
        autoScrollVelocity = 0;
        if (autoScrollRafId !== null) {
            cancelAnimationFrame(autoScrollRafId);
            autoScrollRafId = null;
        }
    }

    function highlightDropTarget(targetIdx) {
        currentDropTargetIndex = targetIdx;
        const cards = thumbnailGrid.querySelectorAll('.pdf-thumb-card');
        cards.forEach((c) => {
            const idx = parseInt(c.getAttribute('data-index'), 10);
            if (idx === targetIdx && idx !== draggedItemIndex) {
                c.classList.add('drag-over');
                c.style.borderColor = 'var(--primary)';
                c.style.boxShadow = '0 0 0 2px var(--primary)';
            } else {
                c.classList.remove('drag-over');
                if (!c.classList.contains('is-dragging')) {
                    c.style.borderColor = 'var(--border)';
                    c.style.boxShadow = 'none';
                }
            }
        });
    }

    function updateCardUnderPointer() {
        if (dragPointerClientX === null || dragPointerClientY === null) return;
        const el = document.elementFromPoint(dragPointerClientX, dragPointerClientY);
        if (!el) return;
        const card = el.closest('.pdf-thumb-card');
        if (card) {
            const targetIdx = parseInt(card.getAttribute('data-index'), 10);
            if (!isNaN(targetIdx)) {
                highlightDropTarget(targetIdx);
            }
        }
    }

    // Window/Document-level dragover to keep pointer tracked across header/footer/whitespace
    document.addEventListener('dragover', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
        dragPointerClientX = e.clientX;
        dragPointerClientY = e.clientY;
        updateAutoScrollVelocity(e.clientY);
    });

    document.addEventListener('drop', (e) => {
        if (!isDragging) return;
        stopAutoScroll();
        if (draggedItemIndex !== null && currentDropTargetIndex !== null && draggedItemIndex !== currentDropTargetIndex) {
            const [movedItem] = imageList.splice(draggedItemIndex, 1);
            imageList.splice(currentDropTargetIndex, 0, movedItem);
            renderThumbnails();
        }
    });

    window.addEventListener('dragend', () => {
        stopAutoScroll();
    });

    function renderThumbnails() {
        thumbnailGrid.innerHTML = '';
        imageCountBadge.textContent = `${imageList.length} ${imageList.length === 1 ? 'Page' : 'Pages'}`;

        const hasPdf = imageList.some(item => item.type === 'pdf-page');
        if (pdfPageNotice) {
            pdfPageNotice.style.display = hasPdf ? 'block' : 'none';
        }

        if (imageList.length === 0) {
            uploadHero.style.display = 'flex';
            settingsSection.style.display = 'none';
            return;
        }

        imageList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'pdf-thumb-card';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-index', String(index));
            card.style.cssText = 'width:100%; background:var(--bg-light); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; display:flex; align-items:center; gap:12px; margin-bottom:12px; box-sizing:border-box; cursor:pointer; transition:border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, opacity 0.15s ease; user-select:none;';

            const dimText = item.type === 'pdf-page'
                ? `${item.width} × ${item.height} pt (PDF Page)`
                : `${item.width} × ${item.height} px`;

            card.innerHTML = `
                <div class="drag-handle" style="cursor:grab; display:flex; align-items:center; justify-content:center; width:20px; color:var(--text-muted); flex-shrink:0; padding:2px;" title="Drag to reorder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
                        <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                        <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                    </svg>
                </div>
                <div class="thumb-preview-wrap" style="width:60px; height:60px; border-radius:6px; overflow:hidden; background:#eee; flex-shrink:0; display:flex; align-items:center; justify-content:center; position:relative;">
                    <img src="${item.dataUrl}" alt="${item.name}" style="max-width:100%; max-height:100%; object-fit:contain; transition:transform 0.15s ease;">
                </div>
                <div style="flex:1; min-width:0;">
                    <strong style="display:block; font-size:14px; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Page ${index + 1}: ${item.name}</strong>
                    <span style="font-size:12px; color:var(--text-muted);">${dimText}</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button class="btn-move-up" data-index="${index}" ${index === 0 ? 'disabled style="opacity:0.4; cursor:default;"' : ''} style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:12px;">&uarr;</button>
                    <button class="btn-move-down" data-index="${index}" ${index === imageList.length - 1 ? 'disabled style="opacity:0.4; cursor:default;"' : ''} style="padding:6px 10px; border-radius:6px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:12px;">&darr;</button>
                    <button class="btn-remove" data-index="${index}" style="padding:6px 10px; border-radius:6px; border:1px solid #fee2e2; background:#fff5f5; color:#ef4444; cursor:pointer; font-weight:700; font-size:12px;">✕</button>
                </div>
            `;

            // Hover effects on card
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('is-dragging') && !card.classList.contains('drag-over')) {
                    card.style.borderColor = 'var(--primary)';
                    card.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.15)';
                    const thumbImg = card.querySelector('.thumb-preview-wrap img');
                    if (thumbImg) thumbImg.style.transform = 'scale(1.08)';
                }
            });
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('is-dragging') && !card.classList.contains('drag-over')) {
                    card.style.borderColor = 'var(--border)';
                    card.style.boxShadow = 'none';
                    const thumbImg = card.querySelector('.thumb-preview-wrap img');
                    if (thumbImg) thumbImg.style.transform = 'scale(1)';
                }
            });

            // Whole-card click-to-preview (Issue 1)
            card.addEventListener('click', (e) => {
                if (isDragging) return;
                // Exclude clicks on up/down/remove buttons
                if (e.target.closest('.btn-move-up') || e.target.closest('.btn-move-down') || e.target.closest('.btn-remove')) {
                    return;
                }
                openPreviewModal(item, index + 1);
            });

            // HTML5 Drag-and-Drop Reordering with Auto-Scroll (Issue 3)
            card.addEventListener('dragstart', (e) => {
                draggedItemIndex = index;
                isDragging = true;
                card.classList.add('is-dragging');
                card.style.opacity = '0.4';
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                }
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'move';
                }
                dragPointerClientX = e.clientX;
                dragPointerClientY = e.clientY;
                updateAutoScrollVelocity(e.clientY);
                highlightDropTarget(index);
            });

            card.addEventListener('dragleave', () => {
                // Handled cleanly by highlightDropTarget
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                stopAutoScroll();
                const fromIdx = draggedItemIndex;
                const toIdx = (currentDropTargetIndex !== null) ? currentDropTargetIndex : index;
                if (fromIdx !== null && fromIdx !== toIdx) {
                    const [movedItem] = imageList.splice(fromIdx, 1);
                    imageList.splice(toIdx, 0, movedItem);
                    renderThumbnails();
                } else {
                    renderThumbnails();
                }
            });

            card.addEventListener('dragend', () => {
                stopAutoScroll();
                card.classList.remove('is-dragging');
                thumbnailGrid.querySelectorAll('.pdf-thumb-card').forEach(c => {
                    c.classList.remove('drag-over');
                    c.classList.remove('is-dragging');
                    c.style.opacity = '1';
                    c.style.borderColor = 'var(--border)';
                    c.style.boxShadow = 'none';
                });
                draggedItemIndex = null;
                currentDropTargetIndex = null;
                dragPointerClientX = null;
                dragPointerClientY = null;
                setTimeout(() => {
                    isDragging = false;
                }, 100);
            });

            thumbnailGrid.appendChild(card);
        });

        // Prevent drag initiation and prevent triggering preview when clicking controls
        thumbnailGrid.querySelectorAll('.btn-move-up, .btn-move-down, .btn-remove').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const card = btn.closest('.pdf-thumb-card');
                if (card) card.setAttribute('draggable', 'false');
            });
            btn.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                const card = btn.closest('.pdf-thumb-card');
                if (card) card.setAttribute('draggable', 'true');
            });
        });

        // Event delegation for up/down reordering and removal
        thumbnailGrid.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
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
                e.stopPropagation();
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
                e.stopPropagation();
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                const removed = imageList.splice(idx, 1)[0];
                if (removed && removed.sourceId) {
                    const stillUsed = imageList.some(item => item.sourceId === removed.sourceId);
                    if (!stillUsed) {
                        sourcePdfs.delete(removed.sourceId);
                    }
                }
                renderThumbnails();
            });
        });
    }

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            if (imageList.length === 0) return;

            const hasPdfPages = imageList.some(item => item.type === 'pdf-page');

            // PURE IMAGE MODE: Use existing jsPDF path completely unchanged
            if (!hasPdfPages) {
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

                // Target size optimization (jsPDF)
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
                    downloadBlob(pdfBlob, 'converted-images.pdf');
                }
                return;
            }

            // MIXED PDF MODE: Use pdf-lib for lossless page copying and image embedding
            if (!window.PDFLib) {
                alert('PDF library is loading. Please try again in a moment.');
                return;
            }

            const originalBtnText = downloadPdfBtn.textContent;
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.textContent = 'Generating PDF...';

            try {
                const targetBytes = getTargetBytes();

                if (!targetBytes) {
                    const outDoc = await createMixedPdfDoc(null, 1.0);
                    const pdfBytes = await outDoc.save();
                    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'converted-images.pdf');
                    return;
                }

                // Target size optimization (pdf-lib mixed mode)
                let bestBytes = null;
                let bestDiff = Infinity;

                let low = 0.05, high = 0.95;
                for (let iter = 0; iter < 6; iter++) {
                    const midQ = (low + high) / 2;
                    const outDoc = await createMixedPdfDoc(midQ, 1.0);
                    const bytes = await outDoc.save();
                    const diff = Math.abs(bytes.length - targetBytes);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestBytes = bytes;
                    }
                    if (bytes.length > targetBytes) {
                        high = midQ;
                    } else {
                        low = midQ;
                    }
                }

                if (bestBytes && bestBytes.length > targetBytes * 1.15) {
                    let scale = Math.min(0.9, Math.sqrt(targetBytes / bestBytes.length));
                    for (let step = 0; step < 3; step++) {
                        if (scale < 0.1) break;
                        let sLow = 0.05, sHigh = 0.9;
                        for (let j = 0; j < 4; j++) {
                            const midQ = (sLow + sHigh) / 2;
                            const outDoc = await createMixedPdfDoc(midQ, scale);
                            const bytes = await outDoc.save();
                            const diff = Math.abs(bytes.length - targetBytes);
                            if (diff < bestDiff) {
                                bestDiff = diff;
                                bestBytes = bytes;
                            }
                            if (bytes.length > targetBytes) sHigh = midQ;
                            else sLow = midQ;
                        }
                        if (bestBytes && bestBytes.length <= targetBytes * 1.05) break;
                        scale *= 0.85;
                    }
                }

                if (bestBytes) {
                    downloadBlob(new Blob([bestBytes], { type: 'application/pdf' }), 'converted-images.pdf');
                }
            } catch (err) {
                console.error('Error generating mixed PDF:', err);
                alert('Could not generate PDF: ' + (err && err.message ? err.message : 'Unknown error'));
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.textContent = originalBtnText;
            }
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
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

    // Pure image assembly using jsPDF (kept 100% intact)
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
            let format = item.file && item.file.type === 'image/png' ? 'PNG' : 'JPEG';
            if (quality !== null) {
                dataUrl = await getImageDataUrl(item, quality, scale);
                format = 'JPEG';
            }
            doc.addImage(dataUrl, format, x, y, drawWidth, drawHeight);
        }
        return doc;
    }

    // Mixed mode assembly using pdf-lib: lossless PDF page copies + aspect-fit image embeds
    async function createMixedPdfDoc(quality, scale = 1.0) {
        const { PDFDocument } = window.PDFLib;
        const outPdf = await PDFDocument.create();

        const orientationMode = orientationSelect.value;
        const marginMode = marginSelect.value;

        // A4 in PDF points: 1 mm ≈ 2.834645669291339 points
        const MM_TO_PT = 72 / 25.4;
        const a4WidthPt = 210 * MM_TO_PT;
        const a4HeightPt = 297 * MM_TO_PT;
        const marginPt = (marginMode === 'small' ? 10 : 0) * MM_TO_PT;

        // Cache loaded source PDFDocuments per sourceId
        const loadedSourceDocs = new Map();

        for (let index = 0; index < imageList.length; index++) {
            const item = imageList[index];

            if (item.type === 'pdf-page') {
                let srcDoc = loadedSourceDocs.get(item.sourceId);
                if (!srcDoc) {
                    const srcInfo = sourcePdfs.get(item.sourceId);
                    if (!srcInfo || !srcInfo.bytes) {
                        throw new Error(`Missing source buffer for ${item.name}`);
                    }
                    // CRITICAL: Always use ignoreEncryption: true on PDFDocument.load
                    srcDoc = await PDFDocument.load(srcInfo.bytes.slice(0), { ignoreEncryption: true });
                    loadedSourceDocs.set(item.sourceId, srcDoc);
                }

                // Lossless page copying preserving dimensions
                const [copiedPage] = await outPdf.copyPages(srcDoc, [item.pageIndex]);
                outPdf.addPage(copiedPage);
            } else {
                // Image page
                let orientation = 'portrait';
                if (orientationMode === 'landscape') orientation = 'landscape';
                else if (orientationMode === 'portrait') orientation = 'portrait';
                else orientation = item.width > item.height ? 'landscape' : 'portrait';

                const pageWidthPt = orientation === 'landscape' ? a4HeightPt : a4WidthPt;
                const pageHeightPt = orientation === 'landscape' ? a4WidthPt : a4HeightPt;

                const printableWidth = pageWidthPt - (marginPt * 2);
                const printableHeight = pageHeightPt - (marginPt * 2);

                const imgAspect = item.width / item.height;
                const pageAspect = printableWidth / printableHeight;
                let drawWidth = printableWidth;
                let drawHeight = printableHeight;
                if (imgAspect > pageAspect) {
                    drawHeight = printableWidth / imgAspect;
                } else {
                    drawWidth = printableHeight * imgAspect;
                }

                const x = marginPt + (printableWidth - drawWidth) / 2;
                const y = marginPt + (printableHeight - drawHeight) / 2;

                let dataUrl = item.dataUrl;
                let isPng = item.file && item.file.type === 'image/png';
                if (quality !== null) {
                    dataUrl = await getImageDataUrl(item, quality, scale);
                    isPng = false;
                }

                const res = await fetch(dataUrl);
                const imgBytes = await res.arrayBuffer();
                let embeddedImage;
                if (isPng) {
                    embeddedImage = await outPdf.embedPng(imgBytes);
                } else {
                    embeddedImage = await outPdf.embedJpg(imgBytes);
                }

                const newPage = outPdf.addPage([pageWidthPt, pageHeightPt]);
                newPage.drawImage(embeddedImage, {
                    x,
                    y,
                    width: drawWidth,
                    height: drawHeight
                });
            }
        }

        return outPdf;
    }
});
