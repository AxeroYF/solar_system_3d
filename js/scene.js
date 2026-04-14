import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { textures, J2000_DATE, MS_PER_DAY } from './data.js';

export function initScene(ctx) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00002);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 30000);
    camera.position.set(0, 200, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 25000;
    controls.enablePan = true;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.DOLLY
    };

    // Keyboard controls
    const keyState = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
        w: false, s: false, a: false, d: false
    };
    window.addEventListener('keydown', (e) => {
        if (keyState.hasOwnProperty(e.key)) keyState[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        if (keyState.hasOwnProperty(e.key)) keyState[e.key] = false;
    });

    function updateCameraPosition() {
        const moveSpeed = 2.0 * (camera.position.y / 200);
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();

        if (keyState.ArrowUp || keyState.w) {
            camera.position.addScaledVector(forward, moveSpeed);
            controls.target.addScaledVector(forward, moveSpeed);
        }
        if (keyState.ArrowDown || keyState.s) {
            camera.position.addScaledVector(forward, -moveSpeed);
            controls.target.addScaledVector(forward, -moveSpeed);
        }
        if (keyState.ArrowLeft || keyState.a) {
            camera.position.addScaledVector(right, -moveSpeed);
            controls.target.addScaledVector(right, -moveSpeed);
        }
        if (keyState.ArrowRight || keyState.d) {
            camera.position.addScaledVector(right, moveSpeed);
            controls.target.addScaledVector(right, moveSpeed);
        }
    }

    // Loading manager
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
        document.getElementById('loading').style.display = 'none';
    };
    loadingManager.onError = (url) => {
        console.log('There was an error loading ' + url);
        document.getElementById('loading').style.display = 'none';
    };

    const textureLoader = new THREE.TextureLoader(loadingManager);
    textureLoader.setCrossOrigin('anonymous');

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 50000; i++) {
        vertices.push(
            THREE.MathUtils.randFloatSpread(60000),
            THREE.MathUtils.randFloatSpread(60000),
            THREE.MathUtils.randFloatSpread(60000)
        );
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 })));

    // Sun
    const sunGeo = new THREE.SphereGeometry(30, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.castShadow = false;
    sun.receiveShadow = false;
    sun.userData = {
        name: "太阳",
        description: "太阳是位于太阳系中心的恒星，它几乎是热等离子体与磁场交织着的一个理想球体。太阳系中99.86%的质量集中在太阳。",
        details: { "距离太阳": "0 AU", "直径": "1,392,700 km", "质量": "333,000 Earths", "公转周期": "N/A (银河系: ~2.3亿年)", "自转周期": "~27 Days", "英文名": "Sun" },
        link: "https://zh.wikipedia.org/wiki/%E5%A4%AA%E9%98%B3"
    };
    textureLoader.load(textures.sun, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        sunMat.map = tex;
        sunMat.color.setHex(0xffffff);
        sunMat.needsUpdate = true;
    }, undefined, () => console.log("太阳纹理加载失败，保持纯色"));
    scene.add(sun);

    // Asteroid Belt
    const asteroidBeltMesh = createParticleBelt(scene, 3000, 200, 250, 10, true);
    asteroidBeltMesh.userData = {
        name: "小行星带",
        description: "小行星带是位于火星和木星轨道之间的小行星密集区域，估计包含数百万颗小行星。",
        tooltipSuffix: " (Asteroid Belt)"
    };
    asteroidBeltMesh.userData.originalGeometry = asteroidBeltMesh.geometry.clone();

    // Kuiper Belt
    const kuiperBeltMesh = createParticleBelt(scene, 6000, 1100, 1600, 60, false);
    kuiperBeltMesh.userData = {
        name: "柯伊伯带",
        description: "柯伊伯带是位于海王星轨道外侧的圆盘状区域，包含大量冰冻小天体，是短周期彗星的来源地。",
        tooltipSuffix: " (Kuiper Belt)"
    };
    kuiperBeltMesh.userData.originalGeometry = kuiperBeltMesh.geometry.clone();

    // Lights
    const sunLight = new THREE.PointLight(0xffffff, 1.2, 10000, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.2));

    // Populate context
    Object.assign(ctx, {
        scene, camera, renderer, controls, sun,
        asteroidBeltMesh, kuiperBeltMesh,
        textureLoader, updateCameraPosition,
        J2000_DATE, MS_PER_DAY,
        baseDate: new Date()
    });
}

function createParticleBelt(scene, count, innerR, outerR, thickness, warm) {
    const geometry = new THREE.BufferGeometry();
    const positions = [], colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
        const r = innerR + Math.random() * (outerR - innerR);
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * thickness;
        positions.push(r * Math.cos(theta), y, r * Math.sin(theta));

        const g = warm ? (0.4 + Math.random() * 0.4) : (0.5 + Math.random() * 0.3);
        if (warm) {
            color.setRGB(g, g * 0.9, g * 0.8);
        } else {
            color.setRGB(g * 0.8, g * 0.9, g);
        }
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mesh = new THREE.Points(geometry, new THREE.PointsMaterial({
        size: warm ? 1.5 : 2.0,
        vertexColors: true,
        transparent: true,
        opacity: warm ? 0.8 : 0.6,
        sizeAttenuation: true
    }));
    scene.add(mesh);
    return mesh;
}
