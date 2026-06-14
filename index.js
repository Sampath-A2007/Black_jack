/* ==========================================================================
   Red Room Casino - Premium Blackjack Logic
   ========================================================================== */

// --- Game Configurations & Constants ---
const SUITS = [
    { name: 'spade', symbol: '♠' },
    { name: 'heart', symbol: '♥' },
    { name: 'diamond', symbol: '♦' },
    { name: 'club', symbol: '♣' }
];

const RANKS = [
    { name: 'A', value: 11 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 }
];

// --- State Variables ---
let deck = [];
let playerHand = [];
let dealerHand = [];
let bankroll = 200;
let currentBet = 0;
let gameState = 'BETTING'; // 'BETTING', 'PLAYER_TURN', 'DEALER_TURN', 'RESOLVED'

// --- DOM References ---
const playerEl = document.getElementById("player-el");
const betAmountEl = document.getElementById("bet-amount");
const messageEl = document.getElementById("message-el");
const dealerCardsEl = document.getElementById("dealer-cards");
const playerCardsEl = document.getElementById("player-cards");
const dealerScoreEl = document.getElementById("dealer-score");
const playerScoreEl = document.getElementById("player-score");
const betCircleSpotEl = document.getElementById("bet-circle-spot");

// Control Groups
const bettingControls = document.getElementById("betting-controls");
const actionControls = document.getElementById("action-controls");

// Buttons
const dealBtn = document.getElementById("deal-btn");
const clearBtn = document.getElementById("clear-btn");
const hitBtn = document.getElementById("hit-btn");
const standBtn = document.getElementById("stand-btn");
const doubleBtn = document.getElementById("double-btn");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Load existing bankroll from localStorage if available
    const savedBankroll = localStorage.getItem("blackjack_bankroll");
    if (savedBankroll !== null) {
        bankroll = parseInt(savedBankroll, 10);
    }
    
    // Reset bankroll if they broke the bank
    if (bankroll <= 0) {
        bankroll = 200;
        localStorage.setItem("blackjack_bankroll", bankroll);
    }
    
    updateBankrollUI();
    updateBetUI();
    setPhase('BETTING');
});

// --- Deck Functions ---
function createDeck() {
    deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({
                suit: suit.name,
                symbol: suit.symbol,
                rank: rank.name,
                value: rank.value
            });
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard() {
    if (deck.length === 0) {
        createDeck();
        shuffleDeck();
    }
    return deck.pop();
}

// --- Gameplay Helper Functions ---
function calculateHandValue(hand) {
    let sum = 0;
    let aces = 0;
    
    for (let card of hand) {
        sum += card.value;
        if (card.rank === 'A') {
            aces++;
        }
    }
    
    // Handle soft aces
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    
    return sum;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- UI Sync Functions ---
function updateBankrollUI() {
    playerEl.textContent = `$${bankroll}`;
}

function updateBetUI() {
    betAmountEl.textContent = `$${currentBet}`;
    if (currentBet > 0) {
        betCircleSpotEl.classList.add("has-bet");
    } else {
        betCircleSpotEl.classList.remove("has-bet");
    }
}

function setPhase(phase) {
    gameState = phase;
    
    // Clear status colors
    messageEl.className = "";
    
    if (phase === 'BETTING') {
        bettingControls.classList.add("active");
        actionControls.classList.remove("active");
        
        dealerScoreEl.classList.add("hidden");
        playerScoreEl.classList.add("hidden");
        
        // Check chip buttons
        updateChipsAvailability();
        
        // Clear btn state
        clearBtn.disabled = currentBet === 0;
        dealBtn.disabled = currentBet === 0;
        
        if (bankroll === 0 && currentBet === 0) {
            messageEl.textContent = "Out of chips! Click here to reset bankroll.";
            messageEl.style.cursor = "pointer";
            messageEl.onclick = resetBankroll;
        } else {
            messageEl.textContent = "Place your bet to start the round";
            messageEl.style.cursor = "default";
            messageEl.onclick = null;
        }
        
    } else if (phase === 'PLAYER_TURN') {
        bettingControls.classList.remove("active");
        actionControls.classList.add("active");
        
        dealerScoreEl.classList.remove("hidden");
        playerScoreEl.classList.remove("hidden");
        
        // Action buttons
        hitBtn.disabled = false;
        standBtn.disabled = false;
        
        // Double down available only if player has enough money to double the bet
        doubleBtn.disabled = (bankroll < currentBet);
        
    } else if (phase === 'DEALER_TURN') {
        bettingControls.classList.remove("active");
        actionControls.classList.add("active");
        
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        
    } else if (phase === 'RESOLVED') {
        bettingControls.classList.add("active");
        actionControls.classList.remove("active");
        
        dealerScoreEl.classList.remove("hidden");
        playerScoreEl.classList.remove("hidden");
    }
}

function updateChipsAvailability() {
    const chipBtns = document.querySelectorAll(".chip-btn");
    chipBtns.forEach(btn => {
        const val = parseInt(btn.getAttribute("data-value"), 10);
        btn.disabled = (bankroll < val);
    });
}

function getCardHTML(card, isFaceDown) {
    if (isFaceDown) {
        return `
            <div class="card face-down">
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back"></div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card ${card.suit}">
            <div class="card-inner">
                <div class="card-front">
                    <span class="card-rank">${card.rank}</span>
                    <span class="card-suit">${card.symbol}</span>
                    <span class="card-rank card-rank-bottom">${card.rank}</span>
                </div>
                <div class="card-back"></div>
            </div>
        </div>
    `;
}

function renderHand(container, hand, hideSecondCard) {
    container.innerHTML = "";
    for (let i = 0; i < hand.length; i++) {
        const faceDown = (i === 1 && hideSecondCard);
        container.innerHTML += getCardHTML(hand[i], faceDown);
    }
}

function renderGame() {
    const isPlayerTurn = (gameState === 'PLAYER_TURN');
    
    // Render cards
    renderHand(playerCardsEl, playerHand, false);
    renderHand(dealerCardsEl, dealerHand, isPlayerTurn);
    
    // Render Scores
    const playerVal = calculateHandValue(playerHand);
    playerScoreEl.textContent = playerVal;
    
    if (isPlayerTurn) {
        // Only show value of dealer's first card (which is index 0)
        dealerScoreEl.textContent = dealerHand[0].value;
    } else {
        dealerScoreEl.textContent = calculateHandValue(dealerHand);
    }
}

// --- Betting Handlers ---
function addBet(amount) {
    if (gameState !== 'BETTING') return;
    
    if (bankroll >= amount) {
        bankroll -= amount;
        currentBet += amount;
        updateBankrollUI();
        updateBetUI();
        updateChipsAvailability();
        
        clearBtn.disabled = false;
        dealBtn.disabled = false;
    }
}

function clearBet() {
    if (gameState !== 'BETTING') return;
    
    bankroll += currentBet;
    currentBet = 0;
    updateBankrollUI();
    updateBetUI();
    
    clearBtn.disabled = true;
    dealBtn.disabled = true;
    updateChipsAvailability();
}

function resetBankroll() {
    bankroll = 200;
    currentBet = 0;
    localStorage.setItem("blackjack_bankroll", bankroll);
    updateBankrollUI();
    updateBetUI();
    setPhase('BETTING');
}

// --- Game Action Handlers ---
function startGame() {
    if (gameState !== 'BETTING') return;
    if (currentBet <= 0) {
        messageEl.textContent = "Please place a bet first!";
        return;
    }
    
    // Initialize cards
    createDeck();
    shuffleDeck();
    
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    
    setPhase('PLAYER_TURN');
    renderGame();
    
    // Check for natural Blackjack immediately
    const playerVal = calculateHandValue(playerHand);
    if (playerVal === 21) {
        handleNaturalBlackjack();
    } else {
        messageEl.textContent = "Hit or Stand?";
    }
}

async function handleNaturalBlackjack() {
    messageEl.textContent = "Natural Blackjack!";
    setPhase('DEALER_TURN');
    await delay(1200);
    resolveRound();
}

async function newCard() {
    if (gameState !== 'PLAYER_TURN') return;
    
    // Can no longer double down after hitting once
    doubleBtn.disabled = true;
    
    playerHand.push(drawCard());
    renderGame();
    
    const playerVal = calculateHandValue(playerHand);
    if (playerVal > 21) {
        setPhase('DEALER_TURN');
        await delay(800);
        resolveRound();
    } else if (playerVal === 21) {
        // Automatic stand at 21
        await stand();
    }
}

async function stand() {
    if (gameState !== 'PLAYER_TURN' && gameState !== 'DEALER_TURN') return;
    
    setPhase('DEALER_TURN');
    
    // Reveal dealer's face-down card
    renderGame();
    await delay(800);
    
    // Dealer hits until sum is at least 17
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(drawCard());
        renderGame();
        await delay(800);
    }
    
    resolveRound();
}

async function doubleDown() {
    if (gameState !== 'PLAYER_TURN' || playerHand.length !== 2) return;
    if (bankroll < currentBet) return;
    
    // Double the bet
    bankroll -= currentBet;
    currentBet *= 2;
    updateBankrollUI();
    updateBetUI();
    
    setPhase('DEALER_TURN');
    
    // Draw exactly one card
    playerHand.push(drawCard());
    renderGame();
    await delay(800);
    
    const playerVal = calculateHandValue(playerHand);
    if (playerVal > 21) {
        resolveRound();
    } else {
        await stand();
    }
}

// --- Round Resolution ---
function resolveRound() {
    const playerVal = calculateHandValue(playerHand);
    const dealerVal = calculateHandValue(dealerHand);
    
    const isPlayerBJ = playerHand.length === 2 && playerVal === 21;
    const isDealerBJ = dealerHand.length === 2 && dealerVal === 21;
    
    let result = ''; // 'win', 'lose', 'tie'
    let winnings = 0;
    let statusText = '';
    
    if (playerVal > 21) {
        result = 'lose';
        statusText = `Bust! You lost your bet.`;
    } else if (dealerVal > 21) {
        result = 'win';
        if (isPlayerBJ) {
            winnings = Math.floor(currentBet * 2.5); // 3:2 payout (returns bet + 1.5x profit)
            statusText = `Blackjack! You win $${Math.floor(currentBet * 1.5)}!`;
        } else {
            winnings = currentBet * 2; // 1:1 payout
            statusText = `Dealer busts! You win $${currentBet}!`;
        }
    } else if (playerVal > dealerVal) {
        result = 'win';
        if (isPlayerBJ) {
            winnings = Math.floor(currentBet * 2.5);
            statusText = `Blackjack! You win $${Math.floor(currentBet * 1.5)}!`;
        } else {
            winnings = currentBet * 2;
            statusText = `You win $${currentBet}!`;
        }
    } else if (dealerVal > playerVal) {
        result = 'lose';
        statusText = `Dealer wins. You lost your bet.`;
    } else {
        // Push (Tie)
        // Note: BJ beats normal 21
        if (isPlayerBJ && !isDealerBJ) {
            result = 'win';
            winnings = Math.floor(currentBet * 2.5);
            statusText = `Blackjack! You win $${Math.floor(currentBet * 1.5)}!`;
        } else if (isDealerBJ && !isPlayerBJ) {
            result = 'lose';
            statusText = `Dealer Blackjack! You lost your bet.`;
        } else {
            result = 'tie';
            winnings = currentBet; // return original bet
            statusText = `Push. Bets returned.`;
        }
    }
    
    // Update balance
    bankroll += winnings;
    localStorage.setItem("blackjack_bankroll", bankroll);
    
    // Reset bet
    currentBet = 0;
    
    // Update UI
    updateBankrollUI();
    updateBetUI();
    
    // Display results
    messageEl.textContent = statusText;
    if (result === 'win') {
        messageEl.classList.add("win");
        if (isPlayerBJ) {
            celebrateBlackJack();
        }
    } else if (result === 'lose') {
        messageEl.classList.add("lose");
    } else {
        messageEl.classList.add("tie");
    }
    
    setPhase('BETTING');
}

// --- Celebration Animation (Pure CSS Driven Confetti Spawn) ---
function celebrateBlackJack() {
    let oldCelebration = document.querySelector(".celebration");
    if (oldCelebration) {
        oldCelebration.remove();
    }
    
    const celebration = document.createElement("div");
    celebration.className = "celebration";
    celebration.innerHTML = `<div class="blackjack-toast">BLACKJACK!</div>`;
    
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement("span");
        confetti.className = "confetti-piece";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.animationDelay = Math.random() * 0.4 + "s";
        confetti.style.setProperty("--fall", (75 + Math.random() * 25) + "vh");
        confetti.style.setProperty("--spin", Math.random() > 0.5 ? "720deg" : "-720deg");
        celebration.appendChild(confetti);
    }
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        celebration.remove();
    }, 2800);
}
