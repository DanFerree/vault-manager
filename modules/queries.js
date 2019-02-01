require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line prefer-destructuring
const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const getVaultBySourceId = async (sourceId) => {
  const results = await pool.query('SELECT * FROM vault WHERE source_id = $1', [sourceId]);
  if (results.rowCount) {
    const data = results.rows[0];
    if (data.maintenance) {
      return { status: 503 };
    }
    return { status: 200, data };
  }
  return { status: 404 };
};

const createVault = async (sourceId) => {
  let result = await pool.query('SELECT * FROM vault WHERE source_id = $1', [sourceId]);
  if (result.rowCount) {
    return { status: 409 };
  }

  result = await pool.query('INSERT INTO vault (source_id) VALUES ($1) RETURNING id', [sourceId]);
  // eslint-disable-next-line prefer-destructuring
  const id = result.rows[0].id;

  const databaseName = `vault_${id}`;
  const tallyRole = `vault_${id}_tally`;
  const tallyPassword = crypto.randomBytes(16).toString('hex');
  const adapterRole = `vault_${id}_adapter`;
  const adapterPassword = crypto.randomBytes(16).toString('hex');
  const apiRole = `vault_${id}_api`;

  // Clone database.
  result = await pool.query('SELECT * FROM settings LIMIT 1');
  if (result.rowCount === 0) {
    return { status: 500 };
  }
  const settings = result.rows[0];
  const nextVaultHostName = settings.next_vault_hostname;
  const vaultTemplateName = settings.vault_template_name;

  const nextPool = new Pool({
    user: process.env.PGUSER,
    hostname: nextVaultHostName,
    database: vaultTemplateName,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  await nextPool.query(`CREATE DATABASE ${databaseName} WITH TEMPLATE ${vaultTemplateName}`);
  await nextPool.query(`CREATE ROLE ${tallyRole} WITH LOGIN PASSWORD '${tallyPassword}'`);
  await nextPool.query(`CREATE ROLE ${adapterRole} WITH LOGIN PASSWORD '${adapterPassword}'`);
  await nextPool.query(`CREATE ROLE ${apiRole}`);

  await pool.query('UPDATE vault SET hostname = $1, database_name = $2, tally_role = $3, tally_password = $4, adapter_role = $5, adapter_password = $6 WHERE id = $7', [nextVaultHostName, databaseName, tallyRole, tallyPassword, adapterRole, adapterPassword, parseInt(id, 10)]);

  const absolutePath = path.resolve('modules/postsetup.sql');
  let sql = fs.readFileSync(absolutePath).toString();
  sql = sql.replace(/API_ROLE/g, apiRole)
    .replace(/TALLY_ROLE/g, tallyRole)
    .replace(/ADAPTER_ROLE/g, adapterRole)
    .replace(/VAULT_DATABASE/g, databaseName);

  const newPool = new Pool({
    user: process.env.PGUSER,
    hostname: nextVaultHostName,
    database: databaseName,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  await newPool.query(sql);

  return { status: 201, id };
};

module.exports = {
  getVaultBySourceId,
  createVault,
};
