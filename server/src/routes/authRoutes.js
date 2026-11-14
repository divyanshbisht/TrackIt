const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public Auth Endpoints
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp-and-signup', authController.verifyOtpAndSignup);
router.post('/login', authController.login);

// Protected Auth Endpoints
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
