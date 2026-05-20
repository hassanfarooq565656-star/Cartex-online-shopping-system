(function initPayment3D() {
    const container = document.getElementById('paymentCanvas');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    const mat = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        wireframe: true,
        transparent: true,
        opacity: 0.35
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    const ringGeo = new THREE.TorusGeometry(2.2, 0.03, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const ring2 = ring.clone();
    ring2.scale.set(0.7, 0.7, 0.7);
    ring2.material = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.4 });
    group.add(ring2);

    scene.add(group);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404080, 0.8));
    camera.position.z = 5;

    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
        requestAnimationFrame(animate);
        group.rotation.y += 0.004;
        group.rotation.x += 0.001;
        group.position.x += (mx * 0.3 - group.position.x) * 0.05;
        group.position.y += (-my * 0.3 - group.position.y) * 0.05;
        ring.rotation.z += 0.008;
        ring2.rotation.z -= 0.012;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
