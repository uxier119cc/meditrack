
// Mock data for patients
const patients = [
  {
    id: 'P001',
    name: 'Rahul Sharma',
    age: 45,
    gender: 'Male',
    bloodType: 'B+',
    phone: '9876543210',
    email: 'rahul.s@example.com',
    address: '123 Village Road, Green District',
    reason: 'Fever and headache',
    lastVisit: '22 Feb 2025',
    vitals: {
      bloodPressure: '130/85 mmHg',
      pulse: '78 bpm',
      temperature: '98.6°F',
      respiratoryRate: '16/min',
      spo2: '98%'
    },
    allergies: ['Penicillin', 'Dust Mites'],
    medicalHistory: [
      'Essential Hypertension (I10)',
      'Migraine without aura (G43.0)'
    ],
    visits: [
      {
        date: '10/12/2023',
        complaint: 'Fever and headache',
        diagnosis: 'Acute viral nasopharyngitis (J00)',
        prescriptions: [
          {
            medicine: 'Tab. Paracetamol 500mg',
            dosage: '1-0-1',
            duration: '5 days',
            instructions: 'Take after meals'
          },
          {
            medicine: 'Tab. Cetirizine 10mg',
            dosage: '0-0-1',
            duration: '3 days',
            instructions: 'Take at bedtime'
          }
        ]
      },
      {
        date: '15/9/2023',
        complaint: 'Joint pain',
        diagnosis: 'Arthralgia (M25.5)',
        prescriptions: [
          {
            medicine: 'Tab. Ibuprofen 400mg',
            dosage: '1-0-1',
            duration: '7 days',
            instructions: 'Take after meals'
          },
          {
            medicine: 'Tab. Calcium + Vitamin D3',
            dosage: '0-1-0',
            duration: '30 days',
            instructions: 'Take with lunch'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'CBC001',
        name: 'Complete Blood Count (CBC)',
        date: '12/10/2023',
        status: 'Completed',
        findings: 'WBC: 9,500/μL, RBC: 5.2 million/μL, Hb: 14.2 g/dL, Platelets: 250,000/μL'
      },
      {
        id: 'XRAY001',
        name: 'Chest X-Ray PA View',
        date: '9/15/2023',
        status: 'Completed',
        findings: 'Normal cardiac silhouette. No evidence of consolidation or effusion. Clear lung fields.'
      }
    ]
  },
  {
    id: 'P002',
    name: 'Priya Patel',
    age: 32,
    gender: 'Female',
    bloodType: 'A+',
    phone: '8765432109',
    email: 'priya.p@example.com',
    address: '456 City Heights, Urban Colony',
    reason: 'Regular checkup',
    lastVisit: '15 Jan 2025',
    vitals: {
      bloodPressure: '120/80 mmHg',
      pulse: '72 bpm',
      temperature: '98.4°F',
      respiratoryRate: '14/min',
      spo2: '99%'
    },
    allergies: ['Sulfa drugs'],
    medicalHistory: [
      'Hypothyroidism (E03.9)'
    ],
    visits: [
      {
        date: '15/01/2025',
        complaint: 'Regular checkup',
        diagnosis: 'Routine health examination (Z00.0)',
        prescriptions: [
          {
            medicine: 'Tab. Levothyroxine 50mcg',
            dosage: '1-0-0',
            duration: '90 days',
            instructions: 'Take on empty stomach'
          },
          {
            medicine: 'Tab. Multivitamin',
            dosage: '0-1-0',
            duration: '30 days',
            instructions: 'Take with meals'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'TSH001',
        name: 'Thyroid Function Test',
        date: '15/01/2025',
        status: 'Completed',
        findings: 'TSH: 4.8 mIU/L, T3: 120 ng/dL, T4: 8.2 µg/dL. Mild hypothyroidism.'
      }
    ]
  },
  {
    id: 'P003',
    name: 'Amit Kumar',
    age: 28,
    gender: 'Male',
    bloodType: 'O+',
    phone: '7654321098',
    email: 'amit.k@example.com',
    address: '789 Sport Complex, Stadium Road',
    reason: 'Joint pain',
    lastVisit: '08 Mar 2025',
    vitals: {
      bloodPressure: '118/78 mmHg',
      pulse: '68 bpm',
      temperature: '98.2°F',
      respiratoryRate: '15/min',
      spo2: '98%'
    },
    allergies: [],
    medicalHistory: [
      'Sports injury - right knee (S80.0)'
    ],
    visits: [
      {
        date: '08/03/2025',
        complaint: 'Joint pain',
        diagnosis: 'Knee sprain (S83.6)',
        prescriptions: [
          {
            medicine: 'Tab. Diclofenac 50mg',
            dosage: '1-0-1',
            duration: '5 days',
            instructions: 'Take after meals'
          },
          {
            medicine: 'Gel. Diclofenac Topical',
            dosage: 'Apply locally',
            duration: '7 days',
            instructions: 'Apply to affected area 3 times daily'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'XRAY002',
        name: 'Right Knee X-Ray',
        date: '08/03/2025',
        status: 'Completed',
        findings: 'No fracture or dislocation. Mild soft tissue swelling. Joint spaces preserved.'
      }
    ]
  },
  {
    id: 'P004',
    name: 'Lakshmi Devi',
    age: 56,
    gender: 'Female',
    bloodType: 'AB-',
    phone: '6543210987',
    email: 'lakshmi.d@example.com',
    address: '101 Temple Street, Old Town',
    reason: 'High BP',
    lastVisit: '12 Dec 2024',
    vitals: {
      bloodPressure: '145/90 mmHg',
      pulse: '82 bpm',
      temperature: '98.8°F',
      respiratoryRate: '18/min',
      spo2: '97%'
    },
    allergies: ['Aspirin'],
    medicalHistory: [
      'Essential hypertension (I10)',
      'Type 2 diabetes mellitus (E11)'
    ],
    visits: [
      {
        date: '12/12/2024',
        complaint: 'High BP',
        diagnosis: 'Essential hypertension (I10)',
        prescriptions: [
          {
            medicine: 'Tab. Amlodipine 5mg',
            dosage: '0-0-1',
            duration: '30 days',
            instructions: 'Take after dinner'
          },
          {
            medicine: 'Tab. Metformin 500mg',
            dosage: '1-0-1',
            duration: '30 days',
            instructions: 'Take with meals'
          }
        ]
      },
      {
        date: '15/11/2024',
        complaint: 'Routine follow-up',
        diagnosis: 'Type 2 diabetes mellitus (E11)',
        prescriptions: [
          {
            medicine: 'Tab. Metformin 500mg',
            dosage: '1-0-1',
            duration: '30 days',
            instructions: 'Take with meals'
          }
        ]
      }
    ],
    labReports: [
      {
        id: 'HBA1C001',
        name: 'HbA1c Test',
        date: '12/12/2024',
        status: 'Completed',
        findings: 'HbA1c: 7.1%. Glucose control needs improvement.'
      },
      {
        id: 'LIPID001',
        name: 'Lipid Profile',
        date: '12/12/2024',
        status: 'Completed',
        findings: 'Total Cholesterol: 210 mg/dL, HDL: 45 mg/dL, LDL: 135 mg/dL, Triglycerides: 150 mg/dL.'
      }
    ]
  }
];

export const getAllPatients = () => patients;

export const getPatientById = (id: string) => {
  return patients.find(patient => patient.id === id);
};
