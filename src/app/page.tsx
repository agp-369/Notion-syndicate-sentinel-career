"use client";

import { useState } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Mic, Terminal, LayoutDashboard, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [activeTab, setActiveTab] = useState("COMPASS");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastAction, setLastAction] = useState<any>(null);
  
  // SOVEREIGN MANIFOLD STATE
  const [notionToken, setNotionToken] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  const { isLoaded, userId } = useAuth();

  const triggerAgenticHandshake = async (prompt: string) => {
    setIsThinking(true);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AGENTIC_LOOP", payload: { prompt }, config: { token: notionToken, ledgerId, profileId } })
      });
      const data = await res.json();
      if (data.success) setLastAction(data);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#EEF1F9] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-200/40 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-200/40 blur-[150px] rounded-full" />

      {!userId ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-12 mt-24 max-w-2xl relative z-10">
          <div className="w-28 h-28 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[3rem] flex items-center justify-center shadow-3xl"><Lock size={48} className="text-slate-950" /></div>
          <div className="space-y-4">
            <h1 className="text-8xl font-black tracking-tighter text-slate-950 uppercase leading-[0.8]">Liquid<br/>Sentinel</h1>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.6em]">The Machine Experience OS</p>
          </div>
          <div className="w-full max-w-xs pt-8">
            <div className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all cursor-pointer">
              <SignInButton mode="modal"><span>Initialize Compass</span></SignInButton> <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-5xl w-full space-y-8 relative z-10">
          
          <header className="bg-white/40 backdrop-blur-3xl border border-white/60 p-4 rounded-[2.5rem] shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4 pl-4">
              <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-white"><Zap size={20} fill="currentColor" /></div>
              <div className="hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Syndicate OS</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">v8.0 Liquid Glass</p>
              </div>
            </div>
            <nav className="flex bg-white/20 p-1.5 rounded-[2rem] gap-1">
              {["COMPASS", "AUDIT", "ALCHEMY"].map((tab) => (
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
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black tracking-tighter text-slate-950 uppercase leading-none">Uplink<br/>Node</h2>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Connect Manifolds</p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-1 bg-white/20 rounded-3xl border border-white/40"><input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="w-full bg-transparent p-4 outline-none text-xs font-bold" placeholder="NOTION_SECRET" /></div>
                      <div className="p-1 bg-white/20 rounded-3xl border border-white/40"><input type="text" value={ledgerId} onChange={e => setLedgerId(e.target.value)} className="w-full bg-transparent p-4 outline-none text-xs font-bold" placeholder="LEDGER_ID" /></div>
                      <button onClick={() => setIsConfigured(true)} className="w-full py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">Establish Handshake</button>
                    </div>
                  </div>

                  <div className={`md:col-span-7 p-12 bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[4.5rem] shadow-3xl flex flex-col justify-between transition-opacity ${!isConfigured ? "opacity-20 pointer-events-none" : "opacity-100"}`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white"><LayoutDashboard size={32} /></div>
                        <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.85]">Career<br/>Compass</h2>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="bg-slate-100/50 p-8 rounded-[3rem] border border-white/40 space-y-4">
                        <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">90-Day Progress</span><span className="text-xs font-black text-indigo-600">68%</span></div>
                        <div className="h-4 bg-white rounded-full overflow-hidden border border-slate-200"><motion.div initial={{ width: 0 }} animate={{ width: "68%" }} className="h-full bg-gradient-to-r from-indigo-500 to-blue-500" /></div>
                      </div>
                      <button onClick={() => setActiveTab("ALCHEMY")} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black uppercase tracking-widest text-xs shadow-3xl active:scale-95 transition-all">Launch Alchemist</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "ALCHEMY" && (
                <motion.div key="alchemy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="bg-white/40 backdrop-blur-3xl border border-white/60 p-12 rounded-[5rem] shadow-3xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b-2 border-slate-100 pb-12 mb-12 text-center md:text-left">
                      <h2 className="text-7xl font-black tracking-tighter uppercase leading-[0.8]">Intent<br/>Alchemy</h2>
                      <motion.button animate={isRecording ? { scale: [1, 1.1, 1], backgroundColor: ["#4F46E5", "#EF4444", "#4F46E5"] } : {}} onClick={() => setIsRecording(!isRecording)} className="w-32 h-32 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-3xl active:scale-90 transition-all cursor-pointer"><Mic size={48} /></motion.button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white/60 p-10 rounded-[4rem] space-y-6 border border-white/80">
                        <div className="flex items-center gap-3 text-slate-400"><Activity size={16} /><span className="text-[10px] font-black uppercase tracking-widest">AI Intent Extractor</span></div>
                        <p className="text-xl font-black text-slate-900 leading-tight italic">{isRecording ? '"Transcribing voice input: Met with Sarah today..."' : '"Tap the microphone to dictate meeting notes."'}</p>
                      </div>
                      <div className="bg-slate-950 text-white p-10 rounded-[4rem] flex flex-col justify-between border-4 border-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-6"><Terminal size={20} className="text-emerald-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">MCP Orchestration Log</span></div>
                        <div className="py-8 font-mono text-[10px] space-y-2 opacity-60">
                          <p>--&gt; notion/query_database</p>
                          <p className="text-emerald-400">&lt;-- Success: Workspace Page Identified</p>
                          <p>--&gt; notion/append_block_children</p>
                        </div>
                        <button className="w-full py-5 bg-emerald-500 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">Sync Tactical Approval</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="text-center pt-8 opacity-30 flex flex-col items-center gap-4">
            <div className="w-1 h-12 bg-slate-950 rounded-full" />
            <p className="text-[9px] font-black text-slate-950 uppercase tracking-[1em]">Syndicate OS // MX v8.0 Liquid Glass</p>
          </footer>
        </div>
      )}
    </div>
  );
}
