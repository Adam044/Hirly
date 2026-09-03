# Use the official Node.js 20-slim image as a base
FROM node:20-slim

# Install system dependencies required for Playwright/Chromium
# We combine these to reduce image layers and clean up after install
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxfixes3 \
    libxshmfence1 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install application dependencies
# --omit=dev keeps the image light by excluding dev dependencies
RUN npm install --omit=dev

# Install Playwright browsers (specifically chromium for the aggregator)
RUN npx playwright install chromium

# Copy the rest of the application code
COPY . .

# Render expects the application to listen on the port provided in the PORT env var
# Defaulting to 8080 if not provided
ENV PORT=8080
EXPOSE ${PORT}

# Use a non-root user for security (optional but recommended)
# USER node

# Command to run the application
CMD ["node", "server.js"]