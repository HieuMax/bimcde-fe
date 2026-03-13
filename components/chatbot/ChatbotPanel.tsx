"use client";

import { X, Plus, Loader2, Bot, History, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { chatbotService } from "@/services/chatbot.services";
import { ChatMessage } from "@/types/chatbot";

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Role = "user" | "assistant";

interface Message {
  role: Role;
  content: string;
}

const STORAGE_KEY = "cde_chatbot_history";

export default function ChatbotPanel({ isOpen, onClose }: ChatbotPanelProps) {

  const initialMessage: Message = {
    role: "assistant",
    content: "Hello! I am CDE Assistant. I can help you use the BIMCDE system.",
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Manage current screen (chat or history)
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");

  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How do I create a new 3D view for a project?",
    "How can I share a model with other team members?",
    "What are the main features in the 3D viewer?",
    "How do I toggle annotations in the viewer?",
  ];

  // Load chat history from localStorage
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const savedHistory = localStorage.getItem(STORAGE_KEY);

      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);

          if (parsedHistory && parsedHistory.length > 1) {
            setMessages(parsedHistory);
            setShowSuggestions(false);
          }

        } catch (error) {
          console.error("Error reading chat history:", error);
        }
      }

      setIsInitialized(true);
    }

  }, [isOpen, isInitialized]);

  // Save chat history
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isInitialized]);

  // Auto scroll
  useEffect(() => {
    if (viewMode === "chat") {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, viewMode]);

  if (!isOpen) {
    if (isInitialized) setIsInitialized(false);
    return null;
  }

  // NEW CHAT
  const handleNewChat = () => {
    setMessages([initialMessage]);
    setInput("");
    setShowSuggestions(true);
    setViewMode("chat");

    localStorage.removeItem(STORAGE_KEY);
  };

  // SEND MESSAGE
  const handleSend = async (text?: string) => {

    const message = text ?? input;

    if (!message.trim() || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: message }
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {

      const res = await chatbotService.sendMessage({
        message,
        history: newMessages,
      });

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: res.reply ?? "Sorry, I couldn't find an answer for that.",
        }
      ]);

    } catch (error) {

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred while contacting the assistant.",
        }
      ]);

      console.error("Chatbot error:", error);
    }

    setLoading(false);
  };

  return (
    <aside className="fixed top-14 right-0 bottom-0 z-40 w-full sm:w-[380px] md:w-[420px] bg-white border-l border-gray-200 shadow-xl flex flex-col transition-all duration-300">

      {/* HEADER */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200 bg-white z-10">

        <div>

          <div className="flex items-center gap-1">

            <Bot size={18} className="text-indigo-600 mr-1" />

            <h2 className="text-base font-semibold text-gray-900 mr-2">
              CDE Assistant
            </h2>

            {/* HISTORY BUTTON */}
            <button
              onClick={() => setViewMode(viewMode === "chat" ? "history" : "chat")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "history"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title={viewMode === "chat" ? "View chat history" : "Back to chat"}
            >
              <History size={16} />
            </button>

            {/* NEW CHAT BUTTON */}
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Start a new conversation"
            >
              <Plus size={16} />
            </button>

          </div>

          <p className="text-xs text-gray-500 mt-1">
            {viewMode === "history"
              ? "Manage your previous conversations."
              : "Helping you use BIMCDE features."}
          </p>

        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

      </div>

      {/* BODY SWITCH BETWEEN HISTORY AND CHAT */}
      {viewMode === "history" ? (

        /* HISTORY VIEW */
        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Recent
          </p>

          <div className="flex flex-col gap-2">

            <button
              onClick={() => setViewMode("chat")}
              className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
            >

              <MessageSquare size={18} className="text-gray-400 group-hover:text-indigo-500 mt-0.5" />

              <div className="flex-1 overflow-hidden">

                <p className="text-sm font-medium text-gray-800 truncate">
                  {messages.length > 1 ? messages[1].content : "Current conversation"}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {messages.length} messages
                </p>

              </div>

            </button>

          </div>

        </div>

      ) : (

        /* CHAT VIEW */
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* SUGGESTIONS */}
          {showSuggestions && (
            <div className="px-4 py-3 border-b border-gray-100 bg-white">

              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Suggested questions
              </p>

              <div className="flex flex-wrap gap-2">

                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors text-gray-700"
                  >
                    {q}
                  </button>
                ))}

              </div>

            </div>
          )}

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">

            {messages.map((msg, i) => (

              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "items-start"}`}>

                {msg.role === "assistant" && (
                  <div className="mt-1 flex-shrink-0 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>

              </div>

            ))}

            {/* LOADING */}
            {loading && (

              <div className="flex gap-2 items-start">

                <div className="mt-1 flex-shrink-0 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Bot size={14} />
                </div>

                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-500 shadow-sm">
                  <Loader2 className="animate-spin text-indigo-500" size={16} />
                  Processing...
                </div>

              </div>

            )}

            <div ref={scrollRef} />

          </div>

          {/* INPUT */}
          <div className="border-t border-gray-200 px-4 py-3 bg-white">

            <div className="flex items-center gap-2">

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                type="text"
                placeholder="Ask a question about BIMCDE..."
                className="flex-1 text-sm px-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-gray-50"
              />

              <button
                disabled={loading || !input.trim()}
                onClick={() => handleSend()}
                className="px-4 py-2.5 text-sm font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>

            </div>

            <p className="mt-2 text-[10px] text-gray-400 text-center">
              AI assistants may produce incorrect information. Please verify important details.
            </p>

          </div>

        </div>
      )}

    </aside>
  );
}