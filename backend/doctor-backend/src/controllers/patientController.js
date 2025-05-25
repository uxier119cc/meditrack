// Patient data operations
const Patient = require('../models/Patient');
const moment = require('moment');
const mongoose = require('mongoose');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get patients registered today
// @route   GET /api/patients/today
// @access  Private
const getTodayPatients = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day');
    const endOfDay = moment().endOf('day');

    const patients = await Patient.find({
      createdAt: {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate()
      }
    }).sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
// const getPatientById = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);

//     if (patient) {
//       res.json(patient);
//     } else {
//       res.status(404).json({ message: 'Patient not found' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };




const getPatientById = async (req, res) => {
  try {
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }

    const patient = await Patient.findById(req.params.id);

    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};







// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private
const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const patients = await Patient.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { patientId: { $regex: query, $options: 'i' } },
        { contact: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllPatients,
  getTodayPatients,
  getPatientById,
  searchPatients
};