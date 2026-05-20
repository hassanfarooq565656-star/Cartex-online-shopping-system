(function () {
    const user = getCurrentUser();
    const loadingEl = document.getElementById('cartLoading');
    const guestPanel = document.getElementById('cartGuestPanel');
    const receiptPanel = document.getElementById('cartReceiptPanel');
    const errorEl = document.getElementById('cartError');

    function hideLoading() {
        loadingEl.hidden = true;
    }

    function showError(msg) {
        hideLoading();
        errorEl.textContent = msg;
        errorEl.hidden = false;
    }

    async function loadGuestCart() {
        try {
            const res = await fetch(`${API_BASE_URL}/cart/guest`);
            const data = await res.json();
            hideLoading();
            guestPanel.hidden = false;

            document.getElementById('cartGuestMessage').textContent =
                data.message || 'Sign in to view your cart and checkout securely.';
            document.getElementById('cartLoginHint').textContent =
                data.loginHint || 'Already registered? Log in to access your cart.';
            document.getElementById('cartRegisterHint').textContent =
                data.registerHint || 'New to CARTEX? Create a free account to start shopping.';
        } catch {
            showError('Could not connect to server. Start the CARTEX backend on port 8080.');
        }
    }

    function formatMoney(n) {
        return '$' + Number(n).toFixed(2);
    }

    function receiptFallbackImage(name = 'Product') {
        const label = String(name || 'P').trim().slice(0, 1).toUpperCase() || 'P';
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#1e1b4b"/>
      <stop offset="0.55" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#14b8a6"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="14" fill="url(#g)"/>
  <path d="M24 62h48l-7 12H31z" fill="#eef2ff" opacity="0.92"/>
  <path d="M31 36h34l5 26H26z" fill="#ffffff" opacity="0.22"/>
  <circle cx="70" cy="24" r="8" fill="#c7d2fe" opacity="0.92"/>
  <text x="48" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#fff">${label}</text>
</svg>`);
    }

    function receiptImageSrc(item) {
        return item.imageUrl || receiptFallbackImage(item.name);
    }

    window.keepReceiptImage = function (img) {
        img.onerror = null;
        img.src = receiptFallbackImage(img.alt);
    };

    function renderReceipt(data) {
        hideLoading();
        receiptPanel.hidden = false;

        document.getElementById('cartNavUser').textContent = data.username;
        document.getElementById('cartRecordsLink').style.display = 'inline-flex';
        document.getElementById('receiptCustomer').textContent = data.username;
        document.getElementById('receiptDate').textContent = new Date().toLocaleString();
        document.getElementById('receiptId').textContent = 'CTX-' + data.userId + '-' + Date.now().toString().slice(-6);

        const items = data.items || [];
        const tbody = document.getElementById('receiptItems');
        const emptyMsg = document.getElementById('cartEmptyMsg');
        const receiptBody = document.getElementById('receiptBody');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!items.length) {
            emptyMsg.hidden = false;
            receiptBody.hidden = true;
            return;
        }

        emptyMsg.hidden = true;
        receiptBody.hidden = false;

        tbody.innerHTML = items.map(item => `
            <tr>
                <td class="receipt-item-cell">
                    <img src="${receiptImageSrc(item)}" alt="${escapeHtml(item.name)}" class="receipt-thumb" onerror="keepReceiptImage(this)">
                    <span>${escapeHtml(item.name)}</span>
                </td>
                <td>
                    <div class="qty-controls">
                        <button type="button" class="qty-btn" data-action="dec" data-id="${item.productId}">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="qty-btn" data-action="inc" data-id="${item.productId}">+</button>
                    </div>
                </td>
                <td>${formatMoney(item.price)}</td>
                <td>${formatMoney(item.lineTotal)}</td>
                <td>
                    <button type="button" class="receipt-remove-btn" data-id="${item.productId}" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        document.getElementById('receiptSubtotal').textContent = formatMoney(data.subtotal);
        document.getElementById('receiptTotal').textContent = formatMoney(data.total);

        const discountRow = document.getElementById('receiptDiscountRow');
        if (data.isFirstOrder && Number(data.discount) > 0) {
            discountRow.hidden = false;
            document.getElementById('receiptDiscount').textContent = '-' + formatMoney(data.discount);
        } else {
            discountRow.hidden = true;
        }

        checkoutBtn.onclick = () => {
            window.location.href = 'payment.html';
        };

        tbody.querySelectorAll('.qty-btn, .receipt-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => handleItemAction(btn, user.id));
        });
    }

    async function handleItemAction(btn, userId) {
        const productId = btn.dataset.id;
        const action = btn.dataset.action;

        try {
            if (btn.classList.contains('receipt-remove-btn')) {
                await fetch(`${API_BASE_URL}/cart/${userId}/items/${productId}`, { method: 'DELETE' });
            } else {
                const row = btn.closest('tr');
                const qtySpan = row.querySelector('.qty-controls span');
                let qty = parseInt(qtySpan.textContent, 10);
                qty = action === 'inc' ? qty + 1 : qty - 1;
                await fetch(`${API_BASE_URL}/cart/${userId}/items/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: qty })
                });
            }
            await loadUserCart(userId);
            localStorage.setItem('cart', JSON.stringify(
                (await (await fetch(`${API_BASE_URL}/cart/${userId}`)).json()).items.map(i => ({
                    id: i.productId, name: i.name, price: Number(i.price), qty: i.quantity
                }))
            ));
        } catch {
            showError('Could not update cart. Please try again.');
        }
    }

    async function loadUserCart(userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/cart/${userId}`);
            if (!res.ok) throw new Error('Cart load failed');
            const data = await res.json();
            renderReceipt(data);
        } catch {
            showError('Could not load your cart. Make sure the backend is running.');
        }
    }

    async function initUserCart() {
        const pending = sessionStorage.getItem('pendingCartProduct');
        if (pending) {
            try {
                const p = JSON.parse(pending);
                await fetch(`${API_BASE_URL}/cart/${user.id}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: p.id, quantity: 1 })
                });
                sessionStorage.removeItem('pendingCartProduct');
            } catch (e) {
                console.error('Pending cart item error:', e);
            }
        }
        await loadUserCart(user.id);
    }

    if (user) {
        initUserCart();
    } else {
        loadGuestCart();
    }
})();
