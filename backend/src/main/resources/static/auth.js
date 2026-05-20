(function () {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('return') || 'index.html';
    let activeMode = params.get('mode') === 'register' ? 'register' : 'login';

    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const subtitle = document.getElementById('authPageSubtitle');

    if (getCurrentUser()) {
        window.location.href = returnUrl;
        return;
    }

    function setMode(mode) {
        activeMode = mode;
        const isLogin = mode === 'login';
        loginTab.classList.toggle('active', isLogin);
        registerTab.classList.toggle('active', !isLogin);
        loginForm.hidden = !isLogin;
        registerForm.hidden = isLogin;
        subtitle.textContent = isLogin
            ? 'Sign in to your CARTEX account'
            : 'Join CARTEX and start shopping your dreams';
    }

    loginTab.addEventListener('click', () => setMode('login'));
    registerTab.addEventListener('click', () => setMode('register'));
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector('i');
            if (!input || !icon) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
            icon.classList.toggle('fa-eye', showing);
            icon.classList.toggle('fa-eye-slash', !showing);
        });
    });
    setMode(activeMode);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('loginError');
        const btn = document.getElementById('loginSubmitBtn');
        errEl.hidden = true;

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        btn.disabled = true;
        btn.textContent = 'Signing in...';

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.id) {
                setCurrentUser(data);
                window.location.href = returnUrl;
                return;
            }
            errEl.textContent = data.message || 'Invalid email or password.';
            errEl.hidden = false;
        } catch {
            errEl.textContent = 'Could not connect to server. Start the backend on port 8080.';
            errEl.hidden = false;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Login';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('registerError');
        const btn = document.getElementById('registerSubmitBtn');
        errEl.hidden = true;

        const username = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (res.ok && data.id) {
                setCurrentUser(data);
                window.location.href = returnUrl;
                return;
            }
            errEl.textContent = data.message || 'Registration failed. Email may already exist.';
            errEl.hidden = false;
        } catch {
            errEl.textContent = 'Could not connect to server. Start the backend on port 8080.';
            errEl.hidden = false;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    });
})();
