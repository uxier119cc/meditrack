// // Nurse management
// const Nurse = require('../models/Nurse');
// const Patient = require('../models/Patient');
// const bcrypt = require('bcryptjs');

// // @desc    Get all nurses
// // @route   GET /api/nurses
// // @access  Private
// const getAllNurses = async (req, res) => {
//   try {
//     const nurses = await Nurse.find().select('-password').sort({ name: 1 });
//     res.json(nurses);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Add a new nurse
// // @route   POST /api/nurses
// // @access  Private
// const addNurse = async (req, res) => {
//   try {
//     const { name, email, password, role, department } = req.body;

//     // Validate required fields
//     if (!name || !email || !password || !role || !department ) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Check if nurse already exists
//     const nurseExists = await Nurse.findOne({ email });
//     if (nurseExists) {
//       return res.status(400).json({ message: 'Nurse already exists with this email' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create nurse
//     const nurse = new Nurse({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || 'Staff Nurse',
//       department: department || 'General Medicine',
//       // registrationNumber: `RN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
//       // joinDate: new Date()
//     });

//     await nurse.save();

//     res.status(201).json({
//       message: "Nurse registered successfully!",
//       nurse: {
//         _id: nurse._id,
//         nurseId: nurse.nurseId,
//         name: nurse.name,
//         email: nurse.email,
//         role: nurse.role,
//         department: nurse.department,
//         status: nurse.status,
//         // registrationNumber: nurse.registrationNumber
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Update nurse status
// // @route   PUT /api/nurses/:id/status
// // @access  Private
// const updateNurseStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!['Active', 'Inactive'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status value' });
//     }

//     const nurse = await Nurse.findById(req.params.id);

//     if (!nurse) {
//       return res.status(404).json({ message: 'Nurse not found' });
//     }

//     nurse.status = status;
//     await nurse.save();

//     res.json({
//       _id: nurse._id,
//       name: nurse.name,
//       email: nurse.email,
//       status: nurse.status
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Get nurse activity logs
// // @route   GET /api/nurses/activity-logs
// // @access  Private
// const getNurseActivityLogs = async (req, res) => {
//   try {
//     // Get recent patient registrations
//     const recentRegistrations = await Patient.find()
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .select('patientId name createdAt createdBy');
    
//     // Get recent document uploads
//     const patientsWithDocuments = await Patient.find({ 'documents.0': { $exists: true } })
//       .sort({ 'documents.uploadedAt': -1 })
//       .limit(50)
//       .select('patientId name documents');
    
//     // Get recent visits
//     const patientsWithVisits = await Patient.find({ 'visits.0': { $exists: true } })
//       .sort({ 'visits.date': -1 })
//       .limit(50)
//       .select('patientId name visits');
    
//     // Combine and format activity logs
//     const activityLogs = [];
    
//     // Add registrations to logs
//     recentRegistrations.forEach(patient => {
//       activityLogs.push({
//         nurseId: patient.createdBy || 'Unknown',
//         action: 'Patient Registration',
//         patientId: patient.patientId,
//         timestamp: patient.createdAt,
//         details: `Registered new patient ${patient.name}`
//       });
//     });
    
//     // Add document uploads to logs
//     patientsWithDocuments.forEach(patient => {
//       patient.documents.forEach(doc => {
//         activityLogs.push({
//           nurseId: doc.uploadedBy || 'Unknown',
//           action: 'Uploaded Documents',
//           patientId: patient.patientId,
//           timestamp: doc.uploadedAt,
//           details: `Uploaded ${doc.name} for ${patient.name}`
//         });
//       });
//     });
    
//     // Add visits to logs
//     patientsWithVisits.forEach(patient => {
//       patient.visits.forEach(visit => {
//         activityLogs.push({
//           nurseId: visit.recordedBy || 'Unknown',
//           action: 'Recorded Visit',
//           patientId: patient.patientId,
//           timestamp: visit.date,
//           details: `Recorded visit for ${patient.name} (${visit.chiefComplaint || 'Regular checkup'})`
//         });
//       });
//     });
    
//     // Sort by timestamp (newest first)
//     activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
//     // Limit to 100 most recent activities
//     const recentLogs = activityLogs.slice(0, 100);
    
//     res.json(recentLogs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = {
//   getAllNurses,
//   addNurse,
//   updateNurseStatus,
//   getNurseActivityLogs
// };








// Nurse management
const Nurse = require('../models/Nurse');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');

// @desc    Get all nurses
// @route   GET /api/nurses
// @access  Private
const getAllNurses = async (req, res) => {
  try {
    const nurses = await Nurse.find().select('-password').sort({ name: 1 });
    res.json(nurses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a new nurse
// @route   POST /api/nurses
// @access  Private
const addNurse = async (req, res) => {
  try {
    const { name, email, password, role, department, departments } = req.body;
    
    // Use either department or departments field
    const nurseDepart = department || departments;

    // Validate required fields
    if (!name || !email || !password || !role || !nurseDepart) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if nurse already exists
    const nurseExists = await Nurse.findOne({ email });
    if (nurseExists) {
      return res.status(400).json({ message: 'Nurse already exists with this email' });
    }

    // Create nurse - password will be hashed in pre-save hook
    const nurse = new Nurse({
      name,
      email,
      password,
      role: role || 'Staff Nurse',
      department: nurseDepart,
      departments: nurseDepart,
    });

    await nurse.save();

    res.status(201).json({
      message: "Nurse registered successfully!",
      nurse: {
        _id: nurse._id,
        nurseId: nurse.nurseId,
        name: nurse.name,
        email: nurse.email,
        role: nurse.role,
        department: nurse.department,
        departments: nurse.departments,
        status: nurse.status,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update nurse status
// @route   PUT /api/nurses/:id/status
// @access  Private
const updateNurseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Normalize status to ensure consistent capitalization
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (!['Active', 'Inactive'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const nurse = await Nurse.findById(req.params.id);

    if (!nurse) {
      return res.status(404).json({ message: 'Nurse not found' });
    }

    nurse.status = normalizedStatus;
    await nurse.save();

    res.json({
      _id: nurse._id,
      nurseId: nurse.nurseId,
      name: nurse.name,
      email: nurse.email,
      role: nurse.role,
      department: nurse.department,
      departments: nurse.departments,
      status: nurse.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get nurse activity logs
// @route   GET /api/nurses/activity-logs
// @access  Private
const getNurseActivityLogs = async (req, res) => {
  try {
    // Get recent patient registrations
    const recentRegistrations = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('patientId name createdAt createdBy');
    
    // Get recent document uploads
    const patientsWithDocuments = await Patient.find({ 'documents.0': { $exists: true } })
      .sort({ 'documents.uploadedAt': -1 })
      .limit(50)
      .select('patientId name documents');
    
    // Get recent visits
    const patientsWithVisits = await Patient.find({ 'visits.0': { $exists: true } })
      .sort({ 'visits.date': -1 })
      .limit(50)
      .select('patientId name visits');
    
    // Combine and format activity logs
    const activityLogs = [];
    
    // Add registrations to logs
    recentRegistrations.forEach(patient => {
      activityLogs.push({
        nurseId: patient.createdBy || 'Unknown',
        action: 'Patient Registration',
        patientId: patient.patientId,
        timestamp: patient.createdAt,
        details: `Registered new patient ${patient.name}`
      });
    });
    
    // Add document uploads to logs
    patientsWithDocuments.forEach(patient => {
      patient.documents.forEach(doc => {
        activityLogs.push({
          nurseId: doc.uploadedBy || 'Unknown',
          action: 'Uploaded Documents',
          patientId: patient.patientId,
          timestamp: doc.uploadedAt,
          details: `Uploaded ${doc.name} for ${patient.name}`
        });
      });
    });
    
    // Add visits to logs
    patientsWithVisits.forEach(patient => {
      patient.visits.forEach(visit => {
        activityLogs.push({
          nurseId: visit.recordedBy || 'Unknown',
          action: 'Recorded Visit',
          patientId: patient.patientId,
          timestamp: visit.date,
          details: `Recorded visit for ${patient.name} (${visit.chiefComplaint || 'Regular checkup'})`
        });
      });
    });
    
    // Sort by timestamp (newest first)
    activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 100 most recent activities
    const recentLogs = activityLogs.slice(0, 100);
    
    res.json(recentLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllNurses,
  addNurse,
  updateNurseStatus,
  getNurseActivityLogs
};

