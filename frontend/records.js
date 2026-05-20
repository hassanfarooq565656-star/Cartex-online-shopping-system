(function () {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'auth.html?mode=login&return=' + encodeURIComponent('records.html');
        return;
    }

    document.getElementById('recordsNavUser').textContent = user.username;

    const loadingEl = document.getElementById('recordsLoading');
    const errorEl = document.getElementById('recordsError');
    const listEl = document.getElementById('recordsList');
    let productsById = {};

    async function loadProducts() {
        try {
            const res = await fetch(`${API_BASE_URL}/products`);
            if (res.ok) {
                const products = await res.json();
                productsById = Object.fromEntries(products.map(p => [p.id, p]));
            }
        } catch (e) {
            console.error('Products fetch error:', e);
        }
    }

    function getProductName(productId) {
        const p = productsById[productId];
        return p ? p.name : `Product #${productId}`;
    }

    async function loadRecords() {
        try {
            const res = await fetch(`${API_BASE_URL}/records/${user.id}`);
            if (!res.ok) {
                if (res.status === 401 || res.status === 404) {
                    clearCurrentUser();
                    window.location.href = 'auth.html?mode=login&return=' + encodeURIComponent('records.html');
                    return;
                }
                throw new Error('Failed to load records');
            }

            const records = await res.json();
            loadingEl.hidden = true;

            if (!records.length) {
                listEl.innerHTML = '<p class="history-empty">No shopping records yet. Place an order from CARTEX!</p>';
                return;
            }

            listEl.innerHTML = records.map(order => {
                const date = order.orderDate
                    ? new Date(order.orderDate).toLocaleString()
                    : 'Unknown date';
                const items = (order.items || []).map(item =>
                    `<li>${escapeHtml(getProductName(item.productId))} x${item.quantity} — $${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}</li>`
                ).join('');
                const discount = order.discountApplied > 0
                    ? `<p class="history-discount">Discount: -$${Number(order.discountApplied).toFixed(2)}</p>`
                    : '';
                const method = order.paymentMethod || 'Standard';
                let paymentDetail = `<p class="history-payment"><i class="fas fa-credit-card"></i> <strong>Payment:</strong> ${escapeHtml(method)}</p>`;
                if (method === 'Online Pay') {
                    paymentDetail += `<p class="history-payment-detail">Bank: ${escapeHtml(order.bankName || '—')} | PSID: ${escapeHtml(order.psid || '—')}</p>`;
                } else if (method === 'Cash on Delivery') {
                    paymentDetail += `<p class="history-payment-detail">Deliver to: ${escapeHtml(order.deliveryFullName || '')}, ${escapeHtml(order.deliveryAddress || '')}, ${escapeHtml(order.deliveryCity || '')} | ${escapeHtml(order.deliveryPhone || '')}</p>`;
                }
                return `
                    <div class="history-order-card">
                        <div class="history-order-header">
                            <span>Order #${order.id}</span>
                            <span>${date}</span>
                        </div>
                        ${paymentDetail}
                        <ul class="history-items">${items}</ul>
                        ${discount}
                        <p class="history-total">Total: $${Number(order.totalAmount).toFixed(2)}</p>
                    </div>
                `;
            }).join('');
        } catch (e) {
            loadingEl.hidden = true;
            errorEl.textContent = 'Could not load shopping records. Make sure the backend is running.';
            errorEl.hidden = false;
        }
    }

    window.logoutFromRecords = function () {
        clearCurrentUser();
        localStorage.removeItem('cart');
        window.location.href = 'index.html';
    };

    loadProducts().then(loadRecords);
})();
