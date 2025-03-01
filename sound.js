class SoundManager {
    constructor() {
        this.sounds = {
            move: new Audio('sounds/move.wav'),
            rotate: new Audio('sounds/rotate.wav'),
            drop: new Audio('sounds/drop.wav'),
            clear: new Audio('sounds/clear.wav'),
            levelUp: new Audio('sounds/levelup.wav'),
            gameOver: new Audio('sounds/gameover.wav')
        };
        
        this.music = new Audio('sounds/theme.mp3');
        this.music.loop = true;
        this.isMusicMuted = false;
        this.isSoundMuted = false;

        // Предзагрузка звуков
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
        this.music.load();
    }

    playSound(soundName) {
        if (!this.isSoundMuted && this.sounds[soundName]) {
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = 0.5;
            sound.play();
        }
    }

    startMusic() {
        if (!this.isMusicMuted) {
            this.music.volume = 0.3;
            this.music.play();
        }
    }

    stopMusic() {
        this.music.pause();
        this.music.currentTime = 0;
    }

    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.isMusicMuted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.isMusicMuted;
    }

    toggleSound() {
        this.isSoundMuted = !this.isSoundMuted;
        return this.isSoundMuted;
    }
}

// Создаем глобальный экземпляр для использования в игре
const soundManager = new SoundManager();

// Экспортируем класс для тестов
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SoundManager, soundManager };
} 