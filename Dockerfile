FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/pob-codec/package.json packages/pob-codec/
COPY packages/build-codec/package.json packages/build-codec/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/pob-codec/node_modules ./packages/pob-codec/node_modules
COPY --from=deps /app/packages/build-codec/node_modules ./packages/build-codec/node_modules
COPY . .
RUN cd packages/pob-codec && npx tsup
RUN cd packages/build-codec && npx tsup src/index.ts --format esm,cjs --dts
RUN node apps/web/scripts/build-worker.mjs
RUN node apps/web/scripts/convert-tree-lua.mjs 3_29
RUN cd apps/web && npx next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
