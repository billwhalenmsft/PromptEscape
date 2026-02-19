import express, { Request } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { startGame, submitPrompt, getHint, getCurrentRoom, getSession, incrementAttempt } from './gameEngine';
import { getAllThemes } from './themes';
import { getWorkIQHintForRoom } from './services/workiqService';
import { recordAttempt, recordEscape, recordFailure, getStats } from './statsTracker';
import { ThemeId, TeamSide, GameMode } from './types';
import {
  createLobby, joinLobby, getLobby, startLobbyGame,
  setLobbyTheme, switchTeam, leaveLobby,
  setLobbySessionIds, setLobbyWinner,
} from './lobbyManager';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Region Detection ───────────────────────────────────────────
// Maps session IDs to their detected region so we can attribute
// escape/failure outcomes to the region recorded at game start.
const sessionRegions = new Map<string, string>();

function detectRegion(req: Request): string {
  // Check common geo headers (set by Azure, Cloudflare, etc.)
  const geoHeader =
    (req.headers['x-azure-region'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-country-code'] as string);

  if (geoHeader) {
    return mapCountryToRegion(geoHeader);
  }

  // Fallback: parse Accept-Language for a rough region guess
  const lang = (req.headers['accept-language'] || '').toLowerCase();
  if (lang.startsWith('en-us') || lang.startsWith('en-ca') || lang.startsWith('fr-ca')) return 'North America';
  if (lang.startsWith('es-') || lang.startsWith('pt-br')) return 'Latin America';
  if (lang.startsWith('ja') || lang.startsWith('zh') || lang.startsWith('ko')) return 'Asia Pacific';
  if (lang.startsWith('ar') || lang.startsWith('he') || lang.startsWith('fa')) return 'Middle East & Africa';
  if (/^(en-gb|de|fr|it|nl|pl|sv|da|nb|fi|cs|sk|hu|ro|bg|el|pt-pt)/.test(lang)) return 'Europe';

  return 'North America'; // default
}

function mapCountryToRegion(code: string): string {
  const c = code.toUpperCase();
  const NA = ['US', 'CA', 'MX'];
  const LATAM = ['BR', 'AR', 'CL', 'CO', 'PE', 'VE'];
  const APAC = ['JP', 'CN', 'KR', 'AU', 'NZ', 'IN', 'SG', 'TH', 'VN', 'PH', 'ID', 'MY'];
  const MEA = ['SA', 'AE', 'ZA', 'NG', 'EG', 'IL', 'KE'];
  if (NA.includes(c)) return 'North America';
  if (LATAM.includes(c)) return 'Latin America';
  if (APAC.includes(c)) return 'Asia Pacific';
  if (MEA.includes(c)) return 'Middle East & Africa';
  return 'Europe';
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────────────

// Get all available themes
app.get('/api/themes', (_req, res) => {
  const themes = getAllThemes();
  res.json({ themes });
});

// Start a new game
app.post('/api/game/start', (req, res) => {
  try {
    const { themeId } = req.body;
    if (!themeId) return res.status(400).json({ error: 'themeId is required' });

    const result = startGame(themeId);

    // Track stats
    const region = detectRegion(req);
    sessionRegions.set(result.session.id, region);
    recordAttempt(themeId as ThemeId, region);

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Submit a prompt for the current room
app.post('/api/game/submit', (req, res) => {
  try {
    const { sessionId, prompt } = req.body;
    if (!sessionId || !prompt) {
      return res.status(400).json({ error: 'sessionId and prompt are required' });
    }

    // Track attempts
    const room = getCurrentRoom(sessionId);
    if (room) incrementAttempt(sessionId, room.id);

    const result = submitPrompt(sessionId, prompt);

    // Track escape / failure outcomes
    const region = sessionRegions.get(sessionId) || detectRegion(req);
    if (result.session.status === 'escaped') {
      recordEscape(result.session.themeId as ThemeId, region);
      sessionRegions.delete(sessionId);
    } else if (result.session.status === 'failed') {
      recordFailure(result.session.themeId as ThemeId, region);
      sessionRegions.delete(sessionId);
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get a hint
app.post('/api/game/hint', (req, res) => {
  try {
    const { sessionId, useWorkIQ } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const room = getCurrentRoom(sessionId);
    if (!room) return res.status(404).json({ error: 'No current room found' });

    if (useWorkIQ) {
      const workiqHint = getWorkIQHintForRoom(room.id);
      res.json({
        hint: workiqHint.hint,
        context: workiqHint.context,
        source: 'workiq',
        hintsRemaining: 0,
      });
    } else {
      const result = getHint(sessionId);
      res.json({ ...result, source: 'builtin' });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get global stats by theme & region
app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

// Get current session state
app.get('/api/game/session/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const room = getCurrentRoom(req.params.id);
  res.json({ session, room });
});

// ─── Lobby / Multiplayer Routes ─────────────────────────────────

// Create a lobby
app.post('/api/lobby/create', (req, res) => {
  try {
    const { mode, hostName, themeId } = req.body;
    if (!mode || !hostName) return res.status(400).json({ error: 'mode and hostName are required' });
    const result = createLobby(mode as GameMode, hostName, themeId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Join a lobby
app.post('/api/lobby/join', (req, res) => {
  try {
    const { code, playerName, preferredTeam } = req.body;
    if (!code || !playerName) return res.status(400).json({ error: 'code and playerName are required' });
    const result = joinLobby(code, playerName, preferredTeam);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get lobby state (polled by clients)
app.get('/api/lobby/:code', (req, res) => {
  const lobby = getLobby(req.params.code);
  if (!lobby) return res.status(404).json({ error: 'Lobby not found' });

  // If playing, include session states
  if (lobby.status === 'playing' || lobby.status === 'finished') {
    const sessions = lobby.sessionIds.map((sid) => {
      const session = getSession(sid);
      const room = session ? getCurrentRoom(sid) : null;
      return { session, room };
    });
    return res.json({ lobby, sessions });
  }

  res.json({ lobby });
});

// Set theme (host only)
app.post('/api/lobby/:code/theme', (req, res) => {
  try {
    const { playerId, themeId } = req.body;
    const lobby = setLobbyTheme(req.params.code, playerId, themeId);
    res.json({ lobby });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Switch team (versus mode)
app.post('/api/lobby/:code/switch-team', (req, res) => {
  try {
    const { playerId } = req.body;
    const lobby = switchTeam(req.params.code, playerId);
    res.json({ lobby });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Leave lobby
app.post('/api/lobby/:code/leave', (req, res) => {
  try {
    const { playerId } = req.body;
    const lobby = leaveLobby(req.params.code, playerId);
    res.json({ lobby });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Start game from lobby (host only)
app.post('/api/lobby/:code/start', (req, res) => {
  try {
    const { playerId } = req.body;
    const lobby = startLobbyGame(req.params.code, playerId);

    const region = detectRegion(req);

    if (lobby.mode === 'team') {
      // One shared session for team mode
      const result = startGame(lobby.themeId!, lobby.code);
      setLobbySessionIds(lobby.code, [result.session.id]);
      sessionRegions.set(result.session.id, region);
      recordAttempt(lobby.themeId! as ThemeId, region);
      res.json({ lobby, sessions: [result] });
    } else if (lobby.mode === 'versus') {
      // Two sessions: one per team
      const teamA = startGame(lobby.themeId!, lobby.code, 'A');
      const teamB = startGame(lobby.themeId!, lobby.code, 'B');
      setLobbySessionIds(lobby.code, [teamA.session.id, teamB.session.id]);
      sessionRegions.set(teamA.session.id, region);
      sessionRegions.set(teamB.session.id, region);
      recordAttempt(lobby.themeId! as ThemeId, region);
      res.json({ lobby, sessions: [teamA, teamB] });
    } else {
      res.status(400).json({ error: 'Use /api/game/start for solo mode' });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Submit prompt in multiplayer context
app.post('/api/lobby/:code/submit', (req, res) => {
  try {
    const { sessionId, prompt, playerId, playerName } = req.body;
    if (!sessionId || !prompt) return res.status(400).json({ error: 'sessionId and prompt are required' });

    const lobby = getLobby(req.params.code);
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });

    // Track attempts
    const room = getCurrentRoom(sessionId);
    if (room) incrementAttempt(sessionId, room.id);

    const result = submitPrompt(sessionId, prompt, playerName);

    // Track escape / failure outcomes
    const region = sessionRegions.get(sessionId) || detectRegion(req);
    if (result.session.status === 'escaped') {
      recordEscape(result.session.themeId as ThemeId, region);
      sessionRegions.delete(sessionId);

      // In versus mode, check if this team won
      if (lobby.mode === 'versus') {
        const otherSessionId = lobby.sessionIds.find((id) => id !== sessionId);
        const otherSession = otherSessionId ? getSession(otherSessionId) : undefined;
        if (otherSession?.status === 'escaped') {
          // Both escaped — higher score wins
          const winner = result.session.totalScore > otherSession.totalScore
            ? result.session.teamSide!
            : result.session.totalScore < otherSession.totalScore
              ? otherSession.teamSide!
              : 'tie';
          setLobbyWinner(lobby.code, winner);
        } else if (otherSession?.status === 'failed') {
          setLobbyWinner(lobby.code, result.session.teamSide!);
        }
        // else other team still playing — this team is ahead
      }
    } else if (result.session.status === 'failed') {
      recordFailure(result.session.themeId as ThemeId, region);
      sessionRegions.delete(sessionId);

      if (lobby.mode === 'versus') {
        const otherSessionId = lobby.sessionIds.find((id) => id !== sessionId);
        const otherSession = otherSessionId ? getSession(otherSessionId) : undefined;
        if (otherSession?.status === 'escaped') {
          setLobbyWinner(lobby.code, otherSession.teamSide!);
        } else if (otherSession?.status === 'failed') {
          setLobbyWinner(lobby.code, 'tie');
        }
      }
    }

    // Return the lobby state along with result for multiplayer context
    const updatedLobby = getLobby(req.params.code);
    res.json({ ...result, lobby: updatedLobby });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Serve the app ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🔓 PROMPT ESCAPE — The AI Escape Room          ║
║                                                  ║
║   Server running at http://localhost:${PORT}        ║
║                                                  ║
║   Choose your theme:                             ║
║     🏺 Indiana Jones — Temple of the Lost Prompt ║
║     ⚡ Harry Potter — The Hogwarts Escape        ║
║     📎 ClippyLand — Escape from the Office       ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});
