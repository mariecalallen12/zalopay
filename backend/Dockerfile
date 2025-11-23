FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema early to generate client
COPY prisma ./prisma
RUN npm run db:generate

# Copy application source
COPY . .

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

