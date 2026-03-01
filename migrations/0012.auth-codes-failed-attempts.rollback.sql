-- depends: 0012.auth-codes-failed-attempts

ALTER TABLE auth_codes
    DROP COLUMN failed_attempts;
