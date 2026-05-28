# syntax=docker/dockerfile:1.7

# ─── Stage 1: deps ─────────────────────────────────────────────────────
# Installs all dependencies (incl. devDependencies) for the builder and
# migrate stages.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: builder ──────────────────────────────────────────────────
# Builds the Next.js standalone output. Dummy env vars satisfy module-
# load-time checks (db client, Auth.js providers). No real connections
# are made during the build — every page opts into dynamic rendering.
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy
ENV AUTH_SECRET=docker-build-only-not-used
ENV AUTH_URL=http://localhost:3000
ENV AUTH_GOOGLE_ID=dummy
ENV AUTH_GOOGLE_SECRET=dummy
ENV EMAIL_SERVER=smtp://localhost:1025
ENV EMAIL_FROM="10kdjo <noreply@10kdojo.org>"
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ─── Stage 3: runner ───────────────────────────────────────────────────
# The slim production image. Uses Next.js standalone output so only the
# runtime deps `server.js` actually needs are included.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

# ─── Stage 4: migrate ──────────────────────────────────────────────────
# One-shot image for running drizzle-kit migrate. Built once per deploy
# alongside the runner; invoked via `docker compose run --rm migrate`.
FROM node:22-alpine AS migrate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY src/db ./src/db
COPY tsconfig.json ./tsconfig.json
COPY package.json ./package.json

ENV NODE_ENV=production
# Invoke the binary directly — avoids needing pnpm/corepack in this stage.
CMD ["./node_modules/.bin/drizzle-kit", "migrate"]
