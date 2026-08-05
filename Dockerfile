# Use the official Node.js 20-slim image as a base (Debian-based for better Playwright support)
FROM node:20-slim

# Install system dependencies required for Playwright/Chromium
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

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install --omit=dev

# Install Playwright browsers (specifically chromium for the aggregator)
RUN npx playwright install chromium

# Copy the rest of your application code to the container
COPY . .

# Your server.js is configured to listen on process.env.PORT or 8080.
EXPOSE 8080

# Command to run your application when the container starts
CMD ["node", "server.js"]