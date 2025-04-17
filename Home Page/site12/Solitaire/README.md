# Solitaire Game

A classic implementation of Klondike Solitaire using Python and Pygame.

## Requirements

- Python 3.6 or higher
- Pygame 2.5.2

## Installation

1. Make sure you have Python installed on your system
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## How to Play

1. Run the game:
```bash
python solitaire.py
```

2. Game Rules:
- The goal is to move all cards to the four foundation piles (top right)
- Cards in the foundation piles must be of the same suit and in ascending order (A, 2, 3, ..., K)
- In the tableau (main playing area), cards must be placed in descending order and alternating colors
- Only Kings can be placed on empty tableau spots
- Click and drag cards to move them
- Click the deck (bottom left) to draw new cards
- Right-click a card to attempt to automatically move it to the foundation

## Controls

- Left Click: Select and drag cards
- Right Click: Try to automatically move a card to the foundation
- Click Deck: Draw a new card or recycle the waste pile 