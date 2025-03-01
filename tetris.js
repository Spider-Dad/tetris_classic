class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BLOCK_SIZE = 32;
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.ghostPiece = null;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.lockDelay = 1000;
        this.lockCounter = 0;
        
        this.colors = [
            null,
            '#FF0000', // I
            '#00FF00', // O
            '#0000FF', // T
            '#FFFF00', // S
            '#FF00FF', // Z
            '#00FFFF', // J
            '#FFA500'  // L
        ];
        
        this.pieces = [
            [[1, 1, 1, 1]],                         // I
            [[2, 2], [2, 2]],                       // O
            [[0, 3, 0], [3, 3, 3]],                // T
            [[0, 4, 4], [4, 4, 0]],                // S
            [[5, 5, 0], [0, 5, 5]],                // Z
            [[6, 0, 0], [6, 6, 6]],                // J
            [[0, 0, 7], [7, 7, 7]]                 // L
        ];
        
        this.initializeControls();
        this.resetGame();
    }
    
    initializeControls() {
        document.addEventListener('keydown', (event) => {
            // Предотвращаем действия по умолчанию для пробела и Enter
            if (event.code === 'Space' || event.code === 'Enter') {
                event.preventDefault();
            }
            this.handleKeyPress(event);
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.resetGame();
            this.start();
        });
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.start();
        });
        
        document.getElementById('musicToggle').addEventListener('click', () => {
            const isMusicMuted = soundManager.toggleMusic();
            document.getElementById('musicToggle').textContent = 
                isMusicMuted ? '🔇 Музыка' : '🎵 Музыка';
        });
        
        document.getElementById('soundToggle').addEventListener('click', () => {
            const isSoundMuted = soundManager.toggleSound();
            document.getElementById('soundToggle').textContent = 
                isSoundMuted ? '🔇 Звук' : '🔊 Звук';
        });
    }
    
    resetGame() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = performance.now();
        this.updateScore();
        this.createNewPiece();
        document.getElementById('gameOver').classList.add('hidden');
        soundManager.stopMusic();
    }
    
    start() {
        if (!this.gameOver) {
            this.lastTime = performance.now();
            soundManager.startMusic();
            requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTime = performance.now();
            requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    createNewPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.getRandomPiece();
        }
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.currentPiece.pos = {
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.matrix[0].length / 2),
            y: 0
        };
        this.updateGhostPiece();
        
        if (this.checkCollision()) {
            this.gameOver = true;
            soundManager.playSound('gameOver');
            document.getElementById('gameOver').classList.remove('hidden');
            document.getElementById('finalScore').textContent = this.score;
            soundManager.stopMusic();
        }
    }
    
    getRandomPiece() {
        const piece = {
            matrix: this.pieces[Math.floor(Math.random() * this.pieces.length)],
            pos: {x: 0, y: 0}
        };
        return piece;
    }
    
    updateGhostPiece() {
        this.ghostPiece = {
            matrix: this.currentPiece.matrix.map(row => [...row]),
            pos: {...this.currentPiece.pos}
        };
        
        while (!this.checkCollision(this.ghostPiece)) {
            this.ghostPiece.pos.y++;
        }
        this.ghostPiece.pos.y--;
    }
    
    rotate(piece, dir) {
        // Создаем глубокую копию матрицы
        const matrix = piece.matrix.map(row => [...row]);
        const N = matrix.length;
        const M = matrix[0].length;
        const result = Array(M).fill().map(() => Array(N).fill(0));
        
        if (dir > 0) { // по часовой стрелке
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < M; x++) {
                    result[x][N - 1 - y] = matrix[y][x];
                }
            }
        } else { // против часовой стрелки
            for (let y = 0; y < N; y++) {
                for (let x = 0; x < M; x++) {
                    result[M - 1 - x][y] = matrix[y][x];
                }
            }
        }
        
        return result;
    }
    
    checkCollision(piece = this.currentPiece) {
        const matrix = piece.matrix;
        const pos = piece.pos;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0 &&
                    (this.board[y + pos.y] === undefined ||
                     this.board[y + pos.y][x + pos.x] === undefined ||
                     this.board[y + pos.y][x + pos.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    merge() {
        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.board[y + this.currentPiece.pos.y][x + this.currentPiece.pos.x] = value;
                }
            });
        });
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    draw() {
        // Очистка холста
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка игрового поля
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.drawBlock(this.ctx, x, y, this.colors[value]);
                }
            });
        });
        
        // Отрисовка призрака
        if (this.ghostPiece) {
            this.ghostPiece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.ctx.fillRect(
                            (x + this.ghostPiece.pos.x) * this.BLOCK_SIZE,
                            (y + this.ghostPiece.pos.y) * this.BLOCK_SIZE,
                            this.BLOCK_SIZE, this.BLOCK_SIZE
                        );
                    }
                });
            });
        }
        
        // Отрисовка текущей фигуры
        if (this.currentPiece) {
            this.currentPiece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(
                            this.ctx,
                            x + this.currentPiece.pos.x,
                            y + this.currentPiece.pos.y,
                            this.colors[value]
                        );
                    }
                });
            });
        }
        
        // Отрисовка следующей фигуры
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = (this.nextCanvas.width / this.BLOCK_SIZE - this.nextPiece.matrix[0].length) / 2;
            const offsetY = (this.nextCanvas.height / this.BLOCK_SIZE - this.nextPiece.matrix.length) / 2;
            
            this.nextPiece.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.drawBlock(
                            this.nextCtx,
                            x + offsetX,
                            y + offsetY,
                            this.colors[value]
                        );
                    }
                });
            });
        }
    }
    
    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
    }
    
    handleKeyPress(event) {
        if (this.gameOver) return;
        
        // Обработка паузы должна работать даже когда игра на паузе
        if (event.code === 'Enter') {
            this.togglePause();
            return;
        }
        
        // Остальные клавиши не должны работать во время паузы
        if (this.isPaused) return;
        
        switch(event.code) {
            case 'ArrowLeft':
            case 'Numpad4':
                if (!this.checkCollision({
                    matrix: this.currentPiece.matrix,
                    pos: {x: this.currentPiece.pos.x - 1, y: this.currentPiece.pos.y}
                })) {
                    this.currentPiece.pos.x--;
                    this.updateGhostPiece();
                    soundManager.playSound('move');
                }
                break;
                
            case 'ArrowRight':
            case 'Numpad6':
                if (!this.checkCollision({
                    matrix: this.currentPiece.matrix,
                    pos: {x: this.currentPiece.pos.x + 1, y: this.currentPiece.pos.y}
                })) {
                    this.currentPiece.pos.x++;
                    this.updateGhostPiece();
                    soundManager.playSound('move');
                }
                break;
                
            case 'ArrowDown':
            case 'Numpad2':
                if (!this.checkCollision({
                    matrix: this.currentPiece.matrix,
                    pos: {x: this.currentPiece.pos.x, y: this.currentPiece.pos.y + 1}
                })) {
                    this.currentPiece.pos.y++;
                    this.dropCounter = 0;
                    soundManager.playSound('move');
                }
                break;
                
            case 'ArrowUp':
            case 'Numpad8':
                const rotatedMatrix = this.rotate(this.currentPiece, 1);
                const tryRotation = (offsetX = 0, offsetY = 0) => {
                    if (!this.checkCollision({
                        matrix: rotatedMatrix,
                        pos: {
                            x: this.currentPiece.pos.x + offsetX,
                            y: this.currentPiece.pos.y + offsetY
                        }
                    })) {
                        this.currentPiece.matrix = rotatedMatrix.map(row => [...row]);
                        this.currentPiece.pos.x += offsetX;
                        this.currentPiece.pos.y += offsetY;
                        return true;
                    }
                    return false;
                };

                const rotated = tryRotation() ||
                              tryRotation(1, 0) ||
                              tryRotation(-1, 0) ||
                              tryRotation(0, -1) ||
                              tryRotation(2, 0) ||
                              tryRotation(-2, 0);
                
                if (rotated) {
                    this.updateGhostPiece();
                    soundManager.playSound('rotate');
                }
                break;
                
            case 'Space':
                while (!this.checkCollision({
                    matrix: this.currentPiece.matrix,
                    pos: {x: this.currentPiece.pos.x, y: this.currentPiece.pos.y + 1}
                })) {
                    this.currentPiece.pos.y++;
                }
                this.lockCounter = this.lockDelay;
                soundManager.playSound('drop');
                break;
        }
    }
    
    update(deltaTime) {
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            if (!this.checkCollision({
                matrix: this.currentPiece.matrix,
                pos: {x: this.currentPiece.pos.x, y: this.currentPiece.pos.y + 1}
            })) {
                this.currentPiece.pos.y++;
                this.dropCounter = 0;
                this.lockCounter = 0;
            } else {
                this.lockCounter += deltaTime;
                if (this.lockCounter >= this.lockDelay) {
                    this.merge();
                    this.clearLines();
                    this.createNewPiece();
                    this.dropCounter = 0;
                    this.lockCounter = 0;
                }
            }
        }
    }
    
    animate(time = 0) {
        if (this.gameOver || this.isPaused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(this.animate.bind(this));
    }

    clearLines() {
        let linesCleared = 0;
        outer: for (let y = this.board.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Удаляем заполненную линию
            this.board.splice(y, 1);
            // Добавляем новую пустую линию сверху
            this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
            y++;
            linesCleared++;
        }
        
        if (linesCleared > 0) {
            soundManager.playSound('clear');
            this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = 1000 * Math.pow(0.85, this.level - 1);
            this.updateScore();
            
            if (Math.floor((this.lines - linesCleared) / 10) < Math.floor(this.lines / 10)) {
                soundManager.playSound('levelUp');
                document.querySelector('.level').classList.add('level-up');
                setTimeout(() => {
                    document.querySelector('.level').classList.remove('level-up');
                }, 500);
            }
        }
    }
}

// Инициализация игры
const game = new Tetris();

// Экспортируем класс для тестов
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Tetris, game };
} 