const express = require('express');
const { facebookLogin } = require('../controllers/facebooka-auth'); // Adjust the path as needed

const router = express.Router();

// POST route for Facebook login
router.post('/facebook', facebookLogin);

module.exports = router;
