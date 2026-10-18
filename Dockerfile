# Hosted MCP connector for Cowork (e.g. Railway). Needs MCP_AUTH_TOKEN; voice keys optional.
FROM node:22-bookworm-slim

# Remotion's headless Chrome libraries, FFmpeg for mastering/probe, Python for the pipeline scripts.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-requests ca-certificates \
      libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 \
      libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Download Chrome Headless Shell at build time so renders don't fetch it on first use.
RUN npx remotion browser ensure

ENV PORT=8787
EXPOSE 8787
CMD ["npx", "tsx", "mcp/server.ts", "--http"]
