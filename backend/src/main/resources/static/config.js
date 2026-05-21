/** CARTEX shared frontend config — no API keys here (all keys are on the backend). */

const API_BASE_URL = (window.location.origin && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://localhost:8080/api';

const APP_NAME = 'CARTEX';

/** Loaded from GET /api/status; fallback matches default in application.properties */
let APP_ADMIN_EMAIL = 'hassanfarooq565656@gmail.com';

async function loadAppConfig() {
    try {
        const res = await fetch(`${API_BASE_URL}/status`);
        if (res.ok) {
            const data = await res.json();
            if (data.adminEmail) APP_ADMIN_EMAIL = data.adminEmail;
        }
    } catch (_) { /* backend offline */ }
}

function isAdminUser(user) {
    if (!user || !user.email) return false;
    return user.email.trim().toLowerCase() === APP_ADMIN_EMAIL.trim().toLowerCase();
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (user.password) delete user.password;
        return user;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    if (!user) return;
    const safe = { id: user.id, username: user.username, email: user.email };
    localStorage.setItem('user', JSON.stringify(safe));
}

function clearCurrentUser() {
    localStorage.removeItem('user');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function clearCartEverywhere(userId) {
    localStorage.setItem('cart', '[]');
    sessionStorage.removeItem('pendingCartProduct');
    sessionStorage.setItem('cartJustCleared', '1');
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.innerText = '0';
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}/clear`, { method: 'POST' });
        if (!res.ok) throw new Error('Server cart clear failed');
    } catch (e) {
        console.error('Clear cart API:', e);
    }
}
