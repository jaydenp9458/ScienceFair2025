document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const GRID_SIZE = 28;
    const GRID_HEIGHT = 31;
    const CELL_SIZE = 20;
    const GAME_SPEED = 150; // milliseconds between updates
    const GHOST_SPEED = 200; // milliseconds between ghost updates
    const POWER_PELLET_DURATION = 10000; // 10 seconds
    const POWER_PELLET_SCORE = 50;
    const DOT_SCORE = 10;
    const GHOST_SCORE = 200;
    const ANIMATION_SPEED = 100; // Faster animation speed
    
    const DIRECTIONS = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };
    
    // Game state
    let gameBoard = [];
    let pacman = {
        x: 14,
        y: 23,
        direction: 'right',
        nextDirection: 'right',
        isMoving: false
    };
    let ghosts = [
        { x: 12, y: 14, color: 'red', direction: 'right', isFrightened: false },
        { x: 13, y: 14, color: 'pink', direction: 'left', isFrightened: false },
        { x: 14, y: 14, color: 'cyan', direction: 'up', isFrightened: false },
        { x: 15, y: 14, color: 'orange', direction: 'down', isFrightened: false }
    ];
    let score = 0;
    let highScore = localStorage.getItem('pacmanHighScore') || 0;
    let lives = 3;
    let gameInterval;
    let ghostInterval;
    let powerPelletTimer;
    let isGameRunning = false;
    let isGamePaused = false;
    
    // DOM elements
    const gameBoardElement = document.getElementById('gameBoard');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const livesElement = document.getElementById('lives');
    const startButton = document.getElementById('startGame');
    const resetButton = document.getElementById('resetGame');
    
    // Mobile controls
    const upButton = document.getElementById('upBtn');
    const downButton = document.getElementById('downBtn');
    const leftButton = document.getElementById('leftBtn');
    const rightButton = document.getElementById('rightBtn');
    
    // Initialize the game
    function initGame() {
        createGameBoard();
        renderGameBoard();
        updateLives();
        setupEventListeners();
        loadHighScore();
    }
    
    // Create the game board
    function createGameBoard() {
        // Create an empty board
        for (let y = 0; y < GRID_HEIGHT; y++) {
            gameBoard[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                gameBoard[y][x] = 0; // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet
            }
        }
        
        // Classic Pac-Man maze layout
        const mazeLayout = [
            "1111111111111111111111111111",
            "1222222222222112222222222221",
            "1211112111112112111112111121",
            "1311112111112112111112111131",
            "1211112111112112111112111121",
            "1222222222222222222222222221",
            "1211112112111111112112111121",
            "1211112112111111112112111121",
            "1222222112222112222112222221",
            "1111112111110110111112111111",
            "1111112111110110111112111111",
            "1111112110000000000112111111",
            "1111112110111111110112111111",
            "1111112110100000010112111111",
            "0000002000100000010002000000",
            "1111112110100000010112111111",
            "1111112110111111110112111111",
            "1111112110111111110112111111",
            "1111112110111111110112111111",
            "1111112110111111110112111111",
            "1222222222222112222222222221",
            "1211112111112112111112111121",
            "1211112111112112111112111121",
            "1322112222222222222222112231",
            "1112112112111111112112112111",
            "1112112112111111112112112111",
            "1222222112222112222112222221",
            "1211111111112112111111111121",
            "1211111111112112111111111121",
            "1222222222222222222222222221",
            "1111111111111111111111111111"
        ];
        
        // Create the board based on the maze layout
        for (let y = 0; y < mazeLayout.length; y++) {
            for (let x = 0; x < mazeLayout[y].length; x++) {
                const cell = mazeLayout[y][x];
                if (cell === '1') {
                    gameBoard[y][x] = 1; // Wall
                } else if (cell === '2') {
                    gameBoard[y][x] = 2; // Dot
                } else if (cell === '3') {
                    gameBoard[y][x] = 3; // Power pellet
                } else {
                    gameBoard[y][x] = 0; // Empty
                }
            }
        }
        
        // Create a 2-block wide one-way passage at y=12 only
        gameBoard[12][13] = 0;
        gameBoard[12][14] = 0;
        
        // Add dots everywhere except in the center box and passage
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                // Skip walls and power pellets
                if (gameBoard[y][x] === 1 || gameBoard[y][x] === 3) {
                    continue;
                }
                
                // Skip the center box area (ghost house)
                if (y >= 13 && y <= 17 && x >= 12 && x <= 15) {
                    continue;
                }
                
                // Skip the passage at y=12
                if (y === 12 && (x === 13 || x === 14)) {
                    continue;
                }
                
                // Skip the left and right sides of the center box
                if (y >= 13 && y <= 17 && (x === 11 || x === 16)) {
                    continue;
                }
                
                // Add a dot to all other empty spaces
                if (gameBoard[y][x] === 0) {
                    gameBoard[y][x] = 2;
                }
            }
        }
    }
    
    // Render the game board
    function renderGameBoard() {
        gameBoardElement.innerHTML = '';
        gameBoardElement.style.width = `${GRID_SIZE * CELL_SIZE}px`;
        gameBoardElement.style.height = `${GRID_HEIGHT * CELL_SIZE}px`;
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.width = `${CELL_SIZE}px`;
                cell.style.height = `${CELL_SIZE}px`;
                cell.setAttribute('data-y', y); // Add data-y attribute for row highlighting
                
                if (gameBoard[y][x] === 1) {
                    cell.classList.add('wall');
                } else if (gameBoard[y][x] === 2) {
                    cell.classList.add('dot');
                } else if (gameBoard[y][x] === 3) {
                    cell.classList.add('power-pellet');
                }
                
                gameBoardElement.appendChild(cell);
            }
        }
        
        renderPacman();
        renderGhosts();
    }
    
    // Render Pac-Man
    function renderPacman() {
        // Remove all existing Pac-Man elements first
        const existingPacmen = document.querySelectorAll('.pacman');
        existingPacmen.forEach(pacman => pacman.remove());
        
        const pacmanElement = document.createElement('div');
        pacmanElement.className = 'pacman';
        
        // Position Pac-Man
        const cellIndex = pacman.y * GRID_SIZE + pacman.x;
        const cells = gameBoardElement.querySelectorAll('.cell');
        if (cells[cellIndex]) {
            cells[cellIndex].appendChild(pacmanElement);
            
            // Set direction - make mouth face the direction of movement
            let rotation = 0;
            switch (pacman.direction) {
                case 'up':
                    rotation = 270;
                    break;
                case 'down':
                    rotation = 90;
                    break;
                case 'left':
                    rotation = 180;
                    break;
                case 'right':
                    rotation = 0;
                    break;
            }
            
            // Apply rotation to make mouth face the direction of movement
            pacmanElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
    }
    
    // Render ghosts
    function renderGhosts() {
        ghosts.forEach(ghost => {
            const ghostElement = document.createElement('div');
            ghostElement.className = 'ghost';
            
            // Set ghost color based on frightened state
            if (ghost.isFrightened) {
                ghostElement.style.backgroundColor = '#87CEEB'; // Pale blue color for frightened ghosts
            } else {
                ghostElement.style.backgroundColor = ghost.color;
            }
            
            // Position ghost
            const cellIndex = ghost.y * GRID_SIZE + ghost.x;
            const cells = gameBoardElement.querySelectorAll('.cell');
            if (cells[cellIndex]) {
                cells[cellIndex].appendChild(ghostElement);
                
                // Add frightened class if needed
                if (ghost.isFrightened) {
                    ghostElement.classList.add('frightened');
                }
            }
        });
    }
    
    // Update Pac-Man position
    function updatePacmanPosition() {
        // Remove current Pac-Man
        const currentPacman = document.querySelector('.pacman');
        if (currentPacman) {
            currentPacman.remove();
        }
        
        // Update position based on direction
        if (pacman.nextDirection !== pacman.direction) {
            // Try to change direction - allow 180-degree turns
            const canChangeDirection = canMove(pacman.x, pacman.y, pacman.nextDirection);
            if (canChangeDirection) {
                pacman.direction = pacman.nextDirection;
            }
        }
        
        // Move in current direction
        const canMoveInDirection = canMove(pacman.x, pacman.y, pacman.direction);
        if (canMoveInDirection) {
            pacman.isMoving = true;
            
            // Update position
            switch (pacman.direction) {
                case 'up':
                    pacman.y--;
                    break;
                case 'down':
                    pacman.y++;
                    break;
                case 'left':
                    pacman.x--;
                    break;
                case 'right':
                    pacman.x++;
                    break;
            }
            
            // Check for tunnel
            if (pacman.x < 0) {
                pacman.x = GRID_SIZE - 1;
            } else if (pacman.x >= GRID_SIZE) {
                pacman.x = 0;
            }
            
            // Check for dots or power pellets
            if (gameBoard[pacman.y][pacman.x] === 2) {
                // Dot
                gameBoard[pacman.y][pacman.x] = 0;
                score += DOT_SCORE;
                updateScore();
                
                // Remove dot from screen
                const cellIndex = pacman.y * GRID_SIZE + pacman.x;
                const cells = gameBoardElement.querySelectorAll('.cell');
                if (cells[cellIndex]) {
                    cells[cellIndex].classList.remove('dot');
                }
                
                // Check if all pellets are eaten
                checkAllPelletsEaten();
            } else if (gameBoard[pacman.y][pacman.x] === 3) {
                // Power pellet
                gameBoard[pacman.y][pacman.x] = 0;
                score += POWER_PELLET_SCORE;
                updateScore();
                
                // Remove power pellet from screen
                const cellIndex = pacman.y * GRID_SIZE + pacman.x;
                const cells = gameBoardElement.querySelectorAll('.cell');
                if (cells[cellIndex]) {
                    cells[cellIndex].classList.remove('power-pellet');
                }
                
                // Check if all pellets are eaten
                checkAllPelletsEaten();
                
                activatePowerPellet();
            }
        } else {
            pacman.isMoving = false;
        }
        
        // Render Pac-Man in new position
        renderPacman();
    }
    
    // Check if two directions are opposite (180-degree turn)
    function isOppositeDirection(dir1, dir2) {
        return (dir1 === 'up' && dir2 === 'down') ||
               (dir1 === 'down' && dir2 === 'up') ||
               (dir1 === 'left' && dir2 === 'right') ||
               (dir1 === 'right' && dir2 === 'left');
    }
    
    // Update ghost positions
    function updateGhostPositions() {
        // Remove all ghosts
        const ghostElements = document.querySelectorAll('.ghost');
        ghostElements.forEach(element => element.remove());
        
        // Store original positions before any movement
        const originalPositions = ghosts.map(ghost => ({ x: ghost.x, y: ghost.y }));
        
        // Update each ghost
        ghosts.forEach((ghost, index) => {
            // Check if ghost is inside the central cube
            const isInsideCentralCube = (ghost.y >= 13 && ghost.y <= 17) && (ghost.x >= 12 && ghost.x <= 15);
            
            // Check if ghost is stuck in a specific spot under the center block
            const isStuckUnderCenter = (ghost.y === 18) && (ghost.x >= 13 && ghost.x <= 14);
            
            // Check if ghost is in the row below the blue blocks
            const isBelowBlueBlocks = (ghost.y === 19) && (ghost.x >= 12 && ghost.x <= 15);
            
            // If ghost is inside the central cube, prioritize moving toward the exit
            if (isInsideCentralCube) {
                // Special handling for left and right ghosts
                if (index === 0) { // Red ghost (left)
                    // First move right to the center
                    if (ghost.x < 14) {
                        ghost.direction = 'right';
                    } 
                    // Then move up to escape
                    else if (ghost.y > 12) {
                        ghost.direction = 'up';
                    }
                    // If at the exit level, move up to escape
                    else if (ghost.y === 12) {
                        ghost.direction = 'up';
                    }
                } 
                else if (index === 3) { // Orange ghost (right)
                    // First move left to the center
                    if (ghost.x > 14) {
                        ghost.direction = 'left';
                    } 
                    // Then move up to escape
                    else if (ghost.y > 12) {
                        ghost.direction = 'up';
                    }
                    // If at the exit level, move up to escape
                    else if (ghost.y === 12) {
                        ghost.direction = 'up';
                    }
                }
                // For middle ghosts, use the standard escape logic
                else {
                    // First try to move up to the exit
                    if (ghost.y > 12) {
                        ghost.direction = 'up';
                    } 
                    // If at the exit level, move toward the passage
                    else if (ghost.y === 12) {
                        if (ghost.x < 13) {
                            ghost.direction = 'right';
                        } else if (ghost.x > 14) {
                            ghost.direction = 'left';
                        } else {
                            // If in the passage, move up to exit
                            ghost.direction = 'up';
                        }
                    }
                    // If at the top level, move toward the passage
                    else if (ghost.y === 11) {
                        if (ghost.x < 13) {
                            ghost.direction = 'right';
                        } else if (ghost.x > 14) {
                            ghost.direction = 'left';
                        } else {
                            // If in the passage, move left or right to exit
                            ghost.direction = ghost.x <= 13 ? 'right' : 'left';
                        }
                    }
                }
            } else if (isStuckUnderCenter) {
                // Force ghost to move up to escape
                ghost.direction = 'up';
            } else if (isBelowBlueBlocks) {
                // If ghost is below the blue blocks, prioritize moving down to escape
                if (canGhostMove(ghost.x, ghost.y, 'down')) {
                    ghost.direction = 'down';
                } else {
                    // If can't move down, try to move horizontally
                    if (ghost.x <= 13 && canGhostMove(ghost.x, ghost.y, 'left')) {
                        ghost.direction = 'left';
                    } else if (ghost.x >= 14 && canGhostMove(ghost.x, ghost.y, 'right')) {
                        ghost.direction = 'right';
                    } else {
                        // If all else fails, try any available direction
                        const availableDirections = ['up', 'down', 'left', 'right'].filter(dir => 
                            canGhostMove(ghost.x, ghost.y, dir)
                        );
                        if (availableDirections.length > 0) {
                            const randomIndex = Math.floor(Math.random() * availableDirections.length);
                            ghost.direction = availableDirections[randomIndex];
                        }
                    }
                }
            } else {
                // Normal ghost movement - avoid getting stuck by checking for dead ends
                const possibleDirections = ['up', 'down', 'left', 'right'].filter(dir => 
                    canGhostMove(ghost.x, ghost.y, dir) && dir !== getOppositeDirection(ghost.direction)
                );
                
                if (possibleDirections.length > 0) {
                    // Prefer directions that lead to more open spaces
                    const bestDirections = possibleDirections.filter(dir => {
                        const nextX = ghost.x + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0);
                        const nextY = ghost.y + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0);
                        
                        // Count available directions from the next position
                        const availableFromNext = ['up', 'down', 'left', 'right'].filter(d => 
                            canGhostMove(nextX, nextY, d)
                        ).length;
                        
                        // Prefer directions that lead to more options
                        return availableFromNext > 1;
                    });
                    
                    if (bestDirections.length > 0) {
                        const randomIndex = Math.floor(Math.random() * bestDirections.length);
                        ghost.direction = bestDirections[randomIndex];
                    } else {
                        // If no good directions, just pick a random one
                        const randomIndex = Math.floor(Math.random() * possibleDirections.length);
                        ghost.direction = possibleDirections[randomIndex];
                    }
                } else {
                    // If no possible directions, try any direction that doesn't hit a wall
                    const anyDirection = ['up', 'down', 'left', 'right'].find(dir => canGhostMove(ghost.x, ghost.y, dir));
                    if (anyDirection) {
                        ghost.direction = anyDirection;
                    } else {
                        // Last resort - reverse direction
                        ghost.direction = getOppositeDirection(ghost.direction);
                    }
                }
            }
            
            // Store current position before moving
            const oldX = ghost.x;
            const oldY = ghost.y;
            
            // Move ghost
            switch (ghost.direction) {
                case 'up':
                    ghost.y--;
                    break;
                case 'down':
                    ghost.y++;
                    break;
                case 'left':
                    ghost.x--;
                    break;
                case 'right':
                    ghost.x++;
                    break;
            }
            
            // Check for tunnel
            if (ghost.x < 0) {
                ghost.x = GRID_SIZE - 1;
            } else if (ghost.x >= GRID_SIZE) {
                ghost.x = 0;
            }
            
            // Check if ghost hit a wall and revert position if needed
            if (gameBoard[ghost.y][ghost.x] === 1) {
                // Revert to previous position
                ghost.x = oldX;
                ghost.y = oldY;
                
                // Try to find a new direction
                const possibleDirections = ['up', 'down', 'left', 'right'].filter(dir => 
                    canGhostMove(ghost.x, ghost.y, dir)
                );
                
                if (possibleDirections.length > 0) {
                    const randomIndex = Math.floor(Math.random() * possibleDirections.length);
                    ghost.direction = possibleDirections[randomIndex];
                }
            }
        });
        
        // Check for ghost collisions with each other and fix them
        for (let i = 0; i < ghosts.length; i++) {
            for (let j = i + 1; j < ghosts.length; j++) {
                if (ghosts[i].x === ghosts[j].x && ghosts[i].y === ghosts[j].y) {
                    // Ghosts collided, revert to original positions
                    ghosts[i].x = originalPositions[i].x;
                    ghosts[i].y = originalPositions[i].y;
                    ghosts[j].x = originalPositions[j].x;
                    ghosts[j].y = originalPositions[j].y;
                    
                    // Try to find new directions for both ghosts
                    const possibleDirectionsI = ['up', 'down', 'left', 'right'].filter(dir => 
                        canGhostMove(ghosts[i].x, ghosts[i].y, dir)
                    );
                    const possibleDirectionsJ = ['up', 'down', 'left', 'right'].filter(dir => 
                        canGhostMove(ghosts[j].x, ghosts[j].y, dir)
                    );
                    
                    if (possibleDirectionsI.length > 0) {
                        const randomIndex = Math.floor(Math.random() * possibleDirectionsI.length);
                        ghosts[i].direction = possibleDirectionsI[randomIndex];
                    }
                    
                    if (possibleDirectionsJ.length > 0) {
                        const randomIndex = Math.floor(Math.random() * possibleDirectionsJ.length);
                        ghosts[j].direction = possibleDirectionsJ[randomIndex];
                    }
                }
            }
        }
        
        // Render ghosts in new positions
        renderGhosts();
    }
    
    // Check if Pac-Man can move in a direction
    function canMove(x, y, direction) {
        let newX = x;
        let newY = y;
        
        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        // Check for tunnel
        if (newX < 0 || newX >= GRID_SIZE) {
            return true;
        }
        
        // Check if the new position is a wall
        if (gameBoard[newY][newX] === 1) {
            return false;
        }
        
        // Check for one-way passage at y=12 (can only exit, not enter)
        if (newY === 12 && (newX === 13 || newX === 14) && 
            (y === 11 || y === 13) && (x === 13 || x === 14)) {
            return false;
        }
        
        return true;
    }
    
    // Check if a ghost can move in a direction
    function canGhostMove(x, y, direction) {
        let newX = x;
        let newY = y;
        
        switch (direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        // Check for tunnel
        if (newX < 0 || newX >= GRID_SIZE) {
            return true;
        }
        
        // Special passage for ghosts at y=17 (2-block passage)
        if (newY === 17 && (newX === 13 || newX === 14)) {
            return true;
        }
        
        // Special passage for ghosts at y=19 (below blue blocks)
        if (newY === 19 && newX >= 12 && newX <= 15) {
            return true;
        }
        
        // Check for one-way passage at y=12 (can only exit, not enter)
        if (newY === 12 && (newX === 13 || newX === 14) && 
            (y === 11 || y === 13) && (x === 13 || x === 14)) {
            return false;
        }
        
        // Check for walls - ghosts cannot pass through walls
        if (gameBoard[newY][newX] === 1) {
            return false;
        }
        
        return true;
    }
    
    // Get opposite direction
    function getOppositeDirection(direction) {
        switch (direction) {
            case 'up':
                return 'down';
            case 'down':
                return 'up';
            case 'left':
                return 'right';
            case 'right':
                return 'left';
            default:
                return direction;
        }
    }
    
    // Activate power pellet
    function activatePowerPellet() {
        // Make ghosts frightened
        ghosts.forEach(ghost => {
            ghost.isFrightened = true;
        });
        
        // Clear existing timer
        if (powerPelletTimer) {
            clearTimeout(powerPelletTimer);
        }
        
        // Set timer to deactivate power pellet
        powerPelletTimer = setTimeout(() => {
            ghosts.forEach(ghost => {
                ghost.isFrightened = false;
            });
            renderGhosts();
        }, POWER_PELLET_DURATION);
        
        // Update ghost appearance
        renderGhosts();
    }
    
    // Check for collisions
    function checkCollisions() {
        for (const ghost of ghosts) {
            if (pacman.x === ghost.x && pacman.y === ghost.y) {
                if (ghost.isFrightened) {
                    // Eat ghost
                    score += GHOST_SCORE;
                    updateScore();
                    
                    // Reset ghost position
                    ghost.x = 14;
                    ghost.y = 14;
                    ghost.isFrightened = false;
                } else {
                    // Pac-Man dies
                    loseLife();
                }
            }
        }
    }
    
    // Lose a life
    function loseLife() {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            gameOver();
        } else {
            resetPositions();
        }
    }
    
    // Reset positions
    function resetPositions() {
        // Reset Pac-Man
        pacman.x = 14;
        pacman.y = 23;
        pacman.direction = 'right';
        pacman.nextDirection = 'right';
        
        // Reset ghosts
        ghosts[0].x = 12;
        ghosts[0].y = 14;
        ghosts[0].direction = 'right';
        
        ghosts[1].x = 13;
        ghosts[1].y = 14;
        ghosts[1].direction = 'left';
        
        ghosts[2].x = 14;
        ghosts[2].y = 14;
        ghosts[2].direction = 'up';
        
        ghosts[3].x = 15;
        ghosts[3].y = 14;
        ghosts[3].direction = 'down';
        
        // Reset frightened state
        ghosts.forEach(ghost => {
            ghost.isFrightened = false;
        });
        
        // Clear power pellet timer
        if (powerPelletTimer) {
            clearTimeout(powerPelletTimer);
            powerPelletTimer = null;
        }
        
        // Render game
        renderGameBoard();
    }
    
    // Update score
    function updateScore() {
        scoreElement.textContent = score;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('pacmanHighScore', highScore);
        }
    }
    
    // Update lives display
    function updateLives() {
        livesElement.innerHTML = '';
        
        for (let i = 0; i < lives; i++) {
            const lifeElement = document.createElement('div');
            lifeElement.className = 'life';
            livesElement.appendChild(lifeElement);
        }
    }
    
    // Load high score from localStorage
    function loadHighScore() {
        const savedHighScore = localStorage.getItem('pacmanHighScore');
        if (savedHighScore) {
            highScore = parseInt(savedHighScore);
            highScoreElement.textContent = highScore;
        }
    }
    
    // Game over
    function gameOver() {
        clearInterval(gameInterval);
        clearInterval(ghostInterval);
        isGameRunning = false;
        startButton.textContent = 'Start Game';
        alert('Game Over! Your score: ' + score);
    }
    
    // Start game
    function startGame() {
        if (isGameRunning) {
            // Pause game
            clearInterval(gameInterval);
            clearInterval(ghostInterval);
            isGameRunning = false;
            isGamePaused = true;
            startButton.textContent = 'Resume Game';
        } else {
            // Start or resume game
            if (isGamePaused) {
                isGamePaused = false;
            } else {
                // New game
                resetGame();
            }
            
            gameInterval = setInterval(() => {
                updatePacmanPosition();
                checkCollisions();
            }, GAME_SPEED);
            
            ghostInterval = setInterval(() => {
                updateGhostPositions();
                checkCollisions();
            }, GHOST_SPEED);
            
            isGameRunning = true;
            startButton.textContent = 'Pause Game';
        }
    }
    
    // Reset game
    function resetGame() {
        // Reset game state
        score = 0;
        lives = 3;
        pacman.x = 14;
        pacman.y = 23;
        pacman.direction = 'right';
        pacman.nextDirection = 'right';
        
        // Reset ghosts to their original positions
        ghosts[0].x = 12;
        ghosts[0].y = 14;
        ghosts[0].direction = 'right';
        
        ghosts[1].x = 13;
        ghosts[1].y = 14;
        ghosts[1].direction = 'left';
        
        ghosts[2].x = 14;
        ghosts[2].y = 14;
        ghosts[2].direction = 'up';
        
        ghosts[3].x = 15;
        ghosts[3].y = 14;
        ghosts[3].direction = 'down';
        
        // Reset frightened state
        ghosts.forEach(ghost => {
            ghost.isFrightened = false;
        });
        
        // Clear intervals
        clearInterval(gameInterval);
        clearInterval(ghostInterval);
        
        // Clear power pellet timer
        if (powerPelletTimer) {
            clearTimeout(powerPelletTimer);
            powerPelletTimer = null;
        }
        
        // Reset board
        createGameBoard();
        renderGameBoard();
        updateScore();
        updateLives();
        
        isGameRunning = false;
        isGamePaused = false;
        startButton.textContent = 'Start Game';
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!isGameRunning) {
                startGame();
                return;
            }
            
            switch (e.key) {
                case 'ArrowUp':
                    pacman.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    pacman.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    pacman.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    pacman.nextDirection = 'right';
                    break;
            }
        });
        
        // Button controls
        startButton.addEventListener('click', startGame);
        resetButton.addEventListener('click', resetGame);
        
        // Mobile controls
        upButton.addEventListener('click', () => {
            if (!isGameRunning) {
                startGame();
                return;
            }
            pacman.nextDirection = 'up';
        });
        
        downButton.addEventListener('click', () => {
            if (!isGameRunning) {
                startGame();
                return;
            }
            pacman.nextDirection = 'down';
        });
        
        leftButton.addEventListener('click', () => {
            if (!isGameRunning) {
                startGame();
                return;
            }
            pacman.nextDirection = 'left';
        });
        
        rightButton.addEventListener('click', () => {
            if (!isGameRunning) {
                startGame();
                return;
            }
            pacman.nextDirection = 'right';
        });
    }
    
    // Check if all pellets are eaten and reset the board if needed
    function checkAllPelletsEaten() {
        let pelletsRemaining = 0;
        
        // Count remaining pellets
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (gameBoard[y][x] === 2 || gameBoard[y][x] === 3) {
                    pelletsRemaining++;
                }
            }
        }
        
        // If no pellets remain, reset the board
        if (pelletsRemaining === 0) {
            // Store current score and lives
            const currentScore = score;
            const currentLives = lives;
            
            // Completely reset the game
            completeGameReset();
            
            // Restore score and lives
            score = currentScore;
            lives = currentLives;
            
            // Update the display
            updateScore();
            updateLives();
        }
    }
    
    // Complete game reset while preserving score and lives
    function completeGameReset() {
        // Stop all game intervals
        clearInterval(gameInterval);
        clearInterval(ghostInterval);
        
        // Clear power pellet timer
        if (powerPelletTimer) {
            clearTimeout(powerPelletTimer);
            powerPelletTimer = null;
        }
        
        // Remove all existing game elements
        const existingPacman = document.querySelector('.pacman');
        if (existingPacman) {
            existingPacman.remove();
        }
        
        const existingGhosts = document.querySelectorAll('.ghost');
        existingGhosts.forEach(ghost => ghost.remove());
        
        // Clear the game board
        gameBoard = [];
        
        // Reset Pac-Man state
        pacman = {
            x: 14,
            y: 23,
            direction: 'right',
            nextDirection: 'right',
            isMoving: false
        };
        
        // Reset ghost states
        ghosts = [
            { x: 12, y: 14, color: 'red', direction: 'right', isFrightened: false },
            { x: 13, y: 14, color: 'pink', direction: 'left', isFrightened: false },
            { x: 14, y: 14, color: 'cyan', direction: 'up', isFrightened: false },
            { x: 15, y: 14, color: 'orange', direction: 'down', isFrightened: false }
        ];
        
        // Create a new game board
        createGameBoard();
        
        // Render the game board
        renderGameBoard();
        
        // Restart game intervals
        gameInterval = setInterval(() => {
            updatePacmanPosition();
            checkCollisions();
        }, GAME_SPEED);
        
        ghostInterval = setInterval(() => {
            updateGhostPositions();
            checkCollisions();
        }, GHOST_SPEED);
        
        // Ensure game is running
        isGameRunning = true;
    }
    
    // Initialize the game when the page loads
    initGame();
}); 