let board = [];
let currentPlayer = "red"; // red always starts
let gameMode = "pvp"; // default
const boardSize = 8;

function startGame(mode) {
  gameMode = mode;
  board = [];
  currentPlayer = "red";

  document.getElementById("menu").style.display = "none";
  document.getElementById("gameArea").style.display = "block";
  document.getElementById("status").textContent = "Red's Turn";

  createBoard();
  drawBoard();
}

function createBoard() {
  for (let row = 0; row < boardSize; row++) {
    board[row] = [];
    for (let col = 0; col < boardSize; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) {
          board[row][col] = { player: "black", king: false };
        } else if (row > 4) {
          board[row][col] = { player: "red", king: false };
        } else {
          board[row][col] = null;
        }
      } else {
        board[row][col] = null;
      }
    }
  }
}

function drawBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        const pieceDiv = document.createElement("div");
        pieceDiv.classList.add("piece", piece.player);
        if (piece.king) pieceDiv.classList.add("king");
        pieceDiv.dataset.row = row;
        pieceDiv.dataset.col = col;

        // Only allow interaction for the current player
        if (piece.player === currentPlayer && (gameMode === "pvp" || (gameMode === "ai" && currentPlayer === "red"))) {
          pieceDiv.addEventListener("click", selectPiece);
        }

        square.appendChild(pieceDiv);
      }

      boardDiv.appendChild(square);
    }
  }
}

let selectedPiece = null;

function selectPiece(e) {
  if (!e.target.classList.contains("piece")) return;

  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  selectedPiece = { row, col };

  highlightMoves(row, col);
}

function highlightMoves(row, col) {
  drawBoard(); // reset highlights
  const moves = getValidMoves(row, col);

  moves.forEach(move => {
    const square = document.querySelector(
      `.square[data-row='${move.row}'][data-col='${move.col}']`
    );
    if (square) {
      square.style.outline = "3px solid yellow";
      square.addEventListener("click", () => makeMove(row, col, move.row, move.col));
    }
  });
}

function getValidMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  const directions = piece.king
    ? [[1,1],[1,-1],[-1,1],[-1,-1]]
    : (piece.player === "red" ? [[-1,1],[-1,-1]] : [[1,1],[1,-1]]);

  let moves = [];
  for (let [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (isInsideBoard(newRow, newCol) && !board[newRow][newCol]) {
      moves.push({ row: newRow, col: newCol });
    } else if (isInsideBoard(newRow, newCol) && board[newRow][newCol]?.player !== piece.player) {
      const jumpRow = newRow + dr;
      const jumpCol = newCol + dc;
      if (isInsideBoard(jumpRow, jumpCol) && !board[jumpRow][jumpCol]) {
        moves.push({ row: jumpRow, col: jumpCol, capture: { row: newRow, col: newCol } });
      }
    }
  }

  return moves;
}

function isInsideBoard(row, col) {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  if (currentPlayer === "black" && gameMode === "ai") return; // player can't move during AI's turn

  const piece = board[fromRow][fromCol];
  const move = getValidMoves(fromRow, fromCol).find(m => m.row === toRow && m.col === toCol);
  if (!move) return;

  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  if (move.capture) {
    board[move.capture.row][move.capture.col] = null;
    highlightCapture(toRow, toCol);
  }

  // King promotion
  if ((piece.player === "red" && toRow === 0) || (piece.player === "black" && toRow === boardSize - 1)) {
    piece.king = true;
  }

  drawBoard();

  // Check for multi-jumps
  if (move.capture) {
    const moreMoves = getValidMoves(toRow, toCol).filter(m => m.capture);
    if (moreMoves.length > 0) {
      selectedPiece = { row: toRow, col: toCol };
      highlightMoves(toRow, toCol);
      return; // must continue capturing, same player's turn
    }
  }

  switchTurn();
}

function highlightCapture(row, col) {
  const pieceDiv = document.querySelector(`.piece[data-row='${row}'][data-col='${col}']`);
  if (pieceDiv) {
    pieceDiv.style.boxShadow = "0 0 15px 5px gold";
    setTimeout(() => {
      pieceDiv.style.boxShadow = "";
    }, 600);
  }
}

function switchTurn() {
  currentPlayer = currentPlayer === "red" ? "black" : "red";
  document.getElementById("status").textContent = `${capitalize(currentPlayer)}'s Turn`;
  drawBoard();

  if (gameMode === "ai" && currentPlayer === "black") {
    setTimeout(aiMove, 800);
  }
}

/* ---------------- AI LOGIC ---------------- */
function aiMove() {
  let moves = [];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col]?.player === "black") {
        let validMoves = getValidMoves(row, col);
        validMoves.forEach(m => moves.push({ fromRow: row, fromCol: col, ...m }));
      }
    }
  }

  if (moves.length === 0) {
    document.getElementById("status").textContent = "Red Wins!";
    return;
  }

  // prioritize captures
  let captureMoves = moves.filter(m => m.capture);
  if (captureMoves.length > 0) {
    moves = captureMoves;
  }

  const move = moves[Math.floor(Math.random() * moves.length)];
  executeAIMove(move);
}

function executeAIMove(move) {
  makeMove(move.fromRow, move.fromCol, move.row, move.col);

  // check if AI can continue capturing
  const moreMoves = getValidMoves(move.row, move.col).filter(m => m.capture);
  if (moreMoves.length > 0) {
    setTimeout(() => {
      const nextMove = moreMoves[Math.floor(Math.random() * moreMoves.length)];
      executeAIMove({ fromRow: move.row, fromCol: move.col, ...nextMove });
    }, 600);
  }
}
/* ------------------------------------------ */

function resetGame() {
  startGame(gameMode);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
