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
      className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] p-3 shadow-sm ${
        msg.sender === 'user'
          ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
          : msg.sender === 'system'
          ? 'bg-gray-100 text-gray-500 text-xs py-1 px-4 rounded-full mx-auto'
          : 'bg-white border border-gray-200 text-gray-800 rounded-r-lg rounded-tl-lg'
      }`}>
        <p className="text-sm leading-snug">{msg.message}</p>
        <div className={`text-[10px] mt-1 flex items-center ${msg.sender === 'user' ? 'text-blue-100 justify-end' : 'text-gray-400 justify-start'}`}>
          {formatTime(msg.timestamp)}
        </div>
      </div>
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
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Connection Status */}
      <div className="bg-white px-6 py-2 border-b border-gray-200 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
            {isConnected ? 'Server Connected' : 'Server Offline'}
          </span>
        </div>
        <div className="flex items-center text-[10px] text-gray-400 font-medium">
          <span className="mr-2">GEMINI 1.5 PRO</span>
          <div className="h-3 w-[1px] bg-gray-200 mx-2"></div>
          <span>SECURE CHANNEL</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <div className="w-16 h-16 border-2 border-gray-300 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-400">?</span>
              </div>
              <h2 className="text-lg font-bold text-gray-600">Start a Conversation</h2>
              <p className="text-xs text-gray-400 mt-1">SIREN AI is ready to assist you.</p>
            </div>
          )}

          {messages.map(renderMessage)}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="mb-4 flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-r-lg rounded-tl-lg shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 px-4 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm transition-all bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gray-800 hover:bg-black text-white px-6 py-2 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;