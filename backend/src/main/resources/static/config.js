const API_BASE_URL = (window.location.origin && window.location.protocol.startsWith('http'))
    ? `${window.location.origin}/api`
    : 'http://localhost:8080/api';

const APP_NAME = 'CARTEX';

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
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

/** Clear cart on server and locally so user can shop fresh after checkout */
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
