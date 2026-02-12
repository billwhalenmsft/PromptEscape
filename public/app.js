// ═══════════════════════════════════════════════════════════════
// PROMPT ESCAPE — Frontend Game Logic
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────
  let currentSession = null;
  let currentRoom = null;
  let currentTheme = null;
  let timerInterval = null;
  let gameStartTime = null;
  let roomStartTime = null;
  let attemptCount = 0;

  // ─── DOM Refs ───────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    title: $('#title-screen'),
    game: $('#game-screen'),
    victory: $('#victory-screen'),
    gameover: $('#gameover-screen'),
  };

  // ─── Screen Management ──────────────────────────────────────
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ─── Init: Load Themes ──────────────────────────────────────
  async function init() {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      renderThemeCards(data.themes);
    } catch (err) {
      console.error('Failed to load themes:', err);
    }

    // Bind global events
    $('#btn-submit').addEventListener('click', handleSubmit);
    $('#btn-hint').addEventListener('click', () => requestHint(false));
    $('#btn-workiq').addEventListener('click', () => requestHint(true));
    $('#btn-continue').addEventListener('click', handleContinue);
    $('#hint-close').addEventListener('click', closeHint);
    $('#btn-play-again').addEventListener('click', () => showScreen('title'));
    $('#btn-retry').addEventListener('click', handleRetry);
    $('#btn-menu').addEventListener('click', () => showScreen('title'));
    $('#prompt-input').addEventListener('input', updateCharCount);
    $('#prompt-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
    });
  }

  // ─── Render Theme Cards ─────────────────────────────────────
  function renderThemeCards(themes) {
    const container = $('#theme-cards');
    container.innerHTML = themes
      .map(
        (t) => `
      <div class="theme-card" data-theme="${t.id}" onclick="window._startGame('${t.id}')">
        <span class="theme-icon">${t.icon}</span>
        <div class="theme-name">${t.name}</div>
        <div class="theme-tagline">${t.tagline}</div>
        <div class="theme-rooms">${t.rooms.length} Rooms</div>
      </div>`
      )
      .join('');
  }

  // ─── Start Game ─────────────────────────────────────────────
  window._startGame = async function (themeId) {
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      currentSession = data.session;
      currentRoom = data.room;
      currentTheme = data.theme;
      attemptCount = 0;
      gameStartTime = Date.now();
      roomStartTime = Date.now();

      // Set theme colors
      document.body.setAttribute('data-theme', themeId);

      // Switch to game screen and render room
      showScreen('game');
      renderRoom();
      startTimer();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // ─── Render Current Room ────────────────────────────────────
  function renderRoom() {
    if (!currentRoom || !currentTheme) return;

    // HUD
    const roomIndex = currentSession.currentRoomIndex;
    const totalRooms = currentTheme.rooms.length;

    $('#hud-theme').textContent = `${currentTheme.icon} ${currentTheme.name}`;
    $('#hud-room').textContent = `Room ${roomIndex + 1}/${totalRooms}`;
    $('#hud-score').textContent = currentSession.totalScore;
    $('#hud-attempts').textContent = `Attempts: ${attemptCount}/${currentRoom.puzzle.maxAttempts}`;

    // Room art
    const roomArt = $('#room-art');
    roomArt.className = 'room-art ' + currentRoom.visualDescription;

    // Room info
    $('#room-name').textContent = currentRoom.name;
    $('#room-description').textContent = currentRoom.description;
    $('#challenge-text').textContent = currentRoom.puzzle.challenge;

    // Difficulty stars
    const stars = '★'.repeat(currentRoom.puzzle.difficulty) + '☆'.repeat(4 - currentRoom.puzzle.difficulty);
    $('#difficulty-badge').innerHTML = `<span class="star">${stars}</span>`;

    // Reset prompt input
    $('#prompt-input').value = '';
    $('#prompt-input').disabled = false;
    $('#btn-submit').disabled = false;
    updateCharCount();

    // Hide feedback panel
    $('#feedback-panel').classList.remove('visible');
    $('#btn-continue').style.display = 'none';

    // Hide hint
    closeHint();

    // Transition animation
    const scene = $('#room-scene');
    scene.classList.add('room-transition');
    scene.addEventListener('animationend', () => scene.classList.remove('room-transition'), { once: true });
  }

  // ─── Submit Prompt ──────────────────────────────────────────
  async function handleSubmit() {
    const prompt = $('#prompt-input').value.trim();
    if (!prompt) {
      $('#prompt-input').focus();
      return;
    }
    if (!currentSession) return;

    // Show loading state
    const btn = $('#btn-submit');
    btn.disabled = true;
    btn.classList.add('submitting');

    try {
      const res = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          prompt,
        }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        btn.disabled = false;
        btn.classList.remove('submitting');
        return;
      }

      currentSession = data.session;
      attemptCount++;

      // Show feedback
      renderFeedback(data.evaluation, data.nextRoom);

      // Flash effect on room scene
      const scene = $('#room-scene');
      if (data.evaluation.passed) {
        scene.classList.add('success-flash');
        scene.addEventListener('animationend', () => scene.classList.remove('success-flash'), { once: true });
      } else {
        scene.classList.add('fail-shake');
        scene.addEventListener('animationend', () => scene.classList.remove('fail-shake'), { once: true });
      }

      // Check game state
      if (data.session.status === 'escaped') {
        setTimeout(() => showVictory(), 2000);
      } else if (data.session.status === 'failed') {
        setTimeout(() => showGameOver(), 2000);
      }

      // Update HUD
      $('#hud-score').textContent = currentSession.totalScore;
      $('#hud-attempts').textContent = `Attempts: ${attemptCount}/${currentRoom.puzzle.maxAttempts}`;
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Failed to submit prompt. Try again.');
    } finally {
      btn.classList.remove('submitting');
    }
  }

  // ─── Render Feedback ────────────────────────────────────────
  function renderFeedback(evaluation, nextRoom) {
    const panel = $('#feedback-panel');
    panel.classList.add('visible');

    // Header
    const header = $('#feedback-header');
    if (evaluation.passed) {
      header.textContent = '✅ DOOR UNLOCKED!';
      header.className = 'feedback-header passed';
    } else {
      header.textContent = '❌ LOCKED';
      header.className = 'feedback-header failed';
    }

    // Score ring animation
    const score = evaluation.score;
    const circumference = 2 * Math.PI * 40; // r=40
    const offset = circumference - (score / 100) * circumference;
    const fillEl = $('#score-ring-fill');
    requestAnimationFrame(() => {
      fillEl.style.strokeDashoffset = offset.toString();
      fillEl.style.stroke = evaluation.passed ? 'var(--success)' : 'var(--danger)';
    });
    $('#score-value').textContent = score;

    // Score bars
    requestAnimationFrame(() => {
      $('#bar-relevance').style.width = evaluation.relevance + '%';
      $('#bar-specificity').style.width = evaluation.specificity + '%';
      $('#bar-creativity').style.width = evaluation.creativity + '%';
    });

    // Feedback text
    $('#feedback-text').textContent = evaluation.feedback;

    // Concept pills
    const conceptsEl = $('#feedback-concepts');
    const pills = [
      ...evaluation.matchedConcepts.map((c) => `<span class="concept-pill matched">✓ ${c}</span>`),
      ...evaluation.missedConcepts.map((c) => `<span class="concept-pill missed">✗ ${c}</span>`),
      ...evaluation.bonusMatched.map((c) => `<span class="concept-pill bonus">★ ${c}</span>`),
    ];
    conceptsEl.innerHTML = pills.join('');

    // Continue button
    if (evaluation.passed && nextRoom) {
      const btn = $('#btn-continue');
      btn.style.display = 'inline-block';
      // Store next room for continue handler
      window._nextRoom = nextRoom;
    }

    // Disable further submissions if passed
    if (evaluation.passed) {
      $('#prompt-input').disabled = true;
      $('#btn-submit').disabled = true;
    } else {
      $('#btn-submit').disabled = false;
    }
  }

  // ─── Continue to Next Room ──────────────────────────────────
  function handleContinue() {
    if (window._nextRoom) {
      currentRoom = window._nextRoom;
      window._nextRoom = null;
      attemptCount = 0;
      roomStartTime = Date.now();
      renderRoom();
    }
  }

  // ─── Request Hint ───────────────────────────────────────────
  async function requestHint(useWorkIQ) {
    if (!currentSession) return;

    try {
      const res = await fetch('/api/game/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          useWorkIQ,
        }),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      showHint(data.hint, data.context, data.source);
    } catch (err) {
      console.error('Hint request failed:', err);
    }
  }

  function showHint(text, context, source) {
    const panel = $('#hint-panel');
    panel.style.display = 'block';
    $('#hint-text').textContent = text;

    const contextEl = $('#hint-context');
    if (context) {
      contextEl.textContent = context;
      contextEl.style.display = 'block';
    } else {
      contextEl.style.display = 'none';
    }

    // Auto-close after 10 seconds
    setTimeout(closeHint, 10000);
  }

  function closeHint() {
    $('#hint-panel').style.display = 'none';
  }

  // ─── Victory Screen ─────────────────────────────────────────
  function showVictory() {
    stopTimer();
    showScreen('victory');

    const elapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    $('#victory-title').textContent = '🔓 YOU ESCAPED!';
    $('#victory-subtitle').textContent = getVictoryMessage(currentTheme.id);
    $('#stat-score').textContent = currentSession.totalScore;
    $('#stat-time').textContent = `${pad(minutes)}:${pad(seconds)}`;
    $('#stat-rooms').textContent = currentSession.completedRooms.length;

    // Spawn confetti
    spawnConfetti();
  }

  function getVictoryMessage(themeId) {
    const messages = {
      'indiana-jones': 'You navigated the temple, dodged the snakes, grabbed the idol, and outran the boulder! Fortune and glory!',
      'harry-potter': 'You brewed the right potion, defeated the basilisk, navigated the Room of Requirement, and escaped Hogwarts! Mischief managed!',
      'clippyland': 'You debugged the BSOD, outsmarted Clippy, solved the Excel maze, and ended the eternal meeting! You\'re free from Office!',
    };
    return messages[themeId] || 'Incredible prompt engineering! You escaped!';
  }

  // ─── Game Over Screen ───────────────────────────────────────
  function showGameOver() {
    stopTimer();
    showScreen('gameover');
    $('#gameover-text').textContent =
      currentRoom?.failureMessage || 'The room claims another victim...';
  }

  function handleRetry() {
    if (currentTheme) {
      window._startGame(currentTheme.id);
    }
  }

  // ─── Timer ──────────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimer() {
    if (!gameStartTime) return;
    const elapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    $('#hud-timer').textContent = `${pad(minutes)}:${pad(seconds)}`;
  }

  function pad(n) {
    return n.toString().padStart(2, '0');
  }

  // ─── Character Count ───────────────────────────────────────
  function updateCharCount() {
    const count = $('#prompt-input').value.length;
    $('#char-count').textContent = count;
  }

  // ─── Confetti ───────────────────────────────────────────────
  function spawnConfetti() {
    const container = $('#confetti-container');
    container.innerHTML = '';

    const colors = ['#00ff88', '#a855f7', '#ff4444', '#ffaa00', '#3498db', '#ff69b4', '#ffd700'];

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.width = (Math.random() * 10 + 5) + 'px';
      piece.style.height = (Math.random() * 10 + 5) + 'px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 2) + 's';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      container.appendChild(piece);
    }
  }

  // ─── Boot ───────────────────────────────────────────────────
  init();
})();
