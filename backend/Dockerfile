FROM node:22-slim

WORKDIR /app

# Install system libs (for onnx, native modules)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libc6 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
