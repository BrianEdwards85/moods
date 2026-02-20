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
| HTTP server          | **[Starlette](https://www.starlette.io/)**       | ASGI framework                               |
| GraphQL              | **[Ariadne](https://ariadnegraphql.org/)**         | Schema-first GraphQL                         |
| DB driver            | **[asyncpg](https://magicstack.github.io/asyncpg/)**         | Async PostgreSQL client                      |
| SQL management       | **[aiosql](https://nackjicholson.github.io/aiosql/)**          | Named queries from `.sql` files              |
| Configuration        | **[Dynaconf](https://www.dynaconf.com/)**        | Layered settings (env, TOML, secrets)        |
| Migrations           | **[yoyo-migrations](https://ollycope.com/software/yoyo/)** | Plain-SQL, sequential migration files        |
| Testing              | **[pytest](https://docs.pytest.org/)**          | With pytest-asyncio for async tests          |
| Package management   | **[uv](https://docs.astral.sh/uv/)**              | Fast dependency resolution & virtualenvs     |

### 3.2 Web Frontend

| Concern          | Library / Tool              | Role                                    |
|------------------|-----------------------------|-----------------------------------------|
| Language         | **[ClojureScript](https://clojurescript.org/)**           | Compiled to JS, full REPL-driven dev    |
| UI               | **[Reagent](https://reagent-project.github.io/)**                 | Minimal React wrapper for ClojureScript |
| State management | **[re-frame](https://day8.github.io/re-frame/)**                | App-db, subscriptions, event handlers   |
| GraphQL client   | **[re-graph](https://github.com/oliyh/re-graph)**                | re-frame-based GraphQL subscriptions    |
| Build            | **[shadow-cljs](https://shadow-cljs.github.io/docs/UsersGuide.html)**             | Builds, hot-reload, npm interop         |
| CSS              | **[Tailwind CSS](https://tailwindcss.com/)**            | Utility-first styling via PostCSS       |
| UI toolkit       | **[Blueprint.js](https://blueprintjs.com/)**            | Component library (dark mode, icons)    |
| Routing          | **[reitit](https://github.com/metosin/reitit)**                  | Data-driven client-side HTML5 router    |

### 3.3 Android App (future)

| Concern       | Library / Tool          |
|---------------|-------------------------|
| Framework     | **[React Native](https://reactnative.dev/)**        |
| GraphQL       | TBD ([Apollo](https://www.apollographql.com/) or [urql](https://commerce.nearform.com/open-source/urql/))    |
| Navigation    | [React Navigation](https://reactnavigation.org/)        |

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

## 6. Directory Structure

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
├── web/                       # ClojureScript frontend
│   ├── package.json           # npm deps (shadow-cljs, tailwind, etc.)
│   ├── shadow-cljs.edn        # shadow-cljs build config
│   ├── deps.edn               # Clojure/Script deps (reagent, re-frame, re-graph)
│   ├── tailwind.config.js     # Tailwind CSS config
│   ├── postcss.config.js      # PostCSS pipeline
│   ├── resources/public/      # Static assets & index.html
│   ├── src/                   # ClojureScript source
│   └── run.sh                 # Dev server start script
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

Build the frontend **one step at a time**. Complete each step fully,
present the output for review, and **do not proceed to the next step
until explicitly told that all refinements are done**. Iterate on each
step until confirmation before moving on.

#### Step 1 — Project Setup

- `web/` directory with `package.json`, `shadow-cljs.edn`, `deps.edn`
- Install shadow-cljs, Reagent, re-frame, re-graph, Tailwind CSS
- Minimal `index.html` entry point
- A "hello world" Reagent component rendering to the page
- Tailwind configured and working (PostCSS pipeline)
- `web/run.sh` to start the shadow-cljs dev server
- Verify: page loads in browser with styled hello world

**Stop and wait for approval before continuing.**

#### Step 2 — App Shell and State Management

- re-frame app-db structure, events, and subscriptions
- Cookie-based current user (`moods-user-id`): read on init,
  set on selection, clear on switch
- Conditional rendering: user selection screen vs. timeline screen
- Header with app title, current user name, switch-user button,
  and "Add Mood" button
- Client-side routing with reitit (HTML5 history)
- Routes: `/` (user select), `/timeline` (main), `/tags` (tag
  management), `/settings` (user settings), `/summary` (aggregates)

**Stop and wait for approval before continuing.**

#### Step 3 — GraphQL Client Layer

- re-graph initialization pointing at backend `/graphql`
- re-frame events for GraphQL queries and mutations
- Fetch users list on app init
- Fetch mood entries (per user) when current user is set
- Tag search query for autocomplete

**Stop and wait for approval before continuing.**

#### Step 4 — Core Views

Build out the real screens one at a time, collaborating on layout and
behavior. Each sub-view is presented for review before moving to the next.

- **User selection screen** — list of Blueprint Cards, one per user;
  clicking sets cookie and transitions to timeline
- **Timeline screen** — side-by-side columns ("My Moods" / "Partner's
  Moods"), each showing paginated MoodEntry cards with mood value
  (1-10), notes, tags, and relative timestamp; cursor-based "Load more"
- **Log mood modal** — Blueprint Dialog with ButtonGroup (1-10),
  TextArea for notes, MultiSelect for tags with search autocomplete,
  submit via `logMood` mutation

**Stop and wait for approval before continuing.**

#### Step 5 — Timeline UX Improvements

Improve the unified chronological timeline one item at a time.
Present each change for review before moving to the next.

##### 5a. Visual user differentiation

Both partners' entries currently look identical apart from a text
name. Make authorship immediately visible with a chat-style
mirrored layout:

- **Current user's entries** — Gravatar avatar on the **left**,
  card offset slightly to the left (e.g. `mr-8 md:mr-16`)
- **Partner's entries** — Gravatar avatar on the **right**, card
  offset slightly to the right (e.g. `ml-8 md:ml-16`), with the
  card content mirrored (avatar and text flow reversed)
- Use a subtle left-border color for the current user (e.g. blue)
  and a right-border color for the partner (e.g. purple)
- Keep the user name text visible on each card

**Stop and wait for approval before continuing.**

##### 5b. Human-readable relative timestamps

The raw ISO `createdAt` string is hard to scan. Replace it with
friendly relative labels:

- "just now" (< 1 minute)
- "5 minutes ago", "2 hours ago" (same day, < 12 hours)
- "Today at 3:42 PM" (same calendar day, ≥ 12 hours)
- "Yesterday at 9:15 AM"
- "Monday at 1:00 PM" (within the last 7 days)
- "Feb 14" (same year, > 7 days)
- "Dec 3, 2025" (different year)

Implement in a `format-relative-time` utility function in
`moods.util`. Re-compute on render (no timer needed for v1).

**Stop and wait for approval before continuing.**

##### 5c. Date group headers

Insert visual date dividers between entries from different calendar
days, giving the timeline a clear chronological structure:

- "Today", "Yesterday", or the full date (e.g. "Monday, Feb 17")
- Styled as a subtle horizontal rule with the date label centered
- Derived from the entry `createdAt` during render — no backend
  changes required

**Stop and wait for approval before continuing.**

##### 5d. Auto-refresh / manual refresh

The timeline currently only updates after the user logs or archives
an entry. The partner's new entries won't appear until a full page
reload.

- Add a refresh button in the timeline header (Blueprint icon
  button with `"refresh"` icon)
- Optionally: poll for new entries every 60 seconds using
  `js/setInterval` + a re-frame effect; show a subtle indicator
  when new entries arrive
- Refresh should re-fetch from the beginning (not append)

**Stop and wait for approval before continuing.**

#### Step 6 — Additional Polish

- Loading and error states for all GraphQL operations
- Empty states (no entries yet, no tags)
- Archive/unarchive interactions
- Any visual refinements

**Stop and wait for approval before continuing.**

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

## 8. Web App UI/UX

### App Flow

1. On load, check for a `moods-user-id` cookie.
2. **No cookie** → show the User Selection Screen.
3. **Cookie set** → show the Timeline Screen.

### User Selection Screen

- Fetches all users via `Query.users`.
- Displays a Blueprint `Card` per user (name + email), centered layout.
- Clicking a card sets the `moods-user-id` cookie and transitions to
  the timeline.

### Timeline Screen

**Header:**
- "Moods" title on the left.
- Current user name on the right with a "Switch User" button
  (clears cookie, returns to selection screen).
- "Add Mood" button (primary intent) opens the log mood modal.

**Body — unified chronological list:**
- Single column showing both partners' entries in reverse
  chronological order, fetched via `moodEntries(userIds: [...])`.
- Each entry card shows: mood badge (color-coded 1-10), user name,
  notes, tags (Blueprint `Tag`), and human-readable relative
  timestamp.
- Date group headers ("Today", "Yesterday", "Feb 14") separate
  entries from different calendar days.
- User avatar and left-border color differentiate partners at a
  glance.
- Cursor-based "Load more" at the bottom of the list.

### Log Mood Modal

Blueprint `Dialog` containing:
- `ButtonGroup` with buttons 1-10 for mood value.
- `TextArea` for notes.
- `MultiSelect` (`@blueprintjs/select`) for tags with search
  autocomplete via `Query.tags(search: ...)`.
- Submit calls `Mutation.logMood`; on success, closes the modal
  and refreshes the "My Moods" column.

### State Management

- **Current user ID** — browser cookie (`moods-user-id`), read on init.
- **re-frame app-db** — current user, users list, unified mood
  entries list (all users), tags, modal open/close state.
- **re-graph** — GraphQL queries and mutations dispatched as re-frame
  events.
- **Navigation** — reitit HTML5 history router. Routes: `/` (user
  select or redirect), `/timeline`, `/tags`, `/settings`, `/summary`.
  Current route stored in app-db as `:current-route`.

---

## 9. Conventions

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

## 10. Open Questions

- **Auth**: Full auth (JWT, OAuth) or simple shared-secret for a two-person app?
- **Hosting**: Self-hosted (VPS, home server) or managed (Fly.io, Railway)?
- ~~**Mood scale**: 1–10 numeric? Emoji picker? Both?~~ → **Decided: 1-10 ButtonGroup.**
- **Privacy**: Any entries the partner should *not* see?

---

*This document is the living reference for the Moods project. Update it as
decisions are made and phases are completed.*
