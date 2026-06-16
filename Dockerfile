FROM node:22-alpine AS base
# corepack ships with Node and provisions the pnpm version pinned in
# package.json's "packageManager" field — no global npm install needed.
RUN corepack enable
WORKDIR /app

FROM base AS deps
# Install dependencies. The prisma schema/config are needed here because the
# root "postinstall" script runs `prisma generate` during install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Force a flat (npm-style) node_modules inside the image so the runner stage can
# cherry-pick individual packages (prisma, @prisma) without pnpm's symlinked
# store. This only affects the image; local development keeps pnpm's default.
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
RUN pnpm exec prisma generate && pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Prisma CLI + engines, used by the entrypoint to run migrations on boot.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
