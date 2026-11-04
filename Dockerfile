# Stage 1: Build source code & compile TypeScript
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Cài đặt công cụ biên dịch cho native addons (như bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Production runtime image
FROM node:22-alpine AS production

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Phân quyền cho non-root user 'node' có sẵn trong image node alpine
RUN chown -R node:node /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]

