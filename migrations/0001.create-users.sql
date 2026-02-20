-- Create users table

CREATE TABLE IF NOT EXISTS users (
    id          uuid        PRIMARY KEY DEFAULT uuidv7(),
    name        text        NOT NULL,
    email       text        NOT NULL UNIQUE
);
