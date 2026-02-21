-- UUIDv7 polyfill for PostgreSQL < 18
-- Generates RFC 9562 compliant UUID v7 values with millisecond precision

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
    unix_ms bigint;
    uuid_bytes bytea;
BEGIN
    unix_ms := extract(epoch FROM clock_timestamp()) * 1000;

    uuid_bytes := substring(int8send(unix_ms) FROM 3 FOR 6);

    uuid_bytes := uuid_bytes || gen_random_bytes(10);

    uuid_bytes := set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
    uuid_bytes := set_byte(uuid_bytes, 8, (b'10' || get_byte(uuid_bytes, 8)::bit(6))::bit(8)::int);

    RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;
