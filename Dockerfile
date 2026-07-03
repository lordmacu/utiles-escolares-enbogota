# Imagen de utiles-escolares para correr en blog (amd64) — build en el Mac, pull en el server.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NO_IMAGE_OPT=1 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# 1) Dependencias primero (capa cacheada mientras no cambie package.json).
#    Sin NODE_ENV=production aquí → instala también devDeps (Tailwind, etc.) que
#    el build necesita.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# 2) Código
COPY . .

# 3) Build SSG (~3.537 páginas). Concurrencia moderada + heap amplio para no reventar
#    el contenedor de build.
RUN NEXT_BUILD_CPUS=4 NEXT_BUILD_CONC=3 NODE_OPTIONS=--max-old-space-size=4096 npm run build

# 4) Runtime en modo producción
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
