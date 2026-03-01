#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    CREATE USER moods WITH PASSWORD '$MOODS_DB_PASSWORD';
    CREATE DATABASE moods OWNER moods;

    CREATE USER moods_dev WITH PASSWORD '$MOODS_DEV_DB_PASSWORD';
    CREATE DATABASE moods_dev OWNER moods_dev;
EOSQL
