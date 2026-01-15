
export const GameConfig = {
    Player: {
        // Pozycja w pionie (oś Y). Im mniejsza wartość, tym wyżej jest postać.
        // 140 to środek postaci. Zmieniając to, przesuwasz Michała góra/dół.
        baseY: 130,

        // Rozmiar fizyczny (niewidzialna kolizja). Lepiej nie zmieniać, bo wpływa na odbijanie się od ścian.
        physicsWidth: 40,
        physicsHeight: 40,

        // Rozmiar wizualny sprite'a.
        // Zwiększając te wartości, powiększasz obrazek postaci bez zmiany fizyki.
        drawWidth: 140,
        drawHeight: 140,

        // Prędkość poruszania się gracza (piksele na sekundę).
        baseSpeed: 300,

        // Czas trwania jednej klatki animacji (im mniej, tym szybciej zmienia klatki).
        frameInterval: 0.04,

        // Mnożnik prędkości animacji względem prędkości ruchu.
        // 2.0 oznacza, że nogi ruszają się 2x szybciej niż standardowo przy chodzeniu.
        animSpeedBaseMultiplier: 2.0
    },
    Bomb: {
        width: 32,
        height: 48,
        explosionForce: 2.0 // Multiplier for radial blast force
    },
    Box: {
        // Przesunięcie trzymanego pudełka w pionie względem środka gracza.
        // Wartość 70 oznacza, że spód pudełka jest 70px nad środkiem gracza (czyli na czubku głowy/rękach, bo drawHeight=140).
        holdYOffset: 28,

        // Ustawienia gibania pudełka (Bobbing)
        bobPhase: 1.57, // Przesunięcie fazy (0 = standard, 3.14 = odwrót, 1.57 = przesunięcie o 1/4).
        bobAmplitude: 3, // Siła gibania w pikselach.
        bobFrequency: 4, // Ilość cykli gibnięcia na jeden pełny obrót animacji (domyślnie 2 = lewa/prawa noga).
    },
    Platform: {
        // =========================================
        // PLATFORMA GÓRNA (Dla Gracza - Szara)
        // =========================================

        // Przesunięcie górnej platformy względem pozycji gracza (GameConfig.Player.baseY).
        playerSensorOffset: 35,

        // =========================================
        // ZIEMIA (Fizyczna podłoga - Ciemna)
        // =========================================

        // Wysokość (grubość) podłogi na samym dole ekranu.
        groundHeight: 130,

        // Odstęp podłogi od dolnej krawędzi ekranu.
        groundBottomPadding: 10,

        // =========================================
        // PLATFORMA DOLNA (Dla Wrogów - Czerwona)
        // =========================================

        // Wysokość czerwonej platformy NAD ziemią.
        // Im większa liczba, tym wyżej jest platforma.
        lowerPlatformOffset: 20,

        // Grubość dolnej platformy.
        lowerPlatformHeight: 30,
    },
    Enemies: {
        // Wymiary przeciwników (FIZYCZNE HITBOXY).
        // Używane do kolizji (np. z bombą). Mniejsze niż sprite, bo sprite ma whitespace.
        hitboxWidth: 40,
        hitboxHeight: 80,

        // Wymiary WIZUALNE (Sprite'y).
        // Większe, żeby postać wyglądała okazale.
        drawWidth: 140,
        drawHeight: 140,

        // Debug: Czy rysować hitboxy (czerwone ramki)?
        debugHitboxes: false,

        // Animacja
        frameInterval: 0.05, // Szybkość animacji basics

        // Prędkość poruszania się przeciwników (zakres losowy).
        // Animacja dostosowuje się do wylosowanej prędkości.
        speedMin: 50,
        speedMax: 150,

        // Maksymalna liczba przeciwników na ekranie jednocześnie.
        maxCount: 9,

        // Pozycja pojawiania się względem "czerwonej platformy".
        // 0 = środek enemy na środku platformy.
        // -75 = stopy sprite'a (140px) dotykają platformy.
        spawnPlatformOffset: -35, //im mniej tym przeciwnik jest wyżej

        // Przesunięcie etykiety (nicku) względem środka przeciwnika w osi Y.
        // -85 = standardowo nad głową przy sprice 140px.
        labelYOffset: -45,

        // Czas do pierwszego pojawienia się wroga (w sekundach).
        spawnTimerInitial: 10,

        // Minimalny i maksymalny czas między kolejnymi wrogami (losowo pomiędzy tymi wartościami).
        spawnTimerMin: 6,
        spawnTimerMax: 20,

        // --- SPECIFIC ENEMY SETTINGS ---

        // KACPER LIPSKI (Camera Speed)
        lipskiScrollMultiplier: 2.0, // How much faster the camera moves up

        // DAWID KOSIŃSKI (Human Bomb)
        kosinskiTimer: 10.0, // Seconds before explosion
        kosinskiExplosionRadius: 150, // Range of blast (Reverted)
        kosinskiExplosionForce: 700.0, // Power of blast (Doubled from 350)

        // MARCIN POŁOWIANIUK (Rotation)
        polowianiukRotationSpeed: 2.0, // Radians per second

        // UV (Invisibility)
        uvStaticOpacity: 0.0 // Totally invisible

    },
    Gameplay: {
        cameraSpeed: 10, // Pixels per second (Base rising pressure)
        autoDropTime: 10, // Seconds before auto-drop
        dropCooldown: 0.6 // Seconds beofre next block
    },

    Music: {
        menuTrack: 'menu.mp3',
        gameplayTracks: [
            'gameplay_1.mp3', 'gameplay_2.mp3', 'gameplay_3.mp3',
            'gameplay_4.mp3', 'gameplay_5.mp3', 'gameplay_6.mp3', 'gameplay_7.mp3'
        ],
        volume: 1.0
    },
    SFX: {
        enemyDeath: 'enemy_death.mp3'
    }
};
