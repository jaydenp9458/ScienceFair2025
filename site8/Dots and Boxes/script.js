document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    const gridSize = 6; // 6x6 grid of dots (5 lines by 5 lines)
    let currentPlayer = 1;
    let scores = { 1: 0, 2: 0 };
    let filledLines = [];
    let completedBoxes = [];
    let gameOver = false;
    let boxMadeThisTurn = false;
    let lastPlayedLine = null;
    let computerPlayer = false;
    let computerThinking = false;
    let difficultyLevel = 'hard'; // Options: 'easy', 'medium', 'hard'

    // DOM elements
    const gameBoard = document.getElementById('game-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameStatus = document.querySelector('.game-status');
    const player1Score = document.querySelector('.player1 .player-score');
    const player2Score = document.querySelector('.player2 .player-score');
    const player1Element = document.querySelector('.player1');
    const player2Element = document.querySelector('.player2');
    const computerToggle = document.getElementById('computer-player');

    // Initialize the game
    initGame();

    // Event listeners
    newGameBtn.addEventListener('click', initGame);
    computerToggle.addEventListener('change', toggleComputerPlayer);

    function toggleComputerPlayer() {
        computerPlayer = computerToggle.checked;
        
        // Update player 2 label
        const player2Label = document.querySelector('.player2 .player-label');
        player2Label.textContent = computerPlayer ? 'Computer' : 'Player 2';
        
        // If computer is enabled and it's Player 2's turn, make a computer move
        if (computerPlayer && currentPlayer === 2 && !gameOver) {
            setTimeout(makeComputerMove, 700);
        }
    }

    function initGame() {
        // Reset game state
        currentPlayer = 1;
        scores = { 1: 0, 2: 0 };
        filledLines = [];
        completedBoxes = [];
        gameOver = false;
        boxMadeThisTurn = false;
        lastPlayedLine = null;
        computerThinking = false;
        
        // Update UI
        updateScores();
        updatePlayerTurn();
        
        // Remove game-over class if present
        gameStatus.classList.remove('game-over');
        
        // Update player 2 label based on computer toggle
        const player2Label = document.querySelector('.player2 .player-label');
        player2Label.textContent = computerPlayer ? 'Computer' : 'Player 2';
        
        // Build the game board
        buildGameBoard();
    }

    function buildGameBoard() {
        // Clear the game board
        gameBoard.innerHTML = '';
        
        // Create a container with absolute positioning for better control
        const boardContainer = document.createElement('div');
        boardContainer.classList.add('board-container');
        gameBoard.appendChild(boardContainer);
        
        // Calculate sizes based on the container
        const containerSize = 400; // px
        const spacing = containerSize / (gridSize - 1);
        
        // Create dots
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.style.left = `${col * spacing}px`;
                dot.style.top = `${row * spacing}px`;
                boardContainer.appendChild(dot);
            }
        }
        
        // Create horizontal lines
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize - 1; col++) {
                const line = document.createElement('div');
                line.classList.add('horizontal-line');
                line.style.left = `${col * spacing + 7}px`;
                line.style.top = `${row * spacing}px`;
                line.style.width = `${spacing - 14}px`;
                
                line.dataset.row = row;
                line.dataset.col = col;
                line.dataset.type = 'horizontal';
                
                line.addEventListener('click', handleLineClick);
                boardContainer.appendChild(line);
            }
        }
        
        // Create vertical lines
        for (let row = 0; row < gridSize - 1; row++) {
            for (let col = 0; col < gridSize; col++) {
                const line = document.createElement('div');
                line.classList.add('vertical-line');
                line.style.left = `${col * spacing}px`;
                line.style.top = `${row * spacing + 7}px`;
                line.style.height = `${spacing - 14}px`;
                
                line.dataset.row = row;
                line.dataset.col = col;
                line.dataset.type = 'vertical';
                
                line.addEventListener('click', handleLineClick);
                boardContainer.appendChild(line);
            }
        }
        
        // Create boxes (for fill color when completed)
        for (let row = 0; row < gridSize - 1; row++) {
            for (let col = 0; col < gridSize - 1; col++) {
                const box = document.createElement('div');
                box.classList.add('box');
                box.style.left = `${col * spacing + 7}px`;
                box.style.top = `${row * spacing + 7}px`;
                box.style.width = `${spacing - 14}px`;
                box.style.height = `${spacing - 14}px`;
                
                box.dataset.row = row;
                box.dataset.col = col;
                
                boardContainer.appendChild(box);
            }
        }
    }

    function handleLineClick(event) {
        // If game is over or computer is thinking, don't allow more moves
        if (gameOver || computerThinking) return;
        
        // If it's the computer's turn (Player 2 + computer enabled), don't allow human moves
        if (computerPlayer && currentPlayer === 2) return;
        
        const line = event.target;
        
        // If line is already filled, ignore the click
        if (line.classList.contains('filled')) return;
        
        // Process the move
        processMoveOnLine(line);
        
        // If computer player is enabled and it's player 2's turn, make a computer move
        if (computerPlayer && currentPlayer === 2 && !gameOver) {
            computerThinking = true;
            gameStatus.textContent = "Computer is thinking...";
            
            // Add a delay to make it seem like the computer is thinking
            setTimeout(makeComputerMove, 700);
        }
    }

    function processMoveOnLine(line) {
        // If there's a previous move, change its color to black
        if (lastPlayedLine) {
            lastPlayedLine.classList.remove(`player${lastPlayedLine.dataset.player}`);
            lastPlayedLine.classList.add('black-line');
        }
        
        // Mark line as filled and add player's color
        line.classList.add('filled', `player${currentPlayer}`);
        line.dataset.player = currentPlayer;
        
        // Store the last played line for color change on next turn
        lastPlayedLine = line;
        
        // Get line data
        const row = parseInt(line.dataset.row);
        const col = parseInt(line.dataset.col);
        const type = line.dataset.type;
        
        // Add line to filledLines array
        filledLines.push({ row, col, type, player: currentPlayer });
        
        // Check if a box was completed
        boxMadeThisTurn = checkBoxCompletion(row, col, type);
        
        // Check if game is over (all possible lines are filled)
        const totalPossibleLines = 2 * gridSize * (gridSize - 1);
        if (filledLines.length === totalPossibleLines) {
            gameOver = true;
            gameStatus.classList.add('game-over');
            
            if (scores[1] > scores[2]) {
                gameStatus.textContent = 'Game over! Player 1 wins!';
            } else if (scores[2] > scores[1]) {
                const winner = computerPlayer ? 'Computer' : 'Player 2';
                gameStatus.textContent = `Game over! ${winner} wins!`;
            } else {
                gameStatus.textContent = 'Game over! It\'s a tie!';
            }
            return;
        }
        
        // Switch player if no box was completed
        if (!boxMadeThisTurn) {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
        
        // Update the UI
        updatePlayerTurn();
    }

    function makeComputerMove() {
        if (gameOver) {
            computerThinking = false;
            return;
        }
        
        // Choose move based on difficulty level
        const availableLines = getAvailableLines();
        let selectedMove;
        
        // Always complete a box if possible
        selectedMove = findBoxCompletingMove(availableLines);
        if (selectedMove) {
            makeMove(selectedMove);
            return;
        }
        
        // If playing on easy, just make a random move
        if (difficultyLevel === 'easy') {
            selectedMove = getRandomMove(availableLines);
            makeMove(selectedMove);
            return;
        }
        
        // Avoid moves that set up box completion for opponent
        const safeLines = availableLines.filter(line => !wouldSetUpBox(line));
        
        if (safeLines.length > 0) {
            // Prefer safer moves when available
            selectedMove = getStrategicMove(safeLines);
        } else {
            // If no safe moves, choose the least damaging move
            selectedMove = getLeastDamagingMove(availableLines);
        }
        
        makeMove(selectedMove);
    }
    
    function makeMove(move) {
        if (!move) {
            const availableLines = getAvailableLines();
            if (availableLines.length === 0) {
                computerThinking = false;
                return;
            }
            move = getRandomMove(availableLines);
        }
        
        const lineElement = document.querySelector(
            `.${move.type}-line[data-row="${move.row}"][data-col="${move.col}"]`
        );
        
        if (lineElement) {
            processMoveOnLine(lineElement);
            computerThinking = false;
            
            // If the computer got another turn (completed a box), make another move after a delay
            if (currentPlayer === 2 && !gameOver) {
                computerThinking = true;
                setTimeout(makeComputerMove, 700);
            }
        } else {
            computerThinking = false;
        }
    }
    
    function getRandomMove(availableLines) {
        if (availableLines.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * availableLines.length);
        return availableLines[randomIndex];
    }
    
    function getStrategicMove(safeLines) {
        // Prioritize moves in this order:
        // 1. Edges (outer lines) over interior lines
        // 2. Moves that don't create chains
        // 3. Moves that don't add the third side to a box
        
        // First, try to find edge moves that are safe
        const edgeMoves = safeLines.filter(line => isEdgeMove(line));
        if (edgeMoves.length > 0) {
            return getRandomMove(edgeMoves);
        }
        
        // Next, avoid adding third sides to boxes
        const notThirdSideLines = safeLines.filter(line => !addsThirdSideToBox(line));
        if (notThirdSideLines.length > 0) {
            return getRandomMove(notThirdSideLines);
        }
        
        // If all else fails, just pick a random safe move
        return getRandomMove(safeLines);
    }
    
    function getLeastDamagingMove(availableLines) {
        // When we have to make a move that will create opportunities for the opponent,
        // choose the one that minimizes the damage
        
        // For each move, calculate how many boxes it would set up
        const movesWithDamage = availableLines.map(line => {
            const boxesSetUp = countBoxesSetUp(line);
            return { ...line, boxesSetUp };
        });
        
        // Sort by the number of boxes set up (ascending)
        movesWithDamage.sort((a, b) => a.boxesSetUp - b.boxesSetUp);
        
        // Return the move that sets up the fewest boxes
        if (movesWithDamage.length > 0) {
            // If there are multiple moves with the same minimum damage,
            // pick one randomly from that group
            const minDamage = movesWithDamage[0].boxesSetUp;
            const leastDamagingMoves = movesWithDamage.filter(move => move.boxesSetUp === minDamage);
            return getRandomMove(leastDamagingMoves);
        }
        
        return null;
    }
    
    function isEdgeMove(line) {
        if (line.type === 'horizontal') {
            return line.row === 0 || line.row === gridSize - 1;
        } else {
            return line.col === 0 || line.col === gridSize - 1;
        }
    }
    
    function addsThirdSideToBox(line) {
        // Check if this move would add the third side to any box
        const { row, col, type } = line;
        
        if (type === 'horizontal') {
            // Check box above
            if (row > 0 && countSidesOfBox(row - 1, col) === 2) {
                return true;
            }
            // Check box below
            if (row < gridSize - 1 && countSidesOfBox(row, col) === 2) {
                return true;
            }
        } else {
            // Check box to the left
            if (col > 0 && countSidesOfBox(row, col - 1) === 2) {
                return true;
            }
            // Check box to the right
            if (col < gridSize - 1 && countSidesOfBox(row, col) === 2) {
                return true;
            }
        }
        
        return false;
    }
    
    function countSidesOfBox(row, col) {
        // Count how many sides of this box are already filled
        let sidesFilled = 0;
        
        // Check top
        if (isLineFilled(row, col, 'horizontal')) {
            sidesFilled++;
        }
        
        // Check bottom
        if (isLineFilled(row + 1, col, 'horizontal')) {
            sidesFilled++;
        }
        
        // Check left
        if (isLineFilled(row, col, 'vertical')) {
            sidesFilled++;
        }
        
        // Check right
        if (isLineFilled(row, col + 1, 'vertical')) {
            sidesFilled++;
        }
        
        return sidesFilled;
    }
    
    function wouldSetUpBox(line) {
        // Check if making this move would set up a box for completion
        // by adding the third side
        
        const { row, col, type } = line;
        
        // Temporarily add this line to filledLines
        filledLines.push({ row, col, type, player: 2 });
        
        let setsUpBox = false;
        
        if (type === 'horizontal') {
            // Check box above
            if (row > 0 && countSidesOfBox(row - 1, col) === 3) {
                setsUpBox = true;
            }
            // Check box below
            if (!setsUpBox && row < gridSize - 1 && countSidesOfBox(row, col) === 3) {
                setsUpBox = true;
            }
        } else {
            // Check box to the left
            if (col > 0 && countSidesOfBox(row, col - 1) === 3) {
                setsUpBox = true;
            }
            // Check box to the right
            if (!setsUpBox && col < gridSize - 1 && countSidesOfBox(row, col) === 3) {
                setsUpBox = true;
            }
        }
        
        // Remove the temporary line
        filledLines.pop();
        
        return setsUpBox;
    }
    
    function countBoxesSetUp(line) {
        // Count how many boxes would be set up (have 3 sides) after making this move
        
        const { row, col, type } = line;
        
        // Temporarily add this line to filledLines
        filledLines.push({ row, col, type, player: 2 });
        
        let boxesSetUp = 0;
        
        if (type === 'horizontal') {
            // Check box above
            if (row > 0 && countSidesOfBox(row - 1, col) === 3) {
                boxesSetUp++;
            }
            // Check box below
            if (row < gridSize - 1 && countSidesOfBox(row, col) === 3) {
                boxesSetUp++;
            }
        } else {
            // Check box to the left
            if (col > 0 && countSidesOfBox(row, col - 1) === 3) {
                boxesSetUp++;
            }
            // Check box to the right
            if (col < gridSize - 1 && countSidesOfBox(row, col) === 3) {
                boxesSetUp++;
            }
        }
        
        // Also check if this move would create a chain reaction of 3-sided boxes
        boxesSetUp += detectChains();
        
        // Remove the temporary line
        filledLines.pop();
        
        return boxesSetUp;
    }
    
    function detectChains() {
        // Detect chains of boxes that are one move away from completion
        
        // Create a grid representing the boxes
        const boxes = [];
        for (let row = 0; row < gridSize - 1; row++) {
            boxes[row] = [];
            for (let col = 0; col < gridSize - 1; col++) {
                const sideCount = countSidesOfBox(row, col);
                boxes[row][col] = {
                    sideCount,
                    visited: false
                };
            }
        }
        
        // Count chains (connected boxes with 3 sides)
        let chainCount = 0;
        
        for (let row = 0; row < gridSize - 1; row++) {
            for (let col = 0; col < gridSize - 1; col++) {
                if (boxes[row][col].sideCount === 3 && !boxes[row][col].visited) {
                    // Found a potential chain start
                    const chainLength = exploreChain(boxes, row, col);
                    if (chainLength > 1) {
                        // We found a chain of multiple boxes
                        chainCount += chainLength - 1; // Count all boxes after the first
                    }
                }
            }
        }
        
        return chainCount;
    }
    
    function exploreChain(boxes, row, col) {
        // Use depth-first search to explore a chain of 3-sided boxes
        if (row < 0 || row >= gridSize - 1 || col < 0 || col >= gridSize - 1 || 
            boxes[row][col].visited || boxes[row][col].sideCount !== 3) {
            return 0;
        }
        
        // Mark this box as visited
        boxes[row][col].visited = true;
        
        // Count this box and explore neighbors
        return 1 + 
            exploreChain(boxes, row - 1, col) + // Check above
            exploreChain(boxes, row + 1, col) + // Check below
            exploreChain(boxes, row, col - 1) + // Check left
            exploreChain(boxes, row, col + 1);  // Check right
    }

    function getAvailableLines() {
        const availableLines = [];
        
        // Check horizontal lines
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize - 1; col++) {
                if (!isLineFilled(row, col, 'horizontal')) {
                    availableLines.push({ row, col, type: 'horizontal' });
                }
            }
        }
        
        // Check vertical lines
        for (let row = 0; row < gridSize - 1; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (!isLineFilled(row, col, 'vertical')) {
                    availableLines.push({ row, col, type: 'vertical' });
                }
            }
        }
        
        return availableLines;
    }

    function isLineFilled(row, col, type) {
        return filledLines.some(line => 
            line.row === row && line.col === col && line.type === type
        );
    }

    function findBoxCompletingMove(availableLines) {
        // Check each available line to see if it completes a box
        for (const line of availableLines) {
            const { row, col, type } = line;
            
            if (type === 'horizontal') {
                // Check if this horizontal line would complete a box above
                if (row > 0 && wouldCompleteBox(row - 1, col)) {
                    return line;
                }
                
                // Check if this horizontal line would complete a box below
                if (row < gridSize - 1 && wouldCompleteBox(row, col)) {
                    return line;
                }
            } else if (type === 'vertical') {
                // Check if this vertical line would complete a box to the left
                if (col > 0 && wouldCompleteBox(row, col - 1)) {
                    return line;
                }
                
                // Check if this vertical line would complete a box to the right
                if (col < gridSize - 1 && wouldCompleteBox(row, col)) {
                    return line;
                }
            }
        }
        
        return null;
    }

    function wouldCompleteBox(row, col) {
        // Count how many sides of this box are already filled
        let sidesFilled = 0;
        
        // Check top
        if (isLineFilled(row, col, 'horizontal')) {
            sidesFilled++;
        }
        
        // Check bottom
        if (isLineFilled(row + 1, col, 'horizontal')) {
            sidesFilled++;
        }
        
        // Check left
        if (isLineFilled(row, col, 'vertical')) {
            sidesFilled++;
        }
        
        // Check right
        if (isLineFilled(row, col + 1, 'vertical')) {
            sidesFilled++;
        }
        
        // If 3 sides are filled, the 4th would complete the box
        return sidesFilled === 3;
    }

    function checkBoxCompletion(row, col, type) {
        let boxCompleted = false;
        
        // Check boxes that could be completed by this line
        if (type === 'horizontal') {
            // Check box above
            if (row > 0) {
                if (isBoxComplete(row - 1, col)) {
                    completeBox(row - 1, col);
                    boxCompleted = true;
                }
            }
            
            // Check box below
            if (row < gridSize - 1) {
                if (isBoxComplete(row, col)) {
                    completeBox(row, col);
                    boxCompleted = true;
                }
            }
        } else if (type === 'vertical') {
            // Check box to the left
            if (col > 0) {
                if (isBoxComplete(row, col - 1)) {
                    completeBox(row, col - 1);
                    boxCompleted = true;
                }
            }
            
            // Check box to the right
            if (col < gridSize - 1) {
                if (isBoxComplete(row, col)) {
                    completeBox(row, col);
                    boxCompleted = true;
                }
            }
        }
        
        return boxCompleted;
    }

    function isBoxComplete(row, col) {
        // Check if this box was already completed
        if (completedBoxes.some(box => box.row === row && box.col === col)) {
            return false;
        }
        
        // Check top line
        const topExists = filledLines.some(line => 
            line.type === 'horizontal' && line.row === row && line.col === col
        );
        
        // Check bottom line
        const bottomExists = filledLines.some(line => 
            line.type === 'horizontal' && line.row === row + 1 && line.col === col
        );
        
        // Check left line
        const leftExists = filledLines.some(line => 
            line.type === 'vertical' && line.row === row && line.col === col
        );
        
        // Check right line
        const rightExists = filledLines.some(line => 
            line.type === 'vertical' && line.row === row && line.col === col + 1
        );
        
        // Box is complete if all four sides exist
        return topExists && bottomExists && leftExists && rightExists;
    }

    function completeBox(row, col) {
        // Update scores
        scores[currentPlayer]++;
        
        // Add to completed boxes
        completedBoxes.push({ row, col, player: currentPlayer });
        
        // Find and update the box element
        const boxElement = document.querySelector(`.box[data-row="${row}"][data-col="${col}"]`);
        if (boxElement) {
            boxElement.classList.add(`player${currentPlayer}`);
        }
        
        // Update UI
        updateScores();
    }

    function updateScores() {
        player1Score.textContent = scores[1];
        player2Score.textContent = scores[2];
    }

    function updatePlayerTurn() {
        player1Element.classList.toggle('active', currentPlayer === 1);
        player2Element.classList.toggle('active', currentPlayer === 2);
        
        if (!gameOver) {
            if (computerPlayer && currentPlayer === 2) {
                gameStatus.textContent = "Computer's turn";
            } else {
                gameStatus.textContent = `Player ${currentPlayer}'s turn`;
            }
        }
    }
}); 