document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const scoreDisplay = document.getElementById('score');
    const targetScoreDisplay = document.getElementById('target-score');
    const movesDisplay = document.getElementById('moves');
    const restartBtn = document.getElementById('restart-btn');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    
    const width = 8;
    const squares = [];
    let score = 0;
    let selectedCandy = null;
    let movesLeft = 20;
    let isInitialMove = false;
    let gameWon = false; // New flag to track if game has been won

    // Difficulty settings
    const difficulties = {
        easy: {
            moves: 25,
            targetScore: 100,
            description: "Match 3 or more candies. Need 100 points in 25 moves."
        },
        medium: {
            moves: 22,
            targetScore: 125,
            description: "Match 3 or more candies. Need 125 points in 22 moves."
        },
        hard: {
            moves: 20,
            targetScore: 150,
            description: "Match 3 or more candies. Need 150 points in 20 moves."
        }
    };

    let currentDifficulty = 'easy';

    const candyColors = [
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'orange'
    ];

    // Handle difficulty selection
    function setDifficulty(difficulty) {
        currentDifficulty = difficulty;
        movesLeft = difficulties[difficulty].moves;
        movesDisplay.textContent = movesLeft;
        targetScoreDisplay.textContent = difficulties[difficulty].targetScore;
        
        // Update button styles
        difficultyBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('selected');
            }
        });

        // Restart game with new settings
        restartGame();
    }

    function restartGame() {
        // Clear the board
        board.innerHTML = '';
        squares.length = 0;
        score = 0;
        movesLeft = difficulties[currentDifficulty].moves;
        scoreDisplay.textContent = score;
        movesDisplay.textContent = movesLeft;
        clearSelection();
        gameWon = false; // Reset the game won flag
        createBoard();
    }

    // Create Board
    function createBoard() {
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.setAttribute('id', i);
            let validColor = getValidColor(i);
            square.classList.add('candy', candyColors[validColor]);
            square.addEventListener('click', handleClick);
            board.appendChild(square);
            squares.push(square);
        }
    }

    function getValidColor(index) {
        let validColors = [...candyColors.keys()];

        // Check two above
        if (index >= width * 2) {
            const color1 = squares[index - width].className;
            const color2 = squares[index - width * 2].className;
            if (color1 === color2) {
                const colorToAvoid = candyColors.findIndex(color => color1.includes(color));
                validColors = validColors.filter(c => c !== colorToAvoid);
            }
        }

        // Check two to the left
        if (index % width >= 2) {
            const color1 = squares[index - 1].className;
            const color2 = squares[index - 2].className;
            if (color1 === color2) {
                const colorToAvoid = candyColors.findIndex(color => color1.includes(color));
                validColors = validColors.filter(c => c !== colorToAvoid);
            }
        }

        return validColors[Math.floor(Math.random() * validColors.length)];
    }

    function clearSelection() {
        if (selectedCandy) {
            selectedCandy.classList.remove('selected');
            selectedCandy = null;
        }
    }

    function handleClick(e) {
        // If no moves left or game is won, don't allow any more moves
        if (movesLeft <= 0 || gameWon) return;

        const clickedCandy = e.target;

        if (selectedCandy === clickedCandy) {
            clearSelection();
            return;
        }

        if (!selectedCandy) {
            selectedCandy = clickedCandy;
            selectedCandy.classList.add('selected');
            return;
        }

        const firstId = parseInt(selectedCandy.id);
        const secondId = parseInt(clickedCandy.id);
        
        const isAdjacent = (
            secondId === firstId - 1 ||
            secondId === firstId + 1 ||
            secondId === firstId - width ||
            secondId === firstId + width
        );

        const invalidRowSwap = (
            Math.abs(firstId - secondId) === 1 && 
            Math.floor(firstId / width) !== Math.floor(secondId / width)
        );

        if (!isAdjacent || invalidRowSwap) {
            // Not a valid swap position, just change selection
            clearSelection();
            selectedCandy = clickedCandy;
            selectedCandy.classList.add('selected');
            return;
        }

        // Try the swap - this will count as a move
        trySwap(selectedCandy, clickedCandy);
    }

    function checkForPossibleMoves() {
        // Check each candy on the board
        for (let i = 0; i < squares.length; i++) {
            const currentColor = squares[i].className.replace(' selected', '');
            
            // Check right swap
            if (i % width < width - 1) {
                const rightColor = squares[i + 1].className.replace(' selected', '');
                
                // Temporarily swap
                squares[i].className = rightColor;
                squares[i + 1].className = currentColor;
                
                // Check if this creates a match
                if (checkForMatches()) {
                    // Swap back
                    squares[i].className = currentColor;
                    squares[i + 1].className = rightColor;
                    return true; // Found a valid move
                }
                
                // Swap back
                squares[i].className = currentColor;
                squares[i + 1].className = rightColor;
            }
            
            // Check down swap
            if (i < squares.length - width) {
                const downColor = squares[i + width].className.replace(' selected', '');
                
                // Temporarily swap
                squares[i].className = downColor;
                squares[i + width].className = currentColor;
                
                // Check if this creates a match
                if (checkForMatches()) {
                    // Swap back
                    squares[i].className = currentColor;
                    squares[i + width].className = downColor;
                    return true; // Found a valid move
                }
                
                // Swap back
                squares[i].className = currentColor;
                squares[i + width].className = downColor;
            }
        }
        
        // No valid moves found
        return false;
    }

    function checkGameStatus() {
        const targetScore = difficulties[currentDifficulty].targetScore;
        
        if (score >= targetScore && !gameWon) {
            gameWon = true; // Set the game won flag
            
            // Update score first
            scoreDisplay.textContent = score;
            
            // Show win notification after score is updated
            setTimeout(() => {
                alert('Congratulations! You won! 🎉');
                setTimeout(() => {
                    restartGame();
                }, 500);
            }, 100);
            return true; // Return true to indicate game is over
        } else if (movesLeft <= 0) {
            setTimeout(() => {
                alert('Game Over! Try again!');
                restartGame();
            }, 500);
            return true; // Return true to indicate game is over
        }
        return false; // Return false to indicate game is still ongoing
    }

    function moveDown() {
        let candyMoved = true;
        
        // Keep moving candies down until no more moves are possible
        while (candyMoved) {
            candyMoved = false;
            
            // Start from the bottom, excluding the last row
            for (let i = squares.length - width - 1; i >= 0; i--) {
                if (squares[i].className !== '') {  // If there's a candy here
                    let currentRow = Math.floor(i / width);
                    let currentCol = i % width;
                    
                    // Check all spaces below this candy
                    for (let row = currentRow + 1; row < width; row++) {
                        let position = row * width + currentCol;
                        
                        // If we find an empty space below
                        if (squares[position].className === '') {
                            // Move the candy to the lowest empty space
                            squares[position].className = squares[i].className;
                            squares[i].className = '';
                            candyMoved = true;
                            break;  // Move to next candy after dropping this one
                        }
                    }
                }
            }
        }

        // Fill empty spaces from the top
        for (let col = 0; col < width; col++) {
            let emptySpaces = 0;
            
            // Count empty spaces in this column
            for (let row = width - 1; row >= 0; row--) {
                let position = row * width + col;
                if (squares[position].className === '') {
                    emptySpaces++;
                }
            }
            
            // Fill empty spaces with new candies
            for (let i = 0; i < emptySpaces; i++) {
                let position = i * width + col;
                let validColor = getValidColor(position);
                squares[position].className = `candy ${candyColors[validColor]}`;
            }
        }

        // Check for new matches after pieces have fallen
        setTimeout(() => {
            checkForMatches();
        }, 100);
    }

    // Game loop - only check for matches if no candies are currently falling
    let isProcessing = false;
    let isPlayerMove = false; // New flag to track player moves
    
    setInterval(() => {
        if (!isProcessing && !isPlayerMove && !gameWon) {
            isProcessing = true;
            checkForMatches();
            isProcessing = false;
        }
    }, 100);

    function trySwap(candy1, candy2) {
        // Store original colors (without 'selected' class)
        const color1 = candy1.className.replace(' selected', '');
        const color2 = candy2.className;

        // Perform swap
        candy1.className = color2;
        candy2.className = color1;

        // Clear selection
        clearSelection();

        // Set flags for initial move
        isInitialMove = true;
        isPlayerMove = true; // Set player move flag

        // Check if the swap created any matches
        setTimeout(() => {
            const hasMatches = checkForMatches();
            if (!hasMatches) {
                // If no matches, swap back
                candy1.className = color1;
                candy2.className = color2;
                isInitialMove = false; // Reset the flag if no matches
            }
            // If matches are found, the flag will be reset in checkForMatches
            isPlayerMove = false; // Reset player move flag
        }, 100);
    }

    function checkForMatches() {
        let matchFound = false;
        let matchedCandies = new Set(); // Keep track of all candies to be removed

        // Check horizontal matches
        for (let row = 0; row < width; row++) {
            let currentStreak = [];
            let currentColor = '';

            for (let col = 0; col < width; col++) {
                const index = row * width + col;
                const candyColor = squares[index].className.replace(' selected', '');

                if (candyColor === currentColor && candyColor !== '') {
                    currentStreak.push(index);
                } else {
                    // Check if we had a valid streak before this candy
                    if (currentStreak.length >= 3) {
                        currentStreak.forEach(idx => matchedCandies.add(idx));
                        matchFound = true;
                    }
                    // Start new streak
                    currentStreak = [index];
                    currentColor = candyColor;
                }
            }
            // Check streak at end of row
            if (currentStreak.length >= 3) {
                currentStreak.forEach(idx => matchedCandies.add(idx));
                matchFound = true;
            }
        }

        // Check vertical matches
        for (let col = 0; col < width; col++) {
            let currentStreak = [];
            let currentColor = '';

            for (let row = 0; row < width; row++) {
                const index = row * width + col;
                const candyColor = squares[index].className.replace(' selected', '');

                if (candyColor === currentColor && candyColor !== '') {
                    currentStreak.push(index);
                } else {
                    // Check if we had a valid streak before this candy
                    if (currentStreak.length >= 3) {
                        currentStreak.forEach(idx => matchedCandies.add(idx));
                        matchFound = true;
                    }
                    // Start new streak
                    currentStreak = [index];
                    currentColor = candyColor;
                }
            }
            // Check streak at end of column
            if (currentStreak.length >= 3) {
                currentStreak.forEach(idx => matchedCandies.add(idx));
                matchFound = true;
            }
        }

        // Remove matched candies and update score
        if (matchFound) {
            matchedCandies.forEach(index => {
                squares[index].className = '';
            });
            
            // Calculate points earned
            const matchSize = matchedCandies.size;
            let pointsEarned = matchSize;
            
            // Bonus points for larger matches
            if (matchSize > 3) {
                pointsEarned += (matchSize - 3) * 2; // Extra bonus points for each additional candy
            }
            
            // Update score first
            score += pointsEarned;
            scoreDisplay.textContent = score;
            
            // Check game status after updating score
            const gameOver = checkGameStatus();
            
            // Only decrease moves on initial match if game is not over
            if (isInitialMove && !gameOver) {
                movesLeft--;
                movesDisplay.textContent = movesLeft;
            }
            
            // Reset the flag after processing matches
            isInitialMove = false;

            // Always continue with moveDown, even if game is over
            setTimeout(() => {
                moveDown();
            }, 100);
        } else {
            // If no matches were found and this was an initial move, reset the flag
            if (isInitialMove) {
                isInitialMove = false;
            }
        }

        return matchFound;
    }

    // Event Listeners
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.difficulty);
        });
    });

    restartBtn.addEventListener('click', restartGame);

    // Initialize game
    setDifficulty('easy');
}); 