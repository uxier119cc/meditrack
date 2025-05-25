/**
 * Chatbot Routes
 * 
 * Routes for handling chatbot functionality with the local medical model
 */

const express = require('express');
const router = express.Router();

// Import the local medical model controller
const localMedicalModelController = require('../controllers/localMedicalModelController');

// Use the local medical model controller for all chatbot functionality
const chatbotController = localMedicalModelController;

const { protect } = require('../middleware/authMiddleware');

// Each route will use the authentication middleware

// Route for sending a message to the chatbot
router.post('/chat', protect, chatbotController.chatMessage);

// Route for getting conversation history
router.get('/conversation/:conversationId', protect, chatbotController.getConversation);

// Route for clearing conversation history
router.delete('/conversation/:conversationId', protect, chatbotController.clearConversation);

module.exports = router;
