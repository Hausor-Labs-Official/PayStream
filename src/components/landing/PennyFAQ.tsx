'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import faqData from '@/data/penny-faq.json';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function PennyFAQ() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showLabel, setShowLabel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show label periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowLabel(true);
        setTimeout(() => setShowLabel(false), 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add greeting when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: faqData.greeting,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const findAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Try to find exact match first
    const exactMatch = faqData.faqs.find(
      (faq) =>
        faq.question.toLowerCase() === lowerQuery ||
        faq.tags.some((tag) => lowerQuery.includes(tag))
    );

    if (exactMatch) return exactMatch.answer;

    // Try partial match
    const partialMatch = faqData.faqs.find(
      (faq) =>
        faq.question.toLowerCase().includes(lowerQuery) ||
        lowerQuery.includes(faq.question.toLowerCase().split(' ')[0]) ||
        faq.tags.some((tag) => lowerQuery.includes(tag)) ||
        faq.answer.toLowerCase().includes(lowerQuery)
    );

    if (partialMatch) return partialMatch.answer;

    // Fallback
    return faqData.fallbackResponse;
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate Penny thinking and responding
    setTimeout(() => {
      const answer = findAnswer(messageText);
      const pennyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, pennyMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Label */}
        {showLabel && !isOpen && (
          <div className="absolute bottom-20 right-0 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium text-gray-900">Talk to Penny</p>
          </div>
        )}

        {/* Orb Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#0044FF] to-[#0033CC] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Chat with Penny"
        >
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full bg-[#0044FF] opacity-20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-[#0044FF] opacity-30 animate-pulse" />

          {/* Icon */}
          <div className="relative flex items-center justify-center w-full h-full">
            {isOpen ? (
              <X className="w-7 h-7 text-white" />
            ) : (
              <Sparkles className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Notification badge */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0044FF] to-[#0033CC] p-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Penny AI</h3>
                <p className="text-xs text-white/80">Your Payroll Assistant</p>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {faqData.quickPrompts.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="text-xs px-3 py-1.5 bg-white hover:bg-[#0044FF] hover:text-white border border-gray-200 rounded-full transition-all duration-200"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.isUser
                      ? 'bg-[#0044FF] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isUser ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0044FF] focus:border-transparent text-sm"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim()}
                size="icon"
                className="rounded-full w-10 h-10 bg-[#0044FF] hover:bg-[#0033CC] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by AI • FAQ Assistant
            </p>
          </div>
        </div>
      )}
    </>
  );
}
