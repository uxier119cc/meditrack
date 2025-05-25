/**
 * Local AI Chatbot Controller
 * 
 * Uses locally running LLM models to power a professional medical chatbot
 * without requiring paid API services
 */

const axios = require('axios');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

// Simple conversation storage (in-memory for development)
// In production, this should be moved to a database
const conversations = {};

// Medical context to provide to the model
const MEDICAL_CONTEXT = `
You are MediTrack Assistant, a professional medical assistant for doctors.
You provide evidence-based information to help healthcare professionals with:
- Clinical decision support
- Medical reference information
- Patient management workflows
- EHR system navigation
- Treatment protocols and guidelines
- Medical terminology and coding
- Lab result interpretation assistance

You are knowledgeable about medical practices, terminology, and the MediTrack system.
Always maintain a professional, concise tone appropriate for medical professionals.
`;

/**
 * Call a locally running LLM to generate a response
 * 
 * This function can connect to various locally running models:
 * - Ollama (https://ollama.ai/) - Easy to set up and use
 * - LocalAI (https://github.com/go-skynet/LocalAI) - Supports many models
 * - LM Studio (https://lmstudio.ai/) - User-friendly UI with API
 * 
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI-generated response
 */
async function generateLocalAIResponse(message, conversationHistory = []) {
  try {
    // Check if LOCAL_LLM_ENABLED is explicitly set to 'false'
    if (process.env.LOCAL_LLM_ENABLED === 'false') {
      console.log('Local LLM is disabled in configuration, using fallback');
      return getMedicalFallbackResponse(message);
    }
    
    // Format conversation history for the model
    const formattedHistory = conversationHistory.map(msg => 
      `${msg.role}: ${msg.content}`
    );
    
    // Create messages array in the format expected by most LLM APIs
    const messages = [
      { role: "system", content: MEDICAL_CONTEXT },
      ...formattedHistory,
      { role: "user", content: message }
    ];
    
    // Get LLM URL and model from environment variables with fallbacks
    const llmUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/chat';
    const llmModel = process.env.LOCAL_LLM_MODEL || 'llama2';
    
    console.log(`Attempting to connect to Local LLM at: ${llmUrl} using model: ${llmModel}`);
    
    // Try to use a locally running LLM - this example uses Ollama
    // Ollama is free, open-source and can run medical models like llama2 or mistral
    const response = await axios.post(
      llmUrl,
      {
        model: llmModel, // or 'mistral', 'medllama', etc.
        messages: messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      },
      { timeout: 15000 } // 15 second timeout for slower models
    );
    
    // Extract the generated text based on the API response format
    // Ollama format: response.data.message.content
    let generatedText = '';
    if (response.data?.message?.content) {
      // Ollama format
      generatedText = response.data.message.content;
    } else if (response.data?.choices?.[0]?.message?.content) {
      // OpenAI-compatible format (LocalAI, LM Studio)
      generatedText = response.data.choices[0].message.content;
    } else if (response.data?.response) {
      // Simple format
      generatedText = response.data.response;
    } else {
      // Fallback if we can't parse the response
      return getMedicalFallbackResponse(message);
    }
    
    return generatedText;
  } catch (error) {
    // Provide more detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Local LLM failed with status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Local LLM no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Local LLM error:', error.message);
    }
    
    console.error('Local LLM failed, falling back to alternatives:', error.message);
    
    // If local AI fails, use the medical fallback system
    return getMedicalFallbackResponse(message);
  }
}

/**
 * Sophisticated medical fallback system when the AI model fails
 */
function getMedicalFallbackResponse(message) {
  // Convert message to lowercase for easier matching
  const msg = message.toLowerCase();
  
  // Medical domain-specific responses
  
  // Patient Management
  if (msg.includes('patient') && (msg.includes('add') || msg.includes('new') || msg.includes('create'))) {
    return "To add a new patient to MediTrack, navigate to the 'Patients' section and click the '+ New Patient' button. You'll need to enter their demographic information, medical history, and insurance details. Would you like me to guide you through the specific fields?";
  }
  
  if (msg.includes('patient') && (msg.includes('search') || msg.includes('find'))) {
    return "You can search for patients using the search bar at the top of the dashboard. Enter their name, ID, or phone number. For advanced search options, use the filters in the Patient Directory section. Is there a specific patient you're trying to locate?";
  }
  
  // Clinical Documentation
  if ((msg.includes('note') || msg.includes('documentation')) && (msg.includes('clinical') || msg.includes('progress'))) {
    return "Clinical documentation can be added through the patient's profile page. Select the patient, then click on 'Add Note' in the Clinical Notes section. MediTrack supports SOAP format notes with templates for different specialties. Would you like information on specific note templates?";
  }
  
  // Prescriptions
  if (msg.includes('prescription') || (msg.includes('medicine') && msg.includes('prescribe'))) {
    return "To create a prescription, open the patient's profile and select 'New Prescription' from the Medications tab. You can search for medications in our database, set dosage, frequency, and duration. The system will automatically check for contraindications and drug interactions based on the patient's history.";
  }
  
  // Lab Reports
  if (msg.includes('lab') && (msg.includes('report') || msg.includes('result') || msg.includes('test'))) {
    return "Lab reports can be accessed from the patient's profile under the 'Lab Results' tab. You can view historical trends, add interpretations, and flag abnormal values. For uploading new reports, use the 'Import Results' button which supports PDF and structured data formats.";
  }
  
  // Appointments
  if (msg.includes('appointment') || msg.includes('schedule') || msg.includes('booking')) {
    return "The appointment scheduling system is accessible from the main dashboard. You can view your daily schedule, make new appointments, and manage cancellations. The system supports recurring appointments and sends automated reminders to patients. Would you like to know about specific scheduling features?";
  }
  
  // Medical Coding & Billing
  if (msg.includes('billing') || msg.includes('code') || msg.includes('icd') || msg.includes('cpt')) {
    return "MediTrack's billing module supports ICD-10 and CPT coding. When documenting an encounter, you can search for appropriate codes which will be automatically linked to the billing system. The platform validates codes to ensure compliance and maximize reimbursement.";
  }
  
  // System Navigation
  if (msg.includes('dashboard') || msg.includes('navigate') || msg.includes('find') || msg.includes('where')) {
    return "The MediTrack dashboard provides quick access to all major functions. The left sidebar contains the main navigation menu with sections for Patients, Appointments, Lab Reports, and Analytics. Is there a specific feature you're trying to locate?";
  }
  
  // Medical References
  if (msg.includes('guideline') || msg.includes('protocol') || msg.includes('reference')) {
    return "MediTrack includes an integrated medical reference library with clinical guidelines, drug information, and treatment protocols. Access it from the 'References' tab in the main menu. You can bookmark frequently used resources for quick access.";
  }
  
  // Default professional response for medical context
  return "I understand you have a question about medical practice or the MediTrack system. As your clinical assistant, I'm here to help with patient management, clinical documentation, prescriptions, lab reports, and system navigation. Could you provide more specific details about what you need assistance with?";
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
    
    // Generate AI response
    const aiResponseText = await generateLocalAIResponse(message, recentMessages);
    
    // Create response object
    const botResponse = {
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date()
    };
    
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
