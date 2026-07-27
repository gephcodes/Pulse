import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { PersonaCreator } from './components/PersonaCreator';
import { PersonaLibrary } from './components/PersonaLibrary';
import { ChatSandbox } from './components/ChatSandbox';
import { BenchmarkView } from './components/BenchmarkView';
import { DirectivesGuide } from './components/DirectivesGuide';
import { AdminDashboard } from './components/AdminDashboard';
import { SecurityDashboard } from './components/SecurityDashboard';
import LightPillar from './components/LightPillar';
import { PRESET_PERSONAS } from './presets';
import { PersonaProfile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'creator' | 'library' | 'chat' | 'benchmark' | 'directives' | 'admin' | 'security'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('/admin')) {
      return 'admin';
    }
    return 'creator';
  });

  // Listen for browser popstate / path changes
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname.toLowerCase().includes('/admin')) {
        setActiveTab('admin');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  const [personas, setPersonas] = useState<PersonaProfile[]>(() => {
    try {
      const saved = localStorage.getItem('persona_replicas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: PersonaProfile) => {
            if (p.name && p.name.includes('GZC')) {
              return { ...p, name: p.name.replace(/GZC/g, 'Apex') };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load personas from localStorage', e);
    }
    return PRESET_PERSONAS;
  });

  const [activePersona, setActivePersona] = useState<PersonaProfile | null>(() => {
    const initial = personas.length > 0 ? personas[0] : PRESET_PERSONAS[0];
    if (initial && initial.name.includes('GZC')) {
      return { ...initial, name: initial.name.replace(/GZC/g, 'Apex') };
    }
    return initial;
  });

  // Sync custom personas to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('persona_replicas', JSON.stringify(personas));
    } catch (e) {
      console.error('Failed to save personas to localStorage', e);
    }
  }, [personas]);

  const handlePersonaCreated = useCallback((newPersona: PersonaProfile) => {
    setPersonas((prev) => [newPersona, ...prev]);
    setActivePersona(newPersona);
    setActiveTab('chat');
  }, []);

  const handleDeletePersona = useCallback((id: string) => {
    setPersonas((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setActivePersona((currentActive) => {
        if (currentActive?.id === id) {
          return updated.length > 0 ? updated[0] : null;
        }
        return currentActive;
      });
      return updated;
    });
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setPersonas((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newVis = p.visibility === 'private' ? 'public' : 'private';
          return { ...p, visibility: newVis };
        }
        return p;
      })
    );
    setActivePersona((curr) => {
      if (curr?.id === id) {
        const newVis = curr.visibility === 'private' ? 'public' : 'private';
        return { ...curr, visibility: newVis };
      }
      return curr;
    });
  }, []);

  const handleUpdatePersona = useCallback((updatedPersona: PersonaProfile) => {
    setPersonas((prev) =>
      prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    );
    setActivePersona((curr) => (curr?.id === updatedPersona.id ? updatedPersona : curr));
  }, []);

  const handleSelectPersona = useCallback((p: PersonaProfile) => {
    setActivePersona(p);
  }, []);

  const handleStartChat = useCallback((p: PersonaProfile) => {
    setActivePersona(p);
    setActiveTab('chat');
  }, []);

  const handleStartBenchmark = useCallback((p: PersonaProfile) => {
    setActivePersona(p);
    setActiveTab('benchmark');
  }, []);

  const handleOpenLibrary = useCallback(() => {
    setActiveTab('library');
  }, []);

  const personasCount = useMemo(() => personas.length, [personas.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      {/* Full App Background LightPillar - Optimized single instance */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 overflow-hidden">
        <LightPillar
          topColor="#6366f1"
          bottomColor="#312e81"
          intensity={1.1}
          rotationSpeed={0.3}
          glowAmount={0.006}
          pillarWidth={3.2}
          pillarHeight={0.4}
          noiseIntensity={0.3}
          interactive={false}
          mixBlendMode="screen"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activePersona={activePersona}
          personasCount={personasCount}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'creator' && (
            <PersonaCreator onPersonaCreated={handlePersonaCreated} />
          )}

          {activeTab === 'library' && (
            <PersonaLibrary
              personas={personas}
              activePersona={activePersona}
              onSelectPersona={handleSelectPersona}
              onDeletePersona={handleDeletePersona}
              onStartChat={handleStartChat}
              onStartBenchmark={handleStartBenchmark}
              onToggleVisibility={handleToggleVisibility}
              onUpdatePersona={handleUpdatePersona}
            />
          )}

          {activeTab === 'chat' && (
            <ChatSandbox
              activePersona={activePersona}
              onOpenLibrary={handleOpenLibrary}
              onUpdatePersona={handleUpdatePersona}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkView
              activePersona={activePersona}
              onOpenLibrary={handleOpenLibrary}
            />
          )}

          {activeTab === 'directives' && (
            <DirectivesGuide activePersona={activePersona} />
          )}

          {activeTab === 'security' && (
            <SecurityDashboard />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard
              personas={personas}
              onDeletePersona={handleDeletePersona}
              onToggleVisibility={handleToggleVisibility}
            />
          )}
        </main>

        <footer className="h-12 border-t border-slate-800/80 px-8 flex items-center justify-between text-[10px] text-slate-400 font-medium bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Vocab Mapping: Active</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Punctuation Mirror: Active</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              <span>Operational Directives: Enforced</span>
            </span>
          </div>
          <div className="uppercase tracking-widest font-mono text-indigo-400 font-semibold">
            ECHO REPLICA ENGINE // GEMINI 3.6
          </div>
        </footer>
      </div>
    </div>
  );
}
