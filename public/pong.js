// Super-light single-paddle ping pong

const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const scoreElPong = document.getElementById('pongScore');

const W = canvas.width;
const H = canvas.height;

const paddle = {
  w: 80,
  h: 12,
  x: (W - 80) / 2,
  y: H - 30,
  speed: 8,
  dx: 0
};

const ball = {
  r: 7,
  x: W / 2,
  y: H / 2,
  vx: 3,
  vy: -4
};

let scorePong = 0;
let running = false;
let lastTime = 0;

function resetBall() {
  ball.x = W / 2;
  ball.y = H / 2;
  const dirX = Math.random() > 0.5 ? 1 : -1;
  ball.vx = 3 * dirX;
  ball.vy = -4;
}

function resetGame() {
  scorePong = 0;
  scoreElPong.textContent = scorePong;
  paddle.x = (W - paddle.w) / 2;
  resetBall();
  running = true;
}

function draw() {
  // background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  // mid line
  ctx.strokeStyle = '#1e293b';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // paddle
  const grd = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
  grd.addColorStop(0, '#22c55e');
  grd.addColorStop(1, '#4ade80');
  ctx.fillStyle = grd;
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  // ball
  ctx.beginPath();
  const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r);
  ballGrad.addColorStop(0, '#facc15');
  ballGrad.addColorStop(1, '#fb923c');
  ctx.fillStyle = ballGrad;
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function update(dt) {
  if (!running) return;

  // move paddle
  paddle.x += paddle.dx;
  if (paddle.x < 10) paddle.x = 10;
  if (paddle.x + paddle.w > W - 10) paddle.x = W - 10 - paddle.w;

  // move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // walls
  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx *= -1;
  }
  if (ball.x + ball.r > W) {
    ball.x = W - ball.r;
    ball.vx *= -1;
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy *= -1;
  }

  // paddle collision
  if (
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.h + 8 &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w &&
    ball.vy > 0
  ) {
    ball.y = paddle.y - ball.r;
    ball.vy *= -1;
    scorePong += 1;
    scoreElPong.textContent = scorePong;

    // angle based on hit position
    const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = 4 * hitPos;
  }

  // miss
  if (ball.y - ball.r > H) {
    running = false;
    if (window.Telegram && window.Telegram.WebApp) {
      Telegram.WebApp.showAlert(`Мяч ушёл вниз. Счёт: ${scorePong}`);
    } else {
      alert(`Мяч ушёл вниз. Счёт: ${scorePong}`);
    }
  }
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    paddle.dx = -paddle.speed;
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    paddle.dx = paddle.speed;
  } else if (e.code === 'Space') {
    e.preventDefault();
    if (!running) {
      resetGame();
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    paddle.dx = 0;
  }
});

if (window.Telegram && window.Telegram.WebApp) {
  Telegram.WebApp.ready();
  Telegram.WebApp.expand();
}

resetGame();
requestAnimationFrame(loop);

