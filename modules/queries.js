require('dotenv').config();

const crypto = require('crypto');

// eslint-disable-next-line prefer-destructuring
const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const getVaultBySourceId = async (request, response) => {
  const sourceId = parseInt(request.params.sourceId, 10);
  try {
    const results = await pool.query('SELECT * FROM vault WHERE sourceid = $1', [sourceId]);
    if (results.rowCount) {
      const row = results.rows[0];
      if (row.maintenance) {
        response.status(503).json({ error: true });
      } else {
        response.status(200).json({
          hostname: row.hostname,
          database: row.databasename,
          username: row.tallyrole,
          password: row.tallypassword,
          cert: row.tallyCert,
        });
      }
    } else {
      response.status(404).json({ error: true });
    }
  } catch (error) {
    response.status(500).json({ error: true });
    throw error;
  }
};

const createVault = async (request, response) => {
  const { sourceId } = request.body;
  try {
    let result = await pool.query('SELECT * FROM vault WHERE sourceid = $1', [sourceId]);
    if (result.rowCount) {
      response.status(409).json({ msg: 'Already exists' });
      return;
    }

    result = await pool.query('INSERT INTO vault (sourceid) VALUES ($1) RETURNING id', [sourceId]);
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
      response.status(500).json({ error: true });
      return;
    }
    const settings = result.rows[0];
    const nextVaultHostName = settings.nextvaulthostname;
    const vaultTemplateName = settings.vaulttemplatename;

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

    await pool.query('UPDATE vault SET hostname = $1, databasename = $2, tallyrole = $3, tallypassword = $4, adapterrole = $5, adapterpassword = $6 WHERE id = $7', [nextVaultHostName, databaseName, tallyRole, tallyPassword, adapterRole, adapterPassword, parseInt(id, 10)]);

    response.status(201).json({ id });
  } catch (error) {
    response.status(500).json({ error: true });
    throw error;
  }
};

module.exports = {
  getVaultBySourceId,
  createVault,
};
