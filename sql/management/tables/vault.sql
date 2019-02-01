CREATE TABLE vault (
  id BIGSERIAL PRIMARY KEY,
  source_id TEXT UNIQUE,
  hostname TEXT,
  database_name TEXT,
  tally_role TEXT,
  tally_password TEXT,
  tally_cert TEXT,
  adapter_role TEXT,
  adapter_password TEXT,
  maintenance BOOLEAN,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
