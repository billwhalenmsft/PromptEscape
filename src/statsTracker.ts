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
// On Azure App Service the /home directory is persistent across restarts.
// Locally we fall back to a file in the project root.
const STATS_DIR = process.env.HOME
  ? path.join(process.env.HOME, 'data')
  : path.join(__dirname, '..', 'data');
const STATS_FILE = path.join(STATS_DIR, 'stats.json');

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
      const entries: ThemeRegionStats[] = JSON.parse(raw);
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
    if (!fs.existsSync(STATS_DIR)) {
      fs.mkdirSync(STATS_DIR, { recursive: true });
    }
    const entries = Array.from(stats.values());
    fs.writeFileSync(STATS_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Stats] Failed to save stats to disk:', err);
  }
}

// Load persisted stats on module init
loadFromDisk();

// ─── Tracking functions ─────────────────────────────────────────

export function recordAttempt(themeId: ThemeId, region: string): void {
  getOrCreate(themeId, region).attempted++;
  saveToDisk();
}

export function recordEscape(themeId: ThemeId, region: string): void {
  getOrCreate(themeId, region).escaped++;
  saveToDisk();
}

export function recordFailure(themeId: ThemeId, region: string): void {
  getOrCreate(themeId, region).failed++;
  saveToDisk();
}

// ─── Query ──────────────────────────────────────────────────────

export function getStats(): StatsSnapshot {
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
