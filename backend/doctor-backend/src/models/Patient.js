// // Patient model (shared with nurse app)
// const mongoose = require('mongoose');

// // This model should match the one used in the nurse app
// const patientSchema = new mongoose.Schema({
//   patientId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   age: {
//     type: Number,
//     required: true
//   },
//   gender: {
//     type: String,
//     required: true,
//     enum: ['Male', 'Female', 'Other']
//   },
//   contact: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String
//   },
//   address: {
//     type: String
//   },
//   bloodGroup: {
//     type: String
//   },
//   allergies: [String],
//   medicalHistory: [String],
//   documents: [{
//     name: String,
//     filePath: String,
//     fileType: String,
//     uploadedBy: String,
//     uploadedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   visits: [{
//     date: {
//       type: Date,
//       default: Date.now
//     },
//     chiefComplaint: String,
//     diagnosis: String,
//     treatment: String,
//     notes: String,
//     vitalSigns: {
//       temperature: String,
//       bloodPressure: String,
//       heartRate: String,
//       respiratoryRate: String,
//       oxygenSaturation: String,
//       weight: String,
//       height: String,
//       bmi: String
//     },
//     recordedBy: String
//   }],
//   photoUrl: String,
//   idProofUrl: String,
//   createdBy: String,
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Patient', patientSchema);  




const mongoose = require("mongoose")

const visitSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  weight: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  BP: {
    type: String,
    required: true,
  },
  heartRate: {
    type: Number,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  chiefComplaint: {
    type: String,
    default: "Regular checkup",
  },
  bmi: {
    type: String,
  },
  bmiCategory: {
    type: String,
  },
  notes: {
    type: String,
  },
})

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Nurse",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    contact: {
      type: String,
      required: true,
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String
    },
    medicalHistory: {
      type: String,
      default: "",
    },
    photo: {
      type: String,
    },
    photoUploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nurse",
    },
    idProof: {
      type: String,
    },
    idProofUploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nurse",
    },
    documents: [documentSchema],
    visits: [visitSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Patient', patientSchema)

