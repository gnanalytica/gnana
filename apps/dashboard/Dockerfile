# ---- Build stage ----
FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace config + .npmrc first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json .npmrc ./

# Copy all package.json files for full workspace resolution
COPY packages/core/package.json packages/core/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/mcp/package.json packages/mcp/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/providers/base/package.json packages/providers/base/package.json
COPY packages/providers/anthropic/package.json packages/providers/anthropic/package.json
COPY packages/providers/google/package.json packages/providers/google/package.json
COPY packages/providers/openai/package.json packages/providers/openai/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json

# Install all dependencies (devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ packages/
COPY apps/dashboard/ apps/dashboard/

# Build all packages via Turborepo
RUN pnpm build

# ---- Production stage (Next.js standalone) ----
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone output (self-contained, no node_modules needed)
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public

EXPOSE 3000

CMD ["node", "apps/dashboard/server.js"]
