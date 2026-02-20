# Stage 1: Build frontend assets
FROM node:22-slim AS frontend

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/shadow-cljs.edn web/postcss.config.mjs ./
COPY web/src/ src/
COPY web/resources/public/index.html web/resources/public/favicon.svg resources/public/

RUN npm run css:build && npm run cljs:release

# Stage 2: Python runtime
FROM python:3.12-slim AS runtime

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY src/ src/
COPY migrations/ migrations/
COPY settings.toml ./

COPY --from=frontend /app/web/resources/public/ web/resources/public/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "moods.app:app", "--host", "0.0.0.0", "--port", "8000"]
