# Moods — Project Plan

A shared mood-tracking app for two partners to log, visualize, and reflect on
how they're feeling over time.

---

## 1. Vision

Both partners can quickly record their current mood from a phone or browser.
Each person sees their own history and their partner's — fostering empathy,
opening conversations, and spotting patterns together.

---

## 2. Architecture Overview

```
┌──────────────────┐   ┌──────────────────┐
│  Web Frontend    │   │  Android App     │
│  ClojureScript   │   │  React Native    │
│  + React (Reagent)│   │                  │
└───────┬──────────┘   └───────┬──────────┘
        │                      │
        │     GraphQL (HTTPS)  │
        └──────────┬───────────┘
                   │
         ┌─────────▼─────────┐
         │   Python Backend  │
         │   Starlette       │
         │   Ariadne (GQL)   │
         └─────────┬─────────┘
                   │
           ┌───────▼───────┐
           │  PostgreSQL   │
           └───────────────┘
```

---

## 3. Tech Stack

### 3.1 Backend (Python)

| Concern             | Library / Tool      | Role                                         |
|----------------------|---------------------|----------------------------------------------|
| HTTP server          | **Starlette**       | ASGI framework                               |
| GraphQL              | **Ariadne**         | Schema-first GraphQL                         |
| DB driver            | **asyncpg**         | Async PostgreSQL client                      |
| SQL management       | **aiosql**          | Named queries from `.sql` files              |
| Configuration        | **Dynaconf**        | Layered settings (env, TOML, secrets)        |
| Migrations           | **yoyo-migrations** | Plain-SQL, sequential migration files        |
| Testing              | **pytest**          | With pytest-asyncio for async tests          |
| Package management   | **uv**              | Fast dependency resolution & virtualenvs     |

### 3.2 Web Frontend (future)

| Concern       | Library / Tool              |
|---------------|-----------------------------|
| Language      | **ClojureScript**           |
| UI            | **Reagent** (React wrapper) |
| GraphQL       | TBD (re-graph or raw fetch) |
| Build         | **shadow-cljs**             |

### 3.3 Android App (future)

| Concern       | Library / Tool          |
|---------------|-------------------------|
| Framework     | **React Native**        |
| GraphQL       | TBD (Apollo or urql)    |
| Navigation    | React Navigation        |

---

## 4. Data Model

See [data.md](data.md) for the full schema. Four tables:

- **users** — identity (UUID v7, name, email)
- **mood_entries** — a single mood log tied to a user, with soft-archive support
- **tags** — slug-keyed emotion labels with JSON display metadata
- **mood_entry_tags** — many-to-many join between entries and tags

---

## 5. GraphQL Schema

Defined in `src/moods/schema/`. See source files for full definitions.

---

## 5.1 aiosql Queries

Named queries in `src/moods/sql/`, organized by domain.

### users.sql

| Query             | Purpose                                       | Used by                       |
|-------------------|-----------------------------------------------|-------------------------------|
| `get_users`       | List all users, ordered by name               | `Query.users`                 |
| `get_user_by_id`  | Fetch a single user by UUID                   | `Query.user`, `MoodEntry.user`|
| `create_user`     | Insert a new user, return the created row     | `Mutation.createUser`         |

### moods.sql

| Query                   | Purpose                                                              | Used by                                  |
|-------------------------|----------------------------------------------------------------------|------------------------------------------|
| `get_mood_entries`      | Paginated mood entries with optional user filter and archived filter  | `Query.moodEntries`, `User.entries`      |
| `create_mood_entry`     | Insert a new mood entry, return the created row                      | `Mutation.logMood`                       |
| `archive_mood_entry`    | Set `archived_at = now()` on an entry, return the updated row        | `Mutation.archiveMoodEntry`              |
| `add_mood_entry_tag`    | Insert a row into `mood_entry_tags`                                  | `Mutation.logMood`                       |
| `get_tags_for_entry`    | Fetch tags for a mood entry via the join table                       | `MoodEntry.tags`                         |

### tags.sql

| Query         | Purpose                                                                | Used by                |
|---------------|------------------------------------------------------------------------|------------------------|
| `get_tags`    | Paginated list of tags, with archived filter, ordered by name          | `Query.tags`           |
| `search_tags` | Full-text search on tag name (for autocomplete), with archived filter  | `Query.tags`           |
| `archive_tag` | Set `archived_at = now()` on a tag, return the updated row             | `Mutation.archiveTag`  |

---

## 6. Backend Directory Structure

```
moods/
├── pyproject.toml
├── settings.toml              # Dynaconf base config
├── .secrets.toml              # Dynaconf secrets (git-ignored)
├── migrations/                # yoyo plain-SQL migrations
├── src/
│   └── moods/
│       ├── __init__.py
│       ├── app.py             # Starlette app factory
│       ├── config.py          # Dynaconf settings object
│       ├── db.py              # asyncpg pool lifecycle
│       ├── schema/            # .graphql files (schema-first)
│       ├── sql/               # aiosql named query files
│       └── resolvers/         # GraphQL resolver modules
└── tests/
    └── conftest.py            # fixtures: test DB, client, factories
```

---

## 7. Development Phases

### Phase 1 — Backend foundation

1. Initialize `pyproject.toml` with uv; install dependencies.
2. Set up Dynaconf configuration (`settings.toml`, env vars).
3. Create asyncpg connection pool lifecycle in Starlette.
4. Design data model collaboratively.
5. Write yoyo migrations from the agreed data model.
6. Define aiosql query files.
7. Build GraphQL schema and resolvers with Ariadne.
8. Add pytest test suite with a disposable test database.
9. Basic auth mechanism (simple token or hardcoded user lookup for v1).

### Phase 2 — Web frontend (ClojureScript)

1. Set up shadow-cljs project with Reagent.
2. GraphQL client layer.
3. Mood logging form (numeric scale + optional note).
4. Timeline / history view for both partners.
5. Simple responsive design (mobile-friendly).

### Phase 3 — Android app (React Native)

1. Initialize React Native project.
2. GraphQL client (Apollo or urql).
3. Mood logging screen.
4. Partner timeline screen.
5. Push-notification reminders (stretch).

### Phase 4 — Polish & extend

- Mood tags / emotion vocabulary.
- Data export.
- Streaks, gentle reminders.
- Charts and trend visualization.

---

## 8. Conventions

These are inherited from the cursor rules and apply project-wide.

### SQL

- Plural table names, snake_case columns.
- `IF NOT EXISTS` on DDL; `ON CONFLICT DO NOTHING` on seed inserts.
- Never `SELECT *` or `RETURNING *` — always list columns explicitly.
- yoyo migration files: `0001.short-description.sql` with `-- depends:`.

### GraphQL

- Schema-first with `.graphql` files.
- Root types in `schema.graphql`; domain types use `extend type Query` / `extend type Mutation`.
- Doc-strings on non-obvious fields only.
- Relay-style connections for lists.

### Python

- async throughout (async def resolvers, async DB calls).
- Settings accessed via Dynaconf — never hard-coded connection strings.
- Tests run against a real (disposable) Postgres database, not mocks.

---

## 9. Open Questions

- **Auth**: Full auth (JWT, OAuth) or simple shared-secret for a two-person app?
- **Hosting**: Self-hosted (VPS, home server) or managed (Fly.io, Railway)?
- **Mood scale**: 1–10 numeric? Emoji picker? Both?
- **Privacy**: Any entries the partner should *not* see?

---

*This document is the living reference for the Moods project. Update it as
decisions are made and phases are completed.*
