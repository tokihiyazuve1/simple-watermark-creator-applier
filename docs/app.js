// ===== State =====
const state = {
    images: [],       // { file: File, url: string, relativePath: string }
    watermarks: [],   // { file: File, url: string }
    selectedImage: null,
    selectedWatermark: null,
};

// ===== DOM Refs =====
const $ = (sel) => document.querySelector(sel);
const imageInput = $('#image-input');
const folderInput = $('#folder-input');
const btnAddFolder = $('#btn-add-folder');
const watermarkInput = $('#watermark-input');
const imageGrid = $('#image-grid');
const watermarkList = $('#watermark-list');
const imageCount = $('#image-count');
const watermarkCount = $('#watermark-count');
const imageDropZone = $('#image-drop-zone');
const watermarkDropZone = $('#watermark-drop-zone');
const previewImage = $('#preview-image');
const previewPlaceholder = $('#preview-placeholder');
const previewContainer = $('#preview-container');
const btnProcess = $('#btn-process');
const progressSection = $('#progress-section');
const progressBar = $('#progress-bar');
const progressLog = $('#progress-log');

const SUPPORTED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

// ===== File Handling =====
function addImages(files, fromFolder = false) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !SUPPORTED_EXTENSIONS.has(ext)) continue;

        const url = URL.createObjectURL(file);
        let relativePath = file.name;
        if (fromFolder && file.webkitRelativePath) {
            relativePath = file.webkitRelativePath;
        }

        state.images.push({ file, url, relativePath });
    }
    renderImages();
    updateProcessButton();
}

function addWatermarks(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const url = URL.createObjectURL(file);
        state.watermarks.push({ file, url });
    }
    renderWatermarks();
    updateProcessButton();
    if (state.watermarks.length && state.selectedWatermark === null) {
        selectWatermark(0);
    }
}

function removeImage(index) {
    URL.revokeObjectURL(state.images[index].url);
    state.images.splice(index, 1);
    if (state.selectedImage >= state.images.length) {
        state.selectedImage = state.images.length > 0 ? state.images.length - 1 : null;
    }
    renderImages();
    updateProcessButton();
    updatePreview();
}

function removeWatermark(index) {
    URL.revokeObjectURL(state.watermarks[index].url);
    state.watermarks.splice(index, 1);
    if (state.selectedWatermark >= state.watermarks.length) {
        state.selectedWatermark = state.watermarks.length > 0 ? state.watermarks.length - 1 : null;
    }
    renderWatermarks();
    updateProcessButton();
    updatePreview();
}

function selectImage(index) {
    state.selectedImage = index;
    renderImages();
    updatePreview();
}

function selectWatermark(index) {
    state.selectedWatermark = index;
    renderWatermarks();
    updatePreview();
}

// ===== Rendering =====
function renderImages() {
    imageCount.textContent = state.images.length;
    imageGrid.innerHTML = '';
    state.images.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = `thumb${state.selectedImage === i ? ' selected' : ''}`;
        const hasFolder = img.relativePath.includes('/');
        const folderName = hasFolder ? img.relativePath.split('/')[0] : '';
        div.innerHTML = `
      <img src="${img.url}" alt="${img.relativePath}" loading="lazy">
      ${hasFolder ? `<span class="thumb-folder">${folderName}</span>` : ''}
      <button class="thumb-remove" title="Remove">&times;</button>
    `;
        div.title = img.relativePath;
        div.addEventListener('click', (e) => {
            if (e.target.closest('.thumb-remove')) {
                e.stopPropagation();
                removeImage(i);
                return;
            }
            selectImage(i);
        });
        imageGrid.appendChild(div);
    });
}

function renderWatermarks() {
    watermarkCount.textContent = state.watermarks.length;
    watermarkList.innerHTML = '';
    state.watermarks.forEach((wm, i) => {
        const div = document.createElement('div');
        div.className = `wm-item${state.selectedWatermark === i ? ' selected' : ''}`;
        div.innerHTML = `
      <img src="${wm.url}" alt="${wm.file.name}">
      <span class="wm-item-name">${wm.file.name}</span>
      <button class="thumb-remove" title="Remove">&times;</button>
    `;
        div.addEventListener('click', (e) => {
            if (e.target.closest('.thumb-remove')) {
                e.stopPropagation();
                removeWatermark(i);
                return;
            }
            selectWatermark(i);
        });
        watermarkList.appendChild(div);
    });
}

function updateProcessButton() {
    btnProcess.disabled = state.images.length === 0 || state.watermarks.length === 0;
}

// ===== Client-side Compositing =====
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function compositeImages(baseUrl, watermarkUrl) {
    const [baseImg, wmImg] = await Promise.all([
        loadImage(baseUrl),
        loadImage(watermarkUrl),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = baseImg.width;
    canvas.height = baseImg.height;
    const ctx = canvas.getContext('2d');

    // Draw base image
    ctx.drawImage(baseImg, 0, 0);

    // Draw watermark stretched to fill
    ctx.drawImage(wmImg, 0, 0, baseImg.width, baseImg.height);

    return canvas;
}

// ===== Preview (Client-side) =====
async function updatePreview() {
    if (state.selectedImage === null || state.selectedWatermark === null) {
        previewImage.hidden = true;
        previewPlaceholder.hidden = false;
        return;
    }

    const loader = document.createElement('div');
    loader.className = 'preview-loading';
    loader.innerHTML = '<div class="spinner"></div>';
    previewContainer.appendChild(loader);

    try {
        const canvas = await compositeImages(
            state.images[state.selectedImage].url,
            state.watermarks[state.selectedWatermark].url,
        );

        if (previewImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage.src);
        }

        previewImage.src = canvas.toDataURL('image/png');
        previewImage.hidden = false;
        previewPlaceholder.hidden = true;
    } catch (err) {
        console.error('Preview error:', err);
    } finally {
        loader.remove();
    }
}

// ===== Process & Download (Client-side with JSZip) =====
async function processAndDownload() {
    progressSection.hidden = false;
    progressBar.style.width = '0%';
    progressLog.innerHTML = '';
    btnProcess.disabled = true;

    addLogEntry('Processing images...', '');

    try {
        const zip = new JSZip();
        const total = state.images.length * state.watermarks.length;
        let done = 0;

        for (const wm of state.watermarks) {
            const wmName = wm.file.name.replace(/\.[^.]+$/, '');

            for (const img of state.images) {
                const canvas = await compositeImages(img.url, wm.url);

                // Get PNG blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                // Build path: wmName/relativePath (but with .png extension)
                const baseName = img.relativePath.replace(/\.[^.]+$/, '.png');
                const zipPath = `${wmName}/${baseName}`;

                zip.file(zipPath, blob);

                done++;
                const pct = Math.round((done / total) * 100);
                progressBar.style.width = `${pct}%`;
                addLogEntry(`✓ ${zipPath}`, 'success');
            }
        }

        addLogEntry('Creating ZIP...', '');
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watermarked.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        progressBar.style.width = '100%';
        addLogEntry(`✓ Downloaded watermarked.zip (${(zipBlob.size / 1024 / 1024).toFixed(1)} MB)`, 'done');
    } catch (err) {
        addLogEntry(`Error: ${err.message}`, 'error');
    } finally {
        updateProcessButton();
    }
}

function addLogEntry(text, type = '') {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.textContent = text;
    progressLog.appendChild(div);
    progressLog.scrollTop = progressLog.scrollHeight;
}

// ===== Drag & Drop =====
function setupDropZone(zone, inputEl, handler) {
    zone.addEventListener('click', () => inputEl.click());
    inputEl.addEventListener('change', () => {
        handler(inputEl.files);
        inputEl.value = '';
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handler(e.dataTransfer.files);
    });
}

// ===== Init =====
setupDropZone(imageDropZone, imageInput, (files) => addImages(files, false));
setupDropZone(watermarkDropZone, watermarkInput, addWatermarks);

btnAddFolder.addEventListener('click', () => folderInput.click());
folderInput.addEventListener('change', () => {
    addImages(folderInput.files, true);
    folderInput.value = '';
});

btnProcess.addEventListener('click', processAndDownload);
