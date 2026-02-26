-- depends: 0010.users-trgm-search
ALTER TABLE users ADD COLUMN icon text;
UPDATE users SET icon = 'https://www.gravatar.com/avatar/' || md5(lower(trim(email))) || '?s=80&d=retro';
ALTER TABLE users ALTER COLUMN icon SET NOT NULL;
