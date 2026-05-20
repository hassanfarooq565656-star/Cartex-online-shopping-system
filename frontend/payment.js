(function () {

    const user = getCurrentUser();

    if (!user) {

        window.location.href = 'auth.html?mode=login&return=' + encodeURIComponent('payment.html');

        return;

    }



    let currentPsid = null;

    let currentBank = null;



    const loading = document.getElementById('paymentLoading');

    const hub = document.getElementById('paymentHub');

    const bankPanel = document.getElementById('bankPanel');

    const codPanel = document.getElementById('codPanel');

    const psidPanel = document.getElementById('psidPanel');

    const bankError = document.getElementById('bankError');

    const codError = document.getElementById('codError');



    function formatMoney(n) {

        return '$' + Number(n).toFixed(2);

    }



    function showPanel(name) {

        hub.hidden = name !== 'hub';

        bankPanel.hidden = name !== 'bank';

        codPanel.hidden = name !== 'cod';

    }



    function hideBankError() {

        if (bankError) {

            bankError.hidden = true;

            bankError.textContent = '';

        }

    }



    function getBankDetailsFromPage() {

        const psidEl = document.getElementById('psidValue');

        const bankEl = document.getElementById('psidBank');

        let psid = (currentPsid || psidEl?.textContent || '').trim();

        let bank = (currentBank || bankEl?.textContent || 'UBL').trim().toUpperCase();

        if (psid === '—' || psid === '-') psid = '';

        return { psid, bank: bank === 'UBL' || bank === 'HBL' ? bank : 'UBL' };

    }



    async function fetchSuccessMessage(type, orderData = {}) {

        if (orderData.message) {

            return {

                title: 'Congratulations!',

                line1: orderData.message,

                line2: orderData.paymentMethod

                    ? `Saved to your records as ${orderData.paymentMethod}.`

                    : 'Your order has been saved to your records.'

            };

        }

        const path = type === 'bank'

            ? '/payment/bank/success-message'

            : '/payment/cod/success-message';

        try {

            const res = await fetch(`${API_BASE_URL}${path}`);

            if (res.ok) return await res.json();

        } catch (e) {

            console.error('Success message fetch:', e);

        }

        if (type === 'bank') {

            return {

                title: 'Thank You for Your Trust!',

                line1: 'Your payment has been received.',

                line2: 'Your products will be delivered soon.'

            };

        }

        return {

            title: 'Congratulations!',

            line1: 'Thank you for your trust.',

            line2: 'Your order has been placed successfully.'

        };

    }



    async function finishCheckout(type, orderData = {}) {

        hideBankError();

        await clearCartEverywhere(user.id);



        const msg = await fetchSuccessMessage(type, orderData);

        const goShop = () => {

            window.location.href = 'index.html?orderComplete=1';

        };



        if (typeof showPaymentSuccessOverlay === 'function') {

            showPaymentSuccessOverlay(msg, goShop);

        } else {

            goShop();

        }

    }



    async function saveBankOrder() {

        const { psid, bank } = getBankDetailsFromPage();

        const res = await fetch(`${API_BASE_URL}/payment/bank/complete`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ userId: user.id, psid, bank })

        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Could not complete bank payment.');
        }

        return await res.json();

    }



    async function saveCodOrder(payload) {

        const res = await fetch(`${API_BASE_URL}/payment/cod/complete`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(payload)

        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Could not place cash on delivery order.');
        }

        return await res.json();

    }



    async function loadPayment() {

        try {

            const res = await fetch(`${API_BASE_URL}/payment/${user.id}`);

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to load payment');



            loading.hidden = true;

            hub.hidden = false;

            document.getElementById('payAmount').textContent = formatMoney(data.total);

        } catch (e) {

            loading.hidden = true;

            const err = document.getElementById('paymentError');

            err.textContent = e.message || 'Could not load payment. Ensure backend is running.';

            err.hidden = false;

        }

    }



    document.querySelectorAll('.pay-method-card').forEach(card => {

        card.addEventListener('click', () => {

            const method = card.dataset.method;

            if (method === 'bank') {

                showPanel('bank');

                psidPanel.hidden = true;

                hideBankError();

            } else {

                showPanel('cod');

                if (codError) codError.hidden = true;

            }

        });

    });



    document.querySelectorAll('.pay-back-btn').forEach(btn => {

        btn.addEventListener('click', () => showPanel('hub'));

    });



    document.querySelectorAll('.bank-option').forEach(btn => {

        btn.addEventListener('click', async () => {

            const bank = btn.dataset.bank;

            hideBankError();

            btn.disabled = true;



            try {

                const res = await fetch(`${API_BASE_URL}/payment/bank/init`, {

                    method: 'POST',

                    headers: { 'Content-Type': 'application/json' },

                    body: JSON.stringify({ userId: user.id, bank })

                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.message);



                currentPsid = data.psid;

                currentBank = data.bank;

                document.getElementById('psidValue').textContent = data.psid;

                document.getElementById('psidBank').textContent = data.bank;

                document.getElementById('psidAmount').textContent = formatMoney(data.amount);

                psidPanel.hidden = false;

                psidPanel.scrollIntoView({ behavior: 'smooth' });

            } catch (e) {

                if (bankError) {

                    bankError.textContent = e.message || 'Could not generate PSID.';

                    bankError.hidden = false;

                }

            } finally {

                btn.disabled = false;

            }

        });

    });



    document.getElementById('confirmPaidBtn').addEventListener('click', async () => {

        const btn = document.getElementById('confirmPaidBtn');

        hideBankError();

        btn.disabled = true;

        try {

            const orderData = await saveBankOrder();

            await finishCheckout('bank', orderData);

        } catch (e) {

            if (bankError) {

                bankError.textContent = e.message || 'Could not finish checkout. Please try again.';

                bankError.hidden = false;

            }

        } finally {

            btn.disabled = false;

        }

    });



    document.getElementById('codForm').addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (codError) codError.hidden = true;

        submitBtn.disabled = true;



        const payload = {

            userId: user.id,

            fullName: document.getElementById('codName').value.trim(),

            phone: document.getElementById('codPhone').value.trim(),

            address: document.getElementById('codAddress').value.trim(),

            city: document.getElementById('codCity').value.trim()

        };



        if (!payload.fullName || !payload.phone || !payload.address || !payload.city) {

            if (codError) {

                codError.textContent = 'Please fill in all delivery fields.';

                codError.hidden = false;

            }

            submitBtn.disabled = false;

            return;

        }



        try {

            const orderData = await saveCodOrder(payload);

            await finishCheckout('cod', orderData);

        } catch (e) {

            if (codError) {

                codError.textContent = e.message || 'Could not finish checkout. Please try again.';

                codError.hidden = false;

            }

            submitBtn.disabled = false;

        }

    });



    loadPayment();

})();

