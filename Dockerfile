# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build essentials for native packages if needed
RUN apk add --no-cache python3 make g++ git

COPY package*.json ./
RUN npm ci

COPY . .

# Run production build
RUN npm run build

# --- Stage 2: Runtime Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 3: Production Image ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create application system user
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
# Copy firestore rules & blueprints if application reads them at runtime
COPY --from=builder /app/firestore.rules ./firestore.rules
COPY --from=builder /app/firebase-blueprint.json ./firebase-blueprint.json
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# If localDb JSON persistence file exists or is created
RUN touch db.json && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.cjs"]
