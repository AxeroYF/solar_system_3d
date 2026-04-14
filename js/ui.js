import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { realScaleData } from './data.js';
import { calculateMeanAnomaly } from './planets.js';

export function initUI(ctx) {
    const { scene, camera, controls, sun, planets, planetTracks, cometTracks, moonTracks, asteroidBeltMesh, kuiperBeltMesh } = ctx;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.getElementById('tooltip');
    const planetInfoPanel = document.getElementById('planet-info-panel');
    const helpBtn = document.getElementById('help-btn');
    const helpPanel = document.getElementById('help-panel');
    const closeHelp = document.getElementById('close-help');
    const panelCloseBtn = document.getElementById('panel-close-btn');
    const panelCloseHint = document.getElementById('panel-close-hint');

    ctx.raycaster = raycaster;
    ctx.mouse = mouse;

    // Help panel
    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPanel.style.display = 'block'; });
    closeHelp.addEventListener('click', () => { helpPanel.style.display = 'none'; });
    helpPanel.addEventListener('click', (e) => { e.stopPropagation(); });

    // Info panel close
    panelCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); resetView(); });
    panelCloseHint.addEventListener('click', (e) => { e.stopPropagation(); resetView(); });

    // Focus state
    const originalCameraPosition = new THREE.Vector3();
    const originalControlsTarget = new THREE.Vector3();

    // Mouse move
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        ctx.mouseMoved = true;
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top = event.clientY + 'px';
    });

    // Click to focus
    window.addEventListener('click', (event) => {
        raycaster.setFromCamera(mouse, camera);
        const targets = [sun];
        planets.forEach(p => {
            targets.push(p.mesh);
            if (p.moons) p.moons.forEach(m => targets.push(m.mesh));
        });
        const intersects = raycaster.intersectObjects(targets, false);
        if (intersects.length > 0) focusOnObject(intersects[0].object);
    });

    // ESC key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (helpPanel.style.display === 'block') helpPanel.style.display = 'none';
            else if (ctx.isFocused) resetView();
        }
    });

    // Navigation
    const navigationList = [];
    navigationList.push(sun);
    planets.forEach(p => navigationList.push(p.mesh));

    document.getElementById('prev-btn').addEventListener('click', (e) => { e.stopPropagation(); switchFocus(-1); });
    document.getElementById('next-btn').addEventListener('click', (e) => { e.stopPropagation(); switchFocus(1); });

    function switchFocus(offset) {
        if (!ctx.focusedObject) return;
        let idx = navigationList.indexOf(ctx.focusedObject);
        if (idx === -1) {
            const parent = planets.find(p => p.moons && p.moons.some(m => m.mesh === ctx.focusedObject));
            idx = parent ? navigationList.indexOf(parent.mesh) : 0;
        }
        let newIdx = (idx + offset) % navigationList.length;
        if (newIdx < 0) newIdx += navigationList.length;
        focusOnObject(navigationList[newIdx]);
    }

    function focusOnObject(object) {
        if (ctx.focusedObject === object) return;
        ctx.isFocused = true;
        ctx.focusedObject = object;

        ctx.focusedSystem = null;
        if (object !== sun) {
            const entry = planets.find(p => p.mesh === object);
            if (entry) {
                ctx.focusedSystem = entry.systemGroup;
            } else {
                const parent = planets.find(p => p.moons && p.moons.some(m => m.mesh === object));
                if (parent) ctx.focusedSystem = parent.systemGroup;
            }
        }

        if (!originalCameraPosition.lengthSq()) {
            originalCameraPosition.copy(camera.position);
            originalControlsTarget.copy(controls.target);
        }

        updateInfoPanel(object);
        planetInfoPanel.style.display = 'block';
        tooltip.style.display = 'none';

        let radius = 0;
        if (object.geometry.parameters && object.geometry.parameters.radius) {
            radius = object.geometry.parameters.radius;
        } else {
            object.geometry.computeBoundingSphere();
            radius = object.geometry.boundingSphere.radius;
        }
        const offsetDist = radius * 4 + (object === sun ? 50 : 10);
        const targetPos = new THREE.Vector3();
        object.getWorldPosition(targetPos);
        const dir = new THREE.Vector3().subVectors(camera.position, targetPos).normalize();
        if (dir.lengthSq() < 0.1) dir.set(0, 0, 1);
        const newCamPos = targetPos.clone().add(dir.multiplyScalar(offsetDist));

        new TWEEN.Tween(camera.position).to(newCamPos, 1000).easing(TWEEN.Easing.Cubic.Out).start();
        new TWEEN.Tween(controls.target).to(targetPos, 1000).easing(TWEEN.Easing.Cubic.Out).start();
    }

    function resetView() {
        if (!ctx.isFocused) return;
        planetInfoPanel.style.display = 'none';
        new TWEEN.Tween(camera.position).to(originalCameraPosition, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
        new TWEEN.Tween(controls.target).to(originalControlsTarget, 1500).easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(() => {
                ctx.isFocused = false;
                ctx.focusedObject = null;
                ctx.focusedSystem = null;
                originalCameraPosition.set(0, 0, 0);
            }).start();
    }

    // --- Preview ---
    let previewRenderer, previewScene, previewCamera, previewObject, previewId;
    const previewContainer = document.getElementById('planet-preview-container');

    function initPreview() {
        if (previewRenderer) return;
        const w = previewContainer.clientWidth || 280;
        const h = previewContainer.clientHeight || 200;
        previewScene = new THREE.Scene();
        previewCamera = new THREE.PerspectiveCamera(35, w / h, 0.1, 1000);
        previewCamera.position.z = 4;
        previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        previewRenderer.setSize(w, h);
        previewRenderer.setPixelRatio(window.devicePixelRatio);
        previewRenderer.domElement.id = "planet-preview-canvas";
        previewContainer.appendChild(previewRenderer.domElement);
        previewScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(5, 3, 10);
        previewScene.add(dirLight);
    }

    function updatePreview(targetObject) {
        initPreview();
        if (previewObject) {
            previewScene.remove(previewObject);
            if (previewObject.geometry) previewObject.geometry.dispose();
        }
        if (previewId) cancelAnimationFrame(previewId);

        const geo = (targetObject.userData && targetObject.userData.irregular)
            ? targetObject.geometry.clone()
            : new THREE.SphereGeometry(1.2, 64, 64);

        let mat;
        if (targetObject.material) {
            mat = targetObject.material.clone();
            if (mat.type !== 'MeshBasicMaterial') {
                mat.emissiveIntensity = 0.5;
                mat.emissive.setHex(0x222222);
            }
        } else {
            mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        }

        previewObject = new THREE.Mesh(geo, mat);

        targetObject.children.forEach(child => {
            if (child.isMesh && child.geometry && child.geometry.type.includes("Ring")) {
                const ring = new THREE.Mesh(child.geometry.clone(), child.material.clone());
                const origR = targetObject.geometry.parameters ? targetObject.geometry.parameters.radius : 1.2;
                const s = 1.2 / origR;
                ring.scale.set(s, s, s);
                ring.rotation.copy(child.rotation);
                previewObject.add(ring);
            }
            if (child === targetObject.userData.clouds) {
                previewObject.add(new THREE.Mesh(
                    new THREE.SphereGeometry(1.22, 64, 64),
                    child.material.clone()
                ));
            }
        });

        previewScene.add(previewObject);
        (function animatePreview() {
            previewId = requestAnimationFrame(animatePreview);
            if (previewObject) previewObject.rotation.y += 0.01;
            previewRenderer.render(previewScene, previewCamera);
        })();
    }

    function updateInfoPanel(object) {
        const data = object.userData;
        document.getElementById('panel-name').innerText = data.name || "未知星球";
        document.getElementById('panel-desc').innerText = data.description || "暂无详细描述。";

        const statsDiv = document.getElementById('panel-stats');
        statsDiv.innerHTML = '';
        if (data.details) {
            const table = document.createElement('table');
            for (const [key, value] of Object.entries(data.details)) {
                const tr = document.createElement('tr');
                const tdKey = document.createElement('td'); tdKey.innerText = key;
                const tdVal = document.createElement('td'); tdVal.innerText = value;
                tr.appendChild(tdKey); tr.appendChild(tdVal);
                table.appendChild(tr);
            }
            statsDiv.appendChild(table);
        }
        if (data.link) {
            const linkDiv = document.createElement('div');
            linkDiv.style.marginTop = '15px';
            linkDiv.style.textAlign = 'center';
            const link = document.createElement('a');
            link.href = data.link; link.target = '_blank';
            link.innerText = '查看维基百科详情';
            link.style.color = '#4FD0E7'; link.style.textDecoration = 'none'; link.style.fontSize = '14px';
            link.onmouseover = () => link.style.textDecoration = 'underline';
            link.onmouseout = () => link.style.textDecoration = 'none';
            linkDiv.appendChild(link);
            statsDiv.appendChild(linkDiv);
        }

        const photoImg = document.getElementById('planet-photo-display');
        if (data.realPhoto) {
            photoImg.src = data.realPhoto;
            photoImg.style.display = 'block';
            if (previewRenderer) previewRenderer.domElement.style.display = 'none';
            if (previewId) cancelAnimationFrame(previewId);
        } else {
            photoImg.style.display = 'none';
            if (previewRenderer) previewRenderer.domElement.style.display = 'block';
            updatePreview(object);
        }
    }

    // --- Time Controls ---
    const dateText = document.getElementById('date-text');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timeDisplay = document.getElementById('time-display');
    const dateModal = document.getElementById('date-picker-modal');
    const inputYear = document.getElementById('input-year');
    const inputMonth = document.getElementById('input-month');
    const inputDay = document.getElementById('input-day');
    const dateConfirm = document.getElementById('date-confirm');
    const dateCancel = document.getElementById('date-cancel');

    // Track toggles
    document.getElementById('toggle-planet-tracks').addEventListener('change', (e) => {
        planetTracks.forEach(t => t.visible = e.target.checked);
    });
    document.getElementById('toggle-comet-tracks').addEventListener('change', (e) => {
        cometTracks.forEach(t => t.visible = e.target.checked);
    });
    document.getElementById('toggle-moon-tracks').addEventListener('change', (e) => {
        moonTracks.forEach(t => t.visible = e.target.checked);
    });

    function jumpToDate(targetDate) {
        ctx.simulatedDays = 0;
        ctx.baseDate.setTime(targetDate.getTime());
        dateText.innerText = targetDate.toISOString().split('T')[0];
        ctx.isPaused = true;
        pauseBtn.innerText = "▶️ Play";
        pauseBtn.style.background = "rgba(200, 50, 50, 0.6)";
        ctx.timeSpeed = 0;

        planets.forEach(p => {
            if (p.orbitalPeriod) {
                p.angle = calculateMeanAnomaly(p.orbitalPeriod, p.meanAnomalyJ2000, targetDate);
            }
            let M = p.angle, e = p.eccentricity, E = M;
            if (e > 0.001) {
                for (let i = 0; i < 5; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            }
            p.systemGroup.position.x = p.distance * Math.cos(E) - p.focusOffset;
            p.systemGroup.position.z = p.semiMinor * Math.sin(E);

            if (p.moons) {
                p.moons.forEach(m => {
                    if (m.orbitalPeriod) {
                        m.angle = calculateMeanAnomaly(m.orbitalPeriod, m.meanAnomalyJ2000, targetDate);
                        m.mesh.position.x = Math.cos(m.angle) * m.distance;
                        m.mesh.position.z = Math.sin(m.angle) * m.distance;
                    }
                });
            }
        });
    }

    speedSlider.addEventListener('input', (e) => {
        const sliderVal = parseFloat(e.target.value);
        const val = 0.1 * Math.pow(365 / 0.1, sliderVal / 1000);
        speedValue.innerText = (val < 10 ? val.toFixed(1) : Math.round(val)) + 'x';
        if (!ctx.isPaused) ctx.timeSpeed = val;
        ctx.lastSpeed = val;
    });

    pauseBtn.addEventListener('click', () => {
        ctx.isPaused = !ctx.isPaused;
        if (ctx.isPaused) {
            ctx.timeSpeed = 0;
            pauseBtn.innerText = "▶️ Play";
            pauseBtn.style.background = "rgba(200, 50, 50, 0.6)";
        } else {
            ctx.timeSpeed = ctx.lastSpeed;
            pauseBtn.innerText = "⏸️ Pause";
            pauseBtn.style.background = "rgba(255, 255, 255, 0.2)";
        }
    });

    resetBtn.addEventListener('click', () => {
        jumpToDate(new Date());
        speedSlider.value = 281;
        speedValue.innerText = "1.0x";
        ctx.lastSpeed = 1.0;
    });

    // Date picker
    timeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentDate = new Date(ctx.baseDate.getTime() + ctx.simulatedDays * 86400000);
        inputYear.value = currentDate.getFullYear();
        inputMonth.value = currentDate.getMonth() + 1;
        inputDay.value = currentDate.getDate();
        dateModal.style.display = 'block';
        if (!ctx.isPaused) pauseBtn.click();
    });
    dateCancel.addEventListener('click', (e) => { e.stopPropagation(); dateModal.style.display = 'none'; });
    dateConfirm.addEventListener('click', (e) => {
        e.stopPropagation();
        jumpToDate(new Date(parseInt(inputYear.value), parseInt(inputMonth.value) - 1, parseInt(inputDay.value)));
        dateModal.style.display = 'none';
    });
    dateModal.addEventListener('click', (e) => e.stopPropagation());

    function handleWheelInput(e) {
        e.preventDefault();
        let val = parseInt(e.target.value) + (e.deltaY < 0 ? 1 : -1);
        val = Math.max(parseInt(e.target.min), Math.min(parseInt(e.target.max), val));
        e.target.value = val;
    }
    [inputYear, inputMonth, inputDay].forEach(input => {
        input.addEventListener('wheel', handleWheelInput, { passive: false });
    });

    // Real scale toggle
    const toggleRealScale = document.getElementById('toggle-real-scale');
    toggleRealScale.checked = false;
    toggleRealScale.addEventListener('change', (e) => updatePlanetScales(e.target.checked));

    function updatePlanetScales(isReal) {
        planets.forEach(p => {
            const rd = realScaleData[p.name];
            let newDist, newScale;
            if (isReal && rd) {
                newDist = 200 * rd.au;
                newScale = (2 * rd.radiusRatio) / p.originalRadius;
            } else {
                newDist = p.originalDistance;
                newScale = 1.0;
            }

            p.distance = newDist;
            p.semiMinor = newDist * Math.sqrt(1 - p.eccentricity * p.eccentricity);
            p.focusOffset = newDist * p.eccentricity;

            if (p.mesh.userData.originalScaleVector) {
                p.mesh.scale.copy(p.mesh.userData.originalScaleVector).multiplyScalar(newScale);
            } else {
                p.mesh.scale.set(newScale, newScale, newScale);
            }

            if (p.moons) {
                p.moons.forEach(m => {
                    if (m.mesh.userData.originalScaleVector) {
                        m.mesh.scale.copy(m.mesh.userData.originalScaleVector).multiplyScalar(newScale);
                    } else {
                        m.mesh.scale.set(newScale, newScale, newScale);
                    }
                    m.distance = m.originalDistance * (isReal ? newScale : 1.0);
                    if (m.trackMesh) {
                        const curve = new THREE.EllipseCurve(0, 0, m.distance, m.distance, 0, 2 * Math.PI);
                        m.trackMesh.geometry.setFromPoints(curve.getPoints(64));
                    }
                });
            }

            if (p.trackMesh) {
                const fc = p.focusOffset;
                const curve = new THREE.EllipseCurve(-fc, 0, p.distance, p.semiMinor, 0, 2 * Math.PI);
                p.trackMesh.geometry.setFromPoints(curve.getPoints(256));
            }
        });

        updateBelt(asteroidBeltMesh, 200, 250, 2.2, 3.2, isReal, true);
        updateBelt(kuiperBeltMesh, 1100, 1600, 30, 50, isReal, false);
    }

    function updateBelt(mesh, origInner, origOuter, realInnerAU, realOuterAU, isReal, isAsteroid) {
        if (!mesh) return;
        const positions = mesh.geometry.attributes.position.array;
        const count = positions.length / 3;
        const originalPos = mesh.userData.originalGeometry.attributes.position.array;
        const origWidth = origOuter - origInner;
        const targetInner = isReal ? 200 * realInnerAU : origInner;
        const targetOuter = isReal ? 200 * realOuterAU : origOuter;
        const targetWidth = targetOuter - targetInner;

        mesh.material.size = isReal ? (isAsteroid ? 0.8 : 1.5) : (isAsteroid ? 1.5 : 2.0);

        for (let i = 0; i < count; i++) {
            const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
            const ox = originalPos[ix], oy = originalPos[iy], oz = originalPos[iz];
            const oldR = Math.sqrt(ox * ox + oz * oz);
            const angle = Math.atan2(oz, ox);
            const normR = Math.max(0, Math.min(1, (oldR - origInner) / origWidth));
            const newR = targetInner + normR * targetWidth;
            positions[ix] = newR * Math.cos(angle);
            positions[iz] = newR * Math.sin(angle);
            positions[iy] = oy * (isReal ? (isAsteroid ? 2.0 : 10.0) : 1.0);
        }
        mesh.geometry.attributes.position.needsUpdate = true;
    }
}
