import { Theme } from '../types';

export const indianaJones: Theme = {
  id: 'indiana-jones',
  name: 'Temple of the Lost Prompt',
  tagline: 'Fortune and glory, kid. Fortune and glory.',
  icon: '🏺',
  rooms: [
    {
      id: 'ij-temple-entrance',
      name: 'The Temple Entrance',
      description:
        'You stand before a massive stone door covered in ancient glyphs. The jungle hums behind you. A faded inscription reads: "Only the worthy may decipher the forgotten tongue." Your torch flickers as shadows dance across the carvings.',
      visualDescription: 'stone-door-jungle',
      puzzle: {
        challenge:
          'Write a prompt that would instruct an AI to decipher ancient hieroglyphics and reveal the hidden password carved into the temple door.',
        requiredConcepts: ['decipher', 'ancient', 'translate', 'symbols', 'password'],
        bonusConcepts: ['context', 'pattern', 'language', 'archaeology'],
        solutionHint: 'Think about how you would ask an AI to analyze and translate unknown symbols...',
        difficulty: 1,
        maxAttempts: 4,
      },
      hints: [
        'The door has symbols — maybe ask the AI to analyze visual patterns?',
        'Ancient languages need context. Provide some!',
        'Try asking the AI to translate symbols by comparing to known hieroglyphic systems.',
      ],
      successMessage: 'The glyphs glow golden and the stone door rumbles open! You step into the cool darkness beyond...',
      failureMessage: 'The inscription fades and the jungle begins to close in. The temple rejects you.',
    },
    {
      id: 'ij-snake-pit',
      name: 'The Snake Pit',
      description:
        'The floor writhes with hundreds of snakes! A narrow ledge runs along the far wall, but it\'s crumbling. Across the pit, you see the exit — 30 feet away. "Snakes... why did it have to be snakes?"',
      visualDescription: 'snake-pit',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to calculate the safest path across a room full of hazards, considering structural integrity and movement patterns.',
        requiredConcepts: ['path', 'safe', 'navigate', 'avoid', 'hazard'],
        bonusConcepts: ['algorithm', 'risk', 'optimize', 'terrain', 'weight'],
        solutionHint: 'Think pathfinding, risk assessment, terrain analysis...',
        difficulty: 2,
        maxAttempts: 4,
      },
      hints: [
        'The snakes have movement patterns. Maybe analyze them?',
        'The ledge is crumbling — factor in structural weight limits.',
        'A* pathfinding with hazard avoidance might be a good approach to describe.',
      ],
      successMessage: 'You leap from stone to stone, following the calculated path. The snakes hiss but cannot reach you. You\'re across!',
      failureMessage: 'You stumble into the writhing mass. The snakes coil around your boots. Game over, Dr. Jones.',
    },
    {
      id: 'ij-idol-chamber',
      name: 'The Idol Chamber',
      description:
        'A golden idol sits on a pressure-sensitive pedestal in the center of the chamber. Dart holes line every wall. One wrong move and this room becomes your tomb. You have a bag of sand that weighs roughly the same...',
      visualDescription: 'idol-pedestal',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to calculate the exact weight and timing needed to swap an object on a pressure plate without triggering a trap mechanism.',
        requiredConcepts: ['weight', 'swap', 'pressure', 'timing', 'calculate'],
        bonusConcepts: ['physics', 'velocity', 'counterweight', 'precision', 'sensor'],
        solutionHint: 'Physics + precision timing. How would you instruct an AI to solve this real-time calculation?',
        difficulty: 3,
        maxAttempts: 3,
      },
      hints: [
        'The pedestal detects weight changes. The swap must be simultaneous.',
        'Think about instructing AI to model the physics of the pressure plate.',
        'Include timing precision — milliseconds matter!',
      ],
      successMessage: 'In one fluid motion, you swap the idol for the sand bag. The pedestal holds. You clutch the golden prize!',
      failureMessage: 'CLICK. The pedestal rises. Darts fly from every direction. You should have been more precise.',
    },
    {
      id: 'ij-boulder-run',
      name: 'The Boulder Run',
      description:
        'A MASSIVE boulder drops from the ceiling and starts rolling toward you! The tunnel ahead branches into three paths — one leads out, two lead to dead ends. You have seconds to decide. The ground shakes beneath your feet.',
      visualDescription: 'boulder-chase',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to make a rapid decision under time pressure — analyzing environmental clues (airflow, sound echoes, light) to determine which tunnel leads to safety.',
        requiredConcepts: ['decision', 'analyze', 'clues', 'time', 'escape'],
        bonusConcepts: ['airflow', 'acoustics', 'light', 'probability', 'urgency'],
        solutionHint: 'Environmental sensing under pressure. What clues reveal the exit?',
        difficulty: 4,
        maxAttempts: 2,
      },
      hints: [
        'Fresh air flows from the exit. Sound echoes differently in dead ends.',
        'Light, airflow, echoes — all are data points. Ask the AI to weight them.',
      ],
      successMessage: '🏃 You sprint right, feeling the breeze on your face. Daylight! You burst out of the temple as the boulder seals the entrance behind you. You made it!',
      failureMessage: 'The boulder gains on you. You chose... poorly. The temple claims another adventurer.',
    },
  ],
};
