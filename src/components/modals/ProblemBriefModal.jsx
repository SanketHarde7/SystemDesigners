import React from 'react';
import { X, FileText, AlertTriangle, CheckCircle2, Activity, Coins, Zap } from 'lucide-react';

export function ProblemBriefModal({ mission, onClose }) {
  if (!mission) return null;
  const brief = mission.problemBrief || {
    scenario: mission.story,
    bottleneck: mission.eli5Summary,
    goal: mission.objective
  };

  const profile = mission.trafficProfile || { read: 0.7, write: 0.3, static: 0, bot: 0 };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                ARCHITECTURAL PROBLEM STATEMENT & SLA BRIEF
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">{mission.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Core Concept Pill */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#09090b] border border-zinc-800/80">
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Primary System Design Concept</div>
              <div className="text-sm font-semibold text-zinc-100 mt-0.5">{mission.concept}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[10px] text-zinc-500 uppercase">Peak Siege Load (1.35x)</div>
              <div className="text-sm font-semibold text-indigo-400">
                {Math.round(mission.targetRps * 1.35).toLocaleString()} RPS
              </div>
            </div>
          </div>

          {/* 1. Business Context & Scenario */}
          <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1">
            <div className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wide">
              1. System Context & Workload
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{brief.scenario}</p>
          </div>

          {/* 2. Current Bottleneck */}
          <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-1">
            <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>2. Root-Cause Bottleneck (Why It Fails Now)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{brief.bottleneck}</p>
          </div>

          {/* 3. What You Need to Achieve */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. Target Architecture Objective</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{brief.goal}</p>
          </div>

          {/* 4. Traffic Breakdown & SLA Constraints */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Incoming Traffic Breakdown</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Read Queries:</span>
                  <span className="text-zinc-100 font-semibold">{Math.round((profile.read || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Write Queries:</span>
                  <span className="text-zinc-100 font-semibold">{Math.round((profile.write || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Static Media:</span>
                  <span className="text-zinc-100 font-semibold">{Math.round((profile.static || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">Hostile Bots:</span>
                  <span className="text-rose-400 font-semibold">{Math.round((profile.bot || 0) * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500">SLA & Resource Constraints</div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1"><Coins className="w-3 h-3" /> Max Budget:</span>
                  <span className="text-zinc-100 font-semibold">${mission.budget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Power Envelope:</span>
                  <span className="text-zinc-100 font-semibold">{mission.maxPower} MW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Target Latency:</span>
                  <span className="text-emerald-400 font-semibold">&lt; 60 ms (S-Rank &lt; 35ms)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#09090b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            Got It — Return to Architecture Canvas
          </button>
        </div>
      </div>
    </div>
  );
}