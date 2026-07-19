import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Mic, MicOff, X } from 'lucide-react'
import { chatbotAPI } from '../services/api'

// ─── Request Queue to ensure sequential API execution ─────────────────────────
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const { fn, resolve, reject } = this.queue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.process();
    }
  }
}

const apiQueue = new RequestQueue();

// ─── Sarvam AI API helper ─────────────────────────────────────────────────────
const sendToSarvam = async (userMessage, history) => {
  const response = await chatbotAPI.sendMessage(userMessage, history);
  const reply = response.data?.reply;
  if (!reply) {
    throw new Error("No text response received from Sarvam AI");
  }
  return reply;
};

// ─── Exponential Backoff Helper ──────────────────────────────────────────────
const sendToSarvamWithBackoff = async (userMessage, history, onRetry) => {
  const backoffs = [2000, 4000, 8000]; // 2s, 4s, 8s backoff delays
  
  for (let i = 0; i <= backoffs.length; i++) {
    try {
      return await apiQueue.enqueue(() => sendToSarvam(userMessage, history));
    } catch (err) {
      const isRateLimit = err.response?.status === 429 || err.message?.includes("429");
      if (isRateLimit && i < backoffs.length) {
        const ms = backoffs[i];
        if (onRetry) {
          await onRetry(ms / 1000);
        } else {
          await new Promise(r => setTimeout(r, ms));
        }
        continue;
      }
      throw err;
    }
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function VoiceChatbot() {
  const [isOpen, setIsOpen]             = useState(false)
  const [messages, setMessages]         = useState([
    {
      role: "bot",
      text: "नमस्ते! 👋 मैं CivilVerge का सहायक हूँ। आप हिंदी, English, Urdu या Dogri में पूछ सकते हैं। / Hello! I'm the CivilVerge assistant. Ask me anything in Hindi, English, Urdu or Dogri."
    }
  ])
  const [inputValue, setInputValue]     = useState('')
  const [isListening, setIsListening]   = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [recognition, setRecognition]   = useState(null)
  const [isLoading, setIsLoading]       = useState(false)

  const messagesEndRef = useRef(null)

  const speakText = (text) => {
  if (!window.speechSynthesis || !text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const hindiVoice =
    voices.find(v => v.lang === "hi-IN") ||
    voices.find(v => v.lang.startsWith("hi"));

  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }

  window.speechSynthesis.speak(utterance);
};

  // ── Test API connection whenever the panel is opened ──────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const testConnection = async () => {
      try {
        const res = await chatbotAPI.sendMessage("hi", []);
        if (res.data?.reply) {
          console.log("✅ Sarvam AI chatbot backend connected successfully");
        } else {
          console.error("❌ Sarvam AI chatbot issue:", res.data);
        }
      } catch (err) {
        console.error("❌ Sarvam AI connection failed:", err.message);
      }
    };

    testConnection();
  }, [isOpen]);

  // ── Initialise Web Speech Recognition ────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.lang           = 'hi-IN';          // accepts Hindi + English bilingual input

    rec.onstart  = ()      => setIsListening(true);
    rec.onresult = (event) => setInputValue(event.results[0][0].transcript);
    rec.onerror  = (event) => { console.error('Speech error:', event.error); setIsListening(false); };
    rec.onend    = ()      => setIsListening(false);

    setRecognition(rec);
  }, []);

  // ── Auto-scroll chat to bottom ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [isOpen]);

  // ── Voice toggle ──────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try { recognition.start(); } catch (err) { console.error('Could not start mic:', err); }
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    // Snapshot history BEFORE adding the new user message
    const historySnapshot = [...messages];

    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await sendToSarvamWithBackoff(trimmed, historySnapshot, async (seconds) => {
        // Appends / updates rate limit countdown message
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.isRateLimitWarning) {
            return [...prev.slice(0, -1), { role: "bot", text: `Rate limit reached. Please wait ${seconds} seconds...`, isRateLimitWarning: true }];
          } else {
            return [...prev, { role: "bot", text: `Rate limit reached. Please wait ${seconds} seconds...`, isRateLimitWarning: true }];
          }
        });

        // Run countdown ticking every second
        for (let i = seconds - 1; i > 0; i--) {
          await new Promise(r => setTimeout(r, 1000));
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.isRateLimitWarning) {
              return [...prev.slice(0, -1), { role: "bot", text: `Rate limit reached. Please wait ${i} seconds...`, isRateLimitWarning: true }];
            }
            return prev;
          });
        }
        await new Promise(r => setTimeout(r, 1000));

        // Clean up warning before retrying
        setMessages(prev => prev.filter(msg => !msg.isRateLimitWarning));
      });

      setMessages(prev => [...prev, { role: "bot", text: reply }]);
      speakText(reply);
    } catch (error) {
      console.error("Chatbot send error:", error.message);

      // Friendly, context-aware error messages
      let errorText = "Sorry, something went wrong. Please try again.";
      if (error.response?.status === 401 || error.message.includes("401")) {
        errorText = "Chatbot service configuration error. Please contact admin.";
      } else if (error.response?.status === 429 || error.message.includes("429")) {
        errorText = "Sarvam AI rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message.includes("NetworkError") || !error.response) {
        errorText = "Network error. Please check your internet connection.";
      }

      setMessages(prev => [...prev, { role: "bot", text: errorText }]);
      speakText(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();

    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 left-0 w-full h-[80vh] rounded-t-2xl rounded-b-none sm:bottom-24 sm:right-6 sm:left-auto sm:w-[380px] sm:h-[520px] sm:rounded-2xl z-50 bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden transition-all duration-300">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-800 border-b border-slate-750">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-sm text-slate-100">CivilVerge Assistant</span>
            </div>
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsOpen(false);
              }}
              aria-label="Close Chat"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100%-110px)] bg-slate-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-md leading-relaxed break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Animated typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-300 rounded-2xl px-4 py-2.5 max-w-[80%] shadow-md border border-slate-750">
                  <div className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isListening ? "Listening... / सुन रहे हैं..." : "Ask a question... / सवाल पूछें..."}
              disabled={isLoading}
              className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />

            {/* Mic button (or disabled tooltip if unsupported) */}
            {!speechSupported ? (
              <div className="relative group p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700">
                <MicOff size={20} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-white text-xs rounded py-1 px-2.5 whitespace-nowrap z-50 border border-slate-700 shadow-xl pointer-events-none">
                  Voice not supported in this browser
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Mic size={20} />
              </button>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
              className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}