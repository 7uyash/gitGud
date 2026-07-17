FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g turbo

COPY package.json package-lock.json turbo.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/database/package.json packages/database/package.json

RUN npm ci

COPY . .

RUN turbo run build --filter=@gitgud/frontend

FROM nginx:alpine

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
