class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.gameContainer = document.querySelector('.grid-container');
        this.scoreDisplay = document.getElementById('score');
        this.createGameOverBanner();
        this.init();
    }

    createGameOverBanner() {
        const banner = document.createElement('div');
        banner.className = 'game-over-banner';
        
        const message = document.createElement('div');
        message.textContent = 'Game Over!';
        
        const scoreMessage = document.createElement('div');
        scoreMessage.className = 'score-message';
        
        const okButton = document.createElement('button');
        okButton.className = 'ok-button';
        okButton.textContent = 'OK';
        okButton.addEventListener('click', () => {
            this.gameOverBanner.classList.remove('show');
            this.resetGame();
        });
        
        banner.appendChild(message);
        banner.appendChild(scoreMessage);
        banner.appendChild(okButton);
        document.body.appendChild(banner);
        this.gameOverBanner = banner;
        this.scoreMessage = scoreMessage;
    }

    init() {
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });
    }

    handleKeyPress(event) {
        const keyActions = {
            'ArrowUp': () => this.move('up'),
            'ArrowDown': () => this.move('down'),
            'ArrowLeft': () => this.move('left'),
            'ArrowRight': () => this.move('right')
        };

        if (keyActions[event.key]) {
            event.preventDefault();
            const moved = keyActions[event.key]();
            if (moved) {
                this.addRandomTile();
                this.updateDisplay();
                setTimeout(() => {
                    if (this.isGameOver()) {
                        this.gameOver();
                    }
                }, 100);
            }
        }
    }

    move(direction) {
        let moved = false;
        const gridCopy = JSON.parse(JSON.stringify(this.grid));

        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        return moved;
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.grid[i].filter(cell => cell !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                    moved = true;
                }
            }
            const newRow = row.concat(Array(4 - row.length).fill(0));
            if (newRow.join(',') !== this.grid[i].join(',')) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.grid[i].filter(cell => cell !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    row.unshift(0);
                    moved = true;
                }
            }
            const newRow = Array(4 - row.length).fill(0).concat(row);
            if (newRow.join(',') !== this.grid[i].join(',')) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            let column = this.grid.map(row => row[j]).filter(cell => cell !== 0);
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                    moved = true;
                }
            }
            column = column.concat(Array(4 - column.length).fill(0));
            for (let i = 0; i < 4; i++) {
                if (this.grid[i][j] !== column[i]) {
                    moved = true;
                }
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            let column = this.grid.map(row => row[j]).filter(cell => cell !== 0);
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                    column.unshift(0);
                    moved = true;
                }
            }
            column = Array(4 - column.length).fill(0).concat(column);
            for (let i = 0; i < 4; i++) {
                if (this.grid[i][j] !== column[i]) {
                    moved = true;
                }
                this.grid[i][j] = column[i];
            }
        }
        return moved;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }
        if (emptyCells.length > 0) {
            const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateDisplay() {
        this.gameContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'grid-row';
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[i][j]}`;
                    tile.textContent = this.grid[i][j];
                    cell.appendChild(tile);
                }
                row.appendChild(cell);
            }
            this.gameContainer.appendChild(row);
        }
        this.scoreDisplay.textContent = this.score;
    }

    isGameOver() {
        // Check for empty cells
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                if (
                    (i < 3 && current === this.grid[i + 1][j]) ||
                    (j < 3 && current === this.grid[i][j + 1])
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    resetGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.init();
    }

    gameOver() {
        this.scoreMessage.textContent = `Final Score: ${this.score}`;
        this.gameOverBanner.classList.add('show');
    }
}

// Start the game
new Game2048(); 