FROM node:22-alpine AS base
# corepack ships with Node and provisions the pnpm version pinned in
# package.json's "packageManager" field — no global npm install needed.
RUN corepack enable
WORKDIR /app

FROM base AS deps
# Install dependencies. The prisma schema/config are needed here because the
# root "postinstall" script runs `prisma generate` during install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Flat node_modules so COPY into the builder stage works (pnpm's default
# symlink store breaks across multi-stage COPY). Local dev stays default.
RUN printf '\nnodeLinker: hoisted\n' >> pnpm-workspace.yaml
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Keep the layout config consistent with the hoisted node_modules copied above.
RUN printf '\nnodeLinker: hoisted\n' >> pnpm-workspace.yaml
# next build imports prisma while collecting page data; .env is dockerignored.
# Placeholder only — compose injects the real DATABASE_URL at runtime.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN pnpm exec prisma generate && pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

# Standalone output already contains the traced runtime deps (including
# @prisma/client). Migrate on the host: `prisma migrate deploy` with
# DATABASE_URL pointing at localhost:5432.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

CMD ["node", "server.js"]
