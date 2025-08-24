const board = document.getElementById("board");
const statusText = document.getElementById("status");
const modeSelect = document.getElementById("modeSelect");
const gameUI = document.getElementById("gameUI");

let gameBoard = [];
let currentPlayer = "red"; // red always starts
let gameMode = null; // "pvp" or "ai"
let gameOver = false;
let lockInput = false; // 🚨 prevents multiple moves during animation

function startGame(mode) {
  gameMode = mode;
  gameOver = false;
  currentPlayer = "red";
  lockInput = false;

  // Reset board
  gameBoard = Array.from({ length: 6 }, () => Array(7).fill(""));

  // Show UI
  modeSelect.style.display = "none";
  gameUI.style.display = "block";

  createBoard();
  statusText.textContent = "Player 🔴 Red's turn";
}

function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", () => handleClick(col));
      board.appendChild(cell);
    }
  }
}

function handleClick(col) {
  if (gameOver || lockInput) return; // 🚨 block input while animating

  // Find lowest empty spot in column
  let rowToFill = -1;
  for (let row = 5; row >= 0; row--) {
    if (gameBoard[row][col] === "") {
      rowToFill = row;
      break;
    }
  }
  if (rowToFill === -1) return; // column full

  lockInput = true; // 🚨 lock until animation finishes
  animateDrop(rowToFill, col, currentPlayer);
}

function animateDrop(row, col, player) {
  const boardRect = board.getBoundingClientRect();
  const firstCell = board.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
  const targetCell = board.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

  const startRect = firstCell.getBoundingClientRect();
  const endRect = targetCell.getBoundingClientRect();

  const disc = document.createElement("div");
  disc.classList.add("falling");
  disc.style.left = (startRect.left - boardRect.left) + "px";
  disc.style.top = (startRect.top - boardRect.top) + "px";
  disc.style.background = player === "red" ? "red" : "yellow";

  document.querySelector(".board-wrapper").appendChild(disc);

  // Animate with bounce
  disc.animate(
    [
      { top: (startRect.top - boardRect.top) + "px" },
      { top: (endRect.top - boardRect.top) + 10 + "px" }, // overshoot
      { top: (endRect.top - boardRect.top) - 5 + "px" },  // bounce up
      { top: (endRect.top - boardRect.top) + "px" }       // settle
    ],
    {
      duration: 600,
      easing: "ease-in-out"
    }
  ).onfinish = () => {
    disc.remove();
    // Apply piece permanently
    gameBoard[row][col] = player;
    updateBoard();

    if (checkWin(row, col)) {
      statusText.textContent = `${player === "red" ? "🔴 Red" : "🟡 Yellow"} Wins! 🎉`;
      gameOver = true;
      lockInput = false;
      return;
    }
    if (isFull()) {
      statusText.textContent = "It's a Draw!";
      gameOver = true;
      lockInput = false;
      return;
    }

    // Switch turn
    currentPlayer = currentPlayer === "red" ? "yellow" : "red";
    statusText.textContent = `Player ${currentPlayer === "red" ? "🔴 Red" : "🟡 Yellow"}'s turn`;

    lockInput = false; // 🔓 unlock after move

    // AI move
    if (gameMode === "ai" && currentPlayer === "yellow" && !gameOver) {
      setTimeout(() => {
        handleClick(aiMove());
      }, 500);
    }
  };
}

function updateBoard() {
  const cells = board.querySelectorAll(".cell");
  cells.forEach(cell => {
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    cell.classList.remove("red", "yellow");
    if (gameBoard[row][col] === "red") cell.classList.add("red");
    if (gameBoard[row][col] === "yellow") cell.classList.add("yellow");
  });
}

function checkWin(row, col) {
  const player = gameBoard[row][col];
  return (
    checkDirection(row, col, 1, 0, player) || // vertical
    checkDirection(row, col, 0, 1, player) || // horizontal
    checkDirection(row, col, 1, 1, player) || // diagonal ↘
    checkDirection(row, col, 1, -1, player)   // diagonal ↙
  );
}

function checkDirection(row, col, rowDir, colDir, player) {
  let count = 1;

  // Forward
  let r = row + rowDir;
  let c = col + colDir;
  while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameBoard[r][c] === player) {
    count++;
    r += rowDir;
    c += colDir;
  }

  // Backward
  r = row - rowDir;
  c = col - colDir;
  while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameBoard[r][c] === player) {
    count++;
    r -= rowDir;
    c -= colDir;
  }

  return count >= 4;
}

function isFull() {
  return gameBoard.every(row => row.every(cell => cell !== ""));
}

// AI: pick random available column
function aiMove() {
  let availableCols = [];
  for (let col = 0; col < 7; col++) {
    if (gameBoard[0][col] === "") availableCols.push(col);
  }
  if (availableCols.length === 0) return -1;
  return availableCols[Math.floor(Math.random() * availableCols.length)];
}

function restart() {
  startGame(gameMode);
}

function exitGame() {
  window.location.href = "../index.html"; // back to hub
}
