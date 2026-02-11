// Basic Tetris implementation for Telegram Mini App

const COLS = 10;
const ROWS = 20;
const EMPTY = 0;

const COLORS = {
  I: 'color-I',
  O: 'color-O',
  T: 'color-T',
  S: 'color-S',
  Z: 'color-Z',
  J: 'color-J',
  L: 'color-L'
};

// Tetromino shapes (rotation states)
const SHAPES = {
  I: [
    [[0, 0, 0, 0],
     [1, 1, 1, 1],
     [0, 0, 0, 0],
     [0, 0, 0, 0]],
    [[0, 0, 1, 0],
     [0, 0, 1, 0],
     [0, 0, 1, 0],
     [0, 0, 1, 0]]
  ],
  O: [
    [[0, 1, 1, 0],
     [0, 1, 1, 0],
     [0, 0, 0, 0],
     [0, 0, 0, 0]]
  ],
  T: [
    [[0, 1, 0],
     [1, 1, 1],
     [0, 0, 0]],
    [[0, 1, 0],
     [0, 1, 1],
     [0, 1, 0]],
    [[0, 0, 0],
     [1, 1, 1],
     [0, 1, 0]],
    [[0, 1, 0],
     [1, 1, 0],
     [0, 1, 0]]
  ],
  S: [
    [[0, 1, 1],
     [1, 1, 0],
     [0, 0, 0]],
    [[0, 1, 0],
     [0, 1, 1],
     [0, 0, 1]]
  ],
  Z: [
    [[1, 1, 0],
     [0, 1, 1],
     [0, 0, 0]],
    [[0, 0, 1],
     [0, 1, 1],
     [0, 1, 0]]
  ],
  J: [
    [[1, 0, 0],
     [1, 1, 1],
     [0, 0, 0]],
    [[0, 1, 1],
     [0, 1, 0],
     [0, 1, 0]],
    [[0, 0, 0],
     [1, 1, 1],
     [0, 0, 1]],
    [[0, 1, 0],
     [0, 1, 0],
     [1, 1, 0]]
  ],
  L: [
    [[0, 0, 1],
     [1, 1, 1],
     [0, 0, 0]],
    [[0, 1, 0],
     [0, 1, 0],
     [0, 1, 1]],
    [[0, 0, 0],
     [1, 1, 1],
     [1, 0, 0]],
    [[1, 1, 0],
     [0, 1, 0],
     [0, 1, 0]]
  ]
};

const gridEl = document.getElementById('grid');
const nextEl = document.getElementById('next');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

let grid = createEmptyGrid();
let currentPiece = null;
let nextPiece = null;
let score = 0;
let intervalId = null;
let speed = 700; // ms
let gameOver = false;

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function createPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shapeIndex: 0,
    x: 3,
    y: 0
  };
}

function getShape(piece) {
  const states = SHAPES[piece.type];
  return states[piece.shapeIndex % states.length];
}

function drawGrid() {
  gridEl.innerHTML = '';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const value = grid[y][x];
      if (value && value !== EMPTY) {
        cell.classList.add('filled');
        cell.classList.add(COLORS[value.type]);
      }
      gridEl.appendChild(cell);
    }
  }

  // Draw current piece
  if (currentPiece) {
    const shape = getShape(currentPiece);
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = currentPiece.x + col;
          const y = currentPiece.y + row;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            const idx = y * COLS + x;
            const cell = gridEl.children[idx];
            if (cell) {
              cell.classList.add('filled');
              cell.classList.add(COLORS[currentPiece.type]);
            }
          }
        }
      }
    }
  }
}

function drawNext() {
  nextEl.innerHTML = '';
  const size = 4 * 4;
  for (let i = 0; i < size; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    nextEl.appendChild(cell);
  }

  if (!nextPiece) return;

  const shape = getShape({ ...nextPiece, y: 0, x: 0 });
  const offsetX = 1;
  const offsetY = 1;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = offsetX + col;
        const y = offsetY + row;
        const idx = y * 4 + x;
        const cell = nextEl.children[idx];
        if (cell) {
          cell.classList.add('filled');
          cell.classList.add(COLORS[nextPiece.type]);
        }
      }
    }
  }
}

function collide(piece, offsetX, offsetY, newShapeIndex = null) {
  const testPiece = {
    ...piece,
    x: piece.x + offsetX,
    y: piece.y + offsetY,
    shapeIndex: newShapeIndex !== null ? newShapeIndex : piece.shapeIndex
  };

  const shape = getShape(testPiece);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (!shape[row][col]) continue;
      const x = testPiece.x + col;
      const y = testPiece.y + row;

      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && grid[y][x] !== EMPTY) return true;
    }
  }
  return false;
}

function mergePiece() {
  const shape = getShape(currentPiece);
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = currentPiece.x + col;
        const y = currentPiece.y + row;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          grid[y][x] = { type: currentPiece.type };
        }
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every((cell) => cell !== EMPTY)) {
      grid.splice(y, 1);
      grid.unshift(Array(COLS).fill(EMPTY));
      linesCleared++;
      y++; // re-check same row index after unshift
    }
  }

  if (linesCleared > 0) {
    const points = [0, 100, 250, 500, 800, 1200][linesCleared] || 0;
    score += points;
    scoreEl.textContent = score;
    // Slightly increase difficulty
    speed = Math.max(200, speed - linesCleared * 10);
    restartInterval();
  }
}

function spawnPiece() {
  if (!nextPiece) {
    currentPiece = createPiece();
    nextPiece = createPiece();
  } else {
    currentPiece = nextPiece;
    nextPiece = createPiece();
  }

  if (collide(currentPiece, 0, 0)) {
    endGame();
  }
}

function moveDown() {
  if (gameOver || !currentPiece) return;

  if (!collide(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  } else {
    mergePiece();
    clearLines();
    spawnPiece();
  }

  drawGrid();
  drawNext();
}

function moveHoriz(dx) {
  if (gameOver || !currentPiece) return;
  if (!collide(currentPiece, dx, 0)) {
    currentPiece.x += dx;
    drawGrid();
  }
}

function rotate() {
  if (gameOver || !currentPiece) return;
  const nextIndex = (currentPiece.shapeIndex + 1) % SHAPES[currentPiece.type].length;
  if (!collide(currentPiece, 0, 0, nextIndex)) {
    currentPiece.shapeIndex = nextIndex;
    drawGrid();
  }
}

function hardDrop() {
  if (gameOver || !currentPiece) return;
  while (!collide(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  }
  mergePiece();
  clearLines();
  spawnPiece();
  drawGrid();
  drawNext();
}

function endGame() {
  gameOver = true;
  clearInterval(intervalId);
  intervalId = null;
  if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.showAlert(`Игра окончена! Ваш счёт: ${score}`);
  } else {
    alert(`Игра окончена! Ваш счёт: ${score}`);
  }
}

function startGame() {
  grid = createEmptyGrid();
  score = 0;
  scoreEl.textContent = score;
  speed = 700;
  gameOver = false;
  currentPiece = null;
  nextPiece = null;
  spawnPiece();
  spawnPiece(); // ensure next is filled
  drawGrid();
  drawNext();
  restartInterval();
}

function restartInterval() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(moveDown, speed);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowLeft':
      e.preventDefault();
      moveHoriz(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveHoriz(1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveDown();
      break;
    case 'ArrowUp':
    case 'KeyX':
      e.preventDefault();
      rotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
});

restartBtn.addEventListener('click', () => {
  startGame();
});

// Telegram WebApp initialization
if (window.Telegram && window.Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

// Init grid on load
startGame();

