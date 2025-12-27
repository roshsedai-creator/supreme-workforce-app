import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! 👋 Welcome to Supreme Hospitality Services. I'm here to help you with any questions about our premium cleaning and housekeeping services. How can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        }),
      });

      const data = await response.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "I apologize, but I'm having trouble connecting. Please call us at 03 9221 6236 or email info@supremehospitality.com.au for immediate assistance." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What services do you offer?",
    "How can I get a quote?",
    "What areas do you service?",
    "Do you offer 24/7 support?"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 bg-gradient-to-br from-[#703493] to-[#D4B37A] ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></span>
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#703493] to-[#5a2a76] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D4B37A]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Supreme Assistant</h3>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  AI-Powered • Always Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-[#703493]' 
                      : 'bg-gradient-to-br from-[#703493] to-[#D4B37A]'
                  }`}>
                    {message.type === 'user' 
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-[#703493] text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#703493] to-[#D4B37A] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                    <Loader2 className="w-5 h-5 text-[#703493] animate-spin" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    className="px-3 py-1.5 bg-[#703493]/10 text-[#703493] text-xs rounded-full hover:bg-[#703493]/20 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#703493]/30 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-[#703493] to-[#D4B37A] rounded-xl flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by AI • Available 24/7
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
