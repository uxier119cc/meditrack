// Prescription routes
const express = require('express');
const router = express.Router();
const { createPrescription, getPatientPrescriptions, getPrescriptionById, updatePrescriptionStatus } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Create a new prescription
router.post('/', createPrescription);

// Get all prescriptions for a patient
router.get('/patient/:patientId', getPatientPrescriptions);

// Get prescription by ID
router.get('/:id', getPrescriptionById);

// Update prescription status
router.put('/:id/status', updatePrescriptionStatus);

module.exports = router;