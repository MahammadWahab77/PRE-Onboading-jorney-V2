import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Square,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Send,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Radio,
  Globe,
} from 'lucide-react';
import type { PortalRoute, EnrollmentState } from '../types';

interface VoiceAgentProps {
  currentRoute: PortalRoute;
  state: EnrollmentState;
}

interface StepGuidance {
  title: string;
  speech: string;
  keyPoints: string[];
  faqSuggestions: string[];
}

export const LANG_OPTIONS = [
  { key: 'English', label: 'English', bcp47: 'en-IN', code: 'en' },
  { key: 'Telugu', label: 'తెలుగు (Telugu)', bcp47: 'te-IN', code: 'te' },
  { key: 'Hindi', label: 'हिन्दी (Hindi)', bcp47: 'hi-IN', code: 'hi' },
  { key: 'Tamil', label: 'தமிழ் (Tamil)', bcp47: 'ta-IN', code: 'ta' },
  { key: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', bcp47: 'kn-IN', code: 'kn' },
];

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  currentRoute,
  state,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [stepData, setStepData] = useState<StepGuidance | null>(null);
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');
  const [questionInput, setQuestionInput] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'agent'; text: string }[]
  >([]);

  // Salesforce Preferred_Languages__c sync
  const crmLanguage = state.learner?.preferredLanguage || 'English';
  const [selectedLanguage, setSelectedLanguage] = useState<string>(crmLanguage);

  useEffect(() => {
    if (state.learner?.preferredLanguage) {
      setSelectedLanguage(state.learner.preferredLanguage);
    }
  }, [state.learner?.preferredLanguage]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechSynthesis on client
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Stop current speech and voice recognition immediately
  const stopSpeech = useCallback(() => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  // Play audio fallback via Google TTS API
  const playAudioFallback = useCallback(async (textToSpeak: string, langCode: string) => {
    try {
      setIsSpeaking(true);
      const res = await fetch(
        `/api/voice-guide/tts?text=${encodeURIComponent(textToSpeak.slice(0, 190))}&lang=${encodeURIComponent(langCode)}`
      );
      const data = await res.json();
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Play text using browser SpeechSynthesis with language support or Google TTS fallback
  const speakText = useCallback(
    (textToSpeak: string, langOverride?: string) => {
      if (!textToSpeak) return;

      stopSpeech();
      setActiveSpeechText(textToSpeak);

      const targetLang = langOverride || selectedLanguage;
      const langConfig =
        LANG_OPTIONS.find((l) => l.key.toLowerCase() === targetLang.toLowerCase()) ||
        LANG_OPTIONS[0];

      // Try browser SpeechSynthesis first
      if (synthRef.current) {
        const voices = synthRef.current.getVoices();
        const matchingVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(langConfig.code) ||
            (langConfig.code === 'en' && (v.lang.includes('en-IN') || v.lang.includes('en-US')))
        );

        if (matchingVoice) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          currentUtteranceRef.current = utterance;
          utterance.voice = matchingVoice;
          utterance.lang = langConfig.bcp47;
          utterance.rate = 1.0;
          utterance.pitch = 1.05;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => {
            setIsSpeaking(false);
            playAudioFallback(textToSpeak, langConfig.code);
          };

          synthRef.current.speak(utterance);
          return;
        }
      }

      // High-quality regional voice fallback via Google TTS API
      playAudioFallback(textToSpeak, langConfig.code);
    },
    [stopSpeech, selectedLanguage, playAudioFallback]
  );

  // Fetch guidance script when step or selectedLanguage changes
  useEffect(() => {
    let isMounted = true;

    const fetchStepGuidance = async () => {
      try {
        const queryParams = new URLSearchParams({
          lang: selectedLanguage,
          token: state.token || '',
        });
        const res = await fetch(`/api/voice-guide/step-script/${currentRoute}?${queryParams.toString()}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setStepData({
            title: data.title,
            speech: data.speech,
            keyPoints: data.keyPoints || [],
            faqSuggestions: data.faqSuggestions || [],
          });

          // If auto-play is enabled, speak guidance
          if (autoPlayEnabled) {
            if (speechTimerRef.current) {
              clearTimeout(speechTimerRef.current);
            }
            // Small pause for page entrance
            speechTimerRef.current = setTimeout(() => {
              // Check if any video or audio is currently playing before starting speech
              const isMediaPlaying =
                typeof document !== 'undefined' &&
                Array.from(document.querySelectorAll('video, audio')).some(
                  (el) => !(el as HTMLMediaElement).paused
                );

              if (isMounted && autoPlayEnabled && !isMediaPlaying) {
                speakText(data.speech);
              }
            }, 500);
          } else {
            setActiveSpeechText(data.speech);
          }
        }
      } catch (err) {
        console.warn('Failed to load step guidance:', err);
      }
    };

    fetchStepGuidance();

    return () => {
      isMounted = false;
      stopSpeech();
    };
  }, [currentRoute, autoPlayEnabled, selectedLanguage, state.token, speakText, stopSpeech]);

  // Handle Asking Question to AI Guide
  const handleAskQuestion = async (query: string) => {
    if (!query.trim()) return;

    setQuestionInput('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: query }]);
    setIsThinking(true);
    stopSpeech();

    try {
      const res = await fetch('/api/voice-guide/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentRoute,
          question: query,
          language: selectedLanguage,
          learnerName: state.learner?.name || 'Learner',
          programName: state.program?.name || 'NxtWave Program',
        }),
      });

      const data = await res.json();
      const answer = data.answer || 'I am here to guide you through your enrollment. Feel free to ask any question.';

      setChatHistory((prev) => [...prev, { sender: 'agent', text: answer }]);
      setIsThinking(false);
      speakText(answer);
    } catch (err) {
      setIsThinking(false);
      const fallback = 'Our counselor team is standing by to help with all questions regarding this step.';
      setChatHistory((prev) => [...prev, { sender: 'agent', text: fallback }]);
      speakText(fallback);
    }
  };

  // Toggle Microphone for Voice Input
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    try {
      stopSpeech();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const langConfig =
        LANG_OPTIONS.find((l) => l.key.toLowerCase() === selectedLanguage.toLowerCase()) ||
        LANG_OPTIONS[0];
      recognition.lang = langConfig.bcp47;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleAskQuestion(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Microphone error:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-96 select-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="voice-panel"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-3 bg-white rounded-2xl shadow-2xl border border-blue-200/80 overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B63E5] to-[#0047BA] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                    <Headphones className="w-5 h-5" />
                  </div>
                  {isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
                    <span>Arya • NxtWave Guide</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </h3>
                  <span className="text-[11px] text-blue-100 flex items-center gap-1">
                    {isSpeaking ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                        Speaking guidance...
                      </span>
                    ) : isListening ? (
                      <span className="text-amber-200 font-semibold">Listening to you...</span>
                    ) : isThinking ? (
                      <span>Thinking...</span>
                    ) : (
                      <span>Guide for: {stepData?.title || 'Current Step'}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Auto Play Toggle */}
                <button
                  type="button"
                  title={autoPlayEnabled ? 'Auto-speak enabled' : 'Auto-speak disabled'}
                  onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    autoPlayEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-blue-200 hover:text-white'
                  }`}
                >
                  {autoPlayEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Language Selector Bar (from CRM Preferred_Languages__c) */}
            <div className="px-3.5 py-2 bg-blue-50/90 border-b border-blue-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-900">
                <Globe className="w-3.5 h-3.5 text-[#0B63E5]" />
                <span>Voice Language:</span>
              </div>
              <select
                aria-label="Select voice language"
                value={selectedLanguage}
                onChange={(e) => {
                  stopSpeech();
                  setSelectedLanguage(e.target.value);
                }}
                className="text-[11px] font-semibold bg-white text-slate-800 border border-blue-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                {LANG_OPTIONS.map((lang) => (
                  <option key={lang.key} value={lang.key}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Area */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 bg-slate-50/50">
              {/* Active Speech / Step Transcript */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#0B63E5] uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
                    Step Audio Guidance
                  </span>

                  {/* Play / Stop Control */}
                  <div className="flex items-center gap-1">
                    {isSpeaking ? (
                      <button
                        type="button"
                        onClick={stopSpeech}
                        className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[10px] flex items-center gap-1"
                      >
                        <Square className="w-2.5 h-2.5 fill-rose-700" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speakText(activeSpeechText || stepData?.speech || '')}
                        className="px-2 py-1 rounded-md bg-blue-50 text-[#0B63E5] hover:bg-blue-100 font-semibold text-[10px] flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-[#0B63E5]" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed font-medium text-xs">
                  "{activeSpeechText || stepData?.speech}"
                </p>

                {/* Animated Voice Waveform when speaking */}
                {isSpeaking && (
                  <div className="flex items-center gap-1 justify-center pt-2.5">
                    <span className="w-1 h-3.5 bg-[#0B63E5] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-5 bg-[#0B63E5] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-6 bg-[#0B63E5] rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1 h-4 bg-[#0B63E5] rounded-full animate-bounce [animation-delay:100ms]" />
                    <span className="w-1 h-2 bg-[#0B63E5] rounded-full animate-bounce [animation-delay:200ms]" />
                  </div>
                )}
              </div>

              {/* Step Key Points */}
              {stepData?.keyPoints && stepData.keyPoints.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Important for this step:
                  </span>
                  <div className="space-y-1">
                    {stepData.keyPoints.map((pt, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-[11px] text-slate-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat History if user asked questions */}
              {chatHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Questions & Answers:
                  </span>
                  {chatHistory.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2.5 rounded-xl text-[11px] ${
                        item.sender === 'user'
                          ? 'bg-blue-50 text-[#0A192F] ml-4 font-semibold border border-blue-100 text-right'
                          : 'bg-white text-slate-700 mr-4 border border-slate-200'
                      }`}
                    >
                      <span className="text-[9px] block text-slate-400 mb-0.5">
                        {item.sender === 'user' ? 'You' : 'Arya (Voice Guide)'}
                      </span>
                      {item.text}
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ Quick Chips */}
              {stepData?.faqSuggestions && stepData.faqSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Common Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stepData.faqSuggestions.map((faq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAskQuestion(faq)}
                        className="text-[10px] py-1 px-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#0B63E5] transition-colors text-left"
                      >
                        {faq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Question Input Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-[#0B63E5]'
                }`}
                title={isListening ? 'Stop listening' : 'Ask question with voice'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAskQuestion(questionInput);
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening to speech...'
                      : isThinking
                      ? 'Thinking...'
                      : 'Ask Arya about this step...'
                  }
                  disabled={isThinking}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-[#0B63E5] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleAskQuestion(questionInput)}
                disabled={!questionInput.trim() || isThinking}
                className="w-9 h-9 rounded-xl bg-[#0B63E5] hover:bg-[#0047BA] disabled:bg-slate-200 text-white flex items-center justify-center shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pill Toggle Button */}
      <motion.button
        type="button"
        id="voice-agent-pill-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            if (!isSpeaking) {
              speakText(activeSpeechText || stepData?.speech || '');
            }
          } else {
            setIsOpen(false);
          }
        }}
        className={`w-full py-2.5 px-4 rounded-full shadow-lg border flex items-center justify-between transition-all cursor-pointer ${
          isSpeaking
            ? 'bg-gradient-to-r from-[#0B63E5] to-[#0047BA] text-white border-blue-400 ring-2 ring-blue-300/40'
            : 'bg-white text-slate-800 border-blue-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              isSpeaking
                ? 'bg-white/20 text-white'
                : 'bg-blue-50 text-[#0B63E5]'
            }`}
          >
            <Headphones className="w-4 h-4" />
          </div>

          <div className="text-left">
            <span
              className={`text-xs font-bold block leading-none ${
                isSpeaking ? 'text-white' : 'text-[#0A192F]'
              }`}
            >
              Arya Voice Guide
            </span>
            <span
              className={`text-[10px] block mt-0.5 leading-none ${
                isSpeaking ? 'text-blue-100' : 'text-slate-500'
              }`}
            >
              {isSpeaking
                ? 'Speaking step instructions...'
                : isOpen
                ? 'Click to collapse guide'
                : 'Tap to listen to this step'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSpeaking && (
            <div className="flex items-center gap-0.5 mr-1">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isSpeaking ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>
      </motion.button>
    </div>
  );
};
