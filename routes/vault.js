/* eslint-disable no-console */
const express = require('express');

const router = express.Router();
const db = require('../modules/queries');

router.get('/:sourceId/connection/adapter', (request, response) => {
  const { sourceId } = request.params;
  db.getVaultBySourceId(sourceId)
    .then((result) => {
      switch (result.status) {
        case 200:
          response.status(200).json({
            hostname: result.data.hostname,
            database: result.data.database_name,
            username: result.data.adapter_role,
            password: result.data.adapter_password,
          });
          break;
        case 404:
          response.status(404).json({ msg: 'a record with sourceId does not exist.' });
          break;
        default:
          response.status(503).json({ msg: 'a record with sourceId is marked with maintenance field as true.' });
          break;
      }
    }).catch((error) => {
      response.status(500).json({ msg: 'internal server error.' });
      throw error;
    });
});
router.get('/:sourceId/connection/tally', (request, response) => {
  const { sourceId } = request.params;
  db.getVaultBySourceId(sourceId)
    .then((result) => {
      switch (result.status) {
        case 200:
          response.status(200).json({
            hostname: result.data.hostname,
            database: result.data.database_name,
            username: result.data.tally_role,
            password: result.data.tally_password,
          });
          break;
        case 404:
          response.status(404).json({ msg: 'a record with sourceId does not exist.' });
          break;
        default:
          response.status(503).json({ msg: 'a record with sourceId is marked with maintenance field as true.' });
          break;
      }
    }).catch((error) => {
      response.status(500).json({ msg: 'internal server error.' });
      throw error;
    });
});

router.post('/', (request, response) => {
  const { sourceId } = request.body;

  db.createVault(sourceId)
    .then((result) => {
      switch (result.status) {
        case 409:
          response.status(409).json({ msg: 'a record with sourceId does already exist.' });
          break;
        case 201:
          response.status(201).json({ id: result.id });
          break;
        case 500:
          response.status(500).json({ msg: 'internal server error.' });
          break;
        default:
          break;
      }
    }).catch((error) => {
      response.status(500).json({ msg: 'internal server error.' });
      throw error;
    });
});

module.exports = router;
