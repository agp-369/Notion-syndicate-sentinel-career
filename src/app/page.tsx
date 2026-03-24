"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { ShieldCheck, Lock, ArrowRight, Loader2, Sparkles, ExternalLink, Zap, Terminal, CheckCircle2, Moon, Sun, Search, AlertTriangle, Construction, ShieldAlert, Cpu, Users, Server, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";

const McpTerminal = ({ logs }: { logs: string[] }) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs]);
  return (
    <div className="bg-[#050B14] font-mono text-[10px] text-emerald-400 p-6 rounded-2xl h-56 overflow-y-auto border border-emerald-500/20 shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] w-full text-left space-y-2">
      <div className="flex gap-2 text-slate-500 mb-4 items-center border-b border-slate-800 pb-2">
         <Server size={14} /> <span>JSON-RPC 2.0 // Notion MCP</span>
      </div>
      {logs.map((log, i) => (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i}>{log}</motion.div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { isLoaded, userId } = useAuth();
  
  const [step, setStep] = useState<"IDENTITY" | "HANDSHAKE" | "COCKPIT" | "SETUP">("IDENTITY");
  const [isThinking, setIsThinking] = useState(false);
  const [mcpLogs, setMcpLogs] = useState<string[]>([]);
  
  const [accessToken, setAccessToken] = useState("");
  const [discovery, setDiscovery] = useState<any>(null);
  const [uiMode, setUiMode] = useState<"MORNING" | "FOCUS">("FOCUS");
  const [activeModule, setActiveModule] = useState<"FORENSIC" | "MENTORSHIP">("FORENSIC");
  
  const [jobUrl, setJobUrl] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);
  
  const [menteeName, setMenteeName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [syllabusResult, setSyllabusResult] = useState<any>(null);
  
  const [syncSuccessUrl, setSyncSuccessUrl] = useState("");

  const addLog = (msg: string) => setMcpLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const clearLogs = () => setMcpLogs([]);

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
      performDiscovery(effectiveToken);
    } else if (userId) {
      setStep("HANDSHAKE");
    }
  }, [searchParams, userId]);

  const performDiscovery = async (token: string) => {
    setIsThinking(true); clearLogs();
    addLog("--> call_tool: query_database");
    addLog("<-- response: Searching for User Sovereign Ledgers...");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "DISCOVER", accessToken: token })
      });
      const data = await res.json();
      setDiscovery(data);
      if (data.found) {
        addLog("✅ Workspaces Found. Connecting UI.");
        setTimeout(() => setStep("COCKPIT"), 800);
      } else {
        addLog("⚠️ No Ledgers Found. Routing to Setup Wizard.");
        setTimeout(() => setStep("SETUP"), 800);
      }
    } finally {
      setTimeout(() => setIsThinking(false), 800);
    }
  };

  const initializeWorkspace = async () => {
    setIsThinking(true); clearLogs();
    addLog("--> call_tool: create_database");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "INITIALIZE_WORKSPACE", accessToken })
      });
      const data = await res.json();
      if (data.success) {
        addLog("✅ Databases built successfully.");
        performDiscovery(accessToken);
      } else {
        alert(data.error || "Setup failed. Check Notion sharing.");
        setIsThinking(false);
      }
    } catch {
       setIsThinking(false);
    }
  };

  const runForensicAudit = async () => {
    if (!jobUrl) return;
    setIsThinking(true); setAuditResult(null); setSyncSuccessUrl(""); clearLogs();
    
    addLog("--> call_tool: forensic_scrape { url: '...' }");
    setTimeout(() => addLog("<-- response: Job Description Extracted"), 1500);
    setTimeout(() => addLog("--> call_tool: analyze_fraud_heuristics"), 3000);
    setTimeout(() => addLog("<-- response: Gemini reasoning engine processing..."), 4000);

    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AUDIT_JOB", accessToken, payload: { url: jobUrl } })
      });
      const data = await res.json();
      if (data.success) {
        addLog("✅ Audit Complete. Passing data to Human-in-the-Loop.");
        setAuditResult(data.analysis);
      } else {
        addLog("❌ API Failure.");
      }
    } finally {
      setIsThinking(false);
    }
  };

  const approveAndLogAudit = async () => {
    setIsThinking(true); clearLogs();
    addLog("--> call_tool: append_block_children { type: 'callout' }");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "SYNC_TO_NOTION", accessToken, payload: { ledgerId: discovery.ledgerId, analysis: auditResult, url: jobUrl } })
      });
      const data = await res.json();
      if (data.success) {
        addLog("✅ Sync Successful.");
        setSyncSuccessUrl(data.url);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const runMentorMatch = async () => {
    if (!menteeName || !targetRole) return;
    setIsThinking(true); setSyllabusResult(null); setSyncSuccessUrl(""); clearLogs();
    
    addLog("--> call_tool: query_employee_trajectories");
    setTimeout(() => addLog(`--> call_tool: generate_90_day_syllabus { target: '${targetRole}' }`), 2000);

    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "GENERATE_SYLLABUS", accessToken, payload: { menteeName, targetRole } })
      });
      const data = await res.json();
      if (data.success) {
        addLog("✅ Syllabus Generated. Passing to HITL.");
        setSyllabusResult(data.syllabus);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const approveAndLogSyllabus = async () => {
    setIsThinking(true); clearLogs();
    addLog("--> call_tool: create_page { title: 'Mentorship Workspace' }");
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "SYNC_SYLLABUS", accessToken, payload: { parentId: process.env.NEXT_PUBLIC_PROFILE_PAGE_ID || discovery.profileId || discovery.ledgerId, syllabus: syllabusResult, menteeName, targetRole } })
      });
      const data = await res.json();
      if (data.success) {
        addLog("✅ Mentorship Workspace created in Notion.");
        setSyncSuccessUrl(data.url);
      } else {
         addLog("❌ Sync Failed (Ensure parent page ID is valid).");
      }
    } finally {
      setIsThinking(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

  const bgStyles = uiMode === "MORNING" ? "bg-[#f1f5f9] text-slate-900" : "bg-[#050A15] text-white";
  const glassStyles = uiMode === "MORNING" ? "bg-white/60 backdrop-blur-3xl border border-white/80 shadow-2xl" : "bg-[#0F172A]/40 backdrop-blur-3xl border border-slate-700/50 shadow-2xl liquid-glass";

  return (
    <div className={`min-h-screen transition-all duration-700 p-4 md:p-8 flex flex-col items-center relative overflow-hidden ${bgStyles}`}>
      
      {/* AGENTIC MCP OVERLAY */}
      <AnimatePresence>
        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="p-8 md:p-12 rounded-[2.5rem] bg-slate-900 border border-indigo-500/30 max-w-2xl w-full text-center space-y-8 shadow-[0_0_100px_rgba(79,70,229,0.15)]">
              <div className="flex justify-center"><div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white animate-pulse"><Cpu size={32} /></div></div>
              <McpTerminal logs={mcpLogs} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 1: IDENTITY */}
      {step === "IDENTITY" && (
        <motion.div key="identity" className="flex flex-col items-center text-center space-y-10 mt-32 max-w-2xl relative z-10">
          <div className={`w-32 h-32 ${glassStyles} rounded-[3rem] flex items-center justify-center`}><ShieldCheck size={56} className="text-indigo-500" /></div>
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85]">Lumina<br/><span className="text-indigo-500">OS</span></h1>
          <p className="text-sm font-medium opacity-60 italic max-w-md">Sovereign Career Agent & Mentorship Orchestrator powered by Notion MCP.</p>
          <SignInButton mode="modal">
            <button className="tactile-button bg-indigo-600 px-12 py-6 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/50">
              Initialize Node <ArrowRight size={18} />
            </button>
          </SignInButton>
        </motion.div>
      )}

      {/* STEP 2: HANDSHAKE */}
      {step === "HANDSHAKE" && (
        <motion.div key="handshake" className="flex flex-col items-center text-center space-y-12 mt-32 max-w-3xl relative z-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl"><Lock size={40} /></div>
          <div className="space-y-4">
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none">Security<br/>Handshake</h2>
            <p className="text-sm font-medium opacity-60 italic">Hello {user?.firstName}. Authorize Lumina to build your secure Notion infrastructure.</p>
          </div>
          <a href="/api/notion/auth" className="tactile-button bg-slate-900 border border-slate-700 px-12 py-6 rounded-[2rem] text-white font-black uppercase tracking-widest text-xs flex items-center gap-4 hover:scale-105 active:scale-95 shadow-xl hover:shadow-indigo-500/20">
            <Zap size={18} className="text-indigo-400" /> Grant Workspace Access
          </a>
        </motion.div>
      )}

      {/* STEP 2.5: SETUP WIZARD */}
      {step === "SETUP" && (
        <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center space-y-10 mt-24 max-w-2xl relative z-10">
          <div className="w-24 h-24 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl animate-pulse"><Construction size={40} /></div>
          <div className="space-y-4">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Missing<br/>Ledger</h2>
            <p className="text-sm font-medium opacity-60">Job Ledger database not found in the authorized workspace.</p>
          </div>
          <div className={`p-8 ${glassStyles} rounded-[2rem] w-full text-left space-y-4`}>
             <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Action Required</p>
             <ol className="list-decimal pl-4 text-sm space-y-2 opacity-80">
                <li>Create an empty page in your Notion.</li>
                <li>Click the ... menu on that page and select Connect To -&gt; Syndicate Nexus.</li>
                <li>Return here and click Initialize.</li>
             </ol>
          </div>
          <button onClick={initializeWorkspace} className="tactile-button bg-indigo-600 px-12 py-6 rounded-[2rem] text-white font-black uppercase tracking-widest text-xs flex items-center gap-4 hover:scale-105 active:scale-95 shadow-xl hover:shadow-indigo-500/50">
            <Sparkles size={18} /> Initialize Sovereign Architecture
          </button>
        </motion.div>
      )}

      {/* STEP 3: COCKPIT */}
      {step === "COCKPIT" && (
        <div className="max-w-7xl w-full space-y-6 relative z-10 mx-auto">
          {/* Header */}
          <header className={`p-4 rounded-[2rem] flex items-center justify-between ${glassStyles}`}>
            <div className="flex items-center gap-4 pl-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={24} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Lumina OS</p>
                <div className="flex items-center gap-2 mt-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">SECURE UPLINK ACTIVE</p></div>
              </div>
            </div>
            
            <div className="hidden md:flex bg-slate-900/10 p-1.5 rounded-full gap-2 border border-slate-700/50">
               <button onClick={() => {setActiveModule("FORENSIC"); setSyncSuccessUrl("")}} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === "FORENSIC" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>Job Auditor</button>
               <button onClick={() => {setActiveModule("MENTORSHIP"); setSyncSuccessUrl("")}} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeModule === "MENTORSHIP" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>Career Mentor</button>
            </div>

            <div className="flex items-center gap-4 pr-2">
              <button onClick={() => setUiMode(uiMode === "MORNING" ? "FOCUS" : "MORNING")} className={`p-3 rounded-xl transition-colors bg-slate-900/10 hover:bg-slate-900/20`}>{uiMode === "MORNING" ? <Moon size={18} className="text-slate-900" /> : <Sun size={18} className="text-amber-400" />}</button>
              <UserButton />
            </div>
          </header>

          {/* Main Layout */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Master Control Inputs */}
            <div className="lg:col-span-5 space-y-6">
               <div className={`p-10 rounded-[2.5rem] space-y-8 h-full flex flex-col ${glassStyles}`}>
                  
                  {activeModule === "FORENSIC" ? (
                     <>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Forensic Module</p>
                           <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">Job<br/>Auditor</h2>
                        </div>
                        <p className="text-sm opacity-60 font-medium leading-relaxed">Paste a job posting URL below. Lumina will scrape the domain, analyze for fraud patterns, and match it against your skill matrix.</p>
                        <div className="mt-auto space-y-4 pt-4">
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                              <input type="text" placeholder="https://linkedin.com/jobs/..." value={jobUrl} onChange={e => setJobUrl(e.target.value)} className={`w-full bg-slate-900/30 border border-slate-700/50 rounded-2xl py-5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors ${uiMode === "MORNING" ? "text-slate-900 bg-white border-slate-300" : "text-white"}`} />
                           </div>
                           <button onClick={runForensicAudit} disabled={!jobUrl} className="w-full tactile-button text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg">
                              <Terminal size={18} /> Execute Forensic Audit
                           </button>
                        </div>
                     </>
                  ) : (
                     <>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Development Module</p>
                           <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">Career<br/>Pathway</h2>
                        </div>
                        <p className="text-sm opacity-60 font-medium leading-relaxed">Enter details to generate an AI-backed 90-Day Mentorship Syllabus. Lumina uses Notion MCP to construct the workspace.</p>
                        <div className="mt-auto space-y-4 pt-4">
                           <input type="text" placeholder="Mentee Name" value={menteeName} onChange={e => setMenteeName(e.target.value)} className={`w-full bg-slate-900/30 border border-slate-700/50 rounded-2xl py-4 px-4 text-sm font-medium focus:outline-none focus:border-fuchsia-500 transition-colors ${uiMode === "MORNING" ? "text-slate-900 bg-white border-slate-300" : "text-white"}`} />
                           <input type="text" placeholder="Target Role (e.g. Senior Frontend Engineer)" value={targetRole} onChange={e => setTargetRole(e.target.value)} className={`w-full bg-slate-900/30 border border-slate-700/50 rounded-2xl py-4 px-4 text-sm font-medium focus:outline-none focus:border-fuchsia-500 transition-colors ${uiMode === "MORNING" ? "text-slate-900 bg-white border-slate-300" : "text-white"}`} />
                           
                           <button onClick={runMentorMatch} disabled={!menteeName || !targetRole} className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:scale-[1.02] active:scale-95 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-fuchsia-500/25">
                              <Target size={18} /> Agentic Mentor Matchmaker
                           </button>
                        </div>
                     </>
                  )}
                  
               </div>
            </div>

            {/* Right Col: Reasoning Display & Override */}
            <div className="lg:col-span-7">
               {activeModule === "FORENSIC" && auditResult && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-10 rounded-[2.5rem] h-full flex flex-col ${glassStyles}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Analysis Complete</p>
                           <h3 className="text-2xl font-black tracking-tight">{auditResult.jobTitle}</h3>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${auditResult.safetyScore > 70 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                           {auditResult.safetyScore > 70 ? <ShieldCheck size={18}/> : <ShieldAlert size={18}/>}
                           {auditResult.verdict}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-700/50">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Authenticity Score</p>
                           <p className="text-4xl font-black text-indigo-400">{auditResult.safetyScore}%</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-700/50">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Skill Match Score</p>
                           <p className="text-4xl font-black text-emerald-400">{auditResult.matchScore}%</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-4 flex-grow">
                        <div>
                           <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Why this recommendation?</p>
                           <p className="text-sm font-medium leading-relaxed opacity-90 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">{auditResult.reasoning}</p>
                        </div>
                     </div>

                     {/* Human-in-the-Loop Override */}
                     <div className="mt-auto border-t border-slate-700/50 pt-8">
                        {syncSuccessUrl ? (
                           <div className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-4 text-emerald-500">
                                 <CheckCircle2 size={24} />
                                 <p className="font-bold text-sm">Successfully logged to Master Ledger</p>
                              </div>
                              <a href={syncSuccessUrl} target="_blank" className="p-3 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-xl transition-all"><ExternalLink size={20} className="text-emerald-500"/></a>
                           </div>
                        ) : (
                           <div className="flex flex-col sm:flex-row items-center gap-4">
                              <div className="flex-grow flex items-center gap-3 opacity-60">
                                 <AlertTriangle size={18} className="text-amber-500" />
                                 <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Human-in-the-Loop Override</p>
                              </div>
                              <button onClick={approveAndLogAudit} className="w-full sm:w-auto bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-xl">
                                 <CheckCircle2 size={18} /> Approve & Log to Notion
                              </button>
                           </div>
                        )}
                     </div>
                  </motion.div>
               )}

               {activeModule === "MENTORSHIP" && syllabusResult && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-10 rounded-[2.5rem] h-full flex flex-col ${glassStyles}`}>
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">AI Match Completed</p>
                           <h3 className="text-2xl font-black tracking-tight">{syllabusResult.mentorName}</h3>
                        </div>
                        <div className="px-5 py-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Synergy Match</p>
                           <p className="text-3xl font-black text-fuchsia-400 text-center">{syllabusResult.matchScore}%</p>
                        </div>
                     </div>

                     <div className="text-left mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Why this mentor?</p>
                        <p className="text-sm font-medium opacity-90 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">{syllabusResult.justification}</p>
                     </div>

                     {/* Gamified Syllabus */}
                     <div className="text-left flex-grow">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">90-Day Career Pathway</p>
                        <div className="space-y-4">
                           {syllabusResult.phases.map((p: any, i: number) => (
                              <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-700/30 relative overflow-hidden group">
                                 <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-indigo-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 relative z-10">{i+1}</div>
                                 <div className="relative z-10">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{p.timeframe}</p>
                                    <p className="text-sm font-medium mt-1">{p.focus}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Human-in-the-Loop Override */}
                     <div className="mt-8 border-t border-slate-700/50 pt-8">
                        {syncSuccessUrl ? (
                           <div className="p-6 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-2xl flex items-center justify-between">
                              <p className="font-bold text-sm text-fuchsia-400 flex items-center gap-2"><CheckCircle2 size={20} /> Workspace Initialized via MCP</p>
                              <a href={syncSuccessUrl} target="_blank" className="p-3 bg-fuchsia-500/20 hover:bg-fuchsia-500/40 rounded-xl transition-all"><ExternalLink size={20} className="text-fuchsia-400"/></a>
                           </div>
                        ) : (
                           <div className="flex flex-col sm:flex-row items-center gap-4">
                              <p className="flex-grow flex items-center gap-3 opacity-60 text-[10px] font-bold uppercase tracking-widest"><AlertTriangle size={18} className="text-amber-500" /> Awaiting Human-in-the-Loop</p>
                              <button onClick={approveAndLogSyllabus} className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-fuchsia-500/20">
                                 <Server size={18} /> Initialize Notion Workspace
                              </button>
                           </div>
                        )}
                     </div>
                  </motion.div>
               )}

               {((activeModule === "FORENSIC" && !auditResult) || (activeModule === "MENTORSHIP" && !syllabusResult)) && (
                  <div className={`p-10 rounded-[2.5rem] h-full flex flex-col items-center justify-center text-center opacity-40 ${glassStyles}`}>
                     <ShieldCheck size={64} className="mb-6 opacity-50" />
                     <h3 className="text-xl font-black uppercase tracking-widest mb-2">Awaiting Target</h3>
                     <p className="text-sm font-medium">Select a module and deploy agents to begin.</p>
                  </div>
               )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
