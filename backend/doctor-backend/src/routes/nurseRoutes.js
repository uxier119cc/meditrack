// Nurse management routes
const express = require('express');
const router = express.Router();
const { getAllNurses, addNurse, updateNurseStatus, getNurseActivityLogs } = require('../controllers/nurseController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Get all nurses
router.get('/', getAllNurses);

// Add a new nurse
router.post('/', addNurse);

// Update nurse status
router.put('/:id/status', updateNurseStatus);

// Get nurse activity logs
router.get('/activity-logs', getNurseActivityLogs);

module.exports = router;