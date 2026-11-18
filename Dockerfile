# syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
COPY package.json .npmrc ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json vite.config.ts index.html server.ts ./
COPY src ./src
RUN npm run build
FROM node:22-slim AS runtime
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY package.json .npmrc ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY src ./src
EXPOSE 8080
USER node
CMD ["node", "server.ts"]