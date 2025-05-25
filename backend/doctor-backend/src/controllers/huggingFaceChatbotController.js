/**
 * Hugging Face Chatbot Controller
 * 
 * Uses Hugging Face's free inference API to power a medical chatbot
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
You help doctors with patient information, medical terminology, treatment protocols, and clinical workflows.
You provide concise, accurate, and professional responses based on evidence-based medicine.
You do not diagnose patients or prescribe treatments, but you can provide information about standard protocols.
Always maintain patient confidentiality and medical ethics in your responses.
`;

/**
 * Call Hugging Face's inference API to generate a response
 * 
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - The AI-generated response
 */
async function generateAIResponse(message, conversationHistory = []) {
  try {
    // Check if Hugging Face API is disabled
    if (process.env.HUGGINGFACE_ENABLED === 'false') {
      console.log('Hugging Face API is disabled in configuration, using fallback');
      return getFallbackResponse(message);
    }
    
    // Get API key from environment variables
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Check if API key is missing
    if (!apiKey || apiKey === 'hf_dummy_key_for_now') {
      console.log('Missing Hugging Face API key, using fallback response');
      return getFallbackResponse(message);
    }
    
    // Format conversation history for the model
    const formattedHistory = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    // Prepare the prompt with medical context
    const prompt = `${MEDICAL_CONTEXT}\n\n${formattedHistory}\n\nUser: ${message}\nAssistant:`;
    
    // Get model from environment variables or use default
    const model = process.env.HUGGINGFACE_MODEL || 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext';
    
    console.log(`Connecting to Hugging Face API with model: ${model}`);
    
    // Use Hugging Face's free inference API
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt, parameters: { max_length: 200, temperature: 0.7 } },
      { 
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json' 
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    // Extract the generated text
    let generatedText = response.data[0]?.generated_text || '';
    
    // Clean up the response to get just the assistant's reply
    generatedText = generatedText.split('Assistant:').pop().trim();
    
    // If the model fails to generate a good response, use a fallback
    if (!generatedText || generatedText.length < 10) {
      return getFallbackResponse(message);
    }
    
    return generatedText;
  } catch (error) {
    // Provide more detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Hugging Face failed with status:', error.response.status);
      
      // If it's an authentication error, provide a helpful message
      if (error.response.status === 401) {
        console.error('Hugging Face authentication failed: Invalid or missing API key');
      } else if (error.response.status === 404) {
        console.error('Hugging Face model not found: Check the model name in your configuration');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Hugging Face no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Hugging Face error:', error.message);
    }
    
    console.error('Hugging Face failed, falling back to rule-based:', error.message);
    return getFallbackResponse(message);
  }
}

/**
 * Fallback responses when the AI model fails
 */
function getFallbackResponse(message) {
  // Extract keywords from the message
  const keywords = message.toLowerCase().split(/\s+/);
  
  // Medical-specific fallbacks based on keywords
  if (keywords.some(word => ['patient', 'record', 'chart', 'history'].includes(word))) {
    return "I can help you access patient records and medical history through the MediTrack system. Would you like me to show you how to navigate to specific patient information?";
  }
  
  if (keywords.some(word => ['diagnosis', 'diagnose', 'condition', 'symptoms'].includes(word))) {
    return "For diagnostic assistance, MediTrack offers clinical decision support tools under the 'Clinical Tools' section. Would you like me to direct you there?";
  }
  
  if (keywords.some(word => ['prescription', 'medicine', 'drug', 'dosage', 'medication'].includes(word))) {
    return "MediTrack's prescription module allows you to manage medications, check interactions, and generate prescriptions. You can access it from the patient's profile page.";
  }
  
  if (keywords.some(word => ['lab', 'test', 'report', 'result'].includes(word))) {
    return "Laboratory results can be accessed through the 'Lab Reports' section. You can view, analyze, and add notes to any test results there.";
  }
  
  // Default professional response
  return "I understand you have a question about medical practice. Could you provide more specific details so I can assist you better with the MediTrack system?";
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
    
    // Get last 5 messages for context (to keep the context window small)
    const recentMessages = conversations[conversationId].slice(-5);
    
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
        content: "Hello, I'm MediTrack Assistant. How can I assist you with patient care, medical information, or using the MediTrack system today?",
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
