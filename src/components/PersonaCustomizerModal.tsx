import React, { useState, useCallback } from 'react';
import { X, Sparkles, Plus, Trash2, Sliders, ShieldCheck, Lock, Globe, Save, MessageSquare, CheckCircle2 } from 'lucide-react';
import { PersonaProfile } from '../types';
import { recompileSystemInstruction } from '../lib/personaCompiler';

interface PersonaCustomizerModalProps {
  persona: PersonaProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPersona: PersonaProfile) => void;
}

export const PersonaCustomizerModal: React.FC<PersonaCustomizerModalProps> = ({
  persona,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(persona.name);
  const [tagline, setTagline] = useState(persona.tagline);
  const [toneSummary, setToneSummary] = useState(persona.toneSummary);
  const [casingStyle, setCasingStyle] = useState(persona.casingStyle);
  const [directnessScore, setDirectnessScore] = useState(persona.directnessScore);
  const [formalityScore, setFormalityScore] = useState(persona.formalityScore);
  const [empathyScore, setEmpathyScore] = useState(persona.empathyScore);
  const [visibility, setVisibility] = useState<'public' | 'private'>(persona.visibility || 'public');
  const [userRelationship, setUserRelationship] = useState(persona.userRelationship || '');

  // Dynamic Lists
  const [catchphrases, setCatchphrases] = useState<string[]>(persona.signatureCatchphrases || []);
  const [newCatchphrase, setNewCatchphrase] = useState('');

  const [slangVocabulary, setSlangVocabulary] = useState<string[]>(persona.slangVocabulary || []);
  const [newSlang, setNewSlang] = useState('');

  const [thinkingFramework, setThinkingFramework] = useState<string[]>(persona.thinkingFramework || []);
  const [newThinking, setNewThinking] = useState('');

  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Add Catchphrase
  const handleAddCatchphrase = useCallback(() => {
    if (!newCatchphrase.trim()) return;
    setCatchphrases((prev) => [...prev, newCatchphrase.trim()]);
    setNewCatchphrase('');
  }, [newCatchphrase]);

  const handleRemoveCatchphrase = useCallback((idx: number) => {
    setCatchphrases((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Add Slang
  const handleAddSlang = useCallback(() => {
    if (!newSlang.trim()) return;
    setSlangVocabulary((prev) => [...prev, newSlang.trim()]);
    setNewSlang('');
  }, [newSlang]);

  const handleRemoveSlang = useCallback((idx: number) => {
    setSlangVocabulary((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Add Thinking Framework
  const handleAddThinking = useCallback(() => {
    if (!newThinking.trim()) return;
    setThinkingFramework((prev) => [...prev, newThinking.trim()]);
    setNewThinking('');
  }, [newThinking]);

  const handleRemoveThinking = useCallback((idx: number) => {
    setThinkingFramework((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Handle Save
  const handleSave = () => {
    const updatedDraft: PersonaProfile = {
      ...persona,
      name: name.trim() || persona.name,
      tagline: tagline.trim() || persona.tagline,
      toneSummary: toneSummary.trim() || persona.toneSummary,
      casingStyle: casingStyle.trim() || persona.casingStyle,
      directnessScore,
      formalityScore,
      empathyScore,
      visibility,
      userRelationship: userRelationship.trim(),
      signatureCatchphrases: catchphrases,
      slangVocabulary: slangVocabulary,
      thinkingFramework: thinkingFramework
    };

    // Recompile System Instruction dynamically
    updatedDraft.compiledSystemInstruction = recompileSystemInstruction(updatedDraft);

    onSave(updatedDraft);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Customize Replica Persona
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Tweak name, talking style, signature catchphrases, and behaviors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                Bot Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Founder Bot"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                Tagline / Title
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. High-velocity builder replica"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
              Directory Visibility
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  visibility === 'public'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Globe className="h-4 w-4" /> Public Replica
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Lock className="h-4 w-4" /> Private Replica
              </button>
            </div>
          </div>

          {/* User Relationship Setting */}
          <div className="space-y-2 bg-pink-950/30 border border-pink-500/30 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-pink-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                <span>Relationship to User (Who are you to this bot?)</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-300">
              Set how this person is related to you so the AI talks to you accordingly with appropriate warmth, banter, or intimacy instead of sounding cold.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Best Friend 💖', 'Sibling 👫', 'Crush / Partner 💘', 'Parent / Child 🏡', 'Co-worker 💼', 'Mentor 🎓', 'Rival ⚡'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUserRelationship(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    userRelationship === preset
                      ? 'bg-pink-600 text-white border-pink-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-pink-500/50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={userRelationship}
              onChange={(e) => setUserRelationship(e.target.value)}
              placeholder="Or type custom relationship (e.g. My college roommate, My boss, Childhood friend)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500 placeholder:text-slate-500"
            />
          </div>

          {/* Signature Catchphrases / Things It Should Talk Like */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                <span>Things It Should Say / Catchphrases</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{catchphrases.length} phrases</span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Add specific phrases, mantras, or talking points the bot should frequently use in chat.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newCatchphrase}
                onChange={(e) => setNewCatchphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCatchphrase())}
                placeholder="Add phrase (e.g., 'ship fast', 'trust the process')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCatchphrase}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {catchphrases.map((cp, idx) => (
                <div
                  key={idx}
                  className="bg-indigo-950/60 border border-indigo-500/40 px-2.5 py-1 rounded-xl text-xs text-indigo-200 font-mono flex items-center gap-1.5"
                >
                  <span>"{cp}"</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCatchphrase(idx)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Slang & Vocabulary Words */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Vocabulary & Slang Words</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{slangVocabulary.length} words</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSlang}
                onChange={(e) => setNewSlang(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSlang())}
                placeholder="Add word (e.g., 'lfg', '10x', 'zero fluff')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddSlang}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {slangVocabulary.map((word, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-xs text-emerald-200 font-mono flex items-center gap-1.5"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlang(idx)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Thinking Frameworks & Mindset Rules */}
          <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Thinking Frameworks & Directives</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{thinkingFramework.length} rules</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newThinking}
                onChange={(e) => setNewThinking(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddThinking())}
                placeholder="Add rule (e.g., 'Always prefer working prototypes over slides')..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddThinking}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              {thinkingFramework.map((tf, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 font-mono flex items-center justify-between"
                >
                  <span>• {tf}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveThinking(idx)}
                    className="hover:text-rose-400 cursor-pointer text-slate-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Casing & Tone Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                Tone Summary
              </label>
              <input
                type="text"
                value={toneSummary}
                onChange={(e) => setToneSummary(e.target.value)}
                placeholder="e.g. Direct, crisp, energetic"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                Casing Style
              </label>
              <input
                type="text"
                value={casingStyle}
                onChange={(e) => setCasingStyle(e.target.value)}
                placeholder="e.g. all-lowercase, sentence case"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Directness Slider */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-slate-300">Directness Score: {directnessScore}%</span>
              <span className="text-[10px] text-slate-400">
                {directnessScore > 75 ? 'Hyper Direct / Blunt' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={directnessScore}
              onChange={(e) => setDirectnessScore(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            {isSavedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Saved & Compiled!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Persona Customizations</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
