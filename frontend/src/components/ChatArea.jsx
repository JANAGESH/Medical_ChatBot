import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, VolumeX, ShieldAlert, Sparkles, Brain, Loader2, BookOpen, Copy, Check, RotateCcw, FileText, ChevronDown, ChevronUp, Mic, Lock, ShieldCheck, Heart, HeartPulse, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { authService } from '../utils/api';

// Audio feedback assets
const CLICK_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
const CHIME_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";

// Streaming wrapper component to simulate token-by-token reveal cleanly and performantly
const StreamingText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!text) return;
    
    // Split into tokens (words)
    const tokens = text.split(/(\s+)/);
    let currentTokenIndex = 0;
    let accumulatedText = '';
    
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (currentTokenIndex < tokens.length) {
        accumulatedText += tokens[currentTokenIndex];
        setDisplayedText(accumulatedText);
        currentTokenIndex++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // Empathetic token stream pacing (20ms per token word)
    
    return () => clearInterval(interval);
  }, [text]);
  
  return <ReactMarkdown
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0 font-light">{children}</p>,
      strong: ({ children }) => <strong className="font-extrabold text-medical-cyan">{children}</strong>,
      ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 font-light text-slate-300 leading-relaxed">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 font-light text-slate-300 leading-relaxed">{children}</ol>,
      li: ({ children }) => <li className="mb-1">{children}</li>,
      h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-3">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-1.5 mt-2.5">{children}</h2>,
      h3: ({ children }) => <h3 className="text-xs font-bold text-white mb-1 mt-2">{children}</h3>,
    }}
  >
    {displayedText}
  </ReactMarkdown>;
};

const ChatArea = ({
  messages,
  activeSession,
  onSendMessage,
  sendingMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSourceId, setExpandedSourceId] = useState(null);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  
  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState(null);
  
  // Hydration counter (ml)
  const [waterIntake, setWaterIntake] = useState(0);

  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(null); // { name, progress }
  
  // Audio references
  const clickSoundRef = useRef(null);
  const chimeSoundRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech-to-Text Recognition Hook
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
        }
      };

      rec.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition API is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Calm text-to-speech voice synthesizer playback
  const handleSpeakText = (text, idx) => {
    if ('speechSynthesis' in window) {
      if (isPlayingId === idx) {
        window.speechSynthesis.cancel();
        setIsPlayingId(null);
        return;
      }
      
      window.speechSynthesis.cancel(); // cancel current speech
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Calm medical pace
      utterance.pitch = 1.05; // Warm, supportive pitch
      
      const voices = window.speechSynthesis.getVoices();
      const calmVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural') || v.lang.startsWith('en'));
      if (calmVoice) {
        utterance.voice = calmVoice;
      }

      utterance.onend = () => {
        setIsPlayingId(null);
      };

      utterance.onerror = () => {
        setIsPlayingId(null);
      };

      setIsPlayingId(idx);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-Speech is not supported in this browser.");
    }
  };

  // Drag and drop clinical report PDF upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a medical report PDF document only.");
      return;
    }

    setUploadingFile({ name: file.name, progress: 0 });

    // Progress simulation: 0% to 100% in 1 second
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadingFile(prev => prev ? { ...prev, progress } : null);
      if (progress >= 100) {
        clearInterval(interval);
        dispatchFileUpload(file);
      }
    }, 200);
  };

  const dispatchFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("session_id", activeSession.id);
      formData.append("file", file);

      onSendMessage(null, formData);
      setUploadingFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze PDF report.");
      setUploadingFile(null);
    }
  };
  // Initialize Audio
  useEffect(() => {
    clickSoundRef.current = new Audio(CLICK_SOUND_URL);
    chimeSoundRef.current = new Audio(CHIME_SOUND_URL);
    clickSoundRef.current.volume = 0.12;
    chimeSoundRef.current.volume = 0.12;
  }, []);

  // Play sounds when messages change & trigger streaming hooks
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // Play chime sound on bot reply completion
    if (lastMessage.sender === 'bot') {
      if (soundEnabled) chimeSoundRef.current?.play().catch(() => {});
      
      // Hook streaming state to the last bot message so it streams smoothly
      setStreamingMessageId(messages.length - 1);
    } else {
      if (soundEnabled) clickSoundRef.current?.play().catch(() => {});
    }
  }, [messages, soundEnabled]);

  // Handle auto-scroll to the bottom of the conversation container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || sendingMessage) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSuggestionClick = (promptText) => {
    if (sendingMessage) return;
    onSendMessage(promptText);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length === 0 || sendingMessage) return;
    const lastUserText = userMessages[userMessages.length - 1].content;
    onSendMessage(lastUserText);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getFollowUpChips = (lastBotMessageText) => {
    if (!lastBotMessageText) return [];
    const text = lastBotMessageText.toLowerCase();
    if (text.includes("migraine") || text.includes("headache")) {
      return ["Migraine triggers?", "How long do they last?", "Stress relief tips?"];
    }
    if (text.includes("anemia") || text.includes("iron")) {
      return ["Iron-rich foods?", "Common anemia symptoms?", "How is iron absorbed?"];
    }
    if (text.includes("stress") || text.includes("fatigue") || text.includes("tired")) {
      return ["Breathing exercises?", "Sleep impact on fatigue?", "Daily wellness tips?"];
    }
    if (text.includes("ibuprofen") || text.includes("medication")) {
      return ["General precautions?", "Alternatives?", "When to see a provider?"];
    }
    if (text.includes("uploaded pdf report")) {
      return ["Summarize terminology?", "Explain values simply?", "Wellness insights?"];
    }
    return ["Track this symptom?", "Suggest wellness habits?", "Emergency criteria?"];
  };

  return (
    <section className="flex-1 flex flex-col h-full bg-cyber-mesh bg-grid-overlay relative overflow-hidden">
      
      {/* Dynamic Header Navbar */}
      <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 glass-panel relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-2.5 h-2.5 bg-medical-cyan rounded-full animate-pulse" />
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">
              {activeSession ? activeSession.title : 'AI Health Assistant'}
            </h2>
            <p className="text-[10px] text-slate-400 font-light mt-0.5">
              Calming reference guidance • HIPAA Compliant Session
            </p>
          </div>
        </div>

        {/* Action Controls: Sound Indicator */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              soundEnabled
                ? 'bg-medical-cyan/5 border-medical-cyan/20 text-medical-cyan hover:bg-medical-cyan/10'
                : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
            } cursor-pointer`}
            title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE SPLIT (Left: Messages, Right: Real SaaS Vitals sidebar) */}
      <div className="flex-1 flex min-h-0 relative z-0">
        
        {/* Messages Stream Pane */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto space-y-6">
                
                {/* Premium Animated Empty-State ECG heartbeat Welcome Screen */}
                <div className="flex flex-col items-center space-y-5 text-center select-none">
                  <div className="relative flex items-center justify-center p-6 bg-gradient-to-tr from-medical-blue/15 to-medical-cyan/15 border border-[#00f2fe]/25 rounded-3xl animate-float shadow-xl shadow-[#00f2fe]/5">
                    {/* Ring pulses */}
                    <div className="absolute inset-0 bg-[#00f2fe]/5 border border-[#00f2fe]/10 rounded-3xl animate-ping opacity-75" />
                    <HeartPulse className="h-10 w-10 text-medical-cyan animate-pulse stroke-[2.2]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-black tracking-wider text-white">
                      AEGIS AI PORTAL ACTIVE
                    </h3>
                    <div className="mx-auto w-fit px-3 py-1 bg-medical-cyan/10 border border-medical-cyan/25 text-medical-cyan text-[10px] font-bold tracking-widest rounded-full uppercase flex items-center space-x-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-medical-cyan animate-ping shrink-0" />
                      <span>● Personalized Context Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-light max-w-md">
                    Describe symptoms or ask a wellness question. Aegis AI personalizes recommendations based on your profile metrics and reference manuals.
                  </p>
                </div>

                {/* Suggested Prompt Cards */}
                <div className="w-full space-y-2.5">
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                    SUGGESTED ENQUIRIES
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div 
                      onClick={() => handleSuggestionClick("What causes migraines?")}
                      className="glass-panel hover:glass-panel-cyan p-4 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/20 hover:scale-[1.01] hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-white mb-1">Migraine Triggers</h4>
                      <p className="text-[10.5px] text-slate-400 font-light truncate">"What causes migraines?"</p>
                    </div>
                    
                    <div 
                      onClick={() => handleSuggestionClick("What are symptoms of anemia?")}
                      className="glass-panel hover:glass-panel-cyan p-4 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/20 hover:scale-[1.01] hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-white mb-1">Iron Deficiency</h4>
                      <p className="text-[10.5px] text-slate-400 font-light truncate">"What are symptoms of anemia?"</p>
                    </div>

                    <div 
                      onClick={() => handleSuggestionClick("How to manage stress?")}
                      className="glass-panel hover:glass-panel-cyan p-4 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/20 hover:scale-[1.01] hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-white mb-1">Stress Management</h4>
                      <p className="text-[10.5px] text-slate-400 font-light truncate">"How to manage stress?"</p>
                    </div>

                    <div 
                      onClick={() => handleSuggestionClick("Side effects of ibuprofen")}
                      className="glass-panel hover:glass-panel-cyan p-4 rounded-2xl text-left border border-white/5 hover:border-medical-cyan/20 hover:scale-[1.01] hover:shadow-glass-hover transition-all duration-300 cursor-pointer"
                    >
                      <h4 className="text-xs font-bold text-white mb-1">Medication Overview</h4>
                      <p className="text-[10.5px] text-slate-400 font-light truncate">"Side effects of ibuprofen"</p>
                    </div>
                  </div>
                </div>

                {/* Grounded Disclaimer Banner */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 text-amber-500 rounded-2xl text-[11px] font-medium leading-relaxed max-w-lg flex items-start space-x-2.5 text-left shadow-sm">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 stroke-[2] mt-0.5" />
                  <span>
                    <strong>Professional Reference Guidance:</strong> Aegis AI delivers high-fidelity clinical insights by synthesizing textbook literature and active medical models. This acts as a reference assistant, not a substitute for personalized professional clinical services.
                  </span>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isStreaming = !isUser && streamingMessageId === index;
                
                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="mr-3.5 p-2 bg-gradient-to-tr from-medical-blue/20 to-medical-cyan/20 border border-medical-cyan/30 rounded-xl shrink-0">
                        <HeartPulse className="h-4.5 w-4.5 text-medical-cyan stroke-[2.2]" />
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div className={`max-w-[72%] group relative flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed tracking-wide border transition duration-300 shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-medical-blue to-medical-blue/90 border-medical-blue/30 text-white rounded-tr-none'
                          : 'glass-panel border-white/5 text-slate-200 rounded-tl-none hover:border-white/10'
                      } ${isStreaming ? 'pulse-glow-cyan' : ''}`}>
                        
                        {isUser ? (
                          <p className="whitespace-pre-line font-light">{msg.content}</p>
                        ) : isStreaming ? (
                          // Render word-by-word streaming simulation
                          <StreamingText 
                            text={msg.content} 
                            onComplete={() => setStreamingMessageId(null)} 
                          />
                        ) : (
                          // Standard static render with markdown
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 font-light">{children}</p>,
                              strong: ({ children }) => <strong className="font-extrabold text-medical-cyan">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 font-light text-slate-300 leading-relaxed">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 font-light text-slate-300 leading-relaxed">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-bold text-white mb-2 mt-3">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-1.5 mt-2.5">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-bold text-white mb-1 mt-2">{children}</h3>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {/* Expandable Sources Used Cards (Under bot responses) */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3.5 w-full space-y-2 select-none">
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-medical-cyan" />
                            <span>Sources Used ({msg.sources.length})</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {msg.sources.map((src, srcIdx) => {
                              const uniqueSrcId = `${index}-${srcIdx}`;
                              const isExpanded = expandedSourceId === uniqueSrcId;
                              
                              return (
                                <div 
                                  key={srcIdx} 
                                  className="glass-panel hover:bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden transition-all duration-300 shadow-sm"
                                >
                                  {/* Expand trigger bar */}
                                  <div 
                                    onClick={() => setExpandedSourceId(isExpanded ? null : uniqueSrcId)}
                                    className="p-3 flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-300 group-hover:text-white"
                                  >
                                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                                      <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                      <span className="truncate max-w-[150px]">{src.source}</span>
                                      <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-white/5 shrink-0 text-slate-400 font-normal">
                                        Page {src.page}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3 shrink-0">
                                      <span className="text-[10px] text-medical-cyan font-light tracking-wide bg-medical-cyan/5 px-2 py-0.5 rounded border border-medical-cyan/10">
                                        Confidence: {(src.confidence * 100).toFixed(1)}%
                                      </span>
                                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
                                    </div>
                                  </div>
                                  
                                  {/* Expand content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4.5 pt-1 text-[11.5px] text-slate-400 font-light leading-relaxed border-t border-white/5 bg-slate-950/20 whitespace-pre-line custom-scrollbar max-h-40 overflow-y-auto">
                                      {src.content}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Message Actions (Timing, Copy, Regenerate, Footnote) */}
                      <div className="flex items-center justify-between w-full mt-2 px-1 select-none text-[9.5px]">
                        {!isUser && (
                          <span className="text-slate-500 font-light italic">
                            AI-generated medical guidance
                          </span>
                        )}
                        <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition duration-300">
                          <span className="text-slate-500 font-light uppercase tracking-widest">
                            {formatDate(msg.timestamp)}
                          </span>
                          
                          {!isUser && (
                            <>
                              <button
                                onClick={() => handleSpeakText(msg.content, index)}
                                className={`p-1 rounded transition duration-200 cursor-pointer ${
                                  isPlayingId === index
                                    ? 'text-medical-cyan bg-medical-cyan/10 hover:bg-medical-cyan/20 border border-medical-cyan/10'
                                    : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                                }`}
                                title={isPlayingId === index ? "Stop reading response" : "Read response aloud"}
                              >
                                <Volume2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleCopyText(msg.content, index)}
                                className="p-1 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded transition duration-200 cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === index ? <Check className="h-3 w-3 text-medical-green" /> : <Copy className="h-3 w-3" />}
                              </button>
                              {index === messages.length - 1 && (
                                <button
                                  onClick={handleRegenerate}
                                  className="p-1 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded transition duration-200 cursor-pointer"
                                  title="Regenerate response"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Follow-up suggestion chips (Rendered only on the LAST bot response) */}
                      {!isUser && index === messages.length - 1 && (
                        <div className="mt-3 flex flex-wrap gap-2 animate-fade-in select-none">
                          {getFollowUpChips(msg.content).map((chip, chipIdx) => (
                            <button
                              key={chipIdx}
                              onClick={() => handleSuggestionClick(chip.replace('?', ''))}
                              disabled={sendingMessage}
                              className="px-3.5 py-2 bg-medical-cyan/5 hover:bg-medical-cyan/10 border border-medical-cyan/20 hover:border-medical-cyan/35 text-slate-300 hover:text-white rounded-full text-[10.5px] font-bold transition duration-300 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* AI thinking state loader */}
            {sendingMessage && !streamingMessageId && (
              <div className="flex items-start justify-start animate-fade-in">
                <div className="mr-3.5 p-2 bg-gradient-to-tr from-medical-blue/20 to-medical-cyan/20 border border-medical-cyan/30 rounded-xl shrink-0">
                  <HeartPulse className="h-4.5 w-4.5 text-medical-cyan stroke-[2.2]" />
                </div>
                <div className="glass-panel border-white/5 px-5 py-3.5 rounded-2xl rounded-tl-none flex items-center space-x-3.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-medical-cyan" />
                  <span className="text-xs font-semibold text-slate-400 tracking-wide">
                    Evaluating clinical sources...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CLINICAL METRICS & INTERACTIVE WELLNESS WIDGETS */}
        <div className="hidden xl:flex w-72 border-l border-white/5 flex-col p-6 space-y-6 bg-medical-dark/40 shrink-0 select-none overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1 flex items-center justify-between">
            <span>Health Insights</span>
            <span className="text-[9px] text-medical-cyan animate-pulse">● Active</span>
          </div>

          {/* Dynamic Risk level indicator card */}
          {(() => {
            const user = authService.getUser();
            
            // Calculate age
            let age = null;
            if (user && user.dob) {
              try {
                const birthDate = new Date(user.dob);
                const today = new Date();
                let calculated = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  calculated--;
                }
                age = calculated;
              } catch {}
            }

            // Sleep advisor recommendation
            let sleepRecommendation = "7 - 9 Hours";
            let sleepNote = "Support active mental energy.";
            if (age !== null) {
              if (age < 18) {
                sleepRecommendation = "9 - 11 Hours";
                sleepNote = "Crucial for physical growth and memory consolidation.";
              } else if (age >= 65) {
                sleepRecommendation = "7 - 8 Hours";
                sleepNote = "Target consistent schedules and quiet periods.";
              } else {
                sleepRecommendation = "7 - 9 Hours";
                sleepNote = "Essential for neural recovery and balancing fatigue.";
              }
            }

            // Interactive Risk Indicator based on messages content
            let riskState = "Low Concern";
            let riskColor = "text-medical-green bg-medical-green/5 border-medical-green/20 shadow-medical-green/5";
            let riskNote = "Vitals profile alignment within bounds. No acute symptoms detected.";
            
            const allMessagesText = messages.map(m => m.content.toLowerCase()).join(" ");
            if (allMessagesText.includes("emergency") || allMessagesText.includes("chest pain") || allMessagesText.includes("bleeding") || allMessagesText.includes("paralysis")) {
              riskState = "Seek Medical Attention";
              riskColor = "text-red-400 bg-red-500/5 border-red-500/20 shadow-red-500/5 animate-pulse";
              riskNote = "Emergency indicators detected. Please seek immediate professional clinical services.";
            } else if (allMessagesText.includes("fever") || allMessagesText.includes("pain") || allMessagesText.includes("severe") || allMessagesText.includes("infection")) {
              riskState = "Moderate Concern";
              riskColor = "text-amber-400 bg-amber-500/5 border-amber-500/20 shadow-amber-500/5 animate-pulse";
              riskNote = "Symptom logs suggest moderate strain. Monitor progress and take restful breaks.";
            } else if (messages.length > 0) {
              riskState = "Monitor Symptoms";
              riskColor = "text-medical-cyan bg-medical-cyan/5 border-medical-cyan/20 shadow-medical-cyan/5 animate-pulse";
              riskNote = "Ongoing Symptom tracking. Document any pattern shifts or fatigue levels.";
            }

            // Symptom tracker extract
            const symptomsDiscussed = [];
            if (allMessagesText.includes("migraine") || allMessagesText.includes("headache")) symptomsDiscussed.push("Migraine/Headache");
            if (allMessagesText.includes("anemia") || allMessagesText.includes("iron")) symptomsDiscussed.push("Iron Deficiency/Anemia");
            if (allMessagesText.includes("stress") || allMessagesText.includes("fatigue") || allMessagesText.includes("tired")) symptomsDiscussed.push("Stress/Fatigue Management");
            if (allMessagesText.includes("uploaded pdf report") || allMessagesText.includes("pdf")) symptomsDiscussed.push("Clinical PDF Uploaded");

            return (
              <>
                {/* Risk Level Widget */}
                <div className={`p-4 border rounded-2xl space-y-2 shadow-inner transition-all duration-300 ${riskColor}`}>
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Risk Guidance</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide">{riskState}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal font-light mt-1">
                      {riskNote}
                    </p>
                  </div>
                </div>

                {/* Hydration Tracker */}
                <div className="glass-panel p-4.5 rounded-2xl border border-white/5 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center space-x-1.5">
                      <Activity className="h-3.5 w-3.5 text-medical-cyan" />
                      <span>Hydration tracker</span>
                    </span>
                    <span className="text-medical-cyan">{waterIntake} ml</span>
                  </div>
                  
                  {/* Floating glass water meter progress */}
                  <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/5 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-medical-blue to-medical-cyan rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (waterIntake / 2000) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 font-light">Target: 2000 ml</span>
                    <button
                      type="button"
                      onClick={() => setWaterIntake(prev => prev + 250)}
                      className="px-2.5 py-1 bg-medical-cyan/5 hover:bg-medical-cyan/15 border border-medical-cyan/20 hover:border-medical-cyan/35 text-medical-cyan hover:text-white rounded-lg text-[9px] font-bold transition duration-300 cursor-pointer"
                    >
                      + 250 ml
                    </button>
                  </div>
                </div>

                {/* Sleep Advisor Widget */}
                <div className="glass-panel p-4.5 rounded-2xl border border-white/5 shadow-sm space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400/20" />
                    <span>Sleep Advisor</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Recommended: {sleepRecommendation}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal font-light">
                      {sleepNote}
                    </p>
                  </div>
                </div>

                {/* Active Concerns Symptom Tracker widget */}
                {symptomsDiscussed.length > 0 && (
                  <div className="glass-panel p-4.5 rounded-2xl border border-white/5 shadow-sm space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-1.5">
                      Symptom Logs ({symptomsDiscussed.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {symptomsDiscussed.map((sym, symIdx) => (
                        <span 
                          key={symIdx}
                          className="px-2 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] text-slate-300 font-semibold truncate max-w-full"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Session Security */}
          <div className="glass-panel p-4.5 rounded-2xl space-y-2 border border-white/5 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Session Isolation</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-light">
              AES-256 session lock isolates reference logs. Consultations are database-mapped to user token keys.
            </p>
          </div>
        </div>
      </div>

      {/* INPUT FORM WRAPPER AREA */}
      <div className="p-5 border-t border-white/5 shrink-0 glass-panel relative z-10">
        
        {/* Sleek Upload Progress Animation Overlay */}
        {uploadingFile && (
          <div className="absolute inset-x-0 bottom-24 mx-auto w-72 p-4 rounded-2xl glass-panel-cyan border border-medical-cyan/25 text-xs text-slate-300 flex flex-col space-y-2.5 shadow-xl backdrop-blur-md animate-fade-in z-20">
            <div className="flex justify-between items-center font-bold text-white">
              <span className="truncate max-w-[180px]">Analyzing: {uploadingFile.name}</span>
              <span className="text-medical-cyan">{uploadingFile.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-medical-blue to-medical-cyan rounded-full transition-all duration-300"
                style={{ width: `${uploadingFile.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Futuristic Speech waveform Listening bubble */}
        {isListening && (
          <div className="absolute inset-x-0 bottom-24 mx-auto w-fit px-5 py-3 rounded-full bg-medical-cyan/10 border border-medical-cyan/20 text-medical-cyan text-xs font-bold flex items-center space-x-3.5 animate-bounce shadow-lg shadow-medical-cyan/5 z-20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-medical-cyan animate-ping shrink-0" />
            <span>Aegis Voice Recognition Active • Listening...</span>
            <div className="flex items-center space-x-0.5 shrink-0">
              <span className="w-1 h-3 bg-medical-cyan animate-pulse rounded-full" />
              <span className="w-1 h-4.5 bg-medical-cyan animate-pulse rounded-full" />
              <span className="w-1 h-2 bg-medical-cyan animate-pulse rounded-full" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            required
            disabled={sendingMessage || !activeSession}
            placeholder={activeSession ? "Verify symptoms or describe clinical references..." : "Select or create a conversation record on the left to activate input..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 focus:border-medical-cyan/35 disabled:opacity-50 disabled:pointer-events-none text-slate-200 pl-6 pr-28 py-4 rounded-2xl outline-none placeholder:text-slate-600 focus:shadow-3d-cyan focus:bg-white/[0.04] transition-all duration-300 text-xs tracking-wide shadow-inner"
          />
          
          {/* Action Row inside Input */}
          <div className="absolute right-3.5 flex items-center space-x-2.5">
            {/* Medical PDF Report Upload Attachment Button */}
            <label className={`p-2 rounded-xl transition-all duration-300 cursor-pointer hidden sm:block ${
              sendingMessage || !activeSession
                ? 'opacity-40 pointer-events-none'
                : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
            }`} title="Attach clinical report PDF">
              <FileText className="h-4 w-4" />
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={sendingMessage || !activeSession}
                onChange={handleFileUpload}
              />
            </label>

            {/* Voice STT Microphone Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={!activeSession || sendingMessage}
              className={`p-2 rounded-xl transition-all duration-300 cursor-pointer hidden sm:block ${
                isListening
                  ? 'text-medical-cyan bg-medical-cyan/15 animate-pulse border border-medical-cyan/20'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice input Speech-to-Text"}
            >
              <Mic className="h-4 w-4" />
            </button>
            
            <button
              type="submit"
              disabled={sendingMessage || !inputText.trim() || !activeSession}
              className="p-3 bg-gradient-to-r from-medical-blue to-medical-cyan text-medical-dark rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-3d-cyan flex items-center justify-center shrink-0 disabled:opacity-30 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        <p className="text-[10px] text-slate-500 font-light mt-3 text-center tracking-wide flex items-center justify-center space-x-1.5 select-none">
          <ShieldAlert className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <span>Aegis AI provides reference literature summaries. Treat clinical queries with medical practitioners.</span>
        </p>
      </div>
    </section>
  );
};

export default ChatArea;
