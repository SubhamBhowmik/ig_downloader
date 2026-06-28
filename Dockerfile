# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg \
  && pip3 install yt-dlp --break-system-packages

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg \
  && pip3 install yt-dlp --break-system-packages \
  && rm -rf /root/.cache \
  && yt-dlp --version

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV YT_DLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
COPY cookies.txt /app/cookies.txt

CMD ["node_modules/.bin/next", "start"]