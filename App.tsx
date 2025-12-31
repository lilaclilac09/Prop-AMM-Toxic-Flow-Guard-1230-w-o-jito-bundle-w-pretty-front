
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
  Activity
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
  const [dataPacketsSent, setDataPacketsSent] = useState(0);

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
    const batchSize = Math.floor(Math.random() * 8) + 5; 
    const newTxs: Transaction[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const isBot = Math.random() > 0.75;
      const cu = isBot ? Math.floor(Math.random() * 280000 + 120000) : Math.floor(Math.random() * 60000 + 30000);
      const amount = Math.floor(Math.random() * 1500 + 10);
      const now = Date.now() - (i * 2000); 
      
      const currentLanes = laneManagerRef.current.getLanes();
      const lane0Depleted = currentLanes[0].capacity < currentLanes[0].maxCapacity * 0.4;
      const lane1Depleted = currentLanes[1].capacity < currentLanes[1].maxCapacity * 0.5;
      
      // Toxic flow logic: High CU + attacking depleted critical lanes
      const isToxic = (cu > 210000 && lane0Depleted) || (lane1Depleted && isBot && cu > 180000);
      
      let reason = "";
      if (cu > 210000 && lane0Depleted) reason = "L0 Stale Quote Bundle Snipe";
      else if (isToxic) reason = "L1/L2 Backfill Pressure Arbitrage";

      const sim = laneManagerRef.current.simulateSwap(amount, oraclePrice);
      laneManagerRef.current.executeSwap(amount);

      newTxs.push({
        signature: Math.random().toString(36).substring(2, 12).toUpperCase(),
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
    setDataPacketsSent(prev => prev + 1);
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
    <div className="min-h-screen relative flex flex-col gap-8 pb-16 px-4 md:px-8 max-w-[1500px] mx-auto z-10">
      
      {/* HEADER */}
      <header className="mt-8 flex flex-col md:flex-row justify-between items-center glass p-6 rounded-[2.5rem] shadow-2xl border-white/80 animate-in">
        <div className="flex items-center gap-6">
          <div className="relative animate-float">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20" />
            <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-tr from-blue-500 to-cyan-300 rounded-full shadow-lg border-2 border-white">
              <Waves className="text-white" size={32} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-blue-900 tracking-tight font-art -mb-1">ToxicGuard</h1>
              <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest">v2.9.TripleLane</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-black text-blue-900/60 tracking-wide uppercase">
                  {isLive ? `Batch Update: ${formatCountdown(nextUpdateIn)}` : 'Updates Paused'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-6 md:mt-0">
          <button onClick={fetchBatchTransactions} className="flex items-center gap-2 px-6 py-4 rounded-full font-black text-xs tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all">
            <Clock size={16} /> RE-FETCH GEYSER
          </button>
          <button onClick={() => setIsLive(!isLive)} className={`group flex items-center gap-2 px-10 py-4 rounded-full font-black text-sm tracking-[0.1em] transition-all shadow-xl ${isLive ? 'bg-white text-blue-600 border border-blue-100' : 'bg-blue-600 text-white shadow-blue-200'}`}>
            {isLive ? <><Droplets size={18} /> STOP AUTO</> : <><Wind size={18} /> START AUTO</>}
          </button>
        </div>
      </header>

      {/* 2nd POSITION: CRITICAL LANE MONITOR (FOCUS L0, L1, L2) */}
      <section className="glass rounded-[3.5rem] p-10 shadow-2xl border-white/80 animate-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 px-4 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 flex items-center justify-center bg-blue-600 rounded-3xl shadow-xl shadow-blue-100">
              <Layers className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-widest underline decoration-blue-300 decoration-4 underline-offset-8">Critical Lane Depth</h2>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Real-time state for Lane 0 (Primary), Lane 1 (Backfill), Lane 2 (Overflow)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase">System Status</span>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-black text-emerald-600 uppercase">Geyser Connected</span>
               </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Detailed Dashboard Cards for L0, L1, L2 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             {lanes.slice(0, 3).map(l => (
               <div key={l.id} className={`group relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${l.capacity < 400 ? 'bg-rose-50 border-rose-300 shadow-rose-100' : 'bg-white border-blue-50 hover:border-blue-200 shadow-sm'}`}>
                  {/* Background Icon Watermark */}
                  <Activity className={`absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 ${l.capacity < 400 ? 'text-rose-600' : 'text-blue-600'}`} size={120} />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${l.capacity < 400 ? 'text-rose-400' : 'text-blue-400'}`}>Monitoring Node</span>
                      <h4 className="text-2xl font-black text-blue-900">LANE {l.id}</h4>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-[9px] font-black ${l.capacity < 400 ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {l.capacity < 400 ? 'HIGH RISK' : 'HEALTHY'}
                    </div>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <div className={`text-4xl font-mono font-black ${l.capacity < 400 ? 'text-rose-600' : 'text-blue-900'}`}>{l.capacity.toFixed(0)}m</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Available Liquidity</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-blue-900/60">+{l.spreadPpm} PPM</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase">Fixed Spread</div>
                    </div>
                  </div>

                  {/* Tiny Health Bar */}
                  <div className="mt-6 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${l.capacity < 400 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                      style={{ width: `${(l.capacity / l.maxCapacity) * 100}%` }} 
                    />
                  </div>
               </div>
             ))}
          </div>

          {/* Visualization Section */}
          <div className="lg:col-span-8 bg-white/40 rounded-[3rem] p-8 border border-white relative">
            <div className="absolute top-8 left-8 z-10">
              <span className="text-[10px] font-black text-blue-900/30 uppercase tracking-widest block mb-1">Depth Gradient Analysis</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full" /><span className="text-[9px] font-black text-blue-900/60 uppercase">Critical Flow</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-full" /><span className="text-[9px] font-black text-blue-900/60 uppercase">Secondary Deep Depth</span></div>
              </div>
            </div>

            <div className="h-full w-full pt-16">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={lanes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="criticalLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e40af" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="warningLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#be123c" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="quietLane" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#f1f5f9" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="id" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight="black" 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => v <= 2 ? `L${v}!!` : `L${v}`} 
                  />
                  <YAxis hide domain={[0, 1000]} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '24px', border: 'none', fontWeight: 'bold' }} />
                  <Bar dataKey="capacity" radius={[12, 12, 12, 12]} barSize={45}>
                    {lanes.map((entry, index) => {
                      let fill = "url(#quietLane)";
                      if (index <= 2) {
                        fill = entry.capacity < 400 ? "url(#warningLane)" : "url(#criticalLane)";
                      }
                      return <Cell key={`cell-${index}`} fill={fill} stroke={index <= 2 ? (entry.capacity < 400 ? '#e11d48' : '#1e3a8a') : 'transparent'} strokeWidth={index <= 2 ? 3 : 0} />;
                    })}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Compressed Secondary Info */}
        <div className="mt-12 flex items-center justify-center gap-8 py-6 bg-slate-50/50 rounded-3xl border border-white border-dashed">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secondary Lanes (L3-L9) Aggregate:</span>
            <div className="flex gap-4">
              {lanes.slice(3).map(l => (
                <div key={l.id} className="text-[10px] font-mono font-bold text-blue-900/40">L{l.id}:{l.capacity.toFixed(0)}m</div>
              ))}
            </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LOGS PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="glass rounded-[3rem] overflow-hidden shadow-2xl border-white/80 animate-in">
            <div className="p-10 border-b border-blue-100 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                  <History className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest">Intercept Console</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Polled Solana Transaction Archive</p>
                </div>
              </div>
              <button onClick={() => setTransactions([])} className="p-4 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-2xl border border-blue-50">
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/60 text-blue-900 text-[10px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-xl z-20">
                  <tr>
                    <th className="px-10 py-6 border-b border-blue-50">Signature</th>
                    <th className="px-10 py-6 border-b border-blue-50">Type</th>
                    <th className="px-10 py-6 border-b border-blue-50 text-right">CU Load</th>
                    <th className="px-10 py-6 border-b border-blue-50 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {transactions.map((tx) => (
                    <tr key={tx.signature} className={`group transition-all hover:bg-white/80 ${tx.isToxic ? 'bg-rose-50/60' : ''}`}>
                      <td className="px-10 py-7 font-mono text-[11px] text-blue-900 font-bold opacity-60 group-hover:opacity-100">
                        {tx.signature}
                      </td>
                      <td className="px-10 py-7">
                        <span className={`text-[9px] font-black px-2 py-1 rounded border ${tx.type === 'SWAP' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <span className={`font-mono text-[11px] font-black ${tx.computeUnits > 200000 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {tx.computeUnits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex justify-center">
                          {tx.isToxic ? (
                            <div className="group relative flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-200 animate-in">
                              <AlertCircle size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">TOXIC</span>
                              {tx.reason && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[8px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">{tx.reason}</div>}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-100">
                              <ShieldCheck size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">SUCCESS SWAP</span>
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

        {/* ANALYTICS PANEL */}
        <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
          <section className="glass rounded-[3rem] p-8 shadow-2xl border-white/80 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-2xl text-blue-600">
                <Globe size={24} />
              </div>
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest leading-none">Polling Nodes</h2>
            </div>
            <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 group ${isLive ? 'bg-white border-amber-400/30' : 'bg-slate-100 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node_Sync_L0</span>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black ${isLive ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'}`}>{isLive ? 'ACTIVE' : 'IDLE'}</span>
              </div>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 flex items-center justify-center rounded-full ${isLive ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-300'}`}>
                  <HardDrive size={28} />
                </div>
                <div>
                  <h4 className="text-base font-black text-blue-900 tracking-tight leading-none mb-1">Lane Tracker v2</h4>
                  <p className="text-[10px] text-blue-400 font-mono font-bold tracking-widest italic">LAG: Polled @ 120s</p>
                </div>
              </div>
            </div>
          </section>

          {/* PROFOUND LOGIC STACK */}
          <section className="glass rounded-[3rem] p-8 shadow-2xl border-white/80 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-2xl text-indigo-600">
                <Zap size={24} />
              </div>
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest">Logic Stack</h2>
            </div>
            <div className="bg-blue-900 rounded-[2.5rem] p-8 shadow-inner overflow-hidden">
              <div className="font-mono text-[9px] leading-relaxed space-y-1.5 overflow-x-auto text-blue-100/90">
                <div className="text-cyan-400 italic font-black">// Prop AMM Multi-Lane Guard v2.9</div>
                <div className="flex gap-2"><span className="text-blue-600/50">01</span><span>fn analyze_toxic_flow(tx, lanes) &#123;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">02</span><span className="text-emerald-400">if tx.status != SUCCESS return;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">03</span><span className="text-amber-300">let is_bundle = tx.cu &gt; 210000;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">04</span><span>let l0_thin = lanes[0].depth &lt; 400;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">05</span><span>let l1_thin = lanes[1].depth &lt; 500;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">06</span><span>let l2_thin = lanes[2].depth &lt; 600;</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">07</span><span className="text-rose-400">if (is_bundle && l0_thin) &#123;</span></div>
                <div className="flex gap-2 ml-8"><span className="text-blue-600/50">08</span><span className="font-black underline">FLAG("L0_SNIPE");</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">09</span><span className="text-rose-400">&#125; else if (tx.is_bot && l1_thin) &#123;</span></div>
                <div className="flex gap-2 ml-8"><span className="text-blue-600/50">10</span><span className="font-black">FLAG("L1_BACKFILL_ABUSE");</span></div>
                <div className="flex gap-2 ml-4"><span className="text-blue-600/50">11</span><span>&#125;</span></div>
                <div className="flex gap-2"><span className="text-blue-600/50">12</span><span>&#125;</span></div>
              </div>
            </div>
            <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 text-[11px] text-blue-900/70 leading-relaxed font-bold">
              <span className="font-black text-blue-900 block mb-2 underline decoration-blue-300">Triple-Lane Heuristic Engine</span>
              Cross-referencing <code className="text-rose-600">CU_Load</code> with the depletion states of <code className="text-blue-600">Lane 0 (Pick-off)</code>, <code className="text-blue-600">Lane 1 (Backfill)</code>, and <code className="text-blue-600">Lane 2 (Slippage Overflow)</code> to identify sophisticated arbitrage bundles.
            </div>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 mb-12 flex flex-col md:flex-row justify-between items-center px-12 text-[10px] text-blue-900/40 font-black uppercase tracking-[0.5em]">
        <div className="flex gap-12">
          <span>Priority_Lane_Monitor_Active</span>
          <span>Solana_Geyser_Poller</span>
        </div>
        <span>TOXICGUARD V2.9_TRIPLE_LANE_LOGIC</span>
      </footer>
    </div>
  );
};

export default App;
