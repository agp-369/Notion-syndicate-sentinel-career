"use client";

import { useState } from "react";
import { Sparkles, Database, Link as LinkIcon, CheckCircle2, ArrowRight, Compass, GraduationCap, Briefcase, Loader2, MessageSquareHeart, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [step, setStep] = useState(1);
  const [notionToken, setNotionToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [memoryId, setMemoryId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const nextStep = () => setStep(prev => prev + 1);

  const startAnalysis = async () => {
    if (!notionToken || !databaseId || !profileId || !memoryId) {
      alert("All connection manifolds (Token, DB, Profile, Memory) must be active.");
      return;
    }

    const cleanDbId = databaseId.trim().replace(/-/g, "");
    const cleanProfileId = profileId.trim().replace(/-/g, "");
    const cleanMemoryId = memoryId.trim().replace(/-/g, "");

    setIsConnecting(true);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          notionToken: notionToken.trim(), 
          pageId: cleanDbId, 
          userProfileId: cleanProfileId,
          memoryPageId: cleanMemoryId
        })
      });
      const data = await res.json();
      if (data.success) nextStep();
      else alert("Protocol error: " + data.error);
    } catch (e) {
      alert("Handshake error.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-3xl w-full space-y-12 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] text-white">
            <Compass size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Notion Career Agent</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-[0.2em]">Sovereign Intelligence Node</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-white">Prepare your Manifolds.</h2>
                  <p className="text-slate-400 text-sm italic">"The AI requires three specific nodes to generate a high-fidelity career strategy."</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center text-center gap-2"><Briefcase size={20} className="text-indigo-400" /><p className="text-[10px] font-bold text-white uppercase tracking-tighter">Job Ledger</p></div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center text-center gap-2"><GraduationCap size={20} className="text-blue-400" /><p className="text-[10px] font-bold text-white uppercase tracking-tighter">Profile</p></div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center text-center gap-2"><BrainCircuit size={20} className="text-emerald-400" /><p className="text-[10px] font-bold text-white uppercase tracking-tighter">Memory</p></div>
                </div>
                <a href="https://www.notion.so/f80891f4b35c4857b71fcb17bb5cfda4" target="_blank" className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-3 transition-all font-bold border border-slate-700 cursor-pointer">Duplicate System Template <LinkIcon size={16} /></a>
                <button onClick={nextStep} className="w-full py-4 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl flex items-center justify-center gap-2 transition-all font-bold cursor-pointer active:scale-95">Establish Connection <ArrowRight size={16} /></button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-white">Uplink Configuration</h2>
                  <p className="text-slate-400 text-sm">Provide the sovereign IDs for your workspace manifolds.</p>
                </div>
                <div className="space-y-4 text-left">
                  <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-widest">Integration Secret</label><input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-white" placeholder="secret_xxxx..." /></div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-widest">Database ID</label><input type="text" value={databaseId} onChange={e => setDatabaseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-white" placeholder="f80891f4..." /></div>
                    <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-widest">Profile ID</label><input type="text" value={profileId} onChange={e => setProfileId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-white" placeholder="7e016b0e..." /></div>
                    <div className="space-y-1"><label className="text-[10px] uppercase font-bold text-slate-500 ml-1 tracking-widest">Memory ID</label><input type="text" value={memoryId} onChange={e => setMemoryId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-white" placeholder="3c1d925f..." /></div>
                  </div>
                </div>
                <button onClick={startAnalysis} disabled={isConnecting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-3 transition-all font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer active:scale-95">{isConnecting ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Initialize Analysis</>}</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]"><CheckCircle2 size={40} /></div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Sync Successful.</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto italic leading-relaxed text-balance">The Master Architect has analyzed your leads. Resume strategies and voice-cloned pitches have been injected into your Notion Ledger.</p>
                </div>
                <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-2xl w-full flex items-start gap-4 text-left"><MessageSquareHeart className="text-indigo-400 shrink-0 mt-1" size={24} /><div><p className="text-sm text-white font-bold uppercase tracking-tight">Strategy Dispatched</p><p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Head to your Notion board to review your mentor's guidance.</p></div></div>
                <button onClick={() => setStep(2)} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest cursor-pointer hover:underline">Re-Sync Node</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Protocol: NCA_ULTIMATE_v3.0 // Master Architect Mode</div>
      </div>
    </div>
  );
}
