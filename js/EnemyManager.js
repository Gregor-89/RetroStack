// EnemyManager.js
import { PhysicsWorld } from './PhysicsWorld.js';
import { GameConfig } from './Config.js';

export class Enemy {
    constructor(x, y, type, physicsWorld, texture = null) {
        this.type = type;
        // Use HITBOX dimensions for physics
        this.width = GameConfig.Enemies.hitboxWidth;
        this.height = GameConfig.Enemies.hitboxHeight;
        this.physicsWorld = physicsWorld;
        this.markedForDeletion = false;

        this.color = this.getTypeColor(type);

        // Physics Body (Sensor)
        this.body = Matter.Bodies.rectangle(x, y, this.width, this.height, {
            isStatic: true,
            isSensor: true,
            label: 'Enemy',
            render: {
                fillStyle: this.color,
                visible: false // Hide physics body, we will draw sprite
            }
        });
        this.body.gameEnemy = this;

        this.speed = GameConfig.Enemies.speedMin + Math.random() * (GameConfig.Enemies.speedMax - GameConfig.Enemies.speedMin);
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // Visual / Animation State
        this.drawWidth = GameConfig.Enemies.drawWidth;
        this.drawHeight = GameConfig.Enemies.drawHeight;

        // Sprite Setup
        if (texture) {
            this.sprite = texture;
        } else {
            this.sprite = new Image();
            this.sprite.src = `assets/characters/${this.type}-sprite.png`;
        }

        this.frameWidth = 512; // 3072 / 6
        this.frameHeight = 512;
        this.totalFrames = 36;
        this.cols = 6;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = GameConfig.Enemies.frameInterval;

        // Kosiński State
        if (this.type === 'kosinski') {
            this.bombTimer = GameConfig.Enemies.kosinskiTimer;
            this.blinkTimer = 0;
        }
    }

    getTypeColor(type) {
        switch (type) {
            case 'zagrajnik': return '#ffaa00'; // Speed
            case 'archon': return '#aa00ff'; // Time
            case 'quaz': return '#00aaff'; // Dizzy
            case 'ryslaw': return '#00ffaa'; // Swap
            case 'nrgeek': return '#ff0000'; // Chaos
            case 'lipski': return '#ff5500'; // Camera +
            case 'kosinski': return '#ffff00'; // Bomb
            case 'polowianiuk': return '#ff00ff'; // Rotation
            case 'uv': return '#4400aa'; // UV/Invisible
            default: return '#cccccc';
        }
    }

    update(dt, gameWidth, game) {
        const move = this.speed * this.direction * dt;
        Matter.Body.setPosition(this.body, {
            x: this.body.position.x + move,
            y: this.body.position.y
        });

        // Update Animation
        this.updateAnimation(dt);

        if (this.body.position.x > gameWidth - 20) {
            this.direction = -1;
        } else if (this.body.position.x < 20) {
            this.direction = 1;
        }

        // KOSIŃSKI LOGIC (Time Bomb)
        if (this.type === 'kosinski') {
            this.bombTimer -= dt;

            // Blinking Effect (Accelrating)
            // Blinking Effect (Only if close to explosion)
            if (this.bombTimer < 5.0) {
                this.blinkTimer += dt;
                let blinkSpeed = 0.5;
                if (this.bombTimer < 3.0) blinkSpeed = 0.2;
                if (this.bombTimer < 1.0) blinkSpeed = 0.05;

                if (this.blinkTimer > blinkSpeed) {
                    this.blinkTimer = 0;
                    // Toggle Color for visual feedback
                    this.body.render.fillStyle = (this.body.render.fillStyle === '#ffff00') ? '#ffffff' : '#ffff00';
                }
            } else {
                this.body.render.fillStyle = '#ffff00'; // Reset color if timer high
            }

            if (this.bombTimer <= 0) {
                this.explode(game);
                this.markedForDeletion = true;
            }
        }
    }

    explode(game) {
        // Find nearby bodies and push them!
        const bodies = game.physicsWorld.getAllBodies();
        const blastCenter = this.body.position;
        const radius = GameConfig.Enemies.kosinskiExplosionRadius;
        const force = GameConfig.Enemies.kosinskiExplosionForce;

        // Audio & Visuals
        game.playSFX('bomb_explode');
        game.triggerShake(10, 0.5); // Add screenshake for impact
        game.spawnParticles(blastCenter.x, blastCenter.y, '#ffff00', 30, 200);

        game.uiManager.showFloatingText(blastCenter.x, blastCenter.y - 20, "BOOM!", "#ffff00");

        bodies.forEach(b => {
            if (b.isStatic && b.label !== 'Console') return; // Don't move walls/ground
            if (b === this.body) return;

            const dx = b.position.x - blastCenter.x;
            const dy = b.position.y - blastCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                // Direction vector
                const forceX = (dx / dist) * force;
                const forceY = (dy / dist) * force; // Usually pushes UP/Away

                // If it was static (foundation), wake it up! 
                // Kosiński explicitly "narusza konstrukcję"
                if (b.label === 'Console') {
                    Matter.Body.setStatic(b, false);
                    Matter.Sleeping.set(b, false); // Ensure it wakes up to receive force
                    Matter.Body.applyForce(b, b.position, { x: forceX, y: forceY });
                }
            }
        });
    }

    applyEffect(game) {
        switch (this.type) {
            case 'zagrajnik': // Speed Up
                game.player.speedMultiplier = 2.0;
                break;
            case 'archon': // Time Leak
                game.timerMultiplier = 2.5;
                break;
            case 'quaz': // Dizzy
                game.player.chaosMode = true;
                break;
            case 'ryslaw': // Swap on Drop
                game.swapOnDropMode = true;
                break;
            case 'nrgeek': // Chaos Drop
                game.chaosDropMode = true;
                break;
            case 'lipski': // Camera Speed
                game.lipskiMode = true;
                break;
            case 'kosinski': // Bomb Timer
                game.kosinskiMode = true;
                game.kosinskiTimer = this.bombTimer;
                break;
            case 'polowianiuk': // Rotation
                game.polowianiukMode = true;
                break;
            case 'uv': // Invisibility
                game.uvMode = true;
                break;
            // Kosiński has no passive effect, he just explodes.
        }
    }

    updateAnimation(dt) {
        // Only animate if loaded
        if (!this.sprite.complete) return;

        // Speed dependent animation
        // Base reference speed is 100. If faster (e.g. 200), animate 2x faster.
        const animMultiplier = this.speed / 100.0;
        this.frameTimer += dt * animMultiplier;

        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.totalFrames) {
                this.currentFrame = 0;
            }
        }
    }

    draw(ctx) {
        const pos = this.body.position;

        // 1. Draw Sprite
        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            const col = this.currentFrame % this.cols;
            const row = Math.floor(this.currentFrame / this.cols);

            ctx.save();
            ctx.translate(pos.x, pos.y);

            // Flip based on direction
            if (this.direction < 0) {
                ctx.scale(-1, 1);
            }

            ctx.drawImage(
                this.sprite,
                col * this.frameWidth, row * this.frameHeight,
                this.frameWidth, this.frameHeight,
                -this.drawWidth / 2, -this.drawHeight / 2,
                this.drawWidth, this.drawHeight
            );
            ctx.restore();
            ctx.restore();
        }
        // No fallback - invisible until loaded to avoid red flash

        // 2. Draw Hitbox (Debug)
        if (GameConfig.Enemies.debugHitboxes) {
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - this.width / 2, pos.y - this.height / 2, this.width, this.height);
            ctx.restore();
        }
    }
}

export class EnemyManager {
    constructor(physicsWorld, gameWidth, gameHeight) {
        this.physicsWorld = physicsWorld;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.enemies = [];
        this.spawnTimer = 15; // 15s initial delay
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 15;
    }

    update(dt, game) {
        this.spawnTimer -= dt;

        if (this.spawnTimer <= 0) {
            this.spawnEnemy(game);
            this.spawnTimer = GameConfig.Enemies.spawnTimerMin + Math.random() * (GameConfig.Enemies.spawnTimerMax - GameConfig.Enemies.spawnTimerMin);
        }

        this.enemies.forEach(enemy => {
            enemy.update(dt, this.gameWidth, game);
            enemy.applyEffect(game);

            // Cleanup Off-Screen Enemies (If scrolled past)
            if (!enemy.markedForDeletion && enemy.body.position.y > this.gameHeight + 100) {
                enemy.markedForDeletion = true;
            }
        });

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].markedForDeletion) {
                this.physicsWorld.removeBody(this.enemies[i].body);
                this.enemies.splice(i, 1);
            }
        }
    }

    spawnEnemy(game) {
        if (this.enemies.length >= GameConfig.Enemies.maxCount) return;

        let allTypes = ['zagrajnik', 'archon', 'quaz', 'ryslaw', 'nrgeek', 'lipski', 'kosinski', 'polowianiuk', 'uv'];

        if (game.activeChallenge && game.activeChallenge.config && game.activeChallenge.config.onlySpawnEnemy) {
            allTypes = [game.activeChallenge.config.onlySpawnEnemy];
        }
        // Challenge Restriction: Block specific enemies
        else if (game.activeChallenge && game.activeChallenge.config && game.activeChallenge.config.disabledEnemies) {
            const disabled = game.activeChallenge.config.disabledEnemies;
            allTypes = allTypes.filter(type => !disabled.includes(type));
        }

        // Filter by User Settings (enabledEnemies)
        if (game.enabledEnemies) {
            allTypes = allTypes.filter(type => game.enabledEnemies[type] !== false);
        }

        // If no enemies enabled, abort spawn
        if (allTypes.length === 0) return;

        // Filter out types that are already on screen
        const activeTypes = this.enemies.map(e => e.type);
        const availableTypes = allTypes.filter(t => !activeTypes.includes(t));

        // If all available types are active (unlikely with limit 3 vs 5 types), default to any ENABLED type
        const typesToPick = availableTypes.length > 0 ? availableTypes : allTypes;

        const type = typesToPick[Math.floor(Math.random() * typesToPick.length)];

        // Calculate Y relative to the Enemy Platform
        let y = this.gameHeight - 100; // Fallback
        if (this.physicsWorld && this.physicsWorld.enemyPlatform) {
            y = this.physicsWorld.enemyPlatform.position.y + (GameConfig.Enemies.spawnPlatformOffset || 0);
        }

        const x = Math.random() * (this.gameWidth - 100) + 50;

        // Get Preloaded Texture
        let texture = null; // Declare texture
        if (this.game && this.game.characterTextures) {
            texture = this.game.characterTextures[type]; // Assuming textureKey should be type
        } else if (game && game.characterTextures) { // Fallback to passed 'game' if 'this.game' is not set
            texture = game.characterTextures[type];
        }

        const enemy = new Enemy(x, y, type, this.physicsWorld, texture);
        this.physicsWorld.addBody(enemy.body);
        this.enemies.push(enemy);

        // Alert Sound
        if (game.playSFX) game.playSFX('effect_alert');
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }
}
