# Prompt Escape — Copilot Instructions

## Hackfest Context
- **Event**: Agents League @ TechConnect (Microsoft internal hackathon)
- **Track**: 🎨 Creative Apps — Battle #1 with GitHub Copilot
- **Time Limit**: 100 minutes build time
- **Submission Deadline**: Feb 13, 2026 at 11:59 PM PT

---

## CRITICAL RULES — Follow at ALL Times

### Security & Confidentiality (PUBLIC REPO — mandatory)
- ❌ NO API keys, passwords, tokens, or credentials in code
- ❌ NO customer data or PII
- ❌ NO Microsoft Confidential information
- ✅ Store secrets in `.env` files (gitignored)
- ✅ Use placeholder values in example files

### Three Core Requirements (ALL mandatory)
1. **GitHub Copilot Usage** — Must demonstrate meaningful Copilot usage during development
2. **Creative Application** — Visual escape room game with CSS art & animations
3. **MCP Integration** — WorkIQ MCP Server for M365-powered contextual hints

---

## Project: "Prompt Escape"

### Concept
A visual, prompt-engineering escape room game with 3 themed adventures (Indiana Jones, Harry Potter, ClippyLand). Players write AI prompts to solve puzzles and escape rooms.

### Tech Stack
- **Frontend**: HTML/CSS/JS with CSS art, animations, retro-gaming aesthetic
- **Backend**: Node.js + Express + TypeScript
- **Evaluation**: Keyword matching, synonym expansion, creativity heuristics
- **MCP**: WorkIQ MCP Server for M365-powered hints

### Key Files
- `src/promptEvaluator.ts` — The scoring engine (relevance, specificity, creativity)
- `src/themes/*.ts` — Room & puzzle definitions for each theme
- `src/gameEngine.ts` — Game session management
- `src/services/workiqService.ts` — WorkIQ MCP integration
- `public/style.css` — All CSS art and animations
- `public/app.js` — Frontend game logic
