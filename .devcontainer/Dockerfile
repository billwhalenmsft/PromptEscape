# Use the official Dev Containers Node.js 20 image (Debian-based)
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install OS-level tools useful for Azure deployments
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    jq \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript globally so `tsc` is always available
RUN npm install -g typescript
