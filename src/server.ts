import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { startGame, submitPrompt, getHint, getCurrentRoom, getSession, incrementAttempt } from './gameEngine';
import { getAllThemes } from './themes';
import { getWorkIQHintForRoom } from './services/workiqService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Get current session state
app.get('/api/game/session/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const room = getCurrentRoom(req.params.id);
  res.json({ session, room });
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
