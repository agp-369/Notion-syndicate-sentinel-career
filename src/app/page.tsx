"use client";

import { useState, useEffect, Suspense } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal, Activity, CheckCircle2, Command, Users, BarChart3, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("HUB");
  const [isThinking, setIsThinking] = useState(false);
  const [cognitiveStage, setCognitiveStage] = useState("");
  const [lastResult, setLastAction] = useState<any>(null);
  const [isNotionConnected, setIsNotionConnected] = useState(false);

  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (searchParams.get("access_token")) setIsNotionConnected(true);
  }, [searchParams]);

  // 🤝 THE AGENTIC ORCHESTRATION (The "Aha!" Loop)
  const runAgenticMatch = async () => {
    setIsThinking(true);
    setLastAction(null);
    
    // VISUALIZING THE AI'S THOUGHTS (The Sync Overlay Logic)
    setCognitiveStage("Agent is discovering Notion MCP tools...");
    await new Promise(r => setTimeout(r, 1200));
    setCognitiveStage("Querying 'Employee Directory' for skills gaps...");
    await new Promise(r => setTimeout(r, 1200));
    setCognitiveStage("Reasoning: Senior Lead x React Junior match identified (98%)...");
    await new Promise(r => setTimeout(r, 1200));
    setCognitiveStage("Generating 90-day syllabus via Gemini Alchemist...");
    await new Promise(r => setTimeout(r, 1200));
    setCognitiveStage("Final Handshake: JSON-RPC 2.0 commit to Notion...");
    
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AGENTIC_LOOP", payload: { action: "MENTORSHIP_SYNC" } })
      });
      const data = await res.json();
      if (data.success) setLastAction(data);
    } finally {
      setIsThinking(false);
      setCognitiveStage("");
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F0F2F8] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* LIQUID GLASS BLURS */}
      <div className="absolute top-[-5%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[60%] h-[60%] bg-blue-100/50 blur-[120px] rounded-full" />

      {/* --- NOTION SYNC STATUS OVERLAY --- */}
      <AnimatePresence>
        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white border-4 border-slate-950 p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] max-w-xl w-full text-center space-y-8">
              <div className="flex justify-center"><div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white animate-bounce shadow-2xl shadow-indigo-200"><Zap size={40} fill="currentColor" /></div></div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Autonomous Execution</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">MCP JSON-RPC Handshake in Progress</p>
              </div>
              <div className="p-6 bg-slate-100 rounded-[2rem] border-2 border-slate-200 flex items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={20} />
                <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">{cognitiveStage}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!userId ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-12 mt-24 max-w-2xl relative z-10">
          <div className="w-28 h-28 bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] flex items-center justify-center shadow-2xl"><Lock size={48} className="text-slate-950" /></div>
          <h1 className="text-8xl font-black tracking-tighter text-slate-950 uppercase leading-[0.8] drop-shadow-sm">Syndicate<br/>Sentinel</h1>
          <div className="w-full max-w-xs pt-8">
            <SignInButton mode="modal">
              <button className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-3xl active:scale-95 transition-all border-4 border-white/20">
                Initialize Gateway <ArrowRight size={16} />
              </button>
            </SignInButton>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-7xl w-full space-y-8 relative z-10">
          
          <header className="bg-white/40 backdrop-blur-3xl border border-white/60 p-4 rounded-[2.5rem] shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg"><Fingerprint size={20} /></div>
              <div className="hidden md:block text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Command Center</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{isNotionConnected ? "Uplink: Sovereign" : "Uplink: Required"}</p>
              </div>
            </div>
            <nav className="flex bg-white/20 p-1.5 rounded-[2rem] gap-1 font-black text-[10px] uppercase">
              {["HUB", "FORENSICS", "DIRECTORY"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-full transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500"}`}>{tab}</button>
              ))}
            </nav>
            <div className="pr-2"><UserButton /></div>
          </header>

          <main className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === "HUB" && (
                <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* EXAGGERATED HIERARCHY ANALYTICS (Left) */}
                  <div className="md:col-span-4 space-y-8">
                    <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-10 rounded-[4rem] shadow-2xl space-y-2 text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Skills Gaps</p>
                      <h2 className="text-9xl font-black tracking-tighter text-indigo-600 leading-none">12</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-4">Critical Handshakes Detected</p>
                    </div>
                    <div className="bg-slate-950 p-10 rounded-[4rem] shadow-2xl space-y-6 text-left border-4 border-slate-900">
                      <div className="flex items-center gap-3 text-emerald-400"><Activity size={20} /><span className="text-[10px] font-black uppercase tracking-widest">System Pulse</span></div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end text-white"><span className="text-xs font-bold uppercase tracking-widest opacity-60">Match Efficiency</span><span className="text-2xl font-black">94%</span></div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-emerald-500" /></div>
                      </div>
                    </div>
                  </div>

                  {/* LIQUID MATCHMAKER (Right) */}
                  <div className={`md:col-span-8 p-12 bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[5rem] shadow-3xl flex flex-col justify-between text-left transition-opacity ${!isNotionConnected ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                    <div className="space-y-12">
                      <div className="flex items-center justify-between">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200"><Users size={40} /></div>
                        <div className="px-6 py-2 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">98% AI Confidence</div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-7xl font-black tracking-tighter uppercase leading-[0.8]">Strategic<br/>Matchmaker</h2>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-md italic">"Autonomous Agent has detected an optimal pairing: Senior Lead (Abhishek) matched with Junior Dev (Node). Syllabuses are staged for syndication."</p>
                      </div>
                    </div>

                    <div className="space-y-8 mt-12">
                      {lastResult ? (
                        <div className="p-8 bg-emerald-500 text-white rounded-[3rem] flex items-center justify-between shadow-2xl shadow-emerald-200">
                          <div className="flex items-center gap-4">
                            <CheckCircle2 size={32} />
                            <div><p className="text-[10px] font-black uppercase tracking-widest leading-none">Syndication Success</p><p className="text-xs font-bold mt-1">90-Day Workspace Created in Notion</p></div>
                          </div>
                          <a href={lastResult.result?.url} target="_blank" className="p-4 bg-white/20 rounded-full backdrop-blur-md hover:bg-white/30 transition-all"><ExternalLink size={20} /></a>
                        </div>
                      ) : (
                        <button 
                          onClick={runAgenticMatch} 
                          className="group w-full py-10 bg-indigo-600 text-white rounded-[3.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-6 shadow-[0_30px_60px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                          <Zap size={24} fill="currentColor" /> Approve 90-Day Plan <ArrowRight className="group-hover:translate-x-3 transition-transform" />
                        </button>
                      )}
                      {!isNotionConnected && (
                        <a href="/api/notion/auth" className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors">
                          <Zap size={12} /> Activate Notion Handshake to Unlock
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="text-center pt-8 opacity-20"><p className="text-[9px] font-black text-slate-950 uppercase tracking-[1.5em]">Syndicate OS // Enterprise Machine Experience</p></footer>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
