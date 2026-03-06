import { ThemeId } from './types';
import fs from 'fs';
import path from 'path';

// ─── Stats Types ────────────────────────────────────────────────

export interface ThemeRegionStats {
  themeId: ThemeId;
  region: string;
  attempted: number;
  escaped: number;
  failed: number;
}

export interface StatsSnapshot {
  byThemeAndRegion: ThemeRegionStats[];
  totals: {
    attempted: number;
    escaped: number;
    failed: number;
  };
}

// ─── Persistent file path ───────────────────────────────────────
// Priority order:
// 1) Explicit STATS_DIR env override
// 2) Azure App Service HOME/data (persists across restarts/upgrades)
// 3) Workspace-local data directory
const STATS_FILE_NAME = 'stats.json';

function resolveStatsDir(): string {
  const candidates = [
    process.env.STATS_DIR,
    process.env.HOME ? path.join(process.env.HOME, 'data') : undefined,
    path.join(process.cwd(), 'data'),
    path.join(__dirname, '..', 'data'),
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      continue;
    }
  }

  throw new Error('[Stats] Could not resolve writable stats directory');
}

const STATS_DIR = resolveStatsDir();
const STATS_FILE = path.join(STATS_DIR, STATS_FILE_NAME);

// ─── In-memory stats store ──────────────────────────────────────
// Key format: "themeId::region"
const stats = new Map<string, ThemeRegionStats>();

function key(themeId: ThemeId, region: string): string {
  return `${themeId}::${region}`;
}

function getOrCreate(themeId: ThemeId, region: string): ThemeRegionStats {
  const k = key(themeId, region);
  if (!stats.has(k)) {
    stats.set(k, { themeId, region, attempted: 0, escaped: 0, failed: 0 });
  }
  return stats.get(k)!;
}

// ─── File persistence helpers ───────────────────────────────────

function loadFromDisk(): void {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const raw = fs.readFileSync(STATS_FILE, 'utf-8');
      const entries = JSON.parse(raw) as ThemeRegionStats[];
      for (const entry of entries) {
        const k = key(entry.themeId, entry.region);
        stats.set(k, entry);
      }
      console.log(`[Stats] Loaded ${entries.length} stat entries from disk`);
    } else {
      console.log('[Stats] No saved stats found — starting fresh');
    }
  } catch (err) {
    console.error('[Stats] Failed to load stats from disk:', err);
  }
}

function saveToDisk(): void {
  try {
    const entries = Array.from(stats.values());
    const tmpFile = `${STATS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(entries, null, 2), 'utf-8');
    fs.renameSync(tmpFile, STATS_FILE);
  } catch (err) {
    console.error('[Stats] Failed to save stats to disk:', err);
  }
}

function mergeFromDisk(): void {
  try {
    if (!fs.existsSync(STATS_FILE)) return;
    const raw = fs.readFileSync(STATS_FILE, 'utf-8');
    const diskEntries = JSON.parse(raw) as ThemeRegionStats[];

    for (const diskEntry of diskEntries) {
      const existing = getOrCreate(diskEntry.themeId, diskEntry.region);
      existing.attempted = Math.max(existing.attempted, diskEntry.attempted || 0);
      existing.escaped = Math.max(existing.escaped, diskEntry.escaped || 0);
      existing.failed = Math.max(existing.failed, diskEntry.failed || 0);
    }
  } catch (err) {
    console.error('[Stats] Failed to merge stats from disk:', err);
  }
}

// Load persisted stats on module init
loadFromDisk();

// ─── Tracking functions ─────────────────────────────────────────

export function recordAttempt(themeId: ThemeId, region: string): void {
  mergeFromDisk();
  getOrCreate(themeId, region).attempted++;
  saveToDisk();
}

export function recordEscape(themeId: ThemeId, region: string): void {
  mergeFromDisk();
  getOrCreate(themeId, region).escaped++;
  saveToDisk();
}

export function recordFailure(themeId: ThemeId, region: string): void {
  mergeFromDisk();
  getOrCreate(themeId, region).failed++;
  saveToDisk();
}

// ─── Query ──────────────────────────────────────────────────────

export function getStats(): StatsSnapshot {
  mergeFromDisk();
  const entries = Array.from(stats.values());

  const totals = entries.reduce(
    (acc, s) => ({
      attempted: acc.attempted + s.attempted,
      escaped: acc.escaped + s.escaped,
      failed: acc.failed + s.failed,
    }),
    { attempted: 0, escaped: 0, failed: 0 }
  );

  return {
    byThemeAndRegion: entries.sort((a, b) => b.attempted - a.attempted),
    totals,
  };
}
