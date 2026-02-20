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

---

## mood_entries

| Column      | Type          | Constraints            |
|-------------|---------------|------------------------|
| id          | uuid (v7)     | PK                     |
| user_id     | uuid          | NOT NULL, FK → users   |
| mood        | integer       | NOT NULL               |
| notes       | text          | NOT NULL               |
| created_at  | timestamptz   | NOT NULL, DEFAULT now() |
| archived_at | timestamptz   | NULL                   |

---

## tags

| Column      | Type        | Constraints            |
|-------------|-------------|------------------------|
| name        | text        | PK                     |
| metadata    | jsonb       | NOT NULL, DEFAULT '{}' |
| archived_at | timestamptz | NULL                   |

`name` is the natural key (e.g. `"anxious"`, `"grateful"`, `"energized"`).
`metadata` holds display details such as color, emoji, or icon name.

---

## mood_entry_tags

| Column        | Type    | Constraints                  |
|---------------|---------|------------------------------|
| mood_entry_id | uuid    | NOT NULL, FK → mood_entries  |
| tag_name      | text    | NOT NULL, FK → tags(name)    |

PK: (`mood_entry_id`, `tag_name`)

---

## Relationships

```
users 1──* mood_entries
mood_entries *──* tags  (via mood_entry_tags)
```
