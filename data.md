# Moods — Data Model

---

## users

| Column      | Type        | Constraints            |
|-------------|-------------|------------------------|
| id          | uuid (v7)   | PK                     |
| name        | text        | NOT NULL               |
| email       | text        | NOT NULL, UNIQUE       |
| settings    | jsonb       | NOT NULL, DEFAULT '{}' |
| archived_at | timestamptz | NULL                   |

`settings` stores user preferences as JSON. Known keys:

| Key             | Type     | Description                                          |
|-----------------|----------|------------------------------------------------------|
| `avatarUrl`     | string   | URL for the user's avatar image                      |
| `color`         | string   | Hex color used in the timeline                       |
| `notifications` | string[] | Enabled notification types: `"reminder"`, `"shared_mood"` |

---

## mood_entries

| Column      | Type          | Constraints             |
|-------------|---------------|-------------------------|
| id          | uuid (v7)     | PK                      |
| user_id     | uuid          | NOT NULL, FK -> users   |
| mood        | integer       | NOT NULL                |
| notes       | text          | NOT NULL                |
| created_at  | timestamptz   | NOT NULL, DEFAULT now() |
| archived_at | timestamptz   | NULL                    |

Indexes: `idx_mood_entries_user_id`, `idx_mood_entries_created_at`

The `delta` field is computed at query time via a window function: `mood - lag(mood) over (partition by user_id order by id)`.

---

## tags

| Column      | Type        | Constraints            |
|-------------|-------------|------------------------|
| name        | text        | PK                     |
| metadata    | jsonb       | NOT NULL, DEFAULT '{}' |
| archived_at | timestamptz | NULL                   |

`name` is the natural key, stored lowercase (e.g. `"anxious"`, `"grateful"`).

`metadata` holds display details. Known keys:

| Key     | Type   | Description             |
|---------|--------|-------------------------|
| `color` | string | Hex color for the tag   |
| `emoji` | string | Emoji character         |
| `icon`  | string | Icon name               |

Index: `idx_tags_name_trgm` (GIN, pg_trgm) for trigram search/autocomplete.

---

## mood_entry_tags

| Column        | Type    | Constraints                  |
|---------------|---------|------------------------------|
| mood_entry_id | uuid    | NOT NULL, FK -> mood_entries |
| tag_name      | text    | NOT NULL, FK -> tags(name)   |

PK: (`mood_entry_id`, `tag_name`)

Index: `idx_mood_entry_tags_tag_name`

---

## auth_codes

| Column     | Type        | Constraints          |
|------------|-------------|----------------------|
| id         | uuid (v7)   | PK                   |
| user_id    | uuid        | NOT NULL, FK -> users|
| code       | text        | NOT NULL             |
| expires_at | timestamptz | NOT NULL             |
| used_at    | timestamptz | NULL                 |

Index: `idx_auth_codes_lookup` on (`user_id`, `code`) WHERE `used_at IS NULL`

A 6-digit code with a 10-minute TTL. `used_at` is set when the code is successfully verified.

---

## mood_shares

| Column      | Type        | Constraints                       |
|-------------|-------------|-----------------------------------|
| id          | uuid (v7)   | PK                                |
| user_id     | uuid        | NOT NULL, FK -> users (owner)     |
| shared_with | uuid        | NOT NULL, FK -> users (viewer)    |
| created_at  | timestamptz | NOT NULL, DEFAULT now()           |
| archived_at | timestamptz | NULL                              |

UNIQUE: (`user_id`, `shared_with`)
CHECK: `user_id != shared_with`

Index: `idx_mood_shares_lookup` on (`shared_with`, `user_id`)

A row means "the owner (`user_id`) shares their mood entries with the viewer (`shared_with`)".

---

## mood_share_filters

| Column        | Type        | Constraints                                  |
|---------------|-------------|----------------------------------------------|
| id            | uuid (v7)   | PK                                           |
| mood_share_id | uuid        | NOT NULL, FK -> mood_shares, ON DELETE CASCADE|
| pattern       | text        | NOT NULL                                     |
| is_include    | boolean     | NOT NULL                                     |
| created_at    | timestamptz | NOT NULL, DEFAULT now()                      |
| archived_at   | timestamptz | NULL                                         |

Optional regex filters attached to a share rule. `pattern` is a POSIX regex matched against tag names.

- `is_include = true` — only entries with a matching tag are shared
- `is_include = false` — entries with a matching tag are hidden
- Excludes take precedence over includes

When no include filters exist, all entries are visible (subject to excludes). Filters are deleted via CASCADE when the parent share is removed.

---

## user_device_tokens

| Column     | Type        | Constraints                    |
|------------|-------------|--------------------------------|
| id         | uuid (v7)   | PK                             |
| user_id    | uuid        | NOT NULL, FK -> users          |
| token      | text        | NOT NULL (Expo push token)     |
| created_at | timestamptz | NOT NULL, DEFAULT now()        |

UNIQUE: (`user_id`, `token`)

Index: `idx_device_tokens_user` on (`user_id`)

Stores Expo push notification tokens. No `archived_at` — tokens are hard-deleted when invalid (DeviceNotRegistered) or on user sign-out.

---

## Relationships

```
users 1──* mood_entries
users 1──* auth_codes
users 1──* mood_shares (as owner, via user_id)
users 1──* mood_shares (as viewer, via shared_with)
users 1──* user_device_tokens

mood_entries *──* tags  (via mood_entry_tags)

mood_shares 1──* mood_share_filters
```

---

## Migrations

| #    | Name                      | Description                             |
|------|---------------------------|-----------------------------------------|
| 0000 | uuidv7-polyfill           | Custom `uuidv7()` PostgreSQL function   |
| 0001 | create-users              | users table                             |
| 0002 | create-mood-entries       | mood_entries table with indexes         |
| 0003 | create-tags               | tags + mood_entry_tags junction table   |
| 0004 | add-user-settings         | settings JSONB column on users          |
| 0005 | add-user-archived-at      | archived_at column on users (soft-delete)|
| 0006 | tags-trgm-search          | pg_trgm extension + trigram index       |
| 0007 | create-auth-codes         | auth_codes table for email login        |
| 0008 | create-mood-shares        | mood_shares + mood_share_filters tables |
| 0009 | soft-delete-shares        | archived_at on mood_shares + mood_share_filters |
| 0010 | users-trgm-search         | Trigram indexes on users name + email   |
| 0011 | create-device-tokens      | Push notification device tokens         |
