# ---- Build stage ----
FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace config + .npmrc first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json .npmrc ./

# Copy all package.json files for dependency resolution
COPY packages/core/package.json packages/core/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/providers/base/package.json packages/providers/base/package.json
COPY packages/providers/anthropic/package.json packages/providers/anthropic/package.json
COPY packages/providers/google/package.json packages/providers/google/package.json
COPY packages/providers/openai/package.json packages/providers/openai/package.json

# Install all dependencies (devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/

# Build all packages via Turborepo
RUN pnpm build

# ---- Production stage ----
FROM node:22-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy workspace config + .npmrc
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/core/package.json packages/core/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/providers/base/package.json packages/providers/base/package.json
COPY packages/providers/anthropic/package.json packages/providers/anthropic/package.json
COPY packages/providers/google/package.json packages/providers/google/package.json
COPY packages/providers/openai/package.json packages/providers/openai/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output
COPY --from=builder /app/packages/core/dist packages/core/dist
COPY --from=builder /app/packages/client/dist packages/client/dist
COPY --from=builder /app/packages/db/dist packages/db/dist
COPY --from=builder /app/packages/mcp/dist packages/mcp/dist
COPY --from=builder /app/packages/server/dist packages/server/dist
COPY --from=builder /app/packages/providers/base/dist packages/providers/base/dist
COPY --from=builder /app/packages/providers/anthropic/dist packages/providers/anthropic/dist
COPY --from=builder /app/packages/providers/google/dist packages/providers/google/dist
COPY --from=builder /app/packages/providers/openai/dist packages/providers/openai/dist

EXPOSE 4000

CMD ["node", "packages/server/dist/start.js"]
