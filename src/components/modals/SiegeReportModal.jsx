import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Activity,
  FileText,
  Terminal,
  Server,
  Database,
  ShieldAlert
} from 'lucide-react';

export function SiegeReportModal({ report, mission, onNextMission, onRetry, isLastMission }) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'docs'

  if (!report) return null;

  const isSuccess = report.success;
  const learnings = mission?.learnings;

  const gradeBadgeStyle = {
    S: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    B: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    C: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    F: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  // Calculate peak metrics for engineering documentation
  const maxServerLoad = Math.max(...report.waveResults.map(w => Math.round((w.serverLoad || 0) * 100)));
  const maxDbLoad = Math.max(...report.waveResults.map(w => Math.round((w.dbLoad || 0) * 100)));
  const peakRps = Math.max(...report.waveResults.map(w => w.testRps));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-2xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Top Status Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {isSuccess ? 'SLA Benchmark Passed' : 'SLA Violation Detected'}
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    gradeBadgeStyle[report.grade] || gradeBadgeStyle.F
                  }`}
                >
                  GRADE {report.grade}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automated Load Testing & Chaos Resilience Verification Report
              </p>
            </div>
          </div>

          {/* Score & Latency Summary */}
          <div className="flex items-center gap-5 text-right font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">P99 Latency</span>
              <span
                className={`text-sm font-semibold ${
                  report.avgLatency <= 45
                    ? 'text-emerald-400'
                    : report.avgLatency <= 100
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {report.avgLatency} ms
              </span>
            </div>
            <div className="pl-4 border-l border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase">Rating</span>
              <span className="text-sm font-semibold text-zinc-200">{report.stars} / 3 pts</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs: Telemetry vs Post-Mission Engineering Docs */}
        <div className="px-5 pt-3 bg-[#0c0c0e] border-b border-zinc-800/80 flex gap-6 text-xs">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-2.5 font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-indigo-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Benchmark Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'docs'
                ? 'border-indigo-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Post-Mission Engineering Docs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'telemetry' ? (
            <>
              {/* 3-Wave Load Test Table */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 mb-2.5 flex items-center justify-between">
                  <span>Stress Test Phases</span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    PEAK TRAFFIC: {peakRps.toLocaleString()} RPS
                  </span>
                </div>
                <div className="border border-zinc-800/90 rounded-lg overflow-hidden bg-[#09090b]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800/80 text-[10px] font-mono text-zinc-500 uppercase bg-zinc-900/40">
                        <th className="py-2 px-3">Phase</th>
                        <th className="py-2 px-3">Load</th>
                        <th className="py-2 px-3">Compute CPU</th>
                        <th className="py-2 px-3">Storage I/O</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {report.waveResults.map((w) => (
                        <tr key={w.wave} className="hover:bg-zinc-900/30">
                          <td className="py-2.5 px-3 font-sans font-medium text-zinc-200">
                            {w.name}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {w.testRps.toLocaleString()} rps
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={w.serverLoad > 1.05 ? 'text-rose-400' : 'text-zinc-300'}>
                              {Math.min(999, Math.round(w.serverLoad * 100))}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={w.dbLoad > 1.15 ? 'text-rose-400' : 'text-zinc-300'}>
                              {Math.min(999, Math.round(w.dbLoad * 100))}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">{w.latencyMs}ms</td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                w.passed
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {w.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Root-Cause Diagnostics */}
              <div>
                <div className="text-[11px] font-medium text-zinc-400 mb-2">
                  Root-Cause Analysis & Telemetry Logs
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {report.diagnostics.map((diag, idx) => {
                    const isError = diag.includes('❌');
                    const cleanText = diag.replace(/[❌✅]/g, '').trim();
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                          isError
                            ? 'bg-rose-950/10 border-rose-500/20 text-rose-300'
                            : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="font-sans leading-relaxed">{cleanText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Post-Mission Engineering Documentation Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#09090b] border border-zinc-800 space-y-2">
                <div className="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">
                  1. Architectural Post-Mortem Summary
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  During this benchmark, the topology was subjected to a peak surge of{' '}
                  <span className="font-mono text-zinc-100 font-semibold">{peakRps.toLocaleString()} RPS</span>{' '}
                  (1.35x baseline). Compute utilization peaked at{' '}
                  <span className="font-mono text-zinc-100 font-semibold">{Math.min(999, maxServerLoad)}%</span> and storage I/O reached{' '}
                  <span className="font-mono text-zinc-100 font-semibold">{Math.min(999, maxDbLoad)}%</span>.
                </p>
              </div>

              {learnings && (
                <div className="p-4 rounded-lg bg-[#09090b] border border-zinc-800 space-y-3">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                    2. Deep Dive: {learnings.issueTitle}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200">What Happened:</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{learnings.whatWasTheIssue}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200">Real-World Production Fix:</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{learnings.realWorldFix}</p>
                  </div>
                  {learnings.howToIdentify && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-200">How Engineers Identify This in Production:</span>
                      <ul className="list-disc list-inside text-[11px] text-zinc-400 space-y-1">
                        {learnings.howToIdentify.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Compute Layer</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {maxServerLoad <= 85
                      ? 'Optimal headroom maintained (<85% CPU). Queuing delay remained linear.'
                      : "Saturation detected (>85% CPU). According to Little's Law, M/M/1 queueing latency grows exponentially near 100% utilization."}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Data & IOPS Layer</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {maxDbLoad <= 80
                      ? 'Database disk locks avoided. Read/Write throughput operated within safe IOPS thresholds.'
                      : 'Storage contention observed. Offload hot reads via Redis Cache-Aside or buffer writes via Kafka queues.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fault Tolerance</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {report.waveResults.some(w => w.spof)
                      ? 'Single Point of Failure (SPOF) triggered outage during Wave 3 testing.'
                      : 'N+1 Redundancy verified. Traffic seamlessly failed over during Wave 3 testing.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#09090b] flex items-center justify-end gap-2.5">
          <button
            onClick={onRetry}
            className="h-8 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Modify Topology</span>
          </button>

          {isSuccess && !isLastMission && (
            <button
              onClick={onNextMission}
              className="h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Next Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}