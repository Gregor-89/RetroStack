// PhysicsWorld.js
import { GameConfig } from './Config.js';

const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Body = Matter.Body;

export class PhysicsWorld {
    constructor(containerId, explicitWidth, explicitHeight) {
        this.container = document.getElementById(containerId);
        // Use explicit if provided, otherwise fallback to DOM read
        this.width = explicitWidth || this.container.clientWidth;
        this.height = explicitHeight || this.container.clientHeight;

        console.log("PHYSICS WORLD INIT SIZE:", this.width, this.height);

        // Initialize Engine
        this.engine = Engine.create({
            positionIterations: 20,
            velocityIterations: 20,
            enableSleeping: true,
            gravity: { x: 0, y: 1.5 }
        });
        this.world = this.engine.world;

        // Initialize Render
        this.render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                wireframes: false,
                background: '#111'
            }
        });

        // Initialize Runner
        this.runner = Runner.create();

        this.createBoundaries();
    }

    createBoundaries() {
        // Ground
        const gH = GameConfig.Platform.groundHeight || 60;
        const padding = GameConfig.Platform.groundBottomPadding || 20;
        this.groundY = this.height - (gH / 2) - padding;

        this.ground = Bodies.rectangle(this.width / 2, this.groundY, this.width, gH, {
            isStatic: true,
            render: { fillStyle: '#333' },
            label: 'Ground',
            friction: 1.0,
            frictionStatic: Infinity
        });
        Composite.add(this.world, this.ground);

        // Enemy Platform (visual lower)
        const enemyOffset = GameConfig.Platform.lowerPlatformOffset || 10;
        const enemyHeight = GameConfig.Platform.lowerPlatformHeight || 10;
        this.enemyPlatform = Bodies.rectangle(this.width / 2, this.groundY - enemyOffset, this.width, enemyHeight, {
            isStatic: true,
            isSensor: true, // Visual/Sensor so it doesn't block standard physics but can be hit by Bomb logic
            label: 'Platform',
            render: { fillStyle: '#442222' }
        });
        Composite.add(this.world, this.enemyPlatform);

        // Player Platform (visual upper)
        // Uses Config Y + Offset
        const playerWalkY = GameConfig.Player.baseY + (GameConfig.Platform.playerSensorOffset || 25);
        this.playerPlatform = Bodies.rectangle(this.width / 2, playerWalkY, this.width, 10, {
            isStatic: true,
            isSensor: true,
            label: 'PlayerPlatform',
            render: { fillStyle: '#555' }
        });
        Composite.add(this.world, this.playerPlatform);
    }

    reset() {
        Composite.clear(this.world, false); // Clear all
        this.createBoundaries(); // Re-add boundaries
    }

    start() {
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
    }

    stop() {
        // Render.stop(this.render); // MD: Fix - Keep rendering during pause/victory
        Runner.stop(this.runner);
    }

    setTimeScale(scale) {
        if (this.engine && this.engine.timing) {
            this.engine.timing.timeScale = scale;
        }
    }

    addBody(body) {
        Composite.add(this.world, body);
    }

    removeBody(body) {
        Composite.remove(this.world, body);
    }

    getAllBodies() {
        return Composite.allBodies(this.world);
    }

    moveWorldDown(amount = 30) {
        const bodies = this.getAllBodies();
        for (let body of bodies) {
            // Apply to Dynamic bodies (default), Ground, AND now static Consoles (frozen foundation)
            if (!body.isStatic || body.label === 'Ground' || body.label === 'Console') {
                Body.setPosition(body, {
                    x: body.position.x,
                    y: body.position.y + amount
                });
            }
        }
    }
}
