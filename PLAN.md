# Moods — Remaining Improvements

Unchecked items from the original project plan. Work through these one at a time.

---

## Critical / Security

- [ ] **Rotate leaked Mailgun API key** — `.secrets.toml` contains a real API
  key. Rotate the key in Mailgun, scrub the old value from git history with
  `git filter-repo`, and verify `.secrets.toml` stays gitignored going forward.

- [ ] **Run Docker container as non-root** — The `Dockerfile` never creates or
  switches to a non-root user. Add `RUN useradd --create-home appuser` and
  `USER appuser` before the `CMD`.

## Infrastructure

- [ ] **Add PostgreSQL to `docker-compose.yml`** — The compose file assumes
  Postgres is running on the host. Add a `postgres` service with the right
  version, `pg_trgm` extension, port mapping (5433:5432), and a named volume
  for persistence. Add `depends_on` to the moods service.

## Developer Experience

- [ ] **Clean up `any` types in Android TypeScript** — `strict: true` is
  enabled (good) but undermined by widespread `any` casts in settings.tsx,
  queries, etc. Replace with proper types.

- [ ] **Add accessibility labels** — Android: add `accessibilityLabel` and
  `accessibilityRole` to mood buttons, FAB, close button, avatar images. Web:
  add `:aria-label` to icon-only buttons (refresh, mood number buttons).

- [ ] **Validate `EXPO_PUBLIC_APP_VARIANT` at runtime** —
  `android/lib/config.ts:3-4` silently falls through to `undefined` for
  unrecognized variants. Add a runtime check that throws for invalid values.

- [ ] **Pin `uv` version in Dockerfile** — `pip install --no-cache-dir uv`
  installs an unpinned version. Use `pip install --no-cache-dir uv==X.Y.Z`.

- [ ] **Add CI concurrency groups** — Neither workflow uses `concurrency:`
  to cancel stale runs. Add to both workflows:
  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
