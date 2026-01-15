// UIManager.js
import { CONSOLE_DATA } from './ConsoleData.js';

export class UIManager {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.heightEl = document.getElementById('height'); // New
        this.nextNameEl = document.getElementById('next-name');
        this.timerBar = document.getElementById('timer-bar');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalHeightEl = document.getElementById('final-height'); // New

        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.optionsScreen = document.getElementById('options-screen');
        this.howToScreen = document.getElementById('how-to-play-screen');
        this.encyclopediaScreen = document.getElementById('encyclopedia-screen');
        this.introScreen = document.getElementById('intro-screen'); // Intro
        this.encyclopediaList = document.getElementById('encyclopedia-list');

        // Lightbox
        this.lightbox = document.getElementById('lightbox-overlay');
        this.lightboxImg = document.getElementById('lightbox-img');
        this.lightboxCaption = document.getElementById('lightbox-caption');

        if (this.lightbox) {
            this.lightbox.addEventListener('click', () => this.hideLightbox());
        }


    }

    showIntro() {
        if (this.introScreen) {
            this.introScreen.classList.remove('hidden');
            this.introScreen.style.pointerEvents = 'auto'; // Ensure interaction
            // NO fade-in class here. We want it solid immediate. 
            // The transition comes from Loading Screen fading out over it.
        }
    }

    hideIntro() {
        if (this.introScreen) {
            this.introScreen.style.pointerEvents = 'none'; // Prevent blocking immediately
            this.introScreen.classList.add('fade-out');

            setTimeout(() => {
                this.introScreen.classList.add('hidden');
                this.introScreen.classList.remove('fade-out');
                this.introScreen.classList.remove('fade-in');
                // Do NOT restore pointerEvents here usually, only when showing. 
                // But just in case:
                this.introScreen.style.pointerEvents = 'auto';
            }, 1000);
        }
    }

    showOptions() {
        this.optionsScreen.classList.remove('hidden');
    }

    hideOptions() {
        this.optionsScreen.classList.add('hidden');
    }

    updateHeight(text) {
        // text is now formatted string "150m | 12 blk"
        this.heightEl.innerText = text;
    }

    updateGameTime(seconds) {
        // Format MM:SS
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');

        // We need a specific element for TIME.
        // Assuming there's a HUD element 'time-display' or I append it to existing HUD?
        // Let's assume user wants it in HUD.
        // If element doesn't exist, Create it once?
        if (!this.timeEl) {
            this.timeEl = document.getElementById('time-display');
            if (!this.timeEl) {
                // Create dynamically if missing from HTML
                const hud = document.getElementById('game-header'); // CORRECTED TARGET
                if (hud) {
                    const d = document.createElement('div');
                    d.id = 'time-display';
                    // Style to fit in header (e.g. center or right)
                    d.className = 'timer-display'; // Use class for cleaner CSS if needed
                    d.style.position = 'absolute';
                    d.style.top = '50%';
                    d.style.left = '50%';
                    d.style.transform = 'translate(-50%, -50%)'; // Perfect center
                    d.style.color = '#fff';
                    d.style.fontSize = '28px'; // Visible
                    d.style.fontFamily = "'VT323', monospace";
                    d.style.textShadow = '2px 2px 0 #000';
                    d.style.zIndex = '100'; // Ensure visibility
                    hud.appendChild(d);
                    this.timeEl = d;
                }
            }
        }
        if (this.timeEl) this.timeEl.innerText = `${m}:${s}`;
    }

    updateScore(score) {
        this.scoreEl.innerText = Math.floor(score);
        this.scoreEl.style.color = score < 0 ? '#ff3333' : '#fff';
    }

    updateNextConsole(name) {
        this.nextNameEl.innerText = name;
    }

    updateTimer(current, max) {
        const percent = Math.max(0, (current / max) * 100);
        this.timerBar.style.width = percent + '%';
        this.timerBar.style.backgroundColor = percent < 30 ? '#ff0000' : '#ffcc00';
    }

    showGameOver(score, heightStr, blocks, timeSec, bestHeight = 0) {
        // Hide default partial stats if they exist (we will render full grid)
        if (this.finalScoreEl) this.finalScoreEl.parentElement.style.display = 'none';
        if (this.finalHeightEl) this.finalHeightEl.parentElement.style.display = 'none';

        // Create or Clear Stats Container
        let extraStats = document.getElementById('game-over-stats-container');
        if (!extraStats) {
            const container = document.getElementById('game-over-screen');
            extraStats = document.createElement('div');
            extraStats.id = 'game-over-stats-container';
            // Insert before buttons
            const retryBtn = document.getElementById('btn-retry');
            if (retryBtn) container.insertBefore(extraStats, retryBtn);
            else container.appendChild(extraStats);
        }

        // Format Time
        const m = Math.floor(timeSec / 60).toString().padStart(2, '0');
        const s = Math.floor(timeSec % 60).toString().padStart(2, '0');

        // Render MISSION REPORT
        extraStats.innerHTML = `
            <div class="mission-report">
                <div class="report-line">
                    <span class="report-label">WYNIK</span>
                    <span class="report-dots"></span>
                    <span class="report-value">${Math.floor(score)}</span>
                </div>
                <div class="report-line">
                    <span class="report-label">WYSOKOŚĆ</span>
                    <span class="report-dots"></span>
                    <span class="report-value">${heightStr}</span>
                </div>
                <div class="report-line">
                    <span class="report-label">PUDEŁKA</span>
                    <span class="report-dots"></span>
                    <span class="report-value">${blocks}</span>
                </div>
                <div class="report-line">
                    <span class="report-label">CZAS</span>
                    <span class="report-dots"></span>
                    <span class="report-value">${m}:${s}</span>
                </div>
                <div class="report-line" style="color: #ffff00;">
                    <span class="report-label">REKORD</span>
                    <span class="report-dots"></span>
                    <span class="report-value">${bestHeight}m</span>
                </div>
            </div>
        `;

        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.howToScreen.classList.add('hidden');
        this.encyclopediaScreen.classList.add('hidden');
        this.optionsScreen.classList.add('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
    }

    showHowTo() {
        this.startScreen.classList.add('hidden');
        this.howToScreen.classList.remove('hidden');
    }

    hideHowTo() {
        this.howToScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    showEncyclopedia() {
        this.startScreen.classList.add('hidden');
        this.encyclopediaScreen.classList.remove('hidden');
        // Fix: hasChildNodes() counts text nodes (whitespace), so it was returning true and skipping population.
        // Use children.length to check for actual elements.
        // Always repopulate to ensure data is fresh and visible
        if (this.encyclopediaList) {
            this.encyclopediaList.innerHTML = '';
            this.populateEncyclopedia();
        }
    }

    hideEncyclopedia() {
        this.encyclopediaScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    populateEncyclopedia() {
        console.log("Populating Encyclopedia. Data count:", CONSOLE_DATA.length);
        // Sort by Year
        const sorted = [...CONSOLE_DATA].sort((a, b) => a.year - b.year);

        sorted.forEach(item => {
            const div = document.createElement('div');
            div.className = 'encyclopedia-item';
            div.style.display = 'flex'; // Force display

            console.log("Adding item:", item.name);

            // Image path
            // We need to assume path based on ID or if we update ConsoleData to have full path?
            // ConsoleData has 'id'. Filenames are assets/[id].png (mostly).
            // Wait, I should verify filename mapping in ConsoleData.js.
            // I used 'id' matching filename basename in ConsoleData.
            // But filename might have suffix? 
            // Game.js loaded them. Let's assume assets/[id].png works or check mapping.
            // Actually, in Game.js I removed extension and replaced _ with space to get Name.
            // Here 'item.id' matches the key. 
            // In ConsoleData I set ID to match 'magnavox_odyssey' etc.
            // So src is `assets/${item.id}.png`.
            // HOWEVER, playstation_portable_psp might be an issue if file is that but id is just playstation_portable?
            // I changed name display in Game.js, but file on disk is likely `assets/playstation_portable_psp.png`.
            // In ConsoleData I set id: "playstation_portable_psp". So it matches file.

            div.innerHTML = `
                <img src="assets/${item.id}.png" alt="${item.name}" onerror="this.style.display='none'">
                <div class="encyclopedia-text">
                    <div class="encyclopedia-header">
                        <h3>${item.name}</h3>
                        <span class="year">${item.year}</span>
                    </div>
                    <p>${item.desc}</p>
                    <div class="encyclopedia-trivia">CIEKAWOSTKA: ${item.trivia}</div>
                </div>
            `;

            // Add click listener (hacky but works with innerHTML if we select the img after)
            const img = div.querySelector('img');
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => this.showLightbox(`assets/${item.id}.png`, item.name));

            this.encyclopediaList.appendChild(div);
        });
    }

    showLightbox(src, caption) {
        if (!this.lightbox) return;
        this.lightboxImg.src = src;
        this.lightboxCaption.innerText = caption;
        this.lightbox.classList.remove('hidden');
    }

    hideLightbox() {
        if (!this.lightbox) return;
        this.lightbox.classList.add('hidden');
        this.lightboxImg.src = '';
    }

    showPauseScreen() {
        this.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.pauseScreen.classList.add('hidden');
    }

    showFloatingText(x, y, text, color) {
        const el = document.createElement('div');
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        el.style.fontWeight = 'bold';
        el.style.fontSize = '26px'; // Slightly larger
        el.style.textShadow = '2px 2px 0 #000'; // Stronger shadow
        el.style.opacity = '1.0'; // Force solid
        el.style.pointerEvents = 'none';
        el.style.zIndex = '2000'; // Higher than Overlay (1000)
        el.style.animation = 'floatUp 1s ease-out forwards';

        document.getElementById('ui-layer').appendChild(el);

        setTimeout(() => el.remove(), 1000);
    }
}
