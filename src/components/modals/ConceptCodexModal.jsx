import React, { useState } from 'react';
import { X, BookOpen, Search } from 'lucide-react';
import { WEAPON_REGISTRY } from '../../constants/weapons';

export function ConceptCodexModal({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const weapons = Object.values(WEAPON_REGISTRY);

  const filtered = weapons.filter(
    w =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.eli5.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-3xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                System Design Reference Documentation
              </h2>
              <div className="text-[11px] text-zinc-500">
                Architectural patterns, operational tradeoffs, and interview specifications
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-zinc-800/80 bg-[#0c0c0e]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter components by name or architectural pattern (e.g., Redis, Sharding, Kafka)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Documentation Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map(w => (
            <div
              key={w.id}
              className="p-4 rounded-lg bg-[#09090b] border border-zinc-800/90 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">
                    {w.realName}
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Pattern: {w.interview.pattern}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  ${w.cost} • {w.power}MW
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-md bg-[#121215] border border-zinc-800/70">
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-1">
                    Mental Model ({w.eli5.title})
                  </span>
                  <p className="text-zinc-400 leading-relaxed">{w.eli5.analogy}</p>
                </div>

                <div className="p-3 rounded-md bg-[#121215] border border-zinc-800/70">
                  <span className="font-mono text-[10px] uppercase text-indigo-400 block mb-1">
                    Production & Interview Guidance
                  </span>
                  <p className="text-zinc-400 leading-relaxed">{w.interview.interviewTip}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                <div className="text-zinc-400">
                  <span className="text-emerald-400 font-mono text-[10px] uppercase mr-1.5">Strengths:</span>
                  {w.interview.pros}
                </div>
                <div className="text-zinc-400">
                  <span className="text-amber-400 font-mono text-[10px] uppercase mr-1.5">Tradeoffs:</span>
                  {w.interview.cons}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}