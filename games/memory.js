const grid = document.getElementById("grid");
const statusText = document.getElementById("status");
const backBtn = document.getElementById("backBtn");
const restartBtn = document.getElementById("restartBtn");
const exitBtn = document.getElementById("exitBtn");

const controls = document.getElementById("controls");
const gameUI = document.getElementById("gameUI");

// Icons pool (make sure it's big enough for hard mode)
const iconsPool = ["🍎","🍌","🍒","🍇","🍉","🥝","🍍","🥥","🥕","🍓","🍑","🥭",
                   "🥦","🥔","🥬","🍋","🥑","🍈","🍐","🍊","🥜","🌽","🍆","🍄",
                   "🧄","🧅","🍔","🍟","🍕","🍩","🍪","🍫","🍿","🍵","🥤","🍗"];

let cards = [];
let flipped = [];
let matched = [];
let lockBoard = false;
let currentDifficulty = null;

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function startGame(difficulty) {
  currentDifficulty = difficulty;
  matched = [];
  flipped = [];
  lockBoard = false;
  statusText.textContent = "";
  backBtn.style.display = "none";

  controls.style.display = "none";
  gameUI.style.display = "block";

  let pairs, gridSize;
  if (difficulty === "easy") {
    pairs = 8;   // 16 cards
    gridSize = 4;
  } else if (difficulty === "medium") {
    pairs = 18;  // 36 cards
    gridSize = 6;
  } else if (difficulty === "hard") {
    pairs = 32;  // 64 cards
    gridSize = 8;
  }

  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`; // responsive

  // build deck
  cards = shuffle(iconsPool).slice(0, pairs);
  cards = shuffle([...cards, ...cards]);

  createBoard();
}

function createBoard() {
  grid.innerHTML = "";
  cards.forEach(icon => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.icon = icon;
    card.addEventListener("click", flipCard);
    grid.appendChild(card);
  });
}

function flipCard(e) {
  const card = e.target;
  if (lockBoard) return;
  if (card.classList.contains("flipped")) return;

  card.classList.add("flipped");
  flipped.push(card);

  if (flipped.length === 2) {
    lockBoard = true;
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flipped;

  if (card1.dataset.icon === card2.dataset.icon) {
    matched.push(card1, card2);
    statusText.textContent = `Matched: ${matched.length / 2}`;
    resetFlipped();
  } else {
    setTimeout(() => {
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      resetFlipped();
    }, 800);
  }

  if (matched.length === cards.length) {
    statusText.textContent = "🎉 You Won!";
    backBtn.style.display = "inline-block";
    exitBtn.style.display = "none";
  }
}

function resetFlipped() {
  flipped = [];
  lockBoard = false;
}

function restart() {
  if (currentDifficulty) {
    startGame(currentDifficulty);
  }
}

function exitGame() {
  grid.innerHTML = "";
  statusText.textContent = "";
  currentDifficulty = null;
  gameUI.style.display = "none";
  controls.style.display = "block";
  window.location.href = "../index.html";
}
