/**
 * Enhanced Medical Chatbot Controller
 * 
 * A comprehensive rule-based medical chatbot with advanced navigation capabilities
 * and medical knowledge for the MediTrack system
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

// Simple conversation storage (in-memory for development)
// In production, this should be moved to a database
const conversations = {};

// Medical context to provide to the model
const MEDICAL_CONTEXT = `
You are MediTrack Assistant, a professional medical assistant for doctors.
Your purpose is to assist healthcare professionals with:
- Clinical information and evidence-based medicine
- Patient management workflows
- Medical reference information
- Treatment protocols and guidelines
- Lab result interpretation assistance
- Medical terminology and coding
- EHR system navigation

Always maintain a professional, concise tone appropriate for medical professionals.
Provide accurate, evidence-based information when possible.
When uncertain, clearly indicate the limitations of your knowledge.
`;

// Website navigation knowledge base
const websiteNavigation = {
  dashboard: [
    "You can access the Dashboard by clicking on the 'Dashboard' link in the sidebar. The Dashboard provides an overview of your patients, appointments, and key metrics.",
    "The Dashboard is your central hub for monitoring patient activity, upcoming appointments, and important statistics. You can access it from the main sidebar."
  ],
  patients: [
    "The Patients section allows you to view and manage all your patients. You can access it from the sidebar by clicking on 'Patients'.",
    "To manage your patients, go to the Patients section from the main navigation. There you can add new patients, search for existing ones, and view detailed patient information."
  ],
  patientDetails: [
    "Patient Details provides comprehensive information about a specific patient, including their medical history, prescriptions, lab reports, and vitals. Click on any patient's name to access their details.",
    "To view a patient's complete profile, navigate to the Patients section and click on the patient's name. This will take you to the Patient Details page with all their medical information."
  ],
  prescriptions: [
    "You can create and manage prescriptions from the Patient Details page. Select a patient, then click on the 'Prescriptions' tab, and use the 'New Prescription' button to create a prescription.",
    "To add a new prescription, first navigate to the patient's details page, then click on the 'Prescriptions' tab, and use the 'New Prescription' button."
  ],
  labReports: [
    "Lab reports can be managed from the Patient Details page. Select a patient, click on the 'Lab Reports' tab, and use the 'Add Lab Report' button to create a new report.",
    "To view or add lab reports, go to the patient's details page and select the 'Lab Reports' tab. You can download existing reports or add new ones."
  ],
  vitalsAnalytics: [
    "The Vitals Analytics feature allows you to compare patient vital signs across different visits with interactive graphs. Access it from the Patient Details page by clicking on the 'Vitals Analytics' tab.",
    "To analyze a patient's vitals over time, go to their Patient Details page and select the 'Vitals Analytics' tab. You'll see graphs comparing blood pressure, heart rate, temperature, and weight across visits."
  ],
  appointments: [
    "You can manage appointments from the Appointments section in the sidebar. This allows you to schedule, view, and update patient appointments.",
    "To schedule or view appointments, click on the 'Appointments' option in the main navigation menu."
  ],
  profile: [
    "Your profile settings can be accessed by clicking on your name or profile picture in the top-right corner of the screen, then selecting 'Profile'.",
    "To update your personal information or change your profile picture, go to your Profile page from the dropdown menu in the top navigation."
  ],
  settings: [
    "Application settings can be accessed by clicking on your name in the top-right corner, then selecting 'Settings'.",
    "To customize your MediTrack experience, including notification preferences and display options, visit the Settings page from the user menu."
  ],
  help: [
    "For help and documentation, click on the '?' icon in the top navigation bar.",
    "If you need help using any feature of MediTrack, you can ask me specific questions or click the Help icon in the top navigation."
  ]
};

// Medical topics knowledge base
const medicalTopics = {
  headache: [
    "Common headache types include tension, migraine, and cluster headaches. Treatment typically involves pain relievers, rest, and identifying triggers. For recurrent or severe headaches, further evaluation may be needed.",
    "For migraine management, consider preventive medications for frequent episodes, and acute treatments like triptans for attacks. Lifestyle modifications and trigger avoidance are also important components of care."
  ],
  fever: [
    "Fever is often a sign of infection. Evaluate for source based on associated symptoms. Consider antipyretics for comfort, but remember fever itself can be a beneficial immune response.",
    "For fever management: rest, drink plenty of fluids, and take over-the-counter fever reducers as directed. Contact your doctor if the fever is high, lasts more than a few days, or comes with severe symptoms."
  ],
  medication: [
    "Always take medications as prescribed by your doctor. Don't stop or change dosages without consulting your healthcare provider. Keep a list of all medications you take, including over-the-counter drugs and supplements.",
    "Medication safety tips: follow prescribed dosages, be aware of potential side effects, inform your doctor of all medications you take, and store medications properly away from heat, moisture, and light."
  ]
};

/**
 * Process a message and generate a response
 * 
 * @param {string} message - The user's message
 * @param {string} conversationId - The ID of the conversation
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<object>} - The response with navigation info
 */
async function processMessage(message, conversationId, conversationHistory = []) {
  try {
    console.log(`Processing message: "${message}" for conversation: ${conversationId}`);
    
    // Check for navigation-related queries first
    const navigationResponse = checkForNavigationQuery(message);
    if (navigationResponse) {
      console.log('Navigation intent detected, returning navigation response');
      return navigationResponse;
    }
    
    // Check for medical topic queries
    const medicalResponse = checkForMedicalTopicQuery(message);
    if (medicalResponse) {
      console.log('Medical topic detected, returning medical response');
      return medicalResponse;
    }
    
    // Check for specific medical questions
    const specificMedicalResponse = getSpecificMedicalResponse(message, conversationHistory);
    if (specificMedicalResponse) {
      console.log('Specific medical question detected, returning detailed response');
      return {
        role: 'assistant',
        content: specificMedicalResponse,
        timestamp: new Date(),
        navigationAction: null
      };
    }
    
    // Use rule-based response as fallback
    console.log('Using general response');
    const response = getRuleBasedResponse(message);
    
    return {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      navigationAction: null
    };
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Return a fallback response
    return {
      role: 'assistant',
      content: "I apologize, but I'm having trouble processing your request at the moment. How else can I assist you with the MediTrack system?",
      timestamp: new Date(),
      navigationAction: null
    };
  }
}

/**
 * Get a response for specific medical questions
 */
function getSpecificMedicalResponse(message, conversationHistory = []) {
  const msg = message.toLowerCase();
  console.log(`Checking specific medical response for: "${msg}"`);
  
  // Pain medications
  if (containsAny(msg, ['medication', 'medicine', 'drug']) && 
      containsAny(msg, ['pain', 'ache', 'hurt', 'body pain', 'headache'])) {
    return "For pain management, commonly recommended medications include: 1) NSAIDs like ibuprofen (Advil, Motrin) or naproxen (Aleve) for inflammatory pain, 2) Acetaminophen (Tylenol) for mild to moderate pain without significant inflammation, 3) Topical analgesics for localized pain, and 4) Muscle relaxants for muscle spasms. For severe pain, prescription medications may be necessary. Always consider patient-specific factors such as age, comorbidities, and potential drug interactions before recommending pain medications.";
  }
  
  // Hypertension
  if (containsAny(msg, ['symptoms', 'signs']) && containsAny(msg, ['hypertension', 'high blood pressure'])) {
    return "Common symptoms of hypertension include headaches, shortness of breath, nosebleeds, flushing, dizziness, chest pain, visual changes, and blood in urine. However, hypertension is often asymptomatic and discovered during routine check-ups, which is why it's sometimes called the 'silent killer'. Regular blood pressure monitoring is essential for early detection.";
  }
  
  // Troponin levels
  if (containsAny(msg, ['troponin']) && containsAny(msg, ['elevated', 'high', 'interpret'])) {
    return "Elevated troponin levels typically indicate myocardial injury or infarction. Normal values are <0.04 ng/mL, and any elevation warrants investigation. Consider acute coronary syndrome if accompanied by chest pain or ECG changes. Other causes include myocarditis, pulmonary embolism, sepsis, renal failure, and strenuous exercise. Serial measurements are more informative than a single value. The pattern and degree of elevation can help differentiate between acute MI and other conditions.";
  }
  
  // Diabetes treatment
  if (containsAny(msg, ['treatment', 'manage', 'therapy']) && 
      containsAny(msg, ['diabetes', 'diabetic']) && 
      containsAny(msg, ['type 2', 'type ii', 'adult onset'])) {
    return "Treatment for Type 2 Diabetes typically follows a stepwise approach: 1) Lifestyle modifications (diet, exercise, weight loss) are foundational. 2) Metformin is usually the first-line medication unless contraindicated. 3) Second-line options include SGLT2 inhibitors, GLP-1 receptor agonists, DPP-4 inhibitors, sulfonylureas, or thiazolidinediones. 4) Insulin therapy may be needed if glycemic targets aren't met with oral medications. Treatment should be individualized based on comorbidities, hypoglycemia risk, weight effects, cost, and patient preferences. Regular monitoring of HbA1c (target typically <7%) is essential.";
  }
  
  // Amoxicillin side effects
  if (containsAny(msg, ['side effects', 'adverse effects', 'reactions']) && 
      containsAny(msg, ['amoxicillin', 'antibiotic'])) {
    return "Common side effects of amoxicillin include diarrhea, stomach upset, nausea, vomiting, and rash. More serious but less common side effects include severe allergic reactions (anaphylaxis), Clostridium difficile-associated diarrhea, blood disorders, and crystalluria. Patients should be advised to complete the full course of antibiotics even if symptoms improve, and to contact their healthcare provider if they experience severe diarrhea, rash, or signs of an allergic reaction.";
  }
  
  // Pneumonia diagnosis
  if (containsAny(msg, ['diagnose', 'diagnosis', 'detect', 'identify']) && 
      containsAny(msg, ['pneumonia', 'lung infection'])) {
    return "Diagnosing pneumonia involves clinical assessment, laboratory tests, and imaging. Key clinical findings include cough, fever, dyspnea, and abnormal breath sounds (crackles/rales). Diagnostic tests include: 1) Chest X-ray - the gold standard showing infiltrates/consolidation, 2) Laboratory tests - elevated WBC count, CRP, or procalcitonin, 3) Sputum culture to identify pathogens, 4) Blood cultures in severe cases, 5) Pulse oximetry to assess oxygenation, and 6) CT scan for complicated cases. Point-of-care ultrasound is increasingly used for rapid assessment. The CURB-65 or Pneumonia Severity Index can help determine treatment setting (outpatient vs. inpatient).";
  }
  
  // Blood pressure difference
  if (containsAny(msg, ['difference', 'distinguish', 'between']) && 
      containsAny(msg, ['systolic']) && 
      containsAny(msg, ['diastolic'])) {
    return "Systolic blood pressure (the upper number) measures the pressure in arteries when the heart contracts, while diastolic blood pressure (the lower number) measures the pressure when the heart is at rest between beats. Systolic pressure represents the maximum pressure exerted on the arterial walls, while diastolic represents the minimum. Both values are important clinical indicators, with normal adult readings being below 120/80 mmHg. Elevated systolic pressure is generally considered a more significant cardiovascular risk factor, especially in older adults.";
  }
  
  // Blood glucose levels
  if (containsAny(msg, ['normal', 'range', 'level']) && 
      containsAny(msg, ['blood glucose', 'blood sugar', 'glucose'])) {
    return "Normal blood glucose ranges are: Fasting plasma glucose: 70-99 mg/dL (3.9-5.5 mmol/L), 2 hours post-meal: <140 mg/dL (<7.8 mmol/L), and HbA1c: <5.7%. Prediabetes is indicated by fasting glucose of 100-125 mg/dL (5.6-6.9 mmol/L), 2-hour post-meal of 140-199 mg/dL (7.8-11.0 mmol/L), or HbA1c of 5.7-6.4%. Diabetes is diagnosed when fasting glucose is ≥126 mg/dL (≥7.0 mmol/L), 2-hour post-meal is ≥200 mg/dL (≥11.1 mmol/L), or HbA1c is ≥6.5%. For critically ill patients, target glucose is typically 140-180 mg/dL (7.8-10.0 mmol/L).";
  }
  
  // Heart rate
  if (containsAny(msg, ['normal', 'average', 'typical']) && 
      containsAny(msg, ['heart rate', 'pulse', 'bpm', 'beats'])) {
    // Check if this is a follow-up about children's heart rates
    const isChildrenFollowUp = conversationHistory.length > 0 && 
                               containsAny(msg, ['children', 'kids', 'child']) && 
                               conversationHistory[conversationHistory.length - 2]?.content.toLowerCase().includes('heart rate');
    
    if (isChildrenFollowUp || containsAny(msg, ['children', 'child', 'kid', 'pediatric'])) {
      return "Normal heart rates for children vary by age: Newborns (0-1 month): 100-160 bpm, Infants (1-11 months): 80-150 bpm, Toddlers (1-2 years): 80-130 bpm, Preschoolers (3-5 years): 80-120 bpm, School-age children (6-12 years): 70-110 bpm, and Adolescents (13-18 years): 60-100 bpm. During exercise or when upset, these rates can increase significantly. Consistently high or low heart rates outside these ranges should be evaluated by a pediatrician.";
    } else {
      return "The normal resting heart rate for adults ranges from 60 to 100 beats per minute (bpm). Well-conditioned athletes might have a resting heart rate closer to 40 bpm. Factors affecting heart rate include activity level, fitness level, air temperature, body position, emotions, body size, and medication use. During exercise, the target heart rate is typically 50-85% of your maximum heart rate (calculated as 220 minus your age). Consistently high resting heart rates or significant changes should be evaluated by a healthcare provider.";
    }
  }
  
  // COVID-19 symptoms
  if (containsAny(msg, ['symptoms', 'signs', 'indications']) && 
      containsAny(msg, ['covid', 'covid-19', 'coronavirus', 'sars-cov-2'])) {
    return "Common symptoms of COVID-19 include fever or chills, cough, shortness of breath, fatigue, muscle or body aches, headache, new loss of taste or smell, sore throat, congestion or runny nose, nausea or vomiting, and diarrhea. Symptoms typically appear 2-14 days after exposure to the virus. The severity can range from mild to severe. Emergency warning signs requiring immediate medical attention include trouble breathing, persistent chest pain or pressure, new confusion, inability to wake or stay awake, and bluish lips or face. Symptoms may differ in vaccinated individuals, often presenting as mild cold-like symptoms.";
  }
  
  // COVID-19 treatments (follow-up)
  const isCovidTreatmentFollowUp = conversationHistory.length > 0 && 
                                  containsAny(msg, ['treatment', 'therapy', 'medication']) && 
                                  conversationHistory[conversationHistory.length - 2]?.content.toLowerCase().includes('covid');
  
  if ((containsAny(msg, ['treatment', 'therapy', 'medication', 'cure']) && 
       containsAny(msg, ['covid', 'covid-19', 'coronavirus'])) || isCovidTreatmentFollowUp) {
    return "COVID-19 treatments depend on severity. For mild to moderate cases in high-risk patients, antivirals like nirmatrelvir/ritonavir (Paxlovid) or remdesivir may be prescribed within 5-7 days of symptom onset. Monoclonal antibodies may be used when antivirals aren't suitable. For severe cases requiring hospitalization, treatments include remdesivir, dexamethasone (for those needing oxygen), baricitinib or tocilizumab (for rapid respiratory decompensation), and anticoagulation for thrombosis prevention. Supportive care includes oxygen therapy, prone positioning, and in severe cases, mechanical ventilation. Treatment protocols continue to evolve based on emerging evidence.";
  }
  
  // Headache
  if (containsAny(msg, ['headache', 'migraine', 'head pain']) && 
      !containsAny(msg, ['medication', 'medicine', 'drug'])) {
    return "Common headache types include tension headaches (typically band-like pressure), migraines (often unilateral, pulsating, with nausea/photophobia), and cluster headaches (severe, unilateral orbital pain). Tension headaches are managed with OTC analgesics and stress reduction. Migraines require abortive therapy (triptans, NSAIDs) for acute attacks and preventive medications (beta-blockers, anticonvulsants, CGRP antagonists) for frequent episodes. Secondary headaches may indicate serious conditions like meningitis, stroke, or intracranial hemorrhage, especially if accompanied by fever, altered mental status, or neurological deficits.";
  }
  
  // Fever
  if (containsAny(msg, ['fever', 'high temperature', 'febrile'])) {
    return "Fever (temperature >100.4°F/38°C) is an immune response to infection or inflammation. Evaluation should identify the source based on associated symptoms. Common causes include viral infections (URI, gastroenteritis), bacterial infections (UTI, pneumonia), and inflammatory conditions. Management includes antipyretics (acetaminophen, NSAIDs) for comfort, adequate hydration, and treating the underlying cause. Red flags warranting urgent evaluation include temperature >103°F in adults, fever in immunocompromised patients, or accompanying symptoms like neck stiffness, severe headache, or altered mental status.";
  }
  
  // Medication adherence
  if (containsAny(msg, ['take medication', 'medication adherence', 'follow prescription', 'skip dose', 'stop taking'])) {
    return "Always take medications as prescribed by your doctor. Don't stop or change dosages without consulting your healthcare provider. Keep a list of all medications you take, including over-the-counter drugs and supplements. Medication adherence is crucial for treatment efficacy and preventing complications. For patients struggling with adherence, consider pill organizers, medication reminders, simplified regimens, and addressing barriers like cost or side effects. Document non-adherence in the patient record and discuss strategies to improve compliance.";
  }
  
  console.log('No specific medical response found, returning null');
  return null;
}

/**
 * Check if the message is asking about website navigation
 */
function checkForNavigationQuery(message) {
  const msg = message.toLowerCase();
  
  // Check for navigation patterns
  if (msg.includes('how') && msg.includes('find')) {
    // Dashboard
    if (containsAny(msg, ['dashboard', 'home', 'main page', 'overview'])) {
      return createNavigationResponse('dashboard');
    }
    
    // Patients
    if (containsAny(msg, ['patient', 'patients list', 'all patients'])) {
      return createNavigationResponse('patients');
    }
    
    // Patient Details
    if (containsAny(msg, ['patient details', 'patient profile', 'patient information'])) {
      return createNavigationResponse('patientDetails');
    }
    
    // Prescriptions
    if (containsAny(msg, ['prescription', 'medicine', 'drug', 'medication'])) {
      return createNavigationResponse('prescriptions');
    }
    
    // Lab Reports
    if (containsAny(msg, ['lab', 'test', 'report', 'laboratory'])) {
      return createNavigationResponse('labReports');
    }
    
    // Vitals Analytics
    if (containsAny(msg, ['vital', 'analytics', 'graph', 'chart', 'trend', 'blood pressure', 'heart rate'])) {
      return createNavigationResponse('vitalsAnalytics');
    }
    
    // Appointments
    if (containsAny(msg, ['appointment', 'schedule', 'booking', 'calendar'])) {
      return createNavigationResponse('appointments');
    }
  }
  
  // Direct navigation requests
  if (containsAny(msg, ['go to', 'navigate to', 'take me to', 'show me', 'open'])) {
    // Dashboard
    if (containsAny(msg, ['dashboard', 'home', 'main page', 'overview'])) {
      return createNavigationResponse('dashboard');
    }
    
    // Patients
    if (containsAny(msg, ['patient list', 'patients', 'all patients'])) {
      return createNavigationResponse('patients');
    }
    
    // Prescriptions
    if (containsAny(msg, ['prescription', 'medicine', 'drug', 'medication'])) {
      return createNavigationResponse('prescriptions');
    }
    
    // Lab Reports
    if (containsAny(msg, ['lab', 'test', 'report', 'laboratory'])) {
      return createNavigationResponse('labReports');
    }
    
    // Vitals Analytics
    if (containsAny(msg, ['vital', 'analytics', 'graph', 'chart', 'trend'])) {
      return createNavigationResponse('vitalsAnalytics');
    }
    
    // Appointments
    if (containsAny(msg, ['appointment', 'schedule', 'booking', 'calendar'])) {
      return createNavigationResponse('appointments');
    }
  }
  
  return null;
}

/**
 * Create a navigation response
 */
function createNavigationResponse(feature) {
  // Get a random response for this feature
  const responses = websiteNavigation[feature] || ["I can help you navigate to that section of MediTrack."];
  const responseText = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    role: 'assistant',
    content: responseText,
    timestamp: new Date(),
    navigationAction: {
      type: 'navigate',
      target: feature
    }
  };
}

/**
 * Check if the message is asking about a medical topic
 */
function checkForMedicalTopicQuery(message) {
  const msg = message.toLowerCase();
  
  // Check for medical topics
  for (const [topic, responses] of Object.entries(medicalTopics)) {
    if (msg.includes(topic)) {
      const responseText = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        navigationAction: null
      };
    }
  }
  
  return null;
}

/**
 * Get a rule-based response for general queries
 */
function getRuleBasedResponse(message) {
  const msg = message.toLowerCase();
  
  // Greetings
  if (containsAny(msg, ['hello', 'hi', 'hey', 'greetings'])) {
    const greetings = [
      "Hello! I'm MediTrack Assistant. How can I help you with your medical queries today?",
      "Hi there! I'm here to assist with your medical questions. What can I help you with?",
      "Welcome to MediTrack! I'm your medical assistant. How may I assist you today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Farewells
  if (containsAny(msg, ['bye', 'goodbye', 'see you', 'farewell'])) {
    const farewells = [
      "Take care! Remember to follow your prescribed treatment plan.",
      "Goodbye! Don't hesitate to reach out if you have more medical questions.",
      "Have a great day! Remember to stay hydrated and take your medications as prescribed."
    ];
    return farewells[Math.floor(Math.random() * farewells.length)];
  }
  
  // Default response
  const defaults = [
    "I'm here to help with medical information and navigating the MediTrack system. Could you provide more details about what you need?",
    "As your MediTrack assistant, I can help with patient management, clinical information, and system navigation. What specific information are you looking for?",
    "I can assist with various medical topics and help you navigate the MediTrack system. Please let me know what you're interested in."
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// Helper function to check if a string contains any of the keywords
function containsAny(text, keywords) {
  return keywords.some(keyword => text.includes(keyword));
}

// Controller methods
exports.chatMessage = async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Create conversation if it doesn't exist
    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }
    
    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    conversations[conversationId].push(userMessage);
    
    // Get recent messages for context (to keep the context window manageable)
    const recentMessages = conversations[conversationId].slice(-6);
    
    // Process message and get response
    const botResponse = await processMessage(message, conversationId, recentMessages);
    
    // Add bot response to conversation
    conversations[conversationId].push(botResponse);
    
    // Limit conversation history to last 50 messages to prevent memory issues
    if (conversations[conversationId].length > 50) {
      conversations[conversationId] = conversations[conversationId].slice(-50);
    }
    
    return res.status(200).json({
      success: true,
      data: botResponse
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your message',
      error: error.message
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }
    
    // Return conversation history or empty array if not found
    const conversation = conversations[conversationId] || [];
    
    // If conversation is empty, create a welcome message
    if (conversation.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: "Welcome, doctor. I'm your MediTrack clinical assistant. How may I support your patient care activities today?",
        timestamp: new Date()
      };
      
      // Initialize conversation with welcome message
      conversations[conversationId] = [welcomeMessage];
      
      return res.status(200).json({
        success: true,
        data: [welcomeMessage]
      });
    }
    
    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving the conversation',
      error: error.message
    });
  }
};

exports.clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }
    
    // Clear conversation history
    conversations[conversationId] = [];
    
    return res.status(200).json({
      success: true,
      message: 'Conversation cleared successfully'
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while clearing the conversation',
      error: error.message
    });
  }
};
