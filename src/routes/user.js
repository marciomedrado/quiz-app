const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');

router.get('/me', requireAuth, (req, res) => {
    res.json(req.user);
});

module.exports = router;
