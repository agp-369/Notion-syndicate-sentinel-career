"use client";

import { useState, useEffect, Suspense } from "react";
import { ShieldCheck, GraduationCap, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal, Activity, CheckCircle2, Command, Users, BarChart3, Fingerprint, Mic, Moon, Sun, Briefcase, Award, TrendingUp, Trophy, LogOut, Database, Search, ShieldAlert, AlertTriangle, Construction, Bot, Workflow, Settings, FileText, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";

function SentinelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { isLoaded, userId } = useAuth();
  
  const [step, setStep] = useState<"IDENTITY" | "HANDSHAKE" | "COMMAND">("IDENTITY");
  const [activeTab, setActiveTab] = useState("FORENSICS");
  const [isSyncing, setIsSyncing] = useState(false);
  const [log, setLog] = useState<string[]>(["Sentinel OS v15.0 // Initializing..."]);
  const [accessToken, setAccessToken] = useState("");
  const [nodeState, setNodeState] = useState<any>(null);
  const [uiMode, setUiMode] = useState<"MORNING" | "FOCUS">("MORNING");

  // 🛡️ AUTH HANDSHAKE & AUTONOMOUS DISCOVERY
  useEffect(() => {
    const urlToken = searchParams.get("access_token");
    const storedToken = localStorage.getItem("notion_access_token");
    let effectiveToken = "";

    if (urlToken) {
      localStorage.setItem("notion_access_token", urlToken);
      effectiveToken = urlToken;
      setAccessToken(urlToken);
      window.history.replaceState({}, document.title, "/");
    } else if (storedToken) {
      effectiveToken = storedToken;
      setAccessToken(storedToken);
    }

    if (effectiveToken && userId) {
      performAutonomousDiscovery(effectiveToken);
    } else if (userId) {
      setStep("HANDSHAKE");
    }
  }, [searchParams, userId]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-4), `> ${msg}`]);

  const performAutonomousDiscovery = async (token: string) => {
    setIsSyncing(true);
    addLog("Searching for User DNA (Resume) & Sovereign Hub...");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "DISCOVER_SOVEREIGN_NODE", accessToken: token })
      });
      const data = await res.json();
      setNodeState(data);
      
      if (data.resumeId) addLog("Success: Resume DNA Extracted.");
      else addLog("Warning: No Resume found. Creating raw profile.");

      if (data.isInitialized) {
        addLog("Success: Forensic Hub Active.");
        setStep("COMMAND");
      } else {
        initializeForensicHub(token);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const initializeForensicHub = async (token: string) => {
    setIsSyncing(true);
    addLog("Architect: Building High-Fidelity Forensic Hub...");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "INITIALIZE_HUB", accessToken: token })
      });
      const data = await res.json();
      if (data.success) {
        addLog("Hub Realized. Sovereign Node Online.");
        setNodeState((prev: any) => ({ ...prev, isInitialized: true, hubId: data.hubId }));
        setStep("COMMAND");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const executeForensicAudit = async () => {
    if (!nodeState?.hubId) return alert("Infrastructure missing.");
    setIsSyncing(true);
    addLog("Scraping Global Job Boards for Core Matches...");
    await new Promise(r => setTimeout(r, 1000));
    addLog("Running Forensic Verification Engine...");
    
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode: "RUN_FORENSIC_AUDIT", 
          accessToken, 
          payload: { hubId: nodeState.hubId, jobData: { title: "Staff Product Engineer", company: "Stripe" } } 
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog("Verification Published to Notion.");
        window.open(data.url, "_blank");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

  return (
    <div className={`min-h-screen transition-all duration-1000 p-4 md:p-8 flex flex-col items-center relative overflow-hidden ${uiMode === "MORNING" ? "bg-[#F8FAFC]" : "bg-[#0A0F1E]"}`}>
      
      {/* --- STATUS OVERLAY --- */}
      <div className="fixed bottom-8 right-8 z-[200] max-w-xs w-full bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${isSyncing ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sentinel // Active_Monitor</p>
        </div>
        <div className="space-y-1">
          {log.map((l, i) => <p key={i} className="text-[9px] text-indigo-400/80 tracking-tight">{l}</p>)}
        </div>
      </div>

      {/* --- STEP 1: IDENTITY --- */}
      {step === "IDENTITY" && (
        <motion.div key="identity" className="flex flex-col items-center text-center space-y-12 mt-32 max-w-2xl relative z-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.3)]"><Fingerprint size={48} /></div>
          <div className="space-y-4">
            <h1 className="text-7xl font-black tracking-tighter uppercase text-slate-950">Forensic<br/>Sentinel</h1>
            <p className="text-[10px] uppercase tracking-[0.5em] text-slate-500 font-bold">The Autonomous Career Guardian</p>
          </div>
          <SignInButton mode="modal"><button className="tactile-button px-12 py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 cursor-pointer hover:scale-105 transition-all">Authenticate Sovereign ID <ArrowRight size={16} /></button></SignInButton>
        </motion.div>
      )}

      {/* --- STEP 2: HANDSHAKE --- */}
      {step === "HANDSHAKE" && (
        <motion.div key="handshake" className="flex flex-col items-center text-center space-y-12 mt-32 max-w-2xl relative z-10">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white border border-white/10"><Database size={32} /></div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase text-slate-950 leading-none">Bridge<br/>Intelligence</h2>
            <p className="text-sm italic text-slate-500 max-w-md">Authorize the Sentinel to autonomously build your Forensic Hub and extract Resume DNA.</p>
          </div>
          <a href="/api/notion/auth" className="px-12 py-6 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 cursor-pointer hover:scale-105 transition-all shadow-xl">Establish Connection <Zap size={16} fill="currentColor" /></a>
        </motion.div>
      )}

      {/* --- STEP 3: COMMAND CENTER --- */}
      {step === "COMMAND" && (
        <div className="max-w-6xl w-full space-y-10 mt-12 mb-32">
          
          <header className="flex items-center justify-between bg-white/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/60 shadow-2xl shadow-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Bot size={20} /></div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 leading-none">Command Center</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user?.firstName} // Node_Online</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { localStorage.removeItem("notion_access_token"); setStep("HANDSHAKE"); }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><LogOut size={18} /></button>
              <UserButton />
            </div>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* SYSTEM OVERVIEW */}
            <div className="md:col-span-4 space-y-8">
              <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 text-left space-y-6 shadow-2xl shadow-indigo-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Node Configuration</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold uppercase text-slate-400">Resume DNA</span>{nodeState?.resumeId ? <CheckCircle2 className="text-emerald-500" size={16} /> : <AlertTriangle className="text-amber-500" size={16} />}</div>
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold uppercase text-slate-400">Forensic Hub</span>{nodeState?.isInitialized ? <CheckCircle2 className="text-emerald-500" size={16} /> : <Loader2 className="text-indigo-500 animate-spin" size={16} />}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-10 rounded-[4rem] text-left space-y-6 shadow-3xl border-4 border-slate-900">
                <div className="flex items-center gap-3 text-emerald-400"><Globe size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Global Scraper</span></div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end text-white"><span className="text-xs font-bold uppercase opacity-60">Verification Rate</span><span className="text-2xl font-black">98.2%</span></div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="h-full bg-emerald-500" /></div>
                </div>
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="md:col-span-8 bg-white p-12 rounded-[5rem] border-2 border-slate-100 min-h-[500px] shadow-4xl text-left flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200"><ShieldCheck size={40} /></div>
                  <div className="px-6 py-2 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Real-Mode Active</div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-7xl font-black tracking-tighter uppercase text-slate-950 leading-[0.8]">Forensic<br/>Verification</h2>
                  <p className="text-lg font-medium italic text-slate-400 leading-relaxed max-w-xl">"Agent is ready to autonomously scrape job data and run forensic verification against your sovereign resume DNA."</p>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={executeForensicAudit} 
                  disabled={isSyncing}
                  className="tactile-button w-full py-12 text-white rounded-[4rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-6 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-[0_30px_60px_rgba(79,70,229,0.3)]"
                >
                  <Sparkles size={28} fill="currentColor" /> Execute Agentic Audit <ArrowRight size={24} />
                </button>
              </div>
            </div>

          </main>

          <footer className="opacity-20 text-center"><p className="text-[10px] font-black text-slate-950 uppercase tracking-[1.5em] mix-blend-difference">Syndicate OS // Forensic v15.0 Autonomous Masterpiece</p></footer>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-indigo-500 font-mono text-xs uppercase">Waking Sentinel...</div>}>
      <SentinelContent />
    </Suspense>
  );
}
