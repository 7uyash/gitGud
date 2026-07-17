FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g turbo

COPY package.json package-lock.json turbo.json ./
COPY apps/game-engine-service/package.json apps/game-engine-service/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json

RUN npm ci

COPY . .

RUN turbo run build --filter=@gitgud/game-engine-service

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/apps/game-engine-service/package.json ./apps/game-engine-service/package.json
COPY --from=builder /app/apps/game-engine-service/dist ./apps/game-engine-service/dist

WORKDIR /app/apps/game-engine-service
EXPOSE 4102

CMD ["node", "dist/index.js"]
