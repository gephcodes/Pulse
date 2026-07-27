import React from 'react';
import { AdminDashboard } from '../../src/components/AdminDashboard';
import { PRESET_PERSONAS } from '../../src/presets';

export default function AdminPage() {
  const [personas, setPersonas] = React.useState(() => {
    try {
      const saved = localStorage.getItem('persona_replicas');
      return saved ? JSON.parse(saved) : PRESET_PERSONAS;
    } catch {
      return PRESET_PERSONAS;
    }
  });

  const handleDeletePersona = (id: string) => {
    setPersonas((prev: any[]) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem('persona_replicas', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleVisibility = (id: string) => {
    setPersonas((prev: any[]) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          return { ...p, visibility: p.visibility === 'private' ? 'public' : 'private' };
        }
        return p;
      });
      localStorage.setItem('persona_replicas', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 selection:bg-indigo-600 selection:text-white">
      <AdminDashboard
        personas={personas}
        onDeletePersona={handleDeletePersona}
        onToggleVisibility={handleToggleVisibility}
      />
    </div>
  );
}
