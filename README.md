# Moods

A shared mood-tracking app for partners. Both users log how they're feeling (1–10 scale with notes and tags), view a unified timeline, and control what they share with each other through granular tag-based filters.

**Backend:** Python (Starlette + Ariadne GraphQL + asyncpg)
**Web:** ClojureScript (Reagent + re-frame + shadow-cljs)
**Mobile:** React Native (Expo + urql + Zustand)
**Database:** PostgreSQL 16+

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12+ | Backend |
| [uv](https://docs.astral.sh/uv/) | latest | Python package manager |
| PostgreSQL | 16+ | Database (with `pg_trgm` extension) |
| Node.js | 22+ | Web & Android frontends |
| Java | 17+ (Temurin) | Android builds (Gradle) |
| [Expo CLI](https://docs.expo.dev/get-started/installation/) | latest | Android development |

---

## Quick Start

### Database

```bash
# Create the database (default port 5433)
createdb -p 5433 moods
psql -p 5433 moods -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"

# Apply migrations
uv run poe migrate
```

### Backend

```bash
# Install dependencies
uv sync

# Copy and edit secrets
cp .secrets.toml.example .secrets.toml  # add your Mailgun key, JWT secret

# Start the dev server (port 8000)
uv run poe dev
```

### Web Frontend

```bash
cd web && npm install && cd ..

# Start shadow-cljs + Tailwind dev server (port 3000)
uv run poe dev:web
```

### Android

```bash
cd android && npm install && cd ..

# Start Expo dev server
uv run poe dev:android
```

---

## Common Tasks

All tasks are run via [Poe the Poet](https://poethepoet.naber.io/) through `uv run poe <task>`:

| Task | Command | Description |
|------|---------|-------------|
| `dev` | `uv run poe dev` | Start backend dev server (uvicorn, port 8000) |
| `dev:web` | `uv run poe dev:web` | Start web frontend dev server |
| `dev:android` | `uv run poe dev:android` | Start Android/Expo dev server |
| `test` | `uv run poe test` | Run pytest with coverage |
| `lint` | `uv run poe lint` | Check linting and formatting (Ruff) |
| `format` | `uv run poe format` | Auto-format Python code |
| `migrate` | `uv run poe migrate` | Apply database migrations |
| `docker:build` | `uv run poe docker:build` | Build Docker image |
| `docker:up` | `uv run poe docker:up` | Start Docker services |

---

## Running Tests

Tests run against a real PostgreSQL database (not mocks).

```bash
# Ensure test database exists
createdb -p 5433 moods_test

# Run tests with coverage
uv run poe test

# Run only unit or integration tests
uv run pytest -m unit
uv run pytest -m integration
```

### Testing Against a Live Server

Integration tests can run against an external server instead of the in-process ASGI app:

```bash
uv run pytest -m integration --server-url http://localhost:8000
```

When `--server-url` is provided:
- Tests use `httpx.AsyncClient` pointed at the live server instead of ASGI transport
- Database migrations are skipped (the server is assumed to be fully set up)
- The test database connection (`pool` fixture) still connects locally for cleanup and assertions

This is useful for smoke-testing a Docker deployment or staging environment.

---

## Configuration

Configuration uses [Dynaconf](https://www.dynaconf.com/) with layered settings:

| File | Purpose |
|------|---------|
| `settings.toml` | Base config (server, database, email, CORS) |
| `.secrets.toml` | Secrets — gitignored (Mailgun API key, JWT secret) |
| Environment vars | Override any setting with `MOODS_` prefix |

### Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `server.host` | `0.0.0.0` | Bind address |
| `server.port` | `8000` | Bind port |
| `db.host` | `localhost` | PostgreSQL host |
| `db.port` | `5433` | PostgreSQL port |
| `db.name` | `moods` | Database name |
| `jwt.expiry_days` | `90` | JWT token lifetime |
| `auth.code_expiry_minutes` | `10` | Login code TTL |
| `email.domain` | `moods.free-side.us` | Mailgun sending domain |

---

## Deployment

### Docker

```bash
uv run poe docker:build   # Build image
uv run poe docker:up      # Start with docker-compose
```

The Dockerfile builds a Python image with uv, installs dependencies, compiles the web frontend, and runs uvicorn.

### CI/CD

Two GitHub Actions workflows:

- **Backend** (`.github/workflows/build-backend.yml`) — Lint, test, build Docker image, push to GHCR, auto-release on version bump.
- **Android** (`.github/workflows/build-android.yml`) — Type-check, build APK via `expo prebuild` + Gradle, attach to GitHub Release.

Both workflows read the version from `pyproject.toml`. Bump `version` in a PR to trigger a release on merge to `main`.

---

## Documentation

- [architecture.md](architecture.md) — Tech stack, project layout, data flow, auth, sharing, conventions
- [data.md](data.md) — Database schema, table definitions, migration history
- [PLAN.md](PLAN.md) — Remaining improvement items
