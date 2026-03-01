-- depends: 0011.add-user-icon

ALTER TABLE auth_codes
    ADD COLUMN failed_attempts integer NOT NULL DEFAULT 0;
