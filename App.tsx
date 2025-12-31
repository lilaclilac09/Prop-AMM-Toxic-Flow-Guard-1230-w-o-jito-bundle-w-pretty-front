
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Waves, 
  ShieldCheck, 
  Wind, 
  Droplets, 
  Zap, 
  Trash2, 
  AlertCircle,
  BarChart,
  History,
  HardDrive,
  Globe,
  Clock,
  Layers,
  Activity,
  Cpu,
  Fingerprint,
  ArrowDownCircle
} from 'lucide-react';
import { LaneManager } from './services/laneState';
import { Transaction, Lane } from './types';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BATCH_INTERVAL = 120000; // 2 minutes in ms

const App: React.FC = () => {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [oraclePrice] = useState(145.20);
  const [nextUpdateIn, setNextUpdateIn] = useState(BATCH_INTERVAL);

  const laneManagerRef = useRef(new LaneManager());

  // Initialize lanes
  useEffect(() => {
    setLanes(laneManagerRef.current.getLanes());
  }, []);

  // Internal state still simulates Solana time (400ms per slot)
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      laneManagerRef.current.onNewSlot();
      setLanes(laneManagerRef.current.getLanes());
    }, 400);
    return () => clearInterval(interval);
  }, [isLive]);

  // Batch Data Generation (Polling logic)
  const fetchBatchTransactions = useCallback(() => {
    const batchSize = Math.floor(Math.random() * 8) + 6; 
    const newTxs: Transaction[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const isBot = Math.random() > 0.7;
      const cu = isBot ? Math.floor(Math.random() * 300000 + 150000) : Math.floor(Math.random() * 60000 + 30000);
      const amount = Math.floor(Math.random() * 1800 + 50);
      const now = Date.now() - (i * 2000); 
      
      const currentLanes = laneManagerRef.current.getLanes();
      const l0 = currentLanes[0];
      const l1 = currentLanes[1];
      
      const l0Depleted = l0.capacity < l0.maxCapacity * 0.45;
      const l1Warning = l1.capacity < l1.maxCapacity * 0.6;
      
      // Advanced Toxic Flow Detection
      const isToxic = (cu > 220000 && l0Depleted) || (l1Warning && isBot && cu > 190000);
      
      let reason = "";
      if (cu > 220000 && l0Depleted) reason = "L0 Stale Pick-off (HFT Cluster)";
      else if (isToxic) reason = "L1 Half-Backfill Frontrun Signal";

      const sim = laneManagerRef.current.simulateSwap(amount, oraclePrice);
      laneManagerRef.current.executeSwap(amount);

      newTxs.push({
        signature: Math.random().toString(36).substring(2, 14).toUpperCase(),
        slot: Math.floor(now / 400),
        timestamp: now,
        computeUnits: cu,
        type: isBot ? 'ARBITRAGE' : 'SWAP',
        inputAmount: amount,
        outputAmount: sim.realizedOutput,
        realizedPrice: sim.realizedOutput / amount,
        isToxic,
        reason
      });
    }

    setTransactions(prev => [...newTxs, ...prev].slice(0, 100));
    setLanes(laneManagerRef.current.getLanes());
    setNextUpdateIn(BATCH_INTERVAL);
  }, [oraclePrice]);

  useEffect(() => {
    fetchBatchTransactions();
  }, []);

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

  return (
    <div className="min-h-screen relative flex flex-col gap-10 pb-20 px-4 md:px-12 max-w-[1600px] mx-auto z-10">
      
      {/* 1. HEADER */}
      <header className="mt-10 flex flex-col md:flex-row justify-between items-center glass p-8 rounded-[3rem] shadow-2xl border-white/80 animate-in">
        <div className="flex items-center gap-8">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-30" />
            <div className="relative w-20 h-20 flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-400 rounded-3xl shadow-2xl border-2 border-white transform rotate-3">
              <Waves className="text-white" size={40} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black text-blue-900 tracking-tighter font-art -mb-2">ToxicGuard</h1>
              <span className="text-[11px] px-3 py-1 bg-blue-900 text-white rounded-full font-black uppercase tracking-widest shadow-lg">v3.0.Core</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isLive ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isLive ? `GEYSER BATCH: ${formatCountdown(nextUpdateIn)}` : 'POLLING PAUSED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-8 md:mt-0">
          <button onClick={fetchBatchTransactions} className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] tracking-widest bg-white text-blue-900 border border-blue-100 hover:bg-blue-50 transition-all shadow-sm">
            <Clock size={16} /> SYNC GEYSER
          </button>
          <button onClick={() => setIsLive(!isLive)} className={`group flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-sm tracking-[0.15em] transition-all shadow-2xl ${isLive ? 'bg-blue-900 text-white hover:scale-105' : 'bg-emerald-500 text-white'}`}>
            {isLive ? <><Activity size={20} className="animate-spin-slow" /> MONITORING</> : <><Wind size={20} /> START TRACKING</>}
          </button>
        </div>
      </header>

      {/* 2. INTERCEPT CONSOLE & LOGIC STACK (NOW SECOND) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LOGS PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <section className="glass rounded-[3.5rem] overflow-hidden shadow-2xl border-white/80 animate-in">
            <div className="p-10 border-b border-blue-100 bg-white/50 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-900 rounded-3xl shadow-xl">
                  <Fingerprint className="text-white" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-blue-900 uppercase tracking-widest leading-none">Intercept Archive</h2>
                  <p className="text-[11px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-1.5 italic">Solana Mainnet-Beta | Geyser Batch Stream</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setTransactions([])} className="p-4 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-2xl border border-blue-50 shadow-sm">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="max-h-[650px] overflow-y-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/80 text-blue-900 text-[11px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-2xl z-20">
                  <tr>
                    <th className="px-12 py-8 border-b border-blue-50">Transaction Signature</th>
                    <th className="px-12 py-8 border-b border-blue-50 text-center">Type</th>
                    <th className="px-12 py-8 border-b border-blue-50 text-right">CU Load</th>
                    <th className="px-12 py-8 border-b border-blue-50 text-center">Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {transactions.map((tx) => (
                    <tr key={tx.signature} className={`group transition-all hover:bg-white/90 ${tx.isToxic ? 'bg-rose-50/70' : ''}`}>
                      <td className="px-12 py-8 font-mono text-[12px] text-blue-900 font-bold opacity-60 group-hover:opacity-100">
                        {tx.signature}
                      </td>
                      <td className="px-12 py-8 text-center">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 ${tx.type === 'SWAP' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-12 py-8 text-right">
                        <span className={`font-mono text-sm font-black ${tx.computeUnits > 200000 ? 'text-rose-600' : 'text-blue-900'}`}>
                          {tx.computeUnits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-12 py-8">
                        <div className="flex justify-center">
                          {tx.isToxic ? (
                            <div className="group relative flex items-center gap-3 px-6 py-2.5 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-200">
                              <AlertCircle size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">TOXIC</span>
                              {tx.reason && <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-[9px] rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 z-50">{tx.reason}</div>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-500 text-white rounded-2xl">
                              <ShieldCheck size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">ORGANIC</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ANALYTICS & DEEP LOGIC */}
        <div className="lg:col-span-4 flex flex-col gap-10 sticky top-10">
          <section className="glass rounded-[3.5rem] p-10 shadow-2xl border-white/80 flex flex-col gap-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 flex items-center justify-center bg-indigo-100 rounded-3xl text-indigo-600">
                <Cpu size={30} />
              </div>
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-widest">Logic Stack</h2>
            </div>
            
            <div className="bg-slate-950 rounded-[2.5rem] p-10 shadow-3xl border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 font-mono text-[10px] leading-relaxed space-y-2 text-blue-200/80">
                <div className="text-emerald-400 italic font-black text-xs mb-4">// ADVANCED MEV HEURISTICS V3.0</div>
                <div className="flex gap-3"><span className="text-slate-600">01</span><span>fn analyze_toxic(tx) &#123;</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">02</span><span className="text-blue-400">let is_success = tx.status == "SUCCESS";</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">03</span><span className="text-amber-300">if (!is_success) return;</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">04</span><span className="text-rose-400">if (tx.cu &gt; 220k && lanes[0].depleted) &#123;</span></div>
                <div className="flex gap-3 ml-12"><span className="text-slate-600">05</span><span className="bg-rose-900 px-2 py-0.5 rounded text-white font-black">FLAG_TOXIC_STALE();</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">06</span><span>&#125;</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">07</span><span className="text-cyan-300">let is_backfill = lanes[1].depth &lt; 50%;</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">08</span><span className="text-rose-400">if (is_backfill && tx.is_bot) &#123;</span></div>
                <div className="flex gap-3 ml-12"><span className="text-slate-600">09</span><span className="font-black text-rose-300">FLAG_BACKFILL_ABUSE();</span></div>
                <div className="flex gap-3 ml-6"><span className="text-slate-600">10</span><span>&#125;</span></div>
                <div className="flex gap-3"><span className="text-slate-600">11</span><span>&#125;</span></div>
              </div>
            </div>
            <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
               <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-2">System Heuristic</h5>
               <p className="text-[12px] text-blue-800/70 leading-relaxed font-bold italic">
                 "Monitor toxic flow, not failed or competitive flow."
               </p>
            </div>
          </section>
        </div>
      </div>

      {/* 3. CRITICAL LANE DEPTH (NOW THIRD) */}
      <section className="glass rounded-[4rem] p-12 shadow-2xl border-white/80 animate-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 px-6 gap-8">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 flex items-center justify-center bg-blue-900 rounded-[2rem] shadow-2xl">
              <Layers className="text-white" size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-blue-900 uppercase tracking-widest underline decoration-blue-400 decoration-8 underline-offset-12">Lane Monitor</h2>
              <p className="text-sm text-blue-400 font-bold uppercase tracking-[0.4em] mt-3 italic">Critical Visibility: Lanes 0, 1, and 2</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="bg-white/60 px-8 py-4 rounded-3xl border border-blue-100 shadow-sm flex flex-col">
               <span className="text-[10px] font-black text-slate-400 uppercase">ORACLE PRICE</span>
               <span className="text-2xl font-mono font-black text-blue-900">${oraclePrice}</span>
             </div>
             <div className={`px-8 py-4 rounded-3xl border shadow-sm flex flex-col justify-center ${lanes[0]?.capacity < 400 ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : 'bg-emerald-500 border-emerald-400 text-white'}`}>
               <span className="text-[10px] font-black opacity-80 uppercase">L0 STATUS</span>
               <span className="text-lg font-black uppercase tracking-widest">{lanes[0]?.capacity < 400 ? 'EXHAUSTED' : 'HEALTHY'}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Detailed Cards for L0, L1, L2 */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-6">
             {lanes.slice(0, 3).map(l => (
               <div key={l.id} className={`group relative p-10 rounded-[3.5rem] border-2 transition-all duration-700 overflow-hidden ${l.capacity < l.maxCapacity * 0.5 ? 'bg-rose-50 border-rose-300 shadow-rose-50' : 'bg-white border-blue-100 hover:border-blue-400 shadow-xl'}`}>
                  <Activity className={`absolute -right-6 -bottom-6 opacity-5 transition-transform group-hover:scale-125 ${l.capacity < l.maxCapacity * 0.5 ? 'text-rose-600' : 'text-blue-900'}`} size={160} />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-xl text-white ${l.capacity < l.maxCapacity * 0.5 ? 'bg-rose-600' : 'bg-blue-900'}`}>L{l.id}</div>
                      <h4 className="text-2xl font-black text-blue-900">{l.id === 0 ? 'Pick-off Lane' : l.id === 1 ? 'Backfill Lane' : 'Overflow Lane'}</h4>
                    </div>
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <div className={`text-6xl font-mono font-black tracking-tighter ${l.capacity < l.maxCapacity * 0.5 ? 'text-rose-600' : 'text-blue-900'}`}>{l.capacity.toFixed(0)}m</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-blue-900/40">+{l.spreadPpm} PPM</div>
                    </div>
                  </div>
                  <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-1000 ease-out ${l.capacity < l.maxCapacity * 0.5 ? 'bg-rose-600' : 'bg-gradient-to-r from-blue-700 to-blue-400'}`} style={{ width: `${(l.capacity / l.maxCapacity) * 100}%` }} />
                  </div>
               </div>
             ))}
          </div>

          {/* Visualization Section */}
          <div className="lg:col-span-7 bg-white/60 rounded-[4rem] p-12 border border-white shadow-2xl flex flex-col min-h-[500px]">
            <div className="mb-12">
              <span className="text-[11px] font-black text-blue-900/30 uppercase tracking-[0.4em] block mb-2">Depth Topology Analysis</span>
              <h3 className="text-xl font-black text-blue-900 uppercase tracking-widest">Triple-Lane Fluidity Map</h3>
            </div>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={lanes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primeLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e3a8a" stopOpacity={1}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="toxicLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#991b1b" stopOpacity={1}/><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="deepLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.6}/><stop offset="100%" stopColor="#f8fafc" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="id" stroke="#94a3b8" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} tickFormatter={(v) => v <= 2 ? `*L${v}*` : `L${v}`} />
                  <YAxis hide domain={[0, 1000]} />
                  <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 12 }} contentStyle={{ borderRadius: '24px', border: 'none', fontWeight: 'bold' }} />
                  <Bar dataKey="capacity" radius={[16, 16, 16, 16]} barSize={50}>
                    {lanes.map((entry, index) => {
                      let fill = "url(#deepLane)";
                      if (index <= 2) {
                        fill = entry.capacity < entry.maxCapacity * 0.45 ? "url(#toxicLane)" : "url(#primeLane)";
                      }
                      return <Cell key={`cell-${index}`} fill={fill} stroke={index <= 2 ? (entry.capacity < 400 ? '#ef4444' : '#1e3a8a') : 'transparent'} strokeWidth={index <= 2 ? 3 : 0} />;
                    })}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Compressed Secondary Info */}
        <div className="mt-16 pt-10 border-t-2 border-dashed border-blue-50 flex flex-wrap justify-between items-center px-10">
            <div className="flex items-center gap-6">
              <span className="text-[11px] font-black text-blue-900/40 uppercase tracking-[0.4em]">Secondary Depth (L3-L9):</span>
              <div className="flex gap-4">
                {lanes.slice(3).map(l => (
                  <div key={l.id} className="text-[11px] font-mono font-black text-blue-900/20 px-3 py-1 bg-white rounded-lg border border-blue-50">L{l.id}:{l.capacity.toFixed(0)}m</div>
                ))}
              </div>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 mb-16 flex flex-col md:flex-row justify-between items-center px-16 text-[11px] text-blue-900/40 font-black uppercase tracking-[0.6em]">
        <div className="flex gap-16">
          <span>Triple_Lane_Security_Active</span>
          <span>Ghostlogs_Audit_System</span>
        </div>
        <div className="opacity-50">SOLANA_MAINNET_GEYSER_CLUSTER_SECURED</div>
      </footer>
    </div>
  );
};

export default App;
