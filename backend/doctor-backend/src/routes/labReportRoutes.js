// Lab report routes
const express = require('express');
const router = express.Router();
const { orderLabTest, getPatientLabReports, updateLabReport, uploadLabReportFile, downloadLabReport } = require('../controllers/labReportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all routes
router.use(protect);

// Order a new lab test
router.post('/', orderLabTest);

// Get all lab reports for a patient
router.get('/patient/:patientId', getPatientLabReports);

// Update lab report status and findings
router.put('/:id', updateLabReport);

// Upload lab report file
router.post('/:id/upload', upload.single('labReport'), uploadLabReportFile);

// Download lab report as PDF
router.get('/:id/download', downloadLabReport);

module.exports = router;