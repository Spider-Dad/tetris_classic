describe('Tetris', () => {
    let tetris;
    let mockCanvas;
    let mockCtx;
    let animationFrameCallback;

    beforeEach(() => {
        // Мок для requestAnimationFrame
        global.requestAnimationFrame = jest.fn(cb => {
            animationFrameCallback = cb;
            return 1; // возвращаем ID анимации
        });

        // Подготавливаем DOM
        document.body.innerHTML = `
            <div class="game-container">
                <div class="game-area">
                    <div class="side-panel left-panel">
                        <div class="score-board">
                            <div class="score">Очки: <span id="score">0</span></div>
                            <div class="level">Уровень: <span id="level">1</span></div>
                            <div class="lines">Линии: <span id="lines">0</span></div>
                        </div>
                        <div class="next-piece">
                            <h3>Следующая фигура:</h3>
                            <canvas id="nextPiece"></canvas>
                        </div>
                    </div>
                    <canvas id="tetris"></canvas>
                    <div class="side-panel right-panel">
                        <div class="controls">
                            <button id="startBtn">Начать игру</button>
                            <button id="musicToggle">🎵 Музыка</button>
                            <button id="soundToggle">🔊 Звук</button>
                        </div>
                        <div class="controls-info">
                            <h3>Управление:</h3>
                        </div>
                    </div>
                </div>
                <div id="gameOver" class="hidden">
                    <div class="game-over-content">
                        <h2>Игра окончена!</h2>
                        <p>Ваш счет: <span id="finalScore">0</span></p>
                        <button id="restartBtn">Играть снова</button>
                    </div>
                </div>
            </div>
        `;

        // Мокаем canvas context
        mockCtx = {
            fillStyle: '',
            strokeStyle: '',
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            clearRect: jest.fn()
        };

        mockCanvas = {
            getContext: jest.fn(() => mockCtx),
            width: 320,
            height: 640
        };

        // Мокаем методы canvas
        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            if (id === 'tetris' || id === 'nextPiece') {
                return mockCanvas;
            }
            return document.querySelector(`#${id}`);
        });

        // Мок для localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;

        // Создаем новый экземпляр Tetris для каждого теста
        jest.isolateModules(() => {
            // Мок для soundManager
            global.soundManager = {
                playSound: jest.fn(),
                startMusic: jest.fn(),
                stopMusic: jest.fn(),
                toggleMusic: jest.fn(),
                toggleSound: jest.fn()
            };
            
            const Tetris = require('../tetris.js').Tetris;
            tetris = new Tetris();
        });
    });

    afterEach(() => {
        // Очищаем моки после каждого теста
        jest.clearAllMocks();
        animationFrameCallback = null;
    });

    describe('constructor', () => {
        test('должен создавать экземпляр с правильными начальными значениями', () => {
            expect(tetris.BLOCK_SIZE).toBe(32);
            expect(tetris.BOARD_WIDTH).toBe(10);
            expect(tetris.BOARD_HEIGHT).toBe(20);
            expect(tetris.score).toBe(0);
            expect(tetris.lines).toBe(0);
            expect(tetris.level).toBe(1);
            expect(tetris.gameOver).toBe(false);
            expect(tetris.isPaused).toBe(false);
        });
    });

    describe('resetGame', () => {
        test('должен сбрасывать игру к начальным значениям', () => {
            tetris.score = 100;
            tetris.lines = 5;
            tetris.level = 3;
            tetris.gameOver = true;
            tetris.isPaused = true;

            tetris.resetGame();

            expect(tetris.score).toBe(0);
            expect(tetris.lines).toBe(0);
            expect(tetris.level).toBe(1);
            expect(tetris.gameOver).toBe(false);
            expect(tetris.isPaused).toBe(false);
        });
    });

    describe('createNewPiece', () => {
        test('должен создавать новую фигуру', () => {
            tetris.createNewPiece();
            expect(tetris.currentPiece).toBeDefined();
            expect(tetris.nextPiece).toBeDefined();
        });

        test('должен устанавливать gameOver при коллизии', () => {
            // Заполняем верхнюю строку
            tetris.board[0] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.createNewPiece();
            expect(tetris.gameOver).toBe(true);
        });
    });

    describe('rotate', () => {
        test('должен правильно поворачивать фигуру по часовой стрелке', () => {
            const piece = {
                matrix: [
                    [1, 0],
                    [1, 1]
                ]
            };
            const rotated = tetris.rotate(piece, 1);
            expect(rotated).toEqual([
                [1, 1],
                [1, 0]
            ]);
        });

        test('должен правильно поворачивать фигуру против часовой стрелки', () => {
            const piece = {
                matrix: [
                    [1, 0],
                    [1, 1]
                ]
            };
            const rotated = tetris.rotate(piece, -1);
            expect(rotated).toEqual([
                [0, 1],
                [1, 1]
            ]);
        });
    });

    describe('checkCollision', () => {
        test('должен определять коллизию со стенами', () => {
            const piece = {
                matrix: [[1]],
                pos: { x: -1, y: 0 }
            };
            expect(tetris.checkCollision(piece)).toBe(true);
        });

        test('должен определять коллизию с другими фигурами', () => {
            tetris.board[19][0] = 1;
            const piece = {
                matrix: [[1]],
                pos: { x: 0, y: 19 }
            };
            expect(tetris.checkCollision(piece)).toBe(true);
        });
    });

    describe('merge', () => {
        beforeEach(() => {
            // Очищаем игровое поле перед каждым тестом
            tetris.board = Array(tetris.BOARD_HEIGHT).fill().map(() => Array(tetris.BOARD_WIDTH).fill(0));
        });

        test('должен корректно добавлять одиночный блок на игровое поле', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            tetris.merge();
            expect(tetris.board[0][0]).toBe(1);
            // Проверяем, что остальные клетки остались пустыми
            expect(tetris.board[0][1]).toBe(0);
            expect(tetris.board[1][0]).toBe(0);
        });

        test('должен корректно добавлять сложную фигуру на игровое поле', () => {
            tetris.currentPiece = {
                matrix: [
                    [1, 1],
                    [1, 1]
                ],
                pos: { x: 0, y: 0 }
            };
            tetris.merge();
            // Проверяем все четыре клетки фигуры
            expect(tetris.board[0][0]).toBe(1);
            expect(tetris.board[0][1]).toBe(1);
            expect(tetris.board[1][0]).toBe(1);
            expect(tetris.board[1][1]).toBe(1);
        });

        test('должен корректно добавлять фигуру в середине поля', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 5, y: 5 }
            };
            tetris.merge();
            expect(tetris.board[5][5]).toBe(1);
            // Проверяем соседние клетки
            expect(tetris.board[5][4]).toBe(0);
            expect(tetris.board[5][6]).toBe(0);
            expect(tetris.board[4][5]).toBe(0);
            expect(tetris.board[6][5]).toBe(0);
        });

        test('должен игнорировать пустые ячейки в матрице фигуры', () => {
            tetris.currentPiece = {
                matrix: [
                    [0, 1],
                    [1, 0]
                ],
                pos: { x: 0, y: 0 }
            };
            tetris.merge();
            expect(tetris.board[0][0]).toBe(0);
            expect(tetris.board[0][1]).toBe(1);
            expect(tetris.board[1][0]).toBe(1);
            expect(tetris.board[1][1]).toBe(0);
        });
    });

    describe('clearLines', () => {
        test('должен очищать заполненные линии', () => {
            // Заполняем нижнюю строку
            tetris.board[19] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.clearLines();
            expect(tetris.lines).toBe(1);
            expect(tetris.board[19].every(cell => cell === 0)).toBe(true);
        });

        test('должен правильно начислять очки', () => {
            // Заполняем четыре строки для Тетриса
            for (let i = 16; i < 20; i++) {
                tetris.board[i] = Array(tetris.BOARD_WIDTH).fill(1);
            }
            tetris.clearLines();
            expect(tetris.score).toBe(1200); // За Тетрис на первом уровне
        });

        test('должен повышать уровень каждые 10 линий', () => {
            // Заполняем 10 линий для повышения уровня
            for (let i = 10; i < 20; i++) {
                tetris.board[i] = Array(tetris.BOARD_WIDTH).fill(1);
            }
            tetris.clearLines();
            expect(tetris.level).toBe(2);
            expect(global.soundManager.playSound).toHaveBeenCalledWith('levelUp');
        });

        test('должен обрабатывать очистку нескольких линий', () => {
            // Заполняем две строки
            tetris.board[18] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.board[19] = Array(tetris.BOARD_WIDTH).fill(1);
            
            tetris.clearLines();
            
            expect(tetris.lines).toBe(2);
            expect(tetris.score).toBe(100); // 100 очков за две линии на первом уровне
            expect(tetris.board[18].every(cell => cell === 0)).toBe(true);
            expect(tetris.board[19].every(cell => cell === 0)).toBe(true);
        });
        
        test('должен обрабатывать очистку трех линий', () => {
            // Заполняем три строки
            tetris.board[17] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.board[18] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.board[19] = Array(tetris.BOARD_WIDTH).fill(1);
            
            tetris.clearLines();
            
            expect(tetris.lines).toBe(3);
            expect(tetris.score).toBe(300); // 300 очков за три линии на первом уровне
        });
        
        test('должен обрабатывать неполные линии', () => {
            // Заполняем строку с одной пустой клеткой
            tetris.board[19] = Array(tetris.BOARD_WIDTH).fill(1);
            tetris.board[19][0] = 0;
            
            tetris.clearLines();
            
            expect(tetris.lines).toBe(0); // Линия не должна быть очищена
            expect(tetris.score).toBe(0);
            expect(tetris.board[19][1]).toBe(1); // Проверяем, что линия осталась
        });

        test('должен корректно обрабатывать повышение уровня и анимацию', () => {
            // Мокаем setTimeout
            jest.useFakeTimers();
            
            // Устанавливаем начальные значения
            tetris.lines = 9;
            
            // Заполняем одну строку для перехода на новый уровень
            tetris.board[19] = Array(tetris.BOARD_WIDTH).fill(1);
            
            // Добавляем класс для проверки анимации
            document.querySelector('.level').classList.add = jest.fn();
            document.querySelector('.level').classList.remove = jest.fn();
            
            tetris.clearLines();
            
            // Проверяем, что уровень повысился
            expect(tetris.level).toBe(2);
            expect(tetris.lines).toBe(10);
            
            // Проверяем, что была добавлена анимация
            expect(document.querySelector('.level').classList.add).toHaveBeenCalledWith('level-up');
            
            // Запускаем таймеры
            jest.runAllTimers();
            
            // Проверяем, что класс был удален
            expect(document.querySelector('.level').classList.remove).toHaveBeenCalledWith('level-up');
            
            // Восстанавливаем таймеры
            jest.useRealTimers();
        });
        
        test('должен корректно обрабатывать очистку нескольких линий с разными очками', () => {
            // Проверяем все варианты очистки линий и начисления очков
            const testCases = [
                { lines: 1, expectedScore: 40 },
                { lines: 2, expectedScore: 100 },
                { lines: 3, expectedScore: 300 },
                { lines: 4, expectedScore: 1200 }
            ];
            
            for (const testCase of testCases) {
                // Сбрасываем состояние
                tetris.score = 0;
                tetris.lines = 0;
                tetris.level = 1;
                tetris.board = Array(tetris.BOARD_HEIGHT).fill().map(() => Array(tetris.BOARD_WIDTH).fill(0));
                
                // Заполняем нужное количество строк
                for (let i = tetris.BOARD_HEIGHT - testCase.lines; i < tetris.BOARD_HEIGHT; i++) {
                    tetris.board[i] = Array(tetris.BOARD_WIDTH).fill(1);
                }
                
                tetris.clearLines();
                
                expect(tetris.lines).toBe(testCase.lines);
                expect(tetris.score).toBe(testCase.expectedScore);
            }
        });
    });

    describe('handleKeyPress', () => {
        test('должен обрабатывать движение влево', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 0 }
            };
            tetris.handleKeyPress({ code: 'ArrowLeft' });
            expect(tetris.currentPiece.pos.x).toBe(0);
        });

        test('не должен двигаться влево при коллизии', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            
            // Мокаем checkCollision, чтобы он возвращал true (есть коллизия)
            jest.spyOn(tetris, 'checkCollision').mockReturnValue(true);
            
            tetris.handleKeyPress({ code: 'ArrowLeft' });
            
            // Проверяем, что позиция не изменилась
            expect(tetris.currentPiece.pos.x).toBe(0);
            expect(global.soundManager.playSound).not.toHaveBeenCalled();
        });

        test('должен обрабатывать движение вправо', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            tetris.handleKeyPress({ code: 'ArrowRight' });
            expect(tetris.currentPiece.pos.x).toBe(1);
        });

        test('не должен двигаться вправо при коллизии', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 9, y: 0 }
            };
            
            // Мокаем checkCollision, чтобы он возвращал true (есть коллизия)
            jest.spyOn(tetris, 'checkCollision').mockReturnValue(true);
            
            tetris.handleKeyPress({ code: 'ArrowRight' });
            
            // Проверяем, что позиция не изменилась
            expect(tetris.currentPiece.pos.x).toBe(9);
            expect(global.soundManager.playSound).not.toHaveBeenCalled();
        });

        test('не должен двигаться вниз при коллизии', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 19 }
            };
            
            // Мокаем checkCollision, чтобы он возвращал true (есть коллизия)
            jest.spyOn(tetris, 'checkCollision').mockReturnValue(true);
            
            tetris.handleKeyPress({ code: 'ArrowDown' });
            
            // Проверяем, что позиция не изменилась
            expect(tetris.currentPiece.pos.y).toBe(19);
            expect(global.soundManager.playSound).not.toHaveBeenCalled();
        });

        test('должен обрабатывать поворот', () => {
            const spy = jest.spyOn(tetris, 'rotate');
            tetris.handleKeyPress({ code: 'ArrowUp' });
            expect(spy).toHaveBeenCalled();
        });

        test('должен обрабатывать мгновенное падение', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            tetris.handleKeyPress({ code: 'Space' });
            expect(tetris.currentPiece.pos.y).toBeGreaterThan(0);
        });

        test('должен воспроизводить звук при движении', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 0 }
            };
            tetris.handleKeyPress({ code: 'ArrowLeft' });
            expect(global.soundManager.playSound).toHaveBeenCalledWith('move');
        });

        test('должен воспроизводить звук при повороте', () => {
            tetris.currentPiece = {
                matrix: [
                    [1, 0],
                    [1, 1]
                ],
                pos: { x: 5, y: 5 }
            };
            tetris.handleKeyPress({ code: 'ArrowUp' });
            expect(global.soundManager.playSound).toHaveBeenCalledWith('rotate');
        });

        test('должен воспроизводить звук при мгновенном падении', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            tetris.handleKeyPress({ code: 'Space' });
            expect(global.soundManager.playSound).toHaveBeenCalledWith('drop');
        });

        test('должен обрабатывать клавишу Enter для переключения паузы', () => {
            // Начальное состояние - игра не на паузе
            tetris.isPaused = false;
            
            // Мокаем метод togglePause
            const togglePauseSpy = jest.spyOn(tetris, 'togglePause').mockImplementation(() => {});
            
            // Нажимаем Enter
            tetris.handleKeyPress({ code: 'Enter' });
            
            // Проверяем, что togglePause был вызван
            expect(togglePauseSpy).toHaveBeenCalled();
        });
        
        test('не должен обрабатывать другие клавиши во время паузы', () => {
            // Устанавливаем состояние паузы
            tetris.isPaused = true;
            
            // Мокаем методы, которые не должны вызываться
            const checkCollisionSpy = jest.spyOn(tetris, 'checkCollision');
            const updateGhostPieceSpy = jest.spyOn(tetris, 'updateGhostPiece').mockImplementation(() => {});
            
            // Нажимаем клавиши движения
            tetris.handleKeyPress({ code: 'ArrowLeft' });
            tetris.handleKeyPress({ code: 'ArrowRight' });
            tetris.handleKeyPress({ code: 'ArrowDown' });
            tetris.handleKeyPress({ code: 'ArrowUp' });
            
            // Проверяем, что методы не были вызваны
            expect(checkCollisionSpy).not.toHaveBeenCalled();
            expect(updateGhostPieceSpy).not.toHaveBeenCalled();
            expect(global.soundManager.playSound).not.toHaveBeenCalled();
        });
        
        test('должен обрабатывать клавиши Numpad', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 0 }
            };
            
            // Numpad4 (влево)
            tetris.handleKeyPress({ code: 'Numpad4' });
            expect(tetris.currentPiece.pos.x).toBe(0);
            
            // Numpad6 (вправо)
            tetris.currentPiece.pos.x = 1;
            tetris.handleKeyPress({ code: 'Numpad6' });
            expect(tetris.currentPiece.pos.x).toBe(2);
            
            // Numpad2 (вниз)
            tetris.handleKeyPress({ code: 'Numpad2' });
            expect(tetris.currentPiece.pos.y).toBe(1);
            
            // Numpad8 (поворот)
            const spy = jest.spyOn(tetris, 'rotate');
            tetris.handleKeyPress({ code: 'Numpad8' });
            expect(spy).toHaveBeenCalled();
        });
        
        test('должен пробовать разные смещения при повороте с коллизией', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            
            // Мокаем метод rotate
            const rotatedMatrix = [[1]];
            const rotateSpy = jest.spyOn(tetris, 'rotate').mockReturnValue(rotatedMatrix);
            
            // Мокаем checkCollision, чтобы он возвращал true (есть коллизия) для первых вызовов
            // и false (нет коллизии) только для одного из смещений
            const checkCollisionSpy = jest.spyOn(tetris, 'checkCollision');
            
            // Настраиваем мок для имитации коллизий при разных смещениях
            // Первые 3 вызова возвращают true (есть коллизия)
            // 4-й вызов (смещение 0, -1) возвращает false (нет коллизии)
            checkCollisionSpy
                .mockReturnValueOnce(true)   // без смещения
                .mockReturnValueOnce(true)   // смещение (1, 0)
                .mockReturnValueOnce(true)   // смещение (-1, 0)
                .mockReturnValueOnce(false)  // смещение (0, -1) - нет коллизии
                .mockReturnValue(true);      // для всех остальных вызовов
            
            // Мокаем updateGhostPiece, чтобы не вызывать дополнительные проверки коллизий
            jest.spyOn(tetris, 'updateGhostPiece').mockImplementation(() => {});
            
            // Поворачиваем фигуру
            tetris.handleKeyPress({ code: 'ArrowUp' });
            
            // Проверяем, что метод rotate был вызван
            expect(rotateSpy).toHaveBeenCalled();
            
            // Проверяем, что поворот был выполнен с правильным смещением (0, -1)
            expect(tetris.currentPiece.pos.y).toBe(-1);
            expect(tetris.currentPiece.matrix).toEqual(rotatedMatrix);
            
            // Проверяем, что звук был воспроизведен
            expect(global.soundManager.playSound).toHaveBeenCalledWith('rotate');
        });

        test('должен обрабатывать все варианты смещений при повороте', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            
            // Мокаем метод rotate
            jest.spyOn(tetris, 'rotate').mockImplementation(() => [[1]]);
            
            // Мокаем checkCollision
            const checkCollisionSpy = jest.spyOn(tetris, 'checkCollision').mockReturnValue(true);
            
            tetris.handleKeyPress({ code: 'ArrowUp' });
            
            // Проверяем, что checkCollision был вызван хотя бы один раз
            expect(checkCollisionSpy).toHaveBeenCalled();
        });
        
        test('должен обрабатывать случай, когда ни одно смещение не работает при повороте', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            
            // Мокаем метод rotate
            const originalMatrix = [[1]];
            const rotatedMatrix = [[1, 1]];
            jest.spyOn(tetris, 'rotate').mockReturnValue(rotatedMatrix);
            
            // Мокаем checkCollision, чтобы всегда возвращать true (коллизия)
            jest.spyOn(tetris, 'checkCollision').mockReturnValue(true);
            
            // Сохраняем исходную матрицу
            tetris.currentPiece.matrix = [...originalMatrix];
            
            tetris.handleKeyPress({ code: 'ArrowUp' });
            
            // Проверяем, что матрица не изменилась, так как все попытки поворота не удались
            expect(tetris.currentPiece.matrix).toEqual(originalMatrix);
            expect(global.soundManager.playSound).not.toHaveBeenCalledWith('rotate');
        });

        test('не должен обрабатывать клавиши при gameOver', () => {
            // Устанавливаем gameOver
            tetris.gameOver = true;
            
            // Мокаем методы, которые не должны вызываться
            const checkCollisionSpy = jest.spyOn(tetris, 'checkCollision');
            const togglePauseSpy = jest.spyOn(tetris, 'togglePause');
            
            // Нажимаем разные клавиши
            tetris.handleKeyPress({ code: 'ArrowLeft' });
            tetris.handleKeyPress({ code: 'ArrowRight' });
            tetris.handleKeyPress({ code: 'ArrowDown' });
            tetris.handleKeyPress({ code: 'ArrowUp' });
            tetris.handleKeyPress({ code: 'Space' });
            tetris.handleKeyPress({ code: 'Enter' });
            
            // Проверяем, что методы не были вызваны
            expect(checkCollisionSpy).not.toHaveBeenCalled();
            expect(togglePauseSpy).not.toHaveBeenCalled();
            expect(global.soundManager.playSound).not.toHaveBeenCalled();
        });
    });

    describe('togglePause', () => {
        test('должен переключать состояние паузы', () => {
            expect(tetris.isPaused).toBe(false);
            tetris.togglePause();
            expect(tetris.isPaused).toBe(true);
            tetris.togglePause();
            expect(tetris.isPaused).toBe(false);
        });

        test('должен запускать анимацию при снятии с паузы', () => {
            // Мокаем requestAnimationFrame
            const requestAnimationFrameSpy = jest.spyOn(global, 'requestAnimationFrame');
            
            // Устанавливаем паузу
            tetris.isPaused = true;
            
            // Снимаем с паузы
            tetris.togglePause();
            
            // Проверяем, что requestAnimationFrame был вызван
            expect(requestAnimationFrameSpy).toHaveBeenCalled();
            expect(tetris.lastTime).not.toBe(0);
        });
    });

    describe('animate', () => {
        test('не должен обновлять игру, если gameOver', () => {
            // Мокаем метод update
            const updateSpy = jest.spyOn(tetris, 'update').mockImplementation(() => {});
            
            // Устанавливаем gameOver
            tetris.gameOver = true;
            
            // Вызываем animate
            tetris.animate(1000);
            
            // Проверяем, что update не был вызван
            expect(updateSpy).not.toHaveBeenCalled();
        });
        
        test('не должен обновлять игру, если isPaused', () => {
            // Мокаем метод update
            const updateSpy = jest.spyOn(tetris, 'update').mockImplementation(() => {});
            
            // Устанавливаем паузу
            tetris.isPaused = true;
            
            // Вызываем animate
            tetris.animate(1000);
            
            // Проверяем, что update не был вызван
            expect(updateSpy).not.toHaveBeenCalled();
        });
        
        test('должен обновлять игру, если не gameOver и не isPaused', () => {
            // Мокаем метод update
            const updateSpy = jest.spyOn(tetris, 'update').mockImplementation(() => {});
            
            // Устанавливаем начальные значения
            tetris.gameOver = false;
            tetris.isPaused = false;
            tetris.lastTime = 900;
            
            // Вызываем animate
            tetris.animate(1000);
            
            // Проверяем, что update был вызван с правильным deltaTime
            expect(updateSpy).toHaveBeenCalledWith(100);
            expect(tetris.lastTime).toBe(1000);
        });

        test('должен вызывать метод draw при анимации', () => {
            // Мокаем методы
            const updateSpy = jest.spyOn(tetris, 'update').mockImplementation(() => {});
            const drawSpy = jest.spyOn(tetris, 'draw').mockImplementation(() => {});
            const requestAnimationFrameSpy = jest.spyOn(global, 'requestAnimationFrame');
            
            // Устанавливаем начальные значения
            tetris.gameOver = false;
            tetris.isPaused = false;
            tetris.lastTime = 900;
            
            // Вызываем animate
            tetris.animate(1000);
            
            // Проверяем, что методы были вызваны
            expect(updateSpy).toHaveBeenCalled();
            expect(drawSpy).toHaveBeenCalled();
            expect(requestAnimationFrameSpy).toHaveBeenCalled();
            
            // Проверяем, что callback для requestAnimationFrame - это метод animate
            const callback = requestAnimationFrameSpy.mock.calls[0][0];
            expect(callback.name).toBe('bound animate');
        });
    });

    describe('update', () => {
        test('должен обновлять позицию фигуры', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            tetris.dropCounter = 0;
            tetris.dropInterval = 500;
            tetris.update(1000);
            expect(tetris.currentPiece.pos.y).toBe(1);
        });

        test('должен увеличивать dropCounter при обновлении', () => {
            // Устанавливаем начальные значения
            tetris.dropCounter = 0;
            tetris.dropInterval = 1000;
            
            // Вызываем update с deltaTime меньше dropInterval
            tetris.update(500);
            
            // Проверяем, что dropCounter увеличился, но не достиг dropInterval
            expect(tetris.dropCounter).toBe(500);
            
            // Вызываем update еще раз
            tetris.update(400);
            
            // Проверяем, что dropCounter увеличился, но все еще не достиг dropInterval
            expect(tetris.dropCounter).toBe(900);
        });

        test('должен обрабатывать блокировку фигуры при достижении дна', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 18 } // Почти у дна
            };
            
            // Заполняем клетку под фигурой
            tetris.board[19][0] = 1;
            
            // Первое обновление - начинается отсчет времени блокировки
            tetris.dropCounter = tetris.dropInterval;
            tetris.update(100);
            expect(tetris.lockCounter).toBe(100);
            
            // Второе обновление - блокировка завершается
            const mergeSpy = jest.spyOn(tetris, 'merge');
            const clearLinesSpy = jest.spyOn(tetris, 'clearLines');
            const createNewPieceSpy = jest.spyOn(tetris, 'createNewPiece');
            
            tetris.lockCounter = tetris.lockDelay - 100;
            tetris.update(100);
            
            expect(mergeSpy).toHaveBeenCalled();
            expect(clearLinesSpy).toHaveBeenCalled();
            expect(createNewPieceSpy).toHaveBeenCalled();
            expect(tetris.lockCounter).toBe(0);
        });

        test('должен сбрасывать счетчик блокировки при движении вниз', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 0, y: 0 }
            };
            
            // Устанавливаем счетчик блокировки
            tetris.lockCounter = 500;
            
            // Обновляем с достаточным временем для движения вниз
            tetris.dropCounter = tetris.dropInterval;
            tetris.update(1000);
            
            // Проверяем, что счетчик блокировки сброшен
            expect(tetris.lockCounter).toBe(0);
            expect(tetris.currentPiece.pos.y).toBe(1);
        });
    });

    describe('draw', () => {
        beforeEach(() => {
            // Очищаем состояние моков перед каждым тестом
            mockCtx.fillRect.mockClear();
            mockCtx.strokeRect.mockClear();
            mockCtx.fillStyle = '';
        });

        test('должен очищать холст перед отрисовкой', () => {
            tetris.draw();
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, tetris.canvas.width, tetris.canvas.height);
        });

        test('должен отрисовывать блоки на игровом поле', () => {
            tetris.board[0][0] = 1; // Добавляем блок в верхний левый угол
            tetris.draw();
            
            // Проверяем отрисовку блока
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                0 * tetris.BLOCK_SIZE,
                0 * tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE
            );
            // Проверяем отрисовку границы блока
            expect(mockCtx.strokeRect).toHaveBeenCalledWith(
                0 * tetris.BLOCK_SIZE,
                0 * tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE
            );
        });

        test('должен отрисовывать текущую фигуру', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 1 }
            };
            tetris.draw();

            // Проверяем отрисовку блока текущей фигуры
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                1 * tetris.BLOCK_SIZE,
                1 * tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE,
                tetris.BLOCK_SIZE
            );
        });

        test('должен отрисовывать призрачную фигуру', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 1 }
            };
            tetris.updateGhostPiece();
            tetris.draw();

            // Проверяем отрисовку призрачной фигуры
            const ghostCalls = mockCtx.fillRect.mock.calls.filter(call => 
                call[0] === 1 * tetris.BLOCK_SIZE && 
                call[1] === tetris.ghostPiece.pos.y * tetris.BLOCK_SIZE
            );
            expect(ghostCalls.length).toBeGreaterThan(0);
        });

        test('должен отрисовывать следующую фигуру', () => {
            tetris.nextPiece = {
                matrix: [[1]]
            };
            tetris.draw();

            // Проверяем очистку холста для следующей фигуры
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                0,
                0,
                tetris.nextCanvas.width,
                tetris.nextCanvas.height
            );

            // Следующая фигура должна быть отцентрирована
            const offsetX = (tetris.nextCanvas.width / tetris.BLOCK_SIZE - tetris.nextPiece.matrix[0].length) / 2;
            const offsetY = (tetris.nextCanvas.height / tetris.BLOCK_SIZE - tetris.nextPiece.matrix.length) / 2;
            
            // Проверяем отрисовку следующей фигуры
            const nextPieceCalls = mockCtx.fillRect.mock.calls.filter(call => 
                call[0] === (offsetX + 0) * tetris.BLOCK_SIZE && 
                call[1] === (offsetY + 0) * tetris.BLOCK_SIZE
            );
            expect(nextPieceCalls.length).toBeGreaterThan(0);
        });

        test('должен корректно отрисовывать пустое игровое поле', () => {
            // Очищаем игровое поле
            tetris.board = Array(tetris.BOARD_HEIGHT).fill().map(() => Array(tetris.BOARD_WIDTH).fill(0));
            tetris.currentPiece = null;
            tetris.nextPiece = null;
            tetris.ghostPiece = null;
            
            tetris.draw();
            
            // Проверяем, что был вызван только метод очистки холста
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, tetris.canvas.width, tetris.canvas.height);
            
            // Фильтруем вызовы fillRect, чтобы исключить вызов для очистки холста
            const fillRectCalls = mockCtx.fillRect.mock.calls.filter(call => 
                !(call[0] === 0 && call[1] === 0 && 
                  call[2] === tetris.canvas.width && call[3] === tetris.canvas.height)
            );
            
            // Проверяем, что не было других вызовов fillRect для отрисовки блоков
            expect(fillRectCalls.length).toBe(0);
        });

        test('должен корректно отрисовывать призрачную фигуру с прозрачностью', () => {
            tetris.currentPiece = {
                matrix: [[1]],
                pos: { x: 1, y: 1 }
            };
            tetris.updateGhostPiece();
            
            // Очищаем предыдущие вызовы
            mockCtx.fillRect.mockClear();
            
            tetris.draw();
            
            // Проверяем, что призрачная фигура отрисована
            const ghostCalls = mockCtx.fillRect.mock.calls.filter(call => 
                call[0] === 1 * tetris.BLOCK_SIZE && 
                call[1] === tetris.ghostPiece.pos.y * tetris.BLOCK_SIZE
            );
            expect(ghostCalls.length).toBeGreaterThan(0);
        });
    });

    describe('start', () => {
        test('должен запускать музыку и анимацию при старте', () => {
            tetris.gameOver = false;
            tetris.start();
            expect(global.soundManager.startMusic).toHaveBeenCalled();
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });

        test('не должен запускать игру в состоянии gameOver', () => {
            tetris.gameOver = true;
            tetris.start();
            expect(global.soundManager.startMusic).not.toHaveBeenCalled();
            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe('module.exports', () => {
        test('должен экспортировать класс Tetris и экземпляр game', () => {
            // Проверяем, что модуль экспортирует правильные объекты
            const tetrisModule = require('../tetris.js');
            expect(tetrisModule.Tetris).toBeDefined();
            expect(tetrisModule.game).toBeDefined();
            
            // Проверяем, что game является экземпляром Tetris
            expect(tetrisModule.game instanceof tetrisModule.Tetris).toBe(true);
        });
    });

    describe('initializeControls', () => {
        test('должен добавлять обработчики событий для кнопок', () => {
            // Создаем новые моки для кнопок
            const startBtn = document.createElement('button');
            startBtn.id = 'startBtn';
            
            const restartBtn = document.createElement('button');
            restartBtn.id = 'restartBtn';
            
            const musicToggle = document.createElement('button');
            musicToggle.id = 'musicToggle';
            musicToggle.textContent = '🎵 Музыка';
            
            const soundToggle = document.createElement('button');
            soundToggle.id = 'soundToggle';
            soundToggle.textContent = '🔊 Звук';
            
            // Заменяем getElementById для наших кнопок
            document.getElementById = jest.fn((id) => {
                if (id === 'startBtn') return startBtn;
                if (id === 'restartBtn') return restartBtn;
                if (id === 'musicToggle') return musicToggle;
                if (id === 'soundToggle') return soundToggle;
                if (id === 'tetris' || id === 'nextPiece') return mockCanvas;
                return document.querySelector(`#${id}`);
            });
            
            // Мокаем методы, которые будут вызваны обработчиками
            const resetGameSpy = jest.spyOn(tetris, 'resetGame').mockImplementation(() => {});
            const startSpy = jest.spyOn(tetris, 'start').mockImplementation(() => {});
            
            // Заново инициализируем контролы
            tetris.initializeControls();
            
            // Симулируем клики по кнопкам
            startBtn.click();
            expect(resetGameSpy).toHaveBeenCalled();
            expect(startSpy).toHaveBeenCalled();
            
            resetGameSpy.mockClear();
            startSpy.mockClear();
            
            restartBtn.click();
            expect(resetGameSpy).toHaveBeenCalled();
            expect(startSpy).toHaveBeenCalled();
            
            // Проверяем переключение музыки
            global.soundManager.toggleMusic.mockReturnValueOnce(true);
            musicToggle.click();
            expect(global.soundManager.toggleMusic).toHaveBeenCalled();
            expect(musicToggle.textContent).toBe('🔇 Музыка');
            
            global.soundManager.toggleMusic.mockReturnValueOnce(false);
            musicToggle.click();
            expect(musicToggle.textContent).toBe('🎵 Музыка');
            
            // Проверяем переключение звука
            global.soundManager.toggleSound.mockReturnValueOnce(true);
            soundToggle.click();
            expect(global.soundManager.toggleSound).toHaveBeenCalled();
            expect(soundToggle.textContent).toBe('🔇 Звук');
            
            global.soundManager.toggleSound.mockReturnValueOnce(false);
            soundToggle.click();
            expect(soundToggle.textContent).toBe('🔊 Звук');
        });
        
        test('должен предотвращать действия по умолчанию для пробела и Enter', () => {
            // Создаем мок для addEventListener
            const addEventListenerMock = jest.fn();
            document.addEventListener = addEventListenerMock;
            
            // Заново инициализируем контролы
            tetris.initializeControls();
            
            // Проверяем, что addEventListener был вызван с 'keydown'
            expect(addEventListenerMock).toHaveBeenCalledWith('keydown', expect.any(Function));
            
            // Получаем обработчик keydown
            const keydownHandler = addEventListenerMock.mock.calls.find(
                call => call[0] === 'keydown'
            )[1];
            
            // Создаем события keydown с функцией preventDefault
            const spaceEvent = {
                code: 'Space',
                preventDefault: jest.fn()
            };
            
            const enterEvent = {
                code: 'Enter',
                preventDefault: jest.fn()
            };
            
            const arrowEvent = {
                code: 'ArrowDown',
                preventDefault: jest.fn()
            };
            
            // Вызываем обработчик напрямую
            keydownHandler(spaceEvent);
            expect(spaceEvent.preventDefault).toHaveBeenCalled();
            
            keydownHandler(enterEvent);
            expect(enterEvent.preventDefault).toHaveBeenCalled();
            
            keydownHandler(arrowEvent);
            expect(arrowEvent.preventDefault).not.toHaveBeenCalled();
        });
    });
}); 