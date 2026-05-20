(function initAuth3D() {
    const container = document.getElementById('canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const count = 2500;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 12;
        pos[i + 1] = (Math.random() - 0.5) * 12;
        pos[i + 2] = (Math.random() - 0.5) * 12;
        colors[i] = 0.4 + Math.random() * 0.3;
        colors[i + 1] = 0.4 + Math.random() * 0.2;
        colors[i + 2] = 0.9 + Math.random() * 0.1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
    }));
    scene.add(particles);

    const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const boxMat = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    scene.add(box);
    camera.position.z = 4;

    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });

    const card = document.querySelector('.auth-card');
    if (card) {
        document.addEventListener('mousemove', e => {
            const x = (e.clientX / window.innerWidth - 0.5) * 12;
            const y = (e.clientY / window.innerHeight - 0.5) * 12;
            card.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(0)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0003;
        box.rotation.x += 0.003;
        box.rotation.y += 0.005;
        if (mx > 0) {
            particles.rotation.y += (mx - window.innerWidth / 2) * 0.00002;
            particles.rotation.x += (my - window.innerHeight / 2) * 0.00002;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
