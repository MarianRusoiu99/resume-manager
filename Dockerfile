# =============================================================================
# Resume Manager - Production Dockerfile
# Multi-stage build for optimized Next.js 16 + Prisma deployment
# =============================================================================

FROM node:20-alpine AS base

# Install dependencies:
# - OpenSSL/libc6-compat: for Prisma
# - Chromium & fonts: for Puppeteer
# - Tini: for proper process signal handling
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tini

# =============================================================================
# Dependencies Stage - Install npm packages
# =============================================================================
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
# Use --legacy-peer-deps to handle React 19 peer dependency conflicts
# Skip Puppeteer Chromium download as we use the system installed one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --legacy-peer-deps

# Generate Prisma Client with correct binary target
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
# Runner Stage - Production runtime
# =============================================================================
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Copy Prisma schema and generated client (critical for runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Environment configuration
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Puppeteer configuration for Alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application via Tini for better signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
