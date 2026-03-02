// ===== Creator State =====
const creator = {
    style: 'simple',
    fillMode: 'solid',   // solid | gradient | stripes
    color1: '#e63946',
    color2: '#1d3557',
    accent: '#f4a261',
    thickness: 14,
    badges: [],   // { text, color, position }
    storeName: '',
};

const POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-center', 'top-center'];

const BADGE_PRESETS = [
    { emoji: '🚚', text: 'GRATIS ONGKIR', color: '#d62828', position: 'bottom-center' },
    { emoji: '💰', text: 'BAYAR DITEMPAT', color: '#c1121f', position: 'bottom-left' },
    { emoji: '🛒', text: 'BISA COD', color: '#e63946', position: 'bottom-left' },
    { emoji: '⭐', text: 'SPECIAL DISCOUNT', color: '#e76f51', position: 'bottom-right' },
    { emoji: '✅', text: 'HARGA MURAH', color: '#2a9d8f', position: 'top-right' },
    { emoji: '🔥', text: 'BEST SELLER', color: '#e85d04', position: 'top-right' },
    { emoji: '💎', text: 'PREMIUM QUALITY', color: '#7209b7', position: 'top-left' },
    { emoji: '🏷️', text: 'PROMO', color: '#f77f00', position: 'top-center' },
    { emoji: '📦', text: 'READY STOCK', color: '#0077b6', position: 'top-left' },
    { emoji: '💯', text: 'ORIGINAL 100%', color: '#38b000', position: 'top-right' },
    { emoji: '🎁', text: 'BONUS GIFT', color: '#9d4edd', position: 'bottom-right' },
    { emoji: '⚡', text: 'FLASH SALE', color: '#ff006e', position: 'top-center' },
];

const canvas = document.getElementById('creator-canvas');
const ctx = canvas.getContext('2d');
const SIZE = 800;

// ===== DOM =====
const color1Input = document.getElementById('cr-color1');
const color2Input = document.getElementById('cr-color2');
const accentInput = document.getElementById('cr-accent');
const thicknessInput = document.getElementById('cr-thickness');
const thicknessVal = document.getElementById('cr-thickness-val');
const storeNameInput = document.getElementById('cr-store-name');
const btnExport = document.getElementById('btn-export');
const btnAddBadge = document.getElementById('btn-add-badge');
const badgeListEl = document.getElementById('badge-list');
const badgePresetsEl = document.getElementById('badge-presets');

// ===== Controls =====

// Border style
document.querySelectorAll('#border-style-grid .style-card').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#border-style-grid .style-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        creator.style = btn.dataset.style;
        render();
    });
});

// Fill mode
document.querySelectorAll('.fill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.fill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        creator.fillMode = btn.dataset.fill;
        render();
    });
});

// Colors
color1Input.addEventListener('input', e => { creator.color1 = e.target.value; render(); });
color2Input.addEventListener('input', e => { creator.color2 = e.target.value; render(); });
accentInput.addEventListener('input', e => { creator.accent = e.target.value; render(); });

// Thickness
thicknessInput.addEventListener('input', e => {
    creator.thickness = parseInt(e.target.value);
    thicknessVal.textContent = creator.thickness;
    render();
});

// Store name
storeNameInput.addEventListener('input', e => {
    creator.storeName = e.target.value;
    render();
});

// Export
btnExport.addEventListener('click', () => {
    const link = document.createElement('a');
    const name = creator.storeName
        ? creator.storeName.toLowerCase().replace(/\s+/g, '_') + '_watermark.png'
        : 'watermark.png';
    link.download = name;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// ===== Badge Management =====
btnAddBadge.addEventListener('click', () => {
    creator.badges.push({ emoji: '', text: '', color: '#d62828', position: 'bottom-center' });
    renderBadgeControls();
    render();
});

function addPresetBadge(preset) {
    creator.badges.push({ ...preset });
    renderBadgeControls();
    render();
}

// Render preset buttons
function renderPresetButtons() {
    badgePresetsEl.innerHTML = '';
    BADGE_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-badge-btn';
        btn.style.background = preset.color;
        btn.textContent = `${preset.emoji} ${preset.text}`;
        btn.title = `Add "${preset.text}" badge`;
        btn.addEventListener('click', () => addPresetBadge(preset));
        badgePresetsEl.appendChild(btn);
    });
}
renderPresetButtons();

function renderBadgeControls() {
    badgeListEl.innerHTML = '';
    creator.badges.forEach((badge, i) => {
        const row = document.createElement('div');
        row.className = 'badge-row';
        row.innerHTML = `
      <input type="text" class="badge-emoji-input" value="${badge.emoji}" title="Emoji" maxlength="4">
      <input type="text" class="badge-text-input" value="${badge.text}" placeholder="Badge text">
      <input type="color" class="badge-color-input" value="${badge.color}" title="Badge color">
      <select class="badge-pos-select">
        ${POSITIONS.map(p => `<option value="${p}" ${p === badge.position ? 'selected' : ''}>${p.replace('-', ' ')}</option>`).join('')}
      </select>
      <button class="badge-remove" title="Remove">✕</button>
    `;

        row.querySelector('.badge-emoji-input').addEventListener('input', e => {
            creator.badges[i].emoji = e.target.value;
            render();
        });
        row.querySelector('.badge-text-input').addEventListener('input', e => {
            creator.badges[i].text = e.target.value;
            render();
        });
        row.querySelector('.badge-color-input').addEventListener('input', e => {
            creator.badges[i].color = e.target.value;
            render();
        });
        row.querySelector('.badge-pos-select').addEventListener('change', e => {
            creator.badges[i].position = e.target.value;
            render();
        });
        row.querySelector('.badge-remove').addEventListener('click', () => {
            creator.badges.splice(i, 1);
            renderBadgeControls();
            render();
        });

        badgeListEl.appendChild(row);
    });
}

// ===== Fill Helpers =====
function getBorderFill() {
    if (creator.fillMode === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
        grad.addColorStop(0, creator.color1);
        grad.addColorStop(1, creator.color2);
        return grad;
    }
    if (creator.fillMode === 'stripes') {
        return makeStripePattern(creator.color1, creator.color2);
    }
    return creator.color1;
}

function makeStripePattern(c1, c2) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 20;
    pCanvas.height = 20;
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = c1;
    pCtx.fillRect(0, 0, 20, 20);
    pCtx.strokeStyle = c2;
    pCtx.lineWidth = 6;
    pCtx.beginPath();
    pCtx.moveTo(-5, 25); pCtx.lineTo(25, -5);
    pCtx.moveTo(-5, 5); pCtx.lineTo(5, -5);
    pCtx.moveTo(15, 25); pCtx.lineTo(25, 15);
    pCtx.stroke();
    return ctx.createPattern(pCanvas, 'repeat');
}

// ===== Render =====
function render() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const t = creator.thickness;
    const fill = getBorderFill();
    const accent = creator.accent;

    switch (creator.style) {
        case 'simple': drawSimple(t, fill); break;
        case 'double': drawDouble(t, fill); break;
        case 'angular': drawAngular(t, fill, accent); break;
        case 'corners': drawCorners(t, fill); break;
        case 'layered': drawLayered(t, fill, accent); break;
        case 'bracket': drawBracket(t, fill, accent); break;
        case 'rounded': drawRounded(t, fill); break;
        case 'inset': drawInset(t, fill, accent); break;
    }

    drawAllBadges();

    if (creator.storeName) {
        drawStoreName();
    }
}

// ===== 8 Border Styles =====

function drawSimple(t, fill) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.strokeRect(t / 2, t / 2, SIZE - t, SIZE - t);
}

function drawDouble(t, fill) {
    const gap = t * 1.5;
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.strokeRect(t / 2, t / 2, SIZE - t, SIZE - t);
    ctx.lineWidth = t * 0.5;
    ctx.strokeRect(t + gap, t + gap, SIZE - 2 * (t + gap), SIZE - 2 * (t + gap));
}

function drawAngular(t, fill, accent) {
    const cut = t * 3;
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.beginPath();
    ctx.moveTo(cut + t / 2, t / 2);
    ctx.lineTo(SIZE - cut - t / 2, t / 2);
    ctx.lineTo(SIZE - t / 2, cut + t / 2);
    ctx.lineTo(SIZE - t / 2, SIZE - cut - t / 2);
    ctx.lineTo(SIZE - cut - t / 2, SIZE - t / 2);
    ctx.lineTo(cut + t / 2, SIZE - t / 2);
    ctx.lineTo(t / 2, SIZE - cut - t / 2);
    ctx.lineTo(t / 2, cut + t / 2);
    ctx.closePath();
    ctx.stroke();

    // Accent corner fills
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    [[0, 0, cut + t, 0, 0, cut + t], [SIZE, 0, SIZE - cut - t, 0, SIZE, cut + t],
    [SIZE, SIZE, SIZE - cut - t, SIZE, SIZE, SIZE - cut - t], [0, SIZE, cut + t, SIZE, 0, SIZE - cut - t]]
        .forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
        });
    ctx.globalAlpha = 1;
}

function drawCorners(t, fill) {
    const len = SIZE * 0.22;
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.lineCap = 'square';
    [[t / 2, len, t / 2, t / 2, len, t / 2],
    [SIZE - len, t / 2, SIZE - t / 2, t / 2, SIZE - t / 2, len],
    [SIZE - t / 2, SIZE - len, SIZE - t / 2, SIZE - t / 2, SIZE - len, SIZE - t / 2],
    [len, SIZE - t / 2, t / 2, SIZE - t / 2, t / 2, SIZE - len]]
        .forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
        });
}

function drawLayered(t, fill, accent) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.strokeRect(t / 2, t / 2, SIZE - t, SIZE - t);

    // Dashed middle layer
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    const g = t + 6;
    ctx.strokeRect(g, g, SIZE - g * 2, SIZE - g * 2);
    ctx.setLineDash([]);

    // Inner solid layer
    ctx.strokeStyle = fill;
    ctx.lineWidth = t * 0.5;
    const g2 = t + 14;
    ctx.strokeRect(g2, g2, SIZE - g2 * 2, SIZE - g2 * 2);
}

function drawBracket(t, fill, accent) {
    const armLen = SIZE * 0.22;
    const midLen = SIZE * 0.15;
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.lineCap = 'square';

    // Corner arms
    [[t / 2, armLen, t / 2, t / 2, armLen, t / 2],
    [SIZE - armLen, t / 2, SIZE - t / 2, t / 2, SIZE - t / 2, armLen],
    [SIZE - t / 2, SIZE - armLen, SIZE - t / 2, SIZE - t / 2, SIZE - armLen, SIZE - t / 2],
    [armLen, SIZE - t / 2, t / 2, SIZE - t / 2, t / 2, SIZE - armLen]]
        .forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
        });

    // Center accent dashes
    ctx.strokeStyle = accent;
    ctx.lineWidth = t * 0.6;
    const center = SIZE / 2;
    ctx.beginPath(); ctx.moveTo(center - midLen, t / 2); ctx.lineTo(center + midLen, t / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(center - midLen, SIZE - t / 2); ctx.lineTo(center + midLen, SIZE - t / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t / 2, center - midLen); ctx.lineTo(t / 2, center + midLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SIZE - t / 2, center - midLen); ctx.lineTo(SIZE - t / 2, center + midLen); ctx.stroke();
}

function drawRounded(t, fill) {
    const r = t * 3;
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    roundRect(ctx, t / 2, t / 2, SIZE - t, SIZE - t, r);
    ctx.stroke();
}

function drawInset(t, fill, accent) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = t;
    ctx.strokeRect(t / 2, t / 2, SIZE - t, SIZE - t);

    // Inset corner lines
    const d = t * 2.5;
    ctx.strokeStyle = accent;
    ctx.lineWidth = t * 0.6;
    ctx.beginPath(); ctx.moveTo(0, d); ctx.lineTo(d, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SIZE - d, 0); ctx.lineTo(SIZE, d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(SIZE, SIZE - d); ctx.lineTo(SIZE - d, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d, SIZE); ctx.lineTo(0, SIZE - d); ctx.stroke();

    // Small accent diamond in each corner
    const ds = t * 0.8;
    ctx.fillStyle = accent;
    [[t * 1.5, t * 1.5], [SIZE - t * 1.5, t * 1.5], [SIZE - t * 1.5, SIZE - t * 1.5], [t * 1.5, SIZE - t * 1.5]]
        .forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy - ds); ctx.lineTo(cx + ds, cy); ctx.lineTo(cx, cy + ds); ctx.lineTo(cx - ds, cy);
            ctx.closePath(); ctx.fill();
        });
}

// ===== Badges =====
function drawAllBadges() {
    creator.badges.forEach(badge => {
        if (!badge.text) return;
        const label = badge.emoji ? `${badge.emoji} ${badge.text}` : badge.text;
        drawBadgeAt(label, badge.color, badge.position);
    });
}

function drawBadgeAt(text, bgColor, position) {
    ctx.font = 'bold 18px Inter, sans-serif';
    const metrics = ctx.measureText(text);
    const w = metrics.width + 24;
    const h = 38;
    const margin = 10;
    const r = 5;
    let bx, by;

    switch (position) {
        case 'top-left': bx = margin; by = margin; break;
        case 'top-right': bx = SIZE - w - margin; by = margin; break;
        case 'top-center': bx = (SIZE - w) / 2; by = margin; break;
        case 'bottom-left': bx = margin; by = SIZE - h - margin; break;
        case 'bottom-right': bx = SIZE - w - margin; by = SIZE - h - margin; break;
        case 'bottom-center': bx = (SIZE - w) / 2; by = SIZE - h - margin; break;
        default: bx = margin; by = SIZE - h - margin;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, bx + 2, by + 2, w, h, r);
    ctx.fill();

    // Badge bg
    ctx.fillStyle = bgColor;
    roundRect(ctx, bx, by, w, h, r);
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + w / 2, by + h / 2 + 1);
}

// ===== Store Name =====
function drawStoreName() {
    const text = creator.storeName.toUpperCase();
    ctx.font = 'bold 20px Inter, sans-serif';
    const metrics = ctx.measureText(text);
    const w = metrics.width + 36;
    const h = 34;
    const bx = (SIZE - w) / 2;
    const by = creator.thickness + 8;

    ctx.fillStyle = creator.accent;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, bx, by, w, h, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, SIZE / 2, by + h / 2 + 1);
}

// ===== Util =====
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Initial render
render();
