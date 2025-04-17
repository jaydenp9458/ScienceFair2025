document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const chessboard = document.getElementById('chessboard');
    const statusElement = document.getElementById('status');
    const currentTurnElement = document.getElementById('current-turn');
    const resetButton = document.getElementById('reset-button');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionPieces = document.querySelectorAll('.promotion-piece');
    const checkNotification = document.getElementById('check-notification');
    const checkmateNotification = document.getElementById('checkmate-notification');
    const stalemateNotification = document.getElementById('stalemate-notification');
    const winnerText = document.getElementById('winner-text');
    const newGameButton = document.getElementById('new-game-button');
    const stalemateNewGameButton = document.getElementById('stalemate-new-game-button');
    const computerToggle = document.getElementById('computer-toggle');

    // Game state
    let selectedPiece = null;
    let currentTurn = 'white';
    let validMoves = [];
    let gameBoard = [];
    let pendingPromotion = null;
    let inCheck = null; // Track which king is in check
    let gameOver = false;
    let computerPlaying = false;
    let computerColor = 'black'; // Computer always plays as black

    // Computer toggle event listener
    computerToggle.addEventListener('change', function() {
        computerPlaying = this.checked;
        
        // If computer is enabled and it's computer's turn, make a move
        if (computerPlaying && currentTurn === computerColor && !gameOver) {
            setTimeout(makeComputerMove, 500);
        }
    });

    // Chess piece Unicode symbols
    const pieces = {
        'white': {
            'pawn': '♙',
            'rook': '♖',
            'knight': '♘',
            'bishop': '♗',
            'queen': '♕',
            'king': '♔'
        },
        'black': {
            'pawn': '♟',
            'rook': '♜',
            'knight': '♞',
            'bishop': '♝',
            'queen': '♛',
            'king': '♚'
        }
    };

    // After the pieces constant, add piece-square tables
    const pieceSquareTables = {
        'pawn': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ],
        'knight': [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ],
        'bishop': [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5,  5,  5,  5,  5,-10],
            [-10,  0,  5,  0,  0,  5,  0,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ],
        'rook': [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ],
        'queen': [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ],
        'king': [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ],
        // Endgame king table - encourages king to move to center in endgame
        'kingEndgame': [
            [-50,-40,-30,-20,-20,-30,-40,-50],
            [-30,-20,-10,  0,  0,-10,-20,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-30,  0,  0,  0,  0,-30,-30],
            [-50,-30,-30,-30,-30,-30,-30,-50]
        ]
    };

    // Initialize the board
    function initializeBoard() {
        gameBoard = [
            // Initial board setup (row 0)
            [
                { piece: 'rook', color: 'black' },
                { piece: 'knight', color: 'black' },
                { piece: 'bishop', color: 'black' },
                { piece: 'queen', color: 'black' },
                { piece: 'king', color: 'black' },
                { piece: 'bishop', color: 'black' },
                { piece: 'knight', color: 'black' },
                { piece: 'rook', color: 'black' }
            ],
            // Row 1
            Array(8).fill().map(() => ({ piece: 'pawn', color: 'black' })),
            // Empty rows (2-5)
            Array(8).fill().map(() => null),
            Array(8).fill().map(() => null),
            Array(8).fill().map(() => null),
            Array(8).fill().map(() => null),
            // Row 6
            Array(8).fill().map(() => ({ piece: 'pawn', color: 'white' })),
            // Row 7
            [
                { piece: 'rook', color: 'white' },
                { piece: 'knight', color: 'white' },
                { piece: 'bishop', color: 'white' },
                { piece: 'queen', color: 'white' },
                { piece: 'king', color: 'white' },
                { piece: 'bishop', color: 'white' },
                { piece: 'knight', color: 'white' },
                { piece: 'rook', color: 'white' }
            ]
        ];

        // Fix the empty rows which are arrays of same reference
        gameBoard[2] = Array(8).fill(null);
        gameBoard[3] = Array(8).fill(null);
        gameBoard[4] = Array(8).fill(null);
        gameBoard[5] = Array(8).fill(null);
        
        // Fix pawns which are arrays of same reference
        gameBoard[1] = Array(8).fill().map(() => ({ piece: 'pawn', color: 'black' }));
        gameBoard[6] = Array(8).fill().map(() => ({ piece: 'pawn', color: 'white' }));
    }

    // Render the chessboard
    function renderBoard() {
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = gameBoard[row][col];
                if (piece) {
                    if (piece.color === 'white') {
                        // Create a span for white pieces to apply special styling
                        const pieceElement = document.createElement('div');
                        pieceElement.className = `white-piece-${piece.piece}`;
                        pieceElement.textContent = pieces[piece.color][piece.piece];
                        square.appendChild(pieceElement);
                    } else {
                        // Directly set text content for black pieces
                        square.textContent = pieces[piece.color][piece.piece];
                    }
                }
                
                // Highlight selected piece
                if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                    square.classList.add('selected');
                }
                
                // Highlight valid moves
                if (validMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('valid-move');
                }
                
                square.addEventListener('click', () => handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
    }

    // Handle square click
    function handleSquareClick(row, col) {
        // Prevent moves if game is over
        if (gameOver) return;
        
        const clickedPiece = gameBoard[row][col];
        
        // If a piece is already selected
        if (selectedPiece) {
            // Check if the clicked square is a valid move
            const validMove = validMoves.find(move => move.row === row && move.col === col);
            
            if (validMove) {
                movePiece(selectedPiece.row, selectedPiece.col, row, col);
            } else if (clickedPiece && clickedPiece.color === currentTurn) {
                // If clicking on another friendly piece, select it instead
                selectedPiece = { row, col };
                validMoves = getValidMoves(row, col);
            } else {
                // Clicking on an invalid square, deselect
                selectedPiece = null;
                validMoves = [];
            }
        } else if (clickedPiece && clickedPiece.color === currentTurn) {
            // Select the piece
            selectedPiece = { row, col };
            validMoves = getValidMoves(row, col);
        }
        
        renderBoard();
    }

    // Move piece function (extracted from handleSquareClick)
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const movingPiece = gameBoard[fromRow][fromCol];
        
        // Check for pawn promotion
        if (movingPiece.piece === 'pawn' && 
            ((movingPiece.color === 'white' && toRow === 0) || 
             (movingPiece.color === 'black' && toRow === 7))) {
            
            // Store the pending promotion
            pendingPromotion = {
                fromRow: fromRow,
                fromCol: fromCol,
                toRow: toRow,
                toCol: toCol
            };
            
            // Show promotion modal with correct color pieces
            const pieceColor = movingPiece.color;
            promotionPieces.forEach(element => {
                const pieceType = element.getAttribute('data-piece');
                element.textContent = pieces[pieceColor][pieceType];
                
                // Set the data-color attribute for styling
                element.setAttribute('data-color', pieceColor);
            });
            
            promotionModal.style.display = 'flex';
            return;
        }
        
        // Regular piece movement
        gameBoard[toRow][toCol] = gameBoard[fromRow][fromCol];
        gameBoard[fromRow][fromCol] = null;
        
        // Check if opponent king is in check after the move
        const opponentColor = movingPiece.color === 'white' ? 'black' : 'white';
        const isOpponentInCheck = isKingInCheck(opponentColor);
        
        if (isOpponentInCheck) {
            inCheck = opponentColor;
            statusElement.textContent = `${opponentColor.charAt(0).toUpperCase() + opponentColor.slice(1)} is in check!`;
            
            // Show the check notification
            showCheckNotification();
            
            // Check for checkmate
            if (isCheckmate(opponentColor)) {
                gameOver = true;
                showCheckmateNotification(movingPiece.color);
                return; // Don't switch turns - game is over
            }
        } else {
            inCheck = null;
            
            // Check for stalemate - opponent has no valid moves but is not in check
            if (isStalemate(opponentColor)) {
                gameOver = true;
                showStalemateNotification();
                return; // Don't switch turns - game is over
            }
        }
        
        // Switch turns
        switchTurns();
    }

    // Function to show the check notification with fade effect
    function showCheckNotification() {
        // Reset animation by removing and re-adding the class
        checkNotification.classList.remove('show');
        
        // Trigger reflow to restart animation
        void checkNotification.offsetWidth;
        
        // Show the notification
        checkNotification.classList.add('show');
        
        // Remove the class after animation completes
        setTimeout(() => {
            checkNotification.classList.remove('show');
        }, 1500);
    }

    // Switch turns function - modified to trigger computer move
    function switchTurns() {
        currentTurn = currentTurn === 'white' ? 'black' : 'white';
        currentTurnElement.textContent = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);
        // Remove the redundant status message
        statusElement.textContent = '';
        
        // Reset selection
        selectedPiece = null;
        validMoves = [];
        
        // If it's computer's turn and computer is enabled, make a move
        if (computerPlaying && currentTurn === computerColor && !gameOver) {
            // Add a small delay to make the computer's move more natural
            setTimeout(makeComputerMove, 500);
        }
    }

    // Promotion piece click event
    promotionPieces.forEach(element => {
        element.addEventListener('click', function() {
            if (!pendingPromotion) return;
            
            const pieceType = this.getAttribute('data-piece');
            const pieceColor = gameBoard[pendingPromotion.fromRow][pendingPromotion.fromCol].color;
            
            // Set data-color attribute for styling
            this.setAttribute('data-color', pieceColor);
            
            // Update the pawn to the selected piece
            gameBoard[pendingPromotion.toRow][pendingPromotion.toCol] = {
                piece: pieceType,
                color: pieceColor
            };
            
            // Remove the original pawn
            gameBoard[pendingPromotion.fromRow][pendingPromotion.fromCol] = null;
            
            // Hide the modal
            promotionModal.style.display = 'none';
            
            // Clear the pending promotion
            pendingPromotion = null;
            
            // Check if the promotion causes a check
            const opponentColor = pieceColor === 'white' ? 'black' : 'white';
            const isOpponentInCheck = isKingInCheck(opponentColor);
            
            if (isOpponentInCheck) {
                inCheck = opponentColor;
                statusElement.textContent = `${opponentColor.charAt(0).toUpperCase() + opponentColor.slice(1)} is in check!`;
                
                // Show the check notification
                showCheckNotification();
                
                // Check for checkmate
                if (isCheckmate(opponentColor)) {
                    gameOver = true;
                    showCheckmateNotification(pieceColor);
                    return; // Don't switch turns - game is over
                }
            } else {
                inCheck = null;
                
                // Check for stalemate
                if (isStalemate(opponentColor)) {
                    gameOver = true;
                    showStalemateNotification();
                    return; // Don't switch turns - game is over
                }
            }
            
            // Switch turns
            switchTurns();
            
            // Render the updated board
            renderBoard();
        });
    });

    // Get valid moves for a piece (simplified rules)
    function getValidMoves(row, col) {
        const piece = gameBoard[row][col];
        if (!piece) return [];
        
        // Get basic valid moves
        let moves = getBasicValidMoves(row, col);
        
        // Filter moves that would put or leave own king in check
        moves = moves.filter(move => {
            // Make a deep copy of the game board to simulate the move
            const boardCopy = JSON.parse(JSON.stringify(gameBoard));
            
            // Simulate the move on the copy
            boardCopy[move.row][move.col] = boardCopy[row][col];
            boardCopy[row][col] = null;
            
            // Check if the player's king would be in check after this move
            return !isKingInCheck(piece.color, boardCopy);
        });
        
        // If king is in check, only allow moves that resolve the check
        if (inCheck === piece.color) {
            moves = moves.filter(move => {
                // Make a deep copy of the game board to simulate the move
                const boardCopy = JSON.parse(JSON.stringify(gameBoard));
                
                // Simulate the move on the copy
                boardCopy[move.row][move.col] = boardCopy[row][col];
                boardCopy[row][col] = null;
                
                // Check if the king is still in check after the move
                return !isKingInCheck(piece.color, boardCopy);
            });
        }
        
        return moves;
    }

    // Function to get basic valid moves without check validation
    function getBasicValidMoves(row, col) {
        const piece = gameBoard[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.piece) {
            case 'pawn':
                // Pawns move differently based on color
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;
                
                // Move forward one square
                if (isInBounds(row + direction, col) && !gameBoard[row + direction][col]) {
                    moves.push({ row: row + direction, col: col });
                    
                    // Move forward two squares from starting position
                    if (row === startRow && !gameBoard[row + 2 * direction][col]) {
                        moves.push({ row: row + 2 * direction, col: col });
                    }
                }
                
                // Capture diagonally
                for (const colOffset of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        gameBoard[newRow][newCol] && 
                        gameBoard[newRow][newCol].color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
                
            case 'rook':
                // Horizontal and vertical movement
                for (const [rowDir, colDir] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!gameBoard[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (gameBoard[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'knight':
                // L-shaped movement
                for (const [rowOffset, colOffset] of [
                    [2, 1], [2, -1], [-2, 1], [-2, -1],
                    [1, 2], [1, -2], [-1, 2], [-1, -2]
                ]) {
                    const newRow = row + rowOffset;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        (!gameBoard[newRow][newCol] || 
                         gameBoard[newRow][newCol].color !== piece.color)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
                
            case 'bishop':
                // Diagonal movement
                for (const [rowDir, colDir] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!gameBoard[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (gameBoard[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'queen':
                // Combination of rook and bishop movement
                for (const [rowDir, colDir] of [
                    [1, 0], [-1, 0], [0, 1], [0, -1],  // Rook directions
                    [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop directions
                ]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!gameBoard[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (gameBoard[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'king':
                // One square in any direction
                for (const [rowOffset, colOffset] of [
                    [1, 0], [-1, 0], [0, 1], [0, -1],
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ]) {
                    const newRow = row + rowOffset;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        (!gameBoard[newRow][newCol] || 
                         gameBoard[newRow][newCol].color !== piece.color)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
        }
        
        return moves;
    }

    // Check if coordinates are within the board
    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Initialize and reset game
    function resetGame() {
        initializeBoard();
        selectedPiece = null;
        validMoves = [];
        currentTurn = 'white';
        currentTurnElement.textContent = 'White';
        statusElement.textContent = '';
        promotionModal.style.display = 'none';
        checkmateNotification.classList.remove('show');
        stalemateNotification.classList.remove('show');
        pendingPromotion = null;
        inCheck = null;
        gameOver = false;
        renderBoard();
        
        // If computer play is enabled and it's computer's turn, make a move
        if (computerPlaying && currentTurn === computerColor) {
            setTimeout(makeComputerMove, 500);
        }
    }

    resetButton.addEventListener('click', resetGame);

    // Start the game
    resetGame();

    // Check if a king is in check
    function isKingInCheck(kingColor, board = gameBoard) {
        // Find the king's position
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.piece === 'king' && piece.color === kingColor) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }
        
        // Check if any opponent piece can capture the king
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        
        // Check for pawn attacks
        const pawnDirection = kingColor === 'white' ? 1 : -1;
        for (const colOffset of [-1, 1]) {
            const checkRow = kingRow + pawnDirection;
            const checkCol = kingCol + colOffset;
            
            if (isInBounds(checkRow, checkCol)) {
                const piece = board[checkRow][checkCol];
                if (piece && piece.piece === 'pawn' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // Check for knight attacks
        const knightMoves = [
            [2, 1], [2, -1], [-2, 1], [-2, -1],
            [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        
        for (const [rowOffset, colOffset] of knightMoves) {
            const checkRow = kingRow + rowOffset;
            const checkCol = kingCol + colOffset;
            
            if (isInBounds(checkRow, checkCol)) {
                const piece = board[checkRow][checkCol];
                if (piece && piece.piece === 'knight' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // Check for attacks from rooks, bishops, queens, and kings in all directions
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],  // Rook/Queen directions (horizontal/vertical)
            [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop/Queen directions (diagonal)
        ];
        
        for (const [rowDir, colDir] of directions) {
            let distance = 1;
            while (true) {
                const checkRow = kingRow + rowDir * distance;
                const checkCol = kingCol + colDir * distance;
                
                if (!isInBounds(checkRow, checkCol)) break;
                
                const piece = board[checkRow][checkCol];
                if (piece) {
                    if (piece.color === opponentColor) {
                        if (distance === 1 && piece.piece === 'king') {
                            return true;
                        }
                        
                        if ((rowDir === 0 || colDir === 0) && 
                            (piece.piece === 'rook' || piece.piece === 'queen')) {
                            return true;
                        }
                        
                        if ((rowDir !== 0 && colDir !== 0) && 
                            (piece.piece === 'bishop' || piece.piece === 'queen')) {
                            return true;
                        }
                    }
                    break;
                }
                
                distance++;
            }
        }
        
        return false;
    }

    // Check for checkmate
    function isCheckmate(kingColor) {
        // If the king is not in check, it can't be checkmate
        if (inCheck !== kingColor) return false;
        
        // Check if any piece of the checked color has a valid move
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameBoard[row][col];
                if (piece && piece.color === kingColor) {
                    // Get valid moves for this piece
                    const moves = getValidMoves(row, col);
                    // If there are any valid moves, it's not checkmate
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        
        // No valid moves found for any piece, it's checkmate
        return true;
    }

    // Show checkmate notification
    function showCheckmateNotification(winnerColor) {
        const winner = winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1);
        winnerText.textContent = `${winner} wins!`;
        checkmateNotification.classList.add('show');
        statusElement.textContent = '';
    }

    // New game button click event
    newGameButton.addEventListener('click', () => {
        checkmateNotification.classList.remove('show');
        resetGame();
    });

    // Computer AI - Make a move
    function makeComputerMove() {
        if (gameOver) return;
        
        // 1. Find all pieces that can move
        const possibleMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameBoard[row][col];
                if (piece && piece.color === computerColor) {
                    const moves = getValidMoves(row, col);
                    
                    if (moves.length > 0) {
                        moves.forEach(move => {
                            possibleMoves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: move.row,
                                toCol: move.col,
                                piece: piece.piece,
                                score: evaluateMove(row, col, move.row, move.col)
                            });
                        });
                    }
                }
            }
        }
        
        if (possibleMoves.length === 0) return;
        
        // 2. Sort moves by score (best moves first)
        possibleMoves.sort((a, b) => b.score - a.score);
        
        // 3. Select one of the best moves (with some randomness)
        // Take one of the top 3 moves (if available) to add variety
        const topMoveCount = Math.min(3, possibleMoves.length);
        const selectedMoveIndex = Math.floor(Math.random() * topMoveCount);
        const selectedMove = possibleMoves[selectedMoveIndex];
        
        // 4. Make the move
        movePiece(selectedMove.fromRow, selectedMove.fromCol, selectedMove.toRow, selectedMove.toCol);
        
        // 5. Render the updated board
        renderBoard();
    }

    // Improve the evaluateMove function
    function evaluateMove(fromRow, fromCol, toRow, toCol) {
        let score = 0;
        
        // Get the moving piece and possible captured piece
        const movingPiece = gameBoard[fromRow][fromCol];
        const capturedPiece = gameBoard[toRow][toCol];
        
        // Material value - piece values
        const pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        // Add score for capturing pieces
        if (capturedPiece) {
            score += pieceValues[capturedPiece.piece];
        }
        
        // Simulate the move
        const boardCopy = JSON.parse(JSON.stringify(gameBoard));
        boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
        boardCopy[fromRow][fromCol] = null;
        
        // Check if move causes check or checkmate
        const opponentColor = computerColor === 'white' ? 'black' : 'white';
        if (isKingInCheck(opponentColor, boardCopy)) {
            score += 50; // Bonus for check
            
            // Higher bonus for checkmate
            if (isCheckmateAfterMove(fromRow, fromCol, toRow, toCol)) {
                score += 10000;
            }
        }
        
        // Check if move leads to stalemate
        const computerPieceValue = evaluateBoardForColor(computerColor);
        const opponentPieceValue = evaluateBoardForColor(opponentColor);
        
        if (wouldCauseStalemate(fromRow, fromCol, toRow, toCol, opponentColor)) {
            // If we're winning, stalemate is bad
            if (computerPieceValue > opponentPieceValue + 3) {
                score -= 500;
            } else if (computerPieceValue < opponentPieceValue - 3) {
                // If we're losing, stalemate is good
                score += 500;
            }
        }
        
        // Add positional scoring using piece-square tables
        // Position evaluation for destination square
        let positionScore = getPositionalScore(movingPiece.piece, toRow, toCol, movingPiece.color);
        
        // Adjust position score based on game phase
        if (movingPiece.piece === 'king') {
            // Check if we're in endgame (when queens are gone or total material is low)
            const isEndgame = isEndgamePhase();
            if (isEndgame) {
                // Use endgame king table instead
                positionScore = getKingEndgameScore(toRow, toCol, movingPiece.color);
            }
        }
        
        score += positionScore;
        
        // Mobility - reward moves that increase piece mobility
        const mobilityAtStart = countMobility(boardCopy, computerColor);
        
        // Pawn structure - add bonus for protected pawns
        if (movingPiece.piece === 'pawn') {
            if (isPawnProtected(toRow, toCol, computerColor, boardCopy)) {
                score += 10;
            }
            
            // Bonus for pawn advancement, especially in endgame
            const rankBonus = computerColor === 'black' ? toRow : (7 - toRow);
            score += rankBonus * 5;
            
            // Extra bonus for pawn near promotion
            if ((computerColor === 'black' && toRow >= 5) || 
                (computerColor === 'white' && toRow <= 2)) {
                score += 20;
            }
        }
        
        // Piece-specific bonuses
        switch (movingPiece.piece) {
            case 'knight':
                // Knights are better in closed positions
                const pawnsOnBoard = countPawnsOnBoard(boardCopy);
                if (pawnsOnBoard > 12) {
                    score += 10;
                }
                break;
                
            case 'bishop':
                // Bishops are better in open positions
                const pawnsOnBoard2 = countPawnsOnBoard(boardCopy);
                if (pawnsOnBoard2 < 12) {
                    score += 10;
                }
                // Bonus for bishop pair
                if (hasBishopPair(boardCopy, computerColor)) {
                    score += 30;
                }
                break;
                
            case 'rook':
                // Bonus for rook on open file
                if (isOnOpenFile(toRow, toCol, boardCopy)) {
                    score += 20;
                }
                break;
        }
        
        // Add a small random factor for variety
        score += Math.random() * 10;
        
        return score;
    }

    // Function to check if we're in endgame (based on material)
    function isEndgamePhase() {
        let totalMaterial = 0;
        let queenCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameBoard[row][col];
                if (piece && piece.piece !== 'king') {
                    if (piece.piece === 'queen') {
                        queenCount++;
                    }
                    
                    const pieceValues = {
                        'pawn': 1,
                        'knight': 3,
                        'bishop': 3,
                        'rook': 5,
                        'queen': 9
                    };
                    
                    totalMaterial += pieceValues[piece.piece];
                }
            }
        }
        
        // Consider it endgame if queens are gone or total material is low
        return queenCount === 0 || totalMaterial < 20;
    }

    // Function to get positional score from piece-square tables
    function getPositionalScore(pieceType, row, col, color) {
        // Use piece-square tables for positional evaluation
        if (!pieceSquareTables[pieceType]) return 0;
        
        // Adjust for piece color (white reads tables from bottom to top)
        const adjustedRow = color === 'white' ? 7 - row : row;
        
        return pieceSquareTables[pieceType][adjustedRow][col];
    }

    // Function to get king endgame score
    function getKingEndgameScore(row, col, color) {
        // Adjust for piece color (white reads tables from bottom to top)
        const adjustedRow = color === 'white' ? 7 - row : row;
        
        return pieceSquareTables['kingEndgame'][adjustedRow][col];
    }

    // Count the total mobility (number of legal moves) for a color
    function countMobility(board, color) {
        let mobility = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    // Get basic moves without check validation for speed
                    const moves = getBasicValidMovesForBoard(row, col, board);
                    mobility += moves.length;
                }
            }
        }
        
        return mobility;
    }

    // Check if a pawn is protected by another pawn
    function isPawnProtected(row, col, color, board) {
        const direction = color === 'white' ? 1 : -1;
        
        // Check if pawn is protected by another pawn
        for (const offset of [-1, 1]) {
            const protectorRow = row + direction;
            const protectorCol = col + offset;
            
            if (isInBounds(protectorRow, protectorCol)) {
                const piece = board[protectorRow][protectorCol];
                if (piece && piece.piece === 'pawn' && piece.color === color) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Count total pawns on the board
    function countPawnsOnBoard(board) {
        let count = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.piece === 'pawn') {
                    count++;
                }
            }
        }
        
        return count;
    }

    // Check if player has a bishop pair
    function hasBishopPair(board, color) {
        let lightSquareBishop = false;
        let darkSquareBishop = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.piece === 'bishop' && piece.color === color) {
                    // Check if bishop is on light or dark square
                    if ((row + col) % 2 === 0) {
                        lightSquareBishop = true;
                    } else {
                        darkSquareBishop = true;
                    }
                }
            }
        }
        
        return lightSquareBishop && darkSquareBishop;
    }

    // Check if a rook is on an open file (no pawns on the file)
    function isOnOpenFile(row, col, board) {
        for (let r = 0; r < 8; r++) {
            if (board[r][col] && board[r][col].piece === 'pawn') {
                return false;
            }
        }
        
        return true;
    }

    // Check for stalemate
    function isStalemate(playerColor) {
        // If the player is in check, it's not stalemate
        if (isKingInCheck(playerColor)) return false;
        
        // Check if the player has any valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameBoard[row][col];
                if (piece && piece.color === playerColor) {
                    // Get valid moves for this piece
                    const moves = getValidMoves(row, col);
                    // If there are any valid moves, it's not stalemate
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        
        // No valid moves found for any piece, but king is not in check, it's stalemate
        return true;
    }

    // Show stalemate notification
    function showStalemateNotification() {
        stalemateNotification.classList.add('show');
        statusElement.textContent = '';
    }

    // Stalemate new game button click event
    stalemateNewGameButton.addEventListener('click', () => {
        stalemateNotification.classList.remove('show');
        resetGame();
    });

    // Evaluate total piece value for a color
    function evaluateBoardForColor(color) {
        const pieceValues = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 0 // Don't count king in piece value
        };
        
        let totalValue = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameBoard[row][col];
                if (piece && piece.color === color) {
                    totalValue += pieceValues[piece.piece];
                }
            }
        }
        
        return totalValue;
    }

    // Check if a move would cause stalemate
    function wouldCauseStalemate(fromRow, fromCol, toRow, toCol, opponentColor) {
        // Make a deep copy of the board
        const boardCopy = JSON.parse(JSON.stringify(gameBoard));
        
        // Simulate the move
        boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
        boardCopy[fromRow][fromCol] = null;
        
        // Check if the opponent would be in check after this move
        if (isKingInCheck(opponentColor, boardCopy)) {
            return false; // Not stalemate if in check
        }
        
        // Check if the opponent would have any valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardCopy[row][col];
                if (piece && piece.color === opponentColor) {
                    // Get basic moves for this piece
                    const basicMoves = getBasicValidMovesForBoard(row, col, boardCopy);
                    
                    // Check if any move would resolve the potential stalemate
                    for (const move of basicMoves) {
                        // Make a new board copy for this potential counter-move
                        const counterMoveBoardCopy = JSON.parse(JSON.stringify(boardCopy));
                        
                        // Apply the counter-move
                        counterMoveBoardCopy[move.row][move.col] = counterMoveBoardCopy[row][col];
                        counterMoveBoardCopy[row][col] = null;
                        
                        // If this move doesn't put their own king in check, it's a valid move
                        if (!isKingInCheck(opponentColor, counterMoveBoardCopy)) {
                            return false; // Not stalemate if there's a valid move
                        }
                    }
                }
            }
        }
        
        // If we've checked all pieces and moves and none are valid, it's stalemate
        return true;
    }

    // Check if a move would result in checkmate
    function isCheckmateAfterMove(fromRow, fromCol, toRow, toCol) {
        // Make a deep copy of the board
        const boardCopy = JSON.parse(JSON.stringify(gameBoard));
        
        // Simulate the move
        boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
        boardCopy[fromRow][fromCol] = null;
        
        const opponentColor = computerColor === 'white' ? 'black' : 'white';
        
        // First check if the move puts the opponent in check
        if (!isKingInCheck(opponentColor, boardCopy)) {
            return false;
        }
        
        // Then check if opponent has any valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = boardCopy[row][col];
                if (piece && piece.color === opponentColor) {
                    // Check all possible moves for this piece
                    const basicMoves = getBasicValidMovesForBoard(row, col, boardCopy);
                    
                    for (const move of basicMoves) {
                        // Make a new board copy for this potential counter-move
                        const counterMoveBoardCopy = JSON.parse(JSON.stringify(boardCopy));
                        
                        // Apply the counter-move
                        counterMoveBoardCopy[move.row][move.col] = counterMoveBoardCopy[row][col];
                        counterMoveBoardCopy[row][col] = null;
                        
                        // If this move gets the king out of check, then it's not checkmate
                        if (!isKingInCheck(opponentColor, counterMoveBoardCopy)) {
                            return false;
                        }
                    }
                }
            }
        }
        
        // If we've checked all pieces and moves and none resolve the check, it's checkmate
        return true;
    }

    // Get basic valid moves for a piece on a specific board state
    function getBasicValidMovesForBoard(row, col, board) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const moves = [];
        
        switch (piece.piece) {
            case 'pawn':
                // Pawns move differently based on color
                const direction = piece.color === 'white' ? -1 : 1;
                const startRow = piece.color === 'white' ? 6 : 1;
                
                // Move forward one square
                if (isInBounds(row + direction, col) && !board[row + direction][col]) {
                    moves.push({ row: row + direction, col: col });
                    
                    // Move forward two squares from starting position
                    if (row === startRow && !board[row + 2 * direction][col]) {
                        moves.push({ row: row + 2 * direction, col: col });
                    }
                }
                
                // Capture diagonally
                for (const colOffset of [-1, 1]) {
                    const newRow = row + direction;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        board[newRow][newCol] && 
                        board[newRow][newCol].color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
                
            case 'rook':
                // Horizontal and vertical movement
                for (const [rowDir, colDir] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!board[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (board[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'knight':
                // L-shaped movement
                for (const [rowOffset, colOffset] of [
                    [2, 1], [2, -1], [-2, 1], [-2, -1],
                    [1, 2], [1, -2], [-1, 2], [-1, -2]
                ]) {
                    const newRow = row + rowOffset;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        (!board[newRow][newCol] || 
                         board[newRow][newCol].color !== piece.color)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
                
            case 'bishop':
                // Diagonal movement
                for (const [rowDir, colDir] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!board[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (board[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'queen':
                // Combination of rook and bishop movement
                for (const [rowDir, colDir] of [
                    [1, 0], [-1, 0], [0, 1], [0, -1],  // Rook directions
                    [1, 1], [1, -1], [-1, 1], [-1, -1]  // Bishop directions
                ]) {
                    let newRow = row + rowDir;
                    let newCol = col + colDir;
                    
                    while (isInBounds(newRow, newCol)) {
                        if (!board[newRow][newCol]) {
                            moves.push({ row: newRow, col: newCol });
                        } else {
                            if (board[newRow][newCol].color !== piece.color) {
                                moves.push({ row: newRow, col: newCol });
                            }
                            break;
                        }
                        
                        newRow += rowDir;
                        newCol += colDir;
                    }
                }
                break;
                
            case 'king':
                // One square in any direction
                for (const [rowOffset, colOffset] of [
                    [1, 0], [-1, 0], [0, 1], [0, -1],
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ]) {
                    const newRow = row + rowOffset;
                    const newCol = col + colOffset;
                    
                    if (isInBounds(newRow, newCol) && 
                        (!board[newRow][newCol] || 
                         board[newRow][newCol].color !== piece.color)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
                break;
        }
        
        return moves;
    }
}); 