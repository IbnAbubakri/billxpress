FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json server/ 2>/dev/null || true
RUN npm install

COPY . .

EXPOSE 4000

CMD ["node", "server/src/index.js"]
