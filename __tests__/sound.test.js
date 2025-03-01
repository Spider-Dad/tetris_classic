describe('SoundManager', () => {
    let soundManager;

    beforeEach(() => {
        // Мок для Audio
        global.Audio = jest.fn().mockImplementation(() => ({
            load: jest.fn(),
            play: jest.fn(),
            pause: jest.fn(),
            cloneNode: jest.fn().mockImplementation(() => ({
                play: jest.fn(),
                volume: 0
            }))
        }));

        // Очищаем DOM перед каждым тестом
        document.body.innerHTML = '';
        jest.clearAllMocks();
        
        // Создаем новый экземпляр SoundManager для каждого теста
        jest.isolateModules(() => {
            const SoundManager = require('../sound.js').SoundManager;
            soundManager = new SoundManager();
        });
    });

    describe('constructor', () => {
        test('должен создавать экземпляр с правильными начальными значениями', () => {
            expect(soundManager.isMusicMuted).toBe(false);
            expect(soundManager.isSoundMuted).toBe(false);
            expect(soundManager.music).toBeDefined();
            expect(soundManager.music.loop).toBe(true);
            expect(Object.keys(soundManager.sounds)).toHaveLength(6);
        });
    });

    describe('playSound', () => {
        test('должен воспроизводить звук, если звук не отключен', () => {
            const mockClonedSound = {
                play: jest.fn(),
                volume: 0
            };
            soundManager.sounds.move.cloneNode.mockReturnValue(mockClonedSound);
            
            soundManager.playSound('move');
            
            expect(soundManager.sounds.move.cloneNode).toHaveBeenCalled();
            expect(mockClonedSound.volume).toBe(0.5);
            expect(mockClonedSound.play).toHaveBeenCalled();
        });

        test('не должен воспроизводить звук, если звук отключен', () => {
            soundManager.isSoundMuted = true;
            const spy = jest.spyOn(soundManager.sounds.move, 'play');
            soundManager.playSound('move');
            expect(spy).not.toHaveBeenCalled();
        });

        test('не должен вызывать ошибку при неверном имени звука', () => {
            expect(() => {
                soundManager.playSound('nonexistent');
            }).not.toThrow();
        });
    });

    describe('startMusic', () => {
        test('должен воспроизводить музыку, если она не отключена', () => {
            const spy = jest.spyOn(soundManager.music, 'play');
            soundManager.startMusic();
            expect(spy).toHaveBeenCalled();
            expect(soundManager.music.volume).toBe(0.3);
        });

        test('не должен воспроизводить музыку, если она отключена', () => {
            soundManager.isMusicMuted = true;
            const spy = jest.spyOn(soundManager.music, 'play');
            soundManager.startMusic();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('stopMusic', () => {
        test('должен останавливать музыку и сбрасывать время', () => {
            const pauseSpy = jest.spyOn(soundManager.music, 'pause');
            soundManager.stopMusic();
            expect(pauseSpy).toHaveBeenCalled();
            expect(soundManager.music.currentTime).toBe(0);
        });
    });

    describe('toggleMusic', () => {
        test('должен переключать состояние музыки', () => {
            expect(soundManager.toggleMusic()).toBe(true);
            expect(soundManager.isMusicMuted).toBe(true);
            expect(soundManager.toggleMusic()).toBe(false);
            expect(soundManager.isMusicMuted).toBe(false);
        });

        test('должен останавливать музыку при отключении', () => {
            const stopSpy = jest.spyOn(soundManager, 'stopMusic');
            soundManager.toggleMusic();
            expect(stopSpy).toHaveBeenCalled();
        });

        test('должен запускать музыку при включении', () => {
            soundManager.toggleMusic(); // отключаем
            const startSpy = jest.spyOn(soundManager, 'startMusic');
            soundManager.toggleMusic(); // включаем
            expect(startSpy).toHaveBeenCalled();
        });
    });

    describe('toggleSound', () => {
        test('должен переключать состояние звуковых эффектов', () => {
            expect(soundManager.toggleSound()).toBe(true);
            expect(soundManager.isSoundMuted).toBe(true);
            expect(soundManager.toggleSound()).toBe(false);
            expect(soundManager.isSoundMuted).toBe(false);
        });
    });

    describe('module.exports', () => {
        test('должен экспортировать класс SoundManager и экземпляр soundManager', () => {
            // Проверяем, что модуль экспортирует правильные объекты
            const soundModule = require('../sound.js');
            expect(soundModule.SoundManager).toBeDefined();
            expect(soundModule.soundManager).toBeDefined();
            
            // Проверяем, что soundManager является экземпляром SoundManager
            expect(soundModule.soundManager instanceof soundModule.SoundManager).toBe(true);
        });
    });
}); 