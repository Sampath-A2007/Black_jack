let player = {
    name: "SAM",
    chips: 200
}

let cards = []
let sum = 0
let hasBlackJack = false
let isAlive = false
let message = ""
let messageEl = document.getElementById("message-el")
let sumEl = document.getElementById("sum-el")
let cardsEl = document.getElementById("cards-el")
let playerEl = document.getElementById("player-el")
let celebrationTimer = null

playerEl.textContent = player.name + ": $" + player.chips

function getRandomCard() {
    let randomNumber = Math.floor( Math.random()*13 ) + 1
    if (randomNumber > 10) {
        return 10
    } else if (randomNumber === 1) {
        return 11
    } else {
        return randomNumber
    }
}

function startGame() {
    isAlive = true
    hasBlackJack = false
    let firstCard = getRandomCard()
    let secondCard = getRandomCard()
    cards = [firstCard, secondCard]
    sum = firstCard + secondCard
    renderGame()
}

function renderGame() {
    cardsEl.textContent = "Cards: "
    for (let i = 0; i < cards.length; i++) {
        cardsEl.textContent += cards[i] + " "
    }
    
    sumEl.textContent = "Sum: " + sum
    if (sum <= 20) {
        message = "Do you want to draw a new card?"
    } else if (sum === 21) {
        message = "You've got Blackjack!"
        hasBlackJack = true
        celebrateBlackJack()
    } else {
        message = "You're out of the game!"
        isAlive = false
    }
    messageEl.textContent = message
}

function celebrateBlackJack() {
    clearTimeout(celebrationTimer)

    let oldCelebration = document.querySelector(".celebration")
    if (oldCelebration) {
        oldCelebration.remove()
    }

    let celebration = document.createElement("div")
    celebration.className = "celebration"
    celebration.innerHTML = `<div class="blackjack-toast">BLACKJACK!</div>`

    for (let i = 0; i < 60; i++) {
        let confetti = document.createElement("span")
        confetti.className = "confetti-piece"
        confetti.style.left = Math.random() * 100 + "%"
        confetti.style.animationDelay = Math.random() * 0.35 + "s"
        confetti.style.setProperty("--fall", 70 + Math.random() * 30 + "vh")
        confetti.style.setProperty("--spin", Math.random() > 0.5 ? "540deg" : "-540deg")
        celebration.appendChild(confetti)
    }

    document.body.appendChild(celebration)
    document.body.classList.add("blackjack-win")

    celebrationTimer = setTimeout(function() {
        celebration.remove()
        document.body.classList.remove("blackjack-win")
    }, 2800)
}


function newCard() {
    if (isAlive === true && hasBlackJack === false) {
        let card = getRandomCard()
        sum += card
        cards.push(card)
        renderGame()        
    }
}
