// Lab report model
const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    default: function() {
      return `LR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${this.patientId}`
    }
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ordered', 'in-progress', 'completed'],
    default: 'ordered'
  },
  filePath: String,
  findings: String,
  instructions: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nurse'
  },
  uploadedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('LabReport', labReportSchema);