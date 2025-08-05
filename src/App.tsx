import React, { useState, useEffect, useRef } from "react";
import "highlight.js/styles/github-dark.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Plus,
  Menu,
  Copy,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import OpenAI from "openai";

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

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem("chat-sessions");
    if (!saved)
      return [
        {
          id: "default",
          title: "New Chat",
          messages: [
            {
              id: 1,
              text: "Hallo ! Saya AI asisten. Apa yang bisa saya bantu 👋",
              sender: "bot",
              timestamp: new Date(),
            },
          ],
        },
      ];
    return JSON.parse(saved, (key, value) =>
      key === "timestamp" ? new Date(value) : value
    );
  });

  const [activeSessionId, setActiveSessionId] = useState(
    () => localStorage.getItem("active-session") || "default"
  );
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId)!;

  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isTyping]);

  useEffect(() => {
    localStorage.setItem("chat-sessions", JSON.stringify(sessions));
    localStorage.setItem("active-session", activeSessionId);
  }, [sessions, activeSessionId]);

  const sendMessageToAPI = async (text: string) => {
    const messagesToSend = [
      {
        role: "system",
        content:
          "Kamu adalah AI asisten di website ini. " +
          "Jika pengguna bertanya tentang website atau tentang AI ini, " +
          "jawablah bahwa website ini menggunakan model seperti GPT-4 " +
          "dan dikembangkan oleh Dendi Ananda Putra." +
          "Jawablah dengan ramah",
      },
      ...activeSession.messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: text },
    ];

    const res = await client.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: messagesToSend,
    });
    return (
      res.choices[0].message?.content || "I couldn't process your request."
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
          ? {
              ...s,
              messages: [...s.messages, newMessage],
              title:
                s.messages.filter((m) => m.sender === "user").length === 0
                  ? inputMessage.slice(0, 20) +
                    (inputMessage.length > 20 ? "..." : "")
                  : s.title,
            }
          : s
      )
    );

    setInputMessage("");
    setIsTyping(true);

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
      const errorMsg: Message = {
        id: newMessage.id + 1,
        text: "I encountered an error. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
        error: true,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
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
          text: "Hello! Saya AI asisten. Apa yang bisa saya bantu 👋",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0]?.id || "default");
      }
      return filtered;
    });
  };

  const startRename = (session: Session) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleRename = (id: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title: editingTitle || "Untitled" } : s
      )
    );
    setEditingSessionId(null);
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="p-2">
        <Button
          onClick={createNewSession}
          className="w-full justify-start bg-black hover:bg-black/80 text-white"
          size={isCollapsed ? "icon" : "default"}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* Chat Sessions */}
      <ScrollArea className="flex-1 px-2 space-y-1">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center rounded-md hover:bg-gray-200 group cursor-pointer px-2 py-2 transition",
              s.id === activeSessionId ? "bg-gray-200" : ""
            )}
          >
            {isCollapsed ? (
              <Avatar
                onClick={() => setActiveSessionId(s.id)}
                className="h-8 w-8 bg-gray-300 text-gray-800"
              >
                <AvatarFallback>{s.title.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : editingSessionId === s.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleRename(s.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(s.id)}
                autoFocus
                className="flex-1 mr-2 bg-gray-100 text-gray-900 border-gray-300"
              />
            ) : (
              <div
                onClick={() => setActiveSessionId(s.id)}
                className="flex-1 truncate text-sm"
              >
                {s.title}
              </div>
            )}

            {!isCollapsed && s.id !== "default" && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startRename(s)}
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSession(s.id)}
                  className="h-6 w-6 text-gray-500 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 flex justify-between items-center">
        {!isCollapsed && (
          <span className="text-xs text-gray-400">© 2025 AI</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </div>
  );

  const MarkdownComponents = {
    code({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) {
      const text = String(children);
      const codeId = Math.random().toString(36).substring(2);

      // Inline code
      if (inline) {
        return (
          <code className="bg-gray-100 text-sm px-1 py-0.5 rounded">
            {children}
          </code>
        );
      }

      // Block code
      return (
        <div className="relative group my-2">
          <pre className="bg-gray-900 text-green-200 p-3 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            <code {...props}>{children}</code>
          </pre>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(codeId);
              setTimeout(() => setCopied(null), 1500);
            }}
          >
            {copied === codeId ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      );
    },

    p({ children }: any) {
      const hasBlockChild = React.Children.toArray(children).some(
        (child: any) =>
          React.isValidElement(child) &&
          ["div", "pre"].includes(child.type as string)
      );

      return hasBlockChild ? (
        <div className="mb-2 whitespace-pre-wrap">{children}</div>
      ) : (
        <p className="mb-2 whitespace-pre-wrap">{children}</p>
      );
    },
  };

  return (
    <TooltipProvider>
      <div className="h-screen bg-background">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Desktop */}
          <ResizablePanel
            defaultSize={isCollapsed ? 5 : 20}
            minSize={5}
            maxSize={30}
            className={cn(
              "hidden md:block border-r border-gray-200 transition-all duration-300",
              isCollapsed ? "min-w-[50px]" : "min-w-[200px]"
            )}
          >
            {SidebarContent}
          </ResizablePanel>

          {/* Main Content */}
          <ResizablePanel defaultSize={80}>
            <div className="flex flex-col h-full">
              <CardHeader className="border-b flex items-center justify-center md:justify-between relative px-4 py-3">
                <CardTitle className="text-center md:text-left truncate max-w-[70%] md:max-w-full">
                  {activeSession.title}
                </CardTitle>

                {/* Tombol floating sidebar mobile */}
                <div className="md:hidden fixed top-4 left-4 z-50">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="shadow-lg rounded-full bg-white hover:bg-gray-100"
                      >
                        <Menu className="w-5 h-5 text-gray-800" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[260px]">
                      {SidebarContent}
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {activeSession.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Card
                        className={cn(
                          "p-4 max-w-[80%]",
                          message.error
                            ? "border-destructive bg-destructive/10"
                            : message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background"
                        )}
                      >
                        <CardContent className="p-0">
                          {message.error && (
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <span className="text-xs font-medium text-destructive">
                                Error
                              </span>
                            </div>
                          )}
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={MarkdownComponents}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </CardContent>
                      </Card>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center space-x-2 text-muted-foreground text-sm animate-pulse">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <Card className="p-3">
                        <CardContent className="p-0 flex space-x-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce delay-150">●</span>
                          <span className="animate-bounce delay-300">●</span>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />
              <form
                onSubmit={handleSendMessage}
                className="p-4 flex space-x-2 max-w-3xl mx-auto w-full"
              >
                <Input
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  maxLength={MAX_MESSAGE_LENGTH}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
