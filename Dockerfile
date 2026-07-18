FROM node:20-slim

RUN apt-get update && apt-get install -y chromium --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
