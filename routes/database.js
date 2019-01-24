const express = require('express');

const router = express.Router();
const db = require('../modules/queries');

router.get('/:sourceId/connection/tally', db.getVaultBySourceId);

module.exports = router;
