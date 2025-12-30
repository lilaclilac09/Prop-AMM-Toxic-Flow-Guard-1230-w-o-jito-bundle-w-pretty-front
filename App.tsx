
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
} from 'lucide-react';
import { LaneManager } from './services/laneState';
import { Transaction, Lane } from './types';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [oraclePrice] = useState(145.20);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState(Date.now());
  const [dataPacketsSent, setDataPacketsSent] = useState(0);

  const laneManagerRef = useRef(new LaneManager());

  useEffect(() => {
    setLanes(laneManagerRef.current.getLanes());
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      laneManagerRef.current.onNewSlot();
      setLanes(laneManagerRef.current.getLanes());
      setDataPacketsSent(prev => prev + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [isLive]);

  const generateRandomTx = useCallback(() => {
    const isBot = Math.random() > 0.75;
    const cu = isBot ? Math.floor(Math.random() * 280000 + 120000) : Math.floor(Math.random() * 60000 + 30000);
    const amount = Math.floor(Math.random() * 1500 + 10);
    const now = Date.now();
    const delta = now - lastProcessedTimestamp;
    
    const currentLanes = laneManagerRef.current.getLanes();
    const lane0Depleted = currentLanes[0].capacity < currentLanes[0].maxCapacity * 0.5;
    const isToxic = cu > 210000 || (delta < 200 && lane0Depleted);
    
    let reason = "";
    if (cu > 210000) reason = "Turbulent CU Load (MEV Calc detected)";
    else if (delta < 200 && lane0Depleted) reason = "L0 Backfill Snipe (Stale quote attack)";

    const sim = laneManagerRef.current.simulateSwap(amount, oraclePrice);
    laneManagerRef.current.executeSwap(amount);

    const newTx: Transaction = {
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
    };

    setTransactions(prev => [newTx, ...prev.slice(0, 50)]);
    setLastProcessedTimestamp(now);
    setLanes(laneManagerRef.current.getLanes());
  }, [lastProcessedTimestamp, oraclePrice]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      if (Math.random() > 0.3) generateRandomTx();
    }, 1200);
    return () => clearInterval(timer);
  }, [isLive, generateRandomTx]);

  return (
    <div className="min-h-screen relative flex flex-col gap-8 pb-16 px-4 md:px-8 max-w-[1500px] mx-auto z-10">
      
      {/* HEADER: ARTISTIC FLOAT */}
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
              <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest">v2.4.Fluid</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-xs font-black text-blue-900/60 tracking-wide uppercase">{isLive ? 'Feed: Live' : 'Feed: Paused'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-6 md:mt-0">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`group relative flex items-center gap-2 px-10 py-4 rounded-full font-black text-sm tracking-[0.1em] transition-all shadow-xl active:scale-95 ${
              isLive ? 'bg-white text-blue-600 border border-blue-100' : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            {isLive ? <><Droplets size={18} /> PAUSE STREAM</> : <><Wind size={18} /> RESUME STREAM</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CENTER COLUMN: ENLARGED LOGS */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="glass rounded-[3rem] overflow-hidden shadow-2xl border-white/80 animate-in">
            <div className="p-10 border-b border-blue-100 bg-white/40 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 flex items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                  <History className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest">Intercept Console</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">Real-time toxic flow surveillance</p>
                </div>
              </div>
              <button 
                onClick={() => setTransactions([])}
                className="p-4 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-2xl border border-blue-50 shadow-sm"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="max-h-[850px] overflow-y-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-white/60 text-blue-900 text-[10px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-xl z-20">
                  <tr>
                    <th className="px-10 py-6 border-b border-blue-50">Transaction Hash</th>
                    <th className="px-10 py-6 border-b border-blue-50">Intent</th>
                    <th className="px-10 py-6 border-b border-blue-50 text-right">Pressure (CU)</th>
                    <th className="px-10 py-6 border-b border-blue-50 text-right">Volume</th>
                    <th className="px-10 py-6 border-b border-blue-50 text-center">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {transactions.map((tx) => (
                    <tr key={tx.signature} className={`group transition-all hover:bg-white/80 ${tx.isToxic ? 'bg-rose-50/60' : ''}`}>
                      <td className="px-10 py-7">
                        <span className="font-mono text-xs text-blue-900 font-bold tracking-tight opacity-70 group-hover:opacity-100">{tx.signature}</span>
                      </td>
                      <td className="px-10 py-7">
                        <span className={`text-[10px] font-black px-2 py-1 rounded border ${tx.type === 'SWAP' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <span className={`font-mono text-xs font-black ${tx.computeUnits > 210000 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {tx.computeUnits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right font-mono text-xs text-blue-900 font-black">
                        {tx.inputAmount.toLocaleString()} SOL
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex justify-center">
                          {tx.isToxic ? (
                            <div className="group relative flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-200 animate-in">
                              <AlertCircle size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">TOXIC_DETECTION</span>
                              {tx.reason && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[8px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {tx.reason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-100">
                              <ShieldCheck size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">VALIDATED</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="p-32 text-center">
                  <Waves className="mx-auto text-blue-200 animate-bounce mb-6 opacity-30" size={64} />
                  <p className="text-blue-900/30 font-black text-sm uppercase tracking-[0.5em]">Establishing Secure Flow</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: ANALYTICS */}
        <div className="lg:col-span-4 flex flex-col gap-8 sticky top-8">
          
          <section className="glass rounded-[3rem] p-8 shadow-2xl border-white/80 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-cyan-100 rounded-2xl text-cyan-600 shadow-inner">
                <Globe size={24} />
              </div>
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest leading-none">Global Stream</h2>
            </div>

            <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 relative overflow-hidden group ${
              isLive ? 'bg-white border-emerald-400/30 shadow-2xl shadow-emerald-50' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Helius Websocket</span>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black ${isLive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                  {isLive ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isLive ? 'bg-emerald-500 text-white rotate-12 scale-110 shadow-lg' : 'bg-slate-300 text-slate-500'}`}>
                  <HardDrive size={28} />
                </div>
                <div>
                  <h4 className="text-base font-black text-blue-900 tracking-tight leading-none mb-1">X-Engine Node</h4>
                  <p className="text-[10px] text-blue-400 font-mono font-bold tracking-widest">LATENCY: 1.2ms</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-white/60 rounded-[2.5rem] border border-white flex gap-5 shadow-sm">
                <Zap className="text-blue-500 shrink-0 mt-1" size={24} />
                <div>
                  <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Security Benchmark</h5>
                  <p className="text-[11px] text-blue-800/60 leading-relaxed font-bold">
                    CU Threshold: <span className="text-rose-500">210,000</span> <br/> 
                    HFT Window: <span className="text-rose-500">200ms</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 p-6 rounded-[2.5rem] border border-blue-50 text-center shadow-sm">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Packets</span>
                <span className="text-2xl font-mono font-black text-blue-900">{dataPacketsSent.toLocaleString()}</span>
              </div>
              <div className="bg-blue-600 p-6 rounded-[2.5rem] text-center shadow-2xl shadow-blue-100">
                <span className="block text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">Safety Index</span>
                <span className="text-2xl font-mono font-black text-white">99.8%</span>
              </div>
            </div>
          </section>

          <section className="glass rounded-[3rem] p-8 shadow-2xl border-white/80 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner">
                <Zap size={24} />
              </div>
              <h2 className="text-xl font-black text-blue-900 uppercase tracking-widest">Logic Explanation</h2>
            </div>

            <div className="bg-blue-900 rounded-[2.5rem] p-8 shadow-inner relative overflow-hidden group">
              <div className="relative z-10 font-mono text-[11px] leading-loose space-y-2">
                <div className="flex gap-4 text-cyan-400">
                  <span className="text-blue-600/60">01</span>
                  <span>if (cu_load > 210k) &#123;</span>
                </div>
                <div className="flex gap-4 text-white ml-8">
                  <span className="text-blue-600/60">02</span>
                  <span>// Benchmark based on manual SetLimit</span>
                </div>
                <div className="flex gap-4 text-rose-300 ml-8">
                  <span className="text-blue-600/60">03</span>
                  <span>FLAG_BOT("TURBULENT_MATH");</span>
                </div>
                <div className="flex gap-4 text-cyan-400">
                  <span className="text-blue-600/60">04</span>
                  <span>&#125;</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 text-xs text-blue-900/70 leading-relaxed font-bold">
              <span className="font-black text-blue-900 block mb-2 underline decoration-blue-300">Why 210k CU?</span>
              Solana's default is 200k. Toxic bots require complex math (e.g. nuking formulas) that exceeds this limit, making manual CU requests a perfect fingerprint for detection.
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM SECTION: LANE VISUALIZER */}
      <section className="glass rounded-[3.5rem] p-10 shadow-2xl border-white/80 mt-8 animate-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 px-4 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 flex items-center justify-center bg-blue-600 rounded-3xl shadow-xl shadow-blue-100">
              <BarChart className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-widest">Lane Fluidity Depth</h2>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.3em] mt-1">Stale quote risk monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-white/60 px-6 py-3 rounded-[2rem] border border-blue-50 shadow-sm">
             <div className="flex items-center gap-2 text-xs font-black text-blue-900/60 uppercase">
               <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-200" /> CALM_STATE
             </div>
             <div className="flex items-center gap-2 text-xs font-black text-blue-900/60 uppercase">
               <div className="w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-200" /> DEPLETION_RISK
             </div>
          </div>
        </div>

        <div className="h-80 w-full px-4">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={lanes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="turbulentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="id" stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `TIER ${v}`} />
              <YAxis hide domain={[0, 1000]} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 15 }}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Bar dataKey="capacity" radius={[15, 15, 15, 15]} barSize={48}>
                {lanes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.capacity < 400 ? 'url(#turbulentGradient)' : 'url(#waveGradient)'} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-6 mt-12 px-4">
          {lanes.map(l => (
            <div key={l.id} className="text-center p-6 bg-white/40 rounded-3xl border border-white hover:border-blue-200 transition-all shadow-sm group">
              <span className="block text-[9px] font-black text-blue-900/30 uppercase mb-2 group-hover:text-blue-500">Tier {l.id}</span>
              <div className={`text-lg font-mono font-black ${l.capacity < 400 ? 'text-rose-600 animate-pulse' : 'text-blue-900'}`}>
                {l.capacity.toFixed(0)}m
              </div>
              <div className="text-[8px] font-black text-slate-400 mt-1">SPREAD: +{l.spreadPpm}P</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 mb-12 flex flex-col md:flex-row justify-between items-center px-12 text-[10px] text-blue-900/40 font-black uppercase tracking-[0.5em]">
        <div className="flex gap-12 mb-6 md:mb-0">
          <a href="#" className="hover:text-blue-600 transition-colors">Ghostlogs_Report</a>
          <a href="#" className="hover:text-blue-600 transition-colors">API_Connectivity</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Audit_Log</a>
        </div>
        <div className="flex items-center gap-4">
          <span>SECURED BY TOXICGUARD PROTOCOL</span>
          <div className="w-2 h-2 bg-blue-200 rounded-full" />
          <span>EST. 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
