"use client";

import { useState } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isThinking, setIsThinking] = useState(false);
  const [lastAction, setLastAction] = useState<any>(null);
  const { isLoaded, userId } = useAuth();

  // 🤝 THE AGENTIC TRIGGER (Human-in-the-Loop)
  const triggerAgenticLoop = async (prompt: string) => {
    setIsThinking(true);
    setLastAction(null);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode: "AGENTIC_LOOP",
          payload: { prompt }
        })
      });
      const data = await res.json();
      if (data.success) setLastAction(data);
    } catch (e) {
      alert("MCP Handshake Failed.");
    } finally {
      setIsThinking(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* ENTERPRISE SOFT BLURS */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-50/50 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-50/50 blur-[180px] rounded-full pointer-events-none" />

      {!userId ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-12 mt-24 max-w-2xl relative z-10">
          <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200"><Lock size={40} /></div>
          <div className="space-y-4">
            <h1 className="text-8xl font-black tracking-tighter text-slate-950 uppercase leading-[0.85] text-balance">Sovereign<br/>Sentinel</h1>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.6em]">Enterprise Career OS // MCP v1.0</p>
          </div>
          <div className="w-full max-w-xs pt-12">
            <div className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-3xl active:scale-95 transition-all cursor-pointer">
              <SignInButton mode="modal"><span>Initialize Handshake</span></SignInButton> <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-6xl w-full space-y-16 relative z-10">
          
          <header className="flex flex-col md:flex-row items-end justify-between gap-8 border-b-4 border-slate-950 pb-12 text-left">
            <div className="space-y-2">
              <h1 className="text-7xl font-black tracking-tighter text-slate-950 uppercase leading-[0.85]">Command<br/>Center</h1>
              <div className="flex items-center gap-4 mt-6">
                <div className="px-5 py-2 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-indigo-400 fill-indigo-400" />
                  Active Node: Notion MCP
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Protocol: JSON-RPC 2.0</p>
              </div>
            </div>
            
            <nav className="flex bg-slate-100 p-2 rounded-[2rem] gap-2 font-black text-[10px] uppercase">
              {["ORCHESTRATOR", "FORENSICS", "HISTORY"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-[1.5rem] transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-2xl" : "text-slate-400 hover:text-slate-600"}`}>{tab}</button>
              ))}
            </nav>
          </header>

          <main className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === "ORCHESTRATOR" && (
                <motion.div key="orch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* AGENTIC INPUT */}
                  <div className="p-12 bg-indigo-600 text-white rounded-[4rem] shadow-3xl flex flex-col justify-between space-y-12">
                    <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-md border border-white/20"><GraduationCap size={40} strokeWidth={2.5} /></div>
                    <div className="space-y-6">
                      <h2 className="text-5xl font-black leading-[0.9] text-left uppercase tracking-tighter">Learning<br/>Alchemist</h2>
                      <p className="text-sm font-medium text-indigo-100 opacity-90 text-left leading-relaxed">"The AI host autonomously queries your Notion Directory, reasons about the perfect match, and spawns a new workspace via the MCP bridge."</p>
                      
                      <button 
                        onClick={() => triggerAgenticLoop("Find a mentor for my newest junior employee and create a 90-day React roadmap in Notion.")} 
                        disabled={isThinking}
                        className="w-full py-6 bg-white text-indigo-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isThinking ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Initiate Agentic Loop</>}
                      </button>
                    </div>
                  </div>

                  {/* AGENTIC LOG / OUTPUT */}
                  <div className="bg-slate-950 text-white rounded-[4rem] p-12 shadow-3xl flex flex-col justify-between border-4 border-slate-900 relative overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-6 mb-8">
                      <Terminal size={20} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Reasoning Log</span>
                    </div>

                    <div className="flex-1 space-y-6">
                      {isThinking ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-4 bg-slate-800 rounded w-3/4" />
                          <div className="h-4 bg-slate-800 rounded w-1/2" />
                          <div className="h-20 bg-slate-900 rounded-3xl w-full" />
                        </div>
                      ) : lastAction ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Handshake Complete</p>
                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Notion Action: {lastAction.action}</h3>
                          </div>
                          <p className="text-sm text-slate-400 leading-relaxed italic">"{lastAction.summary}"</p>
                          <a 
                            href={lastAction.result?.url || "#"} 
                            target="_blank" 
                            className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            Open New Workspace <ExternalLink size={14} />
                          </a>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                          <Zap size={48} />
                          <p className="text-[10px] font-black uppercase tracking-widest">Waiting for Human Approval</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      <span>Transport: HTTP Stream</span>
                      <span>Auth: Bearer Sovereign</span>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="text-center pt-16 border-t-4 border-slate-950">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[1em]">Syndicate Sentinel // Sovereign OS v7.0 (Strict MCP)</p>
          </footer>
        </div>
      )}
    </div>
  );
}
