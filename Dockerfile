# =============================================================================
# Resume Manager - Production Dockerfile
# Multi-stage build for optimized Next.js 16 + Prisma deployment
# =============================================================================

FROM node:20-alpine AS base

# Install base dependencies (shared between app and worker)
RUN apk add \
    libc6-compat \
    openssl \
    ca-certificates \
    tini

# =============================================================================
# Dependencies Stage - Install npm packages
# =============================================================================
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# =============================================================================
# Builder Stage - Build App and Worker
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Build Next.js application (standalone)
RUN npm run build

# 2. Build Worker (compile TS to JS)
# We still compile for standalone server usage if needed
RUN npx tsc --project tsconfig.worker.json --noEmitOnError false

# =============================================================================
# Runner Stage - Next.js App (Lean)
# =============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone assets
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/instrumentation.ts ./instrumentation.ts

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# =============================================================================
# Worker Stage - PDF Worker (Chromium)
# =============================================================================
FROM base AS worker
WORKDIR /app

ENV NODE_ENV=production

# Install Chromium & fonts only for the worker
RUN apk add \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto-emoji

# Puppeteer configuration
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy everything needed for the worker to run via Next.js instrumentation
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/instrumentation.ts ./instrumentation.ts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
