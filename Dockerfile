FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Runtime
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev --ignore-scripts

ENTRYPOINT ["node", "dist/server.js"]
