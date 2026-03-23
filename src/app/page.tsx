"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal, Settings, Database, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function Home() {
  const [activeTab, setActiveTab] = useState("ORCHESTRATOR");
  const [isThinking, setIsThinking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  
  // CONFIGURATION STATE
  const [notionToken, setNotionToken] = useState("");
  const [dbId, setDbId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  const { isLoaded, userId } = useAuth();

  const handleConfig = () => {
    if (notionToken && dbId) setIsConfigured(true);
    else alert("Please provide Notion credentials to establish the node.");
  };

  const triggerAgenticLoop = async (prompt: string) => {
    setIsThinking(true);
    setLogs([]);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AGENTIC_LOOP", payload: { prompt }, config: { token: notionToken, dbId } })
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setWorkspaceUrl(data.result?.url);
      }
    } catch (e) {
      setLogs(["❌ HANDSHAKE_FAILED: Connection Timed Out"]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* NOSTALGIC SOFT BLURS */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/30 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/30 blur-[180px] rounded-full pointer-events-none" />

      {!userId ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-12 mt-24 max-w-2xl relative z-10">
          <div className="w-24 h-24 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center shadow-3xl"><Lock size={40} /></div>
          <h1 className="text-8xl font-black tracking-tighter text-slate-950 uppercase leading-[0.85]">Syndicate<br/>Sentinel</h1>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.6em]">Enterprise Career OS // MCP v1.0</p>
          <div className="w-full max-w-xs pt-8">
            <div className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all cursor-pointer">
              <SignInButton mode="modal"><span>Initialize Sovereign Node</span></SignInButton> <ArrowRight size={16} />
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="max-w-7xl w-full space-y-12 relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row items-end justify-between gap-8 border-b-4 border-slate-950 pb-12">
            <div className="space-y-4">
              <h1 className="text-7xl font-black tracking-tighter text-slate-950 uppercase leading-[0.85]">Sovereign<br/>Command</h1>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isConfigured ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                  <Activity size={12} /> {isConfigured ? "Uplink: Active" : "Uplink: Required"}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Protocol: JSON-RPC 2.0</p>
              </div>
            </div>
            
            <nav className="flex bg-slate-200/50 backdrop-blur-md p-2 rounded-[2rem] gap-2 font-black text-[10px] uppercase border border-slate-300">
              {["ORCHESTRATOR", "FORENSICS", "HISTORY"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-[1.5rem] transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-xl border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>
              ))}
            </nav>
          </header>

          {/* MAIN DASHBOARD GRID */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
            
            {/* LEFT SIDE: CONTROLS & CONFIG (4 Columns) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* CONFIGURATION PANEL */}
              <div className="bg-white border-4 border-slate-950 p-8 rounded-[3rem] shadow-2xl space-y-6">
                <div className="flex items-center gap-2 text-slate-950">
                  <Settings size={20} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Node Configuration</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Notion Secret</label>
                    <input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl text-xs outline-none focus:border-indigo-500 transition-all font-bold" placeholder="secret_xxxx..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Database ID</label>
                    <input type="text" value={dbId} onChange={e => setDbId(e.target.value)} className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl text-xs outline-none focus:border-indigo-500 transition-all font-bold" placeholder="f80891f4..." />
                  </div>
                  <button onClick={handleConfig} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Apply Manifold</button>
                </div>
              </div>

              {/* ACTION PANEL */}
              <div className={`p-8 bg-indigo-600 text-white rounded-[3rem] shadow-2xl space-y-6 transition-opacity ${!isConfigured ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/20"><GraduationCap size={32} /></div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase leading-tight tracking-tighter">Learning<br/>Alchemist</h2>
                  <p className="text-xs font-medium text-indigo-100 leading-relaxed opacity-80">Autonomous 90-day syllabus & workspace generation via MCP.</p>
                </div>
                <button onClick={() => triggerAgenticLoop("Generate a match.")} className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">
                  {isThinking ? <Loader2 className="animate-spin" /> : <><Sparkles size={14} /> Initiate Handshake</>}
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: TERMINAL & LOGS (8 Columns) */}
            <div className="lg:col-span-8 bg-slate-950 text-white rounded-[4rem] p-12 border-4 border-slate-900 shadow-3xl flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <Terminal size={20} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">MCP JSON-RPC Reasoning Log</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
              </div>

              <div className="flex-1 space-y-4 font-mono text-[11px] leading-relaxed">
                {isThinking ? (
                  <div className="space-y-4">
                    <p className="text-emerald-400 animate-pulse">Establishing JSON-RPC 2.0 handshake with https://mcp.notion.com/mcp...</p>
                    <p className="text-slate-500">Querying capabilities (list_tools)...</p>
                  </div>
                ) : logs.length > 0 ? (
                  <div className="space-y-4">
                    {logs.map((log, i) => (
                      <p key={i} className={log.startsWith("-->") ? "text-indigo-400" : "text-emerald-400"}>{log}</p>
                    ))}
                    {workspaceUrl && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 pt-8 border-t border-slate-800 space-y-6">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Autonomous Action Complete</p>
                          <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Workspace Synced</h3>
                        </div>
                        <a href={workspaceUrl} target="_blank" className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Open Notion Workspace <ExternalLink size={14} /></a>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20 py-20">
                    <Database size={64} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Waiting for Uplink Configuration</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                <span>Endpoint: https://mcp.notion.com/mcp</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Secure Transport</span>
              </div>
            </div>

          </main>

          <footer className="text-center pt-12 border-t-4 border-slate-950">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[1em]">Syndicate Sentinel // Sovereign OS v7.5 (Strict MCP Architecture)</p>
          </footer>
        </div>
      )}
    </div>
  );
}
