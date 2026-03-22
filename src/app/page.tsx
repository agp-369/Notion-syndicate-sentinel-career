"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ArrowRight, Compass, GraduationCap, Briefcase, Loader2, MessageSquareHeart, BrainCircuit, ShieldAlert, Edit3, Send, DatabaseZap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [step, setStep] = useState(1);
  const [notionToken, setNotionToken] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [memoryId, setMemoryId] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // HITL State
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [editedPitch, setEditedPitch] = useState("");

  const nextStep = () => setStep(prev => prev + 1);

  // STAGE 1: AI FORENSICS & PREVIEW (Read/Search Notion)
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          notionToken: notionToken.trim(), 
          pageId: databaseId.trim().replace(/-/g, ""), 
          userProfileId: profileId.trim().replace(/-/g, ""),
          memoryPageId: memoryId.trim().replace(/-/g, ""),
          mode: "PREVIEW" // Tells backend NOT to write to Notion yet
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data.intel);
        setEditedPitch(data.intel.cloned_pitch);
        nextStep();
      } else {
        alert("Node Connection Failed: " + data.error);
      }
    } catch (e) {
      alert("Handshake error.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // STAGE 2: HUMAN APPROVAL & SYNDICATION (Write to Notion)
  const approveAndSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          notionToken: notionToken.trim(), 
          pageId: databaseId.trim().replace(/-/g, ""), 
          targetPageId: analysisData.targetPageId,
          finalIntel: { ...analysisData, cloned_pitch: editedPitch },
          mode: "COMMIT" // Final Write
        })
      });
      if (res.ok) nextStep();
    } catch (e) {
      alert("Syndication Failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      
      <div className="max-w-3xl w-full space-y-12 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl text-white">
            <DatabaseZap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase tracking-widest">Syndicate Sentinel</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Human-in-the-Loop Career Intelligence</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-10 rounded-[2.5rem] shadow-3xl relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CONFIGURATION */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-white">1. Initialize Workspace Manifolds</h2>
                  <p className="text-slate-500 text-xs">Connect your private Notion nodes to the Sentinel brain.</p>
                </div>
                <div className="space-y-4">
                  <input type="password" value={notionToken} onChange={e => setNotionToken(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-700" placeholder="Notion Secret..." />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="text" value={databaseId} onChange={e => setDatabaseId(e.target.value)} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all text-white" placeholder="Ledger ID" />
                    <input type="text" value={profileId} onChange={e => setProfileId(e.target.value)} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all text-white" placeholder="Profile ID" />
                    <input type="text" value={memoryId} onChange={e => setMemoryId(e.target.value)} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all text-white" placeholder="Memory ID" />
                  </div>
                </div>
                <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full py-4 bg-white text-black rounded-xl flex items-center justify-center gap-3 transition-all font-bold cursor-pointer active:scale-95">
                  {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Scan Notion for Leads</>}
                </button>
              </motion.div>
            )}

            {/* STEP 2: HUMAN-IN-THE-LOOP REVIEW */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Strategic Review</h2>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Awaiting Human Approval</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${analysisData.verdict.includes("Verified") ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {analysisData.verdict}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400"><Compass size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">AI Insight</span></div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">"{analysisData.mentor_insight}"</p>
                  </div>
                  <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400"><ShieldAlert size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Resume Strategy</span></div>
                    <p className="text-xs text-slate-300 leading-relaxed">{analysisData.resume_strategy}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500 ml-1"><Edit3 size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Cloned Pitch Draft (Edit to guide AI)</span></div>
                  <textarea value={editedPitch} onChange={e => setEditedPitch(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 p-5 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all text-white min-h-[120px] leading-relaxed" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer">Discard</button>
                  <button onClick={approveAndSync} disabled={isSyncing} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-3 transition-all font-bold shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer">
                    {isSyncing ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Approve & Syndicate to Notion</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SYNC COMPLETE */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]"><CheckCircle2 size={40} /></div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tighter tracking-widest">Syndication Complete</h2>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto italic leading-relaxed">"The human-guided intelligence has been successfully injected into the Notion Career Brain."</p>
                </div>
                <div className="p-6 bg-slate-800/20 border border-slate-800 rounded-2xl w-full flex items-start gap-4 text-left">
                  <DatabaseZap className="text-indigo-400 shrink-0 mt-1" size={24} />
                  <div>
                    <p className="text-xs text-white font-bold uppercase tracking-widest">Orchestration Successful</p>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Your approved strategies and pitch are now live in your Notion Ledger.</p>
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-[0.3em] cursor-pointer hover:underline">Scan for next lead</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center text-[10px] text-slate-700 font-bold uppercase tracking-[0.6em]">Protocol: HITL_SENTINEL_v4.0 // Sovereign Command</div>
      </div>
    </div>
  );
}
