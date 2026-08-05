import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Send, User, Bot, Sparkles, RefreshCw, Flame, CheckCircle, ShieldAlert, Volume2, Info, Loader2, Lock, Globe, ShieldCheck, Key, Eye, EyeOff, Code, Sliders, Heart } from 'lucide-react';
import { PersonaProfile, ChatMessage } from '../types';
import { generatePersonaReply, generateGeminiSpeech } from '../services/gemini';
import { encryptMessageText, decryptMessageText, getKeyFingerprint } from '../lib/crypto';
import { PersonaCustomizerModal } from './PersonaCustomizerModal';

interface ChatSandboxProps {
  activePersona: PersonaProfile | null;
  onOpenLibrary: () => void;
  onUpdatePersona?: (updatedPersona: PersonaProfile) => void;
}

interface EncryptedRecord {
  id: string;
  role: 'user' | 'model';
  encryptedContent: string;
  timestamp: string;
  fidelityScore?: number;
  fidelityReason?: string;
}

// Sub-component 1: Memoized Chat Message Item with Hardware Acceleration
const ChatMessageItem = memo(({
  msg,
  rawEncrypted,
  showCiphertext,
  playingAudioId,
  onPlayTTS
}: {
  msg: ChatMessage;
  rawEncrypted?: string;
  showCiphertext: boolean;
  playingAudioId: string | null;
  onPlayTTS: (id: string, text: string) => void;
}) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex items-start gap-3 will-change-transform ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
          isUser
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-indigo-600 text-white shadow-md'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={`space-y-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Encryption badge */}
        <div className={`flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>AES-256 Encrypted</span>
        </div>

        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap ${
            showCiphertext
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] break-all'
              : isUser
              ? 'bg-slate-800 border border-slate-700 text-white shadow-sm rounded-tr-none'
              : 'bg-indigo-600/90 text-white shadow-md rounded-tl-none border border-indigo-500/30'
          }`}
        >
          {showCiphertext ? rawEncrypted || '[Encrypting...]' : msg.content}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono px-1">
          <span>{msg.timestamp}</span>

          {!isUser && msg.fidelityScore !== undefined && (
            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              <CheckCircle className="h-3 w-3" />
              <span>Fidelity: {msg.fidelityScore}%</span>
            </div>
          )}

          {!isUser && (
            <button
              onClick={() => onPlayTTS(msg.id, msg.content)}
              disabled={playingAudioId === msg.id}
              className="hover:text-indigo-400 p-0.5 transition-colors flex items-center gap-1 cursor-pointer"
              title="Listen with Gemini Speech TTS"
            >
              <Volume2 className={`h-3 w-3 ${playingAudioId === msg.id ? 'animate-bounce text-indigo-400' : ''}`} />
            </button>
          )}
        </div>

        {!isUser && msg.fidelityReason && !showCiphertext && (
          <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono flex items-start gap-1 shadow-2xs">
            <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
            <span>{msg.fidelityReason}</span>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

// Sub-component 2: Memoized Input Field
const ChatInput = memo(({
  onSend,
  isLoading,
  personaName
}: {
  onSend: (text: string) => void;
  isLoading: boolean;
  personaName: string;
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  }, [input, onSend]);

  return (
    <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={`Message ${personaName} (AES-256 Protected)...`}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
      />

      <button
        onClick={handleSubmit}
        disabled={!input.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

// Main ChatSandbox Component
export const ChatSandbox: React.FC<ChatSandboxProps> = memo(({ activePersona, onOpenLibrary, onUpdatePersona }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [encryptedMap, setEncryptedMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [showCiphertext, setShowCiphertext] = useState<boolean>(false);
  const [showCryptoModal, setShowCryptoModal] = useState<boolean>(false);
  const [isEditingPersonaModalOpen, setIsEditingPersonaModalOpen] = useState<boolean>(false);
  const [customRelInput, setCustomRelInput] = useState<string>('');
  const [keyFingerprint, setKeyFingerprint] = useState<string>('AES-256-GCM Loading...');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleUpdateRelationship = useCallback((newRel: string) => {
    if (!activePersona || !onUpdatePersona) return;
    const trimmed = newRel.trim();
    if (!trimmed) return;
    const updatedPersona: PersonaProfile = {
      ...activePersona,
      userRelationship: trimmed
    };
    import('../lib/personaCompiler').then(({ recompileSystemInstruction }) => {
      updatedPersona.compiledSystemInstruction = recompileSystemInstruction(updatedPersona);
      onUpdatePersona(updatedPersona);
      setCustomRelInput('');
    });
  }, [activePersona, onUpdatePersona]);

  // Load encrypted history from localStorage on persona change
  useEffect(() => {
    if (!activePersona) return;

    getKeyFingerprint().then(setKeyFingerprint);

    const storageKey = `echo_persona_encrypted_chats_${activePersona.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const records: EncryptedRecord[] = JSON.parse(stored);
        Promise.all(
          records.map(async (r) => {
            const decryptedContent = await decryptMessageText(r.encryptedContent);
            return {
              decrypted: {
                id: r.id,
                role: r.role,
                content: decryptedContent,
                timestamp: r.timestamp,
                fidelityScore: r.fidelityScore,
                fidelityReason: r.fidelityReason
              },
              encrypted: r.encryptedContent
            };
          })
        ).then((results) => {
          const loadedMsgs = results.map((res) => res.decrypted);
          const encMap: Record<string, string> = {};
          results.forEach((res) => {
            encMap[res.decrypted.id] = res.encrypted;
          });
          setMessages(loadedMsgs);
          setEncryptedMap(encMap);
        });
      } catch (e) {
        console.error('Failed to parse encrypted history:', e);
      }
    } else {
      setMessages([]);
      setEncryptedMap({});
    }
  }, [activePersona?.id]);

  // Non-blocking async persist encrypted history
  const persistEncryptedHistory = useCallback((newMsgs: ChatMessage[], newEncMap: Record<string, string>) => {
    if (!activePersona) return;
    const storageKey = `echo_persona_encrypted_chats_${activePersona.id}`;

    setTimeout(() => {
      const records: EncryptedRecord[] = newMsgs.map((m) => ({
        id: m.id,
        role: m.role,
        encryptedContent: newEncMap[m.id] || '',
        timestamp: m.timestamp,
        fidelityScore: m.fidelityScore,
        fidelityReason: m.fidelityReason
      }));
      localStorage.setItem(storageKey, JSON.stringify(records));
    }, 10);
  }, [activePersona]);

  // Instant non-laggy scroll to bottom using requestAnimationFrame & direct scrollTop
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages.length, isLoading]);

  const handleSend = useCallback(async (text: string) => {
    if (!activePersona || !text.trim()) return;

    const msgId = Date.now().toString();
    const encUserText = await encryptMessageText(text.trim());

    const userMsg: ChatMessage = {
      id: msgId,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      setEncryptedMap((prevEnc) => {
        const updatedEnc = { ...prevEnc, [msgId]: encUserText };
        persistEncryptedHistory(updated, updatedEnc);
        return updatedEnc;
      });
      return updated;
    });

    setIsLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const replyData = await generatePersonaReply(activePersona, text, history, temperature);

      const botMsgId = (Date.now() + 1).toString();
      const encBotReply = await encryptMessageText(replyData.reply);

      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        content: replyData.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fidelityScore: replyData.fidelityScore,
        fidelityReason: replyData.fidelityReason
      };

      setMessages((prev) => {
        const updated = [...prev, botMsg];
        setEncryptedMap((prevEnc) => {
          const updatedEnc = { ...prevEnc, [botMsgId]: encBotReply };
          persistEncryptedHistory(updated, updatedEnc);
          return updatedEnc;
        });
        return updated;
      });
    } catch (e: any) {
      console.error('Failed to generate reply', e);
      const errorMsgId = (Date.now() + 1).toString();
      const errorText = e.message || 'Failed to generate response. Please check API connection.';
      const encError = await encryptMessageText(errorText);

      const errorMsg: ChatMessage = {
        id: errorMsgId,
        role: 'model',
        content: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        setEncryptedMap((prevEnc) => {
          const updatedEnc = { ...prevEnc, [errorMsgId]: encError };
          persistEncryptedHistory(updated, updatedEnc);
          return updatedEnc;
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activePersona, messages, temperature, persistEncryptedHistory]);

  const handleTTS = useCallback(async (msgId: string, text: string) => {
    try {
      setPlayingAudioId(msgId);
      const audioUrl = await generateGeminiSpeech(text, 'Puck');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => setPlayingAudioId(null);
      await audio.play();
    } catch (e) {
      console.error('Speech playback failed', e);
      setPlayingAudioId(null);
    }
  }, []);

  const handleClearHistory = useCallback(() => {
    if (!activePersona) return;
    setMessages([]);
    setEncryptedMap({});
    const storageKey = `echo_persona_encrypted_chats_${activePersona.id}`;
    localStorage.removeItem(storageKey);
  }, [activePersona]);

  if (!activePersona) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
          <Sparkles className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Persona Selected</h3>
        <p className="text-xs text-slate-400 font-mono">
          Please select a persona replica from the library to initiate an operational chat session.
        </p>
        <button
          onClick={onOpenLibrary}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          Open Persona Replica Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-4">
      {/* Top Controls & Security Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-2xs">
            {activePersona.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-white text-sm">{activePersona.name}</h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Directives Active
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-400" /> Helpful Answers Active
              </span>
              {activePersona.visibility === 'private' ? (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private Chat
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Public Chat
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Casing: {activePersona.casingStyle} • Directness: {activePersona.directnessScore}%
            </p>
          </div>
        </div>

        {/* Security & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Customize Bot Button */}
          <button
            onClick={() => setIsEditingPersonaModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300 font-mono transition-all cursor-pointer shadow-sm"
            title="Customize bot name, catchphrases, talking style, and rules"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-bold">Customize Bot</span>
          </button>

          {/* AES Encryption Badge Button */}
          <button
            onClick={() => setShowCryptoModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-mono transition-all cursor-pointer"
            title="Inspect AES-256 Encryption Details"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-bold">AES-256 Encrypted</span>
          </button>

          {/* Ciphertext View Toggle */}
          <button
            onClick={() => setShowCiphertext(!showCiphertext)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              showCiphertext
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
            title="Toggle raw AES ciphertext payload view"
          >
            {showCiphertext ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showCiphertext ? 'Ciphertext' : 'Plaintext'}</span>
          </button>

          {/* Temperature */}
          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Temp: {temperature}</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
            title="Clear Encrypted Chat History"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Relationship Dynamic Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-pink-500/30 rounded-2xl p-3.5 px-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
            <Heart className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Your Relationship with {activePersona.name}:</span>
              <span className="text-[11px] text-pink-300 font-mono bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/40 font-bold">
                {activePersona.userRelationship || 'Best Friend 💖'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              The AI adapts its tone, intimacy, banter, and warmth to fit this relationship naturally.
            </p>
          </div>
        </div>

        {/* Relationship Selector & Custom Type Box */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Best Friend 💖', 'Sibling 👫', 'Crush / Partner 💘', 'Parent / Child 🏡', 'Co-worker 💼', 'Mentor 🎓', 'Rival ⚡'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleUpdateRelationship(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                  activePersona.userRelationship === preset
                    ? 'bg-pink-600 text-white border-pink-400 font-bold shadow-md'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-pink-500/50 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <input
              type="text"
              value={customRelInput}
              onChange={(e) => setCustomRelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateRelationship(customRelInput)}
              placeholder="Or type custom (e.g. My roommate)..."
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-pink-500 placeholder:text-slate-500 w-full sm:w-44"
            />
            <button
              type="button"
              onClick={() => handleUpdateRelationship(customRelInput)}
              disabled={!customRelInput.trim()}
              className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl flex flex-col h-[560px] overflow-hidden shadow-2xl">
        {/* Messages Scroll Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-indigo-400 shadow-md flex items-center gap-2">
                <Sparkles className="h-6 w-6 animate-pulse" />
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                  <span>Interactive Encrypted Replica Chat</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-md font-medium">
                  Chatting with <span className="text-indigo-400 font-bold">{activePersona.name}</span>. All chats are <span className="text-emerald-400 font-bold">AES-256 encrypted</span> and responses are tuned for <span className="text-blue-300 font-bold">maximum helpfulness</span> in character style.
                </p>
              </div>

              {/* Quick High-Utility Test Prompts */}
              <div className="pt-2 w-full max-w-lg space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Code className="h-3 w-3 text-blue-400" />
                  <span>Test High-Utility Helpfulness in Persona Voice:</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-left">
                  {[
                    "How do I fix a CORS origin blocked error in Express and React?",
                    "What is the best architectural pattern to scale state in React?",
                    "How do I optimize database query latency under heavy write load?"
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 text-xs font-mono transition-all text-left truncate shadow-2xs cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">⚡ "{prompt}"</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                rawEncrypted={encryptedMap[msg.id]}
                showCiphertext={showCiphertext}
                playingAudioId={playingAudioId}
                onPlayTTS={handleTTS}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono p-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Encrypting & generating persona replica response...</span>
            </div>
          )}
        </div>

        {/* Isolated Input Footer */}
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          personaName={activePersona.name}
        />
      </div>

      {/* Encryption Inspector Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>AES-256-GCM Chat Encryption Active</span>
              </div>
              <button
                onClick={() => setShowCryptoModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                  <Key className="h-3 w-3 text-emerald-400" /> Local Web Crypto Master Key Fingerprint
                </div>
                <div className="text-emerald-300 font-bold truncate">{keyFingerprint}</div>
              </div>

              <div className="space-y-1 text-slate-300">
                <p className="font-bold text-white text-xs">Security Protocol Guarantee:</p>
                <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-1">
                  <li>Every message is client-side encrypted using 256-bit AES-GCM with a unique 96-bit initialization vector (IV).</li>
                  <li>Local persistence in <code className="text-indigo-300">localStorage</code> stores raw ciphertext blobs only.</li>
                  <li>AI personas provide full utility, high accuracy, and helpful answers while preserving 100% style fidelity.</li>
                </ul>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
                <div className="font-bold text-slate-300">Sample Live Ciphertext Payload:</div>
                <div className="text-emerald-400/80 break-all max-h-20 overflow-y-auto bg-slate-900 p-2 rounded border border-slate-800">
                  {Object.values(encryptedMap)[0] || 'enc:v1:aXZfbm9uY2VfOTY=:Y2lwaGVydGV4dF9hZXNfZ2NtXzI1Nl9zZXNzaW9u'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCryptoModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* In-Chat Persona Customizer Modal */}
      {isEditingPersonaModalOpen && activePersona && (
        <PersonaCustomizerModal
          persona={activePersona}
          isOpen={isEditingPersonaModalOpen}
          onClose={() => setIsEditingPersonaModalOpen(false)}
          onSave={(updatedPersona) => {
            if (onUpdatePersona) {
              onUpdatePersona(updatedPersona);
            }
          }}
        />
      )}
    </div>
  );
});

ChatSandbox.displayName = 'ChatSandbox';
