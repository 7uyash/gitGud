FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g turbo

COPY package.json package-lock.json turbo.json ./
COPY apps/auth-lobby-service/package.json apps/auth-lobby-service/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json

RUN npm ci

COPY . .

RUN turbo run build --filter=@gitgud/auth-lobby-service

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/apps/auth-lobby-service/package.json ./apps/auth-lobby-service/package.json
COPY --from=builder /app/apps/auth-lobby-service/dist ./apps/auth-lobby-service/dist

WORKDIR /app/apps/auth-lobby-service
EXPOSE 4101

CMD ["node", "dist/index.js"]
