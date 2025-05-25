/**
 * Chatbot Controller
 * 
 * A simple rule-based medical chatbot implementation that doesn't require external API services.
 */

const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

// Simple conversation storage (in-memory for development)
// In production, this should be moved to a database
const conversations = {};

// Medical knowledge base for common questions and website navigation
const medicalKnowledgeBase = {
  greetings: [
    "Hello! I'm MediTrack Assistant. How can I help you with your medical queries today?",
    "Hi there! I'm here to assist with your medical questions. What can I help you with?",
    "Welcome to MediTrack! I'm your medical assistant. How may I assist you today?"
  ],
  
  farewells: [
    "Take care! Remember to follow your prescribed treatment plan.",
    "Goodbye! Don't hesitate to reach out if you have more medical questions.",
    "Have a great day! Remember to stay hydrated and take your medications as prescribed."
  ],
  
  fallbacks: [
    "I'm not sure I understand. Could you rephrase your question about your medical concern?",
    "I don't have enough information to answer that medical question. Could you provide more details?",
    "That's beyond my current capabilities. For complex medical issues, please consult your doctor directly."
  ],
  
  // Common medical topics and responses
  // Website navigation and features knowledge
  websiteNavigation: {
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
      "Your profile settings can be accessed by clicking on your avatar in the top-right corner of the screen and selecting 'Profile'.",
      "To update your profile information, click on your user avatar in the header and select 'Profile' from the dropdown menu."
    ],
    settings: [
      "Application settings can be accessed by clicking on your avatar in the top-right corner and selecting 'Settings'.",
      "To change application settings, click on your user avatar in the header and select 'Settings' from the dropdown menu."
    ],
    help: [
      "For help and documentation, click on the '?' icon in the top navigation bar or use this chatbot for assistance with any feature.",
      "If you need help using any feature of MediTrack, you can ask me specific questions or click the Help icon in the top navigation."
    ]
  },
  
  topics: {
    headache: [
      "Headaches can be caused by stress, dehydration, lack of sleep, or other underlying conditions. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If headaches are severe or persistent, please consult your doctor.",
      "For headache relief, try resting in a dark, quiet room, staying hydrated, and using over-the-counter pain relievers as directed. If headaches are frequent or severe, please schedule an appointment with your doctor."
    ],
    
    fever: [
      "Fever is often a sign that your body is fighting an infection. Rest, stay hydrated, and take acetaminophen or ibuprofen to reduce fever. If fever persists over 3 days, exceeds 103°F (39.4°C), or is accompanied by severe symptoms, seek medical attention.",
      "For fever management: rest, drink plenty of fluids, and take over-the-counter fever reducers as directed. Contact your doctor if the fever is high, lasts more than a few days, or comes with severe symptoms."
    ],
    
    cold: [
      "Common cold symptoms include runny nose, sore throat, cough, and mild fever. Rest, stay hydrated, use over-the-counter cold medications for symptom relief. Most colds resolve within 7-10 days. If symptoms worsen or persist longer, consult your doctor.",
      "For cold relief: rest, drink warm fluids, gargle with salt water for sore throat, and use over-the-counter medications for specific symptoms. If symptoms worsen after a week, please contact your doctor."
    ],
    
    prescription: [
      "I can't provide specific prescription advice. Please follow your doctor's instructions for all medications. If you have questions about your prescription, contact your doctor or pharmacist.",
      "For questions about your prescription, please refer to your doctor's instructions or contact your pharmacy. Never adjust medication dosages without consulting your healthcare provider."
    ],
    
    appointment: [
      "To schedule an appointment, you can use the MediTrack scheduling feature or contact the clinic directly. Please have your patient ID and preferred dates/times ready.",
      "Need to schedule an appointment? You can do so through the MediTrack system or by calling the clinic. Make sure to mention any urgent concerns when booking."
    ],
    
    diet: [
      "A balanced diet typically includes fruits, vegetables, whole grains, lean proteins, and healthy fats. For personalized dietary advice, please consult your doctor or a registered dietitian.",
      "Healthy eating habits include regular meals, plenty of fruits and vegetables, whole grains, lean proteins, and limited processed foods. For specific dietary plans, please consult with a healthcare professional."
    ],
    
    exercise: [
      "Regular physical activity is important for overall health. Aim for at least 150 minutes of moderate exercise per week. Always consult your doctor before starting a new exercise program, especially if you have existing health conditions.",
      "Exercise benefits include improved cardiovascular health, better mood, and weight management. Start slowly and gradually increase intensity. If you have health concerns, discuss appropriate exercise options with your doctor."
    ],
    
    sleep: [
      "Adults typically need 7-9 hours of quality sleep per night. Establish a regular sleep schedule, create a relaxing bedtime routine, and make your bedroom comfortable, dark, and quiet. If you have persistent sleep problems, consult your doctor.",
      "For better sleep: maintain consistent sleep hours, avoid screens before bedtime, limit caffeine and alcohol, and create a comfortable sleep environment. If you have ongoing sleep issues, discuss with your healthcare provider."
    ],
    
    stress: [
      "Stress management techniques include deep breathing, meditation, physical activity, adequate sleep, and connecting with others. If stress is overwhelming or affecting your daily life, consider speaking with a mental health professional.",
      "To manage stress: practice mindfulness, engage in regular physical activity, maintain social connections, and ensure adequate rest. For persistent stress or anxiety, professional support may be beneficial."
    ],
    
    medication: [
      "Always take medications as prescribed by your doctor. Don't stop or change dosages without consulting your healthcare provider. Keep a list of all medications you take, including over-the-counter drugs and supplements.",
      "Medication safety tips: follow prescribed dosages, be aware of potential side effects, inform your doctor of all medications you take, and store medications properly away from heat, moisture, and light."
    ]
  }
};

// Utility function to find the most relevant topic based on user query
function findRelevantTopic(message) {
  // Check for navigation/feature related queries first
  const navigationKeywords = {
    dashboard: ['dashboard', 'home', 'main page', 'overview', 'statistics', 'stats'],
    patients: ['patients', 'patient list', 'all patients', 'patient management'],
    patientDetails: ['patient details', 'patient profile', 'patient information', 'patient record'],
    prescriptions: ['prescription', 'prescribe', 'medicine', 'medication list', 'drug', 'prescribing'],
    labReports: ['lab', 'laboratory', 'test', 'report', 'lab result', 'lab report', 'test result'],
    vitalsAnalytics: ['vitals', 'analytics', 'vital signs', 'trends', 'graphs', 'chart', 'compare vitals', 'blood pressure history', 'temperature history', 'weight history', 'heart rate history'],
    appointments: ['appointment', 'schedule', 'booking', 'calendar', 'visit'],
    profile: ['profile', 'my account', 'account settings', 'my profile'],
    settings: ['settings', 'preferences', 'configuration', 'setup'],
    help: ['help', 'guide', 'tutorial', 'documentation', 'how to']
  };
  
  // Check if message contains navigation keywords
  for (const [feature, keywords] of Object.entries(navigationKeywords)) {
    for (const keyword of keywords) {
      if (message.toLowerCase().includes(keyword)) {
        return {
          type: 'navigation',
          feature: feature,
          responses: medicalKnowledgeBase.websiteNavigation[feature] || medicalKnowledgeBase.fallbacks
        };
      }
    }
  }
  
  // If no navigation intent is found, proceed with medical topics
  message = message.toLowerCase();
  
  // Check for greetings
  if (/^(hi|hello|hey|greetings)/i.test(message)) {
    return {
      type: 'greeting',
      responses: medicalKnowledgeBase.greetings
    };
  }
  
  // Check for farewells
  if (/^(bye|goodbye|see you|farewell)/i.test(message)) {
    return {
      type: 'farewell',
      responses: medicalKnowledgeBase.farewells
    };
  }
  
  // Check for topics in knowledge base
  for (const [topic, responses] of Object.entries(medicalKnowledgeBase.topics)) {
    if (message.includes(topic)) {
      return {
        type: topic,
        responses: responses
      };
    }
  }
  
  // Additional pattern matching for common medical questions
  if (/\b(headache|migraine|head pain|head hurt)\b/i.test(message)) {
    return {
      type: 'headache',
      responses: medicalKnowledgeBase.topics.headache
    };
  }
  
  if (/\b(fever|temperature|feeling hot)\b/i.test(message)) {
    return {
      type: 'fever',
      responses: medicalKnowledgeBase.topics.fever
    };
  }
  
  if (/\b(cold|flu|cough|sneez|runny nose|stuffy|congestion)\b/i.test(message)) {
    return {
      type: 'cold',
      responses: medicalKnowledgeBase.topics.cold
    };
  }
  
  if (/\b(prescription|medicine|drug|medication|pill)\b/i.test(message)) {
    return {
      type: 'medication',
      responses: medicalKnowledgeBase.topics.medication
    };
  }
  
  if (/\b(appointment|schedule|booking|visit|meet|doctor|consultation)\b/i.test(message)) {
    return {
      type: 'appointment',
      responses: medicalKnowledgeBase.topics.appointment
    };
  }
  
  if (/\b(diet|nutrition|food|eat|eating|meal)\b/i.test(message)) {
    return {
      type: 'diet',
      responses: medicalKnowledgeBase.topics.diet
    };
  }
  
  if (/\b(exercise|workout|fitness|physical activity|sport)\b/i.test(message)) {
    return {
      type: 'exercise',
      responses: medicalKnowledgeBase.topics.exercise
    };
  }
  
  if (/\b(sleep|insomnia|rest|tired|fatigue|bed)\b/i.test(message)) {
    return {
      type: 'sleep',
      responses: medicalKnowledgeBase.topics.sleep
    };
  }
  
  if (/\b(stress|anxiety|worried|nervous|tension|pressure)\b/i.test(message)) {
    return {
      type: 'stress',
      responses: medicalKnowledgeBase.topics.stress
    };
  }
  
  // If no specific topic is found, return fallback
  return {
    type: 'fallback',
    responses: medicalKnowledgeBase.fallbacks
  };
};

// Get a random response from the available responses for a topic
function getRandomResponse(responses) {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Process a message and generate a response
function processMessage(message, conversationId) {
  // Check for specific navigation or redirection requests
  const redirectPatterns = [
    { regex: /how (do I|to|can I) (get to|access|find|open|navigate to) (the )?(.+?)( page| section)?\??/i, group: 4 },
    { regex: /where (is|can I find) (the )?(.+?)( page| section)?\??/i, group: 3 },
    { regex: /take me to (.+?)( page| section)?/i, group: 1 },
    { regex: /show me (.+?)( page| section)?/i, group: 1 },
    { regex: /go to (.+?)( page| section)?/i, group: 1 }
  ];
  
  // Check for redirection requests
  let redirectTarget = null;
  for (const pattern of redirectPatterns) {
    const match = message.match(pattern.regex);
    if (match) {
      redirectTarget = match[pattern.group].toLowerCase().trim();
      break;
    }
  }
  
  // Map common terms to features
  const featureMap = {
    'dashboard': 'dashboard',
    'home': 'dashboard',
    'main': 'dashboard',
    'patients': 'patients',
    'patient list': 'patients',
    'patient details': 'patientDetails',
    'patient profile': 'patientDetails',
    'prescriptions': 'prescriptions',
    'medications': 'prescriptions',
    'lab': 'labReports',
    'lab reports': 'labReports',
    'laboratory': 'labReports',
    'tests': 'labReports',
    'vitals': 'vitalsAnalytics',
    'vital signs': 'vitalsAnalytics',
    'analytics': 'vitalsAnalytics',
    'vitals analytics': 'vitalsAnalytics',
    'graphs': 'vitalsAnalytics',
    'charts': 'vitalsAnalytics',
    'appointments': 'appointments',
    'schedule': 'appointments',
    'profile': 'profile',
    'settings': 'settings',
    'help': 'help'
  };
  
  // If we have a redirect target, generate a navigation response
  if (redirectTarget) {
    const feature = featureMap[redirectTarget] || Object.keys(featureMap).find(key => 
      redirectTarget.includes(key));
      
    if (feature) {
      return {
        role: 'assistant',
        content: getRandomResponse(medicalKnowledgeBase.websiteNavigation[feature] || 
          ["I can help you navigate to that section. Look for it in the main navigation menu."]),
        timestamp: new Date(),
        navigationAction: {
          type: 'navigate',
          target: feature
        }
      };
    }
  }
  
  const relevantTopic = findRelevantTopic(message);
  const response = getRandomResponse(relevantTopic.responses);
  
  // Check if this is a navigation response
  let navigationAction = null;
  if (relevantTopic.type === 'navigation') {
    navigationAction = {
      type: 'navigate',
      target: relevantTopic.feature
    };
  }
  
  // Add some variability to responses
  const currentTime = new Date();
  const hour = currentTime.getHours();
  
  let timeContext = '';
  if (hour < 12) {
    timeContext = 'Good morning! ';
  } else if (hour < 18) {
    timeContext = 'Good afternoon! ';
  } else {
    timeContext = 'Good evening! ';
  }
  
  // Only add time context for greetings
  const finalResponse = relevantTopic.type === 'greeting' 
    ? timeContext + response 
    : response;
  
  return {
    role: 'assistant',
    content: finalResponse,
    timestamp: new Date(),
    navigationAction: navigationAction
  };
};

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
    
    // Process message and get response
    const botResponse = processMessage(message, conversationId);
    
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
        content: getRandomResponse(medicalKnowledgeBase.greetings),
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
    
    // Clear conversation
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
