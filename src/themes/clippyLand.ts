import { Theme } from '../types';

export const clippyLand: Theme = {
  id: 'clippyland',
  name: 'ClippyLand: Escape from the Office',
  tagline: 'It looks like you\'re trying to escape! Would you like help with that?',
  icon: '📎',
  rooms: [
    {
      id: 'cl-bsod',
      name: 'The Blue Screen of Death',
      description:
        'Your entire world has crashed into a wall of blue. A cryptic error code blinks: "PROMPT_IRQL_NOT_LESS_OR_EQUAL." The cursor blinks mockingly. Somewhere in this kernel panic, there\'s a memory dump that holds the key to rebooting reality. A faint Clippy watermark appears in the corner: "It looks like you\'ve crashed! Would you like help?"',
      visualDescription: 'bsod-screen',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to debug a system crash by analyzing error codes, reading memory dumps, and identifying the root cause to restore the system.',
        requiredConcepts: ['debug', 'error', 'analyze', 'fix', 'system'],
        bonusConcepts: ['memory', 'stack-trace', 'root-cause', 'driver', 'kernel'],
        solutionHint: 'Treat the BSOD like a real debugging challenge. What would you ask an AI to investigate?',
        difficulty: 1,
        maxAttempts: 4,
      },
      hints: [
        'The error code is a clue! Ask the AI to look it up.',
        'Memory dumps contain stack traces — instruct the AI to parse them.',
        'Think like a sysadmin: check drivers, memory allocation, recent changes.',
      ],
      successMessage: 'SYSTEM RESTORED. The blue screen dissolves into a familiar desktop. But wait — this isn\'t YOUR desktop. Welcome to ClippyLand. 📎',
      failureMessage: 'FATAL ERROR: Unable to recover. Your existence has been deallocated. 💀',
    },
    {
      id: 'cl-clippy-office',
      name: 'Clippy\'s Office',
      description:
        'You\'re in an office that\'s entirely made of Word documents. The walls are pages, the floor is a spreadsheet grid, and Clippy — a 10-foot tall animated paperclip — blocks the door. Big googly eyes blink at you. "It looks like you\'re trying to leave! I\'m afraid I can\'t let you do that. Answer my riddle first!" The door is a giant "Save As" dialog but the filename field is locked.',
      visualDescription: 'clippy-office',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to negotiate with an overly-helpful assistant who refuses to let you leave, using persuasion, reverse psychology, or finding a loophole in its help-offer logic.',
        requiredConcepts: ['persuade', 'negotiate', 'loophole', 'help', 'assistant'],
        bonusConcepts: ['reverse-psychology', 'redirect', 'distract', 'override', 'humor'],
        solutionHint: 'Clippy WANTS to help. Use that against him. What if you need "help" leaving?',
        difficulty: 2,
        maxAttempts: 4,
      },
      hints: [
        'Clippy wants to help. Can you frame "escaping" as something you need help with?',
        'What if you told Clippy you\'re writing a document about how to exit rooms?',
        'Reverse psychology: "I definitely DON\'T want to leave this amazing office..."',
      ],
      successMessage: '"Oh, you need help LEAVING? Why didn\'t you say so!" Clippy cheerfully opens the door with a *ding* sound effect. The irony is not lost on you. 📎✅',
      failureMessage: '"It looks like you\'re stuck! Would you like me to add more obstacles?" Clippy adds another row of filing cabinets. 😱',
    },
    {
      id: 'cl-excel-maze',
      name: 'The Excel Maze',
      description:
        'You\'ve been shrunk down into a massive Excel spreadsheet. Endless rows and columns stretch to every horizon. Cell A1 says "YOU ARE HERE." Cell XFD1048576 says "EXIT." Between them: formulas that shift the maze walls, conditional formatting that creates illusions, and VLOOKUP traps that teleport you to random cells. A pivot table spins ominously in the distance.',
      visualDescription: 'excel-maze',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to write an Excel formula (or series of formulas) that navigates from cell A1 to the exit, accounting for dynamic obstacles and teleportation traps.',
        requiredConcepts: ['formula', 'navigate', 'cell', 'reference', 'calculate'],
        bonusConcepts: ['VLOOKUP', 'INDEX', 'MATCH', 'conditional', 'macro', 'path'],
        solutionHint: 'Fight spreadsheets with spreadsheets. Write formulas to find the optimal path.',
        difficulty: 3,
        maxAttempts: 3,
      },
      hints: [
        'The maze is a spreadsheet. Use spreadsheet tools to escape it!',
        'INDEX/MATCH can find the exit. VLOOKUP traps can be avoided with IFERROR.',
        'Maybe a macro that traces all paths? Ask the AI to write one.',
      ],
      successMessage: '=ESCAPE(NOW())! Your formula cascades through the cells, highlighting the path in green. You surf along the IF statements and crash through the exit cell! 📊🏃',
      failureMessage: '#REF! ERROR. Your formula created a circular reference. The spreadsheet folds in on itself. You are now a pivot table. 📉',
    },
    {
      id: 'cl-teams-meeting',
      name: 'The Eternal Teams Meeting',
      description:
        'You\'re trapped in a Teams meeting that NEVER ENDS. The "Leave" button has been removed. Participants include: "Synergy Bot" (speaks only in buzzwords), "Agenda Gatekeeper" (blocks any topic about leaving), and "Can-You-See-My-Screen" (shares an infinite PowerPoint). The meeting timer reads "∞". A chat message appears: "Let\'s take this offline... but we can\'t." Your only hope: craft the perfect message to end this meeting.',
      visualDescription: 'teams-meeting',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to compose the perfect meeting-ending message — one that satisfies all participants, addresses all agenda items, assigns action items, and provides a legitimate reason to end the meeting. The message must be so conclusive that even the Agenda Gatekeeper agrees it\'s time to stop.',
        requiredConcepts: ['end', 'meeting', 'summary', 'action', 'conclude'],
        bonusConcepts: ['agenda', 'follow-up', 'consensus', 'schedule', 'decision', 'email'],
        solutionHint: 'The perfect meeting ender: summarize, assign actions, set follow-up, establish consensus. Make leaving feel productive.',
        difficulty: 4,
        maxAttempts: 2,
      },
      hints: [
        'A meeting ends when all agenda items are addressed. Summarize everything!',
        'Action items + owners + deadlines = the universal meeting closer.',
      ],
      successMessage: '🎉 "Great meeting everyone! I\'ll send the recap." The Agenda Gatekeeper nods. Synergy Bot says "Let\'s leverage this outcome." The meeting ENDS. The Leave button reappears. You click it so fast your mouse breaks. You\'re free! 🖥️🏃‍♂️',
      failureMessage: '"Actually, can we extend this by another hour?" The meeting timer resets to ∞. The PowerPoint gains 47 new slides. You are never leaving. 📅😱',
    },
  ],
};
