FROM node:22-alpine AS builder
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/example-consumer/package.json apps/example-consumer/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/actions/package.json packages/actions/package.json
COPY packages/runtime/package.json packages/runtime/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/react/package.json packages/react/package.json
COPY packages/browser/package.json packages/browser/package.json
RUN pnpm install --no-frozen-lockfile
COPY packages/core packages/core
COPY packages/actions packages/actions
COPY packages/runtime packages/runtime
COPY packages/client packages/client
COPY packages/react packages/react
COPY packages/browser packages/browser
COPY apps/example-consumer apps/example-consumer
RUN pnpm --filter @orivyn/example-consumer build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /workspace/apps/example-consumer/.next/standalone ./
COPY --from=builder /workspace/apps/example-consumer/.next/static ./apps/example-consumer/.next/static
COPY --from=builder /workspace/apps/example-consumer/public ./apps/example-consumer/public
USER app
EXPOSE 3001
CMD ["node", "apps/example-consumer/server.js"]
