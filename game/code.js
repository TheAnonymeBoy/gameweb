const arena = document.getElementById('arena');
const player = document.getElementById('player');
const healthBar = document.getElementById('health-bar');
const scoreElement = document.getElementById('score');
const positionDisplay = document.getElementById('positionDisplay');
const replayBtn = document.getElementById('replayBtn');
const playBtn = document.getElementById('playBtn');

let health = 1000;
let score = 0;
let gameOver = false;

const SPRITE_SIZE = 50;
const moveSpeed = 5;

let xPosition = 0;
let yPosition = 0;

let enemyInterval = null;
let waveInterval = null;
let gameTimerTimeout = null;

let enemySpawnRate = 2000;
let enemiesPerWave = 5;
const minSpawnRate = 500;
const waveIncreasePeriod = 15000;

const keysPressed = {};

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  const key = e.key.toLowerCase();
  keysPressed[key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    shootBullet();
  }
});

document.addEventListener('keyup', (e) => {
  keysPressed[e.key.toLowerCase()] = false;
});

function initPlayerPosition() {
  const aw = arena.clientWidth;
  const ah = arena.clientHeight;
  xPosition = (aw - SPRITE_SIZE) / 2;
  yPosition = ah - SPRITE_SIZE - 20;
  applyPlayerPosition();
}

function applyPlayerPosition() {
  player.style.left = `${xPosition}px`;
  player.style.top = `${yPosition}px`;
  positionDisplay.textContent = `Position du joueur: X = ${Math.round(xPosition)}, Y = ${Math.round(yPosition)}`;
}

function updateMovement() {
  if (gameOver) return;
  const aw = arena.clientWidth;
  const ah = arena.clientHeight;
  if (keysPressed['arrowup'] || keysPressed['z']) {
    yPosition = Math.max(0, yPosition - moveSpeed);
  }
  if (keysPressed['arrowdown'] || keysPressed['s']) {
    yPosition = Math.min(ah - SPRITE_SIZE, yPosition + moveSpeed);
  }
  if (keysPressed['arrowleft'] || keysPressed['q']) {
    xPosition = Math.max(0, xPosition - moveSpeed);
  }
  if (keysPressed['arrowright'] || keysPressed['d']) {
    xPosition = Math.min(aw - SPRITE_SIZE, xPosition + moveSpeed);
  }
  applyPlayerPosition();
  requestAnimationFrame(updateMovement);
}

function shootBullet() {
  const bullet = document.createElement('div');
  bullet.classList.add('bullet');
  bullet.style.position = 'absolute';
  bullet.style.left = `${xPosition + SPRITE_SIZE / 2 - 4}px`;
  bullet.style.top = `${yPosition}px`;
  arena.appendChild(bullet);
  function moveBullet() {
    const currentTop = parseFloat(bullet.style.top);
    const newTop = currentTop - 10;
    bullet.style.top = `${newTop}px`;
    arena.querySelectorAll('.enemy').forEach(enemy => {
      if (checkCollision(bullet, enemy)) {
        enemy.hp = (enemy.hp ?? 1) - 1;
        bullet.remove();
        if (enemy.hp <= 0) {
          increaseScore(enemy.scoreValue ?? 1);
          enemy.remove();
        }
      }
    });
    if (!gameOver && newTop > -20) {
      requestAnimationFrame(moveBullet);
    } else {
      bullet.remove();
    }
  }
  moveBullet();
}

function createEnemy() {
  if (gameOver) return;
  const aw = arena.clientWidth;
  const enemy = document.createElement('div');
  enemy.classList.add('enemy');
  enemy.style.width = '40px';
  enemy.style.height = '40px';
  enemy.style.position = 'absolute';
  enemy.style.top = `-40px`;
  enemy.style.left = `${Math.random() * (aw - 40)}px`;
  const isStrong = Math.random() < 0.25;
  enemy.hp = isStrong ? 3 : 1;
  enemy.scoreValue = isStrong ? 5 : 1;
  enemy.damage = isStrong ? 40 : 20;
  enemy.style.backgroundColor = isStrong ? '#d93025' : '#222';
  arena.appendChild(enemy);
  const enemySpeed = Math.random() * 1.5 + (isStrong ? 0.4 : 0.6);
  function moveEnemy() {
    if (gameOver) {
      enemy.remove();
      return;
    }
    const currentTop = parseFloat(enemy.style.top);
    const newTop = currentTop + enemySpeed;
    enemy.style.top = `${newTop}px`;
    if (newTop > arena.clientHeight) {
      enemy.remove();
      return;
    }
    if (checkCollision(player, enemy)) {
      decreaseHealth(enemy.damage);
      enemy.remove();
    } else {
      requestAnimationFrame(moveEnemy);
    }
  }
  moveEnemy();
}

function checkCollision(elem1, elem2) {
  const r1 = elem1.getBoundingClientRect();
  const r2 = elem2.getBoundingClientRect();
  return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
}

function increaseScore(amount = 1) {
  score += amount;
  scoreElement.textContent = `Score: ${score}`;
}

function decreaseHealth(amount) {
  health = Math.max(0, health - amount);
  healthBar.style.width = `${(health / 1000) * 100}%`;
  const healthTextEl = document.getElementById('player-health');
  if (healthTextEl) healthTextEl.textContent = health;
  if (health === 0) endGame();
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  if (enemyInterval) clearInterval(enemyInterval);
  if (waveInterval) clearInterval(waveInterval);
  if (gameTimerTimeout) clearTimeout(gameTimerTimeout);
  alert(`GAME OVER! Score final: ${score}`);
  replayBtn.style.display = 'block';
  playBtn.style.display = 'block';
}

function startGame() {
  health = 1000;
  score = 0;
  gameOver = false;
  healthBar.style.width = '100%';
  const healthTextEl = document.getElementById('player-health');
  if (healthTextEl) healthTextEl.textContent = health;
  scoreElement.textContent = `Score: ${score}`;
  arena.querySelectorAll('.enemy, .bullet').forEach(n => n.remove());
  initPlayerPosition();
  applyPlayerPosition();
  playBtn.style.display = 'none';
  replayBtn.style.display = 'none';
  for (const k in keysPressed) keysPressed[k] = false;
  updateMovement();
  enemySpawnRate = 2000;
  enemiesPerWave = 5;
  startEnemySpawning();
  startDifficultyRamp();
  startGameTimer();
}

function startEnemySpawning() {
  if (enemyInterval) clearInterval(enemyInterval);
  enemyInterval = setInterval(() => {
    if (gameOver) return;
    for (let i = 0; i < enemiesPerWave; i++) {
      createEnemy();
    }
  }, enemySpawnRate);
}

function startDifficultyRamp() {
  if (waveInterval) clearInterval(waveInterval);
  waveInterval = setInterval(() => {
    if (gameOver) return;
    if (enemySpawnRate > minSpawnRate) {
      enemySpawnRate = Math.max(minSpawnRate, enemySpawnRate - 200);
    }
    enemiesPerWave += 2;
    startEnemySpawning();
  }, waveIncreasePeriod);
}

function startGameTimer() {
  if (gameTimerTimeout) clearTimeout(gameTimerTimeout);
  gameTimerTimeout = setTimeout(() => {
    if (!gameOver) {
      endGame();
    }
  }, 5 * 60 * 1000);
}

replayBtn.addEventListener('click', startGame);
playBtn.addEventListener('click', startGame);

initPlayerPosition();
window.addEventListener('resize', initPlayerPosition);
