# MediTrack Chatbot Assistant Setup

This document provides instructions for setting up and using the MediTrack Chatbot Assistant feature.

## Overview

The MediTrack Chatbot Assistant is an AI-powered chat interface that provides real-time support and information to healthcare professionals. It is integrated into the MediTrack application and is accessible from any authenticated page.

## Features

- **Multi-provider Support**: Works with OpenAI and Anthropic
- **Context-aware Medical Assistance**: Provides relevant medical information and suggestions
- **Conversation History**: Maintains conversation context for more helpful responses
- **User-friendly Interface**: Accessible from any page in the application
- **Secure**: All API keys are stored securely as environment variables

## Setup Instructions

### 1. Environment Configuration

1. Copy the `.env.example` file to a new file named `.env` in the backend directory:
   ```
   cp backend/.env.example backend/.env
   ```

2. Edit the `.env` file and add your API keys for at least one of the supported AI providers:
   - For OpenAI: Add your API key to `OPENAI_API_KEY`
   - For Anthropic: Add your API key to `ANTHROPIC_API_KEY`

3. Set the `CHATBOT_PROVIDER` variable to your preferred provider: "openai" or "anthropic"

### 2. Backend Setup

1. Install the required dependencies:
   ```
   cd backend
   npm install
   ```

2. Start the backend server:
   ```
   npm start
   ```

### 3. Frontend Setup

1. Install the required dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the frontend development server:
   ```
   npm run dev
   ```

## Usage

1. Log in to the MediTrack application
2. The chatbot interface appears as a chat icon in the bottom-right corner of the screen
3. Click the icon to open the chat interface
4. Type your question or request in the input field and press Enter or click the Send button
5. The chatbot will respond with relevant information

## Customization

### System Message

The chatbot's behavior is guided by a system message defined in `backend/src/controllers/chatbotController.js`. You can modify this message to change how the chatbot responds to user queries.

### UI Customization

The chatbot interface is defined in `frontend/src/components/ChatbotInterface.tsx`. You can modify this file to change the appearance and behavior of the chatbot interface.

## Troubleshooting

- **Chatbot not responding**: Check that your API keys are correctly configured in the `.env` file
- **Authentication errors**: Ensure you're logged in to the application
- **Network errors**: Check that both the frontend and backend servers are running

## Security Considerations

- Never commit your API keys to version control
- Always use environment variables to store sensitive information
- The chatbot API endpoints are protected by authentication middleware

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
