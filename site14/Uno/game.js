class Card {
    constructor(color, value, type = 'number') {
        this.color = color;
        this.value = value;
        this.type = type;
    }

    toString() {
        return `${this.color} ${this.value}`;
    }
}

class UnoGame {
    constructor() {
        this.deck = [];
        this.discardPile = [];
        this.players = [];
        this.currentPlayerIndex = 0;
        this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
        this.isGameStarted = false;
        this.colors = ['red', 'blue', 'green', 'yellow'];
        this.values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.specialCards = ['skip', 'reverse', 'draw2'];
        this.wildCards = ['wild', 'wild_draw4'];
        
        this.draggedCard = null;
        this.draggedCardIndex = -1;
        this.draggedPlayerIndex = -1;
        
        // Initialize player count to 2
        this.playerCount = 2;
        
        // Computer player settings - always enabled
        this.isComputerEnabled = true;
        this.computerDelay = 1000; // milliseconds delay before computer plays
        this.computerTimerId = null;
        
        // Color selection popup
        this.colorPopup = document.getElementById('colorPopup');
        this.pendingWildCard = null;
        
        // Add stacking tracking
        this.accumulatedCards = 0;
        this.isStacking = false;
        this.lastStackedCard = null;
        
        // Add UNO prompt tracking
        this.unoPromptTimeout = null;
        this.unoPromptActive = false;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Create deck
        this.createDeck();
        this.shuffleDeck();
        
        // Setup UI elements
        this.drawPileElement = document.getElementById('drawPile');
        this.discardPileElement = document.getElementById('discardPile');
        this.playersContainer = document.getElementById('playersContainer');
        this.currentPlayerNameElement = document.getElementById('currentPlayerName');
        
        // Hide draw card button initially
        const drawCardButton = document.getElementById('drawCard');
        if (drawCardButton) {
            drawCardButton.style.display = 'none';
        }
    }

    createDeck() {
        // Create number cards
        this.colors.forEach(color => {
            this.values.forEach(value => {
                this.deck.push(new Card(color, value));
            });
        });

        // Create special cards (skip, reverse, draw2)
        this.colors.forEach(color => {
            this.specialCards.forEach(type => {
                this.deck.push(new Card(color, type, 'special'));
            });
        });

        // Create wild cards
        this.wildCards.forEach(type => {
            this.deck.push(new Card('black', type, 'wild'));
        });
    }

    shuffleDeck() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    setupEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        
        // Add draw card button event listener
        document.getElementById('drawCard').addEventListener('click', () => {
            if (this.isGameStarted) {
                this.drawCard();
            }
        });

        // Add color selection event listeners
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.handleColorSelection(color);
            });
        });

        // Add UNO button event listener
        document.getElementById('unoButton').addEventListener('click', () => this.handleUnoClick());

        // Add win notification button listeners
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        document.getElementById('quitToMenuBtn').addEventListener('click', () => {
            // Make sure we fully reset the game state
            this.resetGame();
            document.getElementById('winNotification').classList.remove('active');
            
            // Explicitly ensure all menu elements are visible
            const startGameButton = document.getElementById('startGame');
            if (startGameButton) {
                startGameButton.style.display = 'inline-block';
            }
            
            // Also clear the players container
            const playersContainer = document.getElementById('playersContainer');
            if (playersContainer) {
                playersContainer.innerHTML = '';
            }
        });
    }

    startGame() {
        // Always use 2 players (1 human + 1 bot)
        this.playerCount = 2;

        this.isGameStarted = true;
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.createDeck();
        this.shuffleDeck();

        // Create players - Player 1 is always human, Player 2 is computer-controlled
        this.players.push({
            name: 'You',
            hand: [],
            isComputer: false
        });
        
        this.players.push({
            name: 'Computer',
            hand: [],
            isComputer: true
        });

        // Deal initial cards (7 per player)
        this.players.forEach(player => {
            for (let i = 0; i < 7; i++) {
                player.hand.push(this.deck.pop());
            }
        });

        // Find a number card for the first card
        let firstCard;
        do {
            firstCard = this.deck.pop();
        } while (firstCard.type !== 'number');
        
        // Start discard pile with the number card
        this.discardPile.push(firstCard);

        this.updateUI();
        
        // Hide start game button once game is started
        const startGameButton = document.getElementById('startGame');
        if (startGameButton) {
            startGameButton.style.display = 'none';
        }
        
        // Show draw card button and enable it
        const drawCardButton = document.getElementById('drawCard');
        if (drawCardButton) {
            drawCardButton.style.display = 'inline-block';
            drawCardButton.disabled = false;
        }
        
        // Check if computer should play
        this.checkComputerTurn();
    }

    canPlayCard(card, topCard) {
        return card.color === topCard.color ||
               card.value === topCard.value ||
               card.type === 'wild' ||
               (card.type === 'wild' && card.value === 'wild_draw4');
    }

    hasPlayableCard(playerIndex) {
        const player = this.players[playerIndex];
        const topCard = this.discardPile[this.discardPile.length - 1];
        return player.hand.some(card => this.canPlayCard(card, topCard));
    }

    nextTurn() {
        // Clear any existing computer move timer
        this.clearComputerTimer();
        
        // Check if we're in a stacking sequence and if the next player can continue it
        if (this.isStacking) {
            const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
            const nextPlayer = this.players[nextPlayerIndex];
            const topCard = this.discardPile[this.discardPile.length - 1];
            
            // Check if next player has a matching +2 or +4 card
            const canContinueChain = nextPlayer.hand.some(card => 
                (card.value === 'draw2' && this.lastStackedCard.value === 'draw2') ||
                (card.value === 'wild_draw4' && this.lastStackedCard.value === 'wild_draw4')
            );
            
            if (!canContinueChain) {
                // Apply accumulated cards and skip their turn
                this.drawCards(nextPlayerIndex, this.accumulatedCards);
                this.currentPlayerIndex = (nextPlayerIndex + this.direction + this.players.length) % this.players.length;
                this.resetStacking();
                this.updateUI();
                this.checkComputerTurn();
                return;
            }
        }
        
        // Normal turn progression
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        
        this.updateUI();
        this.checkComputerTurn();
    }
    
    checkComputerTurn() {
        // Check if it's a computer player's turn
        if (this.isGameStarted && this.isComputerEnabled) {
            const currentPlayer = this.players[this.currentPlayerIndex];
            
            if (currentPlayer && currentPlayer.isComputer) {
                // Set a delay before the computer makes a move
                this.computerTimerId = setTimeout(() => {
                    this.playComputerTurn();
                }, this.computerDelay);
            }
        }
    }
    
    clearComputerTimer() {
        if (this.computerTimerId) {
            clearTimeout(this.computerTimerId);
            this.computerTimerId = null;
        }
    }
    
    playComputerTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerIndex = this.currentPlayerIndex; // Store this for win detection
        const topCard = this.discardPile[this.discardPile.length - 1];
        
        // Find playable cards
        const playableCards = currentPlayer.hand.map((card, index) => ({card, index}))
            .filter(({card}) => this.isValidPlay(card, topCard));
        
        if (playableCards.length > 0) {
            // Sort playable cards by priority
            // Priority: Wild Draw4, Draw2, Skip, Reverse, Wild, Number cards
            playableCards.sort((a, b) => {
                const getPriority = (card) => {
                    if (card.value === 'wild_draw4') return 6;
                    if (card.value === 'draw2') return 5;
                    if (card.value === 'skip') return 4;
                    if (card.value === 'reverse') return 3;
                    if (card.value === 'wild') return 2;
                    return 1;
                };
                
                return getPriority(b.card) - getPriority(a.card);
            });
            
            // Play the highest priority card
            const {card, index} = playableCards[0];
            
            // If it's a wild card, choose a color
            if (card.type === 'wild') {
                // Count colors in hand and pick the most common
                const colorCounts = {};
                this.colors.forEach(color => colorCounts[color] = 0);
                
                currentPlayer.hand.forEach(c => {
                    if (c.color !== 'black') {
                        colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
                    }
                });
                
                // Find the most frequent color
                let mostCommonColor = 'red'; // default
                let maxCount = 0;
                
                for (const color in colorCounts) {
                    if (colorCounts[color] > maxCount) {
                        maxCount = colorCounts[color];
                        mostCommonColor = color;
                    }
                }
                
                // Remove the card from hand
                currentPlayer.hand.splice(index, 1);
                
                // Check for winner immediately after removing card
                if (currentPlayer.hand.length === 0) {
                    // Add wild card to discard pile with chosen color
                    card.color = mostCommonColor;
                    this.discardPile.push(card);
                    this.updateUI();
                    console.log(`Computer player ${playerIndex} (${currentPlayer.name}) has won!`);
                    this.showWinNotification(playerIndex);
                    return;
                }
                
                // Add wild card to discard pile with chosen color
                card.color = mostCommonColor;
                this.discardPile.push(card);
                
                // Handle special effects
                if (card.value === 'wild_draw4') {
                    if (!this.isStacking) {
                        this.startStacking(card);
                    }
                    this.accumulateCards(4);
                    this.nextTurn();
                } else {
                    this.nextTurn();
                    this.resetStacking();
                }
            } else {
                // Play the non-wild card
                currentPlayer.hand.splice(index, 1);
                
                // Check for winner immediately after removing card
                if (currentPlayer.hand.length === 0) {
                    // Add card to discard pile
                    this.discardPile.push(card);
                    this.updateUI();
                    console.log(`Computer player ${playerIndex} (${currentPlayer.name}) has won!`);
                    this.showWinNotification(playerIndex);
                    return;
                }
                
                // Add card to discard pile
                this.discardPile.push(card);
                
                // Handle special card effects
                if (card.value === 'reverse') {
                    this.direction *= -1;
                    this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                    this.nextTurn();
                    this.resetStacking();
                } else if (card.value === 'skip') {
                    this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                    this.nextTurn();
                    this.resetStacking();
                } else if (card.value === 'draw2') {
                    if (!this.isStacking) {
                        this.startStacking(card);
                    }
                    this.accumulateCards(2);
                    this.nextTurn();
                } else {
                    this.nextTurn();
                    this.resetStacking();
                }
            }
            
            this.updateUI();
            
            // Check for UNO
            if (currentPlayer.hand.length === 1) {
                // Computer automatically says UNO
                console.log("Computer says UNO!");
            }
        } else {
            // No playable cards, draw a card
            console.log("Computer drawing a card - no playable cards");
            
            // Show a notification that computer is drawing
            this.showComputerDrawNotification(currentPlayer.name);
            
            // Add a delay to make the draw more visible
            setTimeout(() => {
                if (this.deck.length === 0) {
                    this.reshuffleDeck();
                }
                
                // Draw a card from the deck
                const card = this.deck.pop();
                currentPlayer.hand.push(card);
                
                // Update UI to show new card being added to computer's hand
                this.updateUI();
                
                // Add an extra delay to make it clear the computer has drawn
                setTimeout(() => {
                    // Check if the drawn card is playable
                    if (this.isValidPlay(card, topCard)) {
                        console.log("Computer can play drawn card:", card);
                        
                        // Show notification that computer is playing the drawn card
                        this.showComputerPlayDrawnCardNotification(currentPlayer.name);
                        
                        // Add a delay before playing the drawn card
                        setTimeout(() => {
                            const cardIndex = currentPlayer.hand.indexOf(card);
                            if (cardIndex !== -1) {
                                // Handle card play directly
                                if (card.type === 'wild') {
                                    // For wild cards, we need to choose a color
                                    // Count colors in hand and pick the most common
                                    const colorCounts = {};
                                    this.colors.forEach(color => colorCounts[color] = 0);
                                    
                                    currentPlayer.hand.forEach(c => {
                                        if (c.color !== 'black') {
                                            colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
                                        }
                                    });
                                    
                                    // Find the most frequent color
                                    let mostCommonColor = 'red'; // default
                                    let maxCount = 0;
                                    
                                    for (const color in colorCounts) {
                                        if (colorCounts[color] > maxCount) {
                                            maxCount = colorCounts[color];
                                            mostCommonColor = color;
                                        }
                                    }
                                    
                                    // Remove the card from hand
                                    currentPlayer.hand.splice(cardIndex, 1);
                                    
                                    // Check for win after removing card
                                    if (currentPlayer.hand.length === 0) {
                                        // Set the wild card color and add to discard pile
                                        card.color = mostCommonColor;
                                        this.discardPile.push(card);
                                        this.updateUI();
                                        this.hideNotification();
                                        console.log(`Computer player ${playerIndex} won after playing drawn card!`);
                                        this.showWinNotification(playerIndex);
                                        return;
                                    }
                                    
                                    // Set the wild card color
                                    card.color = mostCommonColor;
                                    this.discardPile.push(card);
                                    
                                    // Handle special effects
                                    if (card.value === 'wild_draw4') {
                                        if (!this.isStacking) {
                                            this.startStacking(card);
                                        }
                                        this.accumulateCards(4);
                                        this.nextTurn();
                                    } else {
                                        this.nextTurn();
                                        this.resetStacking();
                                    }
                                } else {
                                    // Remove the card from hand and add to discard pile
                                    currentPlayer.hand.splice(cardIndex, 1);
                                    
                                    // Check for win after removing card
                                    if (currentPlayer.hand.length === 0) {
                                        this.discardPile.push(card);
                                        this.updateUI();
                                        this.hideNotification();
                                        console.log(`Computer player ${playerIndex} won after playing drawn card!`);
                                        this.showWinNotification(playerIndex);
                                        return;
                                    }
                                    
                                    this.discardPile.push(card);
                                    
                                    // Handle special card effects
                                    if (card.value === 'reverse') {
                                        this.direction *= -1;
                                        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                                        this.nextTurn();
                                        this.resetStacking();
                                    } else if (card.value === 'skip') {
                                        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                                        this.nextTurn();
                                        this.resetStacking();
                                    } else if (card.value === 'draw2') {
                                        if (!this.isStacking) {
                                            this.startStacking(card);
                                        }
                                        this.accumulateCards(2);
                                        this.nextTurn();
                                    } else {
                                        this.nextTurn();
                                        this.resetStacking();
                                    }
                                }
                                this.updateUI();
                                this.hideNotification();
                            }
                        }, this.computerDelay);
                    } else {
                        console.log("Computer cannot play drawn card, moving to next turn");
                        // Show notification that computer cannot play the drawn card
                        this.showComputerCannotPlayNotification(currentPlayer.name);
                        
                        setTimeout(() => {
                            // Move to the next player
                            this.nextTurn();
                            this.hideNotification();
                        }, this.computerDelay);
                    }
                }, this.computerDelay);
            }, this.computerDelay);
        }
    }

    drawCard() {
        // Prevent human players from drawing for computer players
        // But allow drawCard to work when called by computer player logic
        const isCalledFromComputerLogic = new Error().stack.includes('playComputerTurn');
        if (this.players[this.currentPlayerIndex].isComputer && !isCalledFromComputerLogic) {
            return null;
        }
        
        if (this.deck.length === 0) {
            this.reshuffleDeck();
        }
        const card = this.deck.pop();
        this.players[this.currentPlayerIndex].hand.push(card);
        
        // If current player is computer and drawn card can be played, play it
        const currentPlayer = this.players[this.currentPlayerIndex];
        const topCard = this.discardPile[this.discardPile.length - 1];
        
        if (currentPlayer.isComputer && this.canPlayCard(card, topCard)) {
            // Add a small delay before playing the drawn card
            setTimeout(() => {
                // Find the index of the drawn card
                const cardIndex = currentPlayer.hand.indexOf(card);
                if (cardIndex !== -1) {
                    this.handleCardClick(null, this.currentPlayerIndex, cardIndex);
                }
            }, this.computerDelay / 2);
            return card;
        } else if (currentPlayer.isComputer) {
            // Computer player can't play, move to next turn
            this.nextTurn();
            return null;
        }
        
        // Human player - if the drawn card can be played, allow them to play it
        if (this.canPlayCard(card, topCard)) {
            // Don't move to next player, let them play the card manually
            this.updateUI();
            return card;
        }
        
        // If the drawn card can't be played, move to next player
        this.nextTurn();
        return null;
    }

    drawCards(playerIndex, count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this.reshuffleDeck();
            }
            this.players[playerIndex].hand.push(this.deck.pop());
        }
    }

    reshuffleDeck() {
        // Keep only the top card in the discard pile
        const topCard = this.discardPile.pop();
        
        // Add all other cards back to the deck
        this.deck = [...this.discardPile];
        
        // Reset the discard pile with just the top card
        this.discardPile = [topCard];
        
        // Shuffle the deck thoroughly
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        
        // Add some additional randomization
        for (let i = 0; i < 3; i++) {
            this.shuffleDeck();
        }
    }

    playCard(playerIndex, cardIndex) {
        const card = this.players[playerIndex].hand[cardIndex];
        const topCard = this.discardPile[this.discardPile.length - 1];

        if (this.isValidPlay(card, topCard)) {
            // Handle special cards
            if (card.value === 'reverse') {
                this.direction *= -1;
            } else if (card.value === 'skip') {
                this.nextTurn();
                return true;
            } else if (card.value === 'draw2') {
                const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                for (let i = 0; i < 2; i++) {
                    this.players[nextPlayerIndex].hand.push(this.drawCard());
                }
                this.nextTurn();
                return true;
            } else if (card.value === 'wild_draw4') {
                const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                for (let i = 0; i < 4; i++) {
                    this.players[nextPlayerIndex].hand.push(this.drawCard());
                }
                this.nextTurn();
                return true;
            }
            return true;
        }
        return false;
    }

    isValidPlay(card, topCard) {
        // Allow stacking of +2 and +4 cards
        if (this.isStacking && (card.value === 'draw2' || card.value === 'wild_draw4')) {
            return card.value === this.lastStackedCard.value;
        }
        
        return card.color === topCard.color ||
               card.value === topCard.value ||
               card.type === 'wild' ||
               (card.type === 'wild' && card.value === 'wild_draw4');
    }

    handleSpecialCard(card) {
        switch (card.value) {
            case 'reverse':
                this.direction *= -1;
                break;
            case 'skip':
                this.nextTurn();
                break;
            case 'draw2':
                this.nextTurn();
                const nextPlayer = this.players[this.currentPlayerIndex];
                for (let i = 0; i < 2; i++) {
                    if (this.deck.length === 0) this.reshuffleDeck();
                    nextPlayer.hand.push(this.deck.pop());
                }
                break;
            case 'wild_draw4':
                this.nextTurn();
                const targetPlayer = this.players[this.currentPlayerIndex];
                for (let i = 0; i < 4; i++) {
                    if (this.deck.length === 0) this.reshuffleDeck();
                    targetPlayer.hand.push(this.deck.pop());
                }
                break;
        }
    }

    updateUI() {
        // Update discard pile
        this.discardPileElement.innerHTML = '';
        if (this.discardPile.length > 0) {
            const topCard = this.discardPile[this.discardPile.length - 1];
            const cardElement = this.createCardElement(topCard, -1, -1);
            this.discardPileElement.appendChild(cardElement);
        }

        // Update players
        this.playersContainer.innerHTML = '';
        this.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = `player-hand ${index === this.currentPlayerIndex ? 'current-turn' : ''}`;
            playerElement.setAttribute('data-player-index', index);
            
            const playerName = document.createElement('h3');
            // Don't add "(Computer)" again if the name is already "Computer"
            if (player.name === 'Computer') {
                playerName.textContent = `${player.name} ${index === this.currentPlayerIndex ? '(Current)' : ''}`;
            } else {
                playerName.textContent = `${player.name} ${player.isComputer ? '(Computer)' : ''} ${index === this.currentPlayerIndex ? '(Current)' : ''}`;
            }
            
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards';
            
            player.hand.forEach((card, cardIndex) => {
                const cardElement = this.createCardElement(card, index, cardIndex);
                cardsContainer.appendChild(cardElement);
            });
            
            playerElement.appendChild(playerName);
            playerElement.appendChild(cardsContainer);
            this.playersContainer.appendChild(playerElement);
        });

        // Update current player name
        this.currentPlayerNameElement.textContent = this.players[this.currentPlayerIndex].name;
        
        // Disable draw button if current player is a computer
        const drawButton = document.getElementById('drawCard');
        if (drawButton) {
            if (this.isGameStarted && this.players[this.currentPlayerIndex].isComputer) {
                drawButton.disabled = true;
            } else if (this.isGameStarted) {
                drawButton.disabled = false;
            }
        }

        // Check for winner
        this.checkWinner();
    }

    createCardElement(card, playerIndex, cardIndex) {
        const cardElement = document.createElement('div');
        const player = playerIndex !== -1 ? this.players[playerIndex] : null;
        
        // Check if this is a computer player's card (except for the discard pile)
        const isComputerCard = player && player.isComputer && playerIndex !== -1;
        
        if (isComputerCard) {
            // Create a hidden card back for computer players
            cardElement.className = 'card hidden';
            
            // We still store the actual card data as attributes for the AI logic
            cardElement.setAttribute('data-color', card.color);
            cardElement.setAttribute('data-value', card.value);
            cardElement.setAttribute('data-player-index', playerIndex);
            cardElement.setAttribute('data-card-index', cardIndex);
            
            // Add the card back design
            const cardBackDesign = document.createElement('div');
            cardBackDesign.className = 'card-back-design';
            cardElement.appendChild(cardBackDesign);
        } else {
            // For human players or discard pile, display the actual card
            cardElement.className = `card ${card.color}`;
            cardElement.setAttribute('data-value', card.value);
            cardElement.setAttribute('data-player-index', playerIndex);
            cardElement.setAttribute('data-card-index', cardIndex);
            
            const valueElement = document.createElement('div');
            valueElement.className = 'card-value';
            valueElement.textContent = card.value;
            
            const symbolElement = document.createElement('div');
            symbolElement.className = 'card-symbol';
            
            cardElement.appendChild(valueElement);
            cardElement.appendChild(symbolElement);
        }

        // Add click event listener for player cards
        if (playerIndex !== -1) {
            // Only add click event for human players
            const player = this.players[playerIndex];
            if (!player.isComputer) {
                cardElement.addEventListener('click', (e) => this.handleCardClick(e, playerIndex, cardIndex));
            }
        }
        
        return cardElement;
    }

    handleCardClick(e, playerIndex, cardIndex) {
        // Only allow the current player to play cards
        if (playerIndex !== this.currentPlayerIndex) {
            return;
        }

        const card = this.players[playerIndex].hand[cardIndex];
        const topCard = this.discardPile[this.discardPile.length - 1];

        if (this.isValidPlay(card, topCard)) {
            // Remove the card from the player's hand
            this.players[playerIndex].hand.splice(cardIndex, 1);
            
            // Check for UNO condition
            if (this.players[playerIndex].hand.length === 1) {
                const player = this.players[playerIndex];
                if (!player.isComputer) {
                    this.showUnoPrompt(playerIndex);
                }
            }
            
            // Handle wild cards
            if (card.type === 'wild') {
                this.pendingWildCard = card;
                
                // If computer player, auto-select color
                if (this.players[playerIndex].isComputer) {
                    // Count colors in hand and pick the most common
                    const colorCounts = {};
                    this.colors.forEach(color => colorCounts[color] = 0);
                    
                    this.players[playerIndex].hand.forEach(c => {
                        if (c.color !== 'black') {
                            colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
                        }
                    });
                    
                    // Find the most frequent color
                    let mostCommonColor = 'red'; // default
                    let maxCount = 0;
                    
                    for (const color in colorCounts) {
                        if (colorCounts[color] > maxCount) {
                            maxCount = colorCounts[color];
                            mostCommonColor = color;
                        }
                    }
                    
                    this.handleColorSelection(mostCommonColor);
                } else {
                    this.showColorPopup();
                }
                return;
            }
            
            // Add the card to the discard pile
            this.discardPile.push(card);
            
            // Handle special card effects
            if (card.value === 'reverse') {
                this.direction *= -1;
                this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                this.nextTurn();
                this.resetStacking();
            } else if (card.value === 'skip') {
                this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
                this.nextTurn();
                this.resetStacking();
            } else if (card.value === 'draw2' || card.value === 'wild_draw4') {
                if (!this.isStacking) {
                    this.startStacking(card);
                }
                this.accumulateCards(card.value === 'draw2' ? 2 : 4);
                this.nextTurn();
            } else {
                this.nextTurn();
                this.resetStacking();
            }
            
            this.updateUI();
            
            // Check for winner
            if (this.players[playerIndex].hand.length === 0) {
                this.showWinNotification(playerIndex);
                return;
            }
        }
    }

    getCardColor(color) {
        const colors = {
            red: '#ff4444',
            blue: '#4444ff',
            green: '#44ff44',
            yellow: '#ffff44',
            black: '#333'
        };
        return colors[color] || '#fff';
    }

    checkWinner() {
        const winner = this.players.find(player => player.hand.length === 0);
        if (winner) {
            this.showWinNotification(this.players.indexOf(winner));
        }
    }

    resetGame() {
        this.isGameStarted = false;
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.direction = 1;
        this.draggedCard = null;
        this.draggedCardIndex = -1;
        this.draggedPlayerIndex = -1;
        this.isStacking = false;
        this.accumulatedCards = 0;
        this.lastStackedCard = null;
        this.unoPromptActive = false;
        
        // Computer mode is always enabled
        this.isComputerEnabled = true;
        
        // Clear any existing timeouts
        if (this.unoPromptTimeout) {
            clearTimeout(this.unoPromptTimeout);
        }
        this.clearComputerTimer();
        
        // Hide notifications
        document.getElementById('unoPrompt').classList.remove('active');
        document.getElementById('winNotification').classList.remove('active');
        this.hideNotification();
        
        // Clear the discard pile display
        if (this.discardPileElement) {
            this.discardPileElement.innerHTML = '';
        }
        
        // Clear the players container
        if (this.playersContainer) {
            this.playersContainer.innerHTML = '';
        }
        
        // Reset current player name
        if (this.currentPlayerNameElement) {
            this.currentPlayerNameElement.textContent = '-';
        }
        
        // Show start game button again
        const startGameButton = document.getElementById('startGame');
        if (startGameButton) {
            startGameButton.style.display = 'inline-block';
        }
        
        // Hide draw card button again
        const drawCardButton = document.getElementById('drawCard');
        if (drawCardButton) {
            drawCardButton.style.display = 'none';
        }
    }

    showColorPopup() {
        this.colorPopup.classList.add('active');
    }

    hideColorPopup() {
        this.colorPopup.classList.remove('active');
    }

    handleColorSelection(color) {
        if (this.pendingWildCard) {
            // Update the wild card with the selected color
            this.pendingWildCard.color = color;
            
            // Add the card to the discard pile
            this.discardPile.push(this.pendingWildCard);
            
            // Handle special card effects
            if (this.pendingWildCard.value === 'wild_draw4') {
                // Handle stacking for wild draw 4
                if (!this.isStacking) {
                    this.startStacking(this.pendingWildCard);
                }
                this.accumulateCards(4);
                this.nextTurn();
            } else {
                this.nextTurn();
                this.resetStacking();
            }
            
            // Update the UI
            this.updateUI();
            
            // Reset state
            this.pendingWildCard = null;
            this.hideColorPopup();
        }
    }

    startStacking(card) {
        this.isStacking = true;
        this.accumulatedCards = 0;
        this.lastStackedCard = card;
    }

    accumulateCards(count) {
        this.accumulatedCards += count;
    }

    resetStacking() {
        if (this.isStacking) {
            // Reset stacking state
            this.isStacking = false;
            this.accumulatedCards = 0;
            this.lastStackedCard = null;
        }
    }

    showUnoPrompt(playerIndex) {
        // Clear any existing timeout
        if (this.unoPromptTimeout) {
            clearTimeout(this.unoPromptTimeout);
        }

        // Show the UNO prompt
        const unoPrompt = document.getElementById('unoPrompt');
        unoPrompt.classList.add('active');
        this.unoPromptActive = true;

        // Set timeout to automatically draw a card after 2 seconds
        this.unoPromptTimeout = setTimeout(() => {
            if (this.unoPromptActive) {
                this.handleUnoTimeout(playerIndex);
            }
        }, 2000);
    }

    handleUnoClick() {
        // Clear the timeout and hide the prompt
        if (this.unoPromptTimeout) {
            clearTimeout(this.unoPromptTimeout);
        }
        this.unoPromptActive = false;
        document.getElementById('unoPrompt').classList.remove('active');
    }

    handleUnoTimeout(playerIndex) {
        // Draw a card for not saying UNO
        this.drawCards(playerIndex, 2);
        this.unoPromptActive = false;
        document.getElementById('unoPrompt').classList.remove('active');
        this.updateUI();
    }

    showWinNotification(playerIndex) {
        // Make sure the player index is valid
        if (playerIndex < 0 || playerIndex >= this.players.length) {
            console.error("Invalid player index for win notification:", playerIndex);
            return;
        }

        console.log("Showing win notification for player index:", playerIndex);
        
        const winNotification = document.getElementById('winNotification');
        const winnerName = this.players[playerIndex].name;
        
        // Don't add "(Computer)" if the name is already "Computer"
        let displayName = winnerName;
        if (winnerName !== 'Computer' && this.players[playerIndex].isComputer) {
            displayName = `${winnerName} (Computer)`;
        }
        
        console.log("Winner name:", displayName, "Is computer:", this.players[playerIndex].isComputer);
        
        // Set the winner name in the notification
        const winnerNameElement = winNotification.querySelector('.winner-name');
        if (winnerNameElement) {
            winnerNameElement.textContent = displayName;
        }
        
        // Show the notification
        winNotification.classList.add('active');
        
        // Disable game controls
        document.getElementById('startGame').disabled = false;
        document.getElementById('drawCard').disabled = true;
        this.isGameStarted = false;
        
        // Clear any computer timers
        this.clearComputerTimer();
    }

    // New methods for computer draw notifications
    showComputerDrawNotification(playerName) {
        // Create or get the notification element
        let notification = document.getElementById('computerActionNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'computerActionNotification';
            notification.className = 'computer-action-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = `${playerName} is drawing a card...`;
        notification.classList.add('active');
    }
    
    showComputerPlayDrawnCardNotification(playerName) {
        let notification = document.getElementById('computerActionNotification');
        if (notification) {
            notification.textContent = `${playerName} is playing the drawn card...`;
        }
    }
    
    showComputerCannotPlayNotification(playerName) {
        let notification = document.getElementById('computerActionNotification');
        if (notification) {
            notification.textContent = `${playerName} cannot play the drawn card.`;
        }
    }
    
    hideNotification() {
        const notification = document.getElementById('computerActionNotification');
        if (notification) {
            notification.classList.remove('active');
        }
    }
}

// Initialize the game
const game = new UnoGame(); 