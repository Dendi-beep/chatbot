import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
  error?: boolean;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
}

const MAX_MESSAGE_LENGTH = 1000;

function App() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "default",
      title: "New Chat",
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AI assistant. How can I help you today? 👋",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("default");

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId)!;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content || "I couldn't process your request."
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const newMessage: Message = {
      id: activeSession.messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, newMessage] }
          : s
      )
    );

    setInputMessage("");
    setIsTyping(true);
    setError(null);

    try {
      const botReply = await sendMessageToAPI(inputMessage);

      const botMessage: Message = {
        id: newMessage.id + 1,
        text: botReply,
        sender: "bot",
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, botMessage] }
            : s
        )
      );
    } catch {
      const errorMessage: Message = {
        id: newMessage.id + 1,
        text: "I encountered an error. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
        error: true,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: "New Chat",
      messages: [
        {
          id: 1,
          text: "Hello! I'm your AI assistant. How can I help you today? 👋",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      return inline ? (
        <code className="bg-gray-100 text-sm px-1 py-0.5 rounded">
          {children}
        </code>
      ) : (
        <pre className="bg-gray-900 text-green-200 p-3 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
          <code {...props}>{children}</code>
        </pre>
      );
    },
    p({ children }: any) {
      return <p className="mb-2 whitespace-pre-wrap">{children}</p>;
    },
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-lg border-r border-blue-100 flex flex-col">
        <button
          onClick={createNewSession}
          className="m-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-100 ${
                s.id === activeSessionId
                  ? "bg-blue-200 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Assistant
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 animate-fade-in ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                    message.sender === "bot"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-gray-200 to-gray-300"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <Bot className="w-6 h-6 text-white" />
                  ) : (
                    <User className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    message.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-5 py-3 max-w-md shadow-sm
                    ${
                      message.error
                        ? "bg-red-50 border border-red-100 text-red-600"
                        : message.sender === "bot"
                        ? "bg-white border border-blue-100"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    } transform transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                  >
                    {message.error && (
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-500">
                          Error
                        </span>
                      </div>
                    )}
                    <div
                      className={`prose prose-sm max-w-none ${
                        message.sender === "user"
                          ? "text-white prose-invert"
                          : "text-gray-800"
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 mt-2 mx-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
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
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
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
                    ${
                      error
                        ? "border-red-300 focus:border-red-400"
                        : "border-blue-100 focus:border-blue-300"
                    }
                  `}
                />
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
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl px-6 py-3 
                    flex items-center space-x-2 hover:shadow-lg hover:opacity-90 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <span className="hidden sm:inline font-medium">
                    {isTyping ? "Sending..." : "Send"}
                  </span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
