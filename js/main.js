import { planetData } from './data.js';
import { initScene } from './scene.js';
import { createAllPlanets } from './planets.js';
import { initUI } from './ui.js';
import { startAnimationLoop } from './animation.js';

const ctx = {
    // Arrays (populated by createAllPlanets)
    planets: [],
    planetTracks: [],
    moonTracks: [],
    cometTracks: [],
    cometTails: [],

    // Mutable state
    isFocused: false,
    focusedObject: null,
    focusedSystem: null,
    mouseMoved: false,
    simulatedDays: 0,
    timeSpeed: 1.0,
    isPaused: false,
    lastSpeed: 1.0,
};

initScene(ctx);
createAllPlanets(ctx, planetData);
initUI(ctx);

setTimeout(() => {
    const el = document.getElementById('loading');
    if (el && el.style.display !== 'none') {
        el.style.display = 'none';
        console.log("Loading timeout: Force hiding loading screen.");
    }
}, 2000);

startAnimationLoop(ctx);
