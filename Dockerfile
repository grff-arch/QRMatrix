FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY views ./views
RUN npm run build
EXPOSE 8080
CMD ["node", "dist/src/main.js"]