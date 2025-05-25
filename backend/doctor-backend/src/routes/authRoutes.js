// Authentication routes
const express = require('express');
const router = express.Router();
const { registerDoctor, loginDoctor, getDoctorProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register a new doctor
router.post('/register', registerDoctor);

// Login doctor
router.post('/login', loginDoctor);

// Get doctor profile
router.get('/profile', protect, getDoctorProfile);

module.exports = router;