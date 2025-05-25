// Doctor authentication
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new doctor
// @route   POST /api/auth/register
// @access  Public
const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, phone } = req.body;

    // Check if doctor already exists
    const doctorExists = await Doctor.findOne({ email });

    if (doctorExists) {
      return res.status(400).json({ message: 'Doctor already exists' });
    }

    // Create doctor
    const doctor = await Doctor.create({
      name,
      email,
      password,
      specialization,
      phone
    });

    if (doctor) {
      res.status(201).json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        token: generateToken(doctor._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid doctor data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a doctor
// @route   POST /api/auth/login
// @access  Public
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for doctor email
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if doctor is active
    if (!doctor.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact administrator.' });
    }

    // Check if password matches
    const isMatch = await doctor.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    doctor.lastLogin = Date.now();
    await doctor.save();

    res.json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      token: generateToken(doctor._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get doctor profile
// @route   GET /api/auth/profile
// @access  Private
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id).select('-password');
    
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getDoctorProfile
};  