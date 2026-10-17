import React, { useState } from 'react';
import { X, Sliders, Plus } from 'lucide-react';
import { WEAPON_REGISTRY } from '../../constants/weapons';

export function CustomMissionModal({ onCreateMission, onClose }) {
  const [title, setTitle] = useState('Custom: Global Payment Gateway');
  const [concept, setConcept] = useState('High-Throughput Write Consensus');
  const [targetRps, setTargetRps] = useState(45000);
  const [budget, setBudget] = useState(8000);
  const [maxPower, setMaxPower] = useState(700);
  const [readPct, setReadPct] = useState(50);
  const [writePct, setWritePct] = useState(35);
  const [staticPct, setStaticPct] = useState(10);
  const [botPct, setBotPct] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    const total = readPct + writePct + staticPct + botPct || 100;
    const newMission = {
      id: Date.now(),
      title,
      concept,
      objective: `Sustain ${Number(targetRps).toLocaleString()} RPS within a $${budget} budget constraint.`,
      eli5Summary: 'Custom simulation scenario.',
      story: 'User-defined workload parameters.',
      targetRps: Number(targetRps),
      budget: Number(budget),
      maxPower: Number(maxPower),
      trafficProfile: {
        read: readPct / total,
        write: writePct / total,
        static: staticPct / total,
        bot: botPct / total
      },
      allowedWeapons: Object.keys(WEAPON_REGISTRY),
      unlockedAtStart: Object.keys(WEAPON_REGISTRY),
      initialNodes: [
        { id: 'lb-1', type: 'LOAD_BALANCER', tier: 2, count: 2, x: 140, y: 180 },
        { id: 'srv-1', type: 'SERVER', tier: 2, count: 2, x: 360, y: 180 },
        { id: 'db-1', type: 'DATABASE', tier: 2, count: 1, x: 580, y: 180 }
      ],
      initialConnections: [
        { from: 'lb-1', to: 'srv-1' },
        { from: 'srv-1', to: 'db-1' }
      ],
      guidance: [
        'Provision appropriate edge, compute, and caching layers to meet your custom traffic profile.',
        'Ensure N+1 redundancy across critical path components to pass Wave 3 Chaos testing.'
      ]
    };

    onCreateMission(newMission);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">New Simulation Scenario</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Scenario Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Architectural Focus</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-700"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Target RPS</label>
              <input
                type="number"
                value={targetRps}
                onChange={(e) => setTargetRps(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Power Limit (MW)</label>
              <input
                type="number"
                value={maxPower}
                onChange={(e) => setMaxPower(e.target.value)}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80">
            <div className="font-medium text-zinc-400 mb-2">Workload Distribution (%)</div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Read %</label>
                <input
                  type="number"
                  value={readPct}
                  onChange={(e) => setReadPct(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Write %</label>
                <input
                  type="number"
                  value={writePct}
                  onChange={(e) => setWritePct(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Static %</label>
                <input
                  type="number"
                  value={staticPct}
                  onChange={(e) => setStaticPct(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Bot/DDoS %</label>
                <input
                  type="number"
                  value={botPct}
                  onChange={(e) => setBotPct(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 border-t border-zinc-800/80 bg-[#09090b] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Initialize Scenario</span>
          </button>
        </div>
      </form>
    </div>
  );
}