import React, { useEffect, useState } from 'react';
import { X, Trophy, RefreshCw } from 'lucide-react';

export function LeaderboardModal({ onClose }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/leaderboard');
      const data = await res.json();
      setLeaders(data);
    } catch (err) {
      setLeaders([
        { username: 'Principal_Neo', stars: 24, avgLatency: 14, rank: 'Principal Architect' },
        { username: 'Cloud_Samurai', stars: 21, avgLatency: 22, rank: 'Principal Architect' },
        { username: 'Local_Architect', stars: 15, avgLatency: 31, rank: 'Staff Systems Engineer' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Architect Leaderboard</h2>
              <div className="text-[11px] text-zinc-500">Global benchmark rankings by latency & score</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchLeaderboard} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto text-xs">
          {leaders.map((player, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/90 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-mono text-zinc-500 font-semibold">
                  #{idx + 1}
                </span>
                <div>
                  <div className="font-medium text-zinc-200">{player.username}</div>
                  <div className="text-[11px] text-zinc-500">{player.rank}</div>
                </div>
              </div>

              <div className="flex items-center gap-5 font-mono text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">SCORE</span>
                  <span className="text-zinc-200 font-medium">{player.stars} pts</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">P99</span>
                  <span className="text-emerald-400 font-medium">{player.avgLatency}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}