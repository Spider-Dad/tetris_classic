// Мок для Audio API
class AudioMock {
    constructor() {
        this.paused = true;
        this.currentTime = 0;
        this.volume = 1;
        this.loop = false;
    }

    load() {}
    play() { this.paused = false; }
    pause() { this.paused = true; }
    cloneNode() { return new AudioMock(); }
}

global.Audio = AudioMock;

// Мок для requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);

// Мок для performance
global.performance = {
    now: () => Date.now()
}; 