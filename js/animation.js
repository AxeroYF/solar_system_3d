import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export function startAnimationLoop(ctx) {
    const clock = new THREE.Clock();
    const {
        scene, camera, renderer, controls, sun,
        planets, cometTails, asteroidBeltMesh, kuiperBeltMesh
    } = ctx;

    const dateText = document.getElementById('date-text');
    const tooltip = document.getElementById('tooltip');
    const orbitScale = 4.6;

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Time simulation
        ctx.simulatedDays += delta * ctx.timeSpeed;
        const currentDate = new Date(ctx.baseDate.getTime() + ctx.simulatedDays * 86400000);
        dateText.innerText = currentDate.toISOString().split('T')[0];

        ctx.updateCameraPosition();

        // Sun rotation
        sun.rotation.y += 0.002 * delta * ctx.timeSpeed;

        // Kuiper belt rotation
        if (kuiperBeltMesh && ctx.timeSpeed > 0) {
            kuiperBeltMesh.rotation.y += 0.0002 * delta * ctx.timeSpeed;
        }

        // Update planets
        planets.forEach(p => {
            if (p.mesh.userData.tooltipSuffix) delete p.mesh.userData.tooltipSuffix;

            if (ctx.timeSpeed > 0) {
                if (p.orbitalPeriod) {
                    p.angle += (2 * Math.PI / p.orbitalPeriod) * delta * ctx.timeSpeed;
                } else {
                    p.angle += p.speed * orbitScale * delta * ctx.timeSpeed;
                }

                // Kepler equation (Newton's method)
                let M = p.angle, e = p.eccentricity, E = M;
                if (e > 0.001) {
                    for (let i = 0; i < 5; i++) {
                        E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
                    }
                }

                p.systemGroup.position.x = p.distance * Math.cos(E) - p.focusOffset;
                p.systemGroup.position.z = p.semiMinor * Math.sin(E);
                p.mesh.rotation.y += p.rotateSpeed * 60 * delta * ctx.timeSpeed;

                if (p.mesh.userData.clouds) {
                    p.mesh.userData.clouds.rotation.y += p.rotateSpeed * 1.1 * 60 * delta * ctx.timeSpeed;
                }

                if (p.moons) {
                    p.moons.forEach(m => {
                        if (m.orbitalPeriod) {
                            m.angle += (2 * Math.PI / m.orbitalPeriod) * delta * ctx.timeSpeed;
                        } else {
                            m.angle += m.speed * orbitScale * delta * ctx.timeSpeed;
                        }
                        m.mesh.position.x = Math.cos(m.angle) * m.distance;
                        m.mesh.position.z = Math.sin(m.angle) * m.distance;
                    });
                }
            }
        });

        // Comet tails
        if (cometTails.length > 0) {
            const sunPos = new THREE.Vector3(0, 0, 0);
            cometTails.forEach(tail => {
                const cometPos = new THREE.Vector3();
                tail.target.getWorldPosition(cometPos);
                tail.mesh.position.copy(cometPos);

                const dir = new THREE.Vector3().subVectors(cometPos, sunPos).normalize();
                tail.mesh.lookAt(cometPos.clone().add(dir));

                const dist = cometPos.distanceTo(sunPos);
                let scale = Math.max(0.1, 1.5 - (dist / 400));
                tail.mesh.scale.set(scale, scale, scale * 1.5);
                tail.mesh.material.opacity = Math.max(0, scale * 0.8);
            });
        }

        // Tooltip raycasting (only when mouse moved)
        if (ctx.mouseMoved) {
            ctx.mouseMoved = false;
            if (!ctx.isFocused) {
                ctx.raycaster.setFromCamera(ctx.mouse, camera);
                ctx.raycaster.params.Points.threshold = 2;

                const targets = [sun];
                if (asteroidBeltMesh) targets.push(asteroidBeltMesh);
                planets.forEach(p => {
                    targets.push(p.mesh);
                    if (p.moons) p.moons.forEach(m => targets.push(m.mesh));
                });

                const intersects = ctx.raycaster.intersectObjects(targets, false);
                if (intersects.length > 0) {
                    let name = intersects[0].object.userData.name;
                    if (!name && intersects[0].object === sun) name = "太阳";
                    if (intersects[0].object.userData.tooltipSuffix) name += intersects[0].object.userData.tooltipSuffix;
                    if (name) {
                        tooltip.innerText = name;
                        tooltip.style.display = 'block';
                        document.body.style.cursor = 'pointer';
                    }
                } else {
                    tooltip.style.display = 'none';
                    document.body.style.cursor = 'default';
                }
            } else {
                tooltip.style.display = 'none';
                document.body.style.cursor = 'default';
            }
        }

        TWEEN.update();

        // Focus follow
        if (ctx.isFocused && ctx.focusedObject) {
            const targetPos = new THREE.Vector3();
            ctx.focusedObject.getWorldPosition(targetPos);
            controls.target.lerp(targetPos, 0.1);
        }

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
