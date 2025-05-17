// Tetris JavaScript Core
const canvas = document.getElementById("game-board");
const context = canvas.getContext("2d");
context.scale(30, 30); // 10x20 => 300x600

const ROWS = 20;
const COLS = 10;

const COLORS = {
  1: "cyan",
  2: "yellow",
  3: "purple",
  4: "green",
  5: "red",
  6: "blue",
  7: "orange",
};

const PIECES = {
  I: [[1, 1, 1, 1]],
  O: [
    [2, 2],
    [2, 2],
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
  ],
};

let board = createMatrix(COLS, ROWS);
let currentPiece = null;
let holdPiece = null;
let nextPieces = [];
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let canHold = true;

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function rotate(matrix, dir = 1) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function merge(board, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) board[y + piece.pos.y][x + piece.pos.x] = value;
    });
  });
}

function collide(board, piece) {
  const m = piece.matrix;
  const o = piece.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] &&
        (board[y + o.y] && board[y + o.y][x + o.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function drop() {
  currentPiece.pos.y++;
  if (collide(board, currentPiece)) {
    currentPiece.pos.y--;
    merge(board, currentPiece);
    resetPiece();
    clearLines();
    canHold = true;
  }
  dropCounter = 0;
}

function clearLines() {
  outer: for (let y = board.length - 1; y >= 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) continue outer;
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    score += 10;
    document.getElementById("score").innerText = `Score: ${score}`;
    y++;
  }
}

function resetPiece() {
  const types = Object.keys(PIECES);
  if (nextPieces.length < 3) {
    while (nextPieces.length < 5) {
      const r = types[Math.floor(Math.random() * types.length)];
      nextPieces.push({ matrix: PIECES[r], name: r });
    }
  }
  currentPiece = nextPieces.shift();
  currentPiece.matrix = currentPiece.matrix.map(row => [...row]);
  currentPiece.pos = { x: 3, y: 0 };
  if (collide(board, currentPiece)) {
    board = createMatrix(COLS, ROWS);
    score = 0;
    alert("Game Over");
  }
  drawNext();
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, { x: 0, y: 0 });
  drawGhost();
  drawMatrix(currentPiece.matrix, currentPiece.pos);
}

function drawMatrix(matrix, offset, ghost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = ghost
          ? "rgba(255, 255, 255, 0.2)"
          : COLORS[value] || "white";
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function drawGhost() {
  let ghostY = currentPiece.pos.y;
  while (!collide(board, { matrix: currentPiece.matrix, pos: { x: currentPiece.pos.x, y: ghostY } })) {
    ghostY++;
  }
  ghostY--;
  drawMatrix(currentPiece.matrix, { x: currentPiece.pos.x, y: ghostY }, true);
}

function drawNext() {
  const next = document.getElementById("next").getContext("2d");
  next.clearRect(0, 0, 100, 400);
  nextPieces.slice(0, 3).forEach((p, i) => {
    p.matrix.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          next.fillStyle = COLORS[val] || "gray";
          next.fillRect(x * 10, i * 80 + y * 10, 10, 10);
        }
      });
    });
  });
}

function hold() {
  if (!canHold) return;
  const temp = holdPiece;
  holdPiece = { matrix: currentPiece.matrix.map(r => [...r]), name: currentPiece.name };
  if (!temp) {
    resetPiece();
  } else {
    currentPiece = temp;
    currentPiece.pos = { x: 3, y: 0 };
  }
  drawHold();
  canHold = false;
}

function drawHold() {
  const hold = document.getElementById("hold").getContext("2d");
  hold.clearRect(0, 0, 100, 100);
  if (!holdPiece) return;
  holdPiece.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        hold.fillStyle = COLORS[val] || "gray";
        hold.fillRect(x * 10, y * 10, 10, 10);
      }
    });
  });
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) drop();
  draw();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      currentPiece.pos.x--;
      if (collide(board, currentPiece)) currentPiece.pos.x++;
      break;
    case "ArrowRight":
      currentPiece.pos.x++;
      if (collide(board, currentPiece)) currentPiece.pos.x--;
      break;
    case "ArrowDown":
      drop();
      break;
    case " ":
      while (!collide(board, currentPiece)) currentPiece.pos.y++;
      currentPiece.pos.y--;
      drop();
      break;
    case "z":
      rotate(currentPiece.matrix, -1);
      if (collide(board, currentPiece)) rotate(currentPiece.matrix, 1);
      break;
    case "x":
      rotate(currentPiece.matrix, 1);
      if (collide(board, currentPiece)) rotate(currentPiece.matrix, -1);
      break;
    case "c":
      hold();
      break;
  }
});

document.getElementById("start-button").onclick = () => {
  resetPiece();
  update();
};
