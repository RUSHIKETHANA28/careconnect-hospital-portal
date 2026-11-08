# ===================================================
# CareConnect Frontend Dockerfile
# Multi-stage production build with Nginx
# Roll Number: 2303A51919
# ===================================================

# Stage 1: Build Vite React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Vite bundle into /app/dist
RUN npm run build

# Stage 2: Serve optimized static assets with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
