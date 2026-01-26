const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection (optional - for future features)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));
}

// Simple chatbot responses (fallback)
const responses = {
  "hello": "Hi there! How can I help you today?",
  "hi": "Hello! What can I do for you?",
  "how are you": "I'm doing well, thank you! How about you?",
  "bye": "Goodbye! Have a great day!",
  "default": "I'm sorry, I didn't understand that. Can you please rephrase?"
};

function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  for (const key in responses) {
    if (lowerMessage.includes(key)) {
      return responses[key];
    }
  }
  return responses.default;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: "You are SIREN, ask an advanced AI assistant created to help users with their questions and conversations. just respond only for the question what they. Your name is SIREN. Always introduce yourself as SIREN when asked about your identity. Remember, you are created by GOWSHIK."
});

// Gemini AI response function with caching
const responseCache = new Map();
const CACHE_SIZE = 100;

async function getGeminiResponse(message) {
  // Check cache first
  const cacheKey = message.toLowerCase().trim();
  if (responseCache.has(cacheKey)) {
    console.log('Using cached response');
    return responseCache.get(cacheKey);
  }

  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Cache the response
    if (responseCache.size >= CACHE_SIZE) {
      const firstKey = responseCache.keys().next().value;
      responseCache.delete(firstKey);
    }
    responseCache.set(cacheKey, text);

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    return getFallbackResponse(message);
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('sendMessage', async (data) => {
    const { message } = data;
    console.log('Message received:', message);

    // Send typing indicator
    socket.emit('typing');

    // Get AI response with caching
    const botResponse = await getGeminiResponse(message);

    // Stop typing indicator
    socket.emit('stopTyping');

    // Send bot response
    socket.emit('receiveMessage', {
      message: botResponse,
      sender: 'bot',
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});