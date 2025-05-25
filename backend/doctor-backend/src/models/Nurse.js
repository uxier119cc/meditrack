// // Nurse model (shared with nurse app)
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// // This model should match the one used in the nurse app
// const nurseSchema = new mongoose.Schema({
//   nurseId: {type: String,unique: true},
//   name: {type: String, required: true  },
//   email: {type: String,required: true,unique: true},
//   password: {type: String,required: true},
//   role: {type: String,enum: ['Head Nurse', 'Staff Nurse', 'Junior Nurse'],default: 'Staff Nurse'},
//   department: {type: String,enum: ['General Medicine', 'Pediatrics', 'Surgery', 'Orthopedics', 'Cardiology'],default: 'General Medicine'}, 
//   status: {type: String,enum: ['Active', 'Inactive'],default: 'Active'},
// });






// // Pre-save middleware to generate nurseId and hash password
// nurseSchema.pre('save', async function(next) {
//   // Only generate nurseId for new nurses
//   if (this.isNew) {
//     const count = await mongoose.model('Nurse').countDocuments();
//     this.nurseId = `N${String(count + 1).padStart(4, '0')}`;
//   }

//   // Only hash password if it's modified
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// nurseSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('Nurse', nurseSchema);



// Nurse model (shared with nurse app)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This model should match the one used in the nurse app
const nurseSchema = new mongoose.Schema({
  nurseId: {type: String, unique: true},
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  role: {type: String, enum: ['Head Nurse', 'Staff Nurse', 'Junior Nurse'], default: 'Staff Nurse'},
  department: {type: String, enum: ['General Medicine', 'Pediatrics', 'Surgery', 'Orthopedics', 'Cardiology', 'Emergency', 'Neurology'], default: 'General Medicine'}, 
  departments: {type: String, enum: ['General Medicine', 'Pediatrics', 'Emergency', 'Cardiology', 'Orthopedics', 'Neurology']}, // Added for compatibility with nurse-backend
  status: {type: String, enum: ['Active', 'Inactive'], default: 'Active'},
});

// Pre-save middleware to generate nurseId and hash password
nurseSchema.pre('save', async function(next) {
  // Only generate nurseId for new nurses
  if (this.isNew) {
    const count = await mongoose.model('Nurse').countDocuments();
    this.nurseId = `N${String(count + 1).padStart(4, '0')}`;
  }

  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Ensure department and departments are in sync
  if (this.department && !this.departments) {
    this.departments = this.department;
  } else if (this.departments && !this.department) {
    this.department = this.departments;
  }
  
  next();
});

nurseSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Nurse', nurseSchema);