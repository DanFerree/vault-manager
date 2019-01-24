const express = require('express');

const router = express.Router();

const db = require('../modules/queries');

/* GET users listing. */
router.get('/:sourceId/connection/adapter', db.getVaultBySourceId);

module.exports = router;
