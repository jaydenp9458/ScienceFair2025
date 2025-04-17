class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        const suits = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return `${this.value}${suits[this.suit]}`;
    }

    getColor() {
        return ['hearts', 'diamonds'].includes(this.suit) ? 'red' : 'black';
    }

    getNumericValue() {
        if (['J', 'Q', 'K'].includes(this.value)) return 10;
        if (this.value === 'A') return 11;
        return parseInt(this.value);
    }
}

class Deck {
    constructor() {
        this.reset();
    }

    reset() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.cards = [];

        for (const suit of suits) {
            for (const value of values) {
                this.cards.push(new Card(suit, value));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}

class Game {
    constructor() {
        this.deck = new Deck();
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
        this.currentStreak = 0;
        this.bestStreak = 0;

        this.hitButton = document.getElementById('hit-button');
        this.standButton = document.getElementById('stand-button');
        this.newGameButton = document.getElementById('new-game-button');
        this.messageElement = document.getElementById('message');
        this.currentStreakElement = document.getElementById('current-streak');
        this.bestStreakElement = document.getElementById('best-streak');

        this.hitButton.addEventListener('click', () => this.hit());
        this.standButton.addEventListener('click', () => this.stand());
        this.newGameButton.addEventListener('click', () => this.newGame());

        this.updateStreakDisplay();
        this.newGame();
    }

    updateStreakDisplay() {
        this.currentStreakElement.textContent = this.currentStreak;
        this.bestStreakElement.textContent = this.bestStreak;
    }

    handleGameResult(isWin) {
        if (isWin) {
            this.currentStreak++;
            if (this.currentStreak > this.bestStreak) {
                this.bestStreak = this.currentStreak;
            }
        } else {
            this.currentStreak = 0;
        }
        this.updateStreakDisplay();
    }

    calculateScore(hand) {
        let score = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === 'A') {
                aces++;
            } else {
                score += card.getNumericValue();
            }
        }

        // Add aces
        for (let i = 0; i < aces; i++) {
            if (score + 11 <= 21) {
                score += 11;
            } else {
                score += 1;
            }
        }

        return score;
    }

    hit() {
        this.playerHand.push(this.deck.draw());
        const score = this.calculateScore(this.playerHand);

        if (score > 21) {
            this.gameOver = true;
            this.messageElement.textContent = 'Bust! You lose!';
            this.handleGameResult(false);
            this.hitButton.disabled = true;
            this.standButton.disabled = true;
        }

        this.updateUI();
    }

    stand() {
        this.hitButton.disabled = true;
        this.standButton.disabled = true;

        // Dealer's turn
        while (this.calculateScore(this.dealerHand) < 17) {
            this.dealerHand.push(this.deck.draw());
        }

        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);

        if (dealerScore > 21) {
            this.messageElement.textContent = 'Dealer busts! You win!';
            this.handleGameResult(true);
        } else if (dealerScore > playerScore) {
            this.messageElement.textContent = 'Dealer wins!';
            this.handleGameResult(false);
        } else if (playerScore > dealerScore) {
            this.messageElement.textContent = 'You win!';
            this.handleGameResult(true);
        } else {
            this.messageElement.textContent = 'Push! It\'s a tie!';
            // Don't change streak on a tie
        }

        this.gameOver = true;
        this.updateUI();
    }

    newGame() {
        this.deck.reset();
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;

        // Deal initial cards
        this.playerHand.push(this.deck.draw(), this.deck.draw());
        this.dealerHand.push(this.deck.draw(), this.deck.draw());

        this.hitButton.disabled = false;
        this.standButton.disabled = false;
        this.messageElement.textContent = '';

        this.updateUI();
    }

    updateUI() {
        const dealerCardsElement = document.getElementById('dealer-cards');
        const playerCardsElement = document.getElementById('player-cards');
        const dealerScoreElement = document.getElementById('dealer-score');
        const playerScoreElement = document.getElementById('player-score');

        // Clear existing cards
        dealerCardsElement.innerHTML = '';
        playerCardsElement.innerHTML = '';

        // Update dealer's cards
        this.dealerHand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.getColor()}`;
            // Hide dealer's second card if game is not over
            cardElement.textContent = (!this.gameOver && index === 1) ? '?' : card.toString();
            dealerCardsElement.appendChild(cardElement);
        });

        // Update player's cards
        this.playerHand.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.getColor()}`;
            cardElement.textContent = card.toString();
            playerCardsElement.appendChild(cardElement);
        });

        // Update scores
        playerScoreElement.textContent = this.calculateScore(this.playerHand);
        dealerScoreElement.textContent = this.gameOver ? 
            this.calculateScore(this.dealerHand) : 
            this.calculateScore([this.dealerHand[0]]) + ' + ?';
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 