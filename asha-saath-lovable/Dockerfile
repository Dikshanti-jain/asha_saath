FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:node

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 ASHA_DB_PATH=/var/data/asha-saath.sqlite
COPY --from=build /app/.output ./.output
COPY --from=build /app/backend ./backend
COPY --from=build /app/src/lib/demo ./src/lib/demo
COPY --from=build /app/scripts/start-production.mjs ./scripts/start-production.mjs
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /var/data && chown -R node:node /app /var/data
USER node
EXPOSE 3000
CMD ["node","scripts/start-production.mjs"]

