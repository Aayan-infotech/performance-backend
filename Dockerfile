# Dockerfile for node:18-alpine with Chromium for lighthouse/chrome-launcher
FROM node:18-alpine

# set working dir
WORKDIR /usr/src/app

# Install Chromium + minimal runtime deps and dumb-init for proper signal handling
# ttf-dejavu and font-noto give some fonts so headless chrome can render pages
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-dejavu \
    font-noto \
    dumb-init \
  && # ensure a consistent binary name: create symlink if needed
    if [ ! -x "/usr/bin/chromium-browser" ] && [ -x "/usr/bin/chromium" ]; then \
      ln -s /usr/bin/chromium /usr/bin/chromium-browser; \
    fi

# Point chrome-launcher to the binary
ENV CHROME_PATH=/usr/bin/chromium-browser

# Copy package files early for layer caching
COPY package*.json ./

# Install only production dependencies (change if you need dev deps)
RUN npm install --production

# Copy app source
COPY . .

# Expose your backend port
EXPOSE 4540

# Use dumb-init to forward signals and avoid zombie processes
CMD ["dumb-init", "node", "server.js"]
