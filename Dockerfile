# syntax=docker.io/docker/dockerfile:1

# ============================================
# Hyperlocal - Production Dockerfile
# Next.js 15 + Keystone 6 (no Keystone server)
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install OpenSSL for Prisma and libc6-compat for Alpine compatibility
RUN apk add --no-cache openssl libc6-compat

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run keystone build to generate .keystone/config.js
# --no-ui since we don't need the admin UI in production
# Note: We skip migrate deploy here - run migrations manually before deploy
RUN pnpm exec keystone build --no-ui

# Generate Prisma client (ensures it matches the schema)
RUN pnpm exec prisma generate

# Build Next.js with standalone output
RUN pnpm build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Keystone generated config (CRITICAL - required for Keystone context at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/.keystone ./.keystone

# Copy Prisma client and schema
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/schema.prisma ./schema.prisma

# Copy files required by .keystone/config.js imports
COPY --from=builder --chown=nextjs:nodejs /app/keystone.ts ./keystone.ts
COPY --from=builder --chown=nextjs:nodejs /app/schema.ts ./schema.ts
COPY --from=builder --chown=nextjs:nodejs /app/cloudinary.ts ./cloudinary.ts

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname for container networking (required for Docker)
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
# server.js is created by Next.js build with standalone output
CMD ["node", "server.js"]
