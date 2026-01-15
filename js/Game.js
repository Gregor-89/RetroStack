// Game.js
import { PhysicsWorld } from './PhysicsWorld.js';
import { Player } from './Player.js';
import { UIManager } from './UIManager.js';
import { EnemyManager } from './EnemyManager.js';
import { GameConfig } from './Config.js'; // Import Config
import { CONSOLE_DATA } from './ConsoleData.js';
import { InputManager } from './InputManager.js';


// Particle System Class
class Particle {
    constructor(x, y, color, speed = 400) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * speed; // Random X speed
        this.vy = (Math.random() - 0.5) * speed; // Random Y speed
        this.life = 1.0; // 1 second
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt * 2.0; // Fade out fast
        this.size *= 0.95;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.width = this.container.clientWidth;

        // Fix: Calculate explicit available height to avoid 0/Fallbacks causing clipping
        const header = document.getElementById('game-header');
        const controls = document.getElementById('controls');
        const hHeight = header ? header.offsetHeight : 0;
        const cHeight = controls ? controls.offsetHeight : 0;

        // Use window height minus UI (safe flex approximation)
        // If container.clientHeight is valid and > 200, use it. Otherwise calc.
        if (this.container.clientHeight > 200) {
            this.height = this.container.clientHeight;
        } else {
            // Fallback to calculation
            this.height = window.innerHeight - hHeight - cHeight - 10; // -10 for safety/borders
        }

        // DEBUG: Force visible confirmation of what HEIGHT is being used
        // console.log("CALCULATED HEIGHT:", this.height);
        // console.log("Window:", window.innerHeight, "Header:", hHeight, "Controls:", cHeight);

        this.gameTime = 0; // RESTORED: Vital for timer and rotation logic


        // Ensure PhysicsWorld gets the CORRECT height
        // Previously PhysicsWorld constructor used container.clientHeight again!
        // We must pass dimensions to PhysicsWorld or fix it there.
        // Looking at PhysicsWorld constructor: 
        // this.width = this.container.clientWidth; 
        // this.height = this.container.clientHeight; << THIS IS THE BUG
        // It ignores 'this.height' calculated here.

        this.physicsWorld = new PhysicsWorld('game-container', this.width, this.height);
        this.uiManager = new UIManager();
        this.inputManager = new InputManager(this); // Init Input
        this.player = new Player(this.width, this.height);
        this.enemyManager = new EnemyManager(this.physicsWorld, this.width, this.height);

        // Game State
        this.isPlaying = false;
        // Game State
        this.isPlaying = false;
        this.isGameOver = false;
        this.lastTime = 0;
        this.dropTimerMax = GameConfig.Gameplay.autoDropTime || 15;
        this.dropTimer = this.dropTimerMax;
        this.timerMultiplier = 1.0;
        this.score = 0;
        this.stackHeight = 0;
        this.droppedBlocksCount = 0;
        this.dropCooldown = 0; // Initialize explicitly
        this.bombTimer = 0;

        this.bestStackHeight = parseInt(localStorage.getItem('retroStackBestHeight')) || 0;

        // VISUAL EFFECTS STATE
        this.particles = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.dropOrder = 'random'; // 'random', 'asc', 'desc' (default random)
        this.chronoIndex = -1; // Tracker for chronological drop
        this.dropOrder = 'random'; // 'random', 'asc', 'desc' (default random)
        this.chronoIndex = -1; // Tracker for chronological drop
        this.bgGridOffset = 0;
        this.uvOpacity = 1.0; // Init Opacity (Full visibility)

        // Enemy Toggles (Default all true)
        this.enabledEnemies = {
            'archon': true, 'kosinski': true, 'lipski': true, 'nrgeek': true,
            'polowianiuk': true, 'quaz': true, 'ryslaw': true, 'uv': true, 'zagrajnik': true
        };

        // Asset Manifest (50 Consoles)
        this.assetManifest = [
            "amiga_500.png", "atari_2600.png", "atari_520st.png", "atari_jaguar.png", "atari_pong.png",
            "commodore_64.png", "elektronika_im.png", "game_com.png", "gameboy.png", "gameboy_advance.png", "gameboy_color.png",
            "gizmondo.png", "intellivision.png", "magnavox_odyssey.png", "neo_geo.png", "neo_geo_pocket.png",
            "neo_geo_pocket_color.png", "nes.png", "nintendo_3ds.png", "nintendo_64.png", "nintendo_ds.png",
            "nintendo_gamecube.png", "nintendo_switch.png", "nintendo_switch_2.png", "nokia_n-gage.png", "ouya.png",
            "panasonic_3do.png", "pegasus.png", "playstation.png", "playstation_2.png", "playstation_3.png",
            "playstation_4.png", "playstation_4_pro.png", "playstation_5.png", "playstation_5_pro.png", "playstation_portable_psp.png", "ps_vita.png", "sega_dreamcast.png",
            "sega_master_system.png", "sega_mega_drive.png", "sega_nomad.png", "sega_game_gear.png", "sega_saturn.png", "snes.png",
            "steam_deck.png", "steam_machine.png", "virtualboy.png", "wii.png", "wii_u.png", "xbox.png",
            "xbox_360.png", "xbox_one.png", "xbox_one_x.png", "xbox_series_s.png", "xbox_series_x.png"

        ];

        this.characterManifest = [
            "zagrajnik-sprite.png", "archon-sprite.png", "quaz-sprite.png", "ryslaw-sprite.png",
            "nrgeek-sprite.png", "lipski-sprite.png", "kosinski-sprite.png", "polowianiuk-sprite.png",
            "uv-sprite.png"
        ];

        this.consoleTypes = []; // dynamic population
        this.textures = {};
        this.characterTextures = {}; // Separate cache for enemies

        // AUDIO
        // AUDIO
        this.sfxVolume = 0.5;
        this.musicVolume = 0.5;
        this.sounds = {};
        this.sfxManifest = [
            'ui_hover.mp3', 'ui_click.mp3', 'ui_back.mp3',
            'block_drop.mp3', 'block_impact.mp3', 'game_over.mp3',
            'bomb_drop.mp3', 'bomb_impact.mp3', 'bomb_explode.mp3',
            'effect_alert.mp3', 'score_gain.mp3', 'score_loss.mp3',
            'enemy_death.mp3'
        ];

        this.introAudio = new Audio('assets/music/intro.mp3');
        this.introAudio.loop = true;

        // Bindings
        this.loop = this.loop.bind(this);
        this.handleInput();

        // Custom Render Hook
        Matter.Events.on(this.physicsWorld.render, 'afterRender', () => {
            if (this.isPlaying || this.isPaused) this.draw();
        });

        // Collision Events
        Matter.Events.on(this.physicsWorld.engine, 'collisionStart', (event) => {
            this.handleCollisions(event);

            // Generic Impact Sound Logic
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                // Check for Console-Console or Console-Ground impact
                if ((bodyA.label === 'Console' && bodyB.label === 'Console') ||
                    (bodyA.label === 'Console' && bodyB.label === 'Ground') ||
                    (bodyB.label === 'Console' && bodyA.label === 'Ground')) {

                    // Speed Threshold to avoid constant noise
                    const speedA = bodyA.speed;
                    const speedB = bodyB.speed;
                    if (speedA > 0.5 || speedB > 0.5) {
                        // Debounce? Or just play randomly to avoid span
                        if (Math.random() > 0.5) this.playSFX('block_impact');
                    }
                }
            }
        });

        // Init State - START LOADING
        this.isPlaying = false;
        this.isPaused = false;

        // Hide Start Screen initially, show Loading
        // this.uiManager.showStartScreen(); // Moved to after load
        // Hide Start Screen initially, show Loading
        // this.uiManager.showStartScreen(); // Moved to after load
        this.initBootScreen(); // Setup boot interaction

        // Update BIOS Date/Time dynamically
        const updateBios = () => {
            const now = new Date();
            const year = now.getFullYear();

            // Format DD/MM/YY
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const shortYear = String(year).slice(-2);
            const dateStr = `${day}/${month}/${shortYear}`;

            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

            const elYear = document.getElementById('bios-year');
            const elDate = document.getElementById('bios-date');
            const elTime = document.getElementById('bios-time');

            if (elYear) elYear.textContent = year;
            if (elDate) elDate.textContent = dateStr;
            if (elTime) elTime.textContent = timeStr;
        };

        // Try immediately, or wait if needed (though Constructor runs on DOMContentLoaded usually)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateBios);
        } else {
            updateBios();
        }
    }

    // Unified initBootScreen handles both Listeners and Boot Sequence
    initBootScreen() {
        // 1. ATTACH MENU LISTENERS
        document.getElementById('btn-start').addEventListener('click', () => {
            console.log("BTN: Start Clicked");
            this.startGame();
        });
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause()); // Resume from pause
        document.getElementById('btn-pause-header').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-quit').addEventListener('click', () => this.resetGame());

        // Retry Button
        const btnRetry = document.getElementById('btn-retry');
        if (btnRetry) {
            btnRetry.addEventListener('click', () => {
                this.resetGame();
                this.startGame();
            });
        }

        // Game Over Quit Button
        const btnGameOverQuit = document.getElementById('btn-gameover-quit');
        if (btnGameOverQuit) {
            btnGameOverQuit.addEventListener('click', () => {
                this.resetGame();
                // resetGame normally resets to Start Screen state if introSkipped is true
            });
        }

        // Pointer Events for Canvas
        const canvas = this.container.querySelector('canvas');
        if (canvas) {
            canvas.style.pointerEvents = 'none';
        }

        this.setGameControlsVisible(false);
        this.runBiosSequence();

        // 2. SETTINGS & OPTIONS
        this.showBackground = true;

        this.bgIntensity = 1.0;
        this.shakeEnabled = true;
        this.loadSettings();

        document.getElementById('btn-options').addEventListener('click', () => {
            console.log("BTN: Options Clicked");
            this.uiManager.hideStartScreen();
            this.uiManager.showOptions();
            this.inputManager.setScreen('options');
        });
        document.getElementById('btn-options-back').addEventListener('click', () => {
            console.log("BTN: Options Back Clicked");
            this.uiManager.hideOptions();
            this.uiManager.showStartScreen();
            this.inputManager.setScreen('start');
            this.saveSettings();
        });

        // 3. NEW MENUS
        document.getElementById('btn-how-to').addEventListener('click', () => {
            this.uiManager.showHowTo();
            this.inputManager.setScreen('howto');
        });
        document.getElementById('btn-how-back').addEventListener('click', () => {
            this.uiManager.hideHowTo();
            this.inputManager.setScreen('start');
        });
        document.getElementById('btn-encyclopedia').addEventListener('click', () => {
            this.uiManager.showEncyclopedia();
            this.inputManager.setScreen('encyclopedia');
        });
        document.getElementById('btn-enc-back').addEventListener('click', () => {
            this.uiManager.hideEncyclopedia();
            this.inputManager.setScreen('start');
        });

        // 4. CRT & CONTROLS BINDING
        const crtOverlay = document.getElementById('crt-overlay');
        const bindCheckbox = (id, propName, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', (e) => {
                this[propName] = e.target.checked;
                this.saveSettings();
                if (callback) callback(e.target.checked);
            });
        };
        const bindSelect = (id, propName, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', (e) => {
                this[propName] = e.target.value;
                this.saveSettings();
                if (callback) callback(e.target.value);
            });
        };
        const bindSlider = (id, callback) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => callback(e.target.value));
                el.addEventListener('change', () => this.saveSettings());
            }
        };

        bindCheckbox('opt-crt-toggle', 'crtEnabled', (checked) => {
            if (crtOverlay) crtOverlay.style.display = checked ? 'block' : 'none';
        });
        bindSlider('opt-crt-intensity', (val) => {
            if (crtOverlay) crtOverlay.style.opacity = val / 100;
        });
        bindCheckbox('opt-bg-toggle', 'showBackground');
        bindSlider('opt-bg-intensity', (val) => { this.bgIntensity = val / 100; });
        bindSlider('opt-music-vol', (val) => {
            this.musicVolume = val / 100;
            this.updateVolumes();
        });
        bindSlider('opt-sfx-vol', (val) => {
            this.sfxVolume = val / 100;
            this.playSFX('ui_click');
        });
        bindCheckbox('opt-shake-toggle', 'shakeEnabled');
        bindSelect('opt-drop-order', 'dropOrder', (val) => {
            this.sortConsoles();
            this.randomizeNextBlock();
        });

        // BIND ENEMY TOGGLES
        const enemyIds = ['archon', 'kosinski', 'lipski', 'nrgeek', 'polowianiuk', 'quaz', 'ryslaw', 'uv', 'zagrajnik'];
        enemyIds.forEach(id => {
            bindCheckbox(`opt-enemy-${id}`, null, (checked) => {
                this.enabledEnemies[id] = checked;
                this.saveSettings();
            });
        });

        // REGISTER MENUS FOR NAVIGATION
        this.inputManager.registerScreen('start', ['btn-start', 'btn-how-to', 'btn-encyclopedia', 'btn-options']);
        this.inputManager.registerScreen('options', [
            'opt-music-vol', 'opt-sfx-vol',
            'opt-crt-toggle', 'opt-crt-intensity',
            'opt-bg-toggle', 'opt-bg-intensity', 'opt-shake-toggle',
            'opt-drop-order',
            // Enemy Toggles
            'opt-enemy-archon', 'opt-enemy-kosinski', 'opt-enemy-lipski',
            'opt-enemy-nrgeek', 'opt-enemy-polowianiuk', 'opt-enemy-quaz',
            'opt-enemy-ryslaw', 'opt-enemy-uv', 'opt-enemy-zagrajnik',
            'btn-options-back'
        ]);
        this.inputManager.registerScreen('pause', ['btn-resume', 'btn-quit']);
        this.inputManager.registerScreen('gameover', ['btn-retry', 'btn-gameover-quit']);
        this.inputManager.registerScreen('howto', ['btn-how-back']);
        this.inputManager.registerScreen('encyclopedia', ['btn-enc-back']);

        this.inputManager.setScreen('boot'); // Set Input Context to Boot for Gamepad support

        this.loopId = requestAnimationFrame(this.loop);

        // 5. BOOT SEQUENCE
        this.setupBootSequence();
    }

    setupBootSequence() {
        const bootScreen = document.getElementById('boot-screen');
        if (!bootScreen) {
            this.startLoading();
            return;
        }

        this._bootCleanup = () => {
            document.removeEventListener('click', this._handleBootAction);
            document.removeEventListener('keydown', this._handleBootAction);
        };

        this._handleBootAction = () => this.skipBoot();

        document.addEventListener('click', this._handleBootAction);
        document.addEventListener('keydown', this._handleBootAction);
    }

    skipBoot() {
        const bootScreen = document.getElementById('boot-screen');
        const loadingScreen = document.getElementById('loading-screen');

        if (bootScreen) {
            bootScreen.classList.remove('active');
            bootScreen.classList.add('hidden');
        }

        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            loadingScreen.classList.add('active');
        }

        this.startLoading();

        if (this._bootCleanup) this._bootCleanup();
    }

    loadSettings() {
        const s = localStorage.getItem('retroStackSettings');
        if (s) {
            try {
                const settings = JSON.parse(s);

                // CRT
                const crtToggle = document.getElementById('opt-crt-toggle');
                const crtOverlay = document.getElementById('crt-overlay');
                if (crtToggle) crtToggle.checked = settings.crtEnabled !== false;
                if (crtOverlay) crtOverlay.style.display = (settings.crtEnabled !== false) ? 'block' : 'none';

                const crtIntensity = document.getElementById('opt-crt-intensity');
                if (crtIntensity && crtOverlay) {
                    const val = typeof settings.crtIntensity === 'number' ? settings.crtIntensity : 60;
                    crtIntensity.value = val;
                    crtOverlay.style.opacity = val / 100;
                }

                // BG
                this.showBackground = settings.bgEnabled !== false;
                const bgToggle = document.getElementById('opt-bg-toggle');
                if (bgToggle) bgToggle.checked = this.showBackground;

                this.bgIntensity = typeof settings.bgIntensity === 'number' ? settings.bgIntensity : 1.0;
                const bgSlider = document.getElementById('opt-bg-intensity');
                if (bgSlider) bgSlider.value = this.bgIntensity * 100;

                if (bgSlider) bgSlider.value = this.bgIntensity * 100;

                // VOLUME
                this.musicVolume = typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.5;
                this.sfxVolume = typeof settings.sfxVolume === 'number' ? settings.sfxVolume : 0.5;

                const musicSlider = document.getElementById('opt-music-vol');
                if (musicSlider) musicSlider.value = this.musicVolume * 100;

                const sfxSlider = document.getElementById('opt-sfx-vol');
                if (sfxSlider) sfxSlider.value = this.sfxVolume * 100;

                this.updateVolumes();

                // Shake
                this.shakeEnabled = settings.shakeEnabled !== false;
                const shakeToggle = document.getElementById('opt-shake-toggle');
                if (shakeToggle) shakeToggle.checked = this.shakeEnabled;

                // Drop Order
                this.dropOrder = settings.dropOrder || 'random';
                const dropSelect = document.getElementById('opt-drop-order');
                if (dropSelect) dropSelect.value = this.dropOrder;

                // Enemies
                if (settings.enabledEnemies) {
                    this.enabledEnemies = settings.enabledEnemies;
                    // Apply to UI
                    for (const [key, val] of Object.entries(this.enabledEnemies)) {
                        const el = document.getElementById(`opt-enemy-${key}`);
                        if (el) el.checked = val;
                    }
                }

            } catch (e) {
                console.error("Error loading settings", e);
            }
        }
    }

    saveSettings() {
        const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : true; };
        const getVal = (id) => { const el = document.getElementById(id); return el ? parseInt(el.value) : 50; };

        const settings = {
            crtEnabled: getCheck('opt-crt-toggle'),
            crtIntensity: getVal('opt-crt-intensity'),
            bgEnabled: getCheck('opt-bg-toggle'),
            bgIntensity: this.bgIntensity,
            shakeEnabled: getCheck('opt-shake-toggle'),
            dropOrder: this.dropOrder,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            enabledEnemies: this.enabledEnemies
        };
        localStorage.setItem('retroStackSettings', JSON.stringify(settings));
    }

    updateVolumes() {
        if (this.introAudio) this.introAudio.volume = this.musicVolume;
        if (this.menuAudio) this.menuAudio.volume = this.musicVolume;
        if (this.gameplayAudio) this.gameplayAudio.volume = this.musicVolume;
    }

    playSFX(id) {
        if (!this.sounds[id]) return null;
        try {
            // Clone node to allow overlapping sounds
            const sound = this.sounds[id].cloneNode();
            sound.volume = this.sfxVolume;
            sound.play().catch(e => {
                // Ignore errors
            });
            return sound;
        } catch (e) {
            console.warn(`SFX Error ${id}:`, e);
            return null;
        }
    }

    setGameControlsVisible(visible) {
        const controls = document.getElementById('controls');
        const pauseBtn = document.getElementById('btn-pause-header');
        if (visible) {
            if (controls) controls.style.display = 'flex';
            if (pauseBtn) pauseBtn.style.display = 'block';
        } else {
            console.log("Hiding controls"); // Debug
            if (controls) controls.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'none';
        }
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    pauseGame() {
        if (!this.isPlaying || this.isPaused || this.isGameOver) return;
        this.isPaused = true;
        this.isPaused = true;
        this.uiManager.showPauseScreen();
        this.inputManager.setScreen('pause');
        // Use stop() to halt Runner and Render completely
        if (this.physicsWorld) {
            this.physicsWorld.stop();
        }
        if (this.gameplayAudio) {
            this.gameplayAudio.pause();
        }
    }

    resumeGame() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.uiManager.hidePauseScreen();
        this.inputManager.setScreen('gameplay');
        // Use start() to resume Runner and Render
        if (this.physicsWorld) {
            this.physicsWorld.start();
        }
        if (this.gameplayAudio) {
            this.gameplayAudio.play().catch(e => console.warn("Music resume blocked:", e));
        }
        // Essential: Reset lastTime to prevent dt spike in Game loop
        this.lastTime = performance.now();
    }

    resetGame() {
        // Soft Reset - Skip Preloader
        // 1. Cancel Timer
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }

        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;

        // 2. Stop Physics
        if (this.physicsWorld) {
            this.physicsWorld.stop();
            this.physicsWorld.reset();
        }
        if (this.enemyManager) this.enemyManager.reset();

        this.score = 0;
        this.stackHeight = 0;
        this.droppedBlocksCount = 0;
        this.dropTimer = this.dropTimerMax;
        this.dropCooldown = 0;
        this.bombTimer = 0;
        this.gameTime = 0;
        this.scrollBoost = 0;
        this.heldBlockRotation = 0;

        this.uiManager.updateScore(0);
        this.uiManager.updateHeight("0m | 0 pud.");
        this.uiManager.updateTimer(0, this.dropTimerMax);
        this.uiManager.updateGameTime(0);
        this.uiManager.hidePauseScreen();
        this.uiManager.hideGameOver();
        this.uiManager.showStartScreen();
        this.inputManager.setScreen('start');
        this.playMenuMusic();

        this.setGameControlsVisible(false);
        this.toggleGameHeader(false);
        this.currentFallingBlock = null;
        this.currentBomb = null;
        this.particles = [];

        if (this.dropOrder === 'asc') this.chronoIndex = -1;
        if (this.dropOrder === 'desc') this.chronoIndex = this.consoleTypes.length;

        this.randomizeNextBlock();

        this.loopId = requestAnimationFrame(this.loop);
    }

    startLoading() {
        let loadedCount = 0;
        const consoles = this.assetManifest;
        const chars = this.characterManifest;
        // Total = consoles + chars + SFX + 1 (Intro Music)
        const total = consoles.length + chars.length + this.sfxManifest.length + 1;

        const loadingBar = document.getElementById('loading-bar-fill');
        const loadingText = document.getElementById('loading-text');
        const loadingScreen = document.getElementById('loading-screen');

        const onItemLoaded = () => {
            loadedCount++;
            const percent = Math.floor((loadedCount / total) * 100);
            if (loadingBar) loadingBar.style.width = `${percent}%`;
            if (loadingText) loadingText.innerText = `${percent}%`;

            if (loadedCount >= total) {
                // Wait a bit, then Start Transition
                setTimeout(() => {
                    // 1. Show Intro Screen (Solid) BEHIND Loading Screen
                    this.onLoadingComplete();

                    // 2. Fade Out Loading Screen
                    if (loadingScreen) {
                        loadingScreen.style.pointerEvents = 'none'; // Prevent blocking during fade
                        loadingScreen.classList.add('fade-out');

                        // 3. Remove Loading Screen after animation (1s)
                        setTimeout(() => {
                            loadingScreen.classList.remove('active'); // CRITICAL: overrides !important
                            loadingScreen.style.display = 'none';
                            loadingScreen.style.pointerEvents = 'auto'; // Reset
                        }, 1000);
                    }
                }, 500);
            }
        };

        // LOAD AUDIO (Intro)
        // We already created this.introAudio in constructor.
        // We just need to wait for it to be playable.
        if (this.introAudio) {
            this.introAudio.addEventListener('canplaythrough', onItemLoaded, { once: true });
            this.introAudio.addEventListener('error', (e) => {
                console.warn("Intro Audio failed to load", e);
                onItemLoaded(); // Proceed anyway
            });
            this.introAudio.load(); // Force load
        } else {
            onItemLoaded(); // Skip if missing
        }

        // LOAD SFX
        this.sfxManifest.forEach(filename => {
            const id = filename.replace('.mp3', '');
            const audio = new Audio(`assets/sfx/${filename}`);
            audio.addEventListener('canplaythrough', () => {
                this.sounds[id] = audio;
                onItemLoaded();
            }, { once: true });
            audio.addEventListener('error', () => {
                console.warn(`Missing SFX: ${filename}`);
                onItemLoaded(); // Graceful degrade
            });
            // Force load
            audio.load();
        });

        // LOAD CONSOLES
        consoles.forEach(filename => {
            const img = new Image();
            img.src = `assets/${filename}`;
            let name = filename.replace('.png', '').replace(/_/g, ' ').toUpperCase();
            if (name.includes(' PSP')) name = name.replace(' PSP', '');

            img.onload = () => {
                // ... Console Logic ...
                // Re-implementing logic from original code:
                const isHandheld = this.checkIfHandheld(filename);
                const baseWidth = isHandheld ? 75 : 90;
                const ratio = img.height / img.width;
                const finalHeight = baseWidth * ratio;

                this.consoleTypes.push({
                    name: name,
                    w: baseWidth,
                    h: finalHeight,
                    color: '#666',
                    texture: `assets/${filename}`
                });

                // Year Logic
                const rawId = filename.replace('.png', '');
                const data = CONSOLE_DATA.find(d => d.id === rawId);
                if (data) {
                    this.consoleTypes[this.consoleTypes.length - 1].year = data.year;
                    this.consoleTypes[this.consoleTypes.length - 1].realName = data.name;
                } else {
                    this.consoleTypes[this.consoleTypes.length - 1].year = 9999;
                }

                this.textures[name] = img;
                onItemLoaded();
            };
            img.onerror = () => { console.error(`Failed to load ${filename}`); onItemLoaded(); };
        });

        // LOAD CHARACTERS
        chars.forEach(filename => {
            const img = new Image();
            img.src = `assets/characters/${filename}`;
            // Extract ID: 'zagrajnik-sprite.png' -> 'zagrajnik'
            const id = filename.replace('-sprite.png', '');

            img.onload = () => {
                this.characterTextures[id] = img;
                onItemLoaded();
            };
            img.onerror = () => { console.error(`Failed to load ${filename}`); onItemLoaded(); };
        });

    }

    checkIfHandheld(filename) {
        const handhelds = [
            "gameboy", "ds", "3ds", "psp", "vita", "nomad", "gage", "gizmondo",
            "switch", "deck", "pocket", "lynx", "elektronika"
        ];
        // Special case: "switch" is hybrid, but visually wide/small? Treat as handheld size?
        // Switch dock is fat. Switch unit is thin.
        // Let's stick to list.
        return handhelds.some(k => filename.toLowerCase().includes(k));
    }

    onLoadingComplete() {
        // SORT Console Types based on initial Settings
        this.sortConsoles();

        // SHOW INTRO
        this.uiManager.showIntro();
        this.playIntroMusic();

        this.inputManager.setScreen('intro'); // Set Input Context to Intro

        this.randomizeNextBlock();

        // Setup Intro Skip Interaction
        // Define cleanup first so skipIntro can use it
        this._introCleanup = () => {
            document.removeEventListener('keydown', this._handleIntroKey);
            document.removeEventListener('click', this._handleIntroClick);
            document.removeEventListener('touchstart', this._handleIntroClick);
        };

        this._handleIntroKey = (e) => this.skipIntro();
        this._handleIntroClick = () => this.skipIntro();

        // Add listeners
        setTimeout(() => {
            document.addEventListener('keydown', this._handleIntroKey);
            document.addEventListener('click', this._handleIntroClick);
            document.addEventListener('touchstart', this._handleIntroClick, { passive: true });
        }, 500);
    }

    skipIntro() {
        if (this.introSkipped) return;
        this.introSkipped = true;

        this.stopIntroMusic();
        this.uiManager.hideIntro();
        this.uiManager.showStartScreen();
        this.playMenuMusic();

        this.inputManager.setScreen('start'); // Switch Input Context to Start
        this.inputManager.stickCooldown = 0.5; // Add cooldown to prevent accidental clicks

        // Cleanup listeners
        if (this._introCleanup) this._introCleanup();
    }

    playIntroMusic() {
        if (this.introAudio) {
            this.introAudio.currentTime = 0;
            const playPromise = this.introAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Intro Audio Playback Failed:", error);
                    // If blocked by policy, we could show a "Unmute" button, 
                    // but for this task just log it to be sure.
                });
            }
        }
    }

    stopIntroMusic() {
        if (this.introAudio) {
            this.introAudio.pause();
            this.introAudio.currentTime = 0;
        }
    }

    // =========================================
    // MUSIC SYSTEM
    // =========================================

    playMenuMusic() {
        this.stopGameplayMusic();

        if (!this.menuAudio) {
            this.menuAudio = new Audio(`assets/music/${GameConfig.Music.menuTrack}`);
            this.menuAudio.loop = true;
        }

        this.menuAudio.volume = this.musicVolume;
        this.menuAudio.currentTime = 0;
        this.menuAudio.play().catch(e => console.warn("Menu Music blocked:", e));
    }

    stopMenuMusic() {
        if (this.menuAudio) {
            this.menuAudio.pause();
            this.menuAudio.currentTime = 0;
        }
    }

    playGameplayMusic() {
        this.stopMenuMusic();

        // Init shuffle list if needed
        if (!this.gameplayPlaylist || this.gameplayPlaylist.length === 0) {
            this.shuffleGameplayTracks();
        }

        const nextTrack = this.gameplayPlaylist.pop();
        if (!nextTrack) return; // Should not happen

        console.log("Playing Track:", nextTrack);

        this.gameplayAudio = new Audio(`assets/music/${nextTrack}`);
        this.gameplayAudio.volume = this.musicVolume;

        // When ended, play next
        this.gameplayAudio.addEventListener('ended', () => {
            this.playGameplayMusic();
        });

        this.gameplayAudio.play().catch(e => console.warn("Gameplay Music blocked:", e));
    }

    stopGameplayMusic() {
        if (this.gameplayAudio) {
            this.gameplayAudio.pause();
            this.gameplayAudio = null; // Dispose to re-create next time
        }
    }

    shuffleGameplayTracks() {
        // Clone config array
        const tracks = [...GameConfig.Music.gameplayTracks];
        // Fisher-Yates Shuffle
        for (let i = tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }
        this.gameplayPlaylist = tracks;
        console.log("Shuffled Playlist:", this.gameplayPlaylist);
    }

    // Removed old loadTextures() as it is now integrated
    // Removed duplicate consoleTypes array definition


    triggersGameOver() {
        // Calculate stats BEFORE clearing state
        const stats = this.calculateStats();

        if (!this.isGameOver) {
            this.playSFX('game_over');
        }

        this.isGameOver = true;
        this.inputManager.setScreen('gameover');
        this.currentFallingBlock = null;

        this.uiManager.showGameOver(this.score, `${stats.meters}m`, stats.count, this.gameTime, this.bestStackHeight);
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.inputManager.setScreen('gameplay'); // Set Input Context
        this.uiManager.hideStartScreen();
        this.uiManager.hideGameOver(); // Ensure hidden if restarting from Game Over
        this.physicsWorld.start();
        this.lastTime = performance.now();
        this.setGameControlsVisible(true);
        this.toggleGameHeader(true); // SHOW HUD

        // Start Music
        this.playGameplayMusic();
    }

    toggleGameHeader(visible) {
        const header = document.getElementById('game-header');
        if (header) {
            if (visible) header.classList.remove('hidden');
            else header.classList.add('hidden');
        }
    }



    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.isPlaying && !this.isPaused && !this.isGameOver) {
            this.inputManager.activeScreen = 'gameplay';
            this.update(dt);
        }

        // Always update input (for menus too)
        this.inputManager.update(dt);

        this.loopId = requestAnimationFrame(this.loop);
    }

    update(dt) {
        if (dt > 0.1) return;

        this.player.speedMultiplier = 1.0;
        this.timerMultiplier = 1.0;
        this.player.chaosMode = false;
        this.resizeChaos = false;
        this.swapOnDropMode = false;
        this.swapOnDropMode = false;
        this.chaosDropMode = false;
        this.lipskiMode = false;
        this.polowianiukMode = false;
        this.uvMode = false;
        this.kosinskiMode = false; // Reset Frame
        this.heldBlockRotation = 0; // Reset rotation frame default (overridden if Polowianiuk active)

        // Update Enemies (ONLY after first drop)
        if (this.droppedBlocksCount > 0) {
            this.enemyManager.update(dt, this);
        }



        // POŁOWIANIUK LOGIC (Rotation)
        if (this.polowianiukMode) {
            this.heldBlockRotation = (this.gameTime * GameConfig.Enemies.polowianiukRotationSpeed) % (Math.PI * 2);
        }

        this.player.update(dt);

        this.dropTimer -= dt * this.timerMultiplier;
        this.uiManager.updateTimer(this.dropTimer, this.dropTimerMax);

        if (this.dropTimer <= 0) {
            this.dropConsole();
        }

        if (this.bombTimer > 0) {
            this.bombTimer -= dt * this.timerMultiplier;
        }

        if (this.dropCooldown > 0) {
            this.dropCooldown -= dt;
            if (this.dropCooldown <= 0) {
                // SPAWN EFFECT: Box reappears!
                const type = this.consoleTypes[this.nextConsoleIndex];
                const handY = this.player.y - GameConfig.Box.holdYOffset;
                // High speed (800) to clear the center quickly!
                this.spawnParticles(this.player.x, handY, '#ffffff', 10, 800);
                this.spawnParticles(this.player.x, handY, type.color, 5, 800);
            }
        }

        this.updateButtonVisuals();
        this.updateBlockVisuals();

        this.checkGameStatus();

        // Update Visual Effects
        // 1. Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.container.style.transform = `translate(${dx}px, ${dy}px)`;
            if (this.shakeTimer <= 0) this.container.style.transform = `none`;
        }

        // 2. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        // 3. Grid Animation (Synced with Camera Scroll ONLY)
        // this.bgGridOffset += dt * 20; // Removed constant scroll to sync with pressure
        // if (this.bgGridOffset > 40) this.bgGridOffset = 0;

        // Update Logic (Scoring, Penalties, States)
        this.updateConsoleLogic();

        if (this.droppedBlocksCount > 0 && !this.isGameOver) {
            this.gameTime += dt;
            this.uiManager.updateGameTime(this.gameTime);
        }

        // UV FADE LOGIC (Smooth Transition)
        const fadeSpeed = 0.5; // 0.5 means 2.0 seconds to go from 1.0 to 0.0 (1 / 0.5 = 2)
        if (this.uvMode) {
            // Fade OUT
            if (this.uvOpacity > 0) {
                this.uvOpacity -= fadeSpeed * dt;
                if (this.uvOpacity < 0) this.uvOpacity = 0;
            }
        } else {
            // Fade IN
            if (this.uvOpacity < 1.0) {
                this.uvOpacity += fadeSpeed * dt;
                if (this.uvOpacity > 1.0) this.uvOpacity = 1.0;
            }
        }

        // --- RISING PRESSURE (Slow Auto-Scroll) ---
        // Start scrolling slowly after first drop to pressure player.
        if (this.droppedBlocksCount > 0 && !this.isGameOver) {
            let pressureSpeed = GameConfig.Gameplay.cameraSpeed || 10; // Base: 10 Pixels per second

            // Add Boost (Decaying)
            // Apply Boost if active (Spam Punishment)
            if (this.pressureBoostTimer > 0) {
                pressureSpeed *= 4;
                this.pressureBoostTimer -= dt;
            }

            // SAFETY MARGIN CORRECTION (Smooth Cap)
            // If tower is too high (highestSettledY < safetyMargin), accelerate scroll smoothly
            if (this.highestSettledY !== undefined) {
                // Allow tower to fill 66% of screen (Margin 33% from top)
                const safetyMargin = this.height * 0.33;
                if (this.highestSettledY < safetyMargin) {
                    const diff = safetyMargin - this.highestSettledY;
                    // Proportional speed increase: e.g. 5x the distance in pixels/sec
                    pressureSpeed += diff * 5;
                }
            }

            // LIPSKI LOGIC (Camera Speed Up)
            if (this.lipskiMode) {
                pressureSpeed *= GameConfig.Enemies.lipskiScrollMultiplier;
            }

            const moveAmount = pressureSpeed * dt;
            this.lastFrameScroll = moveAmount; // Store for visual relative velocity check
            this.physicsWorld.moveWorldDown(moveAmount);

            // Also update grid visual offset
            this.bgGridOffset += moveAmount;
        } else {
            this.lastFrameScroll = 0;
        }
    }

    draw() {
        if (this.isGameOver) return;
        const ctx = this.physicsWorld.render.context;

        // Draw Particles BEHIND player? No, top layer usually better.
        // Let's stick to draw order.

        this.drawBackgroundElements(ctx);

        // Custom Block Rendering
        this.drawConsoles(ctx);

        // Draw Enemies (Sprites)
        if (this.enemyManager) this.enemyManager.draw(ctx);

        this.player.draw(ctx);

        // Draw Particles
        this.particles.forEach(p => p.draw(ctx));

        // Show Preview ONLY if Drop is ready (cooldown <= 0)
        if (this.dropCooldown <= 0) {
            const type = this.consoleTypes[this.nextConsoleIndex];

            // Fix: Safety check in case draw() is called before init or with invalid index
            if (!type) return;

            let w = type.w;
            let h = type.h;

            // BOBBING EFFECT (Gibanie)
            // Sync with player animation frame (0-35).
            // Cycles per full animation loop defined in Config (default 2).
            const bobPhase = GameConfig.Box.bobPhase || 0;
            const bobAmp = GameConfig.Box.bobAmplitude || 0;
            const bobFreq = GameConfig.Box.bobFrequency || 2;
            const bobOffset = Math.sin(((this.player.currentFrame / this.player.totalFrames) * Math.PI * 2 * bobFreq) + bobPhase) * bobAmp;

            const handY = this.player.y - GameConfig.Box.holdYOffset + bobOffset;

            if (this.resizeChaos) {
                ctx.strokeStyle = "#ff00ff";
                ctx.lineWidth = 2;
                ctx.strokeRect(this.player.x - w / 2, handY - h, w, h);
            }

            // NEON GLOW for Active Block
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = type.color;

            // Draw PREVIEW Block (Sprite or Rect)
            // handY already calculated with bobbing

            // Preview Rotation (Połowianiuk)
            const rot = this.heldBlockRotation || 0;
            ctx.translate(this.player.x, handY - h / 2); // Center of box
            ctx.rotate(rot);
            // Draw relative to center (0,0 is now center of box)
            // Top Left = -w/2, -h/2

            if (type.texture && this.textures[type.name] && this.textures[type.name].complete) {
                const img = this.textures[type.name];
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
            } else {
                ctx.fillStyle = type.color;
                ctx.globalAlpha = 1.0;
                ctx.fillRect(-w / 2, -h / 2, w, h);
                ctx.globalAlpha = 1.0;
            }

            ctx.restore(); // Reset Glow & Transforms
        }

        // Draw Status Effects (Top Left Indicators)
        this.drawStatusEffects(ctx);

        // Draw Custom Enemy Overlays (Timers, Ranges, etc.)
        this.drawEnemyOverlays(ctx);
    }

    drawStatusEffects(ctx) {
        let y = this.height - 150;
        const x = 20;
        ctx.textAlign = "left";

        const drawIndicator = (title, sub, color) => {
            ctx.font = "bold 24px 'VT323'";
            ctx.fillStyle = color;
            ctx.fillText(title, x, y);
            ctx.font = "20px 'VT323'";
            ctx.fillText(sub, x, y + 20);
            y -= 45;
        };

        if (this.player.speedMultiplier > 1.5) {
            drawIndicator("SPEED UP!", "(Szybki Michał)", "#ffaa00");
        }
        if (this.timerMultiplier > 1.5) {
            drawIndicator("TIME LEAK!", "(Uciekający czas)", "#aa00ff");
        }
        if (this.player.chaosMode) {
            drawIndicator("DIZZY!", "(Losowe zwroty)", "#00aaff");
        }

        // Check for Kosiński (Active Enemy)
        if (this.enemyManager && this.enemyManager.enemies.some(e => e.type === 'kosinski' && !e.markedForDeletion)) {
            drawIndicator("BOMB!", "(Zaraz wybuchnie!)", "#ffff00");
        }
        if (this.resizeChaos) {
            drawIndicator("GLITCH!", "(Zmiana wymiarów)", "#ff00aa");
        }
        if (this.swapOnDropMode) {
            drawIndicator("ZMYŁKA!", "(Odwrócony kierunek)", "#00ffaa");
        }
        if (this.chaosDropMode) {
            drawIndicator("FAŁSZYWKA!", "(Podmiana klocka)", "#ff0000");
        }
        if (this.lipskiMode) {
            drawIndicator("SPEED RUN!", "(Szybka kamera)", "#ff5500");
        }
        if (this.polowianiukMode) {
            drawIndicator("ROTOR!", "(Obrót  klocka)", "#ff00ff");
        }
        if (this.uvMode) {
            drawIndicator("GHOSTING!", "(Niewidzialność)", "#4400aa");
        }
        if (this.kosinskiMode) {
            // Moved to Overlay on Enemy Body
        }
    }

    drawBackgroundElements(ctx) {
        const groundBody = this.physicsWorld.ground;
        if (!groundBody) return;

        // Ground surface is top of ground rect. (Height 60, so -30 from center).
        const groundSurfaceY = groundBody.position.y - 30;

        // Grid Background
        if (this.showBackground) {
            const alpha = 0.1 * this.bgIntensity;
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            // Vertical lines
            for (let x = 0; x <= this.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }
            // Horizontal lines (Moving)
            for (let y = (this.bgGridOffset % 40) - 40; y <= this.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 1. Draw High Score Line relative to ground
        if (this.bestStackHeight > 0) {
            const lineY = groundSurfaceY - (this.bestStackHeight * 30);
            if (lineY > -50 && lineY < this.height + 50) {
                ctx.beginPath();
                ctx.setLineDash([10, 10]);
                ctx.moveTo(0, lineY);
                ctx.lineTo(this.width, lineY);
                ctx.strokeStyle = "#ffff00";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#ffff00";
                ctx.textAlign = "right"; // Fix Clipping
                ctx.fillText(`REKORD: ${this.bestStackHeight}m`, this.width - 10, lineY - 10);
                ctx.textAlign = "left"; // Reset
            }
        }

        // 2. Draw Height Markers
        const startH = Math.max(0, Math.floor((groundSurfaceY - this.height) / 30));
        const endH = Math.floor(groundSurfaceY / 30) + 2;

        for (let h = startH; h <= endH; h++) {
            if (h % 5 !== 0) continue;
            if (h === 0) continue;

            const markerY = groundSurfaceY - (h * 30);
            if (markerY > -20 && markerY < this.height + 20) {
                ctx.fillStyle = (h % 10 === 0) ? "#666" : "#444";
                ctx.fillRect(this.width - 20, markerY, 20, 2);

                if (h % 10 === 0) {
                    ctx.fillText(h, this.width - 25, markerY + 5);
                }
            }
        }
    }

    dropConsole() {
        if (!this.isPlaying) return;
        if (this.isGameOver) return;
        if (this.dropCooldown > 0) return; // Cooldown Lock

        this.playSFX('block_drop');

        let type = this.consoleTypes[this.nextConsoleIndex];
        let w = type.w;
        let h = type.h;

        if (this.resizeChaos) {
            w *= (0.5 + Math.random());
            h *= (0.5 + Math.random());
        }

        // Fałszywka Effect: Swap visual/physicals to random type!
        if (this.chaosDropMode) {
            const randomType = this.consoleTypes[Math.floor(Math.random() * this.consoleTypes.length)];
            // Use visual/size of the random type, IGNORING the "Next" preview
            type = randomType;
            w = type.w;
            h = type.h;
            // Recalculate resize if needed or apply resize to new type? 
            // Let's re-apply resize if active to be fair
            if (this.resizeChaos) {
                w *= (0.5 + Math.random());
                h *= (0.5 + Math.random());
            }
        }

        const bodyOptions = {
            restitution: 0.0,
            friction: 1.0,
            frictionStatic: Infinity,
            frictionAir: 0.1,
            density: 1.0,
            sleepThreshold: 60,
            label: 'Console',
            render: { fillStyle: type.color }
        };

        // Apply Sprite Texture if available
        let customImgObj = null;
        if (type.texture && this.textures[type.name] && this.textures[type.name].complete) {
            customImgObj = this.textures[type.name];
            bodyOptions.render.sprite = {
                texture: type.texture,
                xScale: w / customImgObj.width, // Scale to match physics body width
                yScale: h / customImgObj.height // Scale to match physics body height
            };
        }

        // Spawn at correct height so bottom touches hands.
        // Physics Body Y is CENTER.
        // HandY = player.y - holdYOffset.
        // CenterY = HandY - h/2.
        const spawnY = this.player.y - GameConfig.Box.holdYOffset - h / 2;
        const newConsole = Matter.Bodies.rectangle(this.player.x, spawnY, w, h, bodyOptions);

        // Apply Rotation (Połowianiuk)
        if (this.heldBlockRotation) {
            Matter.Body.setAngle(newConsole, this.heldBlockRotation);
        }

        if (customImgObj) {
            newConsole.customImage = customImgObj;
        }

        newConsole.isActiveFalling = true; // Start as Ghost

        newConsole.isActiveFalling = true; // Start as Ghost
        newConsole.hasSettledOnce = false; // New State Flag
        newConsole.hasMoved = false; // Prevent instant scoring at spawn

        this.currentFallingBlock = newConsole;
        this.physicsWorld.addBody(newConsole);

        // Zmyłka Effect: Flip direction on drop!
        // Zmyłka Effect: Flip direction on drop!
        // Rysław Randomness: 50% chance
        if (this.swapOnDropMode && Math.random() < 0.5) {
            this.player.direction *= -1;
        }

        // Apply Scroll Boost (Punishment for dropping)
        // Smooth temporary speed increase:
        // Only apply after the first drop (start pressuring from 2nd drop onwards)
        if (this.droppedBlocksCount > 0) {
            this.pressureBoostTimer = 0.5;
        }

        this.droppedBlocksCount++;

        this.dropCooldown = 0.5; // 500ms Cooldown
        this.dropTimer = this.dropTimerMax;
        this.randomizeNextBlock();
    }

    dropBomb() {
        if (this.isGameOver || this.currentBomb || this.bombTimer > 0) return;

        if (this.currentBomb || this.bombTimer > 0) return;

        // Cost Check
        if (this.score < 15) {
            this.uiManager.showFloatingText(this.player.x, this.player.y, "ZA MAŁO PKT!", "#ff0000");
            return;
        }

        // Apply Cost
        this.score -= 15;
        this.uiManager.updateScore(this.score);
        this.uiManager.showFloatingText(this.player.x, this.player.y, "-15 PKT (BOMBA)", "#ff9900");

        const bombW = GameConfig.Bomb.width;
        const bombH = GameConfig.Bomb.height;

        // Use Rectangle based on Config
        const bombBody = Matter.Bodies.rectangle(this.player.x, this.player.y + 30, bombW, bombH, {
            isSensor: false, // Solid!
            density: 2.0, // Heavy enough to push
            frictionAir: 0.02,
            label: 'Bomb',
            render: {
                visible: false, // Hide from default renderer (WE DRAW MANUALLY)
                fillStyle: '#ff0000',
                sprite: {
                    texture: 'assets/bomb.png',
                    xScale: 1,
                    // Matter.js scale doesn't matter if visible is false
                }
            }
        });

        Matter.Body.setVelocity(bombBody, { x: 0, y: 8 });

        this.currentBomb = bombBody;
        this.physicsWorld.addBody(bombBody);

        // Zmyłka Effect: Flip direction on drop!
        // Rysław Randomness: 50% chance
        if (this.swapOnDropMode && Math.random() < 0.5) {
            this.player.direction *= -1;
        }

        // Reset Cooldown
        this.bombTimer = 0.5; // Shared 500ms cooldown style
        this.currentBombSound = this.playSFX('bomb_drop');
    }

    randomizeNextBlock() {
        if (this.dropOrder === 'random') {
            this.nextConsoleIndex = Math.floor(Math.random() * this.consoleTypes.length);
        } else {
            // Sequential modes (asc, desc, alpha_asc, alpha_desc)
            // Array is already sorted by sortConsoles()
            this.chronoIndex++;
            if (this.chronoIndex >= this.consoleTypes.length) {
                this.chronoIndex = 0;
            }
            this.nextConsoleIndex = this.chronoIndex;
        }

        // Safety fallback
        if (this.nextConsoleIndex < 0 || this.nextConsoleIndex >= this.consoleTypes.length) {
            this.nextConsoleIndex = 0;
        }

        this.uiManager.updateNextConsole(this.consoleTypes[this.nextConsoleIndex].name);
    }

    sortConsoles() {
        if (this.dropOrder === 'random') return; // Order doesn't matter for random, but good to keep clean

        this.consoleTypes.sort((a, b) => {
            switch (this.dropOrder) {
                case 'asc': // Chrono Asc
                    return (a.year || 9999) - (b.year || 9999);
                case 'desc': // Chrono Desc
                    return (b.year || 9999) - (a.year || 9999);
                case 'alpha_asc': // A->Z
                    return a.name.localeCompare(b.name);
                case 'alpha_desc': // Z->A
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });

        // Reset index so we start from beginning of new sort
        // We set to -1 so the next call to randomizeNextBlock (which does index++) starts at 0
        this.chronoIndex = -1;
    }

    runBiosSequence() {
        const container = document.getElementById('boot-text-container');
        if (!container) return;

        // Clear container but keep cursor
        container.innerHTML = '<div class="cursor-blink">_</div>';

        // Dynamic Date/Time
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const time = now.toLocaleTimeString('en-US', { hour12: false });

        const lines = [
            `PISARION 3000 (C) ${now.getFullYear()}`,
            `BIOS DATE ${dd}/${mm}/${yy} ${time} VER 3.11`,
            "CPU: 8-BIT NEURAL ENGINE @ 33MHz",
            "RAM: 64KB OK",
            "VRAM: INTELLIGENT TEXTURE CACHE OK",
            "SOUND: SOUNDBLASTER Z COMPATIBLE OK",
            "",
            "DETECTED DRIVES:",
            " A: RETRO STACK SYSTEM DISK",
            " B: ENEMY DATA (CORRUPTED)",
            "",
            "> BOOTING PISAROS...",
            "> SYSTEM HALTED.",
            "> PRESS ANY BUTTON TO INITIALIZE..."
        ];

        let lineIndex = 0;
        let charIndex = 0;
        const typeSpeed = 13; // ms per char (Speed increased by ~50%)

        const typeChar = () => {
            if (lineIndex >= lines.length) return;

            const currentLine = lines[lineIndex];

            // Get the current P element or create one
            let p = container.querySelectorAll('p')[lineIndex];
            if (!p) {
                p = document.createElement('p');
                container.insertBefore(p, container.lastElementChild); // Insert before cursor
            }

            if (charIndex < currentLine.length) {
                p.textContent += currentLine.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typeSpeed);
            } else {
                // Line finished
                lineIndex++;
                charIndex = 0;
                setTimeout(typeChar, 100); // Pause between lines
            }
        };

        typeChar();
    }

    calculateStats() {
        const bodies = this.physicsWorld.getAllBodies();
        let highestSettledY = this.height * 2;
        // Use cumulative count (Total Settled) instead of live count
        // to prevent count dropping when deep blocks are culled.
        let count = this.stackHeight;

        for (let b of bodies) {
            if (b.label === 'Console' && b !== this.currentFallingBlock) {
                // Check if Settled (low speed) or Sleeping
                // 0.2 is a safe threshold (blocks move faster when falling)
                if (b.speed < 0.2) {
                    if (b.bounds.min.y < highestSettledY) highestSettledY = b.bounds.min.y;
                    // count is tracked via this.stackHeight in updateConsoleLogic
                }
            }
        }

        const currentGroundY = this.physicsWorld.ground ? this.physicsWorld.ground.position.y : this.height;
        const effectiveTopY = highestSettledY < this.height * 2 ? highestSettledY : (currentGroundY - 30);
        const pixelHeight = Math.max(0, (currentGroundY - 30) - effectiveTopY);
        const meters = Math.floor(pixelHeight / 30);

        return { meters, count, highestSettledY };
    }

    updateConsoleLogic() {
        const bodies = this.physicsWorld.getAllBodies();
        // Rules:
        // 1. Penalty Death Line: STRIKER enforcement.
        // Previously +60 was too lenient (~2m slack).
        // If box center is +10 below height (and box is usually 20-40px high), it's barely off screen.
        // Let's make it tighter: this.height + 10.
        const deathLine = this.height + 10;
        const deepDeathLine = this.height + 600;

        for (let b of bodies) {
            if (b.label !== 'Console') continue;

            // Determine State
            const isSettled = b.isStatic || b.isSleeping || (b.speed < 0.1 && b.angularSpeed < 0.1);
            // Visibility (approximate)
            const isVisible = b.bounds.min.y < this.height;

            // Initialization Check
            if (typeof b.hasSettledOnce === 'undefined') {
                b.hasSettledOnce = false;
                b.hasMoved = false;
            }

            // Motion Check (Prevent scoring before fall)
            if (b.speed > 0.5) b.hasMoved = true;

            // RULE 1: SCORING (First Settle)
            // MUST have moved at least once (to avoid spawning-score)
            if (isSettled && !b.hasSettledOnce && b.hasMoved) {
                b.hasSettledOnce = true;
                this.score += 20;
                this.stackHeight++; // "Ilość pudełek"
                this.uiManager.updateScore(this.score);
                this.uiManager.showFloatingText(b.position.x, b.position.y - 20, "+20", "#00ff00");
                this.playSFX('score_gain');

                // Effects
                this.triggerShake(5, 0.1);
                this.spawnParticles(b.position.x, b.position.y + 15, '#fff', 10);

                // Release falling ref if specific match
                if (b === this.currentFallingBlock) this.currentFallingBlock = null;
            }

            // --- USER RULES IMPLEMENTATION ---

            // RULE 1: Never settled & Off-screen (DeathLine) & Not Visible -> REMOVE & PENALTY
            if (!b.hasSettledOnce && !isVisible && b.position.y > deathLine) {
                this.score -= 20;
                this.uiManager.updateScore(this.score);
                // Fix: Clamp Y to be visible above bottom
                const safeY = this.container.clientHeight - 80;
                this.uiManager.showFloatingText(b.position.x, safeY, "-20 (BĘC!)", "#ff0000");
                this.playSFX('score_loss');
                if (b === this.currentFallingBlock) this.currentFallingBlock = null;
                this.physicsWorld.removeBody(b);
                continue;
            }

            // RULE 2: Settled Once & Static & Off-screen -> KEEP (Optimization Buffer)
            // But remove if VERY deep (DeepDeathLine)
            if (b.hasSettledOnce && (b.isStatic || b.isSleeping) && !isVisible) {
                if (b.position.y > deepDeathLine) {
                    this.physicsWorld.removeBody(b);
                    continue;
                }
                // Implicit else: Keep it as foundation
            }

            // RULE 3: Settled Once & NOT Static (Woke up) & Off-screen
            // "nic z nim nie rób, chyba że spadnie poniżej 20m"
            if (b.hasSettledOnce && !b.isStatic && !b.isSleeping && !isVisible) {
                // If falling fast, it's a loss (Knock off)
                // We add a speed check to distinguish "wobble" from "fall"
                if (b.speed > 2.0 && b.position.y > deathLine) {
                    this.score -= 20;
                    this.stackHeight--;
                    this.uiManager.updateScore(this.score);
                    const safeY = this.container.clientHeight - 80;
                    this.uiManager.showFloatingText(b.position.x, safeY, "-20 (STRATA)", "#ff0000");
                    this.playSFX('score_loss');
                    this.physicsWorld.removeBody(b);
                    continue;
                }

                // If just drifting deep
                if (b.position.y > deepDeathLine) {
                    this.physicsWorld.removeBody(b);
                    continue;
                }
            }

            // RULE 4: Settled Once & Off-screen -> FREEZE FOREVER
            // "nie można mu już odblokować fizyki"
            // If it's settled once, and off screen, force it to be static.
            // This overlaps with Rule 2, but ensures Rule 3 turns into Rule 2 if it slows down or we force it.
            if (b.hasSettledOnce && !isVisible) {
                if (!b.isStatic) Matter.Body.setStatic(b, true);
            }
        }
    }

    checkGameStatus() {
        // Simplified status check
        const bodies = this.physicsWorld.getAllBodies();
        let hasVisibleBlocks = false;
        let highestPointY = this.height * 2;
        let settledCount = 0;

        // Just gathering High Point logic
        for (let body of bodies) {
            if (body.label === 'Console') {
                if (body.bounds.min.y < this.height) hasVisibleBlocks = true;
                if (body.position.y < highestPointY) highestPointY = body.position.y;
                if (body.hasSettledOnce) settledCount++;
            }
        }

        // Use unified stats for HUD and Logic
        const stats = this.calculateStats();
        this.uiManager.updateHeight(`${stats.meters}m | ${stats.count} pud.`);

        // Update High Score LIVE
        if (stats.meters > this.bestStackHeight) {
            this.bestStackHeight = stats.meters;
            localStorage.setItem('retroStackBestHeight', this.bestStackHeight.toString());
        }

        // --- 3. AUTO-SCROLL / CEILING CAP ---
        this.highestSettledY = stats.highestSettledY;

        // --- GAME OVER CONDITIONS ---
        // 1. Classic: No visible blocks after start
        if (this.droppedBlocksCount > 0 && !hasVisibleBlocks) {
            this.triggersGameOver();
            return;
        }

        // 2. Strict Tower Loss: if previously we had a stack, but now visible stack is effectively 0
        // (meaning all settled blocks fell below screen)
        // REVERTED STRICT "highestSettledY" CHECK because it triggers on wobble.
        // Instead, we rely on "hasVisibleBlocks". 
        // If stackHeight > 0 (we have blocks in memory) BUT hasVisibleBlocks is false...
        // imply tower is lost below screen.
        if (this.stackHeight > 0 && !hasVisibleBlocks && this.droppedBlocksCount > 1) {
            // Only trigger if we are sure?
            // If we have a falling block (currentFallingBlock), we are NOT dead yet.
            if (!this.currentFallingBlock) {
                this.triggersGameOver();
                return;
            }
        }

        else if (this.isGameOver) {
            // If already game over (triggered externally?), use consistent stats
            this.uiManager.showGameOver(this.score, `${stats.meters}m`, stats.count, this.gameTime, this.bestStackHeight);
            return;
        }

        this.freezeStack();
    }

    freezeStack() {
        // Prevent cascade: Find all Conosle bodies
        const bodies = this.physicsWorld.getAllBodies().filter(b => b.label === 'Console' && !b.isStatic);
        if (bodies.length < 5) return;

        bodies.sort((a, b) => a.position.y - b.position.y);

        const dynamicCount = 3;
        for (let i = dynamicCount; i < bodies.length; i++) {
            const body = bodies[i];
            if (body.speed < 0.5) {
                Matter.Body.setStatic(body, true);
            }
        }
    }

    triggerShake(intensity, duration) {
        if (!this.shakeEnabled) return;
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    spawnParticles(x, y, color, count, speed = 400) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, speed));
        }
    }

    updateBlockVisuals() {
        // Custom Rendering Setup
        // We HIDE all console bodies from the default Matter.js renderer
        // so we can draw them manually with full control over Opacity.

        const bodies = this.physicsWorld.getAllBodies();
        for (let body of bodies) {
            if (body.label === 'Console') {
                body.render.visible = false; // Hide from default renderer
            }
        }
    }

    drawEnemyOverlays(ctx) {
        if (!this.enemyManager) return;

        ctx.textAlign = "center";

        this.enemyManager.enemies.forEach(enemy => {
            if (enemy.markedForDeletion) return;

            let label = enemy.type.toUpperCase();
            let color = "#ffffff";
            let bgColor = "rgba(0,0,0,0.5)";

            // Special Handling for Kosiński
            if (enemy.type === 'kosinski') {
                const pos = enemy.body.position;

                // 1. Draw Range Circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, GameConfig.Enemies.kosinskiExplosionRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 0, 0.3)`; // Yellow transparent
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.stroke();
                ctx.restore();

                // 2. Format Label
                const timeStr = enemy.bombTimer ? enemy.bombTimer.toFixed(1) + "s" : "0.0s";
                label = `KOSIŃSKI (${timeStr})`;
                color = "#ffff00"; // Yellow
                bgColor = "rgba(0, 0, 0, 0.7)";
            }

            // Draw Label
            ctx.save();
            ctx.translate(enemy.body.position.x, enemy.body.position.y);
            ctx.font = "bold 12px 'Press Start 2P', monospace"; // Pixel font
            ctx.textAlign = "center";

            // Text Color & Stroke (No Background)
            ctx.fillStyle = color;
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;

            // Position above sprite (sprite is ~140px high, body is 40/80px)
            // Center is 0,0. Top of sprite is approx -70. Label at -85.
            const labelY = GameConfig.Enemies.labelYOffset || -85;

            ctx.strokeText(label, 0, labelY);
            ctx.fillText(label, 0, labelY);
            ctx.restore();
            ctx.restore();
        });
    }

    drawConsoles(ctx) {
        const bodies = this.physicsWorld.getAllBodies();
        for (let body of bodies) {
            if (body.label === 'Console') {
                // Determine Visual State
                let alpha = 1.0; // Default Solid

                // 1. Active Dropping
                if (body === this.currentFallingBlock && !body.isSleeping) {
                    alpha = 0.6; // Ghost
                }
                // 2. Fast Debris (High sensitivity: > 0.1)
                else if (!body.isStatic && body.speed > 0.1) {
                    alpha = 0.6; // Ghost
                }

                // 3. UV (Invisibility) - Only for Static/Settled blocks
                const isSettled = body.isStatic || (body.hasSettledOnce && body.speed < 0.2);
                if (isSettled && body !== this.currentFallingBlock) {
                    // Multiply alpha by global UV Opacity
                    // If UV mode is OFF, uvOpacity is 1.0 (No change)
                    // If UV mode is ON, uvOpacity fades to 0.0
                    alpha *= this.uvOpacity;
                }

                // Render Setup
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.globalAlpha = alpha;

                // Draw Texture or Rect
                // Check if sprite info exists (we stored it in dropConsole)
                // Note: body.render.sprite might be used by Matter, but we can read it too.
                // Or fallback to checking textures map if we have type info... 
                // Matter bodies usually have `render.sprite.texture` path string if set.
                // But we have actual Image objects in `this.textures`.
                // Let's rely on what we set in `dropConsole`: bodyOptions.render.sprite.texture (string path)

                if (body.render.sprite && body.render.sprite.texture) {
                    // Try to use attached image object, or find it
                    let imgToDraw = body.customImage;

                    if (!imgToDraw) {
                        // Fallback: This might happen if block was created before this update (rare, given reload)
                        // Or if we didn't attach it correctly.
                        // Try to find image by matching src manually.
                        // Optimization: Cache it on the body once found?
                        const src = body.render.sprite.texture;
                        // Search values of this.textures
                        for (const key in this.textures) {
                            const cached = this.textures[key];
                            // loose match because src might be relative?
                            // this.textures is keyed by NAME (e.g. NES).
                            // we need to access the image.src.
                            // But image.src is full URL usually.
                            if (cached.src.includes(src)) {
                                imgToDraw = cached;
                                body.customImage = cached; // Attach for future
                                break;
                            }
                        }
                    }

                    if (imgToDraw) {
                        const sprite = body.render.sprite;
                        // Use sprite scale to determine draw size
                        // Original Image Size
                        const imgW = imgToDraw.width;
                        const imgH = imgToDraw.height;

                        // Final Draw Size
                        const drawW = imgW * sprite.xScale;
                        const drawH = imgH * sprite.yScale;

                        ctx.drawImage(imgToDraw, -drawW / 2, -drawH / 2, drawW, drawH);

                    } else {
                        // Still failed? Draw placeholder
                        ctx.fillStyle = body.render.fillStyle;
                        ctx.fillRect(-10, -10, 20, 20); // Fallback debug
                    }
                } else {
                    // Primitive
                    ctx.fillStyle = body.render.fillStyle;

                    // Draw using vertices for accuracy
                    ctx.beginPath();
                    body.vertices.forEach((v, i) => {
                        // Transform vertices to local space (relative to body.position, which is at 0,0 context now)
                        // Wait, Matter.Block vertices are World Coords.
                        // But we applied ctx.translate(body.position.x, body.position.y).
                        // So we should draw (v.x - pos.x, v.y - pos.y).
                        if (i === 0) ctx.moveTo(v.x - body.position.x, v.y - body.position.y);
                        else ctx.lineTo(v.x - body.position.x, v.y - body.position.y);
                    });
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
            } else if (body.label === 'Bomb') {
                const w = GameConfig.Bomb.width;
                const h = GameConfig.Bomb.height;
                const pos = body.position;

                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(body.angle);

                // Lazy Load Bomb Texture logic
                if (!this.bombTexture) {
                    this.bombTexture = new Image();
                    this.bombTexture.src = 'assets/bomb.png';
                }

                if (this.bombTexture.complete && this.bombTexture.naturalWidth > 0) {
                    // Draw using NATURAL dimensions to avoid stretching
                    const nw = this.bombTexture.naturalWidth;
                    const nh = this.bombTexture.naturalHeight;
                    ctx.drawImage(this.bombTexture, -nw / 2, -nh / 2, nw, nh);
                } else {
                    // Fallback
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(-w / 2, -h / 2, w, h);
                }
                ctx.restore();
            }
        }
    }

    updateButtonVisuals() {
        // Helper to update linear gradient fill
        const updateBtn = (id, current, max, activeColor, inactiveColor) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // If current > 0, it's cooling down (filling UP)
            // When current == max (just used), progress is 0% filled (inactive)
            // When current == 0 (ready), progress is 100% filled (active)

            // BUT user wants: "slowly fill up like water"
            // So at Cooldown Start (max), it is EMPTY (0%).
            // At Cooldown End (0), it is FULL (100%).

            let percent = 0;
            if (max > 0) {
                percent = Math.max(0, Math.min(100, (1 - (current / max)) * 100));
            } else {
                percent = 100;
            }

            // Draw Gradient: activeColor up to percent, inactive above
            // CSS linear-gradient(to top, active p%, inactive p%)
            btn.style.background = `linear-gradient(to top, ${activeColor} ${percent}%, ${inactiveColor} ${percent}%)`;

            // Also visual state styling
            if (current > 0) {
                btn.style.borderColor = "#555";
                btn.style.color = "#888";
                btn.style.pointerEvents = "none"; // Block clicks for real safety
            } else {
                btn.style.borderColor = ""; // Reset to CSS default
                btn.style.color = "";
                btn.style.pointerEvents = "auto";
            }
        };

        // DROP BUTTON
        // this.dropCooldown (0.5 max)
        updateBtn('btn-drop', Math.max(0, this.dropCooldown), 0.5, '#333', '#111');
        // Wait, standard background is #333. Inactive should look darker?
        // Let's use: Active Part = #333 (Standard), Inactive Part = #111 (Empty).
        // Text is white.

        // BOMB BUTTON
        // this.bombTimer. Max is now 0.5s
        updateBtn('btn-bomb', Math.max(0, this.bombTimer), 0.5, '#442222', '#111');

        // Extra check for Bomb: Score cost
        const kBtnBomb = document.getElementById('btn-bomb');
        if (kBtnBomb) {
            if (this.score < 20) {
                // Dim it if not enough points, even if ready
                kBtnBomb.style.opacity = "0.3";
                kBtnBomb.style.borderColor = "#300";
            } else {
                kBtnBomb.style.opacity = "1.0";
            }
        }
    }

    handleCollisions(event) {
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            // Bomb Hit LOGIC
            if (bodyA.label === 'Bomb' || bodyB.label === 'Bomb') {
                const bombBody = bodyA.label === 'Bomb' ? bodyA : bodyB;
                const otherBody = bodyA.label === 'Bomb' ? bodyB : bodyA;

                if (otherBody.label === 'Enemy') {
                    if (otherBody.gameEnemy) otherBody.gameEnemy.markedForDeletion = true;

                    // Score & Feedback
                    this.score += 50;
                    this.uiManager.updateScore(this.score);
                    this.uiManager.showFloatingText(bombBody.position.x, bombBody.position.y, "+50", "#ffcc00");
                    this.playSFX('enemy_death'); // Add Death Sound

                    // Visuals & Sound
                    this.triggerShake(10, 0.3);
                    this.spawnParticles(bombBody.position.x, bombBody.position.y, '#ffaa00', 30);
                    this.playSFX('bomb_impact');
                    this.playSFX('bomb_explode');

                    // Remove Bomb
                    this.physicsWorld.removeBody(bombBody);
                    this.currentBomb = null;
                }
                else if (otherBody.label === 'Platform') {
                    this.triggerShake(5, 0.2);
                    this.spawnParticles(bombBody.position.x, bombBody.position.y, '#888', 10);
                    this.playSFX('bomb_impact');
                    this.playSFX('bomb_explode');

                    // Stop Drop Sound if playing
                    if (this.currentBombSound) {
                        this.currentBombSound.pause();
                        this.currentBombSound.currentTime = 0;
                        this.currentBombSound = null;
                    }

                    // Remove Bomb
                    this.physicsWorld.removeBody(bombBody);
                    this.currentBomb = null;
                }
                else if (otherBody.label === 'Ground' || otherBody.label === 'Console') {
                    // WAKE UP / PUSH Logic
                    if (otherBody.label === 'Console') {
                        // RADIAL BLAST LOGIC
                        const dx = otherBody.position.x - bombBody.position.x;
                        const dy = otherBody.position.y - bombBody.position.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1; // avoid div0
                        const forceMagnitude = GameConfig.Bomb.explosionForce || 2.0;

                        const blastForce = forceMagnitude;

                        Matter.Body.setStatic(otherBody, false);
                        Matter.Sleeping.set(otherBody, false);

                        // Push away from bomb center
                        const force = {
                            x: (dx / dist) * blastForce,
                            y: (dy / dist) * blastForce
                        };
                        Matter.Body.applyForce(otherBody, otherBody.position, force);
                    }

                    // Just explode/remove
                    this.physicsWorld.removeBody(bombBody);
                    this.currentBomb = null;
                    this.spawnParticles(bombBody.position.x, bombBody.position.y, '#555', 10);
                    this.playSFX('bomb_impact');
                    this.playSFX('bomb_explode');

                    // Stop Drop Sound if playing
                    if (this.currentBombSound) {
                        this.currentBombSound.pause();
                        this.currentBombSound.currentTime = 0;
                        this.currentBombSound = null;
                    }
                }
            }
        });
    }


    handleInput() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.isPaused) this.resumeGame();
                else this.pauseGame();
            }
            if (e.code === 'Space') {
                if (this.isGameOver) {
                    this.resetGame();
                    this.startGame();
                }
                else if (!this.isPaused) this.dropConsole();
            }
            if (e.code === 'KeyB') {
                if (!this.isPaused) this.dropBomb();
            }
        });

        const btnDrop = document.getElementById('btn-drop');
        const btnBomb = document.getElementById('btn-bomb');

        if (btnDrop) {
            btnDrop.addEventListener('touchstart', (e) => { e.preventDefault(); this.dropConsole(); });
            btnDrop.addEventListener('click', (e) => { this.dropConsole(); });
        }
        if (btnBomb) {
            btnBomb.addEventListener('touchstart', (e) => { e.preventDefault(); this.dropBomb(); });
            btnBomb.addEventListener('click', (e) => { this.dropBomb(); });
        }

        // UI SFX - Global Delegation
        document.body.addEventListener('mouseenter', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.classList.contains('menu-btn') || e.target.tagName === 'INPUT') {
                this.playSFX('ui_hover');
            }
        }, true);

        document.body.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.classList.contains('menu-btn')) {
                if (e.target.id.includes('back')) this.playSFX('ui_back');
                else this.playSFX('ui_click');
            }
        }, true);
    }
    setupOverlay() {
        // Create Pisarion Bezel
        // It should be centred over the game container.
        // Game container size? this.width, this.height.
        const overlay = document.createElement('img');
        overlay.src = 'assets/pisarion_frame.png';
        overlay.style.position = 'absolute';
        overlay.style.top = '50%';
        overlay.style.left = '50%';
        overlay.style.transform = 'translate(-50%, -50%)';
        // Scale overlay to cover the container?
        // Game container is usually set to size.
        // Let's make it slightly larger than canvas to act as a frame.
        overlay.style.width = '120%';
        overlay.style.height = '120%';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';

        // Ensure container is relative
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden'; // Clip if bezel is huge

        // Actually, if we use 120%, we might hide UI?
        // UI layer is separate? 
        // UiManager uses 'ui-layer' div. PhysicsWorld uses canvas.
        // We should append overlay to 'game-container'.
        this.container.appendChild(overlay);
    }
}

window.onload = () => {
    const game = new Game();
};
