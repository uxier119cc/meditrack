// Lab report operations
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');

// @desc    Order a new lab test
// @route   POST /api/lab-reports
// @access  Private
const orderLabTest = async (req, res) => {
  try {
    const { patientId, name, instructions } = req.body;

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create lab report
    const labReport = new LabReport({
      patientId,
      orderedBy: req.doctor._id,
      name,
      instructions,
      status: 'ordered'
    });

    await labReport.save();

    res.status(201).json(labReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all lab reports for a patient
// @route   GET /api/lab-reports/patient/:patientId
// @access  Private
const getPatientLabReports = async (req, res) => {
  try {
    const labReports = await LabReport.find({ patientId: req.params.patientId })
      .populate('orderedBy', 'name')
      .populate('uploadedBy', 'name')
      .sort({ date: -1 });

    res.json(labReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update lab report status and findings
// @route   PUT /api/lab-reports/:id
// @access  Private
const updateLabReport = async (req, res) => {
  try {
    const { status, findings } = req.body;

    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({ message: 'Lab report not found' });
    }

    if (status) labReport.status = status;
    if (findings) labReport.findings = findings;

    await labReport.save();

    res.json(labReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload lab report file
// @route   POST /api/lab-reports/:id/upload
// @access  Private
const uploadLabReportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({ message: 'Lab report not found' });
    }

    labReport.filePath = `/uploads/lab-reports/${req.file.filename}`;
    labReport.status = 'completed';
    labReport.uploadedBy = req.doctor._id;
    labReport.uploadedAt = Date.now();

    await labReport.save();

    res.json(labReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download lab report as PDF
// @route   GET /api/lab-reports/:id/download
// @access  Private
const downloadLabReport = async (req, res) => {
  try {
    console.log('Download request for lab report:', req.params.id);
    
    const labReport = await LabReport.findById(req.params.id)
      .populate('patientId', 'name age gender patientId')
      .populate('orderedBy', 'name specialization');

    if (!labReport) {
      console.log('Lab report not found:', req.params.id);
      return res.status(404).json({ message: 'Lab report not found' });
    }

    console.log('Found lab report, generating PDF...');
    
    // Generate PDF - now returns both filePath and relativePath
    const { filePath, relativePath } = await generateLabReportPDF(labReport);
    console.log('PDF generated successfully at:', filePath);
    console.log('Relative path for browser access:', relativePath);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LabReport-${labReport._id}.pdf`);
    
    // Verify file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('Generated PDF file not found at path:', filePath);
      return res.status(500).json({ message: 'PDF file not found after generation' });
    }
    
    // Instead of directly sending the file, redirect to the URL that's served by the static middleware
    console.log('Redirecting to static URL for download:', relativePath);
    return res.redirect(302, relativePath);
  } catch (error) {
    console.error('Error downloading lab report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to generate lab report PDF
const generateLabReportPDF = async (labReport) => {
  return new Promise(async (resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      const path = require('path');
      
      // Use path relative to the project root for consistency with Express static middleware
      const rootDir = path.resolve(__dirname, '../../');
      const uploadDir = path.join(rootDir, 'uploads', 'lab-reports');
      
      console.log('PDF generation path:', uploadDir);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Create filename with timestamp to avoid cache issues
      const timestamp = Date.now();
      const fileName = `LabReport-${labReport._id}-${timestamp}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const relativePath = `/uploads/lab-reports/${fileName}`;
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Add header
      doc.fontSize(20).text('Laboratory Report', { align: 'center' });
      doc.moveDown();
      
      // Add doctor info if available
      if (labReport.orderedBy) {
        doc.fontSize(12).text(`Ordered by: Dr. ${labReport.orderedBy.name}`, { align: 'right' });
        if (labReport.orderedBy.specialization) {
          doc.fontSize(10).text(`${labReport.orderedBy.specialization}`, { align: 'right' });
        }
      }
      doc.moveDown();
      
      // Add line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Add patient info
      if (labReport.patientId) {
        doc.fontSize(12).text(`Patient: ${labReport.patientId.name}`);
        doc.fontSize(10).text(`ID: ${labReport.patientId.patientId}`);
        doc.fontSize(10).text(`Age/Gender: ${labReport.patientId.age} years / ${labReport.patientId.gender}`);
      }
      doc.moveDown();
      
      // Add report details
      doc.fontSize(14).text(`${labReport.name}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text('Date: ' + new Date(labReport.date).toLocaleDateString());
      doc.moveDown();
      
      // Add findings/summary if available
      if (labReport.findings) {
        doc.fontSize(12).text('Findings:');
        doc.fontSize(10).text(labReport.findings);
        doc.moveDown();
      }
      
      // Add parameters if available
      if (labReport.parameters && labReport.parameters.length > 0) {
        doc.fontSize(12).text('Test Results:');
        doc.moveDown(0.5);
        
        // Create a table-like structure for parameters
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [200, 100, 100, 100];
        
        // Table headers
        doc.font('Helvetica-Bold');
        doc.text('Test', tableLeft, tableTop);
        doc.text('Value', tableLeft + colWidths[0], tableTop);
        doc.text('Unit', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.font('Helvetica');
        
        let rowTop = tableTop + 20;
        
        // Add each parameter
        labReport.parameters.forEach((param, index) => {
          doc.text(param.name, tableLeft, rowTop);
          doc.text(param.value, tableLeft + colWidths[0], rowTop);
          doc.text(param.unit, tableLeft + colWidths[0] + colWidths[1], rowTop);
          doc.text(param.status, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowTop);
          
          rowTop += 20;
          
          // Add a light line between rows
          if (index < labReport.parameters.length - 1) {
            doc.moveTo(tableLeft, rowTop - 10)
               .lineTo(tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowTop - 10)
               .stroke('#eeeeee');
          }
        });
      }
      
      // Add footer
      doc.moveDown(2);
      doc.fontSize(10).text(`Report ID: ${labReport._id}`, { align: 'right' });
      if (labReport.uploadedAt) {
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Uploaded: ${new Date(labReport.uploadedAt).toLocaleDateString()}`, { align: 'right' });
      }
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve({ filePath, relativePath });
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
  orderLabTest,
  getPatientLabReports,
  updateLabReport,
  uploadLabReportFile,
  downloadLabReport
};