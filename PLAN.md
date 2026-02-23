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

### 3.3 Android App

| Concern            | Library / Tool          | Role                                   |
|--------------------|-------------------------|----------------------------------------|
| Framework          | **[React Native](https://reactnative.dev/)** (Expo) | Cross-platform mobile app              |
| GraphQL            | **[urql](https://commerce.nearform.com/open-source/urql/)** | Lightweight GraphQL client             |
| Navigation         | **[Expo Router](https://docs.expo.dev/router/)** | File-based routing                     |
| State management   | **[Zustand](https://zustand-demo.pmnd.rs/)** | Lightweight store with AsyncStorage    |
| Persistent storage | **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** | Token, user ID, and email persistence  |

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
├── android/                   # React Native (Expo) app
│   ├── app/                   # Expo Router screens
│   │   ├── _layout.tsx        # Root layout (urql Provider, theme)
│   │   ├── user-select.tsx    # Email-based login screen
│   │   └── (tabs)/            # Tab navigator (timeline, settings, etc.)
│   ├── components/            # Shared UI components
│   ├── lib/
│   │   ├── store.ts           # Zustand store (auth, users, email)
│   │   ├── graphql/           # Query & mutation strings, urql client
│   │   ├── theme.ts           # Color tokens
│   │   └── utils.ts           # Gravatar, date formatting, etc.
│   └── package.json
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
- Cookie-based auth (`moods-user-id`, `moods-token`, `moods-email`):
  read on init, set on login, clear on switch
- Conditional rendering: login screen vs. timeline screen
- Header with app title, current user name, switch-user button,
  and "Add Mood" button
- Client-side routing with reitit (HTML5 history)
- Routes: `/` (login), `/timeline` (main), `/tags` (tag
  management), `/settings` (user settings), `/summary` (aggregates)

**Stop and wait for approval before continuing.**

#### Step 3 — GraphQL Client Layer

- re-graph initialization pointing at backend `/graphql`
- re-frame events for GraphQL queries and mutations
- Fetch users list after authentication (not on login screen)
- Fetch mood entries (per user) when current user is set
- Tag search query for autocomplete

**Stop and wait for approval before continuing.**

#### Step 4 — Core Views

Build out the real screens one at a time, collaborating on layout and
behavior. Each sub-view is presented for review before moving to the next.

- **Login screen** — email input with "Send Code" button; entering a
  valid code sets auth cookies and transitions to timeline
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

### Phase 3 — Android app (React Native) ✅

1. ~~Initialize React Native project.~~ Done (Expo + Expo Router).
2. ~~GraphQL client.~~ Done (urql).
3. ~~Mood logging screen.~~ Done (MoodModal component).
4. ~~Partner timeline screen.~~ Done (unified chronological list with
   polling, pagination, pull-to-refresh).
5. ~~Email-based login screen.~~ Done (email input → code verify →
   AsyncStorage persistence).
6. Push-notification reminders (stretch).

### Phase 4 — Polish & extend

- Mood tags / emotion vocabulary.
- Data export.
- Streaks, gentle reminders.
- Charts and trend visualization.

---

## 8. Web App UI/UX

### App Flow

1. On load, check for `moods-user-id` and `moods-token` cookies.
2. **No token** → show the Login Screen (email input, pre-filled from
   `moods-email` cookie if present).
3. **Token set** → fetch users, show the Timeline Screen.

### Login Screen

- Centered form with an email text input and "Send Code" button.
- Email field is pre-filled from the `moods-email` cookie (saved after
  successful login), so returning users see their address already filled in.
- Submitting dispatches `sendLoginCode` with the typed email; a dialog
  opens for the 6-digit verification code.
- On successful verification, `moods-token`, `moods-user-id`, and
  `moods-email` cookies are set and the user is navigated to the timeline.
- No user list is fetched or displayed — the full user list is never
  exposed on the login screen.

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

### State Management (Web)

- **Cookies** — `moods-user-id`, `moods-token`, `moods-email`. Read on
  init into re-frame app-db; set on login, cleared on switch-user.
- **re-frame app-db** — current user, users list, unified mood entries
  list, tags, login-email, modal open/close state.
- **re-graph** — GraphQL queries and mutations dispatched as re-frame
  events.
- **Navigation** — reitit HTML5 history router. Routes: `/` (login or
  redirect), `/timeline`, `/tags`, `/settings`, `/summary`. Current
  route stored in app-db as `:current-route`.

### State Management (Android)

- **AsyncStorage** — `moods_auth_token`, `moods_current_user`,
  `moods_email`. Restored on app startup via Zustand store actions.
- **Zustand store** — `authToken`, `currentUserId`, `loginEmail`,
  `users`, `moodModalOpen`, plus async actions for persist/restore.
- **urql** — GraphQL client configured with auth token header.

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

## 10. User Settings & Sharing

### 10.1 Overview

Two categories of per-user configuration:

1. **Profile settings** — stored in the existing `users.settings` JSONB
   column. Cosmetic, client-read values.
2. **Sharing settings** — stored in a new `mood_shares` table so the
   database can enforce visibility at query time.

### 10.2 Profile Settings (JSON)

Stored as keys inside `users.settings`:

| Key          | Type            | Default        | Description                                       |
|--------------|-----------------|----------------|---------------------------------------------------|
| `avatarUrl`  | `string \| null` | `null`         | Custom profile picture URL. Falls back to Gravatar when null. |
| `color`      | `string \| null` | `null`         | Hex color (e.g. `"#7aa2f7"`) used for the user's timeline entries. Falls back to a default per-user color when null. |

Both frontends already fetch `settings` on every user query — no
schema changes needed, just read and apply the values.

### 10.3 Sharing Settings (Database)

A user's mood entries are only visible to users they have explicitly
shared with. By default a new user shares with nobody.

Each share rule can have zero or more **tag filters**, each being
either an include or exclude regex pattern:

- **No filters** → all moods are shared.
- **Include filters only** → an entry is visible if at least one tag
  matches any include pattern.
- **Exclude filters only** → all entries are visible except those
  with a tag matching any exclude pattern.
- **Both** → exclude takes precedence. An entry is visible if it
  matches at least one include pattern AND does not match any exclude
  pattern.

#### New tables

```sql
CREATE TABLE IF NOT EXISTS mood_shares (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id       UUID NOT NULL REFERENCES users(id),
    shared_with   UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, shared_with),
    CHECK (user_id != shared_with)
);

CREATE TABLE IF NOT EXISTS mood_share_filters (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    mood_share_id UUID NOT NULL REFERENCES mood_shares(id) ON DELETE CASCADE,
    pattern       TEXT NOT NULL,          -- POSIX regex matched against tag names
    is_include    BOOLEAN NOT NULL,       -- true = include, false = exclude
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **`mood_shares`** — one row per (owner, viewer) pair. `user_id` is
  the mood owner, `shared_with` is the user who may see them.
- **`mood_share_filters`** — many-to-one on `mood_share_id`. Each
  row is a single regex pattern flagged as include (`is_include =
  true`) or exclude (`is_include = false`).
- A share with no filter rows means "share everything".
- A user can always see their own entries (enforced in query logic,
  not in these tables).
- `ON DELETE CASCADE` ensures filters are cleaned up when a share
  rule is removed.

#### Tag filter semantics

Given a share rule with filters `[f1, f2, ...]` and an entry with
tags `[t1, t2, ...]`:

```
includes = filters where is_include = true
excludes = filters where is_include = false

-- Step 1: if no filters at all, share everything
IF includes is empty AND excludes is empty THEN
    visible = TRUE

-- Step 2: apply include filters (whitelist)
ELSE IF includes is not empty THEN
    visible = ANY tag matches ANY include pattern
ELSE
    visible = TRUE

-- Step 3: apply exclude filters (blacklist, takes precedence)
IF excludes is not empty AND visible THEN
    IF ANY tag matches ANY exclude pattern THEN
        visible = FALSE
```

Entries with no tags: if any include filter exists, the entry has no
matching tags so it is hidden. If only exclude filters exist, the
entry has no matching tags so it stays visible.

#### Query changes

`get_mood_entries` currently accepts an explicit `user_ids` array.
Add a `viewer_id` parameter so the query can intersect the requested
user IDs with sharing permissions and tag filters:

```sql
-- Only return entries the viewer is allowed to see:
--   1. Entries belonging to the viewer themselves
--   2. Entries belonging to users who have shared with the viewer,
--      subject to tag include/exclude filters
WHERE (
    me.user_id = :viewer_id::uuid
    OR EXISTS (
        SELECT 1 FROM mood_shares ms
        WHERE ms.user_id = me.user_id
          AND ms.shared_with = :viewer_id::uuid
          -- Include filters: if any exist, entry must have a matching tag
          AND (
              NOT EXISTS (
                  SELECT 1 FROM mood_share_filters f
                  WHERE f.mood_share_id = ms.id AND f.is_include = true
              )
              OR EXISTS (
                  SELECT 1 FROM mood_share_filters f
                  JOIN mood_entry_tags met ON met.mood_entry_id = me.id
                  WHERE f.mood_share_id = ms.id
                    AND f.is_include = true
                    AND met.tag_name ~ f.pattern
              )
          )
          -- Exclude filters: entry must NOT have a matching tag
          AND NOT EXISTS (
              SELECT 1 FROM mood_share_filters f
              JOIN mood_entry_tags met ON met.mood_entry_id = me.id
              WHERE f.mood_share_id = ms.id
                AND f.is_include = false
                AND met.tag_name ~ f.pattern
          )
    )
)
```

The `users` query (used to build the timeline header and partner
info) is unaffected — it still returns all users. Sharing only
gates mood *entry* visibility.

#### GraphQL additions

```graphql
type ShareFilter {
  id: ID!
  pattern: String!              # POSIX regex
  isInclude: Boolean!           # true = include, false = exclude
}

type ShareRule {
  id: ID!
  user: User!                   # the user being shared with
  filters: [ShareFilter!]!     # empty = share all moods
}

# On User type
type User {
  ...
  sharedWith: [ShareRule!]!
}

# Mutations
input ShareFilterInput {
  pattern: String!
  isInclude: Boolean!
}

input ShareRuleInput {
  userId: ID!                   # the user to share with
  filters: [ShareFilterInput!]! # empty list = share all
}

input UpdateSharingInput {
  rules: [ShareRuleInput!]!     # full replacement list
}

extend type Mutation {
  updateSharing(input: UpdateSharingInput!): User!
}
```

`updateSharing` replaces the full sharing list (delete all existing
`mood_shares` + cascaded `mood_share_filters` for the authenticated
user, then insert the new set). The mutation reads `auth_user_id`
from context — users can only change their own sharing.

#### Resolver: `moodEntries`

Pass `viewer_id=info.context["auth_user_id"]` into the data layer so
the SQL filter applies. No more trusting the client to pass only
allowed `userIds`.

### 10.4 Backend Changes

| Layer      | File                              | Change                                                    |
|------------|-----------------------------------|-----------------------------------------------------------|
| Migration  | `migrations/0008.create-mood-shares.sql` | Create `mood_shares` and `mood_share_filters` tables |
| SQL        | `src/moods/sql/shares.sql`        | `get_shares_with_filters`, `delete_shares_for_user`, `create_share`, `create_share_filter` |
| SQL        | `src/moods/sql/moods.sql`         | Add `viewer_id` filter with tag-aware sharing logic to `get_mood_entries` |
| Data       | `src/moods/data/shares.py`        | New data-layer functions (get, set full replacement)      |
| Resolver   | `src/moods/resolvers/user.py`     | `User.sharedWith` field resolver (returns `ShareRule` + nested `ShareFilter` list), `updateSharing` mutation |
| Resolver   | `src/moods/resolvers/mood.py`     | Pass `viewer_id` from auth context to entry query         |
| Schema     | `src/moods/schema/user.graphql`   | `ShareFilter` type, `ShareRule` type, `sharedWith` field, inputs, mutation |
| Tests      | `tests/test_sharing.py`           | Sharing CRUD, visibility filtering, self-visibility, include filters, exclude filters, mixed with precedence, multiple filters per share, entries with no tags |

### 10.5 Web Frontend Changes

| File                                      | Change                                                         |
|-------------------------------------------|----------------------------------------------------------------|
| `web/src/moods/views/settings.cljs` (new) | Settings screen: avatar URL input, color picker, per-user sharing with dynamic list of include/exclude tag regex filters |
| `web/src/moods/events.cljs`               | `::fetch-settings`, `::save-settings`, `::update-sharing` events |
| `web/src/moods/subs.cljs`                 | `::user-settings`, `::shared-with` subscriptions               |
| `web/src/moods/gql.cljs`                  | `updateUserSettings` and `updateSharing` mutations, `sharedWith { id user { id name } filters { id pattern isInclude } }` in user query |
| `web/src/moods/views/timeline.cljs`       | Read `avatarUrl` / `color` from user settings for entry cards  |
| `web/src/moods/core.cljs`                 | Replace settings placeholder with real view                    |
| `web/src/moods/views/header.cljs`         | Link to settings page (gear icon)                              |

### 10.6 Android Changes

| File                                       | Change                                                        |
|--------------------------------------------|---------------------------------------------------------------|
| `android/app/(tabs)/settings.tsx` (new)    | Settings tab: avatar URL input, color picker, per-user sharing with dynamic list of include/exclude tag regex filters |
| `android/app/(tabs)/_layout.tsx`           | Add Settings tab to tab navigator                             |
| `android/lib/graphql/queries.ts`           | Add `sharedWith { id user { id name } filters { id pattern isInclude } }` to user queries |
| `android/lib/graphql/mutations.ts`         | Add `updateUserSettings` and `updateSharing` mutations        |
| `android/components/EntryCard.tsx`         | Read `avatarUrl` / `color` from user settings                 |

### 10.7 Avatar Resolution Logic

Both platforms use the same fallback chain:

1. `user.settings.avatarUrl` if non-empty → use directly
2. Otherwise → `gravatarUrl(user.email)`

### 10.8 Implementation Order

1. **Migration + SQL + data layer** for `mood_shares` and `mood_share_filters`
2. **GraphQL schema + resolvers** for sharing (`ShareRule`/`ShareFilter` types, `updateSharing` mutation)
3. **Update `get_mood_entries`** with `viewer_id` + filter-aware sharing query
4. **Tests** for sharing visibility (basic sharing, include filters, exclude filters, mixed with precedence, multiple filters per share, entries with no tags, self-visibility)
5. **Settings UI** (web then Android) — profile fields + per-user sharing rules with dynamic filter list
6. **Timeline rendering** — apply `avatarUrl` and `color` from settings

---

## 11. Open Questions

- ~~**Auth**: Full auth (JWT, OAuth) or simple shared-secret for a two-person app?~~ → **Decided: Email-based login codes.** Backend `sendLoginCode` emails a 6-digit code; `verifyLoginCode` returns a JWT. No user list is exposed on the login screen.
- **Hosting**: Self-hosted (VPS, home server) or managed (Fly.io, Railway)?
- ~~**Mood scale**: 1–10 numeric? Emoji picker? Both?~~ → **Decided: 1-10 ButtonGroup.**
- ~~**Privacy**: Any entries the partner should *not* see?~~ → **Decided: Per-user sharing.** Users explicitly choose who sees their mood entries via `mood_shares` table. See §10.3.

---

*This document is the living reference for the Moods project. Update it as
decisions are made and phases are completed.*

## Todos:

 - User settings
 - ~~mood delta~~ ✅

---

## 12. Soft Deletes, User Search, and Backend Restructuring

### 12.1 Soft Deletes for Sharing

`mood_shares` and `mood_share_filters` now use soft deletes via `archived_at`
columns (migration 0009). The `set_shares` operation archives existing shares
instead of hard-deleting them. All read queries and visibility subqueries
filter on `archived_at IS NULL`.

### 12.2 User Search

Trigram indexes on `users.name` and `users.email` (migration 0010) enable
fuzzy search via a new `searchUsers(search: String!): [User!]!` query. Both
web and Android settings screens now use a search box to find users to share
with, instead of listing all users.

### 12.3 Backend Restructuring

- **`services/`** — External service integrations. `email.py` moved here from
  `data/`.
- **`orchestration/`** — Multi-step business workflows. `auth.py` contains
  `send_login_code()` and `verify_login_code()`, which orchestrate DB queries,
  code generation, email sending, and JWT encoding.
- **`data/auth.py`** — Slimmed down to only `decode_token()` (pure JWT
  decode, used by `app.py` context).