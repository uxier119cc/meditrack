/**
 * Open Source AI Chatbot Controller
 * 
 * Uses free and open-source AI solutions to power a professional medical chatbot
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

/**
 * Use various free AI options to generate a response
 * 
 * This function tries multiple free AI options in sequence:
 * 1. Local LLM server (if available)
 * 2. Free tier of Hugging Face (if configured)
 * 3. Fallback to rule-based responses
 * 
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI-generated response
 */
async function generateAIResponse(message, conversationHistory = []) {
  try {
    // Format conversation for context
    const formattedHistory = conversationHistory.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');
    
    // Create a prompt with medical context
    const prompt = `${MEDICAL_CONTEXT}\n\nConversation History:\n${formattedHistory}\n\nUser: ${message}\nAssistant:`;
    
    // Check if we should skip AI services entirely and use rule-based only
    if (process.env.USE_RULE_BASED_ONLY === 'true') {
      console.log('Using rule-based responses only (as configured)');
      return getMedicalFallbackResponse(message);
    }
    
    // Try local LLM first (if configured)
    if (process.env.USE_LOCAL_LLM !== 'false') {
      try {
        console.log('Attempting to use Local LLM...');
        const localResponse = await callLocalLLM(prompt, message, conversationHistory);
        if (localResponse) {
          console.log('Successfully received response from Local LLM');
          return localResponse;
        }
      } catch (error) {
        // Provide more detailed error logging
        if (error.response) {
          console.error('Local LLM failed with status:', error.response.status);
        } else if (error.request) {
          console.error('Local LLM no response received - connection failed');
        } else {
          console.error('Local LLM error:', error.message);
        }
        console.log('Local LLM failed, falling back to alternatives:', error.message);
      }
    }
    
    // Try Hugging Face (if configured)
    if (process.env.USE_HUGGINGFACE !== 'false') {
      try {
        console.log('Attempting to use Hugging Face API...');
        const hfResponse = await callHuggingFace(prompt, message, conversationHistory);
        if (hfResponse) {
          console.log('Successfully received response from Hugging Face');
          return hfResponse;
        }
      } catch (error) {
        // Provide more detailed error logging
        if (error.response) {
          console.error('Hugging Face failed with status:', error.response.status);
          if (error.response.status === 401) {
            console.error('Hugging Face authentication failed: Invalid or missing API key');
          }
        } else if (error.request) {
          console.error('Hugging Face no response received - connection failed');
        } else {
          console.error('Hugging Face error:', error.message);
        }
        console.log('Hugging Face failed, falling back to rule-based:', error.message);
      }
    }
    
    // If all else fails, use rule-based fallback
    console.log('Using rule-based fallback response');
    return getMedicalFallbackResponse(message);
  } catch (error) {
    console.error('Error generating AI response:', error);
    return getMedicalFallbackResponse(message);
  }
}

/**
 * Call a locally running LLM server
 */
async function callLocalLLM(prompt, message, conversationHistory) {
  // Format messages for local LLM API
  const messages = [
    { role: "system", content: MEDICAL_CONTEXT },
    ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: "user", content: message }
  ];
  
  // Get LLM URL and model from environment variables with fallbacks
  const llmUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/chat';
  const llmModel = process.env.LOCAL_LLM_MODEL || 'llama2';
  
  console.log(`Connecting to Local LLM at: ${llmUrl} using model: ${llmModel}`);
  
  // Call local LLM API (Ollama format)
  const response = await axios.post(
    llmUrl,
    {
      model: llmModel,
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
  
  // Extract response based on API format
  if (response.data?.message?.content) {
    // Ollama format
    return response.data.message.content;
  } else if (response.data?.choices?.[0]?.message?.content) {
    // OpenAI-compatible format (LocalAI, LM Studio)
    return response.data.choices[0].message.content;
  } else if (response.data?.response) {
    // Simple format
    return response.data.response;
  } else if (typeof response.data === 'string') {
    // Plain text response
    return response.data;
  }
  
  return null;
}

/**
 * Call Hugging Face's free inference API
 */
async function callHuggingFace(prompt, message, conversationHistory) {
  // Get API key from environment variables
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  // Check if API key is missing
  if (!apiKey) {
    console.log('Missing Hugging Face API key');
    return null;
  }
  
  // Get model from environment variables or use default
  const model = process.env.HUGGINGFACE_MODEL || 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext';
  
  console.log(`Connecting to Hugging Face API with model: ${model}`);
  
  // Call Hugging Face's free inference API
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    { 
      inputs: prompt,
      parameters: { 
        max_length: 200, 
        temperature: 0.7,
        top_p: 0.9
      } 
    },
    { 
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      timeout: 15000 // 15 second timeout
    }
  );
  
  // Extract the generated text
  if (response.data && response.data[0] && response.data[0].generated_text) {
    let generatedText = response.data[0].generated_text;
    
    // Clean up the response to get just the assistant's reply
    if (generatedText.includes('Assistant:')) {
      generatedText = generatedText.split('Assistant:').pop().trim();
    }
    
    return generatedText;
  } else if (response.data && typeof response.data === 'string') {
    // Some Hugging Face models return plain text
    return response.data;
  }
  
  return null;
}

/**
 * Professional medical fallback system
 */
function getMedicalFallbackResponse(message) {
  // Convert message to lowercase for easier matching
  const msg = message.toLowerCase();
  
  // Clinical Topics
  if (containsAny(msg, ['diagnosis', 'diagnose', 'symptoms', 'condition', 'disease'])) {
    return "The MediTrack system provides clinical decision support tools to assist with diagnosis. You can access evidence-based diagnostic criteria, differential diagnosis suggestions, and symptom analyzers through the Clinical Tools section. Would you like me to guide you to specific diagnostic resources?";
  }
  
  if (containsAny(msg, ['treatment', 'therapy', 'protocol', 'guideline', 'management'])) {
    return "MediTrack integrates with clinical practice guidelines and treatment protocols from major medical associations. You can access treatment recommendations, care pathways, and clinical algorithms through the Guidelines section. These are regularly updated to reflect the latest evidence-based practices.";
  }
  
  // Patient Management
  if (containsAny(msg, ['patient', 'record', 'chart', 'history']) && containsAny(msg, ['add', 'new', 'create'])) {
    return "To create a new patient record in MediTrack, navigate to the Patients section and select 'Add New Patient'. The system will guide you through entering demographic information, medical history, allergies, and insurance details. You can also import data from previous records or other EHR systems.";
  }
  
  if (containsAny(msg, ['appointment', 'schedule', 'booking', 'calendar'])) {
    return "The MediTrack scheduling system allows you to manage appointments efficiently. You can view your daily schedule, create new appointments with customizable duration, set recurring visits, and manage cancellations or reschedules. The system also supports automated patient reminders via SMS or email.";
  }
  
  // Medications and Prescriptions
  if (containsAny(msg, ['prescription', 'medication', 'drug', 'medicine', 'dosage'])) {
    return "MediTrack's e-prescription module allows you to create, manage, and send prescriptions electronically. The system includes a comprehensive medication database with dosing information, contraindications, and interaction checking. You can access a patient's medication history and set up prescription renewal workflows.";
  }
  
  // Lab and Diagnostics
  if (containsAny(msg, ['lab', 'test', 'result', 'report', 'imaging'])) {
    return "Laboratory and diagnostic results can be managed through the Lab Reports section. You can view test results with reference ranges, track values over time with trend analysis, add clinical interpretations, and flag abnormal values. The system supports importing results directly from major laboratory systems.";
  }
  
  // System Navigation
  if (containsAny(msg, ['how to', 'where is', 'find', 'navigate', 'access'])) {
    return "The MediTrack interface is designed for efficient clinical workflows. The main navigation menu on the left provides access to all major functions. The dashboard displays your schedule, pending tasks, and important notifications. Is there a specific feature you're trying to locate?";
  }
  
  // Medical Documentation
  if (containsAny(msg, ['note', 'documentation', 'soap', 'chart', 'document'])) {
    return "Clinical documentation in MediTrack supports various note formats including SOAP, H&P, procedure notes, and consult notes. The system offers specialty-specific templates, voice dictation, and structured data entry. All notes are automatically linked to the relevant patient encounter and searchable within the system.";
  }
  
  // Billing and Coding
  if (containsAny(msg, ['billing', 'code', 'claim', 'insurance', 'reimbursement', 'icd', 'cpt'])) {
    return "The billing module in MediTrack supports ICD-10 and CPT coding with intelligent code suggestions based on documentation. You can manage claims, track reimbursements, and verify insurance eligibility. The system includes compliance checks to help prevent coding errors and claim denials.";
  }
  
  // Default professional response for medical context
  return "I understand you have a question about medical practice or the MediTrack system. As your clinical assistant, I'm here to help with patient management, clinical documentation, prescriptions, lab reports, and system navigation. Could you provide more specific details about what you need assistance with?";
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
    
    // Generate AI response
    const aiResponseText = await generateAIResponse(message, recentMessages);
    
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
