#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d postgres <<-EOSQL
    CREATE DATABASE $DB_NAME;
    CREATE ROLE $DB_ROLE WITH LOGIN ENCRYPTED PASSWORD '$DB_PASSWORD';
    ALTER ROLE $DB_ROLE SUPERUSER;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "${DB_NAME}" -f ./sql/management/tables/settings.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "${DB_NAME}" -f ./sql/management/data/settings.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "${DB_NAME}" -f ./sql/management/tables/vault.sql