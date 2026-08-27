# =========================
# Stage 1: Dependencies
# =========================

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# =========================
# Stage 2: Production
# =========================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY --chown=node:node package*.json ./

COPY --chown=node:node src ./src

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const net=require('net'); const s=net.createConnection({host:'127.0.0.1',port:4000}); s.on('connect',()=>{s.end();process.exit(0)}); s.on('error',()=>process.exit(1));"

CMD ["node", "src/server.js"]