export class InputManager {
    constructor(game) {
        this.game = game;
        this.activeScreen = null; // 'start', 'options', 'pause', 'gameover', 'gameplay'
        this.focusGroups = {};
        this.currentFocusIndex = 0;

        // Gamepad State
        this.gamepadIndex = null;
        this.buttons = { up: false, down: false, left: false, right: false, a: false, b: false, start: false };
        this.prevButtons = { ...this.buttons };

        // Deadzone for axes
        this.deadzone = 0.5;
        this.stickCooldown = 0;

        // Init Events
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
            this.gamepadIndex = e.gamepad.index;
            this.showToast("GAMEPAD CONNECTED");
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected from index %d: %s",
                e.gamepad.index, e.gamepad.id);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.showToast("GAMEPAD DISCONNECTED");
            }
        });

        // Keyboard Listeners (Menu Navigation Bridging)
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    registerScreen(screenId, elementIds) {
        this.focusGroups[screenId] = elementIds;
    }

    setScreen(screenId) {
        if (this.activeScreen === screenId) return;

        // Clear old focus
        this.clearFocus();

        this.activeScreen = screenId;
        this.currentFocusIndex = 0;

        // If switching to a menu, highlight first item
        if (screenId !== 'gameplay') {
            this.updateFocusVisuals();
        }

        console.log(`Input Context: ${screenId}`);
    }

    handleKeyboard(e) {
        // Only handle menu navigation if NOT in gameplay
        // Gameplay inputs are handled by Game.js directly (Space, B, Esc)
        // But we might want to bridge them here eventually.
        // For now, let's focus on MENU navigation using Arrows/Enter.

        if (this.activeScreen === 'gameplay') {
            // Passthrough or specific overrides could go here
            return;
        }

        const group = this.focusGroups[this.activeScreen];
        if (!group || group.length === 0) return;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.navigate(-1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.navigate(1);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.adjustSlider(-1);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.adjustSlider(1);
                break;
            case 'Enter':
            case 'Space':
            case 'NumpadEnter':
                this.triggerFocus();
                e.preventDefault(); // Prevent scrolling
                break;
            case 'Escape':
                // Back/Pause logic usually handled by Game.js, 
                // but we might want to trigger "Back" button if present?
                this.triggerBack();
                break;
        }
    }

    navigate(direction) {
        const group = this.focusGroups[this.activeScreen];
        if (!group) return;

        this.currentFocusIndex += direction;

        // Wrap around
        if (this.currentFocusIndex < 0) this.currentFocusIndex = group.length - 1;
        if (this.currentFocusIndex >= group.length) this.currentFocusIndex = 0;

        this.updateFocusVisuals();
        this.game.playSFX('ui_hover');
    }

    clearFocus() {
        // Remove .focused class from ALL registered elements
        Object.values(this.focusGroups).flat().forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('focused');
        });
    }

    updateFocusVisuals() {
        const group = this.focusGroups[this.activeScreen];
        if (!group) return;

        // Clean current group
        group.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('focused');
        });

        // Set new focus
        const targetId = group[this.currentFocusIndex];
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.add('focused');
            // Scroll into view if needed (for options list)
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    triggerFocus() {
        const group = this.focusGroups[this.activeScreen];
        if (!group) return;
        const targetId = group[this.currentFocusIndex];
        const target = document.getElementById(targetId);
        if (target) {
            // Emulate Click
            target.click();
            // Check if it's a checkbox to toggle it manually if click doesn't work? 
            // Usually click() works for checkboxes.
        }
    }

    adjustSlider(direction) {
        const group = this.focusGroups[this.activeScreen];
        if (!group) return;

        const targetId = group[this.currentFocusIndex];
        const target = document.getElementById(targetId);

        if (target && target.type === 'range') {
            const step = target.step ? parseFloat(target.step) : 5; // Default step 5 if not set
            const min = target.min ? parseFloat(target.min) : 0;
            const max = target.max ? parseFloat(target.max) : 100;

            let current = parseFloat(target.value);
            current += direction * step;

            // Clamp
            if (current < min) current = min;
            if (current > max) current = max;

            target.value = current;

            // Dispatch events to trigger listeners
            target.dispatchEvent(new Event('input'));
            target.dispatchEvent(new Event('change'));

            // Optional: distinct sound for slider?
            // this.game.playSFX('ui_hover'); 
        }
    }

    handleScroll(amount) {
        let container = null;
        if (this.activeScreen === 'options') {
            const screen = document.getElementById('options-screen');
            if (screen) container = screen.querySelector('.scroll-content');
        } else if (this.activeScreen === 'howto') {
            const screen = document.getElementById('how-to-play-screen');
            if (screen) container = screen.querySelector('.scroll-content');
        } else if (this.activeScreen === 'encyclopedia') {
            container = document.getElementById('encyclopedia-list');
        }

        if (container) {
            container.scrollTop += amount;
        }
    }

    triggerBack() {
        // Heuristic: Find a button ID containing 'back' or 'quit' in current group?
        // Or just hardcode logic based on screen.
        // For now, let Game.js handle Escape.
    }

    update(dt) {
        if (this.gamepadIndex === null) return;

        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        // Map Buttons (Standard Mapping)
        // 0: A
        // ...

        const b = gp.buttons;

        // Current State
        const curr = {
            a: b[0].pressed,
            b: b[1].pressed,
            x: b[2].pressed,
            y: b[3].pressed,
            start: b[9].pressed || b[8].pressed, // Start or Select
            up: b[12].pressed,
            down: b[13].pressed,
            left: b[14].pressed,
            right: b[15].pressed
        };

        // Axes (Stick)
        // 0: Left Stick X 
        // 1: Left Stick Y 
        // 2: Right Stick X
        // 3: Right Stick Y (Vertical Scroll)

        if (gp.axes[1] < -this.deadzone) curr.up = true;
        if (gp.axes[1] > this.deadzone) curr.down = true;
        if (gp.axes[0] < -this.deadzone) curr.left = true;
        if (gp.axes[0] > this.deadzone) curr.right = true;

        // RIGHT STICK SCROLLING
        if (Math.abs(gp.axes[3]) > this.deadzone) {
            // Analog Scroll
            const scrollSpeed = 500; // px per second
            const dir = gp.axes[3];
            // Apply deadzone clipping to dir if desired, or just use raw
            this.handleScroll(dir * scrollSpeed * dt);
        }

        // --- GAMEPLAY INPUT ---
        if (this.activeScreen === 'gameplay') {
            // A -> Drop
            if (curr.a && !this.prevButtons.a) {
                this.game.dropConsole();
            }
            // B -> Bomb
            if (curr.b && !this.prevButtons.b) {
                this.game.dropBomb();
            }
            // Start -> Pause
            if (curr.start && !this.prevButtons.start) {
                this.game.togglePause();
            }
            // Analog Move?
            // If stick is held, move player. 
            if (Math.abs(gp.axes[0]) > 0.2) {
                if (this.game.player) {
                    const speed = 600 * dt; // px per second
                    this.game.player.x += gp.axes[0] * speed;
                    // Clamp
                    if (this.game.player.x < 0) this.game.player.x = 0;
                    if (this.game.player.x > this.game.width) this.game.player.x = this.game.width;
                }
            }
        }

        // --- MENU INPUT ---
        else {
            // Special Case: BOOT
            if (this.activeScreen === 'boot') {
                if ((curr.a && !this.prevButtons.a) ||
                    (curr.start && !this.prevButtons.start) ||
                    (curr.b && !this.prevButtons.b)) {
                    this.game.skipBoot();
                }
                this.prevButtons = curr;
                return;
            }

            // Special Case: INTRO
            if (this.activeScreen === 'intro') {
                if ((curr.a && !this.prevButtons.a) ||
                    (curr.start && !this.prevButtons.start) ||
                    (curr.b && !this.prevButtons.b)) {
                    this.game.skipIntro();
                }
                this.prevButtons = curr;
                return;
            }

            if (this.stickCooldown > 0) {
                this.stickCooldown -= dt;
            } else {
                // NAVIGATION (Up/Down)
                if (curr.up || (gp.axes[1] < -this.deadzone)) {
                    if (!this.prevButtons.up) {
                        this.navigate(-1);
                        this.stickCooldown = 0.2;
                    }
                }
                if (curr.down || (gp.axes[1] > this.deadzone)) {
                    if (!this.prevButtons.down) {
                        this.navigate(1);
                        this.stickCooldown = 0.2;
                    }
                }

                // SLIDERS (Left/Right)
                if (curr.left || (gp.axes[0] < -this.deadzone)) {
                    // Continuous scroll for sliders could be nice, but let's stick to tap or throttle
                    this.adjustSlider(-1);
                    this.stickCooldown = 0.1; // Faster repeat for sliders
                }
                if (curr.right || (gp.axes[0] > this.deadzone)) {
                    this.adjustSlider(1);
                    this.stickCooldown = 0.1;
                }

                // A -> Confirm
                if (curr.a && !this.prevButtons.a) {
                    this.triggerFocus();
                }

                // Start/B -> Back equivalent?
                if ((curr.start && !this.prevButtons.start) || (curr.b && !this.prevButtons.b)) {
                    // Try to trigger Pause or Back Logic
                    // If in Options -> Back
                    if (this.activeScreen === 'options') {
                        document.getElementById('btn-options-back')?.click();
                    }
                    else if (this.activeScreen === 'pause') {
                        document.getElementById('btn-resume')?.click();
                    }
                    else if (this.activeScreen === 'howto') {
                        document.getElementById('btn-how-back')?.click();
                    }
                    else if (this.activeScreen === 'encyclopedia') {
                        document.getElementById('btn-enc-back')?.click();
                    }
                }
            }
        }

        this.prevButtons = curr;
    }

    showToast(msg) {
        // Reuse floating text or create a simple toast
        if (this.game.uiManager) {
            // Center screen message
            this.game.uiManager.showFloatingText(this.game.width / 2, this.game.height / 2, msg, "#ffffff");
        }
    }
}
