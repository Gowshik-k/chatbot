import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3004`);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Memoized message formatting
  const formatTime = useMemo(() => (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Optimized message rendering
  const renderMessage = useCallback((msg, index) => (
    <div
      key={index}
      className={`mb-4 p-4 rounded-lg max-w-xs lg:max-w-md xl:max-w-lg transition-all duration-200 hover:scale-[1.02] ${
        msg.sender === 'user'
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto shadow-lg'
          : msg.sender === 'system'
          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white mx-auto shadow-lg'
          : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white mr-auto shadow-lg'
      }`}
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
      <span className="text-xs opacity-70 block mt-2 flex items-center">
        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
        {formatTime(msg.timestamp)}
      </span>
    </div>
  ), [formatTime]);

  useEffect(() => {
    // Connection status
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to SIREN AI');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from SIREN AI');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Message handling
    socket.on('receiveMessage', (message) => {
      const msg = { ...message, timestamp: new Date(message.timestamp) };
      setMessages((prevMessages) => [...prevMessages, msg]);
      setIsTyping(false);
    });

    socket.on('typing', () => setIsTyping(true));
    socket.on('stopTyping', () => setIsTyping(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('receiveMessage');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    if (!isConnected) {
      // Show connection error
      setMessages(prev => [...prev, {
        message: "Not connected to server. Please check your connection.",
        sender: 'system',
        timestamp: new Date()
      }]);
      return;
    }

    // Optimistic UI update
    const userMessage = {
      message,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    socket.emit('sendMessage', { message });
    setInput('');
    setIsTyping(true);

    // Focus back to input
    inputRef.current?.focus();
  }, [input, isConnected]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Connection Status */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected to SIREN AI' : 'Connecting...'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Powered by Gemini AI
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-12">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome to SIREN AI
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Start a conversation with our advanced AI assistant. Ask questions, get help, or just chat!
              </p>
            </div>
          )}

          {messages.map(renderMessage)}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="mb-4 p-4 rounded-lg max-w-xs bg-gradient-to-r from-gray-700 to-gray-800 text-white mr-auto shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">SIREN is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full p-4 pr-12 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[50px] max-h-32"
                rows="1"
                disabled={false} // Temporarily enable input
              />
              {input.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center space-x-2 min-w-[100px] justify-center"
            >
              <span>{isTyping ? 'Sending...' : 'Send'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;