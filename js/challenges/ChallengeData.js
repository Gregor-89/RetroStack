export const CHALLENGES = [
    {
        id: "tower_100",
        title: "WIEŻA NA 100 METRÓW? BANAŁ",
        description: "Serio, jeśli tego nie potrafisz, to może wróć do układania klocków LEGO Duplo. 100 metrów. To tyle co... no, sporo. Ale umówmy się, dla mnie to rozgrzewka przed kawą. Pokaż co potrafisz.",
        winCondition: { type: 'height', value: 100 },
        config: {
            customWinCondition: true
        }
    },
    {
        id: "speed_tower_50",
        title: "SZYBKA PIĘĆDZIESIĄTKA",
        description: "Masz 60 sekund. Minuta. Tyle zajmuje Pisarskiemu wymyślenie kolejnego żartu o Nintendo. 50 metrów w minutę? Brzmi jak wyzwanie dla kogoś z refleksem szachisty. No dalej, czas ucieka!",
        winCondition: { type: 'height', value: 50, timeLimit: 60 }
    },
    {
        id: "no_bombs_100",
        title: "PACYFISTA",
        description: "Zbuduj 100 metrów bez używania bomb. Tak, wiem, że lubisz jak robi bum, ale tym razem musisz wykazać się... finezją? Czy czymś tam co posiadają ludzie którzy nie wysadzają wszystkiego w powietrze. Jedna bomba i wylatujesz.",
        winCondition: { type: 'height', value: 100 },
        config: {
            allowBombs: false
        }
    },
    {
        id: "double_time",
        title: "DOUBLE TIME",
        description: "Wszystko dzieje się 2x szybciej. Kamera, klocki, Twoje tętno pewnie też. Jeśli myślisz, że standardowe tempo jest wolne, to proszę bardzo. Zapnij pasy, bo będzie trzęsło. Ułóż 66 metrów.",
        winCondition: { type: 'height', value: 66 },
        config: {
            gameSpeed: 2.0,
            noDropBoost: true,
            disabledEnemies: ['lipski', 'zagrajnik', 'archon']
        }
    },
    {
        id: "mini_boxes",
        title: "MNIEJSZE PUDEŁKA",
        description: "Inflacja dotarła nawet tutaj. Pudełka są o połowę mniejsze. Buduj na 33 metry tymi tyci-pudełeczkami. Powodzenia z celowaniem, przyda Ci się lupka.",
        winCondition: { type: 'height', value: 33 },
        config: {
            blockScale: 0.5,
            noDropBoost: true,
            pressureSpeedMultiplier: 0.5,
            disabledEnemies: ['lipski', 'zagrajnik', 'archon']
        }
    },
    {
        id: "chronological",
        title: "LEKCJA HISTORII",
        description: "Pamiętasz daty premiery wszystkich konsol i innych retro grajków? Ja pamiętam. Ty pewnie będziesz googlować (albo zerknij w Sprzętopedię). Masz układać je chronologicznie, rocznikami (sprżety wydane w tym samym roku mają dowolną kolejność). Od Magnavoxa do najnowszej.  Pomylisz się? No to nara.",
        winCondition: { type: 'chronological_order' },
        config: {
            selectionMode: 'manual',
            selectionOrder: 'alpha_asc',
            noDropBoost: true,
            strictChronology: true,
            disabledEnemies: ['lipski', 'zagrajnik', 'archon', 'nrgeek', 'quaz'],
            autoDropTime: 35,
            pressureSpeedMultiplier: 0.25
        }
    },
    {
        id: "invisible_tower",
        title: "DZIURA W PAMIĘCI",
        description: "Coś zakłóca sygnał... Po chwili wszystko zniknie. Masz 5 sekund na orientację, potem UV zrobi swoje. Bomby? Zapomnij. Cel: 50 metrów w ciemno.",
        winCondition: { type: 'height', value: 50 },
        config: {
            allowBombs: false,
            firstEnemySpawnTime: 5,
            onlySpawnEnemy: 'uv',
            forceSpawnLoop: true
        }
    },
    {
        id: "rotation_madness",
        title: "KARUZELA W GŁOWIE",
        description: "Połowianiuk dorwał się do kontrolerów. Wszystko się kręci! Nie użyjesz bomby, by się ratować. Ułóż 30 metrów w tym chaosie.",
        winCondition: { type: 'height', value: 30 },
        config: {
            allowBombs: false,
            firstEnemySpawnTime: 5,
            onlySpawnEnemy: 'polowianiuk'
        }
    }
];
