class MancalaGame {
    constructor() {
        // The actual board layout is:
        //  8  9 10 11 12 13
        // [0]          [7]
        //  1  2  3  4  5  6
        
        // Initialize board with exactly 4 stones per regular pit and 0 in stores
        this.board = Array(14).fill(0); // Start with all zeros
        
        // Set 4 stones in each regular pit
        for (let i = 1; i <= 6; i++) this.board[i] = 4; // Player 1 pits
        for (let i = 8; i <= 13; i++) this.board[i] = 4; // Player 2 pits
        
        this.currentPlayer = 1;
        this.gameOver = false;
        this.stoneTypes = ['type-1', 'type-2', 'type-3', 'type-4'];
        this.animationInProgress = false;
        this.diagnosticMode = false; // Disable diagnostic mode
        this.selectedStone = null;
        this.movePath = []; // Track movement path for diagnostic
        this.computerMode = false; // Add computer mode flag
        this.computerDelay = 1000; // Delay in ms before computer makes a move
        
        // Set the document title (browser tab title)
        document.title = "Mancala";
        
        this.createGameBoard();
        this.initializeEventListeners();
        this.initializeStones();
        this.updateScoreIndicators();
        
        if (this.diagnosticMode) {
            this.initializeDiagnosticMode();
        }
    }

    createGameBoard() {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <h1>Jayden's Mancala Science Fair 2025</h1>
            <div class="game-controls">
                <button id="toggle-computer" class="control-button">Play vs Computer: OFF</button>
            </div>
            <div class="game-board">
                <div class="store-wrapper">
                    <div class="store" id="player2-store" data-pit="0">
                        <div class="stone-count">0</div>
                        <div class="store-indicator" id="player2-store-indicator">P2</div>
                    </div>
                    <div class="score-display" id="player2-score">Score: 0</div>
                    <div class="player-label">Player 2</div>
                </div>
                <div class="pits-container">
                    <div class="player2-pits">
                        ${this.createPitWithIndicator(13, 2)}
                        ${this.createPitWithIndicator(12, 2)}
                        ${this.createPitWithIndicator(11, 2)}
                        ${this.createPitWithIndicator(10, 2)}
                        ${this.createPitWithIndicator(9, 2)}
                        ${this.createPitWithIndicator(8, 2)}
                    </div>
                    <div class="player-indicator player2-indicator">P2</div>
                    <div class="player-indicator player1-indicator">P1</div>
                    <div class="player1-pits">
                        ${this.createPitWithIndicator(1, 1)}
                        ${this.createPitWithIndicator(2, 1)}
                        ${this.createPitWithIndicator(3, 1)}
                        ${this.createPitWithIndicator(4, 1)}
                        ${this.createPitWithIndicator(5, 1)}
                        ${this.createPitWithIndicator(6, 1)}
                    </div>
                </div>
                <div class="store-wrapper">
                    <div class="store" id="player1-store" data-pit="7">
                        <div class="stone-count">0</div>
                        <div class="store-indicator" id="player1-store-indicator">P1</div>
                    </div>
                    <div class="score-display" id="player1-score">Score: 0</div>
                    <div class="player-label">Player 1</div>
                </div>
            </div>
            <div class="game-status">
                <p>Player 1's Turn</p>
            </div>
            <div class="game-controls bottom-controls">
                <button id="restart-game" class="control-button">Restart Game</button>
            </div>
            <div id="diagnostic-controls" style="display: none; margin-top: 20px;">
                <button id="toggle-diagnostic">Toggle Diagnostic Mode</button>
                <button id="reset-game">Reset Game</button>
                <button id="clear-path">Clear Path</button>
                <div id="path-display" style="margin-top: 10px; font-family: monospace;"></div>
            </div>
        `;
    }

    createPitWithIndicator(pitIndex, playerNum) {
        return `
            <div class="pit-wrapper">
                <div class="pit-indicator">P${playerNum}</div> 
                <div class="pit" data-pit="${pitIndex}">
                    
                </div>
                <div class="pit-score">Stones: 4</div>
            </div>
        `;
    }

    initializeEventListeners() {
        const pits = document.querySelectorAll('.pit');
        const stores = document.querySelectorAll('.store');
        
        // Add computer mode toggle
        const computerToggle = document.getElementById('toggle-computer');
        if (computerToggle) {
            computerToggle.addEventListener('click', () => {
                this.computerMode = !this.computerMode;
                computerToggle.textContent = `Play vs Computer: ${this.computerMode ? 'ON' : 'OFF'}`;
                
                // If turning on computer mode and it's player 2's turn, make a move
                if (this.computerMode && this.currentPlayer === 2 && !this.gameOver) {
                    this.makeComputerMove();
                }
            });
        }
        
        // Add restart game button functionality
        const restartButton = document.getElementById('restart-game');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.resetGame();
            });
        }
        
        if (this.diagnosticMode) {
            // In diagnostic mode, we enable clicking on all pits and stones for manual movement
            const allContainers = [...pits, ...stores];
            
            // Enable stone selection
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('stone') && !this.selectedStone) {
                    this.selectStone(e.target);
                } else if (this.selectedStone) {
                    // Check if clicked on a pit or store
                    const container = e.target.closest('.pit, .store');
                    if (container) {
                        this.moveStoneToContainer(container);
                    } else if (!e.target.classList.contains('stone')) {
                        // Clicked elsewhere, deselect stone
                        this.deselectStone();
                    }
                }
            });
        } else {
            // Regular game mode
            pits.forEach(pit => {
                pit.addEventListener('click', () => {
                    const pitIndex = parseInt(pit.getAttribute('data-pit'));
                    
                    // Only allow clicks for the human player
                    if (this.computerMode && this.currentPlayer === 2) {
                        return; // Computer is player 2, ignore clicks
                    }
                    
                    this.makeMove(pitIndex);
                });
            });
        }
    }

    initializeDiagnosticMode() {
        const controls = document.getElementById('diagnostic-controls');
        controls.style.display = 'block';
        
        document.getElementById('toggle-diagnostic').addEventListener('click', () => {
            this.diagnosticMode = !this.diagnosticMode;
            alert(`Diagnostic mode: ${this.diagnosticMode ? 'ON' : 'OFF'}`);
        });
        
        document.getElementById('reset-game').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('clear-path').addEventListener('click', () => {
            this.movePath = [];
            this.updatePathDisplay();
        });
        
        // Add instructions
        const gameStatus = document.querySelector('.game-status p');
        gameStatus.textContent = 'DIAGNOSTIC MODE: Click on a stone to select it, then click on a destination to move it';
    }
    
    selectStone(stone) {
        if (this.selectedStone) {
            this.selectedStone.classList.remove('selected');
        }
        
        this.selectedStone = stone;
        stone.classList.add('selected');
        stone.style.transform = 'scale(1.2)';
        stone.style.boxShadow = '0 0 10px yellow';
        stone.style.zIndex = '1000';
        
        // Get source pit index
        const sourcePit = stone.closest('.pit, .store');
        if (sourcePit) {
            const sourcePitIndex = parseInt(sourcePit.getAttribute('data-pit'));
            this.lastMoveSource = sourcePitIndex;
        }
    }
    
    deselectStone() {
        if (this.selectedStone) {
            this.selectedStone.classList.remove('selected');
            this.selectedStone.style.transform = '';
            this.selectedStone.style.boxShadow = '';
            this.selectedStone.style.zIndex = '';
            this.selectedStone = null;
        }
    }
    
    moveStoneToContainer(container) {
        if (!this.selectedStone) return;
        
        const sourcePit = this.selectedStone.closest('.pit, .store');
        if (!sourcePit) return;
        
        const sourcePitIndex = parseInt(sourcePit.getAttribute('data-pit'));
        const destPitIndex = parseInt(container.getAttribute('data-pit'));
        
        // Record the movement in path
        this.movePath.push({ from: sourcePitIndex, to: destPitIndex });
        
        // Actually move the stone
        container.appendChild(this.selectedStone);
        
        // Update board state
        this.board[sourcePitIndex]--;
        this.board[destPitIndex]++;
        
        // Update displays
        this.updateScoreIndicators();
        this.updatePathDisplay();
        
        // Deselect stone after move
        this.deselectStone();
    }
    
    updatePathDisplay() {
        const pathDisplay = document.getElementById('path-display');
        if (pathDisplay) {
            pathDisplay.innerHTML = this.movePath.map((move, index) => 
                `Step ${index+1}: Pit ${move.from} → Pit ${move.to}`
            ).join('<br>');
            
            // Add summary of the path
            if (this.movePath.length > 0) {
                const sequence = [this.lastMoveSource];
                this.movePath.forEach(move => {
                    sequence.push(move.to);
                });
                
                pathDisplay.innerHTML += `<br><br>Movement sequence: <b>${sequence.join(' → ')}</b>`;
            }
        }
    }
    
    resetGame() {
        // Reset board
        this.board = Array(14).fill(0); // Start with all zeros
        
        // Set 4 stones in each regular pit
        for (let i = 1; i <= 6; i++) this.board[i] = 4; // Player 1 pits
        for (let i = 8; i <= 13; i++) this.board[i] = 4; // Player 2 pits
        
        // Reset game state
        this.currentPlayer = 1;
        this.gameOver = false;
        this.animationInProgress = false;
        this.movePath = [];
        
        // Reset UI
        this.initializeStones();
        this.updateScoreIndicators();
        this.updateBoard();
        
        // Reset the game status message
        document.querySelector('.game-status p').textContent = 'Player 1\'s Turn';
        
        console.log("Game has been reset");
    }

    initializeStones() {
        const pits = document.querySelectorAll('.pit');
        const stores = document.querySelectorAll('.store');
        
        // Clear existing stones
        document.querySelectorAll('.stone').forEach(stone => stone.remove());

        // Initialize stones in pits
        pits.forEach(pit => {
            const pitIndex = parseInt(pit.getAttribute('data-pit'));
            // Verify the count matches what's in the board array
            const stoneCount = this.board[pitIndex];
            console.log(`Creating ${stoneCount} stones in pit ${pitIndex}`);
            this.createStonesInContainer(pit, stoneCount);
        });

        // Initialize stones in stores
        stores.forEach(store => {
            const isPlayer1Store = store.id === 'player1-store';
            const storeIndex = isPlayer1Store ? 7 : 0;
            this.createStonesInContainer(store, this.board[storeIndex]);
        });
    }

    createStonesInContainer(container, count) {
        // Ensure we're creating exactly the right number of stones
        console.log(`Creating ${count} stones in container`, container);
        
        // First remove any existing stones
        const existingStones = container.querySelectorAll('.stone');
        existingStones.forEach(stone => stone.remove());
        
        // Then create the exact number needed
        for (let i = 0; i < count; i++) {
            const stone = document.createElement('div');
            stone.className = `stone ${this.getRandomStoneType()}`;
            this.positionStoneRandomly(stone, container);
            container.appendChild(stone);
        }
    }

    getRandomStoneType() {
        return this.stoneTypes[Math.floor(Math.random() * this.stoneTypes.length)];
    }

    positionStoneRandomly(stone, container) {
        const isStore = container.classList.contains('store');
        const containerRect = container.getBoundingClientRect();
        
        // Base sizing - stones are 16px wide
        const stoneSize = 16;
        const margin = 5; // Minimum distance from edges
        
        // Calculate available area (subtract margins from all sides)
        const availWidth = containerRect.width - (2 * margin) - stoneSize;
        const availHeight = containerRect.height - (2 * margin) - stoneSize;
        
        // Get current stones in container to avoid overlap
        const existingStones = Array.from(container.querySelectorAll('.stone'));
        
        // Find a position that doesn't heavily overlap with existing stones
        let maxAttempts = 10;
        let bestPosition = null;
        let bestOverlapScore = Infinity;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate random position
            const randomX = margin + Math.random() * availWidth;
            const randomY = margin + Math.random() * availHeight;
            
            // Calculate overlap score (lower is better)
            let overlapScore = 0;
            
            for (const existingStone of existingStones) {
                if (existingStone === stone) continue; // Skip self
                
                const rect = existingStone.getBoundingClientRect();
                const existingX = parseInt(existingStone.style.left) || 0;
                const existingY = parseInt(existingStone.style.top) || 0;
                
                // Calculate distance between centers
                const dx = randomX - existingX;
                const dy = randomY - existingY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Closer stones add more to overlap score (inverse distance)
                if (distance < stoneSize * 1.5) {
                    overlapScore += (stoneSize * 1.5) - distance;
                }
            }
            
            // Keep track of best position
            if (overlapScore < bestOverlapScore) {
                bestOverlapScore = overlapScore;
                bestPosition = { x: randomX, y: randomY };
                
                // If no overlap, accept immediately
                if (overlapScore === 0) break;
            }
        }
        
        // Use best found position or fallback to a simple random position
        const finalX = bestPosition ? bestPosition.x : margin + Math.random() * availWidth;
        const finalY = bestPosition ? bestPosition.y : margin + Math.random() * availHeight;
        
        // Apply position
        stone.style.left = `${finalX}px`;
        stone.style.top = `${finalY}px`;
        
        // For store containers, adjust vertical distribution to spread stones more
        if (isStore) {
            // Divide store into regions and bias stone placement to the appropriate region
            // based on the current stone count
            const stoneCount = container.querySelectorAll('.stone').length;
            if (stoneCount > 4) {
                const region = Math.floor(stoneCount / 4); // 0-3 go in first region, 4-7 in second, etc.
                const regionHeight = availHeight / 4;
                const regionY = margin + (region * regionHeight) + (Math.random() * regionHeight);
                stone.style.top = `${regionY}px`;
            }
        }
    }

    async makeMove(startPit) {
        if (this.gameOver || this.animationInProgress || !this.isValidMove(startPit)) {
            console.log(`Move attempt rejected: gameOver=${this.gameOver}, animationInProgress=${this.animationInProgress}, isValidMove=${this.isValidMove(startPit)}`);
            return;
        }
        
        this.animationInProgress = true;
        console.log(`Starting move from pit ${startPit} with ${this.board[startPit]} stones`);
        
        // Get stones from starting pit
        const stonesToDistribute = this.board[startPit];
        this.board[startPit] = 0;
        
        // Clear animation stones if any
        document.querySelectorAll('.animation-stone').forEach(s => s.remove());
        
        // Get the original stones
        const stones = Array.from(this.getContainerByIndex(startPit).getElementsByClassName('stone'));
        
        if (stones.length < stonesToDistribute) {
            console.error(`Not enough stones in pit ${startPit}. Expected ${stonesToDistribute}, found ${stones.length}`);
        }
        
        // Distribute stones one by one to consecutive pits
        let currentPit = startPit;
        let lastPit = null;
        
        // Distribute each stone one by one
        for (let i = 0; i < stonesToDistribute; i++) {
            const stone = stones[i];
            if (!stone) {
                console.error(`Stone ${i} not found in pit ${startPit}`);
                continue;
            }
            
            // Move the stone to the next pit
            currentPit = this.getNextPitCounterclockwise(currentPit);
            
            // Skip opponent's store
            if ((this.currentPlayer === 1 && currentPit === 0) || 
                (this.currentPlayer === 2 && currentPit === 7)) {
                console.log(`Skipping opponent's store (${currentPit})`);
                currentPit = this.getNextPitCounterclockwise(currentPit);
            }
            
            console.log(`Moving stone ${i+1}/${stonesToDistribute} from ${startPit} to ${currentPit}`);
            
            // Move the stone with animation
            await this.animateStoneMovement(stone, startPit, currentPit);
            
            // Update board state
            this.board[currentPit]++;
            
            // Keep track of the last pit where a stone was placed
            lastPit = currentPit;
        }
        
        // Update all indicators
        this.updateScoreIndicators();
        
        // Handle captures if the last stone enables a capture
        if (this.canCapture(lastPit)) {
            console.log(`Capturing from pit ${lastPit}`);
            await this.animateCapture(lastPit);
        }
        
        // Check if last stone landed in player's store
        const landedInStore = this.lastStoneInStore(lastPit);
        console.log(`Last stone landed in store: ${landedInStore}`);
        
        // Check if game is over
        if (this.checkGameOver()) {
            console.log("Game over detected");
            await this.endGame();
        } else {
            if (!landedInStore) {
                // Switch players
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                console.log(`Switching to Player ${this.currentPlayer}`);
                // Update status message immediately for player switch
                document.querySelector('.game-status p').textContent = 
                    `Player ${this.currentPlayer}'s Turn`;
            } else {
                // Same player gets another turn
                this.handleAnotherTurn();
                console.log(`Player ${this.currentPlayer} gets another turn`);
                
                // Set a timeout to reset the "another turn" message after a delay
                setTimeout(() => {
                    if (!this.gameOver && !this.animationInProgress) {
                        document.querySelector('.game-status p').textContent = 
                            `Player ${this.currentPlayer}'s Turn`;
                    }
                }, 2000); // Show "another turn" message for 2 seconds
            }
        }
        
        // Ensure visual state matches game state
        this.synchronizeVisualState();
        
        // Update board and reset animation flag
        this.updateBoard();
        this.animationInProgress = false;
        console.log(`Move completed. Current player: ${this.currentPlayer}`);
        
        // If computer mode is on and it's computer's turn, make a move
        if (this.computerMode && this.currentPlayer === 2 && !this.gameOver) {
            // Add a delay to make it feel more natural
            setTimeout(() => this.makeComputerMove(), this.computerDelay);
        }
    }

    async animateStoneMovement(stone, fromPosition, toPosition) {
        // Fast version without animations for testing
        return new Promise(resolve => {
            const toContainer = this.getContainerByIndex(toPosition);
            
            if (!toContainer) {
                console.error(`Container not found for position ${toPosition}`);
                resolve();
                return;
            }
            
            // Remove the original stone
            stone.remove();
            
            // Create new stone in destination (no animation)
            const newStone = document.createElement('div');
            newStone.className = stone.className;
            
            // Set initial position to visible center (don't rely only on random positioning)
            if (!toContainer.classList.contains('store')) {
                // For regular pits, use a simpler positioning to ensure visibility
                newStone.style.position = 'relative';
                newStone.style.display = 'inline-block';
                newStone.style.margin = '2px';
            } else {
                // For stores, we still want random positioning
                newStone.style.position = 'absolute';
            }
            
            // Add to container
            toContainer.appendChild(newStone);
            
            // Apply random positioning only for stores, or use a simplified approach for pits
            if (toContainer.classList.contains('store')) {
                this.positionStoneRandomly(newStone, toContainer);
            } else {
                // For pits, ensure the stone is visible by using a more predictable position
                const maxOffset = 10;
                const randomX = (Math.random() - 0.5) * maxOffset;
                const randomY = (Math.random() - 0.5) * maxOffset;
                newStone.style.transform = `translate(${randomX}px, ${randomY}px)`;
            }
            
            // Verify the board state matches the visual state
            console.log(`Placed stone in pit ${toPosition}, current count: ${this.board[toPosition]}`);
            
            // Complete immediately
            resolve();
        });
    }

    async animateCapture(lastPit) {
        // Calculate the opposite pit based on the counterclockwise layout
        // For pits 1-6, the opposite is 13-8
        // For pits 8-13, the opposite is 6-1
        let oppositePit;
        if (lastPit >= 1 && lastPit <= 6) {
            oppositePit = 14 - lastPit;
        } else if (lastPit >= 8 && lastPit <= 13) {
            oppositePit = 14 - lastPit;
        } else {
            // This should never happen, but just in case
            console.error("Invalid lastPit for capture:", lastPit);
            return;
        }
        
        const store = this.currentPlayer === 1 ? 7 : 0;
        const storeContainer = this.getContainerByIndex(store);
        
        const lastPitContainer = this.getContainerByIndex(lastPit);
        const oppositePitContainer = this.getContainerByIndex(oppositePit);
        
        const stones = [
            ...Array.from(lastPitContainer.getElementsByClassName('stone')),
            ...Array.from(oppositePitContainer.getElementsByClassName('stone'))
        ];

        const animations = stones.map(stone => 
            this.animateStoneMovement(stone, lastPit, store)
        );

        await Promise.all(animations);
    }

    isValidMove(pitIndex) {
        // Check if the pit belongs to the current player and has stones
        if (this.currentPlayer === 1) {
            // Player 1 can only move from pits 1-6
            return pitIndex >= 1 && pitIndex <= 6 && this.board[pitIndex] > 0;
        } else {
            // Player 2 can only move from pits 8-13
            return pitIndex >= 8 && pitIndex <= 13 && this.board[pitIndex] > 0;
        }
    }

    canCapture(lastPit) {
        // Check if the last pit has exactly one stone
        if (this.board[lastPit] !== 1) return false;
        
        // Calculate the opposite pit based on the counterclockwise layout
        let oppositePit;
        if (lastPit >= 1 && lastPit <= 6) {
            oppositePit = 14 - lastPit;
        } else if (lastPit >= 8 && lastPit <= 13) {
            oppositePit = 14 - lastPit;
        } else {
            // This should never happen, but just in case
            return false;
        }
        
        // Check if the opposite pit belongs to the opponent and has stones
        if (this.currentPlayer === 1 && lastPit >= 1 && lastPit <= 6) {
            return this.board[oppositePit] > 0;
        }
        
        if (this.currentPlayer === 2 && lastPit >= 8 && lastPit <= 13) {
            return this.board[oppositePit] > 0;
        }

        return false;
    }

    lastStoneInStore(lastPit) {
        // Check if the last stone landed in the current player's store
        return (this.currentPlayer === 1 && lastPit === 7) ||
               (this.currentPlayer === 2 && lastPit === 0);
    }

    checkGameOver() {
        // FIX 2: Use correct slice ranges for player pits
        const player1Pits = this.board.slice(1, 7); // Pits 1 through 6
        const player2Pits = this.board.slice(8, 14); // Pits 8 through 13
        const player1Empty = player1Pits.every(stones => stones === 0);
        const player2Empty = player2Pits.every(stones => stones === 0);
        return player1Empty || player2Empty;
    }

    endGame() {
        // Collect remaining stones
        let player1Sum = 0;
        let player2Sum = 0;
        
        // FIX 3: Use correct loop ranges to sum remaining stones
        // Sum Player 1's remaining stones (pits 1-6)
        for (let i = 1; i <= 6; i++) {
            player1Sum += this.board[i];
            this.board[i] = 0;
        }
        // Sum Player 2's remaining stones (pits 8-13)
        for (let i = 8; i <= 13; i++) {
            player2Sum += this.board[i];
            this.board[i] = 0;
        }

        // Add sums to respective stores
        this.board[7] += player1Sum; // Add to Player 1's store
        this.board[0] += player2Sum; // Add to Player 2's store

        this.gameOver = true;
        this.updateBoard(); // Update board to show 0s and final store counts
        this.announceWinner();
    }

    announceWinner() {
        const status = document.querySelector('.game-status p');
        if (this.board[7] > this.board[0]) {
            status.textContent = 'Game Over - Player 1 Wins!';
        } else if (this.board[0] > this.board[7]) {
            status.textContent = 'Game Over - Player 2 Wins!';
        } else {
            status.textContent = 'Game Over - It\'s a Tie!';
        }
    }

    updateBoard() {
        // Update pits
        const pits = document.querySelectorAll('.pit');
        pits.forEach(pit => {
            const pitIndex = parseInt(pit.getAttribute('data-pit'));
            // Removed update for inner .stone-count
            
            // Update pit styling based on current player
            if (!this.gameOver) {
                if (this.currentPlayer === 1) {
                    pit.classList.toggle('disabled', pitIndex >= 7);
                } else {
                    pit.classList.toggle('disabled', pitIndex < 7);
                }
            } else {
                pit.classList.add('disabled');
            }
        });

        // Update stores
        document.querySelector('#player1-store .stone-count').textContent = this.board[7];
        document.querySelector('#player2-store .stone-count').textContent = this.board[0];

        // Update player indicators
        this.updatePlayerIndicators();
        
        // Always update game status to show the current player's turn
        if (!this.gameOver) {
            document.querySelector('.game-status p').textContent = 
                `Player ${this.currentPlayer}'s Turn`;
        }

        this.updateScoreIndicators();
    }

    updatePlayerIndicators() {
        const p1Indicator = document.querySelector('.player1-indicator');
        const p2Indicator = document.querySelector('.player2-indicator');
        
        if (this.currentPlayer === 1) {
            p1Indicator.style.backgroundColor = 'rgba(0, 255, 0, 0.6)'; // Green for active
            p2Indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Dark for inactive
        } else {
            p2Indicator.style.backgroundColor = 'rgba(0, 255, 0, 0.6)'; // Green for active
            p1Indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Dark for inactive
        }
    }

    updateScoreIndicators() {
        // Update pit scores
        // FIX 4: Correct loop range and skip stores
        for (let i = 0; i < 14; i++) { // Loop through all indices 0-13
            if (i !== 0 && i !== 7) { // Skip stores (0 and 7)
                const pit = document.querySelector(`[data-pit="${i}"]`);
                if (pit) { // Check if pit element exists
                    const scoreElement = pit.closest('.pit-wrapper')?.querySelector('.pit-score');
                    if (scoreElement) {
                        scoreElement.textContent = `Stones: ${this.board[i]}`;
                    }
                } else {
                   // console.warn(`Could not find pit element for index ${i} in updateScoreIndicators`);
                }
            }
        }

        // Update store scores
        document.querySelector('#player1-score').textContent = `Score: ${this.board[7]}`;
        document.querySelector('#player2-score').textContent = `Score: ${this.board[0]}`;
    }

    debugGameState() {
        console.log('Game State Debug:');
        console.log(`Current Player: ${this.currentPlayer}`);
        console.log(`Animation in progress: ${this.animationInProgress}`);
        console.log(`Game Over: ${this.gameOver}`);
    }

    // Add this new method to handle the "another turn" scenario
    handleAnotherTurn() {
        console.log("Handling another turn for player", this.currentPlayer);
        
        // Reset the animation flag
        this.animationInProgress = false;
        
        // Update the game status
        document.querySelector('.game-status p').textContent = 
            `Player ${this.currentPlayer} gets another turn!`;
        
        // Enable the current player's pits
        const pits = document.querySelectorAll('.pit');
        pits.forEach(pit => {
            const pitIndex = parseInt(pit.getAttribute('data-pit'));
            if (this.currentPlayer === 1) {
                // Player 1 can only move from pits 1-6
                if (pitIndex >= 1 && pitIndex <= 6) {
                    pit.classList.remove('disabled');
                } else {
                    pit.classList.add('disabled');
                }
            } else {
                // Player 2 can only move from pits 8-13
                if (pitIndex >= 8 && pitIndex <= 13) {
                    pit.classList.remove('disabled');
                } else {
                    pit.classList.add('disabled');
                }
            }
        });
        
        // Update the score indicators
        this.updateScoreIndicators();
        
        // Log the state for debugging
        console.log(`After handling another turn - Animation in progress: ${this.animationInProgress}`);
        this.debugGameState();
    }

    getContainerByIndex(index) {
        if (index === 0) {
            return document.getElementById('player2-store');
        } else if (index === 7) {
            return document.getElementById('player1-store');
        } else {
            return document.querySelector(`[data-pit="${index}"]`);
        }
    }

    // Updated to match the true counterclockwise movement based on actual board layout
    getNextPitCounterclockwise(currentPit) {
        // The actual board layout is:
        //  8  9 10 11 12 13
        // [0]          [7]
        //  1  2  3  4  5  6
        
        if (currentPit === 0) return 1;  // From P2 store to P1's first pit
        if (currentPit === 6) return 7;  // From P1's last pit to P1 store
        if (currentPit === 7) return 13; // From P1 store to P2's last pit
        if (currentPit === 8) return 0;  // From P2's first pit to P2 store
        
        // Counterclockwise movement for the rest
        if (currentPit >= 9 && currentPit <= 13) {
            return currentPit - 1; // Move left on P2's side
        }
        if (currentPit >= 1 && currentPit <= 5) {
            return currentPit + 1; // Move right on P1's side
        }
        
        // Fallback (shouldn't reach here)
        console.error(`Invalid pit number: ${currentPit}`);
        return currentPit;
    }

    // Add a new method to ensure visual representation exactly matches the board state
    synchronizeVisualState() {
        // For each pit and store, ensure the number of stones matches the board state
        for (let i = 0; i < 14; i++) {
            const container = this.getContainerByIndex(i);
            if (!container) continue;
            
            const expectedStones = this.board[i];
            const actualStones = container.querySelectorAll('.stone').length;
            
            console.log(`Synchronizing pit ${i}: expected=${expectedStones}, actual=${actualStones}`);
            
            if (expectedStones !== actualStones) {
                console.warn(`Mismatch in pit ${i}: expected=${expectedStones}, actual=${actualStones}`);
                
                // Remove all existing stones
                container.querySelectorAll('.stone').forEach(stone => stone.remove());
                
                // Add the correct number of stones
                for (let j = 0; j < expectedStones; j++) {
                    const newStone = document.createElement('div');
                    newStone.className = `stone ${this.getRandomStoneType()}`;
                    
                    // Add to container
                    container.appendChild(newStone);
                    
                    // Position based on container type
                    if (container.classList.contains('store')) {
                        newStone.style.position = 'absolute';
                        this.positionStoneRandomly(newStone, container);
                    } else {
                        // For regular pits, use the simple positioning
                        newStone.style.position = 'relative';
                        newStone.style.display = 'inline-block';
                        newStone.style.margin = '2px';
                        
                        // Add slight randomness
                        const maxOffset = 10;
                        const randomX = (Math.random() - 0.5) * maxOffset;
                        const randomY = (Math.random() - 0.5) * maxOffset;
                        newStone.style.transform = `translate(${randomX}px, ${randomY}px)`;
                    }
                }
            }
        }
    }

    // Method to make a computer move
    makeComputerMove() {
        if (this.gameOver || this.animationInProgress || this.currentPlayer !== 2) {
            return;
        }
        
        // Choose a pit using the computer's strategy
        const pitIndex = this.chooseComputerMove();
        if (pitIndex) {
            console.log(`Computer chose pit ${pitIndex}`);
            this.makeMove(pitIndex);
        } else {
            console.error("Computer couldn't find a valid move");
        }
    }
    
    // Basic AI for choosing a computer move
    chooseComputerMove() {
        const validPits = [];
        
        // First priority: Check if any move will land in the computer's store
        for (let i = 8; i <= 13; i++) {
            if (this.board[i] > 0) {
                // Check if the move ends in the store
                if (this.willMoveEndInStore(i)) {
                    return i;
                }
                
                validPits.push(i);
            }
        }
        
        // Second priority: Check if any move will enable a capture
        for (const pit of validPits) {
            if (this.willMoveEnableCapture(pit)) {
                return pit;
            }
        }
        
        // Third priority: Prefer pits with more stones
        if (validPits.length > 0) {
            validPits.sort((a, b) => this.board[b] - this.board[a]);
            return validPits[0];
        }
        
        // Fallback: Choose any valid move
        for (let i = 8; i <= 13; i++) {
            if (this.board[i] > 0) {
                return i;
            }
        }
        
        return null; // No valid move found
    }
    
    // Check if a move from the given pit will end in the player's store
    willMoveEndInStore(pitIndex) {
        const stoneCount = this.board[pitIndex];
        let currentPit = pitIndex;
        
        // Simulate the move
        for (let i = 0; i < stoneCount; i++) {
            currentPit = this.getNextPitCounterclockwise(currentPit);
            
            // Skip opponent's store (Player 1's store)
            if (this.currentPlayer === 2 && currentPit === 7) {
                currentPit = this.getNextPitCounterclockwise(currentPit);
            }
        }
        
        // Check if the final pit is the player's store
        return (this.currentPlayer === 2 && currentPit === 0);
    }
    
    // Check if a move from the given pit will enable a capture
    willMoveEnableCapture(pitIndex) {
        const stoneCount = this.board[pitIndex];
        let currentPit = pitIndex;
        
        // Simulate the move
        for (let i = 0; i < stoneCount; i++) {
            currentPit = this.getNextPitCounterclockwise(currentPit);
            
            // Skip opponent's store
            if (this.currentPlayer === 2 && currentPit === 7) {
                currentPit = this.getNextPitCounterclockwise(currentPit);
            }
        }
        
        // Check if the last pit is on the player's side and currently empty
        // and the opposite pit has stones
        if (currentPit >= 8 && currentPit <= 13 && this.board[currentPit] === 0) {
            const oppositePit = 14 - currentPit;
            return this.board[oppositePit] > 0;
        }
        
        return false;
    }
}

// Start the game
const game = new MancalaGame(); 