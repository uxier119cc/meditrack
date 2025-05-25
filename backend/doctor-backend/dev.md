# Developer Notes: doctor-backend

## Overview
This backend provides RESTful APIs for managing doctors, nurses, patients, prescriptions, and lab reports. It uses Node.js, Express, MongoDB (via Mongoose), and supports authentication with JWT. File uploads (e.g., lab reports) are handled with Multer. CORS is enabled for frontend integration.

## Project Structure
- `index.js`: Main entry point. Sets up Express, CORS, connects to MongoDB, and mounts all routes.
- `package.json`: Lists dependencies (express, mongoose, dotenv, cors, jsonwebtoken, multer, pdfkit, etc.).
- `.env`: Environment variables (e.g., DB connection, JWT secret, frontend URL).
- `src/config/db.js`: Database connection logic.
- `src/controllers/`: Contains business logic for each resource (auth, nurse, patient, prescription, labReport).
- `src/models/`: Mongoose schemas for Doctor, Nurse, Patient, Prescription, LabReport.
- `src/routes/`: Express routers for each resource.
- `src/middleware/`: Auth middleware (JWT), file upload middleware.
- `uploads/`: Stores uploaded files (lab reports, etc.).

## Key Files and Their Functionality

### Models
- **Doctor.js**: Doctor schema (name, email, password, specialization, etc.).
- **Nurse.js**: Nurse schema (name, email, password, role, department, status, etc.).
- **Patient.js**: Patient schema (demographics, contact, medical history, visits, etc.).
- **Prescription.js**: Prescription schema (patient, doctor, medicines, status, etc.).
- **LabReport.js**: Lab report schema (patient, doctor, test details, status, file, findings, etc.).

### Controllers
- **authController.js**: Handles doctor registration, login, profile fetching.
- **nurseController.js**: CRUD for nurses, status updates, activity logs.
- **patientController.js**: Fetch/search patients, get today's patients, get by ID.
- **prescriptionController.js**: Create, fetch, update status of prescriptions.
- **labReportController.js**: Order tests, fetch/update/upload lab reports.

### Middleware
- **authMiddleware.js**: JWT-based route protection.
- **uploadMiddleware.js**: Multer config for file uploads.

### Routes
- **authRoutes.js**: `/api/auth` - Doctor register, login, profile.
- **nurseRoutes.js**: `/api/nurses` - Get/add nurses, update status, activity logs.
- **patientRoutes.js**: `/api/patients` - Get/search patients, today's patients, get by ID.
- **prescriptionRoutes.js**: `/api/prescriptions` - Create/fetch/update prescriptions.
- **labReportRoutes.js**: `/api/lab-reports` - Order/fetch/update/upload lab reports.

## API Endpoints and Postman Testing

### Auth
- `POST /api/auth/register` — Register a new doctor. Body: `{ name, email, password, specialization }`
- `POST /api/auth/login` — Doctor login. Body: `{ email, password }`
- `GET /api/auth/profile` — Get doctor profile (JWT required).

### Nurses
- `GET /api/nurses/` — List all nurses (JWT required).
- `POST /api/nurses/` — Add new nurse. Body: `{ name, email, password, role, department }` (JWT required)
- `PUT /api/nurses/:id/status` — Update nurse status. Body: `{ status }` (JWT required)
- `GET /api/nurses/activity-logs` — Get nurse activity logs (JWT required)

### Patients
- `GET /api/patients/` — List all patients (JWT required).
- `GET /api/patients/today` — Patients registered today (JWT required).
- `GET /api/patients/search?query=...` — Search patients (JWT required).
- `GET /api/patients/:id` — Get patient by ID (JWT required)

### Prescriptions
- `POST /api/prescriptions/` — Create prescription. Body: `{ patientId, doctorId, medicines, ... }` (JWT required)
- `GET /api/prescriptions/patient/:patientId` — Get all prescriptions for a patient (JWT required)
- `GET /api/prescriptions/:id` — Get prescription by ID (JWT required)
- `PUT /api/prescriptions/:id/status` — Update prescription status. Body: `{ status }` (JWT required)

### Lab Reports
- `POST /api/lab-reports/` — Order lab test. Body: `{ patientId, doctorId, testType, ... }` (JWT required)
- `GET /api/lab-reports/patient/:patientId` — Get all lab reports for a patient (JWT required)
- `PUT /api/lab-reports/:id` — Update lab report details (JWT required)
- `POST /api/lab-reports/:id/upload` — Upload lab report file (form-data: `labReport` file) (JWT required)

## How to Test with Postman
1. **Authenticate**: Register/login as doctor. Use returned JWT as Bearer Token for protected routes.
2. **Nurse Management**: Use `/api/nurses` endpoints to add/list/update nurses.
3. **Patient Management**: Use `/api/patients` endpoints to fetch/search patients.
4. **Prescriptions**: Use `/api/prescriptions` endpoints to create/fetch/update prescriptions.
5. **Lab Reports**: Use `/api/lab-reports` endpoints to order/fetch/update/upload lab reports.
6. **File Uploads**: For endpoints accepting files (e.g., lab report upload), use Postman's form-data mode.

---

# Developer Notes: nurse-backend

## Overview
This backend provides RESTful APIs for nurse-side operations: nurse registration/login, patient management, visit recording, and document uploads. Built with Node.js, Express, MongoDB (Mongoose), JWT, and Multer for file uploads.

## Project Structure
- `index.js`: Main entry point. Sets up Express, CORS, connects to MongoDB, and mounts all routes.
- `package.json`: Lists dependencies (express, mongoose, dotenv, cors, jsonwebtoken, multer, firebase-admin, uuid, etc.).
- `.env`: Environment variables (DB connection, JWT secret, etc.).
- `src/config/`: DB and Firebase config.
- `src/controllers/`: Business logic for nurse, patient, and visit operations.
- `src/models/`: Mongoose schemas for Nurse, Patient, Visit.
- `src/routes/`: Express routers for nurse, patient, visit APIs.
- `src/middleware/`: Auth middleware (JWT), file upload middleware.
- `uploads/`: Stores uploaded files (if any).

## Key Files and Their Functionality

### Models
- **Nurse.js**: Nurse schema (name, email, password, role, department, status, etc.).
- **Patient.js**: Patient schema (demographics, contact, medical history, documents, visits, etc.).
- **Visit.js**: Visit schema (patientId, date, weight, height, BP, heartRate, temperature, etc.).

### Controllers
- **nurseController.js**: (If used) Handles nurse business logic.
- **patientController.js**: Register patient, add visit, generate patient IDs.
- **visitController.js**: Add new visit records.

### Middleware
- **authMiddleware.js**: JWT-based route protection.
- **uploadMiddleware.js**: Multer config for file uploads.

### Routes
- **nurseRoutes.js**: `/api/nurse` - Signup, login, update status.
- **patientRoutes.js**: `/api/patient` - Register, upload docs, list/get patients, add visits, upload profile/id, fetch photos/docs.
- **visitRoutes.js**: `/api/visit` - Add new visit.

## API Endpoints and Postman Testing

### Nurses
- `POST /api/nurse/signup` — Register nurse. Body: `{ name, email, password, role, department }`
- `POST /api/nurse/login` — Login nurse. Body: `{ email, password }`
- `PATCH /api/nurse/status/:id` — Update nurse status. Body: `{ status }` (JWT required)

### Patients
- `POST /api/patient/register` — Register patient. Body: `{ name, age, gender, contact, ... }`
- `POST /api/patient/upload/:patientId/documents` — Upload patient documents (form-data, files, patientId)
- `GET /api/patient/:patientId/documents` — List patient documents
- `GET /api/patient/:patientId/documents/:documentId` — Download a document
- `DELETE /api/patient/:patientId/documents/:documentId` — Delete a document
- `GET /api/patient/list` — List all patients
- `GET /api/patient/:id` — Get patient by ID
- `POST /api/patient/visit` — Add visit to patient. Body: `{ patientId, visit: {...} }`
- `GET /api/patient/:id/visits` — List all visits for a patient
- `POST /api/patient/upload/:patientId/profile` — Upload photo/id proof (form-data: photo, idProof)
- `GET /api/patient/:patientId/photo` — Get patient photo
- `GET /api/patient/:patientId/idproof` — Get patient ID proof

### Visits
- `POST /api/visit/add` — Add a new visit. Body: `{ patientId, date, weight, height, bp, heartRate, temperature }`

## How to Test with Postman
1. **Nurse Auth**: Register/login nurse, use token for protected endpoints.
2. **Patient Management**: Register, upload docs, fetch, list, upload profile/id, get photos, etc.
3. **Visits**: Add and fetch visit records.
4. **File Uploads**: Use form-data in Postman for endpoints accepting files.

---

## Notes
- All JWT-protected routes require the `Authorization: Bearer <token>` header.
- For file uploads, use Postman's form-data mode and select files as needed.
- Ensure MongoDB and backend are running before testing.
- Adjust CORS/frontend URL in `.env` if needed.

---

For any new developer, review the models first to understand the data flow, then check the controllers and routes for business logic and API structure. Use Postman collections for API testing and validation.