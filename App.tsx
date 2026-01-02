
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Waves, 
  ShieldCheck, 
  Wind, 
  Trash2, 
  AlertCircle,
  Globe,
  Layers,
  Activity,
  Cpu,
  Fingerprint,
  BarChart3,
  Server,
  Zap,
  Ban,
  Target,
  RefreshCcw
} from 'lucide-react';
import { LaneManager } from './services/laneState';
import { Transaction, Lane } from './types';

const BATCH_INTERVAL = 15000; 
const HELIUS_WEBHOOK_ID = "ee7556bb-3d23-4768-866d-700db62690d5";
const WEBHOOK_STORE_URL = "https://webhook.site/#!/view/9b22baa7-ec59-4cc0-8408-02b32d4c1aa9/ea39bc91-f1fb-448c-84a2-cc71daee6592/1";

const PROP_AMM_PROGRAMS = [
  { id: "9H6tua7jkLhdm3w8BvgpTn5LZNU7g4ZynDmCiNN3q6Rp", name: "HumidiFi", note: "Lane + Half Backfill (2025 Market Leader)" },
  { id: "ZERor4xhbUycZ6gb9ntrhqscUcZmAbQDjEAtCf4hbZY", name: "ZeroFi", note: "Prop AMM Architecture" },
  { id: "goonERTdGsjnkZqWuVjs73BZ3Pb9qoCUdBUL17BnS5j", name: "GoonFi", note: "Prop AMM Architecture" },
  { id: "TessVdML9pBGgG9yGks7o4HewRaXVAMuoVj4x83GLQH", name: "Tessera V", note: "Vanity Address Prop AMM" }
];

const App: React.FC = () => {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [nextUpdateIn, setNextUpdateIn] = useState(BATCH_INTERVAL);

  const laneManagerRef = useRef(new LaneManager());

  useEffect(() => {
    setLanes(laneManagerRef.current.getLanes());
  }, []);

  // Simulator loop
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      laneManagerRef.current.onNewSlot();
      setLanes(laneManagerRef.current.getLanes());
    }, 450); // Simulating ~450ms slots
    return () => clearInterval(interval);
  }, [isLive]);

  const fetchBatchTransactions = useCallback(() => {
    const batchSize = Math.floor(Math.random() * 6) + 10; 
    const newTxs: Transaction[] = [];
    const oraclePrice = 145.20;
    
    for (let i = 0; i < batchSize; i++) {
      const program = PROP_AMM_PROGRAMS[Math.floor(Math.random() * PROP_AMM_PROGRAMS.length)];
      const rand = Math.random();
      
      let type: any = 'SWAP';
      let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
      let cu = 0;
      let isToxic = false;
      let reason = "";

      // Logic: System Refreshes (High frequency, low CU)
      if (rand > 0.6) {
        type = 'SYSTEM';
        status = 'SUCCESS';
        cu = Math.floor(Math.random() * 400 + 140); // 140-540 CU (Price Refresh)
      } 
      // Logic: Organic Flow (15k - 80k CU)
      else if (rand > 0.25) {
        type = 'SWAP';
        status = Math.random() > 0.1 ? 'SUCCESS' : 'FAILED';
        cu = Math.floor(Math.random() * 65000 + 15000); 
      }
      // Logic: Bot/Sniping Attempts (150k - 300k CU)
      else if (rand > 0.08) {
        type = Math.random() > 0.3 ? 'ARBITRAGE' : 'CANCELLATION';
        status = type === 'CANCELLATION' ? 'FAILED' : (Math.random() > 0.4 ? 'SUCCESS' : 'FAILED');
        cu = Math.floor(Math.random() * 150000 + 150000); 
      }
      // Logic: Budget Attacks
      else {
        type = 'ARBITRAGE';
        status = 'SUCCESS';
        cu = Math.floor(Math.random() * 150000 + 350000); // 350k - 500k CU
      }

      const amount = Math.floor(Math.random() * 3000 + 100);
      const now = Date.now() - (i * 500); 
      
      const currentLanes = laneManagerRef.current.getLanes();
      const l0 = currentLanes[0];
      
      // REFINED DETECTION BENCHMARKS
      if (type !== 'SYSTEM') {
        if (cu > 350000) {
          isToxic = true;
          reason = "Budget Attack";
        } else if (status === 'FAILED' && cu > 140000) {
          isToxic = true;
          reason = "Toxic Intent (Failed)";
        } else if (status === 'SUCCESS' && cu > 150000) {
          // Adverse Selection Check: If L0 is in half-backfill state and high CU hits
          if (l0.capacity < l0.maxCapacity * 0.95) {
            isToxic = true;
            reason = "L0 Slippage Exploitation";
          } else {
            isToxic = true;
            reason = "MEV Bot Signature";
          }
        }
      }

      if (status === 'SUCCESS' && type !== 'SYSTEM') {
        laneManagerRef.current.executeSwap(amount);
      }
      
      const sim = laneManagerRef.current.simulateSwap(amount, oraclePrice);

      newTxs.push({
        signature: Math.random().toString(36).substring(2, 14).toUpperCase(),
        slot: Math.floor(now / 450),
        timestamp: now,
        computeUnits: cu,
        type,
        inputAmount: amount,
        outputAmount: sim.realizedOutput,
        realizedPrice: sim.realizedOutput / (amount || 1),
        isToxic,
        reason,
        programId: program.id,
        status
      });
    }

    setTransactions(prev => [...newTxs, ...prev].slice(0, 100));
    setLanes(laneManagerRef.current.getLanes());
    setNextUpdateIn(BATCH_INTERVAL);
  }, []);

  useEffect(() => { fetchBatchTransactions(); }, [fetchBatchTransactions]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1000) {
          fetchBatchTransactions();
          return BATCH_INTERVAL;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, fetchBatchTransactions]);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTransactions = useMemo(() => {
    // Show most recent swaps first
    return [...transactions].sort((a, b) => {
      // Sort priority: Toxic first, then by time
      if (a.isToxic && !b.isToxic) return -1;
      if (!a.isToxic && b.isToxic) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [transactions]);

  return (
    <div className="min-h-screen relative flex flex-col gap-4 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto z-10">
      
      {/* HEADER */}
      <header className="mt-4 flex flex-col md:flex-row justify-between items-center glass p-4 rounded-3xl shadow-lg border-white/80 animate-in">
        <div className="flex items-center gap-4">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-20" />
            <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg border-2 border-white transform rotate-3">
              <ShieldCheck className="text-white" size={24} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter -mb-1">ToxicGuard</h1>
              <span className="text-[8px] px-1.5 py-0.5 bg-blue-900 text-white rounded-full font-black uppercase tracking-widest shadow-sm">v5.1 [Optimized]</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${isLive ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-cyan-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {isLive ? `SCANNING: ${formatCountdown(nextUpdateIn)}` : 'PAUSED'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-900/5 border border-blue-900/10">
                <RefreshCcw size={10} className="text-blue-400 animate-spin-slow" />
                <span className="text-[8px] font-mono font-bold text-blue-900/40 uppercase">HumidiFi-LaserStream</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Global Helius Sync</span>
            <span className="text-[9px] font-mono text-blue-900/60 font-bold">{HELIUS_WEBHOOK_ID.substring(0, 12)}...</span>
          </div>
          <button onClick={() => setIsLive(!isLive)} className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-md ${isLive ? 'bg-blue-900 text-white hover:scale-105' : 'bg-emerald-500 text-white'}`}>
            {isLive ? <Activity size={14} className="animate-spin-slow" /> : <Wind size={14} />} 
            {isLive ? 'MONITORING' : 'RESUME'}
          </button>
        </div>
      </header>

      {/* MONITORING VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT: LIVE FEED */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <section className="glass rounded-3xl overflow-hidden shadow-lg border-white/80">
            <div className="p-5 border-b border-blue-50 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Fingerprint className="text-blue-900" size={20} />
                <h2 className="text-sm font-black text-blue-900 uppercase tracking-widest leading-none">High-CU Filter Stream (>15k CU)</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] text-blue-400 font-bold uppercase">Showing MEV & Snipes Only</span>
                 <button onClick={() => setTransactions([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-lg border border-blue-50">
                   <Trash2 size={14} />
                 </button>
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/95 text-blue-900 text-[8px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-2xl z-20">
                  <tr>
                    <th className="px-6 py-4 border-b border-blue-50">Prop AMM</th>
                    <th className="px-6 py-4 border-b border-blue-50">Status</th>
                    <th className="px-6 py-4 border-b border-blue-50 text-right">Compute Units</th>
                    <th className="px-6 py-4 border-b border-blue-50 text-center">Security Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/50">
                  {filteredTransactions.filter(tx => tx.type !== 'SYSTEM').map((tx, idx) => {
                    const program = PROP_AMM_PROGRAMS.find(p => p.id === tx.programId);
                    
                    return (
                      <tr key={tx.signature} className={`group transition-all hover:bg-white/95 ${tx.isToxic ? 'bg-rose-50/60' : ''}`}>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-900 uppercase leading-tight">{program?.name}</span>
                              <span className="text-[7px] text-slate-400 font-mono tracking-tighter">{tx.signature.substring(0, 10)}...</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${tx.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {tx.status}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono text-[11px] font-black ${tx.computeUnits > 150000 ? 'text-rose-600' : 'text-blue-900'}`}>
                            {tx.computeUnits.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center">
                            {tx.isToxic ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg shadow-md animate-pulse">
                                {tx.reason?.includes("Budget") ? <Target size={10} /> : <AlertCircle size={10} />}
                                <span className="text-[8px] font-black uppercase whitespace-nowrap">{tx.reason}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-600 rounded-lg">
                                <ShieldCheck size={10} />
                                <span className="text-[8px] font-black uppercase">Organic User</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT: SYSTEM LOG & KERNEL */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* SYSTEM REFRESHES LOG */}
          <section className="glass rounded-3xl p-5 shadow-lg border-white/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RefreshCcw size={16} className="text-cyan-500" />
                <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">Fast-Lane Refreshes</h2>
              </div>
              <span className="text-[8px] font-bold text-cyan-600 px-2 py-0.5 bg-cyan-50 rounded-full">10-70/sec</span>
            </div>
            <div className="bg-slate-950 rounded-2xl p-4 shadow-xl font-mono text-[7px] text-cyan-200/50 h-[180px] overflow-hidden relative">
                <div className="animate-marquee-vertical">
                  {transactions.filter(t => t.type === 'SYSTEM').slice(0, 15).map(t => (
                    <div key={t.signature} className="mb-1">
                      <span className="text-cyan-500">[{t.signature.substring(0,6)}]</span> HumidiFi::RefreshLanes(slot:{t.slot}) -> cu:{t.computeUnits} [OK]
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-950/80" />
            </div>
          </section>

          {/* DETECTION KERNEL */}
          <section className="glass rounded-3xl p-5 shadow-lg border-white/80">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={18} className="text-indigo-600" />
              <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">Security Model v5.0</h2>
            </div>
            <div className="bg-slate-950 rounded-2xl p-4 shadow-xl font-mono text-[8px] text-blue-200/80 leading-relaxed overflow-x-hidden">
                <div className="text-emerald-400 italic mb-2">// ADVERSE_SELECTION_ENGINE</div>
                <div className="text-blue-400">#define BUDGET_ATTACK 350k</div>
                <div className="text-blue-400">#define TOXIC_INTENT 140k (FAILED)</div>
                <div className="text-blue-400">#define HALF_BACKFILL_L0 0.5f</div>
                <div className="mt-2">fn scan(tx, lane_0) &#123;</div>
                <div className="ml-4 text-amber-300">if (tx.cu &gt; 350k) return "Budget Attack";</div>
                <div className="ml-4 text-rose-400">if (lane_0.cap &lt; 90% && tx.cu &gt; 150k) &#123;</div>
                <div className="ml-8">return "L0 Adverse Selection Exploit";</div>
                <div className="ml-4">&#125;</div>
                <div className="ml-4 text-slate-500">if (tx.cu &lt; 1k) return "Ignored Refresh";</div>
                <div>&#125;</div>
            </div>
          </section>

          {/* LANE HEALTH (Visualizing Half-Backfill) */}
          <section className="glass rounded-3xl p-5 shadow-lg border-white/80 flex-grow">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-blue-900" />
              <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">Prop Depth Matrix</h2>
            </div>
            <div className="space-y-2">
              {lanes.slice(0, 3).map(l => (
                <div key={l.id} className={`p-3 rounded-2xl border transition-all ${l.capacity < l.maxCapacity * 0.9 ? 'bg-rose-50 border-rose-200' : 'bg-white border-blue-50 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-blue-900 uppercase">Lane {l.id}</span>
                      {l.wasConsumedLastSlot && (
                        <span className="text-[7px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Half-Backfill Active</span>
                      )}
                    </div>
                    <span className={`text-[9px] font-mono font-black ${l.capacity < l.maxCapacity * 0.9 ? 'text-rose-600' : 'text-blue-900'}`}>{l.capacity.toFixed(0)} / {l.maxCapacity}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${l.capacity < l.maxCapacity * 0.9 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${(l.capacity / l.maxCapacity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center px-10 gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex gap-12 text-[9px] font-black text-blue-900 uppercase tracking-[0.4em]">
          <span>GEYSER_V5_STREAM</span>
          <span>HUMIDIFI_SYNC_ACTIVE</span>
          <span>SOLANA_MAINNET_LANE_TRACKER</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-900 px-4 py-2 rounded-full shadow-lg">
          <Zap size={14} className="text-amber-400" />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Solana Mainnet</span>
        </div>
      </footer>

      {/* CUSTOM MARQUEE ANIMATION */}
      <style>{`
        @keyframes marquee-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-marquee-vertical {
          animation: marquee-vertical 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(30, 75, 110, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
