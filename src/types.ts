// ─── Core Game Types ─────────────────────────────────────────────

export type ThemeId = 'indiana-jones' | 'harry-potter' | 'clippyland';

export interface Theme {
  id: ThemeId;
  name: string;
  tagline: string;
  icon: string;           // emoji
  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  description: string;       // narrative shown to the player
  visualDescription: string; // used by CSS to render the scene
  puzzle: Puzzle;
  hints: string[];
  successMessage: string;
  failureMessage: string;
}

export interface Puzzle {
  challenge: string;              // the prompt challenge text
  requiredConcepts: string[];     // keywords/ideas the prompt must touch
  bonusConcepts: string[];        // extra keywords for bonus points
  solutionHint: string;           // vague hint about what a good prompt looks like
  difficulty: 1 | 2 | 3 | 4;     // 1 = easy, 4 = boss-level
  maxAttempts: number;
}

// ─── Prompt Evaluation ──────────────────────────────────────────

export interface PromptSubmission {
  roomId: string;
  themeId: ThemeId;
  prompt: string;
  attemptNumber: number;
}

export interface EvaluationResult {
  passed: boolean;
  score: number;            // 0–100
  feedback: string;         // narrative feedback
  matchedConcepts: string[];
  missedConcepts: string[];
  bonusMatched: string[];
  creativity: number;       // 0–100
  specificity: number;      // 0–100
  relevance: number;        // 0–100
}

// ─── Game Session ───────────────────────────────────────────────

export interface GameSession {
  id: string;
  themeId: ThemeId;
  currentRoomIndex: number;
  startedAt: number;
  completedRooms: CompletedRoom[];
  totalScore: number;
  status: 'playing' | 'escaped' | 'failed';
}

export interface CompletedRoom {
  roomId: string;
  score: number;
  attempts: number;
  timeSpent: number;        // ms
  promptUsed: string;
}

// ─── API ────────────────────────────────────────────────────────

export interface StartGameRequest {
  themeId: ThemeId;
}

export interface StartGameResponse {
  session: GameSession;
  room: Room;
  theme: Theme;
}

export interface SubmitPromptRequest {
  sessionId: string;
  prompt: string;
}

export interface SubmitPromptResponse {
  evaluation: EvaluationResult;
  session: GameSession;
  nextRoom?: Room;          // if passed, the next room (or undefined if escaped)
}

export interface HintRequest {
  sessionId: string;
  useWorkIQ?: boolean;      // whether to fetch a WorkIQ-powered hint
}

export interface HintResponse {
  hint: string;
  source: 'builtin' | 'workiq';
  hintsRemaining: number;
}
