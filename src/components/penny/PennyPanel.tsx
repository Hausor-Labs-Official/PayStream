'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, Send, MicOff } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import PennyOrb from './PennyOrb';
import PennyThinking from './PennyThinking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PennyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PennyPanel({ isOpen, onClose }: PennyPanelProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello${user?.firstName ? ` ${user.firstName}` : ''}! I'm Penny, your AI payroll assistant. How can I help you with payroll today?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, user, messages.length]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await fetch('/api/penny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          userId: user?.id,
          userEmail: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Penny');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.text || data.text || 'I apologize, I encountered an error.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Play audio if available
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    audio.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const toggleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 w-[28rem] h-screen bg-white border-l border-gray-200 z-30 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Rive Orb */}
            <PennyOrb size={40} isSpeaking={isPlaying} preset={7} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${isPlaying ? 'bg-blue-400' : 'bg-green-400'} rounded-full animate-pulse border-2 border-white`} />
          </div>
          <div>
            <h3 className="font-semibold text-black">Penny</h3>
            <p className="text-xs text-[#737E9C]">AI Payroll Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
          <X className="w-4 h-4 text-[#737E9C]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-[#0044FF] text-white rounded-tr-sm'
                  : 'bg-[#F3F4F6] text-black rounded-tl-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-[#737E9C]'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <PennyThinking />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={listening ? 'Listening...' : 'Ask Penny...'}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-[#0044FF] focus:border-[#0044FF] outline-none"
            rows={1}
            disabled={isLoading}
          />
          {browserSupportsSpeechRecognition && (
            <button
              onClick={toggleVoiceInput}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                listening ? 'bg-red-500 text-white' : 'bg-gray-200 text-[#737E9C] hover:bg-gray-300'
              }`}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-[#0044FF] rounded-xl flex items-center justify-center hover:bg-[#0033CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-xs text-[#6B7280] text-center mt-2">
          Penny can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  );
}
