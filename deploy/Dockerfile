# Ephemeral single-container deployment (Render free plan): PostgreSQL + Redis + API + static web.
FROM node:22-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql postgresql-contrib redis-server curl ca-certificates util-linux procps \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci

# prisma generate only needs a syntactically valid URL at build time.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build -w @nexora/shared \
 && npm run build -w @nexora/api \
 && VITE_API_URL=/api npm run build -w @nexora/web

COPY deploy/start.sh /start.sh
COPY deploy/proxy.js /proxy.js
RUN chmod +x /start.sh

ENV PGDATA=/tmp/pg
EXPOSE 7860
CMD ["/start.sh"]
