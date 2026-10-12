
const emojis = [
  "🐱", "🐰", "🐻", "🐼",
  "🐸", "🦊", "🐹", "🐣"
];

const board = document.getElementById("game-board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const movesEl = document.getElementById("moves");
const timerEl = document.getElementById("timer");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const messageEl = document.getElementById("message");

const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const resumeOverlay = document.getElementById("resume-overlay");

const winModal = document.getElementById("win-modal");
const finalScore = document.getElementById("final-score");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");
const recordMessage = document.getElementById("record-message");
const playAgainBtn = document.getElementById("play-again-btn");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let paused = false;
let finished = false;
let hasStarted = false;

let moves = 0;
let matchedPairs = 0;
let seconds = 0;
let mismatchTimeout = null;

const totalPairs = emojis.length;
const BEST_KEY = "memoryMatchBestScore";

function getBestScore() {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Game tetap berjalan jika penyimpanan tidak tersedia.
  }
}

let bestScore = getBestScore();
bestScoreEl.textContent = bestScore;

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const secs = value % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}

function calculateScore() {
  // Setiap pasangan bernilai 100 poin.
  // Setiap langkah mengurangi 5 poin.
  return Math.max(0, matchedPairs * 100 - moves * 5);
}

function updateStats() {
  scoreEl.textContent = calculateScore();
  movesEl.textContent = moves;
  timerEl.textContent = formatTime(seconds);

  progressText.textContent = `${matchedPairs} / ${totalPairs}`;
  progressBar.style.width =
    `${(matchedPairs / totalPairs) * 100}%`;
}

function createCard(emoji, index) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "memory-card";
  card.dataset.emoji = emoji;
  card.setAttribute("aria-label", `Kartu ${index + 1}, tertutup`);
  card.setAttribute("aria-pressed", "false");

  card.innerHTML = `
    <span class="card-inner">
      <span class="card-face card-back" aria-hidden="true">♡</span>
      <span class="card-face card-front" aria-hidden="true">${emoji}</span>
    </span>
  `;

  card.addEventListener("click", () => flipCard(card));

  return card;
}

function createBoard() {
  board.innerHTML = "";

  const cards = shuffle([...emojis, ...emojis]);

  cards.forEach((emoji, index) => {
    board.appendChild(createCard(emoji, index));
  });
}

function flipCard(card) {
  if (
    paused ||
    finished ||
    lockBoard ||
    card === firstCard ||
    card.classList.contains("matched") ||
    card.classList.contains("flipped")
  ) {
    return;
  }

  if (!hasStarted) {
    hasStarted = true;
  }

  card.classList.add("flipped");
  card.setAttribute("aria-pressed", "true");
  card.setAttribute("aria-label", `Kartu ${card.dataset.emoji}`);

  if (!firstCard) {
    firstCard = card;
    messageEl.textContent = "Cari kartu dengan gambar yang sama! 💕";
    return;
  }

  secondCard = card;
  moves++;
  lockBoard = true;

  updateStats();

  if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
    handleMatch();
  } else {
    messageEl.textContent = "Belum cocok, coba ingat posisinya! 🌷";

    mismatchTimeout = setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");

      firstCard.setAttribute("aria-pressed", "false");
      secondCard.setAttribute("aria-pressed", "false");

      firstCard.setAttribute("aria-label", "Kartu tertutup");
      secondCard.setAttribute("aria-label", "Kartu tertutup");

      resetTurn();
      messageEl.textContent = "Ayo coba pasangan yang lain! ✨";
    }, 750);
  }
}

function handleMatch() {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");

  firstCard.disabled = true;
  secondCard.disabled = true;

  matchedPairs++;

  messageEl.textContent = "Yeay! Kamu menemukan pasangan! 💗";

  resetTurn();
  updateStats();

  if (matchedPairs === totalPairs) {
    finishGame();
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function finishGame() {
  finished = true;
  paused = false;
  hasStarted = false;

  pauseOverlay.hidden = true;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "⏸ Jeda";

  const finalValue = calculateScore();
  const isNewRecord = finalValue > bestScore;

  if (isNewRecord) {
    bestScore = finalValue;
    saveBestScore(bestScore);
    bestScoreEl.textContent = bestScore;
  }

  finalScore.textContent = finalValue;
  finalMoves.textContent = moves;
  finalTime.textContent = formatTime(seconds);

  recordMessage.textContent = isNewRecord
    ? "🏆 Rekor baru! Kamu hebat!"
    : "💗 Bagus! Coba pecahkan rekor berikutnya.";

  messageEl.textContent = "Semua pasangan berhasil ditemukan! 🎉";
  winModal.hidden = false;
}

function togglePause() {
  if (finished) return;

  paused = !paused;
  pauseOverlay.hidden = !paused;

  pauseBtn.textContent = paused
    ? "▶ Lanjut"
    : "⏸ Jeda";

  messageEl.textContent = paused
    ? "Game dijeda. Istirahat dulu, ya! ☁️"
    : "Game dilanjutkan. Semangat! 🌸";
}

function restartGame() {
  if (mismatchTimeout !== null) {
    clearTimeout(mismatchTimeout);
    mismatchTimeout = null;
  }

  firstCard = null;
  secondCard = null;
  lockBoard = false;
  paused = false;
  finished = false;
  hasStarted = false;

  moves = 0;
  matchedPairs = 0;
  seconds = 0;

  pauseOverlay.hidden = true;
  winModal.hidden = true;

  pauseBtn.disabled = false;
  pauseBtn.textContent = "⏸ Jeda";

  messageEl.textContent = "Yuk, temukan semua pasangan kartu! 🌷";

  updateStats();
  createBoard();
}

pauseBtn.addEventListener("click", togglePause);
resumeOverlay.addEventListener("click", togglePause);
restartBtn.addEventListener("click", restartGame);
playAgainBtn.addEventListener("click", restartGame);

// Timer hanya bertambah ketika permainan sedang aktif.
setInterval(() => {
  if (hasStarted && !paused && !finished) {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }
}, 1000);

// Mulai permainan pertama kali.
restartGame();
                         
