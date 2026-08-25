// ===================================================================
// FIREBASE INITIALIZATION — KOD ASAL, TIDAK DIUBAH
// ===================================================================
// ✅ BETUL — tambah databaseURL
const firebaseConfig = {
    apiKey: "AIzaSyCcyeYLy92xfGqWYNrL5T8DzFac_D0ZLSk",
    authDomain: "pinout-and-hardware-helper-hub.firebaseapp.com",
    databaseURL: "https://pinout-and-hardware-helper-hub-default-rtdb.asia-southeast1.firebasedatabase.app",  // <-- TAMBAH INI
    projectId: "pinout-and-hardware-helper-hub",
    storageBucket: "pinout-and-hardware-helper-hub.firebasestorage.app",
    messagingSenderId: "153784292716",
    appId: "1:153784292716:web:9165c39e8d58b310650f49",
    measurementId: "G-CL2DX4Q412"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let fbOnline = false;

// Status Firebase
// ✅ GANTI bahagian .info/connected jadi ni sahaja:
db.ref('.info/connected').on('value', snap => {
    fbOnline = snap.val() === true;
    const dot = document.getElementById('fb-dot');
    const txt = document.getElementById('fb-status-text');
    if (fbOnline) {
        dot.className = 'fb-dot online';
        txt.textContent = 'Connected';
    } else {
        dot.className = 'fb-dot';
        txt.textContent = 'Offline';
    }
});

// ===================================================================
// GLOBAL STATE
// ===================================================================
let cart = [];
let allProducts = {};
let allOrders = {};
let currentSection = 'home';
let salesChart = null;
let pieChart = null;
let lightningAnimId = null;

// Escape HTML — halakan injection melalui data dari database
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ===================================================================
// AFFILIATE CONFIG — tukar di sini sahaja bila dapat link affiliate
// Contoh Shopee: tag: 'af_siteid=ABC123&af_sub1=pieware'
// ===================================================================
const AFFILIATE = {
    tag: '',  // kosongkan jika tiada lagi affiliate ID
    defaultSearch: 'https://my.cytron.io/search?q={q}' // {q} diganti nama produk
};
function affiliateSuffix() {
    if (!AFFILIATE.tag) return '';
    return (AFFILIATE.defaultSearch.includes('?') ? '&' : '?') + AFFILIATE.tag;
}
function affiliateSearchUrl(name) {
    return AFFILIATE.defaultSearch.replace('{q}', encodeURIComponent(name)) + affiliateSuffix();
}
function affiliateBuyUrl(rawUrl) {
    if (!rawUrl) return '';
    if (!AFFILIATE.tag) return rawUrl;
    return rawUrl + (rawUrl.includes('?') ? '&' : '?') + AFFILIATE.tag;
}

// ===================================================================
// LOADING OVERLAY
// ===================================================================
// ✅ GANTI keseluruhan window.addEventListener('load', ...) dengan ni:
let loadingHidden = false;

function hideLoading() {
    if (loadingHidden) return;
    loadingHidden = true;
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    el.classList.add('fade-out');
    setTimeout(() => { el.style.display = 'none'; }, 500);
}

// Sembunyikan loading SEGERA — jangan tunggu Firebase
window.addEventListener('load', () => {
    hideLoading();
    loadProducts();
    loadAnnouncement();
    loadFeedback();
    loadAbout();
    // Hub: set href chip "Buy parts" — carian Cytron + affiliate tag
    document.querySelectorAll('.hub-buy-chip').forEach(a => {
        a.href = affiliateSearchUrl(a.dataset.query || 'arduino');
    });
    renderDictFilters();
    renderDictionary('');
    renderCatalogFilters();
    renderCatalog('');
    renderMyProjects();
    renderTemplates();
    renderMiniProjects('');
    // URL params (share link) diutamakan; jika tiada, pulihkan auto-save
    if (!loadFromURL()) restoreHelperState();
    initDemo();
    initGoldParticles();
    initLightning();
});

// ===================================================================
// NAVIGATION
// ===================================================================
function navTo(target) {
    // Tutup mobile menu
    document.getElementById('nav-links').classList.remove('mobile-open');
    document.getElementById('hamburger-btn').textContent = '☰';

    // Sembunyikan semua section
    document.querySelectorAll('main > section').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });

    // Papar section yang dipilih
    const sec = document.getElementById(target);
    if (sec) {
        // Semua section scroll secara semula jadi dalam main
        sec.style.display = 'block';
        sec.style.height = 'auto';
        sec.style.minHeight = '100vh';
        sec.style.minHeight = '100svh';
        // Force reflow untuk trigger animation
        void sec.offsetWidth;
        sec.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.toggle('active', li.dataset.target === target);
    });

    currentSection = target;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Admin: load data bila masuk
    if (target === 'admin') loadAdminData();

    // Lightning: hanya aktif di home
    if (target === 'home') { startLightning(); } else { stopLightning(); }
}

function toggleMenu() {
    const nav = document.getElementById('nav-links');
    const btn = document.getElementById('hamburger-btn');
    const isOpen = nav.classList.contains('mobile-open');
    nav.classList.toggle('mobile-open');
    btn.textContent = isOpen ? '☰' : '✕';
}

// ===================================================================
// THEME, SETTINGS & I18N
// ===================================================================
function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('pieware_theme', theme); } catch (e) {}
    syncSettingsUI();
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
    showToast(current === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode');
}
// Pulihkan tema pilihan pengguna
try {
    const savedTheme = localStorage.getItem('pieware_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
} catch (e) {}

// --- i18n: English (kunci) / Bahasa Indonesia / Tagalog ---
const I18N = {
    id: {
        'Insufficient stock': 'Stok tidak cukup',
        'added to cart': 'ditambahkan ke keranjang',
        'Your cart is empty!': 'Keranjang Anda kosong!',
        'Please fill in all details': 'Mohon isi semua data',
        'Invalid email format': 'Format email tidak valid',
        'Invalid phone number format (e.g. 0123456789)': 'Format nomor telepon tidak valid (mis. 0123456789)',
        'Error! Please try again.': 'Kesalahan! Silakan coba lagi.',
        'Payment successful!': 'Pembayaran berhasil!',
        'Receipt downloaded!': 'Resi diunduh!',
        'About text cannot be empty': 'Teks About tidak boleh kosong',
        'Save failed! Are you logged in as admin?': 'Gagal menyimpan! Apakah Anda masuk sebagai admin?',
        'About updated': 'About diperbarui',
        'File too large! Max 2MB.': 'File terlalu besar! Maks 2MB.',
        'Upload failed!': 'Upload gagal!',
        'Image uploaded successfully!': 'Gambar berhasil diunggah!',
        'Image deleted': 'Gambar dihapus',
        'Please enter your name': 'Mohon isi nama Anda',
        'Please write your review message': 'Mohon tulis pesan ulasan Anda',
        'Invalid rating': 'Rating tidak valid',
        'Failed to send! Please try again.': 'Gagal mengirim! Silakan coba lagi.',
        'Thank you for your review!': 'Terima kasih atas ulasan Anda!',
        'Please select an MCU and component first': 'Silakan pilih MCU dan komponen terlebih dahulu',
        'Failed to delete order!': 'Gagal menghapus pesanan!',
        'deleted & stock restored': 'dihapus & stok dikembalikan',
        'Delete order': 'Hapus pesanan',
        'Stock for items in this order will be restored. This action cannot be undone.': 'Stok barang dalam pesanan ini akan dikembalikan. Tindakan ini tidak dapat dibatalkan.',
        'Product name is required': 'Nama produk wajib diisi',
        'Invalid price': 'Harga tidak valid',
        'Invalid stock': 'Stok tidak valid',
        'Image URL must start with http:// or https://': 'URL gambar harus dimulai dengan http:// atau https://',
        'Failed to save product!': 'Gagal menyimpan produk!',
        'Product updated': 'Produk diperbarui',
        'Product added': 'Produk ditambahkan',
        'Failed to delete product!': 'Gagal menghapus produk!',
        'Product deleted': 'Produk dihapus',
        'No data to export': 'Tidak ada data untuk diekspor',
        'CSV downloaded! Open it with Google Sheets.': 'CSV diunduh! Buka dengan Google Sheets.',
        'Please enter email and password': 'Mohon masukkan email dan kata sandi',
        'This email is not an admin': 'Email ini bukan admin',
        'Login failed': 'Gagal masuk',
        'Incorrect email or password': 'Email atau kata sandi salah',
        'No products available': 'Tidak ada produk tersedia',
        'New products will appear here soon.': 'Produk baru akan segera muncul di sini.',
        'No images uploaded yet': 'Belum ada gambar yang diunggah',
        'Be the first to upload your circuit photos!': 'Jadilah yang pertama mengunggah foto sirkuit Anda!',
        'Upload Image': 'Unggah Gambar',
        'Your cart is empty': 'Keranjang Anda kosong',
        'Browse our selection of components in the store.': 'Lihat pilihan komponen di toko kami.',
        'Browse Store': 'Jelajahi Toko',
        'No reviews yet': 'Belum ada ulasan',
        'Be the first to share your thoughts!': 'Jadilah yang pertama berbagi pandangan!',
        'review': 'ulasan',
        'No products yet. Click "+ Add Product" to get started.': 'Belum ada produk. Klik "+ Add Product" untuk memulai.',
        'No orders yet.': 'Belum ada pesanan.',
        'No results found.': 'Tidak ada hasil ditemukan.',
        'Language updated': 'Bahasa diperbarui'
    },
    tl: {
        'Insufficient stock': 'Kulang ang stock',
        'added to cart': 'naidagdag sa cart',
        'Your cart is empty!': 'Walang laman ang cart mo!',
        'Please fill in all details': 'Pakisulat lahat ng impormasyon',
        'Invalid email format': 'Maling format ng email',
        'Invalid phone number format (e.g. 0123456789)': 'Maling format ng numero ng telepono (hal. 0123456789)',
        'Error! Please try again.': 'Mali! Pakisubukang muli.',
        'Payment successful!': 'Matagumpay na pagbabayad!',
        'Receipt downloaded!': 'Nai-download ang resibo!',
        'About text cannot be empty': 'Hindi maaaring walang laman ang teksto ng About',
        'Save failed! Are you logged in as admin?': 'Nabigong i-save! Naka-login ka ba bilang admin?',
        'About updated': 'Na-update ang About',
        'File too large! Max 2MB.': 'Masyadong malaki ang file! Max 2MB.',
        'Upload failed!': 'Nabigo ang upload!',
        'Image uploaded successfully!': 'Matagumpay na na-upload ang imahe!',
        'Image deleted': 'Nabura ang imahe',
        'Please enter your name': 'Pakisulat ang pangalan mo',
        'Please write your review message': 'Pakisulat ang mensahe ng review mo',
        'Invalid rating': 'Maling rating',
        'Failed to send! Please try again.': 'Nabigong ipadala! Pakisubukang muli.',
        'Thank you for your review!': 'Salamat sa review mo!',
        'Please select an MCU and component first': 'Pumili muna ng MCU at bahagi',
        'Failed to delete order!': 'Nabigong burahin ang order!',
        'deleted & stock restored': 'nabura at naibalik ang stock',
        'Delete order': 'Burahin ang order',
        'Stock for items in this order will be restored. This action cannot be undone.': 'Ibabalik ang stock ng mga item sa order na ito. Hindi na ito maaaring bawiin.',
        'Product name is required': 'Kailangan ang pangalan ng produkto',
        'Invalid price': 'Maling presyo',
        'Invalid stock': 'Maling stock',
        'Image URL must start with http:// or https://': 'Dapat magsimula sa http:// o https:// ang URL ng imahe',
        'Failed to save product!': 'Nabigong i-save ang produkto!',
        'Product updated': 'Na-update ang produkto',
        'Product added': 'Naidagdag ang produkto',
        'Failed to delete product!': 'Nabigong burahin ang produkto!',
        'Product deleted': 'Nabura ang produkto',
        'No data to export': 'Walang data na i-export',
        'CSV downloaded! Open it with Google Sheets.': 'Nai-download ang CSV! Buksan gamit ang Google Sheets.',
        'Please enter email and password': 'Pakilagay ang email at password',
        'This email is not an admin': 'Hindi admin ang email na ito',
        'Login failed': 'Nabigo ang pag-login',
        'Incorrect email or password': 'Mali ang email o password',
        'No products available': 'Walang available na produkto',
        'New products will appear here soon.': 'Malalabas dito ang bagong produkto balang araw.',
        'No images uploaded yet': 'Wala pang na-upload na imahe',
        'Be the first to upload your circuit photos!': 'Maging unang mag-upload ng litrato ng iyong circuit!',
        'Upload Image': 'I-upload ang Imahe',
        'Your cart is empty': 'Walang laman ang cart mo',
        'Browse our selection of components in the store.': 'Tingnan ang mga komponenteng available sa tindahan.',
        'Browse Store': 'Tingnan ang Tindahan',
        'No reviews yet': 'Wala pang review',
        'Be the first to share your thoughts!': 'Maging unang magbahagi ng iyong opinyon!',
        'review': 'review',
        'No products yet. Click "+ Add Product" to get started.': 'Wala pang produkto. I-click ang "+ Add Product" para magsimula.',
        'No orders yet.': 'Wala pang order.',
        'No results found.': 'Walang nahanap.',
        'Language updated': 'Na-update ang wika'
    }
};
let lang = 'en';
try { const saved = localStorage.getItem('pieware_lang'); if (I18N[saved]) lang = saved; } catch (e) {}
function t(key) { const d = I18N[lang]; return (d && d[key]) || key; }

function setLang(l) {
    if (!I18N[l] && l !== 'en') return;
    lang = l;
    try { localStorage.setItem('pieware_lang', l); } catch (e) {}
    showToast(t('Language updated'));
    renderShop();
    loadFeedback();
}

function openSettings() {
    syncSettingsUI();
    document.getElementById('settings-modal').classList.add('active');
}
function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
}
function syncSettingsUI() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');
    if (darkBtn && lightBtn) {
        darkBtn.style.borderColor = theme === 'dark' ? 'var(--gold)' : '';
        darkBtn.style.color = theme === 'dark' ? 'var(--gold)' : '';
        lightBtn.style.borderColor = theme === 'light' ? 'var(--gold)' : '';
        lightBtn.style.color = theme === 'light' ? 'var(--gold)' : '';
    }
    const sel = document.getElementById('lang-select');
    if (sel) sel.value = lang;
}

// ===================================================================
// TOAST
// ===================================================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===================================================================
// SEARCH
// ===================================================================
function toggleSearch() {
    const m = document.getElementById('search-modal');
    m.classList.toggle('active');
    if (m.classList.contains('active')) {
        setTimeout(() => document.getElementById('search-input').focus(), 100);
    } else {
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }
}
document.getElementById('search-modal').addEventListener('click', function(e) {
    if (e.target === this) toggleSearch();
});

function performSearch(q) {
    const res = document.getElementById('search-results');
    if (!q.trim()) { res.innerHTML = ''; return; }
    q = q.toLowerCase();
    const pages = [
        { label: 'Home', target: 'home', icon: '🏠' },
        { label: 'Hub', target: 'hub', icon: '🧭' },
        { label: 'Pinout Helper', target: 'helper', icon: '🔌' },
        { label: 'Source Code Generator', target: 'source', icon: '💻' },
        { label: 'Electronics Calculator', target: 'calculator', icon: '🧮' },
        { label: 'Hardware Store', target: 'shop', icon: '🛒' },
        { label: 'Login (Admin)', target: 'admin', icon: '👑' },
    ];
    let html = '';
    pages.forEach(p => {
        if (p.label.toLowerCase().includes(q)) {
            html += `<div class="search-result-item" onclick="toggleSearch(); navTo('${p.target}')">${p.icon} <span>${p.label}</span></div>`;
        }
    });
    // Cari produk
    Object.values(allProducts).forEach(p => {
        if (p.name && p.name.toLowerCase().includes(q)) {
            html += `<div class="search-result-item" onclick="toggleSearch(); navTo('shop')">${esc(p.icon) || '📦'} <span>${esc(p.name)} — RM${esc(p.price)}</span></div>`;
        }
    });
    if (!html) html = '<p style="padding:1rem; color:var(--text-muted); text-align:center;">' + t('No results found.') + '</p>';
    res.innerHTML = html;
}

// ===================================================================
// LIGHTNING ANIMATION — HOME PAGE
// ===================================================================
function initLightning() {
    startLightning();
}

let lightningResizeHandler = null;

function startLightning() {
    const canvas = document.getElementById('lightning-canvas');
    if (!canvas) return;
    if (lightningAnimId) return; // sudah aktif
    const ctx = canvas.getContext('2d');
    let w, h;

    function resize() {
        const section = document.getElementById('home');
        w = canvas.width = section.offsetWidth;
        h = canvas.height = section.offsetHeight;
    }
    resize();
    lightningResizeHandler = resize;
    window.addEventListener('resize', resize);

    let bolts = [];
    let lastBolt = 0;

    function createBolt() {
        const startX = Math.random() * w;
        const startY = 0;
        const endY = h * (0.4 + Math.random() * 0.5);
        const segments = [];
        let x = startX, y = startY;
        const steps = 12 + Math.floor(Math.random() * 10);
        const stepY = endY / steps;
        for (let i = 0; i < steps; i++) {
            x += (Math.random() - 0.5) * 80;
            y += stepY;
            segments.push({ x, y });
        }
        // Branches
        const branches = [];
        if (Math.random() > 0.3) {
            const branchIdx = Math.floor(segments.length * 0.3 + Math.random() * segments.length * 0.4);
            const bp = segments[branchIdx];
            let bx = bp.x, by = bp.y;
            const bSegs = [];
            const bSteps = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < bSteps; i++) {
                bx += (Math.random() - 0.3) * 50;
                by += stepY * 0.7;
                bSegs.push({ x: bx, y: by });
            }
            branches.push(bSegs);
        }
        return { segments, branches, alpha: 1, born: Date.now(), life: 200 + Math.random() * 300 };
    }

    function drawBolt(bolt) {
        const age = Date.now() - bolt.born;
        bolt.alpha = Math.max(0, 1 - age / bolt.life);
        if (bolt.alpha <= 0) return false;

        ctx.save();
        ctx.globalAlpha = bolt.alpha;
        ctx.strokeStyle = '#F5D76E';
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 25 * bolt.alpha;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Main bolt
        ctx.beginPath();
        ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
        bolt.segments.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Glow layer
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 40 * bolt.alpha;
        ctx.shadowColor = '#F5D76E';
        ctx.beginPath();
        ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
        bolt.segments.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Branches
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 15 * bolt.alpha;
        bolt.branches.forEach(branch => {
            const startSeg = bolt.segments[Math.floor(bolt.segments.length * 0.4)];
            ctx.beginPath();
            ctx.moveTo(startSeg.x, startSeg.y);
            branch.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });

        ctx.restore();
        return true;
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        // Subtle ambient glow
        const grd = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h * 0.7);
        grd.addColorStop(0, 'rgba(212,175,55,0.03)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        const now = Date.now();
        if (now - lastBolt > 800 + Math.random() * 2000) {
            bolts.push(createBolt());
            // Kadang-kadang double bolt
            if (Math.random() > 0.6) {
                setTimeout(() => bolts.push(createBolt()), 50 + Math.random() * 100);
            }
            lastBolt = now;
        }

        bolts = bolts.filter(b => drawBolt(b));
        lightningAnimId = requestAnimationFrame(animate);
    }
    animate();
}

function stopLightning() {
    if (lightningAnimId) {
        cancelAnimationFrame(lightningAnimId);
        lightningAnimId = null;
    }
    if (lightningResizeHandler) {
        window.removeEventListener('resize', lightningResizeHandler);
        lightningResizeHandler = null;
    }
}

// ===================================================================
// GOLD PARTICLES — HOME PAGE
// ===================================================================
function initGoldParticles() {
    const container = document.getElementById('gold-particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'gold-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (4 + Math.random() * 8) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        container.appendChild(p);
    }
}

// ===================================================================
// PRODUCTS / SHOP
// ===================================================================
// ===================================================================
// MY PROJECTS — simpan & muat pilihan Helper (localStorage)
// ===================================================================
function getMyProjects() {
    try {
        const arr = JSON.parse(localStorage.getItem('pieware_projects') || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

function saveMyProject() {
    if (!helperMcu || !helperComps.length) return showToast('Select an MCU and at least one component first');
    let name = (document.getElementById('proj-name').value || '').trim();
    if (!name) name = helperMcu.split(' (')[0] + ' project';
    const projects = getMyProjects();
    projects.unshift({
        name: name,
        mcu: helperMcu,
        comps: helperComps.slice(),
        breadboard: helperBreadboard,
        ts: Date.now()
    });
    try { localStorage.setItem('pieware_projects', JSON.stringify(projects.slice(0, 20))); }
    catch (e) { return showToast('Storage full — delete old projects'); }
    document.getElementById('proj-name').value = '';
    renderMyProjects();
    showToast('Project saved!');
}

function loadMyProject(idx) {
    const p = getMyProjects()[idx];
    if (!p) return;
    const mcuSel = document.getElementById('mcu-select');
    if (MCU_INDEX[p.mcu]) mcuSel.value = p.mcu;
    helperMcu = p.mcu;
    helperComps = (p.comps || []).slice().slice(0, MAX_COMPS);
    helperBreadboard = !!p.breadboard;
    document.getElementById('breadboard-toggle').checked = helperBreadboard;
    document.getElementById('btn-add-comp').disabled = !helperMcu;
    document.getElementById('comp-select').disabled = !helperMcu;
    renderHelper();
    showToast('Project "' + p.name + '" loaded');
}

function deleteMyProject(idx) {
    const projects = getMyProjects();
    projects.splice(idx, 1);
    try { localStorage.setItem('pieware_projects', JSON.stringify(projects)); } catch (e) {}
    renderMyProjects();
}

function renderMyProjects() {
    const list = document.getElementById('my-projects-list');
    if (!list) return;
    const projects = getMyProjects();
    if (!projects.length) {
        list.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted);">No saved projects yet — set up your MCU & components above, then press Save.</p>';
        return;
    }
    list.innerHTML = projects.map((p, i) => `
        <div style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.8rem; border:1px solid var(--border-glass); border-radius:var(--radius-md); margin-bottom:0.5rem; flex-wrap:wrap;">
            <div style="flex:1; min-width:150px;">
                <div style="font-weight:700; font-size:0.85rem;">${esc(p.name)}</div>
                <div style="font-size:0.72rem; color:var(--text-muted);">${esc(p.mcu)} · ${p.comps.length} component(s)${p.breadboard ? ' · 🍞' : ''}</div>
            </div>
            <button class="btn btn-outline btn-sm" style="font-size:0.72rem;" onclick="loadMyProject(${i})">Load</button>
            <button class="btn btn-sm" style="background:rgba(244,63,94,0.15); color:var(--danger); font-size:0.72rem;" onclick="deleteMyProject(${i})">Delete</button>
        </div>`).join('');
}

// --- Full Cytron Catalog: setiap item Pieware dilink ke Cytron ---
const CYTRON_DIRECT = {
    'Raspberry Pi 5': 'https://my.cytron.io/p-raspberry-pi-5',
    'Maker Uno (Cytron)': 'https://my.cytron.io/p-maker-uno',
    'Raspberry Pi Pico': 'https://my.cytron.io/p-raspberry-pi-pico'
};
function cytronQuery(name) {
    return name
        .replace(/\(.*?\)/g, '')
        .replace(/ - Best Seller.*/i, '')
        .replace(/(Original & Compatible|Cytron special edition)/gi, '')
        .replace(/&/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function cytronUrl(name) {
    if (CYTRON_DIRECT[name]) return affiliateBuyUrl(CYTRON_DIRECT[name]);
    return 'https://my.cytron.io/search?q=' + encodeURIComponent(cytronQuery(name)) + affiliateSuffix();
}

let catalogFilter = 'all';
function renderCatalogFilters() {
    const wrap = document.getElementById('catalog-filters');
    if (!wrap) return;
    const cats = [['all', 'All']].concat(Object.keys(MCU_SERIES).map(s => [s, s + ' 🖥️']))
        .concat(Object.keys(COMPONENT_CATEGORIES).map(c => [c, c + ' 📡']));
    wrap.innerHTML = cats.map(([key, label]) =>
        '<button onclick="setCatalogFilter(\'' + esc(key) + '\')" style="padding:0.3rem 0.7rem; border-radius:var(--radius-full); font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ' + (catalogFilter === key ? 'var(--gold)' : 'var(--border-glass)') + '; background:' + (catalogFilter === key ? 'rgba(212,175,55,0.15)' : 'transparent') + '; color:' + (catalogFilter === key ? 'var(--gold-light)' : 'var(--text-muted)') + ';">' + esc(label) + '</button>'
    ).join('');
}
function setCatalogFilter(f) {
    catalogFilter = f;
    renderCatalogFilters();
    renderCatalog(document.getElementById('catalog-search').value);
}
function renderCatalog(q) {
    const area = document.getElementById('catalog-area');
    if (!area) return;
    q = (q || '').toLowerCase().trim();
    let html = '';
    const item = (name, icon) =>
        '<a class="search-result-item" style="border:1px solid var(--border-glass); margin-bottom:0.4rem;" href="' + esc(cytronUrl(name)) + '" target="_blank" rel="noopener nofollow">' +
        '<span>' + icon + '</span> <span>' + esc(name) + '</span>' +
        '<span style="margin-left:auto; color:var(--secondary); font-size:0.72rem; font-weight:700;">Buy ↗</span></a>';

    Object.entries(MCU_SERIES).forEach(([series, list]) => {
        if (catalogFilter !== 'all' && catalogFilter !== series) return;
        const items = list.map(l => l[0]).filter(n => !q || n.toLowerCase().includes(q));
        if (!items.length) return;
        html += '<div style="font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:1rem 0 0.5rem;">🖥️ ' + esc(series) + ' Boards (' + items.length + ')</div>';
        html += items.map(n => item(n, '🖥️')).join('');
    });
    Object.entries(COMPONENT_CATEGORIES).forEach(([cat, list]) => {
        if (catalogFilter !== 'all' && catalogFilter !== cat) return;
        const items = list.map(c => c.n).filter(n => !q || n.toLowerCase().includes(q));
        if (!items.length) return;
        html += '<div style="font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:1rem 0 0.5rem;">📡 ' + esc(cat) + ' (' + items.length + ')</div>';
        html += items.map(n => item(n, '📡')).join('');
    });
    area.innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:1rem;">No matches found.</p>';
}

function loadProducts() {
    db.ref('shopProducts').on('value', snap => {
        allProducts = snap.val() || {};
        renderShop();
        renderAdminProducts();
    });
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    const keys = Object.keys(allProducts);
    if (!keys.length) {
        grid.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <div class="empty-state-title">{t('No products available')}</div>
            <div class="empty-state-sub">{t('New products will appear here soon.')}</div>
        </div>`;
        return;
    }
    grid.innerHTML = keys.map(k => {
        const p = allProducts[k];
        const stock = parseInt(p.stock) || 0;
        const inStock = stock > 0;
        const imgHtml = p.image
            ? `<img src="${esc(p.image)}" alt="${esc(p.name) || 'Product'}" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);">`
            : (esc(p.icon) || '📦');
        return `
        <div class="card">
            <div class="product-image-ph" style="${p.image ? 'border-style:solid;' : ''}">${imgHtml}</div>
            <span class="stock-badge" style="${inStock ? (stock <= 3 ? 'background:rgba(245,158,11,0.15);color:var(--accent);' : '') : 'background:rgba(244,63,94,0.15);color:var(--danger);'}">${!inStock ? 'Out of Stock' : (stock <= 3 ? 'Low Stock: ' + stock : 'In Stock: ' + stock)}</span>
            <h3 style="font-size:0.95rem;">${esc(p.name) || 'Unnamed'}</h3>
            <p style="font-size:0.78rem; margin:0.3rem 0;">${esc(p.desc)}</p>
            <div class="product-price">RM ${(parseFloat(p.price) || 0).toFixed(2)}</div>
            ${(p.buyUrl || AFFILIATE.defaultSearch) ? `
            <a class="btn btn-primary btn-block btn-sm" href="${esc(affiliateBuyUrl(p.buyUrl) || affiliateSearchUrl(p.name || ''))}" target="_blank" rel="noopener nofollow">
                🛒 Buy from Cytron
            </a>` : ''}
        </div>`;
    }).join('');
}

function loadAnnouncement() {
    db.ref('announcements').on('value', snap => {
        const val = snap.val();
        if (val && val.text) {
            document.getElementById('announcement-text').textContent = val.text;
        }
    });
}

// ===================================================================
// ABOUT — boleh diubah admin, dipaparkan kepada pengguna
// ===================================================================
const ABOUT_DEFAULT = 'Pieware 2 ialah pusat elektronik premium untuk pelajar dan pembina.\n\nBelajar, bina dan fahami elektronik dengan mudah — daripada visualizer pinout MCU, penjana kod sumber, kalkulator kejuruteraan, sehinggalah kedai perkakasan dan maklum balas pengguna.';

function loadAbout() {
    db.ref('about').on('value', snap => {
        const val = snap.val();
        const text = (val && val.text) ? val.text : ABOUT_DEFAULT;
        renderAbout(text);
    });
}

function renderAbout(text) {
    const el = document.getElementById('about-content');
    if (el) el.textContent = text;
    // Isi editor admin dengan kandungan semasa
    const editor = document.getElementById('about-text');
    if (editor && document.activeElement !== editor) editor.value = text;
}

function saveAbout() {
    const text = document.getElementById('about-text').value.trim();
    if (!text) return showToast(t('About text cannot be empty'));
    const btn = document.getElementById('btn-save-about');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    db.ref('about').set({ text: text, updatedAt: Date.now() }, function(err) {
        btn.disabled = false;
        btn.textContent = 'Save About';
        if (err) { showToast(t('Save failed! Are you logged in as admin?')); console.error(err); return; }
        showToast(t('About updated'));
    });
}

// ===================================================================
// FEEDBACK / REVIEWS
// ===================================================================
let feedbackRating = 3;

function setRating(n) {
    feedbackRating = n;
    document.querySelectorAll('#star-picker .star-btn').forEach((b, i) => {
        b.classList.toggle('active', i < n);
    });
}

function submitFeedback() {
    const name = document.getElementById('fb-name').value.trim();
    const msg = document.getElementById('fb-msg').value.trim();
    if (!name) return showToast(t('Please enter your name'));
    if (!msg) return showToast(t('Please write your review message'));
    if (feedbackRating < 1 || feedbackRating > 5) return showToast(t('Invalid rating'));

    const btn = document.getElementById('btn-feedback');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const entry = {
        name: name,
        rating: feedbackRating,
        message: msg,
        timestamp: Date.now()
    };
    db.ref('feedback').push(entry, function(err) {
        btn.disabled = false;
        btn.textContent = 'Send Review';
        if (err) { showToast(t('Failed to send! Please try again.')); console.error(err); return; }
        document.getElementById('fb-name').value = '';
        document.getElementById('fb-msg').value = '';
        setRating(3);
        showToast(t('Thank you for your review!'));
    });
}

function loadFeedback() {
    db.ref('feedback').on('value', snap => {
        const data = snap.val() || {};
        renderFeedback(data);
    });
}

function renderFeedback(data) {
    const list = document.getElementById('feedback-list');
    if (!list) return;
    const entries = Object.entries(data).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    if (!entries.length) {
        list.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <div class="empty-state-title">{t('No reviews yet')}</div>
            <div class="empty-state-sub">{t('Be the first to share your thoughts!')}</div>
        </div>`;
        return;
    }

    const ratings = entries.map(e => parseInt(e[1].rating) || 0).filter(r => r > 0);
    const avg = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0;
    const summaryHtml = `
    <div style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.9rem; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:var(--radius-md); margin-bottom:var(--space-md);">
        <span class="feedback-stars">${'★'.repeat(Math.round(avg))}</span>
        <span style="font-weight:700; font-size:0.9rem;">${avg.toFixed(1)}/5</span>
        <span style="font-size:0.78rem; color:var(--text-muted);">(${entries.length} ${t('review')})</span>
    </div>`;

    list.innerHTML = summaryHtml + entries.map(([key, f]) => {
        const d = new Date(f.timestamp || Date.now());
        const dateStr = d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
        const stars = '★'.repeat(Math.max(0, Math.min(5, parseInt(f.rating) || 0)));
        return `
        <div class="feedback-item">
            <div class="feedback-meta">
                <span class="feedback-name">${esc(f.name)}</span>
                <span class="feedback-date">${dateStr}</span>
            </div>
            <div class="feedback-stars">${stars}</div>
            <div class="feedback-msg">${esc(f.message)}</div>
        </div>`;
    }).join('');
}

function copyCode() {
    const code = document.getElementById('code-block').textContent;
    navigator.clipboard.writeText(code).then(() => showToast('Code copied!')).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Code copied!');
    });
}

function downloadCode() {
    const code = document.getElementById('code-block').textContent;
    if (!code.trim()) return showToast('Generate code first');
    const famKey = MCU_INDEX[helperMcu] ? MCU_INDEX[helperMcu].family : '';
    const ext = (famKey === 'rpi' || famKey === 'microbit') ? 'py' : 'ino';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pieware2_sketch.' + ext;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded pieware2_sketch.' + ext);
}

// ===================================================================
// HELPER ENGINE — data & generator (MCU families, components, wiring)
// ===================================================================

// --- MCU families: pin pools, default buses, voltage & code style ---
const MCU_FAMILIES = {
    ard5: {
        label: 'Arduino (5V)', v: '5V', code: 'c',
        pins: ['5V','3.3V','GND','GND','D13','D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','D1(TX)','D0(RX)','A0','A1','A2','A3','A4(SDA)','A5(SCL)'],
        dig: ['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'],
        ana: ['A0','A1','A2','A3'], i2c: ['A4(SDA)','A5(SCL)'],
        spi: { MOSI: 'D11', MISO: 'D12', SCK: 'D13', CS: 'D10' },
        uart: ['D0(RX)','D1(TX)'], vcc: '5V',
        strip: p => p.replace(/^D/, '').replace(/\(.*\)/, '')
    },
    ard33: {
        label: 'Arduino (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','5V','GND','GND','D13','D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','D1(TX)','D0(RX)','A0','A1','A2','A3','A4(SDA)','A5(SCL)'],
        dig: ['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13'],
        ana: ['A0','A1','A2','A3'], i2c: ['A4(SDA)','A5(SCL)'],
        spi: { MOSI: 'D11', MISO: 'D12', SCK: 'D13', CS: 'D10' },
        uart: ['D0(RX)','D1(TX)'], vcc: '3.3V',
        strip: p => p.replace(/^D/, '').replace(/\(.*\)/, '')
    },
    esp32: {
        label: 'ESP32 (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','5V(VIN)','GND','GND','D2','D4','D5','D12','D13','D14','D15','D16','D17','D18','D19','D21(SDA)','D22(SCL)','D23','D25','D26','D27','D32','D33','D34','D35','VP','VN'],
        dig: ['D4','D5','D12','D13','D14','D15','D16','D17','D18','D19','D21','D22','D23','D25','D26','D27','D32','D33'],
        ana: ['D34','D35'], i2c: ['D21(SDA)','D22(SCL)'],
        spi: { MOSI: 'D23', MISO: 'D19', SCK: 'D18', CS: 'D5' },
        uart: ['D16(RX2)','D17(TX2)'], vcc: '3.3V',
        strip: p => p.replace(/^D/, '').replace(/\(.*\)/, '')
    },
    esp8266: {
        label: 'ESP8266 (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','GND','D0','D1(SCL)','D2(SDA)','D3','D4','D5','D6','D7','D8','RX','TX'],
        dig: ['D1','D2','D5','D6','D7','D8'],
        ana: ['A0'], i2c: ['D2(SDA)','D1(SCL)'],
        spi: { MOSI: 'D13', MISO: 'D12', SCK: 'D14', CS: 'D15' },
        uart: ['RX','TX'], vcc: '3.3V',
        strip: p => p.replace(/\(.*\)/, '')
    },
    pico: {
        label: 'RP2040 (3.3V)', v: '3.3V', code: 'c',
        pins: ['3V3(OUT)','VSYS','GND','GND','GP0','GP1','GP2','GP3','GP4','GP5','GP6','GP7','GP8','GP9','GP10','GP11','GP12','GP13','GP14','GP15','GP26','GP27','GP28'],
        dig: ['GP2','GP3','GP6','GP7','GP8','GP9','GP10','GP11','GP12','GP13','GP14','GP15'],
        ana: ['GP26','GP27','GP28'], i2c: ['GP4(SDA)','GP5(SCL)'],
        spi: { MOSI: 'GP19', MISO: 'GP16', SCK: 'GP18', CS: 'GP17' },
        uart: ['GP1(UART0 RX)','GP0(UART0 TX)'], vcc: '3V3(OUT)',
        strip: p => p.replace(/^GP/, '').replace(/\(.*\)/, '')
    },
    rpi: {
        label: 'Raspberry Pi (3.3V)', v: '3.3V', code: 'py',
        pins: ['5V','3.3V','GND','GPIO2(SDA)','GPIO3(SCL)','GPIO4','GPIO17','GPIO27','GPIO22','GPIO10(MOSI)','GPIO9(MISO)','GPIO11(SCK)','GPIO5','GPIO6','GPIO13','GPIO19','GPIO26','GPIO14(TXD)','GPIO15(RXD)'],
        dig: ['GPIO17','GPIO27','GPIO22','GPIO5','GPIO6','GPIO13','GPIO19','GPIO26'],
        ana: [], i2c: ['GPIO2(SDA)','GPIO3(SCL)'],
        spi: { MOSI: 'GPIO10', MISO: 'GPIO9', SCK: 'GPIO11', CS: 'GPIO8' },
        uart: ['GPIO15(RXD)','GPIO14(TXD)'], vcc: '3.3V',
        strip: p => p.replace(/^GPIO/, '').replace(/\(.*\)/, '')
    },
    stm32: {
        label: 'STM32 (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','5V','GND','GND','PA0','PA1','PA2','PA3','PA4','PA5','PA6','PA7','PA8','PA9(TX1)','PA10(RX1)','PA11','PA12','PA13','PA14','PA15','PB0','PB1','PB3','PB4','PB5','PB6(SCL)','PB7(SDA)','PC13'],
        dig: ['PA0','PA1','PA2','PA3','PA4','PA5','PA6','PA7','PA8','PA11','PA12','PA15','PB0','PB1','PB3','PB4','PB5'],
        ana: ['PA0','PA1','PA2','PA3'], i2c: ['PB7(SDA)','PB6(SCL)'],
        spi: { MOSI: 'PA7', MISO: 'PA6', SCK: 'PA5', CS: 'PA4' },
        uart: ['PA10(RX1)','PA9(TX1)'], vcc: '3.3V',
        strip: p => p.replace(/\(.*\)/, '')
    },
    microbit: {
        label: 'micro:bit (3.3V)', v: '3.3V', code: 'py',
        pins: ['3V','GND','P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P19(SCL)','P20(SDA)'],
        dig: ['P0','P1','P2','P8','P12','P13','P14','P15','P16'],
        ana: ['P0','P1','P2'], i2c: ['P20(SDA)','P19(SCL)'],
        spi: { MOSI: 'P15', MISO: 'P14', SCK: 'P13', CS: 'P16' },
        uart: ['P1(RX)','P2(TX)'], vcc: '3V',
        strip: p => p.replace(/^P/, '').replace(/\(.*\)/, '')
    },
    teensy: {
        label: 'Teensy (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','5V','GND','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D14','D15','D16','D17','D18(SDA)','D19(SCL)','A0','A1','A2'],
        dig: ['D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D14','D15','D16','D17'],
        ana: ['A0','A1','A2'], i2c: ['D18(SDA)','D19(SCL)'],
        spi: { MOSI: 'D11', MISO: 'D12', SCK: 'D13', CS: 'D10' },
        uart: ['D0(RX1)','D1(TX1)'], vcc: '3.3V',
        strip: p => p.replace(/^D/, '').replace(/\(.*\)/, '')
    },
    xiao: {
        label: 'XIAO/nRF (3.3V)', v: '3.3V', code: 'c',
        pins: ['3.3V','5V','GND','D0','D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','A0','A1','A2','A3'],
        dig: ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10'],
        ana: ['A0','A1','A2'], i2c: ['D4(SDA)','D5(SCL)'],
        spi: { MOSI: 'D10', MISO: 'D9', SCK: 'D8', CS: 'D7' },
        uart: ['D7(RX)','D6(TX)'], vcc: '3.3V',
        strip: p => p.replace(/^D/, '').replace(/\(.*\)/, '')
    },
    pic: {
        label: 'PIC (5V)', v: '5V', code: 'c',
        pins: ['VDD','VSS','RA0','RA1','RA2','RA3','RA4','RA5','RB0','RB1','RB2','RB3','RB4','RB5','RB6','RB7','RC0','RC1','RC2','RD0','RD1','RD2','RD3'],
        dig: ['RB0','RB1','RB2','RB3','RB4','RB5','RD0','RD1','RD2','RD3'],
        ana: ['RA0','RA1','RA2','RA3'], i2c: ['RC4(SDA)','RC3(SCL)'],
        spi: { MOSI: 'RC5', MISO: 'RC4', SCK: 'RC3', CS: 'RA5' },
        uart: ['RC7(RX)','RC6(TX)'], vcc: 'VDD',
        strip: p => p.replace(/\(.*\)/, '')
    }
};

// --- MCU boards: [name, family, series] ---
const MCU_SERIES = {
    'Arduino': [
        ['Arduino Uno R3 (Original & Compatible)', 'ard5'],
        ['Arduino Nano (CH340 & ATmega328P)', 'ard5'],
        ['Arduino Mega 2560', 'ard5'],
        ['Arduino Leonardo', 'ard5'],
        ['Arduino Micro', 'ard5'],
        ['Arduino Due', 'ard33'],
        ['Arduino Pro Mini', 'ard5'],
        ['Arduino MKR WiFi 1010', 'ard33'],
        ['Arduino MKR Zero', 'ard33'],
        ['Arduino Nano Every', 'ard5'],
        ['Arduino Nano 33 IoT', 'ard33'],
        ['Arduino Nano 33 BLE', 'ard33'],
        ['Arduino Portenta H7', 'ard33'],
        ['Arduino Giga R1 WiFi', 'ard33']
    ],
    'ESP': [
        ['ESP32 DevKit V1 (DOIT)', 'esp32'],
        ['ESP32 DevKit C (ESP32-WROOM-32)', 'esp32'],
        ['ESP32-S3 DevKit', 'esp32'],
        ['ESP32-C3 DevKit', 'esp32'],
        ['ESP32-CAM', 'esp32'],
        ['ESP8266 NodeMCU V3', 'esp8266'],
        ['ESP8266 Wemos D1 Mini', 'esp8266'],
        ['ESP32 Wemos D1 Mini', 'esp32'],
        ['ESP32 TTGO T-Display', 'esp32'],
        ['ESP32 TTGO T-Call (SIM800L)', 'esp32'],
        ['ESP32 LoRa (TTGO LoRa32)', 'esp32']
    ],
    'Raspberry Pi': [
        ['Raspberry Pi 4 Model B (2GB/4GB/8GB)', 'rpi'],
        ['Raspberry Pi 5', 'rpi'],
        ['Raspberry Pi Zero 2 W', 'rpi'],
        ['Raspberry Pi Zero W', 'rpi'],
        ['Raspberry Pi Pico', 'pico'],
        ['Raspberry Pi Pico W', 'pico'],
        ['Raspberry Pi Pico 2', 'pico'],
        ['Raspberry Pi 400', 'rpi']
    ],
    'STM32': [
        ['STM32 Blue Pill (STM32F103C8T6)', 'stm32'],
        ['STM32 Black Pill (STM32F401CCU6)', 'stm32'],
        ['STM32 Black Pill (STM32F411CEU6)', 'stm32'],
        ['STM32 Nucleo-F401RE', 'stm32'],
        ['STM32 Nucleo-F411RE', 'stm32'],
        ['STM32 Discovery Board', 'stm32']
    ],
    'Micro:bit': [
        ['BBC micro:bit V1', 'microbit'],
        ['BBC micro:bit V2', 'microbit'],
        ['micro:bit Starter Kit', 'microbit']
    ],
    'Others': [
        ['Teensy 4.0', 'teensy'],
        ['Teensy 4.1', 'teensy'],
        ['Seeed Studio XIAO RP2040', 'pico'],
        ['Seeed Studio XIAO ESP32-C3', 'esp32'],
        ['Seeed Studio XIAO nRF52840', 'xiao'],
        ['Adafruit Feather ESP32', 'esp32'],
        ['Adafruit Feather nRF52840', 'xiao'],
        ['PIC16F877A', 'pic'],
        ['PIC18F4550', 'pic'],
        ['M5Stack Core', 'esp32'],
        ['M5StickC', 'esp32'],
        ['Maker Uno (Cytron)', 'ard5'],
        ['Maker Nano (Cytron)', 'ard5'],
        ['Maker Pi Pico (Cytron)', 'pico'],
        ['Maker Pi RP2040 (Cytron)', 'pico']
    ]
};
const MCU_INDEX = {};
Object.entries(MCU_SERIES).forEach(([series, list]) => {
    list.forEach(([name, family]) => { MCU_INDEX[name] = { series, family }; });
});

// Board yang ada WiFi terbina dalam
const WIFI_MCUS = new Set([
    'Arduino MKR WiFi 1010',
    'Arduino Nano 33 IoT',
    'Arduino Portenta H7',
    'Arduino Giga R1 WiFi',
    'ESP32 DevKit V1 (DOIT)',
    'ESP32 DevKit C (ESP32-WROOM-32)',
    'ESP32-S3 DevKit',
    'ESP32-C3 DevKit',
    'ESP32-CAM',
    'ESP8266 NodeMCU V3',
    'ESP8266 Wemos D1 Mini',
    'ESP32 Wemos D1 Mini',
    'ESP32 TTGO T-Display',
    'ESP32 TTGO T-Call (SIM800L)',
    'ESP32 LoRa (TTGO LoRa32)',
    'Raspberry Pi 4 Model B (2GB/4GB/8GB)',
    'Raspberry Pi 5',
    'Raspberry Pi Zero 2 W',
    'Raspberry Pi Zero W',
    'Raspberry Pi Pico W',
    'Raspberry Pi 400',
    'Seeed Studio XIAO ESP32-C3',
    'Adafruit Feather ESP32',
    'M5Stack Core',
    'M5StickC'
]);

// --- Components: {n:name, k:kind, p:[pins], sig:signal pins by role, warn}
// kinds: din dout dht us ana i2c spi uart servo stepper4 stepper2 motor rgb color nrf passive
const COMPONENT_CATEGORIES = {
    'Sensors': [
        { n: 'DHT11 Temperature & Humidity Sensor', k: 'dht', p: ['VCC', 'DATA', 'GND'], warn: 'Add a 10K pull-up resistor between DATA and VCC for stable readings.' },
        { n: 'DHT22 Temperature & Humidity Sensor', k: 'dht', p: ['VCC', 'DATA', 'GND'], warn: 'Add a 10K pull-up resistor between DATA and VCC.' },
        { n: 'HC-SR04 Ultrasonic Sensor', k: 'us', p: ['VCC', 'TRIG', 'ECHO', 'GND'], warn: 'On 3.3V MCUs, use a voltage divider (1K/2K) on ECHO.' },
        { n: 'JSN-SR04T Ultrasonic (Waterproof)', k: 'us', p: ['VCC', 'TRIG', 'ECHO', 'GND'], warn: 'Blind zone ~25cm. Use divider on ECHO for 3.3V MCUs.' },
        { n: 'HC-SR501 PIR Motion Sensor', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'IR Sensor Module (TCRT5000)', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'LDR Light Sensor Module', k: 'ana', p: ['VCC', 'AO', 'GND'] },
        { n: 'MQ-2 Gas Sensor', k: 'ana', p: ['VCC', 'A0', 'GND'], warn: 'Allow 24-48h burn-in before trusting readings.' },
        { n: 'MQ-3 Alcohol Sensor', k: 'ana', p: ['VCC', 'A0', 'GND'] },
        { n: 'MQ-7 Carbon Monoxide Sensor', k: 'ana', p: ['VCC', 'A0', 'GND'] },
        { n: 'MQ-135 Air Quality Sensor', k: 'ana', p: ['VCC', 'A0', 'GND'] },
        { n: 'MPU-6050 Gyro + Accelerometer', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'MPU-9250 9-axis Sensor', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'BMP280 Barometric Pressure Sensor', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'BME280 Temperature/Humidity/Pressure', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'SHT20 Temperature & Humidity', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'DS18B20 Waterproof Temperature', k: 'din', p: ['VCC', 'DATA', 'GND'], warn: 'Needs 4.7K pull-up on DATA. Use the OneWire + DallasTemperature libraries.' },
        { n: 'Soil Moisture Sensor', k: 'ana', p: ['VCC', 'AO', 'GND'] },
        { n: 'Rain Sensor Module', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'Sound Sensor (LM393)', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'KY-037 Microphone Sound Sensor', k: 'din', p: ['VCC', 'GND', 'DO', 'AO'], warn: 'DO is digital (threshold via potentiometer); AO is analog — connect AO to an ADC pin for volume readings.' },
        { n: 'KY-038 Sound Detection Sensor', k: 'din', p: ['VCC', 'GND', 'DO', 'AO'], warn: 'Adjust the onboard potentiometer to set the detection threshold. AO gives analog output.' },
        { n: 'Hall Effect Sensor (A3144)', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'Flame Sensor Module', k: 'din', p: ['VCC', 'OUT', 'GND'] },
        { n: 'TCS3200 Color Sensor', k: 'color', p: ['VCC', 'GND', 'S0', 'S1', 'S2', 'S3', 'OUT'] },
        { n: 'GY-31 Color Sensor', k: 'color', p: ['VCC', 'GND', 'S0', 'S1', 'S2', 'S3', 'OUT'] },
        { n: 'ACS712 Current Sensor (5A/20A/30A)', k: 'ana', p: ['VCC', 'OUT', 'GND'] },
        { n: 'Voltage Sensor Module (0-25V)', k: 'ana', p: ['VCC', 'S', 'GND'] },
        { n: 'Flex Sensor', k: 'ana', p: ['PIN 1', 'PIN 2'], warn: 'Use with a voltage divider (fixed resistor to GND).' },
        { n: 'Force Sensitive Resistor (FSR)', k: 'ana', p: ['PIN 1', 'PIN 2'], warn: 'Use with a pull-down resistor (10K).' },
        { n: 'Pulse/Heart Rate Sensor', k: 'ana', p: ['VCC', 'SIGNAL', 'GND'] },
        { n: 'pH Sensor Kit', k: 'ana', p: ['VCC', 'PO', 'GND'], warn: 'Usually needs an ADC interface board (PH-4502C).' },
        { n: 'TDS Sensor', k: 'ana', p: ['VCC', 'A0', 'GND'] },
        { n: 'VL53L0X ToF Distance Sensor', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'MH-Z19 CO2 Sensor', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'] },
        { n: 'ADXL345 Accelerometer', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'GY-271 Compass (HMC5883L)', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] }
    ],
    'Display': [
        { n: 'LED 5mm (Red/Green/Blue/Yellow/White)', k: 'dout', p: ['Anode (+)', 'Cathode (-)'], warn: 'Always use a series resistor (220-330 ohm).' },
        { n: 'RGB LED Module', k: 'rgb', p: ['R', 'GND', 'G', 'B'] },
        { n: 'WS2812B NeoPixel Strip/Ring', k: 'dout', p: ['5V', 'DIN', 'GND'], warn: 'Use the FastLED or Adafruit NeoPixel library. Add 300-500 ohm resistor on DIN.' },
        { n: 'LCD 16x2 Character (parallel)', k: 'lcd', p: ['VSS', 'VDD', 'VO', 'RS', 'E', 'D4', 'D5', 'D6', 'D7'], warn: 'Use a potentiometer on VO for contrast. Consider the I2C version to save pins.' },
        { n: 'LCD 20x4 Character (parallel)', k: 'lcd', p: ['VSS', 'VDD', 'VO', 'RS', 'E', 'D4', 'D5', 'D6', 'D7'] },
        { n: 'LCD 16x2 with I2C Adapter', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'], warn: 'I2C address is usually 0x27 or 0x3F — run an I2C scanner if unsure.' },
        { n: 'OLED 0.96" SSD1306 (I2C)', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'OLED 1.3" SH1106 (I2C)', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'TFT LCD 2.4" Touchscreen', k: 'spi', p: ['VCC', 'GND', 'CS', 'RESET', 'DC', 'MOSI', 'SCK', 'LED'] },
        { n: 'TFT LCD 3.5" Touchscreen', k: 'spi', p: ['VCC', 'GND', 'CS', 'RESET', 'DC', 'MOSI', 'SCK', 'LED'] },
        { n: '7-Segment Display (1/2/4 digit)', k: 'seg', p: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'], warn: 'Consider a MAX7219 driver or TM1637 module to save pins.' },
        { n: '8x8 LED Matrix', k: 'seg', p: ['R1-R8', 'C1-C8'], warn: 'Strongly consider a MAX7219 driver module.' },
        { n: 'Buzzer (Active)', k: 'dout', p: ['+', '-'] },
        { n: 'Buzzer (Passive)', k: 'dout', p: ['+', '-'], warn: 'Use tone() to play different frequencies.' },
        { n: 'Speaker 8 ohm (0.25W/0.5W)', k: 'dout', p: ['+', '-'], warn: 'Do not drive directly from a pin — use a transistor or amplifier.' }
    ],
    'Actuators & Motors': [
        { n: 'Servo SG90', k: 'servo', p: ['VCC', 'SIG', 'GND'], warn: 'May draw more current than USB provides — use external 5V supply.' },
        { n: 'Servo MG996R', k: 'servo', p: ['VCC', 'SIG', 'GND'], warn: 'High current — external 5-6V supply with common GND is required.' },
        { n: 'Servo MG995', k: 'servo', p: ['VCC', 'SIG', 'GND'], warn: 'High current — external 5-6V supply required.' },
        { n: 'DC Motor (3V-6V)', k: 'motor', p: ['IN1', 'IN2', 'EN'], warn: 'Never connect directly to MCU pins — use a motor driver (L298N/L293D).' },
        { n: 'DC Geared Motor (TT Motor)', k: 'motor', p: ['IN1', 'IN2', 'EN'], warn: 'Use a driver module (L298N or L9110S).' },
        { n: 'Stepper Motor 28BYJ-48', k: 'stepper4', p: ['IN1', 'IN2', 'IN3', 'IN4'], warn: 'Driven via ULN2003 driver board (usually bundled).' },
        { n: 'Stepper Motor NEMA17', k: 'stepper2', p: ['STEP', 'DIR'], warn: 'Requires a stepper driver (A4988/DRV8825). Set current limit before connecting!' },
        { n: 'L298N Motor Driver', k: 'motor', p: ['IN1', 'IN2', 'ENA'] },
        { n: 'L293D Motor Driver', k: 'motor', p: ['IN1', 'IN2', 'EN1,2'] },
        { n: 'DRV8825 Stepper Driver', k: 'stepper2', p: ['STEP', 'DIR'], warn: 'Adjust Vref current limit before connecting the motor.' },
        { n: 'A4988 Stepper Driver', k: 'stepper2', p: ['STEP', 'DIR'], warn: 'Adjust Vref current limit before connecting the motor.' },
        { n: 'BTS7960 Motor Driver (High Power)', k: 'motor', p: ['RPWM', 'LPWM', 'R_EN'] }
    ],
    'Relay & Switching': [
        { n: 'Relay Module 1 Channel (5V)', k: 'dout', p: ['VCC', 'IN', 'GND'], v: '5', warn: 'Mains voltage is dangerous — only use with low-voltage loads as a student.' },
        { n: 'Relay Module 2 Channel (5V)', k: 'multi2', p: ['VCC', 'IN1', 'IN2', 'GND'] },
        { n: 'Relay Module 4 Channel (5V)', k: 'multi4', p: ['VCC', 'IN1', 'IN2', 'IN3', 'IN4', 'GND'] },
        { n: 'Relay Module 8 Channel (5V)', k: 'multi8', p: ['VCC', 'IN1', 'IN2', 'IN3', 'IN4', 'IN5', 'IN6', 'IN7', 'IN8', 'GND'] },
        { n: 'Solid State Relay (SSR)', k: 'dout', p: ['IN +', 'IN -', 'LOAD'] },
        { n: 'MOSFET IRF540', k: 'dout', p: ['G', 'D', 'S'], warn: 'Gate threshold is high — prefer logic-level IRLZ44N with 3.3V MCUs.' },
        { n: 'MOSFET IRLZ44N', k: 'dout', p: ['G', 'D', 'S'] },
        { n: 'Transistor 2N2222', k: 'dout', p: ['B', 'C', 'E'], warn: 'Add ~1K base resistor.' },
        { n: 'Transistor BC547', k: 'dout', p: ['B', 'C', 'E'], warn: 'Add ~1K base resistor.' },
        { n: 'Optocoupler PC817', k: 'dout', p: ['IN +', 'IN -', 'OUT C', 'OUT E'] }
    ],
    'Communication': [
        { n: 'WiFi Web Client (HTTP)', k: 'wifi', p: [], warn: 'No wiring needed. Replace YOUR_WIFI_NAME, YOUR_WIFI_PASSWORD and the URL with your own. The website must expose an API endpoint (REST/JSON).' },
        { n: 'HC-05 Bluetooth Module', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'], warn: 'RX of MCU needs a voltage divider when MCU is 5V and module is 3.3V logic.' },
        { n: 'HC-06 Bluetooth Module', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'] },
        { n: 'NRF24L01 Wireless Module', k: 'nrf', p: ['VCC', 'GND', 'MOSI', 'MISO', 'SCK', 'CSN', 'CE', 'IRQ'], warn: 'Power with 3.3V only! Add 10-100uF capacitor across VCC/GND for stability.' },
        { n: 'LoRa SX1278 (Ra-02)', k: 'spi', p: ['VCC', 'GND', 'MOSI', 'MISO', 'SCK', 'NSS'], v: '3.3', warn: '3.3V ONLY — 5V will destroy it. Use the LoRa library by Sandeep Mistry.' },
        { n: 'RFID RC522 Module', k: 'spi', p: ['VCC', 'GND', 'MOSI', 'MISO', 'SCK', 'SDA(CS)', 'RST'], v: '3.3', warn: 'Power with 3.3V. Use the MFRC522 library.' },
        { n: 'GPS NEO-6M', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'] },
        { n: 'GSM SIM800L', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'], warn: 'Needs 3.7-4.2V at 2A peaks — LiPo battery recommended, NOT the MCU 5V pin.' },
        { n: 'SIM900A GSM Module', k: 'uart', p: ['VCC', 'GND', 'TX', 'RX'] },
        { n: 'CAN Bus MCP2515', k: 'spi', p: ['VCC', 'GND', 'MOSI', 'MISO', 'SCK', 'CS', 'INT'] },
        { n: 'RS485 Module', k: 'uart', p: ['VCC', 'GND', 'DI', 'RO', 'DE', 'RE'] },
        { n: 'SD Card Module', k: 'spi', p: ['VCC', 'GND', 'MOSI', 'MISO', 'SCK', 'CS'], warn: 'Most modules are 5V-tolerant on VCC but logic-level check the signals for 3.3V MCUs.' },
        { n: 'RTC DS3231', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] },
        { n: 'RTC DS1307', k: 'i2c', p: ['VCC', 'GND', 'SDA', 'SCL'] }
    ],
    'Power & Basics': [
        { n: 'Breadboard (400/830 points)', k: 'passive' },
        { n: 'Jumper Wires (M-M / M-F / F-F)', k: 'passive' },
        { n: 'Resistor Set (E12/E24)', k: 'passive' },
        { n: 'Capacitor Set', k: 'passive' },
        { n: 'Diode 1N4007', k: 'passive' },
        { n: 'Diode 1N4148', k: 'passive' },
        { n: 'Zener Diode', k: 'passive' },
        { n: 'Voltage Regulator 7805', k: 'passive' },
        { n: 'LM2596 Buck Converter', k: 'passive' },
        { n: 'MP1584 Buck Converter', k: 'passive' },
        { n: 'XL4015 Buck Converter', k: 'passive' },
        { n: 'Boost Converter (MT3608)', k: 'passive' },
        { n: 'Battery 18650', k: 'passive' },
        { n: 'LiPo Battery (3.7V)', k: 'passive' },
        { n: 'Battery Holder', k: 'passive' },
        { n: 'Power Adapter (5V/9V/12V)', k: 'passive' },
        { n: 'USB Cable (Micro/Type-C)', k: 'passive' }
    ],
    'Kits': [
        { n: 'Arduino Starter Kit', k: 'passive' },
        { n: 'ESP32 Starter Kit', k: 'passive' },
        { n: 'Raspberry Pi Pico Kit', k: 'passive' },
        { n: 'IoT Starter Kit', k: 'passive' },
        { n: 'Robotics Kit', k: 'passive' },
        { n: 'Sensor Kit (37 in 1)', k: 'passive' },
        { n: 'Smart Home Kit', k: 'passive' },
        { n: 'STEM Education Kit', k: 'passive' },
        { n: 'Maker Uno (Cytron) - Best Seller', k: 'passive' },
        { n: 'Arduino Uno R3 - Best Seller', k: 'passive' },
        { n: 'ESP32 DevKit - Best Seller', k: 'passive' },
        { n: 'Raspberry Pi Pico - Best Seller', k: 'passive' },
        { n: 'DHT11/DHT22 - Best Seller', k: 'passive' },
        { n: 'HC-SR04 - Best Seller', k: 'passive' },
        { n: 'Servo SG90 - Best Seller', k: 'passive' },
        { n: 'OLED 0.96" - Best Seller', k: 'passive' },
        { n: 'LCD 16x2 I2C - Best Seller', k: 'passive' },
        { n: 'Relay Module - Best Seller', k: 'passive' }
    ]
};
const COMP_INDEX = {};
Object.entries(COMPONENT_CATEGORIES).forEach(([cat, list]) => {
    list.forEach(c => { COMP_INDEX[c.n] = Object.assign({ cat }, c); });
});

// --- Helper state ---
let helperMcu = '';
let helperComps = [];   // max 5
let helperBreadboard = false;
let helperWifiOnly = false;
const MAX_COMPS = 5;

// --- Populate selects ---
function populateMcuSelect() {
    const sel = document.getElementById('mcu-select');
    const current = sel.value;
    sel.innerHTML = '<option value="" disabled selected>-- Choose MCU --</option>';
    Object.entries(MCU_SERIES).forEach(([series, list]) => {
        const boards = list.map(l => l[0]).filter(n => !helperWifiOnly || WIFI_MCUS.has(n));
        if (!boards.length) return;
        const og = document.createElement('optgroup');
        og.label = series + (helperWifiOnly ? ' 📶' : '');
        boards.forEach(name => {
            const o = document.createElement('option');
            o.value = name; o.textContent = name + (WIFI_MCUS.has(name) ? ' 📶' : '');
            og.appendChild(o);
        });
        sel.appendChild(og);
    });
    // kekalkan pilihan jika masih tersenarai
    if (current && MCU_INDEX[current] && (!helperWifiOnly || WIFI_MCUS.has(current))) sel.value = current;
}
populateMcuSelect();

function setWifiOnly(on) {
    helperWifiOnly = on;
    populateMcuSelect();
    renderDictionary(document.getElementById('dict-search') ? document.getElementById('dict-search').value : '');
}

function onMcuChange() {
    helperMcu = document.getElementById('mcu-select').value;
    const compSel = document.getElementById('comp-select');
    compSel.selectedIndex = 0; // reset pilihan, kekal senarai kategori
    compSel.disabled = !helperMcu;
    document.getElementById('btn-add-comp').disabled = !helperMcu;
    helperComps = [];
    renderHelper();
}

function populateCompSelect() {
    const compSel = document.getElementById('comp-select');
    Object.entries(COMPONENT_CATEGORIES).forEach(([cat, list]) => {
        const og = document.createElement('optgroup');
        og.label = cat;
        list.forEach(c => {
            const o = document.createElement('option');
            o.value = c.n; o.textContent = c.n;
            og.appendChild(o);
        });
        compSel.appendChild(og);
    });
}
populateCompSelect();

function onCompChange() { /* pilihan disimpan bila butang Add ditekan */ }

// Auto-save pilihan Helper — kekal selepas refresh
function persistHelperState() {
    try {
        localStorage.setItem('pieware_helper_state', JSON.stringify({
            mcu: helperMcu, comps: helperComps, breadboard: helperBreadboard
        }));
    } catch (e) {}
}
function restoreHelperState() {
    try {
        const s = JSON.parse(localStorage.getItem('pieware_helper_state') || 'null');
        if (!s || !s.mcu || !MCU_INDEX[s.mcu]) return;
        document.getElementById('mcu-select').value = s.mcu;
        helperMcu = s.mcu;
        helperComps = (Array.isArray(s.comps) ? s.comps : []).filter(n => COMP_INDEX[n]).slice(0, MAX_COMPS);
        helperBreadboard = !!s.breadboard;
        document.getElementById('breadboard-toggle').checked = helperBreadboard;
        document.getElementById('btn-add-comp').disabled = false;
        document.getElementById('comp-select').disabled = false;
        renderHelper();
    } catch (e) {}
}

function clearAllComps() {
    helperComps = [];
    persistHelperState();
    renderHelper();
    showToast('All components cleared');
}

// --- Export ke ChatGPT: prompt kemas dari data projek sebenar ---
function exportChatGPT() {
    const w = buildWiring();
    if (!w) return showToast(t('Please select an MCU and component first'));
    const issues = validateProject();
    const tag = { green: 'OK', yellow: 'WARN', red: 'ERROR', grey: 'UNVERIFIED' };

    let p = 'I am building an electronics project. Please help me extend the Arduino code below.\n\n';
    p += '=== PROJECT CONTEXT ===\n';
    p += 'MCU board: ' + helperMcu + '\n';
    p += 'Components:\n';
    helperComps.forEach(n => { p += '  - ' + n + '\n'; });
    p += (helperBreadboard ? 'Wiring uses a breadboard for power rail distribution.\n' : '');
    p += '\n=== PIN ASSIGNMENTS ===\n';
    w.rows.forEach(r => { p += '  ' + r.comp + ' :: ' + r.pin + ' -> ' + r.mcu + '\n'; });
    p += '\n=== VALIDATION RESULTS ===\n';
    issues.forEach(i => { p += '  [' + tag[i.s] + '] ' + i.t + '\n'; });
    p += '\n=== WIRING STEPS ===\n';
    w.steps.forEach((s, i) => { p += '  ' + (i + 1) + '. ' + s.replace(/\*\*/g, '') + '\n'; });
    const code = document.getElementById('code-block').textContent;
    if (code && code.trim() && !code.startsWith('// No active')) {
        p += '\n=== CURRENT CODE ===\n' + code + '\n';
    }
    p += '\n=== REQUEST ===\nPlease keep the existing pin assignments and extend the code to add the following feature: ';

    navigator.clipboard.writeText(p)
        .then(() => showToast('🤖 Prompt copied — paste into ChatGPT and describe your feature!'))
        .catch(() => showToast('Copy failed'));
}

// --- Templat Projek: preset kombinasi siap sedia ---
const PROJECT_TEMPLATES = [
    { name: '🌡️ Weather Station', desc: 'ESP32 + DHT22 + BMP280 + OLED display', mcu: 'ESP32 DevKit V1 (DOIT)', comps: ['DHT22 Temperature & Humidity Sensor', 'BMP280 Barometric Pressure Sensor', 'OLED 0.96" SSD1306 (I2C)'] },
    { name: '🏠 Smart Home', desc: 'Uno + relay + PIR + DHT11 + buzzer', mcu: 'Arduino Uno R3 (Original & Compatible)', comps: ['Relay Module 4 Channel (5V)', 'HC-SR501 PIR Motion Sensor', 'DHT11 Temperature & Humidity Sensor', 'Buzzer (Active)'] },
    { name: '🤖 Obstacle Robot', desc: 'Uno + L298N + IR + ultrasonic', mcu: 'Arduino Uno R3 (Original & Compatible)', comps: ['L298N Motor Driver', 'IR Sensor Module (TCRT5000)', 'HC-SR04 Ultrasonic Sensor'] },
    { name: '📡 IoT Monitor', desc: 'ESP32 + WiFi + sensor + display', mcu: 'ESP32 DevKit V1 (DOIT)', comps: ['WiFi Web Client (HTTP)', 'DHT11 Temperature & Humidity Sensor', 'OLED 0.96" SSD1306 (I2C)'] },
    { name: '💡 Beginner Blink', desc: 'Uno + LED — hello world', mcu: 'Arduino Uno R3 (Original & Compatible)', comps: ['LED 5mm (Red/Green/Blue/Yellow/White)'] }
];

function renderTemplates() {
    const el = document.getElementById('template-chips');
    if (!el) return;
    el.innerHTML = PROJECT_TEMPLATES.map((tp, i) =>
        '<button onclick="applyTemplate(' + i + ')" title="' + esc(tp.desc) + '" style="padding:0.4rem 0.8rem; border-radius:var(--radius-md); border:1px dashed rgba(212,175,55,0.45); background:rgba(212,175,55,0.06); color:var(--gold-light); font-size:0.75rem; font-weight:700; cursor:pointer; transition:var(--transition);">' + esc(tp.name) + '</button>'
    ).join('');
}

function applyTemplate(i) {
    const tp = PROJECT_TEMPLATES[i];
    if (!tp) return;
    document.getElementById('mcu-select').value = tp.mcu;
    helperMcu = tp.mcu;
    helperComps = tp.comps.filter(n => COMP_INDEX[n]).slice(0, MAX_COMPS);
    document.getElementById('breadboard-toggle').checked = false;
    helperBreadboard = false;
    document.getElementById('btn-add-comp').disabled = false;
    document.getElementById('comp-select').disabled = false;
    renderHelper();
    showToast('Template loaded: ' + tp.name + ' — press Generate Source Code!');
}

// --- Mini Project Ideas: 35 projek pelajar, dipetakan kepada komponen database ---
const UNO = 'Arduino Uno R3 (Original & Compatible)';
const ESP32D = 'ESP32 DevKit V1 (DOIT)';
const MINI_PROJECTS = [
    ['Interactive Education Wall', 'Easy', 'Maker Uno (Cytron)', ['IR Sensor Module (TCRT5000)', 'LED 5mm (Red/Green/Blue/Yellow/White)', 'Buzzer (Active)']],
    ['Rain Detector System', 'Easy', UNO, ['Rain Sensor Module', 'Buzzer (Active)', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Automatic Car Gate', 'Medium', UNO, ['HC-SR04 Ultrasonic Sensor', 'Servo MG996R']],
    ['Smart Dustbin', 'Easy', UNO, ['HC-SR04 Ultrasonic Sensor', 'Servo SG90']],
    ['Smart Door (RFID)', 'Medium', UNO, ['RFID RC522 Module', 'Servo SG90', 'Buzzer (Active)']],
    ['Early TCAS (Collision Warning)', 'Medium', ESP32D, ['HC-SR04 Ultrasonic Sensor', 'MPU-6050 Gyro + Accelerometer']],
    ['Automatic Night Light', 'Easy', UNO, ['LDR Light Sensor Module', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Laser Tripwire Alarm', 'Easy', UNO, ['LDR Light Sensor Module', 'Buzzer (Active)', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Smart Plant Watering System', 'Medium', UNO, ['Soil Moisture Sensor', 'Relay Module 1 Channel (5V)']],
    ['Meeting Room AutoSync System', 'Medium', ESP32D, ['RTC DS3231', 'OLED 0.96" SSD1306 (I2C)', 'WiFi Web Client (HTTP)']],
    ['Light Sensor + RFID Access', 'Medium', UNO, ['RFID RC522 Module', 'LDR Light Sensor Module', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Soil Moisture Monitor', 'Easy', UNO, ['Soil Moisture Sensor', 'LCD 16x2 with I2C Adapter']],
    ['Digital LED Hourglass', 'Medium', UNO, ['MPU-6050 Gyro + Accelerometer', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Fire Detection & Alert System', 'Easy', UNO, ['Flame Sensor Module', 'MQ-2 Gas Sensor', 'Buzzer (Active)']],
    ['Smart Medicine Reminder', 'Medium', UNO, ['RTC DS3231', 'Buzzer (Active)', 'LCD 16x2 with I2C Adapter']],
    ['Smart Home Lighting System', 'Easy', UNO, ['HC-SR501 PIR Motion Sensor', 'Relay Module 1 Channel (5V)', 'LDR Light Sensor Module']],
    ['Smart Clothes Dryer', 'Medium', UNO, ['DHT11 Temperature & Humidity Sensor', 'L298N Motor Driver']],
    ['Loud Noise Detector', 'Easy', UNO, ['KY-037 Microphone Sound Sensor', 'LED 5mm (Red/Green/Blue/Yellow/White)', 'Buzzer (Active)']],
    ['Auto Feed System (Pet/Chicken)', 'Medium', UNO, ['Servo MG996R', 'RTC DS3231']],
    ['Smart Street Light + Motion', 'Easy', UNO, ['HC-SR501 PIR Motion Sensor', 'LDR Light Sensor Module', 'Relay Module 1 Channel (5V)']],
    ['Sound Activated Room Fan', 'Easy', UNO, ['KY-038 Sound Detection Sensor', 'L298N Motor Driver']],
    ['Tank Overflow Alarm', 'Easy', UNO, ['JSN-SR04T Ultrasonic (Waterproof)', 'Buzzer (Active)']],
    ['Smart Parking Slot Detector', 'Easy', ESP32D, ['HC-SR04 Ultrasonic Sensor', 'IR Sensor Module (TCRT5000)', 'LED 5mm (Red/Green/Blue/Yellow/White)']],
    ['Expression Candy Dispenser', 'Medium', 'Maker Uno (Cytron)', ['OLED 0.96" SSD1306 (I2C)', 'Servo SG90']],
    ['Bluetooth Car', 'Medium', UNO, ['HC-05 Bluetooth Module', 'L298N Motor Driver']],
    ['Library Book Borrowing System', 'Medium', ESP32D, ['RFID RC522 Module', 'OLED 0.96" SSD1306 (I2C)']],
    ['Smart Mailbox Notification', 'Easy', ESP32D, ['Hall Effect Sensor (A3144)', 'WiFi Web Client (HTTP)']],
    ['Auto Hand Sanitizer Dispenser', 'Easy', UNO, ['HC-SR04 Ultrasonic Sensor', 'Servo SG90']],
    ['Smart Blind Stick', 'Easy', UNO, ['HC-SR04 Ultrasonic Sensor', 'Buzzer (Active)', 'MQ-2 Gas Sensor']],
    ['Gas Leakage Detection & Alert', 'Easy', ESP32D, ['MQ-2 Gas Sensor', 'Buzzer (Active)', 'WiFi Web Client (HTTP)']],
    ['Interactive Electronic Dice', 'Medium', UNO, ['MPU-6050 Gyro + Accelerometer', '8x8 LED Matrix']],
    ['Anti-Theft Backpack Alarm', 'Easy', UNO, ['Hall Effect Sensor (A3144)', 'Buzzer (Active)']],
    ['Classroom Noise Monitor', 'Easy', UNO, ['KY-037 Microphone Sound Sensor', 'OLED 0.96" SSD1306 (I2C)']],
    ['Smart USB Cable Tester', 'Easy', 'Maker Uno (Cytron)', ['LED 5mm (Red/Green/Blue/Yellow/White)', 'Buzzer (Active)']],
    ['Mini Temperature Warning System', 'Easy', UNO, ['DHT11 Temperature & Humidity Sensor', 'Buzzer (Active)', 'LED 5mm (Red/Green/Blue/Yellow/White)']]
];
let projectLevelFilter = 'all';

function renderMiniProjects(q) {
    const area = document.getElementById('mini-projects-area');
    if (!area) return;
    q = (q || '').toLowerCase().trim();
    const levelBadge = l => l === 'Easy'
        ? '<span style="padding:0.15rem 0.5rem; border-radius:var(--radius-full); background:rgba(16,185,129,0.15); color:var(--secondary); font-size:0.65rem; font-weight:800;">EASY</span>'
        : '<span style="padding:0.15rem 0.5rem; border-radius:var(--radius-full); background:rgba(245,158,11,0.15); color:var(--accent); font-size:0.65rem; font-weight:800;">MEDIUM</span>';
    const list = MINI_PROJECTS
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => (projectLevelFilter === 'all' || p[1] === projectLevelFilter) &&
            (!q || (p[0] + ' ' + p[3].join(' ')).toLowerCase().includes(q)));
    area.innerHTML = list.length ? list.map(({ p, i }) =>
        '<div style="display:flex; align-items:center; gap:0.7rem; padding:0.65rem 0.85rem; border:1px solid var(--border-glass); border-radius:var(--radius-md); margin-bottom:0.5rem; flex-wrap:wrap;">' +
        '<div style="flex:1; min-width:200px;">' +
        '<div style="display:flex; align-items:center; gap:0.5rem; font-weight:700; font-size:0.88rem;">' + esc(p[0]) + ' ' + levelBadge(p[1]) + '</div>' +
        '<div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem;">🖥️ ' + esc(p[2]).replace(/ \(.*\)/, '') + ' · ' + p[3].length + ' component(s): ' + esc(p[3].join(', ')) + '</div>' +
        '</div>' +
        '<button class="btn btn-gold btn-sm" style="font-size:0.7rem;" onclick="loadMiniProject(' + i + ')">Load in Helper →</button>' +
        '</div>'
    ).join('') : '<p style="color:var(--text-muted); text-align:center; padding:1rem;">No projects match your search.</p>';
}

function setProjectLevel(l) {
    projectLevelFilter = l;
    document.querySelectorAll('#mini-level-chips button').forEach(b => {
        const on = b.dataset.level === l;
        b.style.borderColor = on ? 'var(--gold)' : 'var(--border-glass)';
        b.style.background = on ? 'rgba(212,175,55,0.15)' : 'transparent';
        b.style.color = on ? 'var(--gold-light)' : 'var(--text-muted)';
    });
    renderMiniProjects(document.getElementById('mini-search').value);
}

function loadMiniProject(i) {
    const p = MINI_PROJECTS[i];
    if (!p) return;
    const comps = p[3].filter(n => COMP_INDEX[n]).slice(0, MAX_COMPS);
    document.getElementById('mcu-select').value = MCU_INDEX[p[2]] ? p[2] : '';
    helperMcu = p[2];
    helperComps = comps;
    document.getElementById('breadboard-toggle').checked = false;
    helperBreadboard = false;
    document.getElementById('btn-add-comp').disabled = false;
    document.getElementById('comp-select').disabled = false;
    renderHelper();
    showToast('Mini project loaded: ' + p[0] + ' — press Generate Source Code!');
}

function toggleWhy(i) {
    const el = document.getElementById('why-' + i);
    if (el) el.classList.toggle('hidden');
}

function copyWiring() {
    const w = buildWiring();
    if (!w) return showToast(t('Please select an MCU and component first'));
    let txt = 'Pieware 2 — Wiring: ' + helperMcu + (helperBreadboard ? ' (with breadboard)' : '') + '\n\n';
    txt += 'CONNECTIONS\n';
    w.rows.forEach(r => { txt += '- ' + r.comp + ': ' + r.pin + ' -> ' + r.mcu + '\n'; });
    txt += '\nSTEPS\n';
    w.steps.forEach((s, i) => { txt += (i + 1) + '. ' + s.replace(/\*\*/g, '') + '\n'; });
    if (w.warnings.length) {
        txt += '\nWARNINGS\n';
        w.warnings.forEach(x => { txt += '! ' + x + '\n'; });
    }
    navigator.clipboard.writeText(txt).then(() => showToast('Wiring copied to clipboard!')).catch(() => showToast('Copy failed'));
}

function addComponent() {
    const name = document.getElementById('comp-select').value;
    if (!helperMcu) return showToast(t('Please select an MCU and component first'));
    if (!name) return showToast('Select a component first');
    if (helperComps.length >= MAX_COMPS) return showToast('Maximum ' + MAX_COMPS + ' components — remove one to add another');
    if (helperComps.includes(name)) return showToast('Component already added');
    helperComps.push(name);
    pushRecent(name);
    document.getElementById('comp-select').selectedIndex = 0;
    renderHelper();
}

function removeHelperComp(name) {
    helperComps = helperComps.filter(c => c !== name);
    renderHelper();
}

function onBreadboardToggle() {
    helperBreadboard = document.getElementById('breadboard-toggle').checked;
    renderHelper();
}

function renderActiveComps() {
    const area = document.getElementById('active-comps');
    if (!area) return;
    document.getElementById('comp-count').textContent = helperComps.length + ' / ' + MAX_COMPS + ' components';
    if (!helperComps.length) {
        area.innerHTML = '<span style="font-size:0.8rem; color:var(--text-muted);">No components added yet — select one above and press "+ Add More Component".</span>';
        return;
    }
    area.innerHTML = helperComps.map(c =>
        `<span style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.4); color:var(--gold-light); padding:0.35rem 0.7rem; border-radius:var(--radius-full); font-size:0.78rem; font-weight:600;">
            ${esc(c)} <button onclick="removeHelperComp('${esc(c)}')" style="background:none; color:var(--danger); font-weight:800; font-size:0.85rem; cursor:pointer;">✕</button>
        </span>`
    ).join('');
}

// --- Live Demo (homepage): contoh sebenar output Helper ---
const DEMO_MCU = 'ESP32 DevKit V1 (DOIT)';
const DEMO_COMPS = ['DHT11 Temperature & Humidity Sensor'];
const DEMO_SNIPPET = `#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Serial.print("Temp: "); Serial.print(t);
  Serial.print(" C  Hum: "); Serial.print(h);
  Serial.println(" %");
  delay(2000);
}`;

function initDemo() {
    const el = document.getElementById('demo-code');
    if (el) el.textContent = DEMO_SNIPPET;
}

function loadDemo() {
    const mcuSel = document.getElementById('mcu-select');
    if (mcuSel) mcuSel.value = DEMO_MCU;
    helperMcu = DEMO_MCU;
    document.getElementById('btn-add-comp').disabled = false;
    document.getElementById('comp-select').disabled = false;
    helperComps = DEMO_COMPS.slice();
    navTo('helper');
    renderHelper();
    showToast('Demo loaded — press Generate Source Code!');
}

function buyChip(label) {
    return ' <a href="' + esc(affiliateSearchUrl(label.replace(/^[^ ]+ /, ''))) + '" target="_blank" rel="noopener nofollow" style="display:inline-block; padding:0.25rem 0.7rem; border-radius:var(--radius-full); background:rgba(16,185,129,0.15); color:var(--secondary); font-weight:600; font-size:0.75rem; border:1px solid rgba(16,185,129,0.35);">' + esc(label) + ' ↗</a>';
}

// --- Wiring generation ---
// Pin yang HANYA boleh input (output tidak disokong) — data disahkan
const INPUT_ONLY_PINS = {
    esp32: ['D34', 'D35', 'VP', 'VN']
};

// Penjelasan "Why?" — hanya berdasarkan data yang digunakan oleh allocator
function explainPin(pin, target, c, fam, compName) {
    if (/^(VCC|5V|3V|3V3|VDD|VSYS|\+|IN \+)$/i.test(pin)) {
        return 'Powers ' + compName + ' from the board supply (' + fam.vcc + ')' + (helperBreadboard ? ', distributed via the breadboard + rail so all components share one supply.' : '.');
    }
    if (/^(GND|VSS|−|-|IN -)$/i.test(pin)) {
        return 'Common ground reference' + (helperBreadboard ? ' via the breadboard − rail — all parts of the circuit must share the same GND.' : ' — required for signals to be read correctly.');
    }
    if (pin === 'SDA' || pin === 'SCL') {
        return compName + ' talks over I2C. All I2C devices share the same SDA/SCL wires (' + fam.i2c.join(' / ') + ') and are distinguished by their bus address.';
    }
    if (pin === 'MOSI' || pin === 'MISO' || pin === 'SCK') {
        return 'SPI bus signal — shared by all SPI devices on the board (' + pin + ' = ' + fam.spi[pin] + '). Only one device is addressed at a time via its CS pin.';
    }
    if (/^(CS|CSN|NSS)/i.test(pin)) {
        return 'Chip Select — unique per SPI device so the board can talk to them one at a time. ' + (target === fam.spi.CS ? 'This is the default CS pin for this board.' : 'Auto-assigned because the default CS pin (' + fam.spi.CS + ') is used by another device.');
    }
    if (/^(TX|TXD)$/i.test(pin)) return 'Serial UART — the module TX line feeds the board RX (' + fam.uart[0] + '). UART is cross-wired: TX→RX on both sides.';
    if (/^(RX|RXD)$/i.test(pin)) return 'Serial UART — the board TX (' + fam.uart[1] + ') feeds the module RX. UART is cross-wired: TX→RX on both sides.';
    if (/ECHO/i.test(pin)) return 'Input signal — the sensor reports the measured pulse here. Input-only pins (if any) are acceptable for this.';
    if (/TRIG/i.test(pin)) return 'Output signal — the board sends the trigger pulse to start a measurement, so an output-capable GPIO is required.';
    if (c.k === 'ana') return 'Analog output needs an ADC-capable input pin' + (fam.ana.length ? ' (e.g. ' + fam.ana.join(', ') + ' on this board).' : ' — check your board pinout for ADC inputs.');
    if (c.k === 'din') return 'Digital signal from the sensor — any GPIO works, including input-only pins.';
    if (c.k === 'servo') return 'Servo control signal — assigned to the next free output-capable GPIO.';
    if (c.k === 'dht') return 'Single-wire data line — any standard GPIO works (needs output capability for the start signal).';
    if (c.k === 'uart') return 'Serial communication line for ' + compName + '.';
    return 'Digital GPIO — the next free suitable pin on this board based on the current pin assignments.';
}

function buildWiring() {
    const mcu = helperMcu ? MCU_INDEX[helperMcu] : null;
    if (!mcu || !helperComps.length) return null;
    const fam = MCU_FAMILIES[mcu.family];
    const used = new Set();
    const inOnly = new Set(INPUT_ONLY_PINS[mcu.family] || []);
    const rows = [], steps = [], warnings = [];
    let spiCsUsed = false; // CS pertama guna pin default family, berikutnya alloc baru

    function alloc(list, needOutput) {
        for (const p of list) {
            if (used.has(p)) continue;
            if (needOutput && inOnly.has(p)) continue; // pin input-only tak boleh drive output
            used.add(p); return p;
        }
        return 'N/A';
    }
    function allocN(n, needOutput) {
        const out = [];
        for (let i = 0; i < n; i++) out.push(alloc(fam.dig, needOutput));
        return out;
    }
    function vccTarget() { return helperBreadboard ? 'Breadboard + rail' : fam.vcc; }
    function gndTarget() { return helperBreadboard ? 'Breadboard − rail' : 'GND'; }

    if (helperBreadboard) {
        steps.push('Place the MCU power rails onto the breadboard: ' + fam.vcc + ' → breadboard **+ rail**, GND → breadboard **− rail**.');
    }

    helperComps.forEach(name => {
        const c = COMP_INDEX[name];
        if (!c) return;
        if (c.k === 'passive') {
            rows.push({ comp: name, pin: '—', mcu: 'Passive component — no MCU wiring needed' });
            steps.push(name + ': passive item, used on the breadboard or in the circuit directly.');
            return;
        }
        if (c.k === 'wifi') {
            rows.push({ comp: name, pin: '📶', mcu: 'Wireless — no wiring needed' });
            steps.push(name + ': connects over WiFi — no physical pins. Set your SSID/password in the generated code.');
            if (c.warn) warnings.push(name + ': ' + c.warn);
            return;
        }
        const compSteps = [];
        c.p.forEach(pin => {
            // Adakah signal ini input semata-mata ke MCU? (pin input-only masih boleh dipakai)
            const isPureInput = /OUT|DO|AO|ECHO|IRQ|INT/i.test(pin) || c.k === 'din' || c.k === 'ana';
            const needOutput = !isPureInput;
            let target;
            if (/^(VCC|5V|3V|3V3|VDD|VSS|VSYS|\+|IN \+)$/i.test(pin)) target = vccTarget();
            else if (/^(GND|VSS|−|-|IN -)$/i.test(pin)) target = gndTarget();
            else if (pin === 'SDA') target = helperBreadboard ? 'Breadboard SDA row → ' + fam.i2c[0] : fam.i2c[0];
            else if (pin === 'SCL') target = helperBreadboard ? 'Breadboard SCL row → ' + fam.i2c[1] : fam.i2c[1];
            else if (pin === 'MOSI') target = fam.spi.MOSI;
            else if (pin === 'MISO') target = fam.spi.MISO;
            else if (pin === 'SCK') target = fam.spi.SCK;
            else if (/^(CS|CSN|SDA\(CS\)|NSS|CS \(Chip Select\))$/i.test(pin)) {
                // Setiap peranti SPI dapat CS tersendiri — yang pertama guna default family
                if (!spiCsUsed) { spiCsUsed = true; used.add(fam.spi.CS); target = fam.spi.CS; }
                else target = alloc(fam.dig, true);
            }
            else if (/^(TX|TXD)$/i.test(pin)) target = fam.uart[1];
            else if (/^(RX|RXD)$/i.test(pin)) target = fam.uart[0];
            else if (c.k === 'ana' && fam.ana.length) target = alloc(fam.ana, needOutput);
            else target = alloc(fam.dig, needOutput);
            rows.push({ comp: name, pin, mcu: target, why: explainPin(pin, target, c, fam, name) });
            compSteps.push('Connect ' + name + ' **' + pin + '** → ' + target + (helperBreadboard ? ' (via breadboard)' : ''));
        });
        if (helperBreadboard) steps.push('Connect ' + name + ' to the breadboard (its own row group), then wire rows to the MCU as below.');
        steps.push(...compSteps);
        if (c.warn) warnings.push(name + ': ' + c.warn);
        if (fam.v === '3.3V' && /5V/i.test(c.p.join(','))) warnings.push(name + ': this module is 5V-oriented — check level compatibility with your 3.3V ' + helperMcu + '.');
        if (c.v && c.v + 'V' !== fam.v) warnings.push('⚠️ VOLTAGE MISMATCH: ' + name + ' requires ' + c.v + 'V but ' + helperMcu + ' is a ' + fam.v + ' board. Use a level shifter / regulator — direct connection may damage it!');
    });
    return { fam, rows, steps, warnings };
}

// ===================================================================
// VALIDATION — hanya berdasarkan data yang ada; tiada data = ⚪
// ===================================================================
// status: 'green' Compatible · 'yellow' Warning · 'red' Error · 'grey' Unable to verify
function validateProject() {
    const issues = [];
    if (!helperMcu || !helperComps.length) return issues;
    const mcu = MCU_INDEX[helperMcu];
    const fam = MCU_FAMILIES[mcu.family];
    const w = buildWiring();

    helperComps.forEach(n => {
        const c = COMP_INDEX[n];
        if (!c) return;

        // 1. Voltage — hanya jika komponen ada data v yang disahkan
        if (c.v) {
            if (c.v + 'V' !== fam.v) {
                issues.push({ s: 'red', t: 'Voltage mismatch: ' + n, d: 'This component requires ' + c.v + 'V, but ' + helperMcu + ' is a ' + fam.v + ' board. Direct connection may damage the component or MCU. Fix: use a level shifter or a suitable regulator.' });
            } else {
                issues.push({ s: 'green', t: n + ': voltage compatible (' + c.v + 'V)' });
            }
        } else {
            issues.push({ s: 'grey', t: n + ': voltage not verified', d: 'We do not have confirmed voltage data for this component. Check its datasheet before connecting.' });
        }

        // 2. Heuristic 5V-module vs 3.3V board — bukan fakta, hanya petanda
        if (fam.v === '3.3V' && /5V/i.test(c.p.join(',')) && c.k !== 'passive') {
            issues.push({ s: 'yellow', t: n + ': possible 5V module on 3.3V board', d: 'A pin on this module is labelled 5V. Some 5V modules work with 3.3V logic, some do not. Fix: check the module datasheet; use a voltage divider/level shifter on signals going INTO the MCU.' });
        }
    });

    // 3. Konflik UART — semua komponen uart berkongsi pin UART family
    const uartComps = helperComps.filter(n => COMP_INDEX[n] && COMP_INDEX[n].k === 'uart');
    if (uartComps.length > 1) {
        issues.push({ s: 'red', t: 'UART conflict: ' + uartComps.length + ' components share the same UART pins', d: uartComps.join(', ') + ' are all assigned to ' + fam.uart.join('/') + '. Both cannot use the same serial port simultaneously. Fix: use only one UART device, move one to a software/hardware UART (if the board has more), or use an I2C alternative.' });
    } else if (uartComps.length === 1) {
        issues.push({ s: 'green', t: uartComps[0] + ': dedicated UART (' + fam.uart.join('/') + ')' });
    }

    // 4. Perkongsian SPI — setiap peranti kini dapat CS tersendiri secara automatik
    const spiComps = helperComps.filter(n => COMP_INDEX[n] && ['spi', 'nrf'].includes(COMP_INDEX[n].k));
    if (spiComps.length > 1) {
        issues.push({ s: 'green', t: spiComps.length + ' SPI devices share MOSI/MISO/SCK (normal for SPI)', d: 'Each device has been assigned its own CS pin automatically — see the wiring table. This is the standard multi-device SPI setup.' });
    } else if (spiComps.length === 1) {
        issues.push({ s: 'green', t: spiComps[0] + ': dedicated SPI bus' });
    }

    // 4b. Perkongsian I2C — reka bentuk bus yang betul
    const i2cComps = helperComps.filter(n => COMP_INDEX[n] && COMP_INDEX[n].k === 'i2c');
    if (i2cComps.length > 1) {
        issues.push({ s: 'green', t: i2cComps.length + ' I2C devices share SDA (' + fam.i2c[0] + ') / SCL (' + fam.i2c[1] + ')', d: 'Sharing the I2C bus is correct — devices are distinguished by address. Fix (only if address clash): use an I2C multiplexer or change a module jumper.' });
    }

    // 4c. Safety net: pin input-only terpakai untuk output
    const inOnlySet = new Set(INPUT_ONLY_PINS[mcu.family] || []);
    w.rows.forEach(r => {
        if (inOnlySet.has(r.mcu)) {
            const c = COMP_INDEX[r.comp];
            const isPureInput = c && (/OUT|DO|AO|ECHO|IRQ|INT/i.test(r.pin) || c.k === 'din' || c.k === 'ana');
            if (!isPureInput) issues.push({ s: 'red', t: r.comp + ' (' + r.pin + ') assigned to input-only pin ' + r.mcu, d: 'On this board, ' + r.mcu + ' cannot drive an output. Fix: move this connection to a standard GPIO (see wiring table alternatives).' });
        }
    });

    // 5. Pin habis (allocator pulang N/A)
    w.rows.forEach(r => {
        if (r.mcu === 'N/A') {
            issues.push({ s: 'red', t: 'No free pin for ' + r.comp + ' (' + r.pin + ')', d: 'All suitable pins on ' + helperMcu + ' are already assigned. Fix: remove a component or choose a board with more GPIOs.' });
        }
    });

    // 6. Analog pada board tanpa pool ADC
    const anaComps = helperComps.filter(n => COMP_INDEX[n] && COMP_INDEX[n].k === 'ana');
    if (anaComps.length && !fam.ana.length) {
        issues.push({ s: 'grey', t: 'Analog reading not verified on this board', d: anaComps.join(', ') + ' need ADC pins, but our data for ' + helperMcu + ' does not include confirmed ADC-capable pins. Fix: check the board pinout for ADC inputs before relying on analogRead().' });
    }

    // 7. Kuasa (anggaran)
    let total = 0;
    helperComps.forEach(n => { const c = COMP_INDEX[n]; if (c) total += KIND_CURRENT[c.k] || 5; });
    if (total > 500) {
        issues.push({ s: 'red', t: 'Estimated current ' + total + 'mA exceeds USB 500mA', d: 'This is an ESTIMATE from typical component classes, not datasheet values. Fix: power high-current components (servos, motors, strips) from an external supply with common GND.' });
    } else if (total > 300) {
        issues.push({ s: 'yellow', t: 'Estimated current ' + total + 'mA is moderately high', d: 'Estimate only. Should be fine on USB, but avoid adding more high-current components.' });
    }

    if (!issues.length) issues.push({ s: 'green', t: 'No issues found based on available data' });
    return issues;
}

function renderValidation() {
    const card = document.getElementById('validation-card');
    if (!card) return;
    if (!helperMcu || !helperComps.length) {
        card.classList.add('hidden');
        return;
    }
    card.classList.remove('hidden');
    const issues = validateProject();
    const icon = { green: '🟢', yellow: '🟡', red: '🔴', grey: '⚪' };
    const color = { green: 'var(--secondary)', yellow: 'var(--accent)', red: 'var(--danger)', grey: 'var(--text-muted)' };
    const hasRed = issues.some(i => i.s === 'red');
    const hasYellow = issues.some(i => i.s === 'yellow');
    const summary = hasRed ? '🔴 Issues found — review before wiring' : (hasYellow ? '🟡 Warnings — double-check highlighted items' : '🟢 Looks good based on available data');
    card.innerHTML =
        '<div style="font-weight:800; margin-bottom:0.5rem;">Validation <span style="font-weight:600; font-size:0.82rem; color:' + (hasRed ? 'var(--danger)' : hasYellow ? 'var(--accent)' : 'var(--secondary)') + ';">— ' + summary + '</span></div>' +
        issues.map(i =>
            '<div style="padding:0.5rem 0.7rem; border:1px solid var(--border-glass); border-left:3px solid ' + color[i.s] + '; border-radius:var(--radius-md); margin-bottom:0.4rem; font-size:0.8rem;">' +
            '<div style="font-weight:700;">' + icon[i.s] + ' ' + esc(i.t) + '</div>' +
            (i.d ? '<div style="color:var(--text-muted); font-size:0.75rem; margin-top:0.2rem;">' + esc(i.d) + '</div>' : '') +
            '</div>'
        ).join('');
}

// --- MCU info chips: konteks pantas board terpilih ---
function renderMcuChips() {
    const el = document.getElementById('mcu-info-chips');
    if (!el) return;
    if (!helperMcu || !MCU_INDEX[helperMcu]) { el.innerHTML = ''; return; }
    const info = MCU_INDEX[helperMcu];
    const fam = MCU_FAMILIES[info.family];
    const chips = [
        ['⚡', fam.v + ' logic'],
        ['🗂️', info.series],
        ['🧠', fam.label]
    ];
    if (WIFI_MCUS.has(helperMcu)) chips.push(['📶', 'WiFi built-in']);
    el.innerHTML = chips.map(([icon, label]) =>
        '<span style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.2rem 0.6rem; border-radius:var(--radius-full); background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); font-size:0.68rem; font-weight:700; color:var(--gold-light);">' + icon + ' ' + esc(label) + '</span>'
    ).join('');
}

// --- Recently Used: 5 komponen terakhir (localStorage) ---
function pushRecent(name) {
    if (!COMP_INDEX[name]) return;
    try {
        let recent = JSON.parse(localStorage.getItem('pieware_recent') || '[]');
        recent = recent.filter(c => c !== name);
        recent.unshift(name);
        recent.slice(0, 5);
        localStorage.setItem('pieware_recent', JSON.stringify(recent.slice(0, 5)));
    } catch (e) {}
}
function getRecent() {
    try {
        const arr = JSON.parse(localStorage.getItem('pieware_recent') || '[]');
        return Array.isArray(arr) ? arr.filter(n => COMP_INDEX[n]) : [];
    } catch (e) { return []; }
}

function renderStepper() {
    const el = document.getElementById('helper-steps');
    if (!el) return;
    const hasMcu = !!helperMcu;
    const hasComps = helperComps.length > 0;
    const s1 = hasMcu ? 'done' : 'active';
    const s2 = !hasMcu ? '' : (hasComps ? 'done' : 'active');
    const s3 = hasComps ? 'done' : '';   // validation auto-run
    const s4 = hasComps ? 'done' : '';   // wiring auto-generate
    const s5 = hasComps ? 'active' : '';
    const chip = (num, label, state) =>
        '<span class="pw-step ' + state + '">' + (state === 'done' ? '✅' : num) + ' ' + label + '</span>';
    el.innerHTML =
        chip('1', 'Board', s1) + '<span class="pw-step-arrow">→</span>' +
        chip('2', 'Components', s2) + '<span class="pw-step-arrow">→</span>' +
        chip('3', 'Validation', s3) + '<span class="pw-step-arrow">→</span>' +
        chip('4', 'Wiring', s4) + '<span class="pw-step-arrow">→</span>' +
        chip('5', 'Code', s5);
}

// --- Power estimate: arus anggaran mengikut jenis komponen ---
const KIND_CURRENT = { din: 5, dout: 10, dht: 3, us: 15, ana: 5, i2c: 5, spi: 15, uart: 25, servo: 200, stepper4: 240, stepper2: 20, motor: 30, rgb: 20, wifi: 80, nrf: 15, lcd: 25, seg: 40, color: 10, multi2: 20, multi4: 40, multi8: 80, passive: 0 };
function renderPowerEstimate() {
    const el = document.getElementById('power-estimate');
    if (!el) return;
    if (!helperComps.length) { el.classList.add('hidden'); return; }
    let total = 0;
    helperComps.forEach(n => {
        const c = COMP_INDEX[n];
        if (c) total += KIND_CURRENT[c.k] || 5;
    });
    const warn = total > 500;
    el.classList.remove('hidden');
    el.style.background = warn ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.08)';
    el.style.borderColor = warn ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.35)';
    el.innerHTML = '⚡ Estimated power draw (typical values, not datasheet): <strong>' + total + 'mA</strong> @ 5V (~' + ((total * 5) / 1000).toFixed(2) + 'W)' +
        (warn ? '<br>⚠️ Exceeds USB 500mA limit — use an external power supply!' : '');
}

// --- Shareable URL ---
function generateShareableURL() {
    const params = new URLSearchParams();
    if (helperMcu) params.set('mcu', helperMcu);
    if (helperComps.length) params.set('c', helperComps.join('|'));
    return window.location.origin + window.location.pathname + '?' + params.toString();
}
function shareProject() {
    if (!helperMcu) return showToast(t('Please select an MCU and component first'));
    navigator.clipboard.writeText(generateShareableURL())
        .then(() => showToast('🔗 Project link copied — share it!'))
        .catch(() => showToast('Copy failed'));
}
function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const mcu = params.get('mcu');
    const comps = params.get('c');
    if (!mcu || !MCU_INDEX[mcu]) return false;
    document.getElementById('mcu-select').value = mcu;
    helperMcu = mcu;
    helperComps = comps ? comps.split('|').filter(n => COMP_INDEX[n]).slice(0, MAX_COMPS) : [];
    document.getElementById('btn-add-comp').disabled = false;
    document.getElementById('comp-select').disabled = false;
    renderHelper();
    return true;
}

// --- BOM Export ---
function exportBOM() {
    const w = buildWiring();
    if (!w) return showToast(t('Please select an MCU and component first'));
    let csv = 'Item,Type,Category,Buy Link\n';
    csv += '"' + helperMcu.replace(/"/g, '""') + '",MCU Board,' + MCU_INDEX[helperMcu].series + ',"' + cytronUrl(helperMcu) + '"\n';
    helperComps.forEach(n => {
        const c = COMP_INDEX[n] || {};
        csv += '"' + n.replace(/"/g, '""') + '",Component,' + (c.cat || '') + ',"' + cytronUrl(n) + '"\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pieware2_bom.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📦 BOM exported (with Cytron links)!');
}

function renderHelper() {
    persistHelperState();
    renderStepper();
    renderMcuChips();
    renderValidation();
    renderPowerEstimate();
    renderActiveComps();
    const clearBtn = document.getElementById('btn-clear-comps');
    if (clearBtn) clearBtn.disabled = !helperComps.length;
    const area = document.getElementById('visualizer-area');
    const w = buildWiring();
    if (!w) {
        area.classList.add('hidden');
        return;
    }
    area.classList.remove('hidden');

    // Cadangan beli — link carian Cytron bagi setiap komponen terpilih
    const buyArea = document.getElementById('buy-suggest');
    if (buyArea) {
        const buyable = helperComps.filter(n => {
            const c = COMP_INDEX[n];
            return c && c.k !== 'passive' && c.k !== 'wifi';
        });
        const mcuBuy = helperMcu;
        const items = buyable.length || !mcuBuy ? buyable : [];
        let links = '';
        if (mcuBuy) links += buyChip('🖥️ ' + mcuBuy);
        items.forEach(n => links += buyChip('📡 ' + n));
        buyArea.innerHTML = '<span style="font-weight:700;">🛒 Get the parts:</span>' + links;
    }

    document.getElementById('helper-msg').innerHTML = '<strong>' + esc(helperMcu) + '</strong> — ' + helperComps.length + ' component(s) connected.' + (helperBreadboard ? ' 🍞 Breadboard mode ON.' : '');

    // MCU pins (highlight used)
    const fam = w.fam;
    const usedPins = new Set(w.rows.map(r => String(r.mcu)));
    document.getElementById('vis-mcu-name').textContent = helperMcu;
    document.getElementById('vis-mcu-pins').innerHTML = fam.pins.map(p =>
        '<span class="pin-node ' + (usedPins.has(p) || [...usedPins].some(u => u.includes(p)) ? 'highlight' : '') + '">' + esc(p) + '</span>'
    ).join('');

    // Middle: breadboard atau animated flow
    const bbVis = document.getElementById('breadboard-visual');
    const cf1 = document.getElementById('conn-flow');
    const cf2 = document.getElementById('conn-flow-2');
    if (helperBreadboard) {
        bbVis.classList.remove('hidden');
        cf1.classList.add('hidden');
        cf2.classList.remove('hidden');
        document.getElementById('bb-note').textContent = helperComps.length + ' component' + (helperComps.length > 1 ? 's' : '') + ' via +/− rails & signal rows';
    } else {
        bbVis.classList.add('hidden');
        cf1.classList.remove('hidden');
        cf2.classList.add('hidden');
    }

    // Setiap komponen dapat blok tersendiri
    document.getElementById('vis-comps').innerHTML = helperComps.map(n => {
        const c = COMP_INDEX[n] || { p: [] };
        const pins = (c.k === 'passive') ? ['—'] : (c.p.length ? c.p : ['📶']);
        return '<div class="board-visual" style="max-width:340px;">' +
            '<h3 style="font-size:0.82rem;">' + esc(n) + '</h3>' +
            '<div class="pins-grid">' + pins.map(p => '<span class="pin-node highlight">' + esc(p) + '</span>').join('') + '</div>' +
            '</div>';
    }).join('');

    // Mapping table — dengan penjelasan "Why?" boleh expand
    document.getElementById('wiring-tbody').innerHTML = w.rows.map((r, i) => {
        const whyBtn = r.why
            ? ' <button class="why-btn" onclick="toggleWhy(' + i + ')" title="Why this pin?">Why?</button><div class="hidden" id="why-' + i + '" style="font-size:0.72rem; color:var(--text-muted); padding-top:0.25rem;">' + esc(r.why) + '</div>'
            : '';
        return '<tr><td style="font-size:0.8rem;">' + esc(r.comp) + '</td><td>' + esc(r.pin) + whyBtn + '</td><td style="color:var(--gold-light); font-weight:700;">' + esc(r.mcu) + '</td></tr>';
    }).join('');

    // Steps
    document.getElementById('wiring-steps').innerHTML = w.steps.map(s => '<li>' + esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</li>').join('');

    // Warnings
    const warnEl = document.getElementById('wiring-warning');
    if (w.warnings.length) {
        warnEl.textContent = '⚠️ ' + w.warnings.join(' | ');
        warnEl.classList.remove('hidden');
    } else warnEl.classList.add('hidden');
}

// --- Dictionary ---
let dictFilter = 'all';

function renderDictFilters() {
    const wrap = document.getElementById('dict-filters');
    if (!wrap) return;
    const cats = [['all', 'All']].concat(Object.keys(MCU_SERIES).map(s => [s, s + ' 🖥️']))
        .concat(Object.keys(COMPONENT_CATEGORIES).map(c => [c, c + ' 📡']));
    wrap.innerHTML = cats.map(([key, label]) =>
        '<button onclick="setDictFilter(\'' + esc(key) + '\')" style="padding:0.3rem 0.7rem; border-radius:var(--radius-full); font-size:0.72rem; font-weight:700; cursor:pointer; border:1px solid ' + (dictFilter === key ? 'var(--gold)' : 'var(--border-glass)') + '; background:' + (dictFilter === key ? 'rgba(212,175,55,0.15)' : 'transparent') + '; color:' + (dictFilter === key ? 'var(--gold-light)' : 'var(--text-muted)') + ';">' + esc(label) + '</button>'
    ).join('');
}

function setDictFilter(f) {
    dictFilter = f;
    renderDictFilters();
    renderDictionary(document.getElementById('dict-search').value);
}

function renderDictionary(q) {
    const area = document.getElementById('dict-area');
    if (!area) return;
    q = (q || '').toLowerCase().trim();
    let html = '';
    const match = s => !q || s.toLowerCase().includes(q);

    // 🔥 Recently Used (hanya bila tiada carian & filter All)
    if (dictFilter === 'all' && !q) {
        const recent = getRecent();
        if (recent.length) {
            html += '<div style="font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:0.5rem 0;">🔥 Recently Used</div><div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.8rem;">' +
                recent.map(n => '<button onclick="dictSelect(\'comp\', \'' + esc(n).replace(/'/g, "\\'") + '\')" style="padding:0.28rem 0.7rem; border-radius:var(--radius-full); background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); color:var(--secondary); font-size:0.72rem; font-weight:700; cursor:pointer;">' + esc(n) + '</button>').join('') +
                '</div>';
        }
    }

    Object.entries(MCU_SERIES).forEach(([series, list]) => {
        if (dictFilter !== 'all' && dictFilter !== series) return;
        const items = list.map(l => l[0]).filter(n => match(n) && (!helperWifiOnly || WIFI_MCUS.has(n)));
        if (!items.length) return;
        html += '<div style="font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:1rem 0 0.5rem;">🖥️ ' + esc(series) + ' Boards</div>';
        html += items.map(n => dictItem(n, 'mcu')).join('');
    });
    Object.entries(COMPONENT_CATEGORIES).forEach(([cat, list]) => {
        if (dictFilter !== 'all' && dictFilter !== cat) return;
        const items = list.map(c => c.n).filter(match);
        if (!items.length) return;
        html += '<div style="font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--gold); margin:1rem 0 0.5rem;">📡 ' + esc(cat) + '</div>';
        html += items.map(n => dictItem(n, 'comp')).join('');
    });
    area.innerHTML = html || '<p style="color:var(--text-muted); text-align:center; padding:1rem;">No matches found.</p>';

    function dictItem(n, kind) {
        return '<div class="search-result-item" style="border:1px solid var(--border-glass); margin-bottom:0.4rem;" onclick="dictSelect(\'' + esc(kind) + '\', \'' + esc(n).replace(/'/g, "\\'") + '\')"><span>' + (kind === 'mcu' ? '🖥️' : '📡') + '</span> <span>' + esc(n) + '</span></div>';
    }
}

function dictSelect(kind, name) {
    if (kind === 'mcu') {
        document.getElementById('mcu-select').value = name;
        onMcuChange();
    } else {
        if (!helperMcu) { showToast('Select an MCU board first'); return; }
        if (!helperComps.includes(name) && helperComps.length < MAX_COMPS) helperComps.push(name);
        renderHelper();
    }
    document.getElementById('helper').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================================================================
// SOURCE CODE GENERATOR — daripada pilihan Helper
// ===================================================================
function navToCodeFromHelper() {
    if (!buildWiring()) return showToast(t('Please select an MCU and component first'));
    generateCode();
    navTo('source');
}

function generateCode() {
    const w = buildWiring();
    if (!w) return showToast(t('Please select an MCU and component first'));
    const fam = w.fam;
    const P = pin => fam.strip(String(pin));

    let defines = '', setup = '', loop = '', includes = '', notes = [];
    let count = 0;

    helperComps.forEach(name => {
        const c = COMP_INDEX[name];
        if (!c || c.k === 'passive') return;
        const familyKey = MCU_INDEX[helperMcu] ? MCU_INDEX[helperMcu].family : '';

        if (c.k === 'wifi') {
            count++;
            if (familyKey === 'esp32') {
                includes += '#include <WiFi.h>\n#include <HTTPClient.h>\n';
                defines += 'const char* WIFI_SSID = "YOUR_WIFI_NAME";\nconst char* WIFI_PASS = "YOUR_WIFI_PASSWORD";\nconst char* TARGET_URL = "http://example.com/api/data";\n';
                setup += '  WiFi.begin(WIFI_SSID, WIFI_PASS);\n  Serial.print("Connecting to WiFi");\n  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }\n  Serial.println("\\nWiFi connected! IP: " + WiFi.localIP().toString());\n';
                loop += '  if (WiFi.status() == WL_CONNECTED) {\n    HTTPClient http;\n    http.begin(TARGET_URL);\n    int code = http.GET();\n    Serial.print("HTTP "); Serial.println(code);\n    if (code == 200) Serial.println(http.getString());\n    http.end();\n  }\n  delay(10000);\n';
            } else if (familyKey === 'esp8266') {
                includes += '#include <ESP8266WiFi.h>\n#include <ESP8266HTTPClient.h>\n';
                defines += 'const char* WIFI_SSID = "YOUR_WIFI_NAME";\nconst char* WIFI_PASS = "YOUR_WIFI_PASSWORD";\nconst char* TARGET_URL = "http://example.com/api/data";\n';
                setup += '  WiFi.begin(WIFI_SSID, WIFI_PASS);\n  Serial.print("Connecting to WiFi");\n  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }\n  Serial.println("\\nWiFi connected! IP: " + WiFi.localIP().toString());\n';
                loop += '  if (WiFi.status() == WL_CONNECTED) {\n    HTTPClient http;\n    http.begin(TARGET_URL);\n    int code = http.GET();\n    Serial.print("HTTP "); Serial.println(code);\n    if (code == 200) Serial.println(http.getString());\n    http.end();\n  }\n  delay(10000);\n';
            } else if (fam.code === 'py') {
                notes.push('WiFi Web Client on this board (Python): import requests; r = requests.get("http://example.com/api/data"); print(r.text)');
                defines += '// WiFi Web Client: use Python — see NOTES below\n';
            } else {
                notes.push('WiFi Web Client: ' + helperMcu + ' has no built-in WiFi. Use an ESP32/ESP8266 (enable the 📶 WiFi filter in Helper) or add an ESP module via UART.');
                defines += '// WiFi Web Client: NOT supported on this board — see NOTES\n';
            }
            return;
        }
        count++;
        const id = 'C' + count;
        const rowFor = pin => {
            const r = w.rows.find(r => r.comp === name && r.pin === pin);
            return r ? r.mcu : 'GND';
        };

        if (c.k === 'dht') {
            const pin = P(rowFor('DATA'));
            includes += '#include "DHT.h"\n';
            defines += '#define ' + id + '_PIN ' + pin + '\n#define ' + id + '_TYPE DHT' + (name.indexOf('DHT22') >= 0 ? '22' : '11') + '\nDHT dht' + count + '(' + id + '_PIN, ' + id + '_TYPE);\n';
            setup += '  dht' + count + '.begin();\n';
            loop += '  float h' + count + ' = dht' + count + '.readHumidity();\n  float t' + count + ' = dht' + count + '.readTemperature();\n  if (!isnan(h' + count + ') && !isnan(t' + count + ')) {\n    Serial.print("Humidity: "); Serial.print(h' + count + '); Serial.print(" %  Temp: "); Serial.print(t' + count + '); Serial.println(" C");\n  }\n  delay(2000);\n';
        } else if (c.k === 'us') {
            const trig = P(rowFor('TRIG')), echo = P(rowFor('ECHO'));
            defines += '#define ' + id + '_TRIG ' + trig + '\n#define ' + id + '_ECHO ' + echo + '\n';
            setup += '  pinMode(' + id + '_TRIG, OUTPUT);\n  pinMode(' + id + '_ECHO, INPUT);\n';
            loop += '  digitalWrite(' + id + '_TRIG, LOW); delayMicroseconds(2);\n  digitalWrite(' + id + '_TRIG, HIGH); delayMicroseconds(10);\n  digitalWrite(' + id + '_TRIG, LOW);\n  long dur = pulseIn(' + id + '_ECHO, HIGH);\n  float dist = dur * 0.034 / 2.0;\n  Serial.print("Distance: "); Serial.print(dist); Serial.println(" cm");\n  delay(500);\n';
        } else if (c.k === 'din') {
            const sigPin = c.p.find(p => !/^(VCC|GND|5V|3V)/i.test(p)) || c.p[0];
            const pin = P(rowFor(sigPin));
            defines += '#define ' + id + '_PIN ' + pin + '\n';
            setup += '  pinMode(' + id + '_PIN, INPUT);\n';
            loop += '  int v' + count + ' = digitalRead(' + id + '_PIN);\n  Serial.print("' + name.replace(/"/g, '') + ': "); Serial.println(v' + count + ');\n  delay(300);\n';
        } else if (c.k === 'ana') {
            const sigPin = c.p.find(p => !/^(VCC|GND|5V|3V)/i.test(p)) || c.p[0];
            const pin = P(rowFor(sigPin));
            defines += '#define ' + id + '_PIN ' + (pin === 'N/A' ? 'A0' : pin) + '\n';
            loop += '  int raw' + count + ' = analogRead(' + id + '_PIN);\n  Serial.print("' + name.replace(/"/g, '') + ' raw: "); Serial.println(raw' + count + ');\n  delay(300);\n';
        } else if (c.k === 'dout') {
            const sigPin = c.p.find(p => !/^(VCC|GND|5V|3V|\+|-|Anode|Cathode)/i.test(p)) || c.p[0];
            const pin = P(rowFor(sigPin));
            defines += '#define ' + id + '_PIN ' + pin + '\n';
            setup += '  pinMode(' + id + '_PIN, OUTPUT);\n';
            loop += '  digitalWrite(' + id + '_PIN, HIGH); delay(1000);\n  digitalWrite(' + id + '_PIN, LOW); delay(1000);\n';
        } else if (c.k === 'servo') {
            const pin = P(rowFor('SIG'));
            includes += '#include <Servo.h>\n';
            defines += '#define ' + id + '_PIN ' + pin + '\nServo servo' + count + ';\n';
            setup += '  servo' + count + '.attach(' + id + '_PIN);\n';
            loop += '  servo' + count + '.write(0); delay(1000);\n  servo' + count + '.write(180); delay(1000);\n';
        } else if (c.k === 'stepper4') {
            const pins = ['IN1', 'IN2', 'IN3', 'IN4'].map(pn => P(rowFor(pn)));
            includes += '#include <Stepper.h>\n';
            defines += 'Stepper stepper' + count + '(2048, ' + pins.join(', ') + ');\n';
            setup += '  stepper' + count + '.setSpeed(10);\n';
            loop += '  stepper' + count + '.step(512); delay(500);\n  stepper' + count + '.step(-512); delay(500);\n';
        } else if (c.k === 'stepper2') {
            const st = P(rowFor('STEP')), dr = P(rowFor('DIR'));
            defines += '#define ' + id + '_STEP ' + st + '\n#define ' + id + '_DIR ' + dr + '\n';
            setup += '  pinMode(' + id + '_STEP, OUTPUT);\n  pinMode(' + id + '_DIR, OUTPUT);\n';
            loop += '  digitalWrite(' + id + '_DIR, HIGH);\n  for (int i = 0; i < 200; i++) { digitalWrite(' + id + '_STEP, HIGH); delayMicroseconds(1000); digitalWrite(' + id + '_STEP, LOW); delayMicroseconds(1000); }\n  delay(500);\n';
        } else if (c.k === 'motor') {
            const i1 = P(rowFor('IN1') || 'N/A'), i2 = P(rowFor('IN2') || 'N/A'), en = P(rowFor(c.p.find(p => /^EN|PWM/i.test(p))) || 'N/A');
            defines += '#define ' + id + '_IN1 ' + (i1 === 'N/A' ? P(w.fam.dig[0]) : i1) + '\n#define ' + id + '_IN2 ' + (i2 === 'N/A' ? P(w.fam.dig[1]) : i2) + '\n#define ' + id + '_EN ' + (en === 'N/A' ? P(w.fam.dig[2]) : en) + '\n';
            setup += '  pinMode(' + id + '_IN1, OUTPUT); pinMode(' + id + '_IN2, OUTPUT); pinMode(' + id + '_EN, OUTPUT);\n';
            loop += '  digitalWrite(' + id + '_IN1, HIGH); digitalWrite(' + id + '_IN2, LOW); analogWrite(' + id + '_EN, 200); delay(2000);\n  digitalWrite(' + id + '_IN1, LOW); digitalWrite(' + id + '_IN2, LOW); delay(500);\n';
        } else if (c.k === 'rgb') {
            const r = P(rowFor('R')), g = P(rowFor('G')), b = P(rowFor('B'));
            defines += '#define ' + id + '_R ' + r + '\n#define ' + id + '_G ' + g + '\n#define ' + id + '_B ' + b + '\n';
            setup += '  pinMode(' + id + '_R, OUTPUT); pinMode(' + id + '_G, OUTPUT); pinMode(' + id + '_B, OUTPUT);\n';
            loop += '  analogWrite(' + id + '_R, 255); delay(500); analogWrite(' + id + '_R, 0);\n  analogWrite(' + id + '_G, 255); delay(500); analogWrite(' + id + '_G, 0);\n  analogWrite(' + id + '_B, 255); delay(500); analogWrite(' + id + '_B, 0);\n';
        } else if (c.k === 'i2c') {
            defines += '// ' + name + ' on I2C: SDA=' + fam.i2c[0] + ', SCL=' + fam.i2c[1] + '\n';
            includes += '#include <Wire.h>\n';
            setup += '  Wire.begin();\n';
            loop += '  // ' + name + ' — use its specific library (check Hub for examples).\n';
            notes.push(name + ': connect SDA→' + fam.i2c[0] + ', SCL→' + fam.i2c[1] + ' and install the device-specific library.');
        } else if (c.k === 'spi') {
            defines += '// ' + name + ' on SPI: MOSI=' + fam.spi.MOSI + ', MISO=' + fam.spi.MISO + ', SCK=' + fam.spi.SCK + ', CS=' + fam.spi.CS + '\n';
            notes.push(name + ': install its specific library (e.g. MFRC522, SD, LoRa) and use the CS pin ' + fam.spi.CS + '.');
        } else if (c.k === 'nrf') {
            defines += '// nRF24L01: MOSI=' + fam.spi.MOSI + ', MISO=' + fam.spi.MISO + ', SCK=' + fam.spi.SCK + ', CSN=' + fam.spi.CS + '\n';
            includes += '#include <RF24.h>\nRF24 radio(' + P(fam.spi.CS) + ', ' + P(fam.dig[0]) + ');\n';
            setup += '  radio.begin();\n';
            notes.push('nRF24L01: CE is on ' + fam.dig[0] + '. Power with 3.3V only.');
        } else if (c.k === 'uart') {
            defines += '// ' + name + ' on UART: module TX→' + fam.uart[0] + ', module RX→' + fam.uart[1] + '\n';
            setup += '  Serial1.begin(9600);\n';
            loop += '  while (Serial1.available()) Serial.write(Serial1.read());\n';
            notes.push(name + ': 9600 baud typical. On boards without Serial1, use SoftwareSerial (AVR) or another hardware UART.');
        } else if (c.k === 'lcd') {
            const rs = P(rowFor('RS')), en = P(rowFor('E'));
            const d4 = P(rowFor('D4')), d5 = P(rowFor('D5')), d6 = P(rowFor('D6')), d7 = P(rowFor('D7'));
            includes += '#include <LiquidCrystal.h>\n';
            defines += 'LiquidCrystal lcd' + count + '(' + rs + ', ' + en + ', ' + d4 + ', ' + d5 + ', ' + d6 + ', ' + d7 + ');\n';
            setup += '  lcd' + count + '.begin(16, 2);\n  lcd' + count + '.print("Pieware 2!");\n';
        } else if (c.k === 'seg' || c.k === 'color' || c.k === 'multi2' || c.k === 'multi4' || c.k === 'multi8') {
            defines += '// ' + name + ' — multi-pin device, mapping shown in the wiring table above.\n';
            notes.push(name + ': check the wiring table for pin assignments; a driver IC (MAX7219/TM1637) is recommended.');
        }
    });

    if (!count) {
        document.getElementById('code-explanation').textContent = 'Only passive components selected — add a sensor, display or actuator in Helper to generate code.';
        document.getElementById('code-block').textContent = '// No active components to generate code for.\n// Go back to Helper and add e.g. an LED, DHT11 or servo.';
        document.getElementById('code-output').classList.remove('hidden');
        document.getElementById('code-empty').classList.add('hidden');
        return;
    }

    let code = '// Generated by Pieware 2 — MCU: ' + helperMcu + '\n';
    if (helperBreadboard) code += '// Breadboard mode: power rails used for VCC/GND distribution\n';
    code += (includes ? includes + '\n' : '') + defines + '\nvoid setup() {\n  Serial.begin(115200);\n' + setup + '}\n\nvoid loop() {\n' + loop + '}\n';
    if (notes.length) code += '\n/* NOTES:\n' + notes.map(n => '   - ' + n).join('\n') + '\n*/';

    document.getElementById('code-explanation').textContent = 'Generated for ' + helperMcu + ' with ' + count + ' active component(s)' + (helperBreadboard ? ' using a breadboard' : '') + '. Pin assignments follow the wiring table in the Helper tab.';
    document.getElementById('code-block').textContent = code;
    document.getElementById('code-output').classList.remove('hidden');
    document.getElementById('code-empty').classList.add('hidden');
}
// ===================================================================
// CALCULATORS
// ===================================================================
function calculateOhm() {
    const v = parseFloat(document.getElementById('calc-v').value);
    const i = parseFloat(document.getElementById('calc-i').value);
    const r = parseFloat(document.getElementById('calc-r').value);
    const res = document.getElementById('ohm-result');
    res.classList.remove('hidden');

    let filled = 0;
    if (!isNaN(v)) filled++;
    if (!isNaN(i)) filled++;
    if (!isNaN(r)) filled++;

    if (filled < 2) { res.className = 'alert alert-danger'; res.innerHTML = 'Please enter at least 2 values.'; return; }
    if (filled === 3) { res.className = 'alert alert-warning'; res.innerHTML = 'Enter only 2 values. The third one will be calculated.'; return; }

    res.className = 'alert alert-info';
    if (isNaN(v)) {
        const voltage = i * r;
        res.innerHTML = `<strong>Voltage (V)</strong> = I × R = ${i} × ${r} = <strong>${voltage.toFixed(4)} V</strong>`;
    } else if (isNaN(i)) {
        const current = v / r;
        res.innerHTML = `<strong>Current (I)</strong> = V / R = ${v} / ${r} = <strong>${current.toFixed(6)} A</strong> (${(current * 1000).toFixed(2)} mA)`;
    } else {
        const resistance = v / i;
        res.innerHTML = `<strong>Resistance (R)</strong> = V / I = ${v} / ${i} = <strong>${resistance.toFixed(4)} Ω</strong>`;
    }
}

function calculateLED() {
    const vs = parseFloat(document.getElementById('led-vs').value);
    const vf = parseFloat(document.getElementById('led-vf').value);
    const ifMa = parseFloat(document.getElementById('led-if').value);
    const res = document.getElementById('led-result');
    res.classList.remove('hidden');

    if (isNaN(vs) || isNaN(vf) || isNaN(ifMa)) { res.className = 'alert alert-danger'; res.innerHTML = 'Please fill in all fields.'; return; }
    if (vf >= vs) { res.className = 'alert alert-danger'; res.innerHTML = 'Forward voltage cannot be greater than or equal to source voltage!'; return; }

    const ifA = ifMa / 1000;
    const r = (vs - vf) / ifA;
    const power = vs * ifA;

    // Standard resistor values
    const standards = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 1200, 1500, 1800, 2200, 2700, 3300, 4700, 5600, 6800, 10000];
    const nearest = standards.reduce((prev, curr) => Math.abs(curr - r) < Math.abs(prev - r) ? curr : prev);

    res.className = 'alert alert-info';
    res.innerHTML = `
        <strong>Calculated Resistance:</strong> ${r.toFixed(1)} Ω<br>
        <strong>Nearest Standard:</strong> ${nearest} Ω (${nearest >= 1000 ? (nearest/1000) + 'kΩ' : nearest + 'Ω'})<br>
        <strong>Power Dissipation:</strong> ${(power * 1000).toFixed(2)} mW<br>
        <strong>Min Resistor Rating:</strong> ${Math.ceil(power * 1000 / 250) * 250} mW (1/4W OK: ${power * 1000 <= 250 ? 'Yes' : 'No — use 1/2W'})
    `;
}

function calculateDivider() {
    const vin = parseFloat(document.getElementById('vd-vin').value);
    const r1 = parseFloat(document.getElementById('vd-r1').value);
    const r2 = parseFloat(document.getElementById('vd-r2').value);
    const res = document.getElementById('vd-result');
    res.classList.remove('hidden');
    if (isNaN(vin) || isNaN(r1) || isNaN(r2)) { res.className = 'alert alert-danger'; res.innerHTML = 'Please fill in all fields.'; return; }
    if (r1 + r2 === 0) { res.className = 'alert alert-danger'; res.innerHTML = 'R1 + R2 cannot be zero!'; return; }
    const vout = vin * r2 / (r1 + r2);
    const current = vin / (r1 + r2) * 1000; // mA
    res.className = 'alert alert-info';
    res.innerHTML = `
        <strong>Output (Vout):</strong> ${vout.toFixed(3)} V<br>
        <strong>Current through divider:</strong> ${current.toFixed(3)} mA<br>
        <strong>Power:</strong> ${((vin * vin) / (r1 + r2) * 1000).toFixed(2)} mW total
    `;
    if (vout > 3.3) res.innerHTML += '<br>⚠️ Vout exceeds 3.3V — not safe for 3.3V MCU pins!';
}

function calculateRC() {
    const r = parseFloat(document.getElementById('rc-r').value);
    const cUf = parseFloat(document.getElementById('rc-c').value);
    const res = document.getElementById('rc-result');
    res.classList.remove('hidden');
    if (isNaN(r) || isNaN(cUf)) { res.className = 'alert alert-danger'; res.innerHTML = 'Please fill in all fields.'; return; }
    if (r <= 0 || cUf <= 0) { res.className = 'alert alert-danger'; res.innerHTML = 'Values must be positive.'; return; }
    const tau = r * (cUf / 1e6); // seconds
    const fmt = s => s >= 1 ? s.toFixed(2) + ' s' : s >= 0.001 ? (s * 1000).toFixed(2) + ' ms' : (s * 1e6).toFixed(1) + ' µs';
    res.className = 'alert alert-info';
    res.innerHTML = `
        <strong>Time constant (τ):</strong> ${fmt(tau)}<br>
        <strong>Full charge (5τ):</strong> ${fmt(tau * 5)}<br>
        <strong>63.2% @ 1τ · 86.5% @ 2τ · 95% @ 3τ · 99.3% @ 5τ</strong>
    `;
}

// ===================================================================
// ADMIN PANEL
// ===================================================================
function loadAdminData() {
    db.ref('orders').on('value', snap => {
        allOrders = snap.val() || {};
        renderAdminStats();
        renderAdminCharts();
        renderAdminOrders();
    });
    renderAdminProducts();
}

function renderAdminStats() {
    const orders = Object.values(allOrders);
    const completed = orders.filter(o => o.status === 'completed');
    const totalSales = completed.reduce((s, o) => {
        return s + (o.items || []).reduce((ss, it) => ss + (it.qty || 0), 0);
    }, 0);
    const totalRevenue = completed.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = completed.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    document.getElementById('stat-total-sales').textContent = totalSales;
    document.getElementById('stat-revenue').textContent = 'RM ' + totalRevenue.toFixed(2);
    document.getElementById('stat-orders').textContent = totalOrders;
    document.getElementById('stat-avg').textContent = 'RM ' + avgOrder.toFixed(2);
}

function renderAdminCharts() {
    const orders = Object.values(allOrders).filter(o => o.status === 'completed');

    // --- Sales Graph (line chart — harian 7 hari terakhir) ---
    const days = [];
    const dayLabels = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
        days.push({ start: d.getTime(), end: nextD.getTime(), label: dayNames[d.getDay()] + ' ' + d.getDate() });
        dayLabels.push(dayNames[d.getDay()] + ' ' + d.getDate());
    }

    const salesByDay = days.map(day => {
        return orders.filter(o => {
            const t = new Date(o.date).getTime();
            return t >= day.start && t < day.end;
        }).reduce((s, o) => s + (o.total || 0), 0);
    });

    const ctxLine = document.getElementById('sales-chart').getContext('2d');
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Revenue (RM)',
                data: salesByDay,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212,175,55,0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } } }
            },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#9ca3af', callback: v => 'RM' + v }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            }
        }
    });

    // --- Pie Chart — Best Selling Items ---
    const itemSales = {};
    orders.forEach(o => {
        (o.items || []).forEach(it => {
            if (!itemSales[it.name]) itemSales[it.name] = 0;
            itemSales[it.name] += it.qty || 0;
        });
    });

    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const pieLabels = sortedItems.map(i => i[0]);
    const pieData = sortedItems.map(i => i[1]);
    const pieColors = ['#D4AF37', '#F5D76E', '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

    const ctxPie = document.getElementById('pie-chart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: pieLabels.length ? pieLabels : ['No Data'],
            datasets: [{
                data: pieData.length ? pieData : [1],
                backgroundColor: pieData.length ? pieColors : ['rgba(255,255,255,0.1)'],
                borderColor: 'rgba(0,0,0,0.3)',
                borderWidth: 2,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 12, usePointStyle: true }
                }
            }
        }
    });
}

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    const entries = Object.entries(allOrders).sort((a, b) => new Date(b[1].date) - new Date(a[1].date));

    if (!entries.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:var(--space-xl); color:var(--text-muted);">' + t('No orders yet.') + '</td></tr>';
        return;
    }

    tbody.innerHTML = entries.map(([key, o]) => {
        const d = new Date(o.date);
        const dateStr = d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' }) + '<br>' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
        const itemsStr = (o.items || []).map(it => `${parseInt(it.qty) || 0}x ${esc(it.name)}`).join(', ');
        const statusClass = o.status === 'completed' ? 'status-completed' : 'status-pending';
        return `<tr>
            <td class="font-mono" style="font-size:0.78rem; font-weight:700;">${esc(o.id) || esc(key)}</td>
            <td style="font-size:0.8rem;">${dateStr}</td>
            <td>${o.customer ? esc(o.customer.name) : '-'}</td>
            <td style="font-size:0.8rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemsStr}</td>
            <td style="font-weight:700; color:var(--primary);">RM ${(o.total || 0).toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${esc(o.status) || 'pending'}</span></td>
            <td><button class="btn btn-sm" style="background:rgba(244,63,94,0.15); color:var(--danger); font-size:0.72rem;" onclick="deleteOrder('${key}', this)">Remove</button></td>
        </tr>`;
    }).join('');
}

function deleteOrder(key, btn) {
    const o = allOrders[key];
    const label = o && o.id ? o.id : key;
    if (!confirm(t('Delete order') + ' ' + label + '? ' + t('Stock for items in this order will be restored. This action cannot be undone.'))) return;
    btn.disabled = true;
    btn.textContent = '...';
    db.ref('orders/' + key).remove(function(err) {
        if (err) {
            btn.disabled = false;
            btn.textContent = 'Remove';
            showToast(t('Failed to delete order!'));
            console.error(err);
            return;
        }
        restockOrder(o);
        showToast('Order ' + label + ' ' + t('deleted & stock restored'));
        // Listener 'orders' akan auto-refresh stats, charts & table
    });
}

function restockOrder(o) {
    if (!o || !o.items) return;
    // Fallback: order lama tak simpan key produk — padan ikut nama
    const keyByName = {};
    Object.entries(allProducts).forEach(([k, p]) => {
        if (p && p.name) keyByName[p.name] = k;
    });
    o.items.forEach(function(it) {
        const prodKey = it.key || keyByName[it.name];
        if (!prodKey || !allProducts[prodKey]) return; // produk dah dipadam
        db.ref('shopProducts/' + prodKey + '/stock').transaction(function(cur) {
            return (parseInt(cur) || 0) + (parseInt(it.qty) || 0);
        });
    });
}

// ===================================================================
// PRODUCT MANAGEMENT (ADMIN)
// ===================================================================
function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    const entries = Object.entries(allProducts);

    if (!entries.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:var(--space-xl); color:var(--text-muted);">' + t('No products yet. Click "+ Add Product" to get started.') + '</td></tr>';
        return;
    }

    tbody.innerHTML = entries.map(([key, p]) => {
        const stock = parseInt(p.stock) || 0;
        const stockStyle = stock > 0 ? 'color:var(--secondary);' : 'color:var(--danger);';
        return `<tr>
            <td>${esc(p.icon) || '📦'} ${esc(p.name) || 'Unnamed'}</td>
            <td style="font-weight:700; color:var(--primary);">RM ${(parseFloat(p.price) || 0).toFixed(2)}</td>
            <td style="font-weight:700; ${stockStyle}">${stock}</td>
            <td>
                <button class="btn btn-sm btn-outline" style="font-size:0.72rem; margin-right:0.3rem;" onclick="editProduct('${key}')">Edit</button>
                <button class="btn btn-sm" style="background:rgba(244,63,94,0.15); color:var(--danger); font-size:0.72rem;" onclick="deleteProduct('${key}', this)">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

function openProductForm(key) {
    document.getElementById('product-form').classList.remove('hidden');
    if (key && allProducts[key]) {
        const p = allProducts[key];
        document.getElementById('prod-key').value = key;
        document.getElementById('prod-name').value = p.name || '';
        document.getElementById('prod-desc').value = p.desc || '';
        document.getElementById('prod-price').value = p.price != null ? p.price : '';
        document.getElementById('prod-stock').value = parseInt(p.stock) || 0;
        document.getElementById('prod-icon').value = p.icon || '';
        document.getElementById('prod-image').value = p.image || '';
        document.getElementById('prod-buyurl').value = p.buyUrl || '';
    }
    document.getElementById('prod-name').focus();
}

function editProduct(key) { openProductForm(key); }

function closeProductForm() {
    document.getElementById('product-form').classList.add('hidden');
    ['prod-key', 'prod-name', 'prod-desc', 'prod-price', 'prod-stock', 'prod-icon', 'prod-image', 'prod-buyurl'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function saveProduct() {
    const key = document.getElementById('prod-key').value.trim();
    const name = document.getElementById('prod-name').value.trim();
    const desc = document.getElementById('prod-desc').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);
    const icon = document.getElementById('prod-icon').value.trim();
    const image = document.getElementById('prod-image').value.trim();
    const buyUrl = document.getElementById('prod-buyurl').value.trim();

    if (!name) return showToast(t('Product name is required'));
    if (isNaN(price) || price < 0) return showToast(t('Invalid price'));
    if (isNaN(stock) || stock < 0) return showToast(t('Invalid stock'));
    if (image && !/^https?:\/\/.+/i.test(image)) return showToast(t('Image URL must start with http:// or https://'));
    if (buyUrl && !/^https?:\/\/.+/i.test(buyUrl)) return showToast('Affiliate URL must start with http:// or https://');

    const product = {
        name: name,
        desc: desc,
        price: price,
        stock: stock,
        icon: icon || '📦',
        image: image || null,
        buyUrl: buyUrl || null
    };

    const ref = key ? db.ref('shopProducts/' + key) : db.ref('shopProducts').push();
    ref.set(product, function(err) {
        if (err) { showToast(t('Failed to save product!')); console.error(err); return; }
        closeProductForm();
        showToast(key ? t('Product updated') : t('Product added'));
    });
}

function deleteProduct(key, btn) {
    const p = allProducts[key];
    const label = p && p.name ? p.name : key;
    if (!confirm('Delete product "' + label + '"? This action cannot be undone.')) return;
    btn.disabled = true;
    db.ref('shopProducts/' + key).remove(function(err) {
        if (err) {
            btn.disabled = false;
            showToast(t('Failed to delete product!'));
            console.error(err);
            return;
        }
        // Item cart yang berkaitan akan dibuang automatik oleh loadProducts
        showToast(t('Product deleted'));
    });
}

// ===================================================================
// EXPORT TO GOOGLE SHEETS (CSV)
// ===================================================================
function exportToGoogleSheets() {
    const orders = Object.values(allOrders).filter(o => o.status === 'completed');
    if (!orders.length) return showToast(t('No data to export'));

    let csv = 'Order ID,Date,Customer Name,Email,Phone,Payment Method,Items,Quantity,Total (RM),Status\n';
    orders.forEach(o => {
        const d = new Date(o.date).toLocaleString();
        const items = (o.items || []).map(it => it.name).join('; ');
        const qtys = (o.items || []).map(it => it.qty).join('; ');
        csv += `"${o.id}","${d}","${o.customer ? o.customer.name : ''}","${o.customer ? o.customer.email : ''}","${o.customer ? o.customer.phone : ''}","${o.paymentMethod || ''}","${items}","${qtys}","${(o.total || 0).toFixed(2)}","${o.status || ''}"\n`;
    });

    // Tambah summary sheet
    csv += '\n\n--- BEST SELLING ITEMS ---\n';
    csv += 'Item Name,Total Sold\n';
    const itemSales = {};
    orders.forEach(o => (o.items || []).forEach(it => { itemSales[it.name] = (itemSales[it.name] || 0) + it.qty; }));
    Object.entries(itemSales).sort((a, b) => b[1] - a[1]).forEach(([name, qty]) => {
        csv += `"${name}",${qty}\n`;
    });

    csv += '\n\n--- DAILY SUMMARY ---\n';
    csv += 'Date,Revenue (RM),Orders\n';
    const dayMap = {};
    orders.forEach(o => {
        const day = new Date(o.date).toLocaleDateString();
        if (!dayMap[day]) dayMap[day] = { revenue: 0, count: 0 };
        dayMap[day].revenue += o.total || 0;
        dayMap[day].count++;
    });
    Object.entries(dayMap).sort().forEach(([day, data]) => {
        csv += `"${day}","${data.revenue.toFixed(2)}",${data.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pieware2_sales_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('CSV downloaded! Open it with Google Sheets.'));
}

// ===================================================================
// KEYBOARD SHORTCUTS
// ===================================================================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('search-modal').classList.remove('active');
        document.getElementById('settings-modal').classList.remove('active');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleSearch(); }
    // Helper shortcuts
    if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'C' || e.key === 'c') { e.preventDefault(); navToCodeFromHelper(); }
        if (e.key === 'R' || e.key === 'r') { e.preventDefault(); clearAllComps(); }
        if (e.key === 'S' || e.key === 's') { e.preventDefault(); shareProject(); }
    }
});

// ===================================================================
// ADMIN LOGIN — Firebase Auth (email/password)
// ===================================================================
// TUKAR emel ini kepada emel admin anda (mesti wujud dalam
// Firebase Console > Authentication > Users)
const ADMIN_EMAIL = 'admin@pieware.com';

const auth = firebase.auth();
let isAdmin = false;
let pendingAdminLogin = false;

// Sesi admin kekal automatik merentas refresh (Firebase Auth persistence)
auth.onAuthStateChanged(function(user) {
    const btn = document.getElementById('admin-login-btn');
    const admin = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    isAdmin = admin;
    if (btn) btn.textContent = admin ? '👑' : '🔐';
    if (admin && pendingAdminLogin) {
        pendingAdminLogin = false;
        document.getElementById('login-modal').classList.remove('active');
        document.getElementById('admin-password').value = '';
        showToast('Admin access granted');
        navTo('admin');
    }
});

// Butang 🔐 di sebelah cart — login admin / terus ke panel
function onLoginBtnClick() {
    if (isAdmin) navTo('admin');
    else {
        document.getElementById('login-modal').classList.add('active');
        setTimeout(() => document.getElementById('admin-email').focus(), 200);
    }
}

async function checkAdminLogin() {
    const email = (document.getElementById('admin-email').value || '').trim();
    const pw = document.getElementById('admin-password').value;
    if (!email || !pw) return showToast(t('Please enter email and password'));
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return showToast(t('This email is not an admin'));
    pendingAdminLogin = true;
    try {
        await auth.signInWithEmailAndPassword(email, pw);
        // onAuthStateChanged akan uruskan baki aliran
    } catch (err) {
        pendingAdminLogin = false;
        var msg = t('Login failed');
        if (err && (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found')) msg = t('Incorrect email or password');
        showToast(msg);
    }
}

function adminLogout() {
    auth.signOut().then(function() {
        isAdmin = false;
        showToast('Admin logged out');
        navTo('home');
    });
}

// Override navTo — block admin tanpa login
const _originalNavTo = navTo;
navTo = function(target) {
    if (target === 'admin' && !isAdmin) {
        document.getElementById('login-modal').classList.add('active');
        setTimeout(() => document.getElementById('admin-email').focus(), 200);
        return;
    }
    _originalNavTo(target);
};
// ===================================================================
// INIT — set home as active
// ===================================================================
navTo('home');
// Kekalkan sesi admin selepas refresh — dikendalikan oleh onAuthStateChanged
