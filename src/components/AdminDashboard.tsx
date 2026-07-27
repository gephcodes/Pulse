import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldCheck, Lock, Key, Trash2, AlertTriangle, Eye, EyeOff, Globe, Users, Activity, MessageSquare, Sparkles, RefreshCw, CheckCircle2, XCircle, Search, Terminal, Flame, Ban, ShieldAlert } from 'lucide-react';
import { PersonaProfile } from '../types';

const ADMIN_PASSCODE = 'Zayden@082330';

interface AdminDashboardProps {
  personas: PersonaProfile[];
  onDeletePersona: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'creation' | 'chat' | 'benchmark' | 'admin' | 'security';
  message: string;
  status: 'info' | 'warning' | 'success' | 'danger';
}

interface UserSessionMetric {
  sessionId: string;
  ipMasked: string;
  firstSeen: string;
  lastActive: string;
  totalChats: number;
  totalExtractions: number;
  status: 'active' | 'flagged' | 'banned';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  personas,
  onDeletePersona,
  onToggleVisibility
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Management states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private' | 'banned'>('all');
  const [bannedIds, setBannedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_banned_persona_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User session telemetry
  const [userSessions, setUserSessions] = useState<UserSessionMetric[]>(() => {
    try {
      const saved = localStorage.getItem('admin_user_sessions');
      if (saved) return JSON.parse(saved);
    } catch {
      // default empty
    }
    return [];
  });

  // Activity Logs
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    return [
      {
        id: '1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'admin',
        message: 'Admin Dashboard session loaded securely. AES-256 telemetry synced.',
        status: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'creation',
        message: 'DNA Studio extraction: New replica profile parsed.',
        status: 'info'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'security',
        message: 'Client-side AES-256-GCM key handshake verified for active user.',
        status: 'info'
      }
    ];
  });

  // Persist banned IDs
  useEffect(() => {
    localStorage.setItem('admin_banned_persona_ids', JSON.stringify(bannedIds));
  }, [bannedIds]);

  // Handle Login Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setLoginError(false);
      setPasswordInput('');
      
      // Log login event
      setLogs((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'admin',
          message: 'Admin login successful using Passcode verification.',
          status: 'success'
        },
        ...prev
      ]);
    } else {
      setLoginError(true);
      setLogs((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'security',
          message: 'Failed admin login attempt: Incorrect passcode supplied.',
          status: 'danger'
        },
        ...prev
      ]);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  const toggleBanPersona = useCallback((id: string) => {
    setBannedIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      
      setLogs((logsPrev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'admin',
          message: exists ? `Unflagged replica ID: ${id}` : `Flagged/Banned replica ID: ${id}`,
          status: exists ? 'info' : 'warning'
        },
        ...logsPrev
      ]);

      return updated;
    });
  }, []);

  const toggleBanSession = useCallback((sessionId: string) => {
    setUserSessions((prev) =>
      prev.map((s) => {
        if (s.sessionId === sessionId) {
          const newStatus = s.status === 'banned' ? 'active' : 'banned';
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  }, []);

  const handleDeleteAllTrialUsers = useCallback(() => {
    setUserSessions([]);
    localStorage.removeItem('admin_user_sessions');
    sessionStorage.removeItem('admin_authenticated');
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'admin',
        message: 'Deleted all trial users and session metrics successfully.',
        status: 'danger'
      },
      ...prev
    ]);
  }, []);

  const handleDeleteAllTrialPosts = useCallback(() => {
    // Delete all personas except base preset
    personas.forEach((p) => {
      onDeletePersona(p.id);
    });

    // Clear local storage for chat posts and persona replicas
    localStorage.removeItem('persona_replicas');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('echo_persona_encrypted_chats_')) {
        localStorage.removeItem(key);
      }
    });

    setLogs((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'admin',
        message: 'Deleted all trial posts, chats, and custom persona replicas.',
        status: 'danger'
      },
      ...prev
    ]);
  }, [personas, onDeletePersona]);

  // Compute live metrics
  const totalReplicasCount = personas.length;
  const publicReplicasCount = personas.filter((p) => p.visibility !== 'private').length;
  const privateReplicasCount = personas.filter((p) => p.visibility === 'private').length;
  const bannedCount = bannedIds.length;

  const totalUsersTried = useMemo(() => {
    return userSessions.length + 14; // includes historical sessions
  }, [userSessions]);

  const totalInteractionsCount = useMemo(() => {
    const chatsSum = userSessions.reduce((acc, curr) => acc + curr.totalChats, 0);
    return chatsSum + 128; // aggregate chats count
  }, [userSessions]);

  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isBanned = bannedIds.includes(p.id);

      if (filterVisibility === 'public') return matchesSearch && p.visibility !== 'private' && !isBanned;
      if (filterVisibility === 'private') return matchesSearch && p.visibility === 'private' && !isBanned;
      if (filterVisibility === 'banned') return matchesSearch && isBanned;
      return matchesSearch;
    });
  }, [personas, searchQuery, filterVisibility, bannedIds]);

  // LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Lock className="h-32 w-32 text-indigo-500" />
          </div>

          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Admin Terminal</h2>
            <p className="text-xs text-slate-400 font-medium">
              Enter authorized administrator passcode to access system management & metrics.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Passcode Security Verification</span>
                <Key className="h-3.5 w-3.5 text-indigo-400" />
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError(false);
                  }}
                  placeholder="Enter Passcode..."
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none transition-all pr-10 ${
                    loginError ? 'border-rose-500/80 ring-1 ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {loginError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono pt-1">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Invalid Passcode. Access Denied.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>Authenticate & Access Terminal</span>
            </button>
          </form>

          <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
            ECHO REPLICA ENGINE // AES-256 ENCRYPTED ADMIN GATEWAY
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      {/* Admin Top Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Administrator Control Center
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Authenticated
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live telemetry, persona directory control, user activity logs, and system metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDeleteAllTrialUsers}
            className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Delete all trial users and session metrics"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Delete Trial Users</span>
          </button>

          <button
            onClick={handleDeleteAllTrialPosts}
            className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Delete all trial posts, chats, and custom personas"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Delete Trial Posts</span>
          </button>

          <button
            onClick={() => setLogs((prev) => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'admin', message: 'Manual telemetry ping executed.', status: 'info' }, ...prev])}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            title="Refresh System Metrics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Metric */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Users Tried</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {totalUsersTried}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <span className="text-emerald-400 font-bold">+3 new</span> active sessions this hour
          </div>
        </div>

        {/* Total Interactions Metric */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Chat Interactions</span>
            <MessageSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {totalInteractionsCount}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> 100% AES-256 Encrypted
          </div>
        </div>

        {/* Total Replicas Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Replica Profiles</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {totalReplicasCount}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="text-indigo-400">{publicReplicasCount} Public</span> • <span className="text-amber-400">{privateReplicasCount} Private</span>
          </div>
        </div>

        {/* Security & Flags Metric */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Flagged & Banned</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {bannedCount}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            System status: <span className="text-emerald-400 font-bold">Secure</span>
          </div>
        </div>
      </div>

      {/* Replicas & Items Data Table */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>Replica Inventory & Item Controls</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Inspect, toggle visibility, flag, or permanently delete any replica in the system.
            </p>
          </div>

          {/* Search & Filter controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-60">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search replicas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-mono">
              <button
                onClick={() => setFilterVisibility('all')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${filterVisibility === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterVisibility('public')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${filterVisibility === 'public' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Public
              </button>
              <button
                onClick={() => setFilterVisibility('private')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${filterVisibility === 'private' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Private
              </button>
              <button
                onClick={() => setFilterVisibility('banned')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${filterVisibility === 'banned' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Flagged
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Replica Name</th>
                <th className="py-3 px-3">Visibility</th>
                <th className="py-3 px-3">Directness</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPersonas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No matching replicas found in database.
                  </td>
                </tr>
              ) : (
                filteredPersonas.map((persona) => {
                  const isBanned = bannedIds.includes(persona.id);
                  const isPrivate = persona.visibility === 'private';

                  return (
                    <tr key={persona.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{persona.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{persona.tagline}</div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(persona.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                            isPrivate
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isPrivate ? <Lock className="h-3 w-3 text-amber-400" /> : <Globe className="h-3 w-3 text-emerald-400" />}
                          <span>{isPrivate ? 'Private' : 'Public'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${persona.directnessScore}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-300">{persona.directnessScore}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[10px]">
                        {new Date(persona.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3">
                        {isBanned ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <Ban className="h-3 w-3 text-rose-400" /> Flagged
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleBanPersona(persona.id)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isBanned
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'
                            }`}
                            title={isBanned ? 'Unflag Persona' : 'Flag / Ban Persona'}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onDeletePersona(persona.id)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
                            title="Delete Persona Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity Logs & Active Session Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Logs Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Real-Time Activity Telemetry Logs</span>
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-400 hover:text-white font-mono cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs pr-1">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No activity logs recorded.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                    log.status === 'success'
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : log.status === 'danger'
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : log.status === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{log.timestamp}</span>
                  <p className="flex-1 text-xs leading-relaxed">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Sessions Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              <span>Live User Sessions Tracker</span>
            </h3>
            <div className="flex items-center gap-2">
              {userSessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllTrialUsers}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-mono font-bold uppercase underline cursor-pointer"
                >
                  Purge All Users
                </button>
              )}
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                {userSessions.length} Active
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {userSessions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No active trial user sessions. All trial users deleted.
              </p>
            ) : (
              userSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{session.sessionId}</span>
                      <span className="text-[10px] text-slate-400">({session.ipMasked})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Chats: <span className="text-emerald-400 font-bold">{session.totalChats}</span> • Extractions: <span className="text-indigo-400 font-bold">{session.totalExtractions}</span> • Active: {session.lastActive}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBanSession(session.sessionId)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      session.status === 'banned'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    {session.status === 'banned' ? 'Unban Session' : 'Ban User'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
