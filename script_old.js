// --- KONFIGURACJA MATTER.JS ---
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Body = Matter.Body;

// Utworzenie silnika
const engine = Engine.create({
    positionIterations: 20,
    velocityIterations: 20,
    enableSleeping: true,
    gravity: { x: 0, y: 1.5 }
});
const world = engine.world;

// Konfiguracja kontenera
const gameContainer = document.getElementById('game-container');
const width = gameContainer.clientWidth;
const height = gameContainer.clientHeight;

// Renderowanie
const render = Render.create({
    element: gameContainer,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#111'
    }
});

// --- ZMIENNE GRY ---
let score = 0;
let isGameOver = false;
let stackHeight = 0;
const groundY = height - 50;
let currentFallingBlock = null; // Śledzenie aktualnie spadającego klocka

// Gracz (Michał)
const player = {
    x: width / 2,
    y: 100,
    width: 40,
    height: 40,
    speed: 1.5,
    direction: 1,
    color: '#00ff00'
};

// Timer zrzutu
// ZMIANA: Skrócono czas do 900 klatek (ok. 15 sekund) - szybsze tempo
let maxDropTime = 900;
let currentDropTime = maxDropTime;

// Definicje pudełek - WIĘCEJ TYPÓW
const consoleTypes = [
    { name: "NES", w: 100, h: 30, color: '#999' },       // Szeroka baza
    { name: "SNES", w: 80, h: 40, color: '#bbb' },       // Standard
    { name: "GameCube", w: 60, h: 60, color: '#639' },   // Kostka
    { name: "PS5", w: 35, h: 90, color: '#eee' },        // Wysoka wieża (trudna)
    { name: "MegaDrive", w: 90, h: 35, color: '#222' },  // Czarna, płaska
    { name: "Atari", w: 110, h: 25, color: '#855' },     // Bardzo szeroka (drewno)
    { name: "GameBoy", w: 30, h: 50, color: '#8c8' }     // Wąska, mała
];
let nextConsoleIndex = Math.floor(Math.random() * consoleTypes.length);

// --- TWORZENIE ŚWIATA ---

// Podłoga
const ground = Bodies.rectangle(width / 2, groundY, width, 60, {
    isStatic: true,
    render: { fillStyle: '#333' },
    label: 'Ground',
    friction: 1.0,
    frictionStatic: Infinity
});
Composite.add(world, ground);

// Przeciwnik (Placeholder)
const enemy = Bodies.rectangle(width / 2, groundY - 50, 40, 40, {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: '#ff0000' }
});

// Uruchomienie silnika
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// --- LOGIKA ROZGRYWKI (PĘTLA) ---

Events.on(engine, 'beforeUpdate', function () {
    if (isGameOver) return;

    // 1. Ruch Gracza
    player.x += player.speed * player.direction;
    if (player.x > width - 40 || player.x < 40) {
        player.direction *= -1;
    }

    // 2. Obsługa Timera
    currentDropTime--;
    updateTimerUI();

    if (currentDropTime <= 0) {
        dropConsole();
    }

    // 3. Logika "Wylatywania" klocków i Game Over
    checkGameStatus();
});

// Renderowanie customowych grafik
Events.on(render, 'afterRender', function () {
    if (isGameOver) return;
    const ctx = render.context;

    // Rysowanie Michała
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

    // Rysowanie trzymanej konsoli (podgląd)
    const type = consoleTypes[nextConsoleIndex];
    ctx.fillStyle = type.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(player.x - type.w / 2, player.y + 30, type.w, type.h);
    ctx.globalAlpha = 1.0;
});

// --- FUNKCJE STERUJĄCE ---

function dropConsole() {
    if (isGameOver) return;

    const type = consoleTypes[nextConsoleIndex];

    const newConsole = Bodies.rectangle(player.x, player.y + 30, type.w, type.h, {
        restitution: 0.0,
        friction: 1.0,
        frictionStatic: Infinity,
        frictionAir: 0.15,
        density: 1.0,
        chamfer: { radius: 0 },
        slop: 0.0,
        // ZMIANA: Wydłużono czas zastygania do 120 (2 sekundy)
        sleepThreshold: 120,
        label: 'Console',
        render: { fillStyle: type.color }
    });

    currentFallingBlock = newConsole; // Zapamiętujemy, co teraz leci
    Composite.add(world, newConsole);

    // Reset gry
    currentDropTime = maxDropTime;

    nextConsoleIndex = Math.floor(Math.random() * consoleTypes.length);
    document.getElementById('next-name').innerText = consoleTypes[nextConsoleIndex].name;

    // Próba przesunięcia kamery (jeśli wieża istnieje)
    if (stackHeight > 0) {
        moveWorldDown();
    }
}

function checkGameStatus() {
    const bodies = Composite.allBodies(world);
    let highestPointY = height * 2; // Wartość startowa (poza ekranem na dole)
    let towerBlockCount = 0;

    // Sprawdzamy stan klocków
    for (let body of bodies) {
        if (body.label === 'Console') {
            // A. Logika Kary: Jeśli SPADAJĄCY (nieuśpiony) klocek minie podłogę
            if (!body.isSleeping && body.position.y > ground.position.y + 50) {
                // Usuwamy klocek ze świata, żeby nie spadał w nieskończoność
                Composite.remove(world, body);
                score -= 50; // KARA
                updateScoreUI();
                // Jeśli to był ten, który zrzuciliśmy, resetujemy zmienną
                if (currentFallingBlock === body) currentFallingBlock = null;
                continue; // Przejdź do następnego
            }

            // B. Logika Wieży: Szukamy najwyższego punktu STABILNEJ wieży
            // (lub spadającej, ale wciąż widocznej)
            if (body.position.y < highestPointY) {
                highestPointY = body.position.y;
            }
            towerBlockCount++;
        }
    }

    // C. Logika Game Over:
    // Przegrywasz TYLKO wtedy, gdy masz już zbudowaną wieżę (stackHeight > 0),
    // ale najwyższy jej punkt zjechał poniżej dołu ekranu (czyli wieża zniknęła/zapadła się)
    // "height - 20" to margines bezpieczeństwa
    if (stackHeight > 1 && towerBlockCount > 0 && highestPointY > height) {
        triggerGameOver();
    }

    // D. Punktowanie sukcesu:
    // Jeśli spadający klocek się zatrzymał (zasnął) i jest widoczny -> uznajemy go za część wieży
    if (currentFallingBlock && currentFallingBlock.isSleeping) {
        if (currentFallingBlock.position.y < height) {
            score += 20; // Punkty dopiero jak wyląduje!
            updateScoreUI();
            stackHeight++; // Dopiero teraz uznajemy, że wieża urosła
            currentFallingBlock = null; // Klocek obsłużony
        }
    }
}

function moveWorldDown() {
    const bodies = Composite.allBodies(world);
    const shiftY = 30; // Mniejszy skok kamery dla płynności

    for (let body of bodies) {
        if (!body.isStatic || body.label === 'Ground') {
            Body.setPosition(body, {
                x: body.position.x,
                y: body.position.y + shiftY
            });
        }
    }
}

function updateTimerUI() {
    const bar = document.getElementById('timer-bar');
    const percent = (currentDropTime / maxDropTime) * 100;
    bar.style.width = percent + '%';
    if (percent < 30) bar.style.backgroundColor = '#ff0000';
    else bar.style.backgroundColor = '#ffcc00';
}

function updateScoreUI() {
    const scoreEl = document.getElementById('score');
    scoreEl.innerText = score;
    // Kolorujemy na czerwono jak wynik ujemny
    if (score < 0) scoreEl.style.color = '#ff3333';
    else scoreEl.style.color = '#fff';
}

function triggerGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    Runner.stop(runner);
}

// Sterowanie PC
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') dropConsole();
});

// Sterowanie Dotykowe
const btnDrop = document.getElementById('btn-drop');
const btnBomb = document.getElementById('btn-bomb');

btnDrop.addEventListener('touchstart', (e) => { e.preventDefault(); dropConsole(); });
btnDrop.addEventListener('click', (e) => { dropConsole(); });

btnBomb.addEventListener('touchstart', (e) => { e.preventDefault(); console.log("Bomba!"); });

// Start
document.getElementById('next-name').innerText = consoleTypes[nextConsoleIndex].name;