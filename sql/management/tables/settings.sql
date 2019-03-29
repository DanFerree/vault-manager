CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  next_vault_hostname TEXT,
  next_vault_port integer DEFAULT 5432,
  vault_template_name TEXT
);
