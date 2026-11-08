# ===================================================
# CareConnect Backend Dockerfile
# Production-ready Node.js container
# Roll Number: 2303A51919
# ===================================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Set default production environment variables
ENV NODE_ENV=production \
    PORT=5000

# Expose backend REST API port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
