import { Puzzle, EvaluationResult } from './types';

// ─── Prompt Evaluator ───────────────────────────────────────────
// Scores a player's prompt against a room's puzzle requirements.
// No external AI needed — uses keyword matching, heuristics, and
// creativity scoring to evaluate prompt quality.

export function evaluatePrompt(
  prompt: string,
  puzzle: Puzzle,
  attemptNumber: number
): EvaluationResult {
  const normalizedPrompt = prompt.toLowerCase();
  const words = normalizedPrompt.split(/\s+/);

  // ── 1. Required concept matching ─────────────────────────────
  const matchedConcepts = puzzle.requiredConcepts.filter((concept) =>
    conceptMatches(normalizedPrompt, concept)
  );
  const missedConcepts = puzzle.requiredConcepts.filter(
    (concept) => !conceptMatches(normalizedPrompt, concept)
  );
  const bonusMatched = puzzle.bonusConcepts.filter((concept) =>
    conceptMatches(normalizedPrompt, concept)
  );

  // ── 2. Relevance score (0–100) ───────────────────────────────
  const requiredRatio = matchedConcepts.length / puzzle.requiredConcepts.length;
  const relevance = Math.round(requiredRatio * 100);

  // ── 3. Specificity score (0–100) ─────────────────────────────
  // Longer, more detailed prompts score higher (up to a point)
  const wordCount = words.length;
  const specificity = Math.min(100, Math.round((wordCount / 30) * 60) + (bonusMatched.length * 10));

  // ── 4. Creativity score (0–100) ──────────────────────────────
  const creativity = scoreCreativity(normalizedPrompt, puzzle);

  // ── 5. Overall score ─────────────────────────────────────────
  const score = Math.round(
    relevance * 0.4 +
    specificity * 0.3 +
    creativity * 0.3
  );

  // ── 6. Pass/Fail ─────────────────────────────────────────────
  // Threshold scales with difficulty: harder rooms need higher scores
  const passThreshold = getPassThreshold(puzzle.difficulty, attemptNumber);
  const passed = score >= passThreshold && matchedConcepts.length >= Math.ceil(puzzle.requiredConcepts.length * 0.6);

  // ── 7. Generate feedback ─────────────────────────────────────
  const feedback = generateFeedback(passed, score, matchedConcepts, missedConcepts, bonusMatched, creativity, specificity, relevance);

  return {
    passed,
    score,
    feedback,
    matchedConcepts,
    missedConcepts,
    bonusMatched,
    creativity,
    specificity,
    relevance,
  };
}

// ─── Concept Matching ───────────────────────────────────────────
// Fuzzy-ish matching: checks for the concept word, synonyms, and
// related terms within the prompt.

const SYNONYM_MAP: Record<string, string[]> = {
  'decipher': ['decode', 'interpret', 'read', 'crack', 'unlock', 'translate', 'understand'],
  'ancient': ['old', 'historic', 'archaeological', 'antique', 'ruin', 'civilization'],
  'translate': ['convert', 'interpret', 'decipher', 'decode', 'read', 'understand'],
  'symbols': ['glyphs', 'hieroglyphs', 'runes', 'inscriptions', 'characters', 'markings', 'signs'],
  'password': ['key', 'code', 'passphrase', 'secret', 'answer', 'combination'],
  'path': ['route', 'way', 'trail', 'passage', 'corridor', 'direction'],
  'safe': ['secure', 'protected', 'harmless', 'viable', 'clear'],
  'navigate': ['traverse', 'cross', 'move', 'travel', 'walk', 'proceed'],
  'avoid': ['dodge', 'evade', 'bypass', 'circumvent', 'steer clear', 'miss'],
  'hazard': ['danger', 'threat', 'risk', 'obstacle', 'trap', 'peril', 'snake'],
  'weight': ['mass', 'heavy', 'grams', 'pounds', 'kilograms', 'load'],
  'swap': ['switch', 'exchange', 'replace', 'substitute', 'trade'],
  'pressure': ['force', 'tension', 'load', 'plate', 'sensor', 'sensitive'],
  'timing': ['speed', 'quick', 'fast', 'moment', 'instant', 'synchron'],
  'calculate': ['compute', 'determine', 'figure', 'estimate', 'measure', 'math'],
  'decision': ['choose', 'pick', 'select', 'decide', 'determine', 'judge'],
  'analyze': ['examine', 'inspect', 'study', 'assess', 'evaluate', 'investigate', 'review'],
  'clues': ['hints', 'evidence', 'signs', 'indicators', 'signals', 'cues'],
  'escape': ['exit', 'flee', 'leave', 'break free', 'get out', 'run'],
  'logic': ['reason', 'deduc', 'rational', 'logical', 'think', 'systematic'],
  'deduce': ['reason', 'figure out', 'conclude', 'infer', 'determine', 'work out'],
  'constraints': ['rules', 'conditions', 'limitations', 'parameters', 'requirements'],
  'eliminate': ['remove', 'rule out', 'exclude', 'discard', 'narrow'],
  'solve': ['resolve', 'answer', 'crack', 'figure out', 'work out', 'unravel'],
  'strategy': ['plan', 'approach', 'tactic', 'method', 'scheme', 'blueprint'],
  'weakness': ['vulnerable', 'flaw', 'achilles', 'weak point', 'susceptible'],
  'attack': ['strike', 'fight', 'combat', 'confront', 'battle', 'engage'],
  'plan': ['strategy', 'approach', 'design', 'outline', 'blueprint', 'map out'],
  'pattern': ['sequence', 'cycle', 'repetition', 'rhythm', 'regularity', 'trend'],
  'predict': ['forecast', 'anticipate', 'foresee', 'expect', 'project', 'estimate'],
  'search': ['find', 'locate', 'discover', 'seek', 'hunt', 'scan', 'look'],
  'changing': ['dynamic', 'shifting', 'evolving', 'transforming', 'morphing', 'moving'],
  'find': ['locate', 'discover', 'identify', 'spot', 'detect', 'uncover'],
  'debug': ['fix', 'troubleshoot', 'diagnose', 'repair', 'trace', 'investigate'],
  'error': ['bug', 'fault', 'crash', 'issue', 'problem', 'failure', 'exception'],
  'fix': ['repair', 'resolve', 'patch', 'correct', 'restore', 'remedy'],
  'system': ['computer', 'machine', 'os', 'windows', 'software', 'program'],
  'persuade': ['convince', 'argue', 'compel', 'influence', 'talk', 'reason with'],
  'negotiate': ['bargain', 'discuss', 'deal', 'compromise', 'broker'],
  'loophole': ['exploit', 'workaround', 'trick', 'bypass', 'hack', 'flaw'],
  'help': ['assist', 'aid', 'support', 'guide', 'service'],
  'assistant': ['helper', 'bot', 'clippy', 'agent', 'ai'],
  'formula': ['function', 'equation', 'expression', 'calculation', 'macro'],
  'cell': ['row', 'column', 'grid', 'sheet', 'range'],
  'reference': ['pointer', 'link', 'address', 'lookup', 'ref'],
  'end': ['finish', 'close', 'wrap up', 'conclude', 'terminate', 'stop'],
  'meeting': ['call', 'session', 'conference', 'gathering', 'standup'],
  'summary': ['recap', 'overview', 'review', 'synopsis', 'brief'],
  'action': ['task', 'todo', 'next step', 'follow-up', 'assignment'],
  'conclude': ['wrap up', 'finish', 'end', 'close', 'finalize', 'complete'],
  'preference': ['choice', 'favorite', 'taste', 'inclination', 'tendency'],
  'generate': ['create', 'produce', 'come up with', 'suggest', 'brainstorm'],
};

function conceptMatches(prompt: string, concept: string): boolean {
  // Direct match
  if (prompt.includes(concept)) return true;

  // Synonym match
  const synonyms = SYNONYM_MAP[concept] || [];
  return synonyms.some((syn) => prompt.includes(syn));
}

// ─── Creativity Scoring ─────────────────────────────────────────
function scoreCreativity(prompt: string, puzzle: Puzzle): number {
  let score = 30; // base score

  // Step-by-step thinking
  if (/step\s*[1-9]|first.*then|phase|stage/i.test(prompt)) score += 15;

  // Asks for structured output
  if (/list|table|json|format|output|return/i.test(prompt)) score += 10;

  // Uses constraints or conditions
  if (/if |when |unless|assuming|given that|considering/i.test(prompt)) score += 10;

  // Uses role-play / persona
  if (/you are|act as|imagine|pretend|role|expert/i.test(prompt)) score += 15;

  // Asks for reasoning / explanation
  if (/explain|why|reason|because|justify|show your work/i.test(prompt)) score += 10;

  // Specific details / numbers
  if (/\d+|specific|exact|precise|detail/i.test(prompt)) score += 10;

  // Length bonus (more detailed = more creative, up to a point)
  const words = prompt.split(/\s+/).length;
  if (words > 20) score += 5;
  if (words > 40) score += 5;

  return Math.min(100, score);
}

// ─── Pass Threshold ─────────────────────────────────────────────
function getPassThreshold(difficulty: number, attemptNumber: number): number {
  const base = 35 + (difficulty * 8); // 43, 51, 59, 67
  // Lower threshold slightly with each attempt (mercy rule)
  const mercy = Math.min((attemptNumber - 1) * 5, 15);
  return base - mercy;
}

// ─── Feedback Generator ─────────────────────────────────────────
function generateFeedback(
  passed: boolean,
  score: number,
  matched: string[],
  missed: string[],
  bonus: string[],
  creativity: number,
  specificity: number,
  relevance: number
): string {
  if (passed) {
    if (score >= 85) return '🌟 Masterful prompt! You demonstrated expert-level prompt engineering. The lock clicks open effortlessly!';
    if (score >= 70) return '✨ Great prompt! Your approach was creative and covered the key concepts. The mechanism responds!';
    if (score >= 55) return '👍 Good enough! You hit the essential points. The door creaks open reluctantly...';
    return '😅 Barely made it! But a pass is a pass. Quick, through the door!';
  }

  const tips: string[] = [];

  if (relevance < 50) {
    tips.push(`Your prompt is missing key concepts. Think about: ${missed.slice(0, 2).join(', ')}.`);
  }
  if (specificity < 40) {
    tips.push('Your prompt is too vague. Add more specific details and instructions.');
  }
  if (creativity < 40) {
    tips.push('Try structuring your prompt better — use step-by-step instructions, role-play, or constraints.');
  }
  if (missed.length > 0 && relevance >= 50) {
    tips.push(`Close! But you missed: ${missed.slice(0, 2).join(', ')}. Try incorporating those ideas.`);
  }

  const base = score < 30
    ? '❌ The puzzle doesn\'t respond. Your prompt needs more work.'
    : '⚠️ Almost! The mechanism whirs but doesn\'t unlock.';

  return `${base}\n${tips.join(' ')}`;
}
