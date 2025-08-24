const foodImg = new Image();
foodImg.src = "assets/apple.png"; // adjust path to your folder

const obstacleImg = new Image();
obstacleImg.src = "assets/skull.png"; // adjust path

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");
const scoreBoard = document.getElementById("scoreBoard");
const modeSelect = document.getElementById("modeSelect");
const gameUI = document.getElementById("gameUI");

let snake, snakeColors, direction, food, badFoods, box, score, bestScore, gameOver, timeLeft;
let gameInterval, timerInterval;

// ✅ Start game
function startGame() {
  modeSelect.style.display = "none";
  gameUI.style.display = "block";
  canvas.focus(); // ensure keyboard works
  initGame();
}

// ✅ Initialize/reset
function initGame() {
  snake = [{ x: 200, y: 200 }];
  snakeColors = []; // will hold random colors for body
  direction = "RIGHT";
  box = 20;
  score = 0;
  gameOver = false;
  timeLeft = 60;
  bestScore = localStorage.getItem("bestScore") || 0;

  food = randomPosition();
  badFoods = [randomPosition()];

  updateScore();
  timerText.textContent = `⏳ Time Left: ${timeLeft}`;

  clearInterval(gameInterval);
  clearInterval(timerInterval);

  gameInterval = setInterval(draw, 1000 / 10);
  timerInterval = setInterval(updateTimer, 1000);
}

// ✅ Random grid position
function randomPosition() {
  return {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
  };
}

// ✅ Generate random color
function randomColor() {
  const colors = ["#ff4c4c", "#4cff4c", "#4cafff", "#ffd700", "#ff7fff", "#00ffff", "#ffa500"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ✅ Key controls (no instant reversals)
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
});

// ✅ Timer countdown
function updateTimer() {
  timeLeft--;
  timerText.textContent = `⏳ Time Left: ${timeLeft}`;
  if (timeLeft <= 0) {
    endGame("⏳ Time's Up!");
  }
}

// ✅ Random color generator
function getRandomColor() {
  const colors = ["#ff4b5c", "#ffb400", "#4caf50", "#9c27b0", "#ff9800", "#00bcd4", "#e91e63"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function draw() {
  if (gameOver) return;

  // ✅ Checkerboard background (deep blue shades)
  for (let row = 0; row < canvas.height / box; row++) {
    for (let col = 0; col < canvas.width / box; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#001f3f" : "#00132b"; 
      ctx.fillRect(col * box, row * box, box, box);
    }
  }

  // Draw snake (head = fixed color, body = stored colors)
  for (let i = 0; i < snake.length; i++) {
    ctx.beginPath();
    ctx.arc(snake[i].x + box / 2, snake[i].y + box / 2, box / 2, 0, Math.PI * 2);

    if (i === 0) {
      // ✅ Head is always fixed blue
      ctx.fillStyle = "#2a87ff";
      ctx.shadowColor = "#2a87ff";
    } else {
      ctx.fillStyle = snakeColors[i - 1] || "#1e3c72"; 
      ctx.shadowColor = snakeColors[i - 1] || "#1e3c72";
    }

    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Good food 🍏
  ctx.drawImage(foodImg, food.x, food.y, box, box);

  // Bad foods 💀
  badFoods.forEach(bad => {
    ctx.drawImage(obstacleImg, bad.x, bad.y, box, box);
  });

  // Snake movement
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  // ✅ Wrap around edges
  if (snakeX < 0) snakeX = canvas.width - box;
  if (snakeY < 0) snakeY = canvas.height - box;
  if (snakeX >= canvas.width) snakeX = 0;
  if (snakeY >= canvas.height) snakeY = 0;

  // New head
  let newHead = { x: snakeX, y: snakeY };

  // ✅ Eat good food
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    updateScore();
    food = randomPosition();

    // Grow snake (no pop, keep tail)
    snake.unshift(newHead);

    // ✅ Add a new permanent color for the new body segment
    snakeColors.unshift(getRandomColor());

    // Add new obstacle occasionally
    if (score % 2 === 0) {
      badFoods.push(randomPosition());
    }
  } else {
    // Normal move: add new head, remove tail
    snake.unshift(newHead);
    snake.pop();
  }

  // If eats bad food
  for (let bad of badFoods) {
    if (snakeX === bad.x && snakeY === bad.y) {
      endGame("💀 Hit Obstacle!");
      return;
    }
  }

  // Self-collision check (ignore head)
  if (collision(newHead, snake.slice(1))) {
    endGame("💀 You Died!");
    return;
  }

  statusText.textContent = `Score: ${score}`;
}


// ✅ Collision check
function collision(head, array) {
  return array.some(part => head.x === part.x && head.y === part.y);
}

// ✅ End game
function endGame(message) {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  gameOver = true;
  statusText.textContent = `${message} Final Score: ${score}`;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
  }
  updateScore();

  // ✅ Show overlay with restart/exit
  const overlay = document.getElementById("gameOverOverlay");
  const finalMsg = document.getElementById("finalMessage");
  finalMsg.textContent = `${message} | Score: ${score} | Best: ${bestScore}`;
  overlay.style.display = "flex";
}

// ✅ Scoreboard
function updateScore() {
  scoreBoard.textContent = `Score: ${score} | Best: ${bestScore}`;
}

// ✅ Restart
function restart() {
  const overlay = document.getElementById("gameOverOverlay");
  overlay.style.display = "none"; // hide overlay
  initGame();
  statusText.textContent = "Game restarted! Use Arrow Keys to Control";
  canvas.focus();
}

// ✅ Exit
function exitGame() {
  window.location.href = "../index.html";
}

// Allow touch buttons to change direction
function setDirection(dir) {
  if (dir === "LEFT" && direction !== "RIGHT") direction = "LEFT";
  else if (dir === "UP" && direction !== "DOWN") direction = "UP";
  else if (dir === "RIGHT" && direction !== "LEFT") direction = "RIGHT";
  else if (dir === "DOWN" && direction !== "UP") direction = "DOWN";
}