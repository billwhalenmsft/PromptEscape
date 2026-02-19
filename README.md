# 🔓 Prompt Escape — The AI Escape Room

> **Craft the right prompts. Solve the puzzles. Escape.**

Prompt Escape is a visual, prompt-engineering escape room game where players must write effective AI prompts to unlock doors, defeat challenges, and escape themed rooms. Play solo, team up with friends, or compete head-to-head in versus mode. Built for the **TechConnect Hackathon 2026 — Agents League**.

🌐 **Live at**: [prompt-escape-hackfest.azurewebsites.net](http://prompt-escape-hackfest.azurewebsites.net)

## 🎮 How It Works

1. **Pick a mode** — Solo, Team (up to 4 players), or Versus (2 teams, up to 4 per team)
2. **Choose a theme** — each theme has 4 rooms with escalating difficulty
3. **Read the room** — immerse yourself in the narrative and visual scene
4. **Understand the challenge** — each room presents a prompt engineering puzzle
5. **Write your prompt** — craft a prompt that addresses the key concepts
6. **Get scored** — your prompt is evaluated on Relevance, Specificity, and Creativity
7. **Escape!** — pass all 4 rooms to escape (or beat the other team in Versus!)

## 👥 Game Modes

### 🧑 Solo
Classic single-player — tackle the rooms on your own.

### 🤝 Team (up to 4 players)
Co-op mode — share a lobby with friends and work through rooms together. Any player's passing prompt advances the whole team.

### ⚔️ Versus (2 teams, up to 8 players)
Head-to-head competition — two teams race through the same theme simultaneously. A live scoreboard tracks each team's progress. First team to escape wins!

**How multiplayer works:**
- Host creates a lobby and gets a **4-character join code**
- Share the code with friends — they join from the title screen
- In Versus mode, players pick Team A or Team B (auto-balanced)
- Host selects the theme and starts the game
- Real-time sync via polling (2-second interval)

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
- **Multiplayer**: Lobby system with join codes, polling-based sync, team management
- **AI Evaluation**: Keyword matching, synonym expansion, creativity heuristics (no external AI API needed)
- **Stats**: Persistent file-based tracking (attempts, escapes, failures by theme)
- **MCP Integration**: WorkIQ MCP Server for M365-powered contextual hints
- **Hosting**: Azure App Service (Node 20 LTS)
- **Built with**: GitHub Copilot throughout development

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/billwhalenmsft/PromptEscape.git
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
├── public/              # Frontend (static files)
│   ├── index.html       # Game UI — title, lobby, game screens
│   ├── style.css        # CSS art, animations, multiplayer UI
│   └── app.js           # Client-side game & multiplayer logic
├── src/                 # Backend (TypeScript)
│   ├── server.ts        # Express server + API routes (game & lobby)
│   ├── types.ts         # Game & multiplayer type definitions
│   ├── gameEngine.ts    # Session management, game flow
│   ├── lobbyManager.ts  # Multiplayer lobby system
│   ├── statsTracker.ts  # Persistent stats tracking
│   ├── promptEvaluator.ts  # Prompt scoring engine
│   ├── utils.ts         # Utility functions
│   ├── themes/          # Theme & room definitions
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
