FROM node:22-alpine AS builder
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/playground/package.json apps/playground/package.json
COPY packages/core/package.json packages/core/package.json
RUN pnpm install --no-frozen-lockfile
COPY packages/core packages/core
COPY apps/playground apps/playground
RUN pnpm --filter @orivyn/playground build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /workspace/apps/playground/.next/standalone ./
COPY --from=builder /workspace/apps/playground/.next/static ./apps/playground/.next/static
USER app
EXPOSE 3000
CMD ["node", "apps/playground/server.js"]
