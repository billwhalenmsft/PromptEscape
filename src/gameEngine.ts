import { GameSession, Theme, Room, EvaluationResult, CompletedRoom } from './types';
import { evaluatePrompt } from './promptEvaluator';
import { getTheme } from './themes';
import { v4Fallback as generateId } from './utils';

// ─── In-memory session store ────────────────────────────────────
const sessions = new Map<string, GameSession>();
const sessionTimers = new Map<string, number>(); // roomId → room start time

// ─── Start a new game ───────────────────────────────────────────
export function startGame(themeId: string): { session: GameSession; room: Room; theme: Theme } {
  const theme = getTheme(themeId);
  if (!theme) throw new Error(`Unknown theme: ${themeId}`);

  const session: GameSession = {
    id: generateId(),
    themeId: theme.id,
    currentRoomIndex: 0,
    startedAt: Date.now(),
    completedRooms: [],
    totalScore: 0,
    status: 'playing',
  };

  sessions.set(session.id, session);
  sessionTimers.set(session.id, Date.now());

  return { session, room: theme.rooms[0], theme };
}

// ─── Submit a prompt for the current room ───────────────────────
export function submitPrompt(
  sessionId: string,
  prompt: string
): { evaluation: EvaluationResult; session: GameSession; nextRoom?: Room } {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'playing') throw new Error('Game is already over');

  const theme = getTheme(session.themeId)!;
  const currentRoom = theme.rooms[session.currentRoomIndex];
  const attemptNumber = getAttemptCount(session, currentRoom.id) + 1;

  const evaluation = evaluatePrompt(prompt, currentRoom.puzzle, attemptNumber);

  if (evaluation.passed) {
    const roomStart = sessionTimers.get(sessionId) || Date.now();
    const completed: CompletedRoom = {
      roomId: currentRoom.id,
      score: evaluation.score,
      attempts: attemptNumber,
      timeSpent: Date.now() - roomStart,
      promptUsed: prompt,
    };

    session.completedRooms.push(completed);
    session.totalScore += evaluation.score;
    session.currentRoomIndex++;

    if (session.currentRoomIndex >= theme.rooms.length) {
      session.status = 'escaped';
      sessions.set(sessionId, session);
      return { evaluation, session };
    }

    sessionTimers.set(sessionId, Date.now());
    const nextRoom = theme.rooms[session.currentRoomIndex];
    sessions.set(sessionId, session);
    return { evaluation, session, nextRoom };
  }

  // Failed attempt — check if out of attempts
  if (attemptNumber >= currentRoom.puzzle.maxAttempts) {
    session.status = 'failed';
  }

  sessions.set(sessionId, session);
  return { evaluation, session };
}

// ─── Get hint for current room ──────────────────────────────────
export function getHint(sessionId: string): { hint: string; hintsRemaining: number } {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const theme = getTheme(session.themeId)!;
  const currentRoom = theme.rooms[session.currentRoomIndex];
  const attemptCount = getAttemptCount(session, currentRoom.id);

  // Reveal hints progressively based on attempts
  const hintIndex = Math.min(attemptCount, currentRoom.hints.length - 1);
  const hint = currentRoom.hints[hintIndex] || currentRoom.puzzle.solutionHint;
  const hintsRemaining = Math.max(0, currentRoom.hints.length - hintIndex - 1);

  return { hint, hintsRemaining };
}

// ─── Get current room for session ───────────────────────────────
export function getCurrentRoom(sessionId: string): Room | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const theme = getTheme(session.themeId);
  if (!theme) return null;
  return theme.rooms[session.currentRoomIndex] || null;
}

export function getSession(sessionId: string): GameSession | undefined {
  return sessions.get(sessionId);
}

// ─── Helpers ────────────────────────────────────────────────────
function getAttemptCount(session: GameSession, roomId: string): number {
  // Count completed rooms with same id (0 if not completed yet)
  // For tracking current room attempts we need a separate counter
  return (session as any).__attempts?.[roomId] || 0;
}

// Track attempts (extend session in-memory)
export function incrementAttempt(sessionId: string, roomId: string): void {
  const session = sessions.get(sessionId) as any;
  if (!session) return;
  if (!session.__attempts) session.__attempts = {};
  session.__attempts[roomId] = (session.__attempts[roomId] || 0) + 1;
}
