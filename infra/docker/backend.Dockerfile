FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build --filter=backend

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# Install production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/main.js"]

