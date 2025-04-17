# Chess Web Application

A simple chess game built with HTML, CSS, and JavaScript that you can play in your web browser.

## Features

- Interactive chess board with piece movement
- Turn-based gameplay (white starts)
- Valid move highlighting
- Piece selection highlighting
- Reset game functionality

## How to Use

1. Open `index.html` in any modern web browser
2. White pieces are at the bottom, black pieces at the top
3. Click on a piece to select it - valid moves will be highlighted
4. Click on a highlighted square to move the selected piece
5. To deselect a piece, click on an invalid square
6. Use the "New Game" button to reset the board

## Game Rules

This implementation includes basic chess piece movement:
- Pawns move forward one square (or two on their first move) and capture diagonally
- Rooks move horizontally and vertically any number of squares
- Knights move in an L-shape (two squares in one direction and one square perpendicular)
- Bishops move diagonally any number of squares
- Queens move horizontally, vertically, or diagonally any number of squares
- Kings move one square in any direction

Note: This implementation is a simplified version of chess and does not include special moves like castling, en passant, or pawn promotion. It also does not check for checkmate or stalemate conditions.

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Unicode chess symbols for pieces 