import React, { memo } from 'react';
import { Sparkles, MessageSquare, Scale, BookOpen, Layers, ShieldCheck, Lock } from 'lucide-react';
import { PersonaProfile } from '../types';

interface HeaderProps {
  activeTab: 'creator' | 'library' | 'chat' | 'benchmark' | 'directives' | 'admin' | 'security';
  setActiveTab: (tab: 'creator' | 'library' | 'chat' | 'benchmark' | 'directives' | 'admin' | 'security') => void;
  activePersona: PersonaProfile | null;
  personasCount: number;
}

export const Header: React.FC<HeaderProps> = memo(({
  activeTab,
  setActiveTab,
  activePersona,
  personasCount,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold tracking-tight text-base uppercase text-white">
                  ECHO // PERSONA ENGINE
                </h1>
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Behavior, Style & Tone Replica System</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('creator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'creator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>DNA Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Replicas ({personasCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Sandbox Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'benchmark'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Benchmarks</span>
            </button>

            <button
              onClick={() => setActiveTab('directives')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'directives'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Directives</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === 'security'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-emerald-400/90 border-emerald-500/30 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                  : 'text-amber-400/80 border-amber-500/30 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </nav>

          {/* Active Persona Badge */}
          <div className="flex items-center gap-2">
            {activePersona ? (
              <div
                onClick={() => setActiveTab('chat')}
                className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {activePersona.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    Directness: {activePersona.directnessScore}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono px-3 py-1 bg-slate-900/90 rounded-xl border border-slate-800">
                No Persona Selected
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 text-xs font-medium uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-2 py-1 rounded ${activeTab === 'creator' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-2 py-1 rounded ${activeTab === 'library' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Library
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2 py-1 rounded ${activeTab === 'chat' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-2 py-1 rounded ${activeTab === 'benchmark' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveTab('directives')}
            className={`px-2 py-1 rounded ${activeTab === 'directives' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Docs
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2 py-1 rounded flex items-center gap-1 ${activeTab === 'admin' ? 'text-amber-300 font-bold' : 'text-amber-400/80'}`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
