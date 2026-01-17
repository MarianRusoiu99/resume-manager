# =============================================================================
# Resume Manager - Production Dockerfile
# Multi-stage build for optimized Next.js 16 + Prisma deployment
# =============================================================================

FROM node:20-alpine AS base

# Install base dependencies (shared between app and worker)
RUN apk add --no-cache \
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
# Builder Stage - Build the Next.js application
# =============================================================================
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# =============================================================================
# Runner Stage - Main Next.js App (No Chromium)
# =============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# =============================================================================
# Worker Stage - PDF Generation Worker (With Chromium)
# =============================================================================
FROM base AS worker
WORKDIR /app

# Install Chromium & fonts for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont

# Puppeteer configuration
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Copy built code and dependencies
COPY --from=builder /app/.next/standalone ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Add a simple entrypoint for the worker
# In a real setup, you might want to create a dedicated worker entrypoint script
# For now, we assume the server.js can detect its role or we use a separate command
CMD ["node", "lib/queue/worker/run-worker.js"]
