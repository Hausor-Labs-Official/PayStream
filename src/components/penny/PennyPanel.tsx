'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mic, Send, MicOff, Sparkles, Paperclip, Image as ImageIcon, FileText, Volume2, Circle, Camera, Scan } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import PennyOrb from './PennyOrb';
import PennyThinking from './PennyThinking';
import AgentMonitor from '../agents/AgentMonitor';
import toast from 'react-hot-toast';

interface MessageAttachment {
  type: 'image' | 'file' | 'audio';
  name: string;
  url: string;
  mimeType: string;
  transcription?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

interface PennyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPT_SUGGESTIONS = [
  'Run payroll for this month',
  'Show me employee status',
  'Check treasury balance',
  'Onboard new employee',
  'Review recent transactions',
];

export default function PennyPanel({ isOpen, onClose }: PennyPanelProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAgentMonitor, setShowAgentMonitor] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (transcript && !isLiveVoiceMode) {
      setInput(transcript);
    }
  }, [transcript, isLiveVoiceMode]);

  // Live voice mode: auto-send after pause
  useEffect(() => {
    if (isLiveVoiceMode && transcript && !listening) {
      // Auto-send transcript after user stops speaking
      const timer = setTimeout(() => {
        if (transcript.trim()) {
          handleSend(transcript);
          resetTranscript();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLiveVoiceMode, transcript, listening]);

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

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const detectAgentCommand = (text: string): boolean => {
    const payrollCommands = ['run payroll', 'process payroll', 'execute payroll', 'pay employees'];
    const lowerText = text.toLowerCase();
    return payrollCommands.some(cmd => lowerText.includes(cmd));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert to base64 for transcription
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];

          toast.loading('Transcribing audio...', { id: 'record-transcribe' });

          try {
            const response = await fetch('/api/audio/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType: 'audio/webm',
              }),
            });

            const data = await response.json();

            if (data.success) {
              toast.success('Audio transcribed!', { id: 'record-transcribe' });
              setInput(prev => prev ? `${prev}\n\n${data.transcription}` : data.transcription);
            } else {
              toast.error('Transcription failed', { id: 'record-transcribe' });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Error transcribing audio', { id: 'record-transcribe' });
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const toggleLiveVoiceMode = () => {
    if (isLiveVoiceMode) {
      // Stop live voice mode
      SpeechRecognition.stopListening();
      setIsLiveVoiceMode(false);
      toast.success('Live voice mode disabled');
    } else {
      // Start live voice mode
      if (!browserSupportsSpeechRecognition) {
        toast.error('Your browser does not support speech recognition');
        return;
      }
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
      setIsLiveVoiceMode(true);
      toast.success('Live voice mode enabled - speak to Penny!');
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];

      toast.loading('Scanning document with OCR...', { id: 'ocr-scan' });

      try {
        const response = await fetch('/api/scan/document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
            documentType: 'general',
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Document scanned!', { id: 'ocr-scan' });

          // Format extracted data
          const extractedText = data.data?.text || JSON.stringify(data.data, null, 2);
          setInput(prev => prev ? `${prev}\n\nScanned Document:\n${extractedText}` : `Scanned Document:\n${extractedText}`);

          // Add image as attachment
          const attachment: MessageAttachment = {
            type: 'image',
            name: file.name,
            url: result,
            mimeType: file.type,
          };
          setAttachments(prev => [...prev, attachment]);
        } else {
          toast.error('OCR failed', { id: 'ocr-scan' });
        }
      } catch (error) {
        console.error('OCR error:', error);
        toast.error('Error scanning document', { id: 'ocr-scan' });
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: MessageAttachment[] = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isAudio = file.type.startsWith('audio/');

      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];

        let attachment: MessageAttachment = {
          type: file.type.startsWith('image/') ? 'image' : isAudio ? 'audio' : 'file',
          name: file.name,
          url: result,
          mimeType: file.type,
        };

        // Transcribe audio files
        if (isAudio) {
          toast.loading(`Transcribing ${file.name}...`, { id: `transcribe-${i}` });
          try {
            const response = await fetch('/api/audio/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64,
                mimeType: file.type,
              }),
            });

            const data = await response.json();

            if (data.success) {
              attachment.transcription = data.transcription;
              toast.success(`Transcribed ${file.name}`, { id: `transcribe-${i}` });

              // Auto-fill input with transcription
              setInput(prev => prev ? `${prev}\n\n${data.transcription}` : data.transcription);
            } else {
              toast.error(`Failed to transcribe ${file.name}`, { id: `transcribe-${i}` });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error(`Error transcribing ${file.name}`, { id: `transcribe-${i}` });
          }
        }

        newAttachments.push(attachment);
        processedCount++;

        // Update attachments when all files are processed
        if (processedCount === files.length) {
          setAttachments(prev => [...prev, ...newAttachments]);
        }
      };

      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (overrideText?: string) => {
    const messageText = (overrideText || input).trim();
    if ((!messageText && attachments.length === 0) || isLoading) return;

    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText || '(Sent files)',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    resetTranscript();

    // Clear attachments after sending
    const currentAttachments = [...attachments];
    setAttachments([]);

    // Check if this is an agent command
    if (detectAgentCommand(messageText)) {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m initiating the payroll process now. Our AI agents will handle everything automatically. You can monitor the progress in the Agent Monitor.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);

      // Show agent monitor after a brief delay
      setTimeout(() => {
        setShowAgentMonitor(true);
      }, 1000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/penny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          userId: user?.id,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          attachments: currentAttachments,
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

      // Play audio if available or in live voice mode
      if (data.audioUrl || isLiveVoiceMode) {
        const textToSpeak = assistantMessage.content;
        speakText(textToSpeak);
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed right-0 top-0 w-[28rem] h-screen bg-white border-l border-gray-200 z-30 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Rive Orb */}
            <PennyOrb size={40} isSpeaking={isPlaying} preset={7} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 ${isPlaying ? 'bg-blue-400' : isLiveVoiceMode ? 'bg-purple-400 animate-pulse' : 'bg-green-400'} rounded-full border-2 border-white`} />
          </div>
          <div>
            <h3 className="font-semibold text-black">Penny</h3>
            <p className="text-xs text-[#737E9C]">
              {isLiveVoiceMode ? 'Live Voice Mode' : 'AI Payroll Assistant'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
          <X className="w-4 h-4 text-[#737E9C]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Try these commands:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-xl text-sm font-medium transition-all hover:shadow-md border border-blue-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

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
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2 space-y-2">
                  {message.attachments.map((attachment, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden">
                      {attachment.type === 'image' ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-full max-h-64 rounded-lg"
                        />
                      ) : attachment.type === 'audio' ? (
                        <div className="space-y-2">
                          <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <Volume2 className="w-4 h-4" />
                            <span className="text-xs font-medium truncate">{attachment.name}</span>
                          </div>
                          {attachment.transcription && (
                            <div className={`p-2 rounded-lg text-xs italic ${
                              message.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                            }`}>
                              Transcription: {attachment.transcription}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                          message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-medium truncate">{attachment.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
        {/* Recording indicator */}
        {isRecording && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">Recording: {formatRecordingTime(recordingTime)}</span>
          </div>
        )}

        {/* Live voice mode indicator */}
        {isLiveVoiceMode && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Mic className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-sm font-medium text-purple-700">Live Voice Mode Active</span>
            <button
              onClick={toggleLiveVoiceMode}
              className="ml-auto text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Disable
            </button>
          </div>
        )}

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                {attachment.type === 'image' ? (
                  <div className="relative">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-blue-200"
                    />
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : attachment.type === 'audio' ? (
                  <div className="relative px-3 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg flex items-center gap-2 max-w-[200px]">
                    <Volume2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-purple-700 block truncate">
                        {attachment.name}
                      </span>
                      {attachment.transcription && (
                        <span className="text-xs text-purple-600 block truncate">
                          Transcribed
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="relative px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 max-w-[100px] truncate">
                      {attachment.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors text-[#737E9C]"
            aria-label="Attach file"
            disabled={isLoading || isRecording}
            title="Upload file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-300 transition-colors text-[#737E9C]"
            aria-label="Scan document with OCR"
            disabled={isLoading || isRecording}
            title="Scan document with OCR"
          >
            <Scan className="w-4 h-4" />
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-[#737E9C] hover:bg-gray-300'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Record audio'}
            disabled={isLoading}
            title={isRecording ? 'Stop recording' : 'Record audio'}
          >
            {isRecording ? <Circle className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleLiveVoiceMode}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isLiveVoiceMode ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-200 text-[#737E9C] hover:bg-gray-300'
            }`}
            aria-label={isLiveVoiceMode ? 'Disable live voice' : 'Enable live voice'}
            disabled={isLoading || isRecording || !browserSupportsSpeechRecognition}
            title={isLiveVoiceMode ? 'Disable live voice mode' : 'Enable live voice mode'}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

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
            placeholder={isRecording ? 'Recording...' : listening ? 'Listening...' : isLiveVoiceMode ? 'Speak to Penny...' : 'Ask Penny...'}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-[#0044FF] focus:border-[#0044FF] outline-none"
            rows={1}
            disabled={isLoading || isRecording || isLiveVoiceMode}
          />
          {browserSupportsSpeechRecognition && !isLiveVoiceMode && (
            <button
              onClick={toggleVoiceInput}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                listening ? 'bg-red-500 text-white' : 'bg-gray-200 text-[#737E9C] hover:bg-gray-300'
              }`}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
              disabled={isRecording}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && attachments.length === 0) || isLoading || isRecording || isLiveVoiceMode}
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

    {/* Agent Monitor */}
    <AgentMonitor
      isOpen={showAgentMonitor}
      onClose={() => setShowAgentMonitor(false)}
      processType="payroll"
      executeReal={true}
    />
    </>
  );
}
