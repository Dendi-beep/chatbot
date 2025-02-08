import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  error?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000; // Maximum characters allowed per message
const API_ENDPOINT = 'https://api.ryzendesu.vip/api/ai/v2/chatgpt'; // Your provided API endpoint

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today? 👋",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_MESSAGE_LENGTH) {
      setInputMessage(text);
      setError(null);
    } else {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    }
  };

  const sendMessageToAPI = async (text: string) => {
    try {
      // Using URLSearchParams to properly encode the parameters
      const params = new URLSearchParams({
        text: text,
        prompt: '' // Default prompt value, can be adjusted as needed
      });

      const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if the API response contains an error
      if (data.error) {
        throw new Error(data.error);
      }

      // Return the response from the API
      return data.response || "Fallback message if response is missing.";

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    // Validate message length
    if (inputMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Call API
      const botResponse = await sendMessageToAPI(inputMessage);
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      // Add error message
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "I apologize, but I encountered an error processing your request. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getCharacterCount = () => {
    return `${inputMessage.length}/${MAX_MESSAGE_LENGTH}`;
  };

  const isOverCharacterLimit = inputMessage.length > MAX_MESSAGE_LENGTH;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <p className="text-sm text-gray-500">Always here to help</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 animate-fade-in ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                message.sender === 'bot' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                  : 'bg-gradient-to-r from-gray-200 to-gray-300'
              }`}>
                {message.sender === 'bot' ? 
                  <Bot className="w-6 h-6 text-white" /> : 
                  <User className="w-6 h-6 text-gray-600" />
                }
              </div>
              <div className={`flex flex-col ${
                message.sender === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`rounded-2xl px-5 py-3 max-w-md shadow-sm
                  ${message.error 
                    ? 'bg-red-50 border border-red-100 text-red-600'
                    : message.sender === 'bot'
                      ? 'bg-white border border-blue-100' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  } transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                >
                  {message.error && (
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-medium text-red-500">Error</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                <span className="text-xs text-gray-400 mt-2 mx-2">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-blue-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-blue-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className={`w-full rounded-xl border px-5 py-3 pr-20
                  focus:outline-none focus:ring-2 focus:ring-blue-100
                  bg-white/50 backdrop-blur-sm transition-all duration-200
                  ${error ? 'border-red-300 focus:border-red-400' : 'border-blue-100 focus:border-blue-300'}
                `}
              />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs
                ${isOverCharacterLimit ? 'text-red-500 font-medium' : 'text-gray-400'}
              `}>
                {getCharacterCount()}
              </span>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping || isOverCharacterLimit}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl px-6 py-3 
                  flex items-center space-x-2 hover:shadow-lg hover:opacity-90 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <span className="hidden sm:inline font-medium">
                  {isTyping ? 'Sending...' : 'Send'}
                </span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;