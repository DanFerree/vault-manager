require('dotenv').config();

// eslint-disable-next-line prefer-destructuring
const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const getVaultBySourceId = (request, response) => {
  const sourceId = parseInt(request.params.sourceId, 10);

  pool.query('SELECT * FROM vault WHERE sourceId = $1', [sourceId], (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rowCount) {
      const row = results.rows[0];
      if (row.maintenance) {
        response.status(503);
      } else {
        response.status(200).json({
          hostname: row.hostname,
          database: row.databaseName,
          username: row.tallyRole,
          password: row.tallyPassword,
          cert: row.tallyCert,
        });
      }
    } else {
      response.status(404);
    }
  });
};

module.exports = {
  getVaultBySourceId,
};
