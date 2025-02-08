import React, {useState, useRef,useEffect} from 'react';
import {Send,Bot,User,Sparkles, AlertCircle} from 'lucide-react';



interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  error?:boolean;

}

const MAX_MESSAGES = 1000;
const API_ENDPOINT = '';

function App() {
  const [message, setMessage] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today? 👋",
      sender: 'bot',
      timestamp: new Date(),

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
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_MESSAGES) {
      setInputMessage(text);
      setError(null);
    }else{
      setError(`Message cannot exceed ${MAX_MESSAGES} characters`);
    }
  };

  const sendMessageToAPI = async (text: string) => {
    try{
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          prompt: 'chat'
         }),
      });

      if (!response.ok){
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.response;

    }catch(error){
      console.error(`API ERROR: ${error}`);
      throw error;
    }
  };
  const handleSendMessage = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!inputMessage.trim()|| isTyping) return;

    //validate message length
    if (inputMessage.length > MAX_MESSAGES) {
      setError(`Message cannot exceed ${MAX_MESSAGES} characters`);
      return;
    }
      
    

  }
}