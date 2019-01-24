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
  const sourceId = parseInt(request.params.id, 10);

  pool.query('SELECT * FROM vault WHERE sourceId = $1', [sourceId], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

module.exports = {
  getVaultBySourceId,
};
