const express = require('express');
const { sendVerificationEmail, verifyEmailOTP } = require('../controllers/email-auth');
const router = express.Router();

router.post('/send-verification', sendVerificationEmail);
router.post('/verify-email', verifyEmailOTP); 

module.exports = router;
