// Prescription operations
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private
const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      diagnosis,
      clinicalNotes,
      medications,
      specialInstructions,
      followUp,
      status
    } = req.body;

    // Generate a new ID with the month and date
    const currentDate = new Date();
    const formattedDate = `${currentDate.getMonth() + 1}${currentDate.getDate()}`; // MMDD format
    const prescriptionId = `RX-${formattedDate}-${uuidv4()}`;

    // Validate medications field
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        message: 'Medications must be a non-empty array of objects',
      });
    }

    // Check if patient exists - handle both ObjectId and custom patient IDs
    let patient;
    try {
      // First try to find by MongoDB _id if it looks like an ObjectId
      if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
        patient = await Patient.findById(patientId);
      }
      
      // If not found, try to find by custom patientId field
      if (!patient) {
        patient = await Patient.findOne({ patientId: patientId });
      }
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
    } catch (error) {
      console.error('Error finding patient:', error);
      return res.status(400).json({ message: 'Invalid patient ID format or patient not found' });
    }

    // Create prescription
    const prescription = new Prescription({
      prescriptionId, // Use the new ID
      patientId,
      doctorId: req.doctor._id,
      diagnosis,
      clinicalNotes,
      medications,
      specialInstructions,
      followUp,
      status: status || 'final'
    });

    await prescription.save();

    // Generate PDF if status is final
    if (status !== 'draft') {
      const pdfPath = await generatePrescriptionPDF(prescription, patient, req.doctor);
      prescription.pdfUrl = pdfPath;
      await prescription.save();
    }

    res.status(201).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialization')
      .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name age gender patientId')
      .populate('doctorId', 'name specialization');

    if (prescription) {
      res.json(prescription);
    } else {
      res.status(404).json({ message: 'Prescription not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update prescription status
// @route   PUT /api/prescriptions/:id/status
// @access  Private
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Only allow updating from draft to final
    if (prescription.status === 'draft' && status === 'final') {
      prescription.status = 'final';

      // Generate PDF
      const patient = await Patient.findById(prescription.patientId);
      const pdfPath = await generatePrescriptionPDF(prescription, patient, req.doctor);
      prescription.pdfUrl = pdfPath;

      await prescription.save();

      res.json(prescription);
    } else {
      res.status(400).json({ message: 'Invalid status update' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate PDF
const generatePrescriptionPDF = async (prescription, patient, doctor) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get all prescriptions for this patient to determine sequence number, excluding the current one
      const existingPrescriptions = await Prescription.find({ 
        patientId: patient._id,
        _id: { $ne: prescription._id } // Exclude the current prescription
      });
      
      // Always start from 1 for the first prescription
      const sequenceNumber = (existingPrescriptions.length + 1).toString().padStart(3, '0');
      // Create new filename format: PRXN-patientId-sequenceNumber
      const fileName = `PRXN-${patient.patientId}-${sequenceNumber}.pdf`;
      const filePath = path.join('uploads', 'prescriptions', fileName);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Add header
      doc.fontSize(20).text('Medical Prescription', { align: 'center' });
      doc.moveDown();
      
      // Add doctor info
      doc.fontSize(12).text(`Dr. ${doctor.name}`, { align: 'right' });
      doc.fontSize(10).text(`${doctor.specialization}`, { align: 'right' });
      doc.moveDown();
      
      // Add line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Add patient info
      doc.fontSize(12).text(`Patient: ${patient.name}`);
      doc.fontSize(10).text(`ID: ${patient.patientId}`);
      doc.fontSize(10).text(`Age/Gender: ${patient.age} years / ${patient.gender}`);
      doc.moveDown();
      
      // Add prescription details
      doc.fontSize(12).text('Diagnosis:');
      doc.fontSize(10).text(prescription.diagnosis);
      doc.moveDown();
      
      if (prescription.clinicalNotes) {
        doc.fontSize(12).text('Clinical Notes:');
        doc.fontSize(10).text(prescription.clinicalNotes);
        doc.moveDown();
      }
      
      // Add medications
      doc.fontSize(12).text('Medications:');
      doc.moveDown();
      
      prescription.medications.forEach((med, index) => {
        doc.fontSize(10).text(`${index + 1}. ${med.medicine}`);
        doc.fontSize(9).text(`   Dosage: ${med.dosage}`);
        doc.fontSize(9).text(`   Duration: ${med.duration}`);
        if (med.notes) {
          doc.fontSize(9).text(`   Instructions: ${med.notes}`);
        }
        doc.moveDown(0.5);
      });
      
      if (prescription.specialInstructions) {
        doc.moveDown();
        doc.fontSize(12).text('Special Instructions:');
        doc.fontSize(10).text(prescription.specialInstructions);
      }
      
      if (prescription.followUp) {
        doc.moveDown();
        doc.fontSize(12).text('Follow-up:');
        doc.fontSize(10).text(`After ${prescription.followUp}`);
      }
      
      // Add footer
      doc.moveDown(2);
      doc.fontSize(10).text(`Date: ${new Date(prescription.date).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(10).text("Doctor's Signature:", { align: 'right' });
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve(`/uploads/prescriptions/${fileName}`);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus
};