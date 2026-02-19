#!/usr/bin/env bash
# ------------------------------------------------------------------
# Post-create script — runs once after the Dev Container is built.
# Installs dependencies, builds TypeScript, and preps the environment.
# ------------------------------------------------------------------
set -e

echo "🔧 Installing npm dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
  echo "📄 Creating .env from .env.example..."
  cp .env.example .env
fi

# Create local data directory for stats persistence
mkdir -p data

echo ""
echo "✅ Dev Container ready!"
echo ""
echo "  Run the app:   npm start"
echo "  Dev mode:      npm run dev"
echo "  App URL:       http://localhost:3001"
echo ""
echo "  Deploy to Azure:"
echo "    1. az login"
echo "    2. az webapp up --name prompt-escape-hackfest --resource-group admin_rg_6875 --runtime 'NODE:20-lts'"
echo ""
