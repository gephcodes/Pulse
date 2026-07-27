import React, { useState, memo, useCallback } from 'react';
import { Scale, Sparkles, Loader2, Bot, Flame, CheckCircle } from 'lucide-react';
import { PersonaProfile } from '../types';
import { benchmarkPersonaContrast } from '../services/gemini';

interface BenchmarkViewProps {
  activePersona: PersonaProfile | null;
  onOpenLibrary: () => void;
}

interface BenchmarkResult {
  question: string;
  baseResponse: string;
  replicaResponse: string;
  analysis: string;
  fidelityScore: number;
}

const PRESET_BENCHMARK_QUESTIONS = [
  "How should we handle a major production outage on Friday night?",
  "What is your philosophy on code refactoring vs building new features?",
  "Can you write a polite rejection email for an underperforming vendor?",
  "How do you explain technical debt to non-technical stakeholders?"
];

const BenchmarkResultCard = memo(({ result, activePersonaName }: { result: BenchmarkResult; activePersonaName: string }) => (
  <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <div className="text-xs font-mono font-semibold text-slate-200">
        Question: <span className="text-indigo-400 font-bold">"{result.question}"</span>
      </div>
      <div className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        Replica Fidelity: {result.fidelityScore}%
      </div>
    </div>

    {/* Side-by-side grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Neutral Base AI */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 border-b border-slate-800 pb-2">
          <Bot className="h-4 w-4 text-slate-500" />
          <span>Standard Neutral AI (Base Output)</span>
        </div>
        <div className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap pt-1">
          {result.baseResponse}
        </div>
      </div>

      {/* Persona Replica */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-200 border-b border-indigo-500/20 pb-2">
          <Flame className="h-4 w-4 text-indigo-400" />
          <span>{activePersonaName} (Replica Output)</span>
        </div>
        <div className="text-xs font-mono text-white font-medium leading-relaxed whitespace-pre-wrap pt-1">
          {result.replicaResponse}
        </div>
      </div>
    </div>

    {/* Analysis Box */}
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-1 shadow-2xs">
      <div className="font-bold text-white uppercase tracking-wider text-[10px]">Linguistic Transformation Analysis:</div>
      <p className="leading-relaxed text-slate-300">{result.analysis}</p>
    </div>
  </div>
));

BenchmarkResultCard.displayName = 'BenchmarkResultCard';

export const BenchmarkView: React.FC<BenchmarkViewProps> = memo(({ activePersona, onOpenLibrary }) => {
  const [question, setQuestion] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runBenchmark = useCallback(async (customQ?: string) => {
    const q = customQ || question;
    if (!q.trim() || !activePersona) return;

    setIsRunning(true);
    setError(null);

    try {
      const data = await benchmarkPersonaContrast(activePersona, q);
      setResults((prev) => [
        {
          question: q,
          baseResponse: data.baseResponse,
          replicaResponse: data.replicaResponse,
          analysis: data.analysis,
          fidelityScore: data.fidelityScore
        },
        ...prev
      ]);
      setQuestion('');
    } catch (e: any) {
      console.error('Benchmark failed', e);
      setError(e?.message || 'Failed to execute side-by-side contrast test.');
    } finally {
      setIsRunning(false);
    }
  }, [activePersona, question]);

  if (!activePersona) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
          <Scale className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white">No Persona Selected</h3>
        <p className="text-xs text-slate-400 font-mono">
          Please select a persona replica from the library to perform a side-by-side contrast benchmark.
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
    <div className="max-w-5xl mx-auto py-2 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-400" />
              <span>Side-by-Side Contrast Benchmark</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Benchmark <span className="text-indigo-400 font-bold">{activePersona.name}</span> against a raw neutral Gemini AI model.
            </p>
          </div>

          <div className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Target Persona Loaded</span>
          </div>
        </div>

        {/* Preset scenario shortcuts */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick scenario benchmarks:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_BENCHMARK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => runBenchmark(q)}
                disabled={isRunning}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-left text-xs font-mono text-slate-300 hover:text-indigo-300 transition-all truncate cursor-pointer"
              >
                ⚡ "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runBenchmark()}
            placeholder="Type a scenario or question to benchmark side-by-side..."
            className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />

          <button
            onClick={() => runBenchmark()}
            disabled={!question.trim() || isRunning}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Running Comparison...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <span>Run Contrast Test</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="text-xs text-rose-300 font-medium bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Benchmark Results */}
      <div className="space-y-6">
        {results.map((resItem, idx) => (
          <BenchmarkResultCard
            key={idx}
            result={resItem}
            activePersonaName={activePersona.name}
          />
        ))}
      </div>
    </div>
  );
});

BenchmarkView.displayName = 'BenchmarkView';
