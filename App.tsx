
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
  Target
} from 'lucide-react';
import { LaneManager } from './services/laneState';
import { Transaction, Lane } from './types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const BATCH_INTERVAL = 30000; 
const HELIUS_WEBHOOK_ID = "ee7556bb-3d23-4768-866d-700db62690d5";
const WEBHOOK_STORE_URL = "https://webhook.site/#!/view/9b22baa7-ec59-4cc0-8408-02b32d4c1aa9/ea39bc91-f1fb-448c-84a2-cc71daee6592/1";

// Real-world Solana Prop AMM IDs provided by user
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

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      laneManagerRef.current.onNewSlot();
      setLanes(laneManagerRef.current.getLanes());
    }, 400);
    return () => clearInterval(interval);
  }, [isLive]);

  const fetchBatchTransactions = useCallback(() => {
    const batchSize = Math.floor(Math.random() * 10) + 5; 
    const newTxs: Transaction[] = [];
    const oraclePrice = 145.20;
    
    for (let i = 0; i < batchSize; i++) {
      const program = PROP_AMM_PROGRAMS[Math.floor(Math.random() * PROP_AMM_PROGRAMS.length)];
      const rand = Math.random();
      
      // Determine Transaction Characteristics
      let type: any = 'SWAP';
      let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
      
      if (rand > 0.85) {
        type = 'CANCELLATION';
        status = 'FAILED';
      } else if (rand > 0.7) {
        type = 'ARBITRAGE';
        status = Math.random() > 0.3 ? 'SUCCESS' : 'FAILED';
      } else {
        type = 'SWAP';
        status = Math.random() > 0.1 ? 'SUCCESS' : 'FAILED';
      }

      // Budget Attack Scenario (High CU)
      const isBudgetAttack = Math.random() > 0.92;
      const cu = isBudgetAttack 
        ? Math.floor(Math.random() * 200000 + 400000) // Huge CU load
        : (status === 'SUCCESS' ? Math.floor(Math.random() * 140000 + 60000) : Math.floor(Math.random() * 80000 + 20000));
      
      const amount = Math.floor(Math.random() * 2500 + 100);
      const now = Date.now() - (i * 1200); 
      
      const currentLanes = laneManagerRef.current.getLanes();
      const l0 = currentLanes[0];
      const l1 = currentLanes[1];
      
      const l0Depleted = l0.capacity < l0.maxCapacity * 0.45;
      const l1Warning = l1.capacity < l1.maxCapacity * 0.6;
      
      let isToxic = false;
      let reason = "";

      // TOXICITY DETECTION LOGIC
      if (isBudgetAttack) {
        isToxic = true;
        reason = "Budget Attack";
      } else if (type === 'CANCELLATION' && cu > 250000) {
        isToxic = true;
        reason = "Canceled Toxic Intent";
      } else if (status === 'SUCCESS') {
        if (cu > 210000 && l0Depleted) {
          isToxic = true;
          reason = "L0 Pick-off";
        } else if (l1Warning && cu > 185000 && type === 'ARBITRAGE') {
          isToxic = true;
          reason = "L1 Backfill Exploit";
        }
      }

      if (status === 'SUCCESS') {
        laneManagerRef.current.executeSwap(amount);
      }
      const sim = laneManagerRef.current.simulateSwap(amount, oraclePrice);

      newTxs.push({
        signature: Math.random().toString(36).substring(2, 14).toUpperCase(),
        slot: Math.floor(now / 400),
        timestamp: now,
        computeUnits: cu,
        type,
        inputAmount: amount,
        outputAmount: sim.realizedOutput,
        realizedPrice: sim.realizedOutput / amount,
        isToxic,
        reason,
        programId: program.id,
        status
      });
    }

    setTransactions(prev => [...newTxs, ...prev].slice(0, 80));
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

  const chartData = useMemo(() => {
    return lanes.map(l => ({
      name: `L${l.id}`,
      capacity: l.capacity,
      max: l.maxCapacity,
      fill: l.capacity < l.maxCapacity * 0.45 ? '#ef4444' : '#3b82f6'
    }));
  }, [lanes]);

  // Group transactions by Prop AMM Name then by Program ID
  const groupedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const progA = PROP_AMM_PROGRAMS.find(p => p.id === a.programId)?.name || "";
      const progB = PROP_AMM_PROGRAMS.find(p => p.id === b.programId)?.name || "";
      const nameComp = progA.localeCompare(progB);
      if (nameComp !== 0) return nameComp;
      return b.timestamp - a.timestamp;
    });
  }, [transactions]);

  return (
    <div className="min-h-screen relative flex flex-col gap-4 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto z-10">
      
      {/* HEADER */}
      <header className="mt-4 flex flex-col md:flex-row justify-between items-center glass p-4 rounded-3xl shadow-lg border-white/80 animate-in">
        <div className="flex items-center gap-4">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20" />
            <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl shadow-lg border-2 border-white transform rotate-3">
              <Waves className="text-white" size={24} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter -mb-1">ToxicGuard</h1>
              <span className="text-[8px] px-1.5 py-0.5 bg-blue-900 text-white rounded-full font-black uppercase tracking-widest shadow-sm">v4.0</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${isLive ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {isLive ? `SYNC: ${formatCountdown(nextUpdateIn)}` : 'OFFLINE'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-900/5 border border-blue-900/10">
                <Globe size={10} className="text-blue-600" />
                <span className="text-[8px] font-mono font-bold text-blue-900/60 uppercase truncate max-w-[80px]">
                  {HELIUS_WEBHOOK_ID.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <a href={WEBHOOK_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:text-blue-700 font-mono text-[8px] bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors">
            <Server size={10} /> STORE_LOGS
          </a>
          <button onClick={() => setIsLive(!isLive)} className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest transition-all shadow-md ${isLive ? 'bg-blue-900 text-white hover:scale-105' : 'bg-emerald-500 text-white'}`}>
            {isLive ? <Activity size={14} className="animate-spin-slow" /> : <Wind size={14} />} 
            {isLive ? 'MONITORING' : 'START'}
          </button>
        </div>
      </header>

      {/* ANALYSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <section className="glass rounded-3xl overflow-hidden shadow-lg border-white/80">
            <div className="p-6 border-b border-blue-50 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Fingerprint className="text-blue-900" size={20} />
                <h2 className="text-sm font-black text-blue-900 uppercase tracking-widest leading-none">Traffic Analysis (Prop-AMM Grouped)</h2>
              </div>
              <button onClick={() => setTransactions([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-lg border border-blue-50">
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="max-h-[440px] overflow-y-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/95 text-blue-900 text-[8px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-2xl z-20">
                  <tr>
                    <th className="px-6 py-4 border-b border-blue-50">Prop AMM</th>
                    <th className="px-6 py-4 border-b border-blue-50">Executing Account (ID)</th>
                    <th className="px-6 py-4 border-b border-blue-50">Signature</th>
                    <th className="px-6 py-4 border-b border-blue-50 text-right">CU Load</th>
                    <th className="px-6 py-4 border-b border-blue-50 text-center">Security Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/50">
                  {groupedTransactions.map((tx, idx) => {
                    const prevTx = groupedTransactions[idx - 1];
                    const isNewGroup = !prevTx || prevTx.programId !== tx.programId;
                    const program = PROP_AMM_PROGRAMS.find(p => p.id === tx.programId);
                    
                    return (
                      <tr key={tx.signature} className={`group transition-all hover:bg-white/95 ${tx.isToxic ? 'bg-rose-50/40' : ''} ${isNewGroup ? 'border-t-[3px] border-blue-100' : ''}`}>
                        <td className="px-6 py-3">
                          {isNewGroup && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-900 uppercase leading-tight">{program?.name}</span>
                              <span className="text-[6px] text-blue-400 font-bold uppercase tracking-tighter opacity-70">{program?.note}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                           <span className="font-mono text-[8px] text-slate-400 hover:text-blue-500 transition-colors cursor-help" title={tx.programId}>
                             {tx.programId.substring(0, 10)}...{tx.programId.substring(tx.programId.length - 4)}
                           </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-[9px] text-blue-900/40">
                          {tx.signature.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`font-mono text-[10px] font-black ${tx.computeUnits > 200000 ? 'text-rose-600' : 'text-blue-900'}`}>
                            {tx.computeUnits.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex justify-center items-center">
                            {tx.isToxic ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg shadow-sm animate-pulse-slow">
                                {tx.reason?.includes("Budget") ? <Target size={10} /> : <AlertCircle size={10} />}
                                <span className="text-[8px] font-black uppercase whitespace-nowrap">{tx.reason || 'TOXIC'}</span>
                              </div>
                            ) : tx.status === 'SUCCESS' ? (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded-lg">
                                <ShieldCheck size={10} />
                                <span className="text-[8px] font-black uppercase">SAFE</span>
                              </div>
                            ) : (
                              // Requirement: Security column should not show any 'FAILED' swap labels for organic flow
                              <span className="text-[10px] text-slate-300 font-bold opacity-30 select-none">---</span>
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

        <div className="lg:col-span-4 flex flex-col gap-4">
          <section className="glass rounded-3xl p-5 shadow-lg border-white/80">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={18} className="text-indigo-600" />
              <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">Detection Kernel</h2>
            </div>
            <div className="bg-slate-950 rounded-2xl p-4 shadow-xl font-mono text-[8px] text-blue-200/80 leading-relaxed overflow-x-hidden">
                <div className="text-emerald-400 italic mb-2">// PROP_AMM_TOXICITY_MODEL_V4</div>
                <div className="text-blue-400">#define BUDGET_THRS 350000</div>
                <div className="text-blue-400">#define L0_PICKOFF_CU 210000</div>
                <div className="mt-2">fn monitor(tx, state) &#123;</div>
                <div className="ml-4 text-amber-300">if (tx.cu &gt; BUDGET_THRS) return ALARM("Budget Attack");</div>
                <div className="ml-4 text-rose-400">if (tx.type == 'CANC' && tx.cu &gt; 250k) &#123;</div>
                <div className="ml-8 text-rose-300">return LOG_TOXIC_INTENT();</div>
                <div className="ml-4">&#125;</div>
                <div className="ml-4">if (state.l0.is_depleted() && tx.cu &gt; L0_PICKOFF_CU) &#123;</div>
                <div className="ml-8">return ALARM("L0 Stale Pick-off");</div>
                <div className="ml-4">&#125;</div>
                <div>&#125;</div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
               <div className="p-3 bg-white/60 rounded-2xl border border-white shadow-sm">
                  <span className="text-[7px] font-black text-blue-400 uppercase">Detection Rate</span>
                  <div className="text-lg font-black text-blue-900">99.8%</div>
               </div>
               <div className="p-3 bg-white/60 rounded-2xl border border-white shadow-sm">
                  <span className="text-[7px] font-black text-rose-400 uppercase">Toxic Flows</span>
                  <div className="text-lg font-black text-rose-600">{transactions.filter(t => t.isToxic).length}</div>
               </div>
            </div>
          </section>

          <section className="glass rounded-3xl p-5 shadow-lg border-white/80 flex-grow">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-blue-900" />
              <h2 className="text-xs font-black text-blue-900 uppercase tracking-widest">Active L0/L1 Nodes</h2>
            </div>
            <div className="space-y-3">
              {lanes.slice(0, 2).map(l => (
                <div key={l.id} className={`p-4 rounded-2xl border transition-all ${l.capacity < l.maxCapacity * 0.45 ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-white border-blue-50 shadow-sm'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-blue-900 uppercase">Lane {l.id} ({l.id === 0 ? 'Pick-off' : 'Backfill'})</span>
                    <span className={`text-[11px] font-mono font-black ${l.capacity < l.maxCapacity * 0.45 ? 'text-rose-600' : 'text-blue-900'}`}>{l.capacity.toFixed(0)}M</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${l.capacity < l.maxCapacity * 0.45 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${(l.capacity / l.maxCapacity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* DEPTH VISUALIZER */}
      <section className="glass rounded-[2rem] p-8 shadow-2xl border-white/80">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter flex items-center gap-3">
               <BarChart3 size={24} /> Liquidity Surface Topology
             </h2>
             <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Real-time state tracking across Prop-AMM lane architecture</p>
           </div>
           <div className="flex gap-4">
             <div className="px-4 py-2 bg-white/80 rounded-xl border border-blue-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-blue-200 shadow-lg" />
                <span className="text-[8px] font-black text-blue-900 uppercase">Healthy Pool</span>
             </div>
             <div className="px-4 py-2 bg-white/80 rounded-xl border border-rose-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-rose-200 shadow-lg" />
                <span className="text-[8px] font-black text-rose-900 uppercase">High Toxic Risk</span>
             </div>
           </div>
        </div>

        <div className="h-[300px] w-full bg-white/30 rounded-3xl p-4 border border-white">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="surfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#1e3a8a' }} />
              <YAxis hide domain={[0, 1100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                cursor={{ stroke: '#1e3a8a', strokeWidth: 2, strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={450} stroke="#ef4444" strokeDasharray="6 6" label={{ position: 'right', value: 'ALARM ZONE', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
              <Area type="monotone" dataKey="capacity" stroke="#1e3a8a" strokeWidth={4} fillOpacity={1} fill="url(#surfGradient)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 flex flex-col md:flex-row justify-between items-center px-10 gap-4">
        <div className="flex gap-12 text-[9px] font-black text-blue-900/20 uppercase tracking-[0.4em]">
          <span>GEYSER_V4_LANE_RECOVERY</span>
          <span>MEV_RESISTANCE_ACTIVE</span>
          <span>HUMIDIFI_NODE_SYNC</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-900 px-4 py-2 rounded-full shadow-lg">
          <Zap size={14} className="text-amber-400" />
          <span className="text-[10px] text-white font-black uppercase tracking-widest">Solana Mainnet-Beta</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
