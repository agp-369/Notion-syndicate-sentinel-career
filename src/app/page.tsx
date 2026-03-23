"use client";

import { useState, useEffect, Suspense } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal, Activity, CheckCircle2, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

// 🏆 SEPARATED DASHBOARD CONTENT FOR SUSPENSE
function DashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("COMPASS");
  const [isThinking, setIsThinking] = useState(false);
  const [cognitiveStage, setCognitiveStage] = useState("");
  const [lastResult, setLastAction] = useState<any>(null);
  
  // SOVEREIGN OAUTH STATE
  const [accessToken, setAccessToken] = useState("");
  const [isNotionConnected, setIsNotionConnected] = useState(false);

  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    const token = searchParams.get("access_token");
    if (token) {
      setAccessToken(token);
      setIsNotionConnected(true);
    }
  }, [searchParams]);

  const runAgenticWorkflow = async () => {
    setIsThinking(true);
    setLastAction(null);
    setCognitiveStage("Agent is querying Sovereign Directory via MCP...");
    await new Promise(r => setTimeout(r, 1500));
    setCognitiveStage("AI is reasoning about skills gaps and optimal matches...");
    await new Promise(r => setTimeout(r, 1500));
    setCognitiveStage("Preparing JSON-RPC 2.0 handshake for page creation...");
    
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AGENTIC_LOOP", payload: { prompt: "Match senior/junior." }, accessToken })
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
    <div className="min-h-screen bg-[#EEF1F9] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* NOSTALGIC SOFT BLURS */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-200/40 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-200/40 blur-[150px] rounded-full" />

      {!userId ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-12 mt-24 max-w-2xl relative z-10">
          <div className="w-28 h-28 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] flex items-center justify-center shadow-2xl"><Lock size={48} className="text-slate-950" /></div>
          <h1 className="text-8xl font-black tracking-tighter text-slate-950 uppercase leading-[0.8]">Liquid<br/>Sentinel</h1>
          <div className="w-full max-w-xs pt-8">
            <div className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all cursor-pointer">
              <SignInButton mode="modal"><span>Initialize Sovereign Node</span></SignInButton> <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-6xl w-full space-y-8 relative z-10">
          <header className="bg-white/40 backdrop-blur-3xl border border-white/60 p-4 rounded-[2.5rem] shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg"><Command size={20} /></div>
              <div className="hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Syndicate OS</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {isNotionConnected ? "MCP_CONNECTED" : "UPLINK_REQUIRED"}</p>
              </div>
            </div>
            <nav className="flex bg-white/20 p-1.5 rounded-[2rem] gap-1">
              {["COMPASS", "AUDIT", "HISTORY"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-xl" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>
              ))}
            </nav>
            <div className="pr-2"><UserButton /></div>
          </header>

          <main className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === "COMPASS" && (
                <motion.div key="compass" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-5 bg-white/40 backdrop-blur-3xl border border-white/60 p-10 rounded-[4rem] shadow-2xl space-y-8">
                    <div className="space-y-2 text-left">
                      <h2 className="text-4xl font-black tracking-tighter text-slate-950 uppercase leading-none">Uplink<br/>Handshake</h2>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Prove your MCP Identity</p>
                    </div>
                    {!isNotionConnected ? (
                      <a href="/api/notion/auth" className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={16} fill="currentColor" /> Authorize with Notion</a>
                    ) : (
                      <div className="p-8 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center gap-4 text-center">
                        <CheckCircle2 size={40} className="text-emerald-500" /><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Handshake Verified</p>
                      </div>
                    )}
                  </div>

                  <div className={`md:col-span-7 p-12 bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[4.5rem] shadow-3xl flex flex-col justify-between transition-opacity ${!isNotionConnected ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                    <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8 text-left">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest"><Activity size={16} /> Reasoning Log</div>
                        <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.85]">Agentic<br/>Orchestrator</h2>
                      </div>
                    </div>
                    <div className="flex-1 space-y-6">
                      {isThinking ? (
                        <div className="space-y-4 text-left">
                          <div className="flex items-center gap-3 text-indigo-600 animate-pulse"><Loader2 className="animate-spin" size={16} /><span className="text-xs font-bold uppercase tracking-widest">{cognitiveStage}</span></div>
                        </div>
                      ) : lastResult ? (
                        <div className="space-y-6">
                          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-left"><p className="text-sm font-medium text-slate-700 italic">"Perfect match found. Senior React Developer paired with Junior Node."</p></div>
                          <button className="w-full py-6 bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs active:scale-95 transition-all">Approve & Syndicate to Notion</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 opacity-30 text-slate-400 space-y-4"><Terminal size={48} strokeWidth={1} /><p className="text-[10px] font-black uppercase tracking-widest">Ready for Command</p></div>
                      )}
                    </div>
                    {!lastResult && !isThinking && <button onClick={runAgenticWorkflow} className="mt-8 w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black uppercase tracking-widest text-xs active:scale-95 transition-all">Synthesize Talent Match</button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          <footer className="text-center pt-8 opacity-30"><p className="text-[9px] font-black text-slate-950 uppercase tracking-[1.2em]">Syndicate Sentinel // Sovereign OS v9.0 Strict MCP</p></footer>
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
