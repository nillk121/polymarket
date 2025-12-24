FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/mini-app/package.json ./apps/mini-app/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build --filter=mini-app

# Production image
FROM nginx:alpine

COPY --from=builder /app/apps/mini-app/dist /usr/share/nginx/html

COPY infra/nginx/mini-app.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

