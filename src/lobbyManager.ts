import { Lobby, Player, GameMode, ThemeId, TeamSide, GameSession } from './types';
import { v4Fallback as generateId } from './utils';

// ─── In-memory lobby store ──────────────────────────────────────
const lobbies = new Map<string, Lobby>();

// Max players per mode
const MAX_PLAYERS: Record<GameMode, number> = {
  solo: 1,
  team: 4,
  versus: 8,
};

// ─── Generate a short lobby code ────────────────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure uniqueness
  if (lobbies.has(code)) return generateCode();
  return code;
}

// ─── Create a lobby ─────────────────────────────────────────────
export function createLobby(
  mode: GameMode,
  hostName: string,
  themeId?: ThemeId
): { lobby: Lobby; player: Player } {
  const code = generateCode();
  const player: Player = {
    id: generateId(),
    name: hostName,
    team: mode === 'versus' ? 'A' : undefined,
  };

  const lobby: Lobby = {
    code,
    mode,
    themeId,
    hostId: player.id,
    players: [player],
    status: 'waiting',
    createdAt: Date.now(),
    sessionIds: [],
  };

  lobbies.set(code, lobby);
  return { lobby, player };
}

// ─── Join a lobby ───────────────────────────────────────────────
export function joinLobby(
  code: string,
  playerName: string,
  preferredTeam?: TeamSide
): { lobby: Lobby; player: Player } {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) throw new Error('Lobby not found');
  if (lobby.status !== 'waiting') throw new Error('Game already started');
  if (lobby.players.length >= MAX_PLAYERS[lobby.mode]) throw new Error('Lobby is full');

  // For versus mode, auto-balance teams if no preference
  let team: TeamSide | undefined;
  if (lobby.mode === 'versus') {
    const teamACount = lobby.players.filter((p) => p.team === 'A').length;
    const teamBCount = lobby.players.filter((p) => p.team === 'B').length;
    if (preferredTeam && canJoinTeam(lobby, preferredTeam)) {
      team = preferredTeam;
    } else {
      team = teamACount <= teamBCount ? 'A' : 'B';
    }
  }

  const player: Player = {
    id: generateId(),
    name: playerName,
    team,
  };

  lobby.players.push(player);
  return { lobby, player };
}

function canJoinTeam(lobby: Lobby, team: TeamSide): boolean {
  const maxPerTeam = MAX_PLAYERS[lobby.mode] / 2; // 4 per team
  const count = lobby.players.filter((p) => p.team === team).length;
  return count < maxPerTeam;
}

// ─── Switch team (versus mode) ──────────────────────────────────
export function switchTeam(code: string, playerId: string): Lobby {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) throw new Error('Lobby not found');
  if (lobby.mode !== 'versus') throw new Error('Team switching only in versus mode');
  if (lobby.status !== 'waiting') throw new Error('Game already started');

  const player = lobby.players.find((p) => p.id === playerId);
  if (!player) throw new Error('Player not found');

  const newTeam: TeamSide = player.team === 'A' ? 'B' : 'A';
  if (!canJoinTeam(lobby, newTeam)) throw new Error('Other team is full');

  player.team = newTeam;
  return lobby;
}

// ─── Set theme ──────────────────────────────────────────────────
export function setLobbyTheme(code: string, playerId: string, themeId: ThemeId): Lobby {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) throw new Error('Lobby not found');
  if (lobby.hostId !== playerId) throw new Error('Only the host can change the theme');
  if (lobby.status !== 'waiting') throw new Error('Game already started');

  lobby.themeId = themeId;
  return lobby;
}

// ─── Start game ─────────────────────────────────────────────────
export function startLobbyGame(code: string, playerId: string): Lobby {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) throw new Error('Lobby not found');
  if (lobby.hostId !== playerId) throw new Error('Only the host can start the game');
  if (lobby.status !== 'waiting') throw new Error('Game already started');
  if (!lobby.themeId) throw new Error('Select a theme first');

  // Versus mode: need at least 1 player per team
  if (lobby.mode === 'versus') {
    const teamA = lobby.players.filter((p) => p.team === 'A');
    const teamB = lobby.players.filter((p) => p.team === 'B');
    if (teamA.length === 0 || teamB.length === 0) {
      throw new Error('Each team needs at least one player');
    }
  }

  lobby.status = 'playing';
  return lobby;
}

// ─── Record session IDs ─────────────────────────────────────────
export function setLobbySessionIds(code: string, sessionIds: string[]): void {
  const lobby = lobbies.get(code.toUpperCase());
  if (lobby) lobby.sessionIds = sessionIds;
}

// ─── Set winner (versus mode) ───────────────────────────────────
export function setLobbyWinner(code: string, winner: TeamSide | 'tie'): void {
  const lobby = lobbies.get(code.toUpperCase());
  if (lobby) {
    lobby.winner = winner;
    lobby.status = 'finished';
  }
}

// ─── Get lobby ──────────────────────────────────────────────────
export function getLobby(code: string): Lobby | undefined {
  return lobbies.get(code.toUpperCase());
}

// ─── Leave lobby ────────────────────────────────────────────────
export function leaveLobby(code: string, playerId: string): Lobby | null {
  const lobby = lobbies.get(code.toUpperCase());
  if (!lobby) return null;

  lobby.players = lobby.players.filter((p) => p.id !== playerId);

  // If host left, assign new host or destroy lobby
  if (lobby.hostId === playerId) {
    if (lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].id;
    } else {
      lobbies.delete(code.toUpperCase());
      return null;
    }
  }

  return lobby;
}

// ─── Cleanup old lobbies (every 30 min) ─────────────────────────
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [code, lobby] of lobbies) {
    if (lobby.createdAt < cutoff && lobby.status !== 'playing') {
      lobbies.delete(code);
    }
  }
}, 5 * 60 * 1000);
