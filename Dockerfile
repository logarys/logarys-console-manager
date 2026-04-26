FROM node:24-bookworm-slim AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci


FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV APP_HOST=0.0.0.0
ENV APP_PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/README.md ./README.md
COPY --from=build /app/CONTRIBUTE.md ./CONTRIBUTE.md
COPY --from=build /app/LICENSE ./LICENSE

RUN mkdir -p /var/lib/logarys/query-adapters \
  && chown -R node:node /app /var/lib/logarys

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]