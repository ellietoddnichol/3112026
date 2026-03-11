FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY src/server/package*.json ./src/server/
COPY src/client/package*.json ./src/client/
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]
