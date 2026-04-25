import * as THREE from 'three';
import { textures, atmosphereVertexShader, atmosphereFragmentShader, J2000_DATE, MS_PER_DAY } from './data.js';

export function calculateMeanAnomaly(periodDays, meanAnomalyJ2000, targetDate) {
    if (!periodDays) return Math.random() * Math.PI * 2;
    const daysSinceJ2000 = (targetDate - J2000_DATE) / MS_PER_DAY;
    const meanMotion = 360 / periodDays;
    let ma = meanAnomalyJ2000 + meanMotion * daysSinceJ2000;
    ma = ma % 360;
    if (ma < 0) ma += 360;
    return ma * (Math.PI / 180);
}

export function createPlanet(ctx, data) {
    const { scene, textureLoader, planets, planetTracks, cometTracks, moonTracks, cometTails, baseDate } = ctx;

    const a = data.distance;
    const e = data.eccentricity || 0;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;
    const inclination = (data.inclination || 0) * (Math.PI / 180);

    const systemGroup = new THREE.Group();
    const orbitGroup = new THREE.Group();
    orbitGroup.add(systemGroup);
    orbitGroup.rotation.x = inclination;
    orbitGroup.rotation.y = Math.random() * Math.PI;
    scene.add(orbitGroup);

    // Material
    const material = new THREE.MeshLambertMaterial({
        color: data.color,
        emissive: 0x222222,
        emissiveIntensity: 0.5
    });

    if (data.texture) {
        textureLoader.load(data.texture, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            material.map = tex;
            material.color.setHex(0xffffff);
            material.emissive.setHex(0x222222);
            material.needsUpdate = true;
        }, undefined, () => console.warn(`纹理加载失败: ${data.name}`));
    }

    if (data.name === "火星" && textures.marsNormal) {
        textureLoader.load(textures.marsNormal, (normTex) => {
            material.normalMap = normTex;
            material.normalScale.set(0.5, 0.5);
            material.needsUpdate = true;
        }, undefined, () => console.warn("火星法线贴图加载失败"));
    }

    // Geometry
    const geometry = data.irregular
        ? new THREE.IcosahedronGeometry(data.radius, 0)
        : new THREE.SphereGeometry(data.radius, 64, 64);

    const planetMesh = new THREE.Mesh(geometry, material);

    planetMesh.userData = {
        name: data.name,
        description: data.description,
        details: data.details,
        link: data.link,
        realPhoto: data.realPhoto,
        type: data.name.includes("彗星") ? "comet" : "planet"
    };

    if (data.irregular && data.scale) {
        planetMesh.scale.set(data.scale[0], data.scale[1], data.scale[2]);
        planetMesh.userData.originalScaleVector = new THREE.Vector3(data.scale[0], data.scale[1], data.scale[2]);
    } else {
        planetMesh.userData.originalScaleVector = new THREE.Vector3(1, 1, 1);
    }

    planetMesh.castShadow = true;
    planetMesh.receiveShadow = false;
    systemGroup.add(planetMesh);

    // Comet tail
    if (data.name.includes("彗星")) {
        const tailLength = 60;
        const tailGeo = new THREE.CylinderGeometry(data.radius * 1.2, 0, tailLength, 32, 1, true);
        tailGeo.translate(0, -tailLength / 2, 0);
        tailGeo.rotateX(-Math.PI / 2);
        const tailMat = new THREE.MeshBasicMaterial({
            map: textures.cometTail, transparent: true, opacity: 0.6,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const tailMesh = new THREE.Mesh(tailGeo, tailMat);
        scene.add(tailMesh);
        cometTails.push({ mesh: tailMesh, target: planetMesh, maxLength: tailLength, baseRadius: data.radius * 1.2 });
    }

    // Earth special effects
    if (data.name === "地球") {
        addEarthEffects(textureLoader, material, planetMesh, data);
    }
    if (data.name === "金星") {
        addAtmosphere(planetMesh, data.radius + 1.2, 0xcc9966, 0.4, 5.5, 0.6);
    }
    if (data.name === "火星") {
        addMarsEffects(textureLoader, planetMesh, data);
    }

    // Orbit track
    const trackShape = new THREE.EllipseCurve(-c, 0, a, b, 0, 2 * Math.PI, false, 0);
    const trackGeo = new THREE.BufferGeometry().setFromPoints(trackShape.getPoints(256));
    const track = new THREE.LineLoop(trackGeo, new THREE.LineBasicMaterial({ color: 0xAAAAAA, transparent: true, opacity: 0.5 }));
    track.rotation.x = -Math.PI / 2;
    track.frustumCulled = false;
    orbitGroup.add(track);

    if (data.name.includes("彗星")) {
        cometTracks.push(track);
    } else {
        planetTracks.push(track);
    }

    // Saturn ring
    if (data.hasRing) {
        addSaturnRing(textureLoader, planetMesh, data);
    }

    // Moons
    const activeMoons = [];
    if (data.moons) {
        data.moons.forEach(moonData => {
            const moonMat = new THREE.MeshLambertMaterial({ color: moonData.color, emissive: 0x222222, emissiveIntensity: 0.5 });

            if (moonData.texture) {
                textureLoader.load(moonData.texture, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    moonMat.map = tex;
                    moonMat.color.setHex(0xffffff);
                    moonMat.emissive.setHex(0x222222);
                    moonMat.needsUpdate = true;
                }, undefined, () => console.warn(`卫星纹理加载失败: ${moonData.name}`));
            }

            let moonGeo;
            if (moonData.isSpacecraft) {
                moonGeo = new THREE.BoxGeometry(moonData.radius * 4, moonData.radius, moonData.radius * 2);
                moonMat.color.setHex(0xEEEEEE);
                moonMat.emissive.setHex(0x555555);
            } else if (moonData.irregular) {
                moonGeo = new THREE.IcosahedronGeometry(moonData.radius, 0);
            } else {
                moonGeo = new THREE.SphereGeometry(moonData.radius, 32, 32);
            }

            const moonMesh = new THREE.Mesh(moonGeo, moonMat);

            if (moonData.isSpacecraft) {
                const panelGeo = new THREE.BoxGeometry(moonData.radius, moonData.radius * 0.1, moonData.radius * 6);
                const panelMat = new THREE.MeshLambertMaterial({ color: 0x3333AA, emissive: 0x111155 });
                const leftPanel = new THREE.Mesh(panelGeo, panelMat);
                leftPanel.position.set(-moonData.radius * 2.5, 0, 0);
                moonMesh.add(leftPanel);
                const rightPanel = new THREE.Mesh(panelGeo, panelMat);
                rightPanel.position.set(moonData.radius * 2.5, 0, 0);
                moonMesh.add(rightPanel);
            }

            moonMesh.userData = {
                name: moonData.name,
                description: moonData.description || `这是${data.name}的一颗卫星。`,
                details: moonData.details || { "英文名": "Moon" },
                link: moonData.link,
                realPhoto: moonData.realPhoto,
                type: "moon"
            };

            if (moonData.irregular && moonData.scale) {
                moonMesh.scale.set(moonData.scale[0], moonData.scale[1], moonData.scale[2]);
                moonMesh.userData.originalScaleVector = new THREE.Vector3(moonData.scale[0], moonData.scale[1], moonData.scale[2]);
            } else {
                moonMesh.userData.originalScaleVector = new THREE.Vector3(1, 1, 1);
            }

            moonMesh.castShadow = true;
            moonMesh.receiveShadow = false;
            systemGroup.add(moonMesh);

            const moonTrackShape = new THREE.EllipseCurve(0, 0, moonData.distance, moonData.distance, 0, 2 * Math.PI, false, 0);
            const moonTrack = new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints(moonTrackShape.getPoints(64)),
                new THREE.LineBasicMaterial({ color: 0xAAAAAA, transparent: true, opacity: 0.5 })
            );
            moonTrack.rotation.x = -Math.PI / 2;
            moonTrack.frustumCulled = false;

            const moonOrbitGroup = new THREE.Group();
            if (moonData.inclination) {
                moonOrbitGroup.rotation.x = moonData.inclination * (Math.PI / 180);
                moonOrbitGroup.rotation.y = Math.random() * Math.PI * 2;
            }
            moonOrbitGroup.add(moonTrack);
            moonOrbitGroup.add(moonMesh);
            systemGroup.add(moonOrbitGroup);
            moonTracks.push(moonTrack);

            const moonJ2000 = moonData.meanAnomalyJ2000 !== undefined ? moonData.meanAnomalyJ2000 : Math.random() * 360;
            activeMoons.push({
                mesh: moonMesh, trackMesh: moonTrack, group: moonOrbitGroup,
                distance: moonData.distance, originalDistance: moonData.distance,
                speed: moonData.speed, orbitalPeriod: moonData.orbitalPeriod,
                meanAnomalyJ2000: moonJ2000,
                angle: calculateMeanAnomaly(moonData.orbitalPeriod, moonJ2000, baseDate)
            });
        });
    }

    planets.push({
        mesh: planetMesh, systemGroup, trackMesh: track,
        speed: data.speed, orbitalPeriod: data.orbitalPeriod,
        meanAnomalyJ2000: data.meanAnomalyJ2000, rotateSpeed: data.rotateSpeed,
        distance: a, originalDistance: a, originalRadius: data.radius,
        eccentricity: e, semiMinor: b, focusOffset: c,
        angle: calculateMeanAnomaly(data.orbitalPeriod, data.meanAnomalyJ2000, baseDate),
        name: data.name, moons: activeMoons
    });
}

export function createAllPlanets(ctx, planetData) {
    planetData.forEach(data => createPlanet(ctx, data));
}

// --- Helper functions ---

function addAtmosphere(parent, radius, color, coef, power, opacity) {
    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
            glowColor: { value: new THREE.Color(color) },
            coef: { value: coef },
            power: { value: power },
            opacity: { value: opacity }
        },
        side: THREE.BackSide, blending: THREE.AdditiveBlending,
        transparent: true, opacity
    });
    parent.add(new THREE.Mesh(geo, mat));
}

function addEarthEffects(textureLoader, material, planetMesh, data) {
    if (textures.earthNormal) {
        textureLoader.load(textures.earthNormal, (normalMap) => {
            material.normalMap = normalMap;
            material.normalScale.set(0.85, 0.85);
            material.needsUpdate = true;
        });
    }
    if (textures.earthSpecular) {
        textureLoader.load(textures.earthSpecular, (specularMap) => {
            material.roughnessMap = specularMap;
            material.roughness = 0.4;
            material.metalness = 0.1;
            material.needsUpdate = true;
        });
    }
    if (textures.earthClouds) {
        textureLoader.load(textures.earthClouds, (cloudTex) => {
            const clouds = new THREE.Mesh(
                new THREE.SphereGeometry(data.radius + 0.05, 64, 64),
                new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
            );
            planetMesh.add(clouds);
            planetMesh.userData.clouds = clouds;
        }, undefined, () => console.warn("云层纹理加载失败"));
    }
    addAtmosphere(planetMesh, data.radius + 1.5, 0x0055aa, 0.4, 5.0, 0.6);
}

function addMarsEffects(textureLoader, planetMesh, data) {
    if (textures.earthClouds) {
        textureLoader.load(textures.earthClouds, (cloudTex) => {
            const cloudsMat = new THREE.MeshLambertMaterial({
                map: cloudTex, transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide
            });
            const clouds = new THREE.Mesh(new THREE.SphereGeometry(data.radius + 0.03, 64, 64), cloudsMat);
            clouds.material.color = new THREE.Color(0xffcccc);
            planetMesh.add(clouds);
            if (!planetMesh.userData.clouds) planetMesh.userData.clouds = clouds;
        });
    }
    addAtmosphere(planetMesh, data.radius + 0.8, 0xaa3300, 0.3, 6.0, 0.5);
}

function addSaturnRing(textureLoader, planetMesh, data) {
    const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 128);
    const ringMat = new THREE.MeshLambertMaterial({
        color: 0xC0A070, side: THREE.DoubleSide,
        transparent: true, opacity: 0.8, emissive: 0x222222, emissiveIntensity: 0.3
    });

    if (data.ringTexture) {
        textureLoader.load(data.ringTexture, (ringTex) => {
            const pos = ringGeo.attributes.position;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v3.fromBufferAttribute(pos, i);
                ringGeo.attributes.uv.setXY(i, v3.length() < (data.radius * 1.8) ? 0 : 1, 1);
            }
            ringGeo.attributes.uv.needsUpdate = true;
            ringMat.map = ringTex;
            ringMat.color.setHex(0xffffff);
            ringMat.opacity = 0.9;
            ringMat.needsUpdate = true;
        });
    }

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.userData = { name: data.name + "光环" };
    ring.rotation.x = -Math.PI / 2;
    ring.rotation.y = Math.PI / 10;
    planetMesh.add(ring);
}
