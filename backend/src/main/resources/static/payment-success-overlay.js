(function () {
    let successScene = null;
    let successAnimId = null;

    function createSuccessScene(canvas) {
        if (typeof THREE === 'undefined' || !canvas) return null;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        group.position.y = -0.15;

        const skin = new THREE.MeshPhongMaterial({ color: 0xffd8c7, shininess: 35 });
        const hair = new THREE.MeshPhongMaterial({ color: 0x0b1020, shininess: 70 });
        const hairBlue = new THREE.MeshPhongMaterial({ color: 0x17233f, shininess: 80 });
        const hoodie = new THREE.MeshPhongMaterial({ color: 0xeadfd9, shininess: 24 });
        const hoodieShadow = new THREE.MeshPhongMaterial({ color: 0xcdbfba, shininess: 18 });
        const shirt = new THREE.MeshPhongMaterial({ color: 0x221827, shininess: 18 });
        const blush = new THREE.MeshBasicMaterial({ color: 0xd8868e, transparent: true, opacity: 0.35 });
        const dark = new THREE.MeshBasicMaterial({ color: 0x111827 });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.56, 0.92, 32), hoodie);
        body.position.y = -0.55;
        group.add(body);

        const bodyRoundTop = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 16), hoodie);
        bodyRoundTop.scale.set(1, 0.42, 1);
        bodyRoundTop.position.y = -0.13;
        group.add(bodyRoundTop);

        const bodyRoundBottom = bodyRoundTop.clone();
        bodyRoundBottom.position.y = -0.97;
        bodyRoundBottom.scale.set(1.5, 0.42, 1);
        group.add(bodyRoundBottom);

        const shirtPanel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.48, 0.04), shirt);
        shirtPanel.position.set(0, -0.34, 0.43);
        group.add(shirtPanel);

        const hood = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.08, 18, 64), hoodieShadow);
        hood.position.set(0, -0.02, -0.01);
        hood.scale.set(1.03, 0.78, 0.2);
        group.add(hood);

        const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.52, 0.04), hoodie);
        collarLeft.position.set(-0.14, -0.24, 0.47);
        collarLeft.rotation.z = -0.55;
        group.add(collarLeft);

        const collarRight = collarLeft.clone();
        collarRight.position.x = 0.14;
        collarRight.rotation.z = 0.55;
        group.add(collarRight);

        [-0.18, 0.18].forEach(x => {
            const lace = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 10), hoodieShadow);
            lace.position.set(x, -0.55, 0.49);
            lace.rotation.z = x < 0 ? 0.12 : -0.12;
            group.add(lace);
        });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.43, 40, 32), skin);
        head.scale.set(0.9, 1.08, 0.86);
        head.position.y = 0.22;
        group.add(head);

        const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
        hairCap.position.set(0, 0.48, 0.02);
        hairCap.scale.set(1.02, 0.9, 0.95);
        hairCap.rotation.x = -0.16;
        group.add(hairCap);

        const bangData = [
            [-0.34, 0.37, 0.28, -0.75, -0.62, 0.28],
            [-0.18, 0.35, 0.37, -0.92, -0.24, 0.35],
            [0.02, 0.34, 0.38, -0.98, 0.06, 0.4],
            [0.2, 0.36, 0.34, -0.88, 0.35, 0.32],
            [0.36, 0.39, 0.27, -0.7, 0.7, 0.25]
        ];
        const bangs = bangData.map(([x, y, z, rx, rz, h], i) => {
            const bang = new THREE.Mesh(new THREE.ConeGeometry(0.11, h, 24), i % 2 ? hairBlue : hair);
            bang.position.set(x, y, z);
            bang.rotation.x = Math.PI + rx;
            bang.rotation.z = rz;
            group.add(bang);
            return bang;
        });

        [-0.43, 0.43].forEach((x, i) => {
            const sideLock = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 24), hair);
            sideLock.position.set(x, 0.19, 0.11);
            sideLock.rotation.x = Math.PI * 0.1;
            sideLock.rotation.z = i === 0 ? 0.42 : -0.42;
            group.add(sideLock);
        });

        const eyeGeo = new THREE.BoxGeometry(0.12, 0.018, 0.018);
        const leftEye = new THREE.Mesh(eyeGeo, dark);
        leftEye.position.set(-0.14, 0.19, 0.38);
        leftEye.rotation.z = -0.08;
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.14;
        rightEye.rotation.z = 0.08;
        group.add(leftEye, rightEye);

        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.014), dark);
        mouth.position.set(0, 0.01, 0.39);
        mouth.rotation.z = -0.05;
        group.add(mouth);

        const leftBlush = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), blush);
        leftBlush.position.set(-0.24, 0.09, 0.405);
        const rightBlush = leftBlush.clone();
        rightBlush.position.x = 0.24;
        group.add(leftBlush, rightBlush);

        const armGeo = new THREE.CylinderGeometry(0.07, 0.095, 0.64, 18);
        const leftArm = new THREE.Mesh(armGeo, hoodie);
        leftArm.position.set(-0.48, -0.28, 0.08);
        leftArm.rotation.z = -0.54;
        group.add(leftArm);

        const leftSleeveTop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), hoodie);
        leftSleeveTop.position.set(-0.35, -0.2, 0.08);
        group.add(leftSleeveTop);

        const rightArm = new THREE.Mesh(armGeo, hoodie);
        rightArm.position.set(0.48, -0.32, 0.08);
        rightArm.rotation.z = -0.7;
        group.add(rightArm);

        const rightSleeveTop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), hoodie);
        rightSleeveTop.position.set(0.34, -0.12, 0.06);
        group.add(rightSleeveTop);

        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 16), skin);
        rightHand.position.set(0.66, -0.03, 0.1);
        group.add(rightHand);

        const leftHand = rightHand.clone();
        leftHand.position.set(-0.7, -0.03, 0.1);
        group.add(leftHand);

        const feather = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 10), dark);
        shaft.rotation.z = -0.22;
        feather.add(shaft);
        const plumeMat = new THREE.MeshPhongMaterial({ color: 0x111827, shininess: 55 });
        const plume = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), plumeMat);
        plume.scale.set(0.42, 1.45, 0.08);
        plume.position.set(-0.1, 0.3, 0.02);
        plume.rotation.z = -0.32;
        feather.add(plume);
        const plumeTip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 20), plumeMat);
        plumeTip.position.set(-0.15, 0.53, 0.02);
        plumeTip.rotation.z = -0.32;
        feather.add(plumeTip);
        feather.position.set(-0.72, 0.16, 0.2);
        feather.rotation.z = -0.18;
        group.add(feather);

        const textCanvas = document.createElement('canvas');
        textCanvas.width = 512;
        textCanvas.height = 160;
        const ctx = textCanvas.getContext('2d');
        ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
        ctx.font = '900 58px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeText('THANK YOU', 256, 76);
        ctx.fillStyle = '#fff7ed';
        ctx.fillText('THANK YOU', 256, 76);
        const textTexture = new THREE.CanvasTexture(textCanvas);
        const text = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture, transparent: true }));
        text.scale.set(1.95, 0.6, 1);
        text.position.set(0, -1.28, 0.18);
        group.add(text);

        const particles = new THREE.BufferGeometry();
        const count = 100;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 4;
        particles.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(particles, new THREE.PointsMaterial({ color: 0xfacc15, size: 0.035 }));
        pts.position.z = -0.35;
        scene.add(pts);

        scene.add(group);
        scene.add(new THREE.AmbientLight(0xffffff, 0.72));
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(3, 4, 5);
        scene.add(dir);
        const fill = new THREE.PointLight(0x60a5fa, 1.2, 5);
        fill.position.set(-2, 1, 2);
        scene.add(fill);
        camera.position.z = 3.6;

        return { scene, camera, renderer, group, rightArm, rightHand, rightSleeveTop, feather, text, pts };
    }

    function resizeSuccessScene(sc) {
        const wrap = document.getElementById('successCanvasWrap');
        if (!wrap || !sc) return;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        sc.renderer.setSize(w, h);
        sc.camera.aspect = w / h;
        sc.camera.updateProjectionMatrix();
    }

    function animateSuccess(sc) {
        if (!sc) return;
        successAnimId = requestAnimationFrame(() => animateSuccess(sc));
        const t = Date.now() * 0.001;
        sc.group.rotation.y = Math.sin(t * 1.2) * 0.16;
        sc.group.position.y = -0.15 + Math.sin(t * 2.2) * 0.045;
        sc.rightArm.rotation.z = -0.7 + Math.sin(t * 2.8) * 0.05;
        sc.rightHand.position.y = -0.03 + Math.sin(t * 2.8) * 0.03;
        sc.rightHand.position.x = 0.66 + Math.sin(t * 2.8) * 0.02;
        sc.rightSleeveTop.position.y = -0.12 + Math.sin(t * 2.8) * 0.02;
        sc.feather.rotation.z = -0.18 + Math.sin(t * 3.4) * 0.1;
        sc.feather.position.y = 0.16 + Math.sin(t * 2.7) * 0.035;
        sc.text.scale.x = 1.95 + Math.sin(t * 3) * 0.04;
        sc.text.scale.y = 0.6 + Math.sin(t * 3) * 0.02;
        sc.pts.rotation.y -= 0.005;
        sc.renderer.render(sc.scene, sc.camera);
    }

    function stopSuccessScene() {
        if (successAnimId) cancelAnimationFrame(successAnimId);
        successAnimId = null;
        if (successScene) {
            successScene.renderer.dispose();
            successScene = null;
        }
    }

    window.showPaymentSuccessOverlay = function (data, onComplete) {
        const overlay = document.getElementById('paymentSuccessOverlay');
        const titleEl = document.getElementById('successTitle');
        const line1El = document.getElementById('successLine1');
        const line2El = document.getElementById('successLine2');
        if (!overlay) {
            if (onComplete) onComplete();
            return;
        }

        titleEl.textContent = data.title || 'Thank You!';
        line1El.textContent = data.line1 || '';
        line2El.textContent = data.line2 || '';

        overlay.hidden = false;
        overlay.classList.add('visible');

        const canvas = document.getElementById('successCanvas');
        stopSuccessScene();
        successScene = createSuccessScene(canvas);
        if (successScene) {
            resizeSuccessScene(successScene);
            animateSuccess(successScene);
        }

        setTimeout(() => {
            overlay.classList.remove('visible');
            overlay.hidden = true;
            stopSuccessScene();
            if (onComplete) onComplete();
        }, 4500);
    };
})();
