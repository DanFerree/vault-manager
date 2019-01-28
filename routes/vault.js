const express = require('express');

const router = express.Router();
const db = require('../modules/queries');

router.get('/:sourceId/connection/adapter', db.getVaultBySourceId);
router.post('/', db.createVault);

module.exports = router;