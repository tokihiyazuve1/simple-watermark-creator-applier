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

// ===== Preview =====
let previewAbort = null;

async function updatePreview() {
    if (state.selectedImage === null || state.selectedWatermark === null) {
        previewImage.hidden = true;
        previewPlaceholder.hidden = false;
        return;
    }

    if (previewAbort) previewAbort.abort();
    previewAbort = new AbortController();

    const loader = document.createElement('div');
    loader.className = 'preview-loading';
    loader.innerHTML = '<div class="spinner"></div>';
    previewContainer.appendChild(loader);

    try {
        const formData = new FormData();
        formData.append('image', state.images[state.selectedImage].file);
        formData.append('watermark', state.watermarks[state.selectedWatermark].file);

        const res = await fetch('/api/preview', {
            method: 'POST',
            body: formData,
            signal: previewAbort.signal,
        });

        if (!res.ok) throw new Error('Preview failed');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        if (previewImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage.src);
        }

        previewImage.src = url;
        previewImage.hidden = false;
        previewPlaceholder.hidden = true;
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Preview error:', err);
        }
    } finally {
        loader.remove();
    }
}

// ===== Process & Download =====
async function processAndDownload() {
    const formData = new FormData();

    state.images.forEach((img, i) => {
        formData.append(`images_${i}`, img.file);
        formData.append(`paths_${i}`, img.relativePath);
    });
    state.watermarks.forEach((wm, i) => {
        formData.append(`watermarks_${i}`, wm.file);
    });

    // Show progress
    progressSection.hidden = false;
    progressBar.style.width = '0%';
    progressLog.innerHTML = '';
    btnProcess.disabled = true;

    addLogEntry('Processing images...', '');

    // Animate progress bar (indeterminate-ish)
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress = Math.min(progress + 2, 90);
        progressBar.style.width = `${progress}%`;
    }, 200);

    try {
        const res = await fetch('/api/process', {
            method: 'POST',
            body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Processing failed');
        }

        progressBar.style.width = '100%';
        addLogEntry(`✓ Processing complete!`, 'success');
        addLogEntry('Starting download...', '');

        // Download the ZIP
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watermarked.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addLogEntry(`✓ Downloaded watermarked.zip (${(blob.size / 1024 / 1024).toFixed(1)} MB)`, 'done');
    } catch (err) {
        clearInterval(progressInterval);
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
