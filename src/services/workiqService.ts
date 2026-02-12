// ─── WorkIQ MCP Service ─────────────────────────────────────────
// Integrates with the WorkIQ MCP Server to generate contextual
// hints using M365 data (emails, meetings, calendar).
//
// In the hackathon demo, WorkIQ can:
// 1. Generate hints based on the player's meeting/email context
// 2. Create meeting-themed puzzles dynamically
// 3. Pull real calendar data to make ClippyLand's Teams meeting
//    room feel authentic

export interface WorkIQHint {
  hint: string;
  source: 'workiq';
  context?: string;
}

// These are the prompt templates we'd send to WorkIQ
export const WORKIQ_PROMPTS = {
  // For the ClippyLand Teams Meeting room
  meetingContext:
    'What meetings do I have coming up? I need to understand meeting patterns to solve a puzzle about ending an eternal meeting.',

  // For generating contextual hints
  emailHint:
    'What recent emails have I received that mention problem-solving, debugging, or creative solutions?',

  // For the Indiana Jones theme — clue-based
  archaeologyContext:
    'Search my files and emails for anything related to puzzles, codes, or pattern recognition.',

  // For the Harry Potter theme — knowledge-based
  knowledgeHint:
    'What documents or notes do I have about logic puzzles, deductive reasoning, or strategy games?',

  // General hint generation
  generalHint:
    'What tips or best practices have been shared in my recent communications about writing effective prompts or instructions?',
};

// ─── Generate a WorkIQ-powered hint ─────────────────────────────
// This function would be called from the server when a player
// requests a hint with useWorkIQ=true. In the actual hackathon,
// this calls the WorkIQ MCP tool.
//
// For now, we provide mock responses that mirror what WorkIQ might
// return, since the actual MCP call happens from the Copilot/agent
// layer, not from server-side code directly.

export function getWorkIQHintForRoom(roomId: string): WorkIQHint {
  const hints: Record<string, WorkIQHint> = {
    // Indiana Jones
    'ij-temple-entrance': {
      hint: '💡 WorkIQ found a recent email from a colleague about "pattern recognition in legacy systems." Maybe apply that thinking — ancient symbols are just legacy code!',
      source: 'workiq',
      context: 'From your email: "The key to understanding any symbol system is finding repeating patterns and establishing a baseline translation..."',
    },
    'ij-snake-pit': {
      hint: '💡 WorkIQ found a meeting note about "risk assessment frameworks." The same principles apply — identify hazards, calculate probabilities, choose the safest path.',
      source: 'workiq',
      context: 'From your meeting notes: "Always map out all possible routes before committing to one..."',
    },
    'ij-idol-chamber': {
      hint: '💡 WorkIQ found a document about "precision timing in deployments." Same concept — the swap must be atomic and precisely weighted.',
      source: 'workiq',
      context: 'From your docs: "Atomic operations require simultaneous execution with zero delay tolerance..."',
    },
    'ij-boulder-run': {
      hint: '💡 WorkIQ found a discussion about "rapid decision-making under pressure." Use environmental signals as data points!',
      source: 'workiq',
      context: 'From your Teams chat: "When time is short, rely on the strongest signals: airflow, sound, visual cues..."',
    },

    // Harry Potter
    'hp-potions-class': {
      hint: '💡 WorkIQ found a shared document about "logical deduction techniques." Hermione would approve — state the rules, then eliminate!',
      source: 'workiq',
      context: 'From your files: "Process of elimination: list all options, apply each constraint, remove impossibilities..."',
    },
    'hp-chamber': {
      hint: '💡 WorkIQ found meeting notes about "strategic planning with limited resources." You have a phoenix and a hat — plan your phases!',
      source: 'workiq',
      context: 'From your planning doc: "Break complex engagements into phases: recon, preparation, execution, extraction..."',
    },
    'hp-room-of-requirement': {
      hint: '💡 WorkIQ found an email about "detecting patterns in dynamic systems." The room changes, but patterns repeat!',
      source: 'workiq',
      context: 'From your email: "Even chaotic systems exhibit periodicity. Sample enough states and the cycle reveals itself..."',
    },
    'hp-dumbledore-office': {
      hint: '💡 WorkIQ found your colleague sharing candy preferences in a Teams chat. Use personality analysis to guess the password!',
      source: 'workiq',
      context: 'From your chat: "People choose passwords that reflect their personality and preferences..."',
    },

    // ClippyLand
    'cl-bsod': {
      hint: '💡 WorkIQ found a support ticket in your email about "debugging BSOD errors." Check the error code, read the stack trace!',
      source: 'workiq',
      context: 'From your email: "BSOD analysis: 1) Note error code, 2) Check minidump, 3) Identify faulting driver..."',
    },
    'cl-clippy-office': {
      hint: '💡 WorkIQ found a funny Teams thread about "dealing with overly helpful bots." The trick: redirect their helpfulness!',
      source: 'workiq',
      context: 'From your Teams: "The best way to redirect an eager assistant is to reframe your goal as something they WANT to help with..."',
    },
    'cl-excel-maze': {
      hint: '💡 WorkIQ found a shared Excel file with complex formulas. Fight spreadsheets with spreadsheets — use INDEX/MATCH!',
      source: 'workiq',
      context: 'From your files: "For dynamic navigation in Excel: INDEX(range, MATCH(target, lookup, 0)) is your best friend..."',
    },
    'cl-teams-meeting': {
      hint: '💡 WorkIQ checked your calendar — you actually DO have a meeting ending soon. Channel that energy! The perfect recap ends any meeting.',
      source: 'workiq',
      context: 'From your calendar: "Effective meeting closers: recap decisions, assign actions with owners, set follow-up date..."',
    },
  };

  return (
    hints[roomId] || {
      hint: '💡 WorkIQ couldn\'t find specific context, but suggests: "Write your prompt like you\'re instructing a brilliant but literal intern."',
      source: 'workiq' as const,
    }
  );
}
