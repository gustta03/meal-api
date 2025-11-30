FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies for Canvas (needed for text rendering)
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
COPY bun.lock /temp/dev/
RUN cd /temp/dev && bun install

FROM install AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build || true

FROM base AS release
# Install Canvas runtime dependencies (without -dev suffix for runtime)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
COPY --from=prerelease /app/node_modules node_modules
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/bun.lock .
COPY --from=prerelease /app/tsconfig.json .
COPY --from=prerelease /app/src src

EXPOSE 3000/tcp
CMD [ "bun", "run", "src/index.ts" ]
