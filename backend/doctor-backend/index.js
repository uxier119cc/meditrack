// Main server file
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
// app.use(cors());
// index.js (already in your backend)

// Make sure your CORS configuration looks like this:
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/prescriptions', require('./src/routes/prescriptionRoutes'));
app.use('/api/lab-reports', require('./src/routes/labReportRoutes'));
app.use('/api/nurses', require('./src/routes/nurseRoutes'));
app.use('/api/chatbot', require('./src/routes/chatbotRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});