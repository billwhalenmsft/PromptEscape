# 🔓 Prompt Escape — The AI Escape Room

> **Craft the right prompts. Solve the puzzles. Escape.**

Prompt Escape is a visual, prompt-engineering escape room game where players must write effective AI prompts to unlock doors, defeat challenges, and escape themed rooms. Built for the **TechConnect Hackathon 2026 — Agents League**.

## 🎮 How It Works

1. **Choose a theme** — each theme has 4 rooms with escalating difficulty
2. **Read the room** — immerse yourself in the narrative and visual scene
3. **Understand the challenge** — each room presents a prompt engineering puzzle
4. **Write your prompt** — craft a prompt that addresses the key concepts
5. **Get scored** — your prompt is evaluated on Relevance, Specificity, and Creativity
6. **Escape!** — pass all 4 rooms to escape

## 🏰 Themes

### 🏺 Temple of the Lost Prompt (Indiana Jones)
Navigate ancient temples, dodge snake pits, swap golden idols, and outrun boulders — all with the power of prompts.

### ⚡ The Hogwarts Escape (Harry Potter)
Solve Snape's potions riddle, battle the basilisk, navigate the Room of Requirement, and crack Dumbledore's password.

### 📎 ClippyLand: Escape from the Office (Microsoft)
Debug the Blue Screen of Death, outsmart a 10-foot Clippy, escape an Excel maze, and end the Teams meeting that never ends.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS with CSS art, animations, and a retro-gaming aesthetic
- **Backend**: Node.js + Express + TypeScript
- **AI Evaluation**: Keyword matching, synonym expansion, creativity heuristics (no external AI API needed)
- **MCP Integration**: WorkIQ MCP Server for M365-powered contextual hints
- **Built with**: GitHub Copilot throughout development

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/PromptEscape.git
cd PromptEscape

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start

# Open http://localhost:3001
```

## 📎 WorkIQ MCP Integration

Prompt Escape integrates with the **WorkIQ MCP Server** to generate contextual hints from your Microsoft 365 data:

- **Meeting-themed hints**: Your real calendar data makes the ClippyLand "Eternal Teams Meeting" room feel authentic
- **Email-powered clues**: WorkIQ searches your emails for relevant problem-solving discussions
- **Document context**: Your files and notes can inspire puzzle solutions

Click the **📎 WorkIQ Hint** button during gameplay to get M365-powered hints.

## 🎯 Hackathon Requirements

| Requirement | Implementation |
|-------------|---------------|
| **GitHub Copilot Usage** | Entire project built with Copilot assistance |
| **Creative Application** | Visual escape room game with CSS art and animations |
| **MCP Integration** | WorkIQ MCP for M365-powered contextual hints |

## 📊 Scoring System

Prompts are evaluated on three dimensions:

- **Relevance (40%)** — Does the prompt address the required concepts?
- **Specificity (30%)** — How detailed and precise is the prompt?
- **Creativity (30%)** — Does the prompt use advanced techniques (step-by-step, role-play, constraints)?

Bonus points for matching bonus concepts. Pass threshold scales with room difficulty.

## 📁 Project Structure

```
PromptEscape/
├── public/           # Frontend (static files)
│   ├── index.html    # Game UI structure
│   ├── style.css     # CSS art, animations, themes
│   └── app.js        # Client-side game logic
├── src/              # Backend (TypeScript)
│   ├── server.ts     # Express server + API routes
│   ├── types.ts      # Game type definitions
│   ├── gameEngine.ts # Session management, game flow
│   ├── promptEvaluator.ts  # Prompt scoring engine
│   ├── utils.ts      # Utility functions
│   ├── themes/       # Theme & room definitions
│   │   ├── index.ts
│   │   ├── indianaJones.ts
│   │   ├── harryPotter.ts
│   │   └── clippyLand.ts
│   └── services/
│       └── workiqService.ts  # WorkIQ MCP integration
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
