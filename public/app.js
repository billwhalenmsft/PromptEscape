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
  let cachedStats = null;
  let statsView = 'theme'; // 'theme' | 'region'
  let statsPollInterval = null;

  // Multiplayer state
  let gameMode = 'solo';       // 'solo' | 'team' | 'versus'
  let currentLobby = null;     // lobby object
  let myPlayer = null;         // my player object { id, name, team }
  let lobbyPollInterval = null;
  let allSessions = [];        // for versus: [{session, room}, ...]

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
      renderThemeCards(data.themes, 'theme-cards');
      renderThemeCards(data.themes, 'lobby-theme-cards', true);
    } catch (err) {
      console.error('Failed to load themes:', err);
    }

    // Load global stats
    await loadStats();
    startStatsPolling();

    // Bind global events
    $('#btn-submit').addEventListener('click', handleSubmit);
    $('#btn-hint').addEventListener('click', () => requestHint(false));
    $('#btn-workiq').addEventListener('click', () => requestHint(true));
    $('#btn-continue').addEventListener('click', handleContinue);
    $('#hint-close').addEventListener('click', closeHint);
    $('#btn-play-again').addEventListener('click', () => { resetMultiplayer(); showScreen('title'); showTitleSection('mode-select'); loadStats(); });
    $('#btn-retry').addEventListener('click', handleRetry);
    $('#btn-menu').addEventListener('click', () => { resetMultiplayer(); showScreen('title'); showTitleSection('mode-select'); loadStats(); });
    $('#prompt-input').addEventListener('input', updateCharCount);
    $('#prompt-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
    });
  }

  function startStatsPolling() {
    if (statsPollInterval) clearInterval(statsPollInterval);
    statsPollInterval = setInterval(() => {
      if (screens.title.classList.contains('active')) {
        loadStats();
      }
    }, 15000);
  }

  // ─── Render Theme Cards ─────────────────────────────────────
  function renderThemeCards(themes, containerId, isLobby) {
    const container = $('#' + containerId);
    container.innerHTML = themes
      .map(
        (t) => `
      <div class="theme-card" data-theme="${t.id}" onclick="window.${isLobby ? '_selectLobbyTheme' : '_startGame'}('${t.id}')">
        <span class="theme-icon">${t.icon}</span>
        <div class="theme-name">${t.name}</div>
        <div class="theme-tagline">${t.tagline}</div>
        <div class="theme-rooms">${t.rooms.length} Rooms</div>
      </div>`
      )
      .join('');
  }

  // ─── Title Section Management ────────────────────────────────
  const titleSections = ['mode-select', 'theme-select', 'mp-choice', 'lobby-create', 'lobby-join', 'lobby-waiting'];

  function showTitleSection(id) {
    titleSections.forEach((s) => {
      const el = $('#' + s);
      if (el) el.style.display = s === id ? '' : 'none';
    });
    // Always show stats on main screens
    const statsEl = $('#stats-dashboard');
    if (statsEl) statsEl.style.display = (id === 'mode-select') ? '' : 'none';
  }

  // ─── Mode Selection ────────────────────────────────────────
  window._selectMode = function (mode) {
    gameMode = mode;
    if (mode === 'solo') {
      showTitleSection('theme-select');
    } else {
      $('#mp-choice-title').textContent = mode === 'team' ? '👥 Team Mode' : '⚔️ Versus Mode';
      showTitleSection('mp-choice');
    }
  };

  window._backToModes = function () {
    showTitleSection('mode-select');
  };

  window._showCreateLobby = function () {
    showTitleSection('lobby-create');
  };

  window._showJoinLobby = function () {
    showTitleSection('lobby-join');
  };

  window._backToMpChoice = function () {
    showTitleSection('mp-choice');
  };

  // ─── Lobby Management ──────────────────────────────────────
  window._createLobby = async function () {
    const name = $('#create-name').value.trim();
    if (!name) { alert('Enter your name'); return; }

    try {
      const res = await fetch('/api/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: gameMode, hostName: name }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }

      currentLobby = data.lobby;
      myPlayer = data.player;
      showLobbyWaiting();
    } catch (err) {
      console.error('Create lobby failed:', err);
    }
  };

  window._joinLobby = async function () {
    const name = $('#join-name').value.trim();
    const code = $('#join-code').value.trim().toUpperCase();
    if (!name) { alert('Enter your name'); return; }
    if (!code || code.length !== 4) { alert('Enter a 4-character lobby code'); return; }

    try {
      const res = await fetch('/api/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, playerName: name }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }

      currentLobby = data.lobby;
      myPlayer = data.player;
      gameMode = currentLobby.mode;
      showLobbyWaiting();
    } catch (err) {
      console.error('Join lobby failed:', err);
    }
  };

  function showLobbyWaiting() {
    showTitleSection('lobby-waiting');
    $('#lobby-code-value').textContent = currentLobby.code;
    const modeLabel = currentLobby.mode === 'team' ? '👥 Team Mode' : '⚔️ Versus Mode';
    $('#lobby-mode-badge').textContent = modeLabel;

    // Show theme select only for host
    const themeSection = $('#lobby-theme-select');
    themeSection.style.display = (myPlayer.id === currentLobby.hostId) ? '' : 'none';

    renderLobbyPlayers();
    updateStartButton();
    startLobbyPolling();
  }

  function renderLobbyPlayers() {
    const container = $('#lobby-players');
    if (!currentLobby) return;

    if (currentLobby.mode === 'versus') {
      const teamA = currentLobby.players.filter((p) => p.team === 'A');
      const teamB = currentLobby.players.filter((p) => p.team === 'B');

      container.innerHTML = `
        <div class="lobby-teams">
          <div class="lobby-team lobby-team-a">
            <h3>🔴 Team A</h3>
            ${teamA.map((p) => playerTag(p)).join('')}
          </div>
          <div class="lobby-team lobby-team-b">
            <h3>🔵 Team B</h3>
            ${teamB.map((p) => playerTag(p)).join('')}
          </div>
        </div>
        ${currentLobby.status === 'waiting' ? `<button class="btn btn-hint" onclick="window._switchMyTeam()">Switch Team</button>` : ''}
      `;
    } else {
      container.innerHTML = `
        <div class="lobby-player-list">
          <h3>Players</h3>
          ${currentLobby.players.map((p) => playerTag(p)).join('')}
        </div>
      `;
    }
  }

  function playerTag(player) {
    const isHost = player.id === currentLobby.hostId;
    const isMe = player.id === myPlayer.id;
    return `<div class="lobby-player ${isMe ? 'me' : ''}">
      <span class="player-name">${player.name}</span>
      ${isHost ? '<span class="player-badge">👑</span>' : ''}
      ${isMe ? '<span class="player-badge you-badge">(you)</span>' : ''}
    </div>`;
  }

  function updateStartButton() {
    const btn = $('#btn-start-lobby');
    const isHost = myPlayer && currentLobby && myPlayer.id === currentLobby.hostId;
    const hasTheme = !!currentLobby?.themeId;
    const enoughPlayers = currentLobby?.mode !== 'versus' || (
      currentLobby.players.filter((p) => p.team === 'A').length > 0 &&
      currentLobby.players.filter((p) => p.team === 'B').length > 0
    );
    btn.style.display = isHost ? 'inline-block' : 'none';
    btn.disabled = !hasTheme || !enoughPlayers;
  }

  window._selectLobbyTheme = async function (themeId) {
    if (!currentLobby || !myPlayer) return;
    try {
      const res = await fetch(`/api/lobby/${currentLobby.code}/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayer.id, themeId }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      currentLobby = data.lobby;
      // Highlight selected theme
      $$('#lobby-theme-cards .theme-card').forEach((c) => {
        c.classList.toggle('selected', c.dataset.theme === themeId);
      });
      updateStartButton();
    } catch (err) {
      console.error('Set theme failed:', err);
    }
  };

  window._switchMyTeam = async function () {
    if (!currentLobby || !myPlayer) return;
    try {
      const res = await fetch(`/api/lobby/${currentLobby.code}/switch-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayer.id }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      currentLobby = data.lobby;
      myPlayer = currentLobby.players.find((p) => p.id === myPlayer.id);
      renderLobbyPlayers();
      updateStartButton();
    } catch (err) {
      console.error('Switch team failed:', err);
    }
  };

  window._leaveLobby = async function () {
    stopLobbyPolling();
    if (currentLobby && myPlayer) {
      try {
        await fetch(`/api/lobby/${currentLobby.code}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myPlayer.id }),
        });
      } catch (e) { /* ignore */ }
    }
    resetMultiplayer();
    showTitleSection('mode-select');
  };

  window._startLobbyGame = async function () {
    if (!currentLobby || !myPlayer) return;
    try {
      const res = await fetch(`/api/lobby/${currentLobby.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayer.id }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }

      currentLobby = data.lobby;
      allSessions = data.sessions;
      enterMultiplayerGame(data.sessions);
    } catch (err) {
      console.error('Start lobby game failed:', err);
    }
  };

  // ─── Lobby Polling ─────────────────────────────────────────
  function startLobbyPolling() {
    stopLobbyPolling();
    lobbyPollInterval = setInterval(pollLobby, 2000);
  }

  function stopLobbyPolling() {
    if (lobbyPollInterval) {
      clearInterval(lobbyPollInterval);
      lobbyPollInterval = null;
    }
  }

  async function pollLobby() {
    if (!currentLobby) return;
    try {
      const res = await fetch(`/api/lobby/${currentLobby.code}`);
      const data = await res.json();
      if (data.error) return;

      currentLobby = data.lobby;

      // If game started and we're still in the lobby screen, transition to game
      if (currentLobby.status === 'playing' && screens.title.classList.contains('active')) {
        allSessions = data.sessions || [];
        enterMultiplayerGame(allSessions);
        return;
      }

      // If game is playing, update versus scoreboard
      if (currentLobby.status === 'playing' && data.sessions) {
        allSessions = data.sessions;
        updateVersusScoreboard();
        // Check for winner
        if (currentLobby.winner) {
          showMultiplayerResult();
        }
      }

      // Update lobby UI if still waiting
      if (currentLobby.status === 'waiting') {
        renderLobbyPlayers();
        updateStartButton();
        // Reflect theme selection from host
        if (currentLobby.themeId) {
          $$('#lobby-theme-cards .theme-card').forEach((c) => {
            c.classList.toggle('selected', c.dataset.theme === currentLobby.themeId);
          });
        }
      }
    } catch (err) {
      // Ignore poll errors
    }
  }

  function enterMultiplayerGame(sessions) {
    stopLobbyPolling();

    // Determine which session belongs to my team
    if (gameMode === 'versus') {
      const myTeam = myPlayer.team;
      const mySessionData = sessions.find((s) => s.session.teamSide === myTeam);
      if (mySessionData) {
        currentSession = mySessionData.session;
        currentRoom = mySessionData.room;
      } else {
        currentSession = sessions[0].session;
        currentRoom = sessions[0].room;
      }
    } else {
      // Team mode: shared session
      currentSession = sessions[0].session;
      currentRoom = sessions[0].room;
    }

    // Fetch theme
    fetch('/api/themes').then((r) => r.json()).then((data) => {
      currentTheme = data.themes.find((t) => t.id === currentLobby.themeId);
      attemptCount = 0;
      gameStartTime = Date.now();
      roomStartTime = Date.now();

      document.body.setAttribute('data-theme', currentLobby.themeId);
      showScreen('game');

      // Show mode badge in HUD
      const badge = $('#hud-mode-badge');
      if (gameMode === 'team') {
        badge.textContent = '👥 TEAM';
        badge.style.display = '';
      } else if (gameMode === 'versus') {
        badge.textContent = `⚔️ TEAM ${myPlayer.team}`;
        badge.style.display = '';
        $('#versus-scoreboard').style.display = '';
        updateVersusScoreboard();
      }

      renderRoom();
      startTimer();
      // Resume polling for multiplayer state
      startLobbyPolling();
    });
  }

  function updateVersusScoreboard() {
    if (gameMode !== 'versus' || !allSessions || allSessions.length < 2) return;

    const sessionA = allSessions.find((s) => s.session?.teamSide === 'A');
    const sessionB = allSessions.find((s) => s.session?.teamSide === 'B');

    if (sessionA?.session) {
      $('#vs-score-a').textContent = sessionA.session.totalScore;
      $('#vs-room-a').textContent = sessionA.session.status === 'escaped' ? '🏆 Escaped!'
        : sessionA.session.status === 'failed' ? '💀 Failed'
        : `Room ${sessionA.session.currentRoomIndex + 1}`;
    }
    if (sessionB?.session) {
      $('#vs-score-b').textContent = sessionB.session.totalScore;
      $('#vs-room-b').textContent = sessionB.session.status === 'escaped' ? '🏆 Escaped!'
        : sessionB.session.status === 'failed' ? '💀 Failed'
        : `Room ${sessionB.session.currentRoomIndex + 1}`;
    }
  }

  function showMultiplayerResult() {
    stopLobbyPolling();
    stopTimer();
    showScreen('victory');

    const elapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    if (gameMode === 'versus' && currentLobby) {
      if (currentLobby.winner === 'tie') {
        $('#victory-title').textContent = "🤝 IT'S A TIE!";
        $('#victory-subtitle').textContent = 'Both teams matched each other perfectly!';
      } else {
        const won = currentLobby.winner === myPlayer.team;
        $('#victory-title').textContent = won ? '🏆 YOUR TEAM WINS!' : '😢 YOUR TEAM LOST';
        $('#victory-subtitle').textContent = won
          ? `Team ${currentLobby.winner} dominated the escape!`
          : `Team ${currentLobby.winner} escaped faster. Better luck next time!`;
      }
    } else {
      // team mode
      $('#victory-title').textContent = '🔓 TEAM ESCAPED!';
      $('#victory-subtitle').textContent = 'Great teamwork! You all escaped together!';
    }

    $('#stat-score').textContent = currentSession.totalScore;
    $('#stat-time').textContent = `${pad(minutes)}:${pad(seconds)}`;
    $('#stat-rooms').textContent = currentSession.completedRooms.length;

    spawnConfetti();
  }

  function resetMultiplayer() {
    stopLobbyPolling();
    currentLobby = null;
    myPlayer = null;
    allSessions = [];
    gameMode = 'solo';
    const badge = $('#hud-mode-badge');
    if (badge) badge.style.display = 'none';
    const vsBoard = $('#versus-scoreboard');
    if (vsBoard) vsBoard.style.display = 'none';
  }

  // ─── Start Game (Solo) ──────────────────────────────────────
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
      const isMultiplayer = currentLobby && currentLobby.code;
      const url = isMultiplayer
        ? `/api/lobby/${currentLobby.code}/submit`
        : '/api/game/submit';
      const body = {
        sessionId: currentSession.id,
        prompt,
      };
      if (isMultiplayer && myPlayer) {
        body.playerId = myPlayer.id;
        body.playerName = myPlayer.name;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        if (currentLobby && gameMode === 'versus') {
          // In versus mode, update lobby state and wait for winner determination
          if (data.lobby) currentLobby = data.lobby;
          if (currentLobby.winner) {
            setTimeout(() => showMultiplayerResult(), 2000);
          } else {
            setTimeout(() => showVictory(), 2000);
          }
        } else if (currentLobby && gameMode === 'team') {
          setTimeout(() => showMultiplayerResult(), 2000);
        } else {
          setTimeout(() => showVictory(), 2000);
        }
      } else if (data.session.status === 'failed') {
        if (currentLobby && data.lobby) currentLobby = data.lobby;
        if (currentLobby?.winner) {
          setTimeout(() => showMultiplayerResult(), 2000);
        } else {
          setTimeout(() => showGameOver(), 2000);
        }
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

  // ─── Stats Dashboard ─────────────────────────────────────────

  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        throw new Error(`Stats request failed: ${res.status}`);
      }
      cachedStats = await res.json();
      if (!cachedStats || !cachedStats.totals || !Array.isArray(cachedStats.byThemeAndRegion)) {
        throw new Error('Invalid stats payload');
      }
      renderStatsTotals(cachedStats.totals);
      renderStatsTable(cachedStats, statsView);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  window._switchStatsView = function (view) {
    statsView = view;
    $$('.stats-toggle-btn').forEach((b) => b.classList.remove('active'));
    $(`.stats-toggle-btn[data-view="${view}"]`).classList.add('active');
    if (cachedStats) renderStatsTable(cachedStats, view);
  };

  function renderStatsTotals(totals) {
    const container = $('#stats-totals');
    const escapeRate = totals.attempted > 0
      ? Math.round((totals.escaped / totals.attempted) * 100)
      : 0;

    container.innerHTML = `
      <div class="stats-total-card">
        <div class="stats-total-value">${totals.attempted.toLocaleString()}</div>
        <div class="stats-total-label">Total Attempts</div>
      </div>
      <div class="stats-total-card success">
        <div class="stats-total-value">${totals.escaped.toLocaleString()}</div>
        <div class="stats-total-label">Escaped</div>
      </div>
      <div class="stats-total-card danger">
        <div class="stats-total-value">${totals.failed.toLocaleString()}</div>
        <div class="stats-total-label">Failed</div>
      </div>
      <div class="stats-total-card accent">
        <div class="stats-total-value">${escapeRate}%</div>
        <div class="stats-total-label">Escape Rate</div>
      </div>
    `;
  }

  function renderStatsTable(stats, view) {
    const thead = $('#stats-thead');
    const tbody = $('#stats-tbody');

    const themeNames = {
      'indiana-jones': '🏺 Indiana Jones',
      'harry-potter': '⚡ Harry Potter',
      'clippyland': '📎 ClippyLand',
    };

    const regionIcons = {
      'North America': '🌎',
      'Europe': '🌍',
      'Asia Pacific': '🌏',
      'Latin America': '🌎',
      'Middle East & Africa': '🌍',
    };

    if (view === 'theme') {
      // Group by theme
      const byTheme = {};
      stats.byThemeAndRegion.forEach((s) => {
        if (!byTheme[s.themeId]) byTheme[s.themeId] = { attempted: 0, escaped: 0, failed: 0 };
        byTheme[s.themeId].attempted += s.attempted;
        byTheme[s.themeId].escaped += s.escaped;
        byTheme[s.themeId].failed += s.failed;
      });

      thead.innerHTML = `<tr><th>Game</th><th>Attempted</th><th>Escaped</th><th>Failed</th><th>Escape Rate</th></tr>`;
      tbody.innerHTML = Object.entries(byTheme)
        .sort((a, b) => b[1].attempted - a[1].attempted)
        .map(([id, d]) => {
          const rate = d.attempted > 0 ? Math.round((d.escaped / d.attempted) * 100) : 0;
          const barWidth = rate;
          return `<tr>
            <td class="stats-name">${themeNames[id] || id}</td>
            <td>${d.attempted.toLocaleString()}</td>
            <td class="stat-esc">${d.escaped.toLocaleString()}</td>
            <td class="stat-fail">${d.failed.toLocaleString()}</td>
            <td>
              <div class="stats-rate-bar">
                <div class="stats-rate-fill" style="width:${barWidth}%"></div>
                <span class="stats-rate-label">${rate}%</span>
              </div>
            </td>
          </tr>`;
        })
        .join('');
    } else {
      // Group by region
      const byRegion = {};
      stats.byThemeAndRegion.forEach((s) => {
        if (!byRegion[s.region]) byRegion[s.region] = { attempted: 0, escaped: 0, failed: 0 };
        byRegion[s.region].attempted += s.attempted;
        byRegion[s.region].escaped += s.escaped;
        byRegion[s.region].failed += s.failed;
      });

      thead.innerHTML = `<tr><th>Region</th><th>Attempted</th><th>Escaped</th><th>Failed</th><th>Escape Rate</th></tr>`;
      tbody.innerHTML = Object.entries(byRegion)
        .sort((a, b) => b[1].attempted - a[1].attempted)
        .map(([region, d]) => {
          const rate = d.attempted > 0 ? Math.round((d.escaped / d.attempted) * 100) : 0;
          const icon = regionIcons[region] || '🌐';
          return `<tr>
            <td class="stats-name">${icon} ${region}</td>
            <td>${d.attempted.toLocaleString()}</td>
            <td class="stat-esc">${d.escaped.toLocaleString()}</td>
            <td class="stat-fail">${d.failed.toLocaleString()}</td>
            <td>
              <div class="stats-rate-bar">
                <div class="stats-rate-fill" style="width:${rate}%"></div>
                <span class="stats-rate-label">${rate}%</span>
              </div>
            </td>
          </tr>`;
        })
        .join('');
    }
  }

  // ─── Boot ───────────────────────────────────────────────────
  init();
})();
