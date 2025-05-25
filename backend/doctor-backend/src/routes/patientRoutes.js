// Patient routes
const express = require('express');
const router = express.Router();
const { getAllPatients, getTodayPatients, getPatientById, searchPatients } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Get all patients
router.get('/', getAllPatients);

// Get patients registered today
router.get('/today', getTodayPatients);

// Search patients
router.get('/search', searchPatients);

// Get patient by ID
router.get('/:id', getPatientById);

module.exports = router;