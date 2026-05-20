let currentUser = null;
let cart = [];
let allProducts = [];
let recLoadTimer = null;
let supportChatReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = getCurrentUser();
    init3DBackground();
    updateNavAuth();

    const orderComplete = new URLSearchParams(location.search).get('orderComplete') === '1';
    const cartWasJustCleared = sessionStorage.getItem('cartJustCleared') === '1';

    if (cartWasJustCleared || orderComplete) {
        forceEmptyCartUI();
        sessionStorage.removeItem('pendingCartProduct');
        sessionStorage.removeItem('cartJustCleared');
        if (currentUser && orderComplete) {
            try {
                await clearCartEverywhere(currentUser.id);
                sessionStorage.removeItem('cartJustCleared');
                forceEmptyCartUI();
            } catch (e) {
                console.error('Checkout cleanup error:', e);
            }
        }
        showOrderSuccessToast();
    } else {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
        syncCartCount();
    }

    if (currentUser && !orderComplete) {
        const pending = sessionStorage.getItem('pendingCartProduct');
        if (pending) {
            sessionStorage.removeItem('pendingCartProduct');
            addToCart(JSON.parse(pending), true);
        }
        loadAiGreeting();
        initSupportChat();
    } else if (currentUser) {
        loadAiGreeting();
        initSupportChat();
    } else {
        hideAiBanner();
        hideSupportChat();
    }
    fetchProducts();
    fetchCategories();
});

function showOrderSuccessToast() {
    forceEmptyCartUI();
}

function forceEmptyCartUI() {
    cart = [];
    saveCart();
    syncCartCount();
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = '0';
}

function updateNavAuth() {
    const navUser = document.getElementById('navUser');
    const authNavButtons = document.getElementById('authNavButtons');
    const logoutBtn = document.getElementById('logoutBtn');
    const recordsLink = document.getElementById('recordsLink');
    const adminLink = document.getElementById('adminLink');

    if (currentUser) {
        navUser.textContent = currentUser.username;
        navUser.style.display = 'inline';
        authNavButtons.style.display = 'none';
        logoutBtn.style.display = 'flex';
        recordsLink.style.display = 'inline-flex';
        
        // Show Admin link only for specific user
        if (currentUser.email === 'hassanfarooq565656@gmail.com') {
            if (adminLink) adminLink.style.display = 'inline-flex';
        } else {
            if (adminLink) adminLink.style.display = 'none';
        }
    } else {
        navUser.textContent = '';
        navUser.style.display = 'none';
        authNavButtons.style.display = 'flex';
        logoutBtn.style.display = 'none';
        recordsLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function redirectToAuth(mode = 'login') {
    window.location.href = `auth.html?mode=${mode}&return=${encodeURIComponent('index.html')}`;
}

function syncCartCount() {
    const count = cart.reduce((s, i) => s + (i.qty || i.quantity || 0), 0);
    const el = document.getElementById('cartCount');
    if (el) el.innerText = count;
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

async function refreshCartFromServer() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${currentUser.id}`);
        if (res.ok) {
            const data = await res.json();
            cart = (data.items || []).map(i => {
                const p = allProducts.find(x => x.id === i.productId);
                return {
                    id: i.productId,
                    name: i.name,
                    price: Number(i.price),
                    qty: i.quantity,
                    cat: p?.category?.name || '',
                    tags: p?.tags || ''
                };
            });
            saveCart();
            syncCartCount();
        }
    } catch (e) {
        console.error('Cart sync error:', e);
        syncCartCount();
    }
}

function init3DBackground() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const material = new THREE.PointsMaterial({ size: 0.005, color: '#6366f1', transparent: true, opacity: 0.8 });
    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);
    camera.position.z = 2;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    function animate() {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.001;
        if (mouseX > 0) {
            particlesMesh.rotation.x += (mouseY - window.innerHeight / 2) * 0.00005;
            particlesMesh.rotation.y += (mouseX - window.innerWidth / 2) * 0.00005;
        }
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        allProducts = await res.json();
        displayProducts(allProducts.filter(p => p.imageUrl || p.image_url));
        if (currentUser) {
            const justOrdered = new URLSearchParams(location.search).get('orderComplete') === '1';
            if (justOrdered) {
                forceEmptyCartUI();
            } else {
                await refreshCartFromServer();
            }
            scheduleRecommendations();
        }
    } catch (e) { console.error('Fetch error:', e); }
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const categories = await res.json();
        const uniqueCategories = [];
        const seen = new Set();
        categories.forEach(c => {
            const name = c.name.trim();
            if (!seen.has(name.toLowerCase())) {
                seen.add(name.toLowerCase());
                uniqueCategories.push(c);
            }
        });
        document.getElementById('categoryList').innerHTML =
            '<li class="active" onclick="filterByCategory(\'all\', this)">All Products</li>' +
            uniqueCategories.map(c => `<li onclick="filterByCategory('${c.name}', this)">${c.name}</li>`).join('');
    } catch (e) { console.error('Categories fetch error:', e); }
}

function displayProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="product-card" style="animation: slideUp 0.5s ease backwards">
            <span class="category-badge">${escapeHtml(p.category?.name || 'New')}</span>
            <img src="${p.imageUrl || p.image_url || recommendationFallbackImage(p.name)}" 
                 class="product-image" 
                 onerror="this.src=recommendationFallbackImage('${escapeHtml(p.name)}'); this.onerror=null;">
            <div class="product-info">
                <h3>${escapeHtml(p.name)}</h3>
                <p class="price">$${Number(p.price).toFixed(2)}</p>
                <button class="btn-primary" data-product='${JSON.stringify({ id: p.id, name: p.name, price: p.price, tags: p.tags || '', cat: p.category?.name || '' })}' onclick="addToCartFromButton(this)">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function addToCartFromButton(btn) {
    addToCart(JSON.parse(btn.getAttribute('data-product')));
}

function removeBrokenProduct(img) {
    // Replaced by inline onerror in displayProducts
}

function recommendationFallbackImage(name = 'Product') {
    const label = String(name || 'Product').trim().slice(0, 1).toUpperCase() || 'P';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#312e81"/>
      <stop offset="0.55" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#14b8a6"/>
    </linearGradient>
  </defs>
  <rect width="104" height="104" rx="18" fill="url(#g)"/>
  <circle cx="78" cy="24" r="10" fill="#c7d2fe" opacity="0.9"/>
  <path d="M25 67h54l-8 14H33z" fill="#eef2ff" opacity="0.9"/>
  <path d="M32 40h40l5 27H27z" fill="#ffffff" opacity="0.22"/>
  <text x="52" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff">${label}</text>
</svg>`);
}

function recommendationImageSrc(product) {
    return product.imageUrl || product.image_url || recommendationFallbackImage(product.name);
}

function keepRecommendationImage(img) {
    img.onerror = null;
    img.src = recommendationFallbackImage(img.alt);
}

function filterByCategory(catName, el) {
    document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('currentCategory').innerText = catName === 'all' ? 'Global Collection' : catName;
    if (catName === 'all') displayProducts(allProducts.filter(p => p.imageUrl || p.image_url));
    else displayProducts(allProducts.filter(p => p.category?.name === catName));
}

async function addToCart(p, skipAuthCheck = false) {
    if (!currentUser && !skipAuthCheck) {
        sessionStorage.setItem('pendingCartProduct', JSON.stringify(p));
        redirectToAuth('login');
        return;
    }
    if (currentUser) {
        try {
            await fetch(`${API_BASE_URL}/cart/${currentUser.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: p.id, quantity: 1 })
            });
            await refreshCartFromServer();
        } catch (e) {
            console.error('Add to cart API error:', e);
        }
    }
    scheduleRecommendations();
}

function scheduleRecommendations() {
    if (recLoadTimer) clearTimeout(recLoadTimer);
    recLoadTimer = setTimeout(() => loadAiRecommendations(), 350);
}

function showRecSkeleton() {
    const banner = document.getElementById('aiRecommendationBanner');
    const productsEl = document.getElementById('aiRecProducts');
    if (!banner || !productsEl) return;
    banner.hidden = false;
    banner.classList.add('loading');
    productsEl.innerHTML = [1, 2, 3].map(() =>
        '<div class="ai-rec-card ai-rec-skeleton"><div class="sk-img"></div><div class="sk-lines"><div></div><div></div></div></div>'
    ).join('');
}

async function loadAiGreeting() {
    const el = document.getElementById('aiGreeting');
    if (!el || !currentUser) return;
    try {
        const res = await fetch(`${API_BASE_URL}/ai/greet/${currentUser.id}`);
        if (!res.ok) return;
        const data = await res.json();
        // Display simple greeting (e.g., Good morning, Ali!) on the front page
        el.textContent = data.simpleGreeting || `Good ${data.timeOfDay}, ${data.username}!`;
        el.hidden = !el.textContent;
        // Use the AI generated greeting strictly for the support chat seed
        seedSupportGreeting(data.greeting);
    } catch (e) {
        console.error('Greeting error:', e);
    }
}

function initSupportChat() {
    if (supportChatReady || !currentUser) return;
    const root = document.getElementById('supportChat');
    const toggle = document.getElementById('supportChatToggle');
    const close = document.getElementById('supportChatClose');
    const panel = document.getElementById('supportChatPanel');
    const form = document.getElementById('supportChatForm');
    const input = document.getElementById('supportChatInput');
    if (!root || !toggle || !close || !panel || !form || !input) return;

    root.hidden = false;
    supportChatReady = true;

    toggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        document.getElementById('supportUnread').hidden = true;
        if (!panel.hidden) {
            input.focus();
            setTimeout(autoSizeChatPanel, 50);
        }
    });
    close.addEventListener('click', () => {
        panel.hidden = true;
    });
    form.addEventListener('submit', sendSupportMessage);
}

function seedSupportGreeting(greeting) {
    if (!currentUser || !greeting) return;
    initSupportChat();
    const messages = document.getElementById('supportChatMessages');
    if (!messages || messages.dataset.seeded === '1') return;
    messages.dataset.seeded = '1';
    appendSupportMessage(greeting, 'assistant');
    const unread = document.getElementById('supportUnread');
    const panel = document.getElementById('supportChatPanel');
    const sessionKey = `supportGreetingOpened:${currentUser.id}`;
    if (panel && sessionStorage.getItem(sessionKey) !== '1') {
        panel.hidden = false;
        sessionStorage.setItem(sessionKey, '1');
        document.getElementById('supportChatInput')?.focus();
    } else if (unread && panel?.hidden) {
        unread.hidden = false;
    }
}

function detectUserLanguage(text) {
    if (!text) return 'en';
    const nonLatinPattern = /[^\u0000-\u007F]/g;
    const nonLatinMatches = text.match(nonLatinPattern) || [];
    // If more than 15% is non-latin script (like Hindi/Urdu characters), return 'non-latin'
    if (nonLatinMatches.length > text.length * 0.15) return 'non-latin';
    return 'en';
}

async function sendSupportMessage(e) {
    e.preventDefault();
    const input = document.getElementById('supportChatInput');
    const submit = document.querySelector('#supportChatForm button[type="submit"]');
    const message = input.value.trim();
    if (!message || !currentUser) return;

    const detectedLanguage = detectUserLanguage(message);
    
    if (detectedLanguage === 'non-latin') {
        appendSupportMessage(message, 'user');
        appendSupportMessage("Please use Latin letters (English or Roman Urdu/Hindi). I'll answer in the same style.", 'assistant');
        input.value = '';
        return;
    }

    input.value = '';
    appendSupportMessage(message, 'user');
    const thinkingId = appendSupportMessage('...', 'assistant', true);
    if (submit) submit.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/support/chat/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, language: 'en' })
        });
        const data = await res.json();
        updateSupportMessage(thinkingId, res.ok ? data.reply : data.message);
    } catch (err) {
        console.error('Support chat error:', err);
        updateSupportMessage(thinkingId, 'Connecting error. Please try again.');
    } finally {
        if (submit) submit.disabled = false;
        input.focus();
    }
}

function appendSupportMessage(text, role, pending = false) {
    const messages = document.getElementById('supportChatMessages');
    if (!messages) return '';
    const id = `support-msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    messages.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="support-message support-message-${role}${pending ? ' pending' : ''}">
            ${escapeHtml(text)}
        </div>
    `);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(autoSizeChatPanel, 10);
    return id;
}

function updateSupportMessage(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pending');
    el.textContent = text || 'No response. Please try again.';
    const messages = document.getElementById('supportChatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
    setTimeout(autoSizeChatPanel, 10);
}

function autoSizeChatPanel() {
    const panel = document.getElementById('supportChatPanel');
    const messages = document.getElementById('supportChatMessages');
    if (!panel || !messages) return;
    
    const contentHeight = messages.scrollHeight;
    const headerHeight = 54;
    const formHeight = 58;
    const padding = 16;
    
    let totalHeight = headerHeight + contentHeight + formHeight + padding;
    
    const minHeight = 160;
    const maxHeight = Math.min(480, window.innerHeight - 150);
    totalHeight = Math.max(minHeight, Math.min(totalHeight, maxHeight));
    
    panel.style.height = totalHeight + 'px';
    panel.style.maxHeight = maxHeight + 'px';
}

function hideSupportChat() {
    const root = document.getElementById('supportChat');
    if (root) root.hidden = true;
}

async function loadAiRecommendations() {
    const banner = document.getElementById('aiRecommendationBanner');
    const msgEl = document.getElementById('aiRecMessage');
    const productsEl = document.getElementById('aiRecProducts');
    if (!banner || !currentUser) {
        hideAiBanner();
        return;
    }

    showRecSkeleton();

    try {
        const res = await fetch(`${API_BASE_URL}/ai/recommend/${currentUser.id}`);
        banner.classList.remove('loading');
        if (!res.ok) {
            hideAiBanner();
            return;
        }
        const data = await res.json();
        const products = (data.products || []).filter(r => r && r.name);
        if (products.length === 0) {
            hideAiBanner();
            return;
        }
        msgEl.textContent = data.message || 'Picked just for you:';
        productsEl.innerHTML = products.map(r => `
            <article class="ai-rec-card" data-product='${JSON.stringify({ id: r.id, name: r.name, price: r.price, tags: r.tags || '', cat: r.category || '' })}' onclick="addToCartFromButton(this)">
                <img src="${recommendationImageSrc(r)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="keepRecommendationImage(this)">
                <div class="ai-rec-body">
                    ${r.reason ? `<span class="ai-rec-reason">${escapeHtml(r.reason)}</span>` : ''}
                    <h4>${escapeHtml(r.name)}</h4>
                    <p class="ai-rec-price">$${Number(r.price).toFixed(2)}</p>
                    <span class="ai-rec-add"><i class="fas fa-cart-plus"></i> Add</span>
                </div>
            </article>
        `).join('');
        banner.hidden = false;
    } catch (e) {
        console.error('Recommendations error:', e);
        banner.classList.remove('loading');
        hideAiBanner();
    }
}

function hideAiBanner() {
    const banner = document.getElementById('aiRecommendationBanner');
    if (banner) {
        banner.hidden = true;
        banner.classList.remove('loading');
    }
}

function dismissRecommendations() {
    hideAiBanner();
}

function logout() {
    clearCurrentUser();
    localStorage.removeItem('cart');
    sessionStorage.removeItem('pendingCartProduct');
    location.reload();
}
