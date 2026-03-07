# Moods — Architecture

Moods is a shared mood-tracking app for partners. Both users log how they're feeling, view a unified timeline, and control what they share with each other through granular tag-based filters.

---

## Tech Stack

### Backend (Python)

| Role | Library | Notes |
|------|---------|-------|
| HTTP framework | [FastAPI](https://fastapi.tiangolo.com/) | ASGI, async (Starlette-based) |
| GraphQL | [Ariadne](https://ariadnegraphql.org/) | Schema-first |
| Database driver | [asyncpg](https://magicstack.github.io/asyncpg/) | Async PostgreSQL |
| SQL queries | [aiosql](https://nackjicholson.github.io/aiosql/) | Named queries from `.sql` files |
| DataLoaders | [aiodataloader](https://github.com/syrusakbary/aiodataloader) | N+1 prevention |
| Configuration | [Dynaconf](https://www.dynaconf.com/) | Layered TOML + env vars |
| Migrations | [yoyo-migrations](https://ollycope.com/software/yoyo/latest/) | Plain-SQL, sequential |
| JWT | [PyJWT](https://pyjwt.readthedocs.io/) | HS256 tokens |
| HTTP client | [httpx](https://www.python-httpx.org/) | Mailgun API calls |
| ASGI server | [Uvicorn](https://www.uvicorn.org/) | Development & production |
| Testing | [pytest](https://docs.pytest.org/) + [pytest-asyncio](https://pytest-asyncio.readthedocs.io/) | Async tests against real DB |
| Package manager | [uv](https://docs.astral.sh/uv/) | Fast, Rust-based |

### Web Frontend (ClojureScript)

| Role | Library | Notes |
|------|---------|-------|
| Language | [ClojureScript](https://clojurescript.org/) | Compiled to JS |
| React wrapper | [Reagent](https://reagent-project.github.io/) | Hiccup syntax |
| State management | [re-frame](https://day8.github.io/re-frame/) | Events, subscriptions, effects |
| GraphQL client | [re-graph](https://github.com/oliyh/re-graph) | re-frame integration |
| Routing | [reitit](https://github.com/metosin/reitit) | Data-driven, HTML5 history |
| Build tool | [shadow-cljs](https://shadow-cljs.github.io/docs/UsersGuide.html) | Hot reload, npm interop |
| CSS framework | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first |
| Component library | [Blueprint.js v6](https://blueprintjs.com/) | Dialogs, buttons, selects |

### Mobile Frontend (React Native)

| Role | Library | Notes |
|------|---------|-------|
| Framework | [React Native](https://reactnative.dev/) 0.81 | Cross-platform mobile |
| Platform | [Expo](https://expo.dev/) 54 | Managed workflow |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) v6 | File-based |
| GraphQL client | [urql](https://urql.dev/) v5 | Lightweight |
| State management | [Zustand](https://zustand.docs.pmnd.rs/) v5 | Minimal store |
| Persistence | [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Token & user storage |
| Notifications | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Local reminder scheduling |
| GraphQL devtools | [@urql/devtools](https://github.com/urql-graphql/urql-devtools) | Enabled in local & dev builds |
| Icons | [Expo Vector Icons](https://icons.expo.fyi/) | MaterialCommunityIcons |

### Database

| Component | Notes |
|-----------|-------|
| [PostgreSQL](https://www.postgresql.org/) | Primary data store |
| [pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html) extension | Trigram index for tag search |
| UUID v7 | Custom `uuidv7()` function for sortable, time-ordered IDs |

---

## Project Layout

```
moods/
  migrations/              Plain-SQL migrations (yoyo), 0000–0011
  src/moods/
    app.py                 FastAPI app, GraphQL mount, middleware, auth context
    config.py              Dynaconf settings loader
    db.py                  asyncpg pool creation, migration runner
    errors.py              AppError hierarchy (NotFoundError, ValidationError, AuthenticationError)
    schema/                .graphql files (schema-first)
      schema.graphql         Root Query & Mutation types, PageInfo
      auth.graphql           SendCodeResult, AuthPayload, login mutations
      user.graphql           User, ShareRule, ShareFilter, user mutations
      mood.graphql           MoodEntry, connection types, mood mutations
      tag.graphql            Tag, TagConnection, tag mutations
      scalars.graphql        DateTime & JSON scalar definitions
    sql/                   .sql files loaded by aiosql
      auth.sql               Auth code create/verify
      users.sql              User CRUD + trigram search
      moods.sql              Mood entries with sharing visibility
      tags.sql               Tag CRUD with trigram search
      shares.sql             Share rule & filter CRUD
    data/                  Data access layer (pure DB queries)
      __init__.py            aiosql loader, cursor pagination helpers
      auth.py                JWT decode
      users.py               User operations
      moods.py               Mood entry operations
      tags.py                Tag operations
      shares.py              Share rule get/set (soft-delete archival)
      loaders.py             DataLoaders (User, MoodEntryTags)
    services/              External service integrations
      __init__.py
      email.py               Mailgun integration
    orchestration/         Multi-step business workflows
      __init__.py
      auth.py                Login code generation + email sending, code verification + JWT
    resolvers/             Ariadne resolver bindings
      auth.py                sendLoginCode, verifyLoginCode
      user.py                users, user, searchUsers, createUser, updateSharing
      mood.py                moodEntries, logMood, archiveMoodEntry
      tag.py                 tags, updateTagMetadata, archiveTag
      scalars.py             DateTime & JSON serialization
  web/
    shadow-cljs.edn        Build configuration (:browser target, port 3000)
    src/moods/
      core.cljs              App init, re-graph setup, routing
      db.cljs                re-frame app-db spec
      events.cljs            re-frame event handlers (core)
      events/
        auth.cljs              Login code & token events
        entries.cljs           Mood entry fetch & mutation events
        init.cljs              App initialization events
        mood_modal.cljs        Modal open/close & submit events
        settings.cljs          Settings & sharing events
        tags.cljs              Tag fetch & mutation events
      subs.cljs              re-frame subscriptions
      routes.cljs            reitit route definitions
      gql.cljs               GraphQL query & mutation strings
      storage.cljs           localStorage auth helpers
      util.cljs              Date formatting, gravatar
      bp.cljs                Blueprint.js component wrappers
      views/
        header.cljs            Top bar, user info, add-mood button
        timeline.cljs          Unified chronological mood feed
        mood_modal.cljs        Log mood dialog (1–10, notes, tags)
        color_picker.cljs      Reusable color picker component
        sharing.cljs           Sharing rule management UI
        tag_edit_modal.cljs    Tag metadata editing dialog
        settings.cljs          User settings & sharing configuration
        tags.cljs              Tag management
        user_select.cljs       Login / user selection
        components.cljs        Shared UI components
  android/
    app.config.ts            Dynamic Expo config (variant-based name, package, cleartext)
    app/
      _layout.tsx            Root layout (urql provider, theme)
      user-select.tsx        Login screen (+.styles.tsx)
      +not-found.tsx         404 screen (+.styles.tsx)
      (tabs)/
        _layout.tsx            Tab navigator (Timeline, Tags, Settings)
        index.tsx              Timeline tab (+.styles.tsx)
        tags.tsx               Tag management tab (+.styles.tsx)
        settings.tsx           Settings & sharing tab (+.styles.tsx)
    components/
      ColorPicker.tsx        Reusable color swatch picker (+.styles.tsx)
      DateDivider.tsx         Date group header (+.styles.tsx)
      EntryCard.tsx           Mood entry card (+.styles.tsx)
      MoodModal.tsx           Log mood dialog (+.styles.tsx)
      MoodPicker.tsx          1–10 mood grid (+.styles.tsx)
      MoodTag.tsx             Tag pill component (+.styles.tsx)
      ProfileSection.tsx      Settings profile section
      SharingSection.tsx      Settings sharing section
      TagEditModal.tsx        Tag metadata editor (+.styles.tsx)
      TagPicker.tsx           Tag search & select (+.styles.tsx)
    lib/
      auth.ts                Token storage (expo-secure-store)
      config.ts              Build variant config (API URL, devtools flag)
      shared-styles.ts       Common style constants
      graphql/
        client.ts              urql client (variant-aware URL, conditional devtools)
        queries.ts             GraphQL query strings
        mutations.ts           GraphQL mutation strings
      store.ts               Zustand store (auth, users, UI state)
      usePaginatedEntries.ts Custom hook for paginated entry queries
      useNotifications.ts    Local reminder scheduling
      useSharing.ts          Custom hook for sharing state & mutations
      useUserSearch.ts       Custom hook for debounced user search
      theme.ts               Color tokens
      utils.ts               Gravatar, date formatting
  graphql/
    generate.py              Script to generate client query files from operations
    operations/              Shared .graphql files (14 operations)
  tests/
    conftest.py              Env setup, auto-markers (unit/integration)
    integration/
      conftest.py            DB pool, GraphQL client, auth helpers
      test_auth.py           Login code & JWT tests
      test_users.py          User CRUD tests
      test_moods.py          Mood entry, delta, tags tests
      test_tags.py           Tag CRUD & search tests
      test_user_entries.py   User.entries pagination tests
      test_health.py         Health endpoint tests
      test_edge_cases.py     Edge cases
      test_sharing.py        Sharing visibility & filter tests
    unit/                    Pure unit tests (no I/O, no database)
```

---

## Build Variants (Android)

The Android app uses `EXPO_PUBLIC_APP_VARIANT` to select between three build configurations:

| Variant | API URL | Devtools | Command |
|---------|---------|----------|---------|
| `local` | `http://localhost:8000` | Yes | `npm start` |
| `dev` | `https://moods-dev.free-side.us` | Yes | `npm run start:dev` |
| `release` | `https://moods.free-side.us` | No | EAS production build |

Each variant installs as a separate app (`com.moods.app.local`, `com.moods.app.dev`, `com.moods.app`) so they can coexist on the same device. The variant is set via inline env var in npm scripts (local dev) or `eas.json` env blocks (EAS builds). `app.config.ts` reads the variant to configure the package name, app name suffix, and cleartext traffic. `lib/config.ts` maps the variant to the API URL and devtools flag, consumed by the urql client.

---

## Data Flow

### Request Lifecycle

```
Client (Web/Mobile)
  │
  │  HTTP POST /graphql  (Bearer token in Authorization header)
  │
  ▼
FastAPI  ──▶  CORSMiddleware
  │
  ▼
Ariadne GraphQL handler
  │
  ├─ get_context()
  │    ├─ Decodes JWT → auth_user_id (or null)
  │    ├─ Grabs asyncpg pool from app.state
  │    └─ Creates fresh DataLoaders for this request
  │
  ├─ Resolvers execute
  │    ├─ Read from context: pool, auth_user_id, loaders
  │    ├─ Call data layer functions (moods.data.*)
  │    │    └─ Run named SQL queries via aiosql
  │    ├─ Call orchestration layer (moods.orchestration.*)
  │    │    └─ Coordinates data + services (e.g. auth code + email)
  │    ├─ Services (moods.services.*) for external integrations
  │    └─ Nested fields use DataLoaders to batch
  │
  └─ Return JSON response
```

### Frontend Data Flow

**Web (ClojureScript / re-frame)**
```
User action
  → dispatch re-frame event
    → event handler (may dispatch GraphQL via re-graph)
      → re-graph sends query to /graphql
        → response triggers callback event
          → app-db updated
            → subscriptions recompute
              → Reagent re-renders affected components
```

**Mobile (React Native / urql + Zustand)**
```
User action
  → urql hook (useQuery / useMutation)
    → sends query to /graphql
      → response updates component state
  → Zustand store for cross-cutting state (auth, current user)
    → AsyncStorage for persistence across app restarts
```

### Pagination

Mood entries and tags use Relay-style cursor pagination. Cursors are base64-encoded JSON payloads containing `{"id": "<value>", "search": "<query>"}`. The `search` field binds the cursor to its originating search context — decoding validates that the search matches, preventing cursor reuse across different queries. The data layer fetches `limit + 1` rows; if the extra row exists, `hasNextPage` is true and the row is trimmed from results.

### DataLoaders

Two loaders are created fresh per request to prevent N+1 queries on nested fields. Both use abstract base classes to eliminate boilerplate:

- **`_ByIdLoader`** — base class for id → single row lookups. Subclasses set `query_fn`.
- **`_OneToManyLoader`** — base class for parent_id → list of child rows. Subclasses set `query_fn`, `parent_key`, and optionally `ids_param`.

Concrete loaders:

- **UserLoader** (`_ByIdLoader`) — batches `MoodEntry.user` lookups into a single `WHERE id = ANY(...)` query
- **MoodEntryTagsLoader** (`_OneToManyLoader`) — batches `MoodEntry.tags` lookups by joining `mood_entry_tags` and `tags`

---

## Authentication

Moods uses a passwordless email-based login flow:

```
1. Client calls  sendLoginCode(email)
     │
     ▼
2. Server looks up user by email
   (returns success even if not found, to avoid leaking existence)
     │
     ▼
3. Generates a random 6-digit code
   Stores in auth_codes with a 10-minute TTL
   Sends code via Mailgun email
     │
     ▼
4. Client calls  verifyLoginCode(email, code)
     │
     ▼
5. Server checks auth_codes for a matching, unexpired, unused code
   Marks the code as used (sets used_at)
     │
     ▼
6. Returns a JWT (HS256, 90-day expiry)
   Payload: { sub: user_id, exp: ... }
     │
     ▼
7. Client stores the token
   Web: localStorage    Mobile: expo-secure-store
     │
     ▼
8. Subsequent requests send  Authorization: Bearer <token>
   Server decodes in get_context(), sets auth_user_id
```

The `auth_user_id` from the JWT is passed as `viewer_id` into mood entry queries to enforce sharing visibility.

---

## Sharing

Sharing controls which mood entries a partner can see. The model is:

### Data Model

- **mood_shares** — a row means "user A shares entries with user B"
- **mood_share_filters** — optional regex-based filters attached to a share rule
  - `is_include = true` — only share entries tagged with matching tags
  - `is_include = false` — hide entries tagged with matching tags

### Filter Logic

When a viewer queries mood entries, the SQL applies this logic for each entry belonging to another user:

1. A `mood_shares` row must exist (owner → viewer), otherwise the entry is hidden
2. If **no include filters** exist, all entries are visible (subject to exclude filters)
3. If **include filters** exist, at least one of the entry's tags must match an include pattern
4. If **any exclude filter** matches any of the entry's tags, the entry is hidden
5. Excludes take precedence over includes

The `pattern` field uses PostgreSQL POSIX regex (`~` operator) matched against `tag_name`, allowing patterns like `^personal` or `private`.

---

## CI/CD

### Versioning

`pyproject.toml` `[project].version` is the **single source of truth** for the project version. Both the backend and Android workflows read from it. To trigger a release, bump the `version` field in your PR before merging.

### Backend Docker Image (GitHub Actions)

The workflow at `.github/workflows/build-backend.yml` builds the Docker image and pushes it to GitHub Container Registry (GHCR).

**Triggers:** Pushes and PRs to `main` when backend-related files change (`src/`, `web/`, `migrations/`, `pyproject.toml`, `uv.lock`, `Dockerfile`, `settings.toml`, or the workflow file).

**Build pipeline:** Checkout → Login to GHCR → Read version from `pyproject.toml` → `docker build` (tagged with version + `latest`) → Push to `ghcr.io/<owner>/moods`.

**On PRs:** The Docker image is built to validate it compiles, but not pushed.

**Auto-release:** On pushes to `main`, if the `v{version}` tag doesn't exist yet, a GitHub Release is created with auto-generated notes.

### Android APK Builds (GitHub Actions)

The workflow at `.github/workflows/build-android.yml` builds APKs using `expo prebuild` + Gradle directly on GitHub runners, with no Expo account or EAS dependency.

**Triggers:**

| Event | Variant | APK artifact |
|-------|---------|--------------|
| Push to branch with open PR to `main` | `dev` | `moods-dev.apk` |
| Push/merge to `main` | `release` | `moods-release.apk` |

Path-filtered to only run when `android/**`, `pyproject.toml`, or the workflow file changes.

**Build pipeline:** Checkout → Node 20 + npm ci → Java 17 (Temurin) → `expo prebuild --platform android --clean` → `./gradlew assembleRelease --no-daemon` → upload APK artifact.

**Auto-release:** On pushes to `main`, after the APK is built the workflow reads `version` from `pyproject.toml` and checks if a `v{version}` git tag already exists. If not, it creates a GitHub Release (which also creates the tag) with the APK attached and auto-generated release notes. If the backend workflow already created the release (race condition), the APK is uploaded to the existing release.

**Notes:**
- APKs use debug signing (installable via sideloading, not signed for Play Store)
- Gradle caches are persisted between runs for faster rebuilds
- `expo prebuild` generates the native project at `android/android/` (gitignored)

---

### Atomic Updates

Sharing rules are updated atomically via `set_shares`: the entire rule set for a user is deleted and recreated in a single transaction. This avoids partial states and simplifies the client — it sends the complete desired state rather than individual add/remove operations.

---

## Conventions

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

### Error Handling

- **AppError hierarchy** — base `AppError` with a `code` attribute, subclasses `NotFoundError`, `ValidationError`, `AuthenticationError` (defined in `moods.errors`).
- Resolvers and data layer raise `AppError` subclasses; the `format_error` callback on the Ariadne `GraphQL()` instance maps them to `extensions.code` in the GraphQL response.
- Unhandled exceptions are logged and replaced with a generic "Internal server error" message with `extensions.code = "INTERNAL_ERROR"` — internal details are never leaked to clients.

### Python

- async throughout (async def resolvers, async DB calls).
- Settings accessed via Dynaconf — never hard-coded connection strings.
- Tests run against a real (disposable) Postgres database, not mocks.
- Tests use [assertpy](https://github.com/assertpy/assertpy) fluent assertions (`assert_that(x).is_equal_to(y)`) with `.described_as()` for clear failure messages.

### TypeScript (Android)

- Never use `any` — define interfaces for all data shapes in `lib/store.ts` and use them throughout.
- Type urql query results with a type parameter: `useQuery<{ users: User[] }>(...)`.
- `strict: true` is enabled in `tsconfig.json` — keep it that way.

---

## Dev Tooling

### Task Runner

All tasks are managed via [Poe the Poet](https://poethepoet.naber.io/) (`uv run poe <task>`):

| Task | Description |
|------|-------------|
| `dev` | Start backend dev server (uvicorn, port 8000) |
| `dev:web` | Start web frontend dev server |
| `dev:android` | Start Android/Expo dev server |
| `test` | Run pytest with coverage |
| `lint` | Check linting and formatting (Ruff) |
| `format` | Auto-format Python code |
| `migrate` | Apply database migrations |
| `docker:build` | Build Docker image |
| `docker:up` | Start Docker services |

### Linting & Formatting

- **Python:** [Ruff](https://docs.astral.sh/ruff/) — lint + format, configured in `pyproject.toml` (target Python 3.12, line-length 88).
- **Android:** ESLint + Prettier, with `lint`, `format`, and `typecheck` scripts in `package.json`.

---

## UI/UX Reference

### Web App Flow

1. On load, check localStorage for `moods-user-id` and `moods-token`.
2. **No token** — show login screen (email input, pre-filled from stored `moods-email`).
3. **Token set** — fetch users, show the timeline.

### Web State Management

- **localStorage** — `moods-user-id`, `moods-token`, `moods-email`. Read on init into re-frame app-db; set on login, cleared on switch-user.
- **re-frame app-db** — current user, users list, unified mood entries list, tags, login-email, modal state.
- **re-graph** — GraphQL queries and mutations dispatched as re-frame events.
- **Routing** — reitit HTML5 history. Routes: `/` (login or redirect), `/timeline`, `/tags`, `/settings`, `/summary`.

### Android State Management

- **AsyncStorage** — `moods_auth_token` (via expo-secure-store), `moods_current_user`, `moods_email`.
- **Zustand store** — `authToken`, `currentUserId`, `loginEmail`, `users`, `moodModalOpen`, plus async actions for persist/restore.
- **urql** — GraphQL client configured with auth token header.

### Timeline

- Unified chronological list showing both partners' entries in reverse chronological order.
- Entry cards: mood badge (color-coded 1–10), user name, notes, tags, relative timestamp.
- Date group headers ("Today", "Yesterday", "Feb 14") separate entries by day.
- User avatar and border color differentiate partners at a glance.
- Cursor-based "Load more" pagination.

### Log Mood

- Mood value picker (1–10 button grid).
- Text area for notes.
- Tag multi-select with search autocomplete.
- Submit calls `logMood` mutation; refreshes timeline on success.

