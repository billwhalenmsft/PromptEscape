import { Theme } from '../types';

export const harryPotter: Theme = {
  id: 'harry-potter',
  name: 'The Hogwarts Escape',
  tagline: 'It does not do to dwell on prompts and forget to escape.',
  icon: '⚡',
  rooms: [
    {
      id: 'hp-potions-class',
      name: 'Snape\'s Potions Classroom',
      description:
        'The dungeon door slams shut behind you. Rows of bubbling cauldrons fill the room. A riddle written in silver ink floats above seven bottles: "One will let you move ahead, one will take you back, two are poison, three are harmless — but which is which?" Professor Snape watches from the shadows.',
      visualDescription: 'potions-dungeon',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to solve a logic puzzle involving seven bottles with constraints — identifying which bottle is safe to drink through deductive reasoning.',
        requiredConcepts: ['logic', 'deduce', 'constraints', 'eliminate', 'solve'],
        bonusConcepts: ['poison', 'reasoning', 'process-of-elimination', 'sequence', 'rules'],
        solutionHint: 'Classic logic puzzle — give the AI constraints and ask it to reason through them.',
        difficulty: 1,
        maxAttempts: 4,
      },
      hints: [
        'Hermione solved this one with pure logic. No magic needed.',
        'Give the AI the specific constraints: poison positions, safe positions, the rules.',
        'Process of elimination — state each rule clearly.',
      ],
      successMessage: 'You drink the smallest bottle. Icy sensation floods through you — but you\'re alive! The flames part and you walk through. Brilliant deduction!',
      failureMessage: 'You reach for a bottle... but Snape stops you. "Clearly, fame isn\'t everything. Try again."',
    },
    {
      id: 'hp-chamber',
      name: 'The Chamber of Secrets',
      description:
        'Water drips from the ceiling of an enormous underground chamber. A massive stone serpent looms overhead. In the shadows, you hear it — the basilisk. Its gaze is lethal. Fawkes swoops overhead with the Sorting Hat. You need a strategy, NOW.',
      visualDescription: 'chamber-serpent',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to devise a multi-step battle strategy against a creature whose gaze is lethal, incorporating environmental advantages, allied assets, and known weaknesses.',
        requiredConcepts: ['strategy', 'weakness', 'avoid', 'attack', 'plan'],
        bonusConcepts: ['reflection', 'sound', 'allies', 'environmental', 'phases'],
        solutionHint: 'The creature has a weakness. You have allies. Use the environment. Think step-by-step.',
        difficulty: 2,
        maxAttempts: 4,
      },
      hints: [
        'Don\'t look it in the eyes. How can you navigate without sight?',
        'You have a phoenix (healer + distraction) and a magic hat (weapon source).',
        'A rooster\'s crow is fatal to basilisks. Sound is a clue.',
      ],
      successMessage: 'Fawkes blinds the serpent! You pull the sword from the hat and drive it home. The basilisk falls! The chamber trembles as its magic breaks.',
      failureMessage: 'Your strategy fails. The basilisk\'s gaze catches your reflection. Everything goes dark...',
    },
    {
      id: 'hp-room-of-requirement',
      name: 'The Room of Requirement',
      description:
        'You pace three times before the hidden wall, thinking "I need the exit." A door appears — but inside, the room keeps shifting. Towers of forgotten objects rise and fall. Hidden somewhere in this chaos is the exit portal, but the room reshapes every 30 seconds.',
      visualDescription: 'shifting-room',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to find a hidden object in a constantly changing environment by identifying patterns in the chaos and predicting the next configuration.',
        requiredConcepts: ['pattern', 'predict', 'search', 'changing', 'find'],
        bonusConcepts: ['chaos', 'cycle', 'observation', 'temporal', 'mapping'],
        solutionHint: 'The room changes, but does it follow a pattern? Can you predict the next state?',
        difficulty: 3,
        maxAttempts: 3,
      },
      hints: [
        'The room changes every 30 seconds. Watch for repeating configurations.',
        'Map what you see each cycle — the portal might follow a pattern.',
        'Ask the AI to find periodicity in the transformations.',
      ],
      successMessage: 'You spot it — the pattern repeats every fourth cycle! You dash to the predicted location and leap through the shimmering portal!',
      failureMessage: 'The room collapses inward. Too many changes, too little pattern recognition. The Room of Requirement no longer requires you.',
    },
    {
      id: 'hp-dumbledore-office',
      name: 'Dumbledore\'s Office',
      description:
        'The spiral staircase has brought you to the headmaster\'s office. The stone gargoyle at the exit demands a password — it\'s always a candy. Portraits of former headmasters whisper clues. A Pensieve swirls with silver memories. Dumbledore\'s phoenix perch sits empty.',
      visualDescription: 'headmaster-office',
      puzzle: {
        challenge:
          'Write a prompt that instructs an AI to generate the most likely password by analyzing contextual clues — a character\'s known preferences, historical patterns, and environmental hints.',
        requiredConcepts: ['password', 'analyze', 'clues', 'preference', 'generate'],
        bonusConcepts: ['candy', 'history', 'personality', 'whisper', 'deduce'],
        solutionHint: 'Dumbledore loves candy. The portraits whisper clues. What would a wise, whimsical wizard choose?',
        difficulty: 2,
        maxAttempts: 4,
      },
      hints: [
        'The password is always a sweet/candy.',
        'Listen to the portraits — they\'re whispering fragments.',
        'Think: Sherbet Lemon, Cockroach Cluster, Acid Pops... ask the AI to deduce from personality.',
      ],
      successMessage: '"Sherbet Lemon!" The gargoyle springs aside. You leap onto the spiral staircase as it descends to freedom. Mischief managed! 🧙',
      failureMessage: 'The gargoyle stares at you unmoved. The portraits snicker. Perhaps you need to understand Dumbledore better.',
    },
  ],
};
