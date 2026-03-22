"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, Users, GraduationCap, ArrowRight, LayoutDashboard, DatabaseZap, Loader2, Send, CheckCircle2, Search, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [notionToken, setNotionToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for HITL review
  const [forensicPreview, setForensicPreview] = useState<any>(null);
  const [mentorshipPairs, setMentorshipPairs] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* NOSTALGIC SOFT BLURS */}
      <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-indigo-50 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-blue-50 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl w-full space-y-16 relative z-10">
        
        {/* BOLD TYPOGRAPHY HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 border-b-2 border-slate-100 pb-12">
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter text-slate-950 uppercase leading-none">Syndicate<br/>Sentinel</h1>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.5em]">The Sovereign Career OS</p>
          </div>
          
          <nav className="flex bg-slate-100 p-2 rounded-3xl gap-2">
            {["DASHBOARD", "FORENSICS", "TALENT", "MENTORSHIP"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-xl" : "text-slate-400 hover:text-slate-600"}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {/* MAIN COMMAND CENTER */}
        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* 🏠 DASHBOARD VIEW */}
            {activeTab === "DASHBOARD" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-10 bg-indigo-600 text-white rounded-[3rem] shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                  <ShieldCheck size={48} strokeWidth={2.5} />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black leading-tight">Forensic<br/>Job Audit</h2>
                    <p className="text-xs font-medium text-indigo-100 leading-relaxed opacity-80">Autonomous scam detection & authenticity scoring.</p>
                    <button onClick={() => setActiveTab("FORENSICS")} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Launch Sentinel</button>
                  </div>
                </div>
                
                <div className="p-10 bg-slate-950 text-white rounded-[3rem] shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                  <Users size={48} strokeWidth={2.5} />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black leading-tight">Talent<br/>Director</h2>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed opacity-80">Skill-based mentorship matching & pairing.</p>
                    <button onClick={() => setActiveTab("TALENT")} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Open Directory</button>
                  </div>
                </div>

                <div className="p-10 bg-blue-500 text-white rounded-[3rem] shadow-2xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                  <GraduationCap size={48} strokeWidth={2.5} />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black leading-tight">Learning<br/>Alchemist</h2>
                    <p className="text-xs font-medium text-blue-50 leading-relaxed opacity-80">Autonomous 90-day syllabus & workspace generation.</p>
                    <button onClick={() => setActiveTab("MENTORSHIP")} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Synthesize Path</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🛡️ FORENSICS VIEW */}
            {activeTab === "FORENSICS" && (
              <motion.div key="foren" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-slate-50 border-2 border-slate-100 p-12 rounded-[4rem] space-y-10">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-indigo-600"><Search size={40} /></div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tighter">Sentinel Audit Cockpit</h2>
                    <p className="text-sm text-slate-400 font-medium italic max-w-sm">"The human oversees while the agent scans the job board manifold."</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="p-6 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-400 transition-all font-bold text-sm" placeholder="NOTION_SECRET" />
                    <button className="p-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Scan Ledger for Leads</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🤝 TALENT & MENTORSHIP VIEW (HITL) */}
            {(activeTab === "TALENT" || activeTab === "MENTORSHIP") && (
              <motion.div key="talent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-slate-50 border-2 border-slate-100 p-12 rounded-[4rem] space-y-8">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-950 uppercase">Intelligence Pairing</h2>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Awaiting Human-in-the-Loop Approval</p>
                    </div>
                    <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Fetch Talent Data</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 space-y-6 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between">
                        <HeartHandshake className="text-indigo-600" />
                        <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">98% Match</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">Strategic Pair</p>
                        <h3 className="text-2xl font-black text-slate-950">Senior Dev x Junior React</h3>
                      </div>
                      <button className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Review Syllabus Preview</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <footer className="text-center pt-12 border-t-2 border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Syndicate Sentinel // Sovereign Career OS v5.0</p>
        </footer>

      </div>
    </div>
  );
}
