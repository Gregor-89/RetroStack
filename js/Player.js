// Player.js
import { GameConfig } from './Config.js';

export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.width = GameConfig.Player.physicsWidth;
        this.height = GameConfig.Player.physicsHeight;
        this.x = gameWidth / 2;
        this.y = GameConfig.Player.baseY;

        // Movement properties
        this.baseSpeed = GameConfig.Player.baseSpeed;
        this.speedMultiplier = 1.0;
        this.direction = 1;
        this.chaosMode = false;
        this.chaosTimer = 0;

        this.color = '#00ff00';

        // Sprite Animation
        this.sprite = new Image();
        this.sprite.src = 'assets/characters/pisarski-sprite.png';
        this.frameWidth = 512; // 3072 / 6
        this.frameHeight = 512; // 3072 / 6
        this.totalFrames = 36;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = GameConfig.Player.frameInterval;
        this.cols = 6;

        // Visual Size
        this.drawWidth = GameConfig.Player.drawWidth;
        this.drawHeight = GameConfig.Player.drawHeight;
    }

    update(dt) {
        // Chaos Mode: Randomly flip direction
        if (this.chaosMode) {
            this.chaosTimer -= dt;
            if (this.chaosTimer <= 0) {
                this.direction *= -1; // Flip
                this.chaosTimer = 0.5 + Math.random() * 1.5; // Random flip
            }
        }

        let speed = this.baseSpeed * this.speedMultiplier;

        // Failsafe: Ensure direction is never 0
        if (Math.abs(this.direction) < 0.1) this.direction = 1;

        // Move
        this.x += speed * this.direction * dt;

        // Bounce off walls
        if (this.x > this.gameWidth - this.width) {
            this.x = this.gameWidth - this.width;
            this.direction = -1;
        } else if (this.x < this.width) {
            this.x = this.width;
            this.direction = 1;
        }

        // Animation Update
        // Sync with speedMultiplier and double base speed (2.0) as requested
        const animSpeed = GameConfig.Player.animSpeedBaseMultiplier * (Math.abs(this.speedMultiplier) || 1.0);
        this.frameTimer += dt * animSpeed;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.sprite.complete) {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
            return;
        }

        const col = this.currentFrame % this.cols;
        const row = Math.floor(this.currentFrame / this.cols);

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip if moving left
        if (this.direction < 0) {
            ctx.scale(-1, 1);
        }

        ctx.drawImage(
            this.sprite,
            col * this.frameWidth, row * this.frameHeight, // Source X, Y
            this.frameWidth, this.frameHeight,             // Source W, H
            -this.drawWidth / 2,                           // Dest X (relative to center)
            -this.drawHeight / 2,                          // Dest Y
            this.drawWidth, this.drawHeight                // Dest W, H
        );
        ctx.restore();
    }
}
