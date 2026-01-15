import { CHALLENGES } from './ChallengeData.js';

export class ChallengeManager {
    constructor(game) {
        this.game = game;
        this.challenges = CHALLENGES;
        this.completedChallenges = this.loadProgress();
        this.activeChallenge = null;
    }

    loadProgress() {
        const saved = localStorage.getItem('retroStackChallenges');
        return saved ? JSON.parse(saved) : [];
    }

    saveProgress() {
        localStorage.setItem('retroStackChallenges', JSON.stringify(this.completedChallenges));
    }

    isCompleted(id) {
        return this.completedChallenges.includes(id);
    }

    markCompleted(id) {
        if (!this.isCompleted(id)) {
            this.completedChallenges.push(id);
            this.saveProgress();
        }
    }

    getChallenge(id) {
        return this.challenges.find(c => c.id === id);
    }

    startChallenge(id) {
        const challenge = this.getChallenge(id);
        if (!challenge) return;

        console.log(`Starting Challenge: ${challenge.title}`);
        this.activeChallenge = challenge;

        // TODO: Apply Challenge Config to Game
        // This will be implemented in later stages when we touch Game.js logic

        // For Stage 1-2: Start Logic
        // alert(`Rozpoczynanie wyzwania: ${challenge.title}\n(Logika gry zostanie dodana w kolejnych etapach)`);

        // Ensure UI is hidden before starting
        this.game.startChallengeGame(challenge);
    }

    abortChallenge() {
        this.activeChallenge = null;
        // Reset Game Config to default
    }
}
