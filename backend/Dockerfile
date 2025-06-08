# Use a Node.js base image with Debian for better package support
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app/backend

# Install dependencies for Puppeteer, OpenSSL, and networking
RUN apt-get update && \
    apt-get install -y \
    openssl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    dnsutils \
    iputils-ping \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first to leverage Docker cache
# This ensures that npm install is only re-run if dependencies change
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code into JavaScript
RUN npm run build

# Expose the port your Node.js app runs on (3002, as confirmed)
EXPOSE 3002

# Command to run the compiled application
CMD ["node", "dist/index.js"] 