"use client";

import { useState, useEffect, Suspense } from "react";
import {
  User, Briefcase, TrendingUp, BookOpen, Mail, Search,
  ArrowRight, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  Zap, Brain, Target, GraduationCap, Send, ExternalLink,
  ChevronDown, ChevronUp, FileText, Settings, LogOut, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton, useUser } from "@clerk/nextjs";

interface Profile {
  name: string;
  email: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: { role: string; company: string; duration: string }[];
  goals: string[];
}

interface Job {
  title: string;
  company: string;
  matchScore: number;
  reason: string;
  location?: string;
  salary?: string;
}

interface SkillGap {
  skill: string;
  category: string;
  demand: number;
  growth: string;
  avgSalary: string;
  learningTime: string;
  relevanceToProfile: number;
}

interface ForensicResult {
  verdict: string;
  trustScore: number;
  redFlags: string[];
  verificationPoints: string[];
  cultureAnalysis: string;
  salaryAnalysis: string;
}

export function CareerOSContent() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "skills" | "research" | "email">("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [logs, setLogs] = useState<string[]>(["Career OS initializing..."]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [forensicUrl, setForensicUrl] = useState("");
  const [forensicResult, setForensicResult] = useState<ForensicResult | null>(null);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [emailCompany, setEmailCompany] = useState("");
  const [emailRole, setEmailRole] = useState("");

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-8), `> ${msg}`]);

  useEffect(() => {
    if (userId) {
      checkSetup();
    }
  }, [userId]);

  const checkSetup = async () => {
    try {
      const res = await fetch("/api/sentinel");
      const data = await res.json();
      if (data.connected) {
        setSetupComplete(true);
        loadProfile();
      }
    } catch (e) {
      console.error("Setup check failed:", e);
    }
  };

  const loadProfile = async () => {
    setIsLoading(true);
    addLog("Reading your Notion profile...");
    
    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "READ_PROFILE" })
      });
      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        addLog(`Profile loaded: ${data.profile.skills.length} skills found`);
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCareerOS = async () => {
    setIsLoading(true);
    addLog("Starting Career OS setup...");
    addLog("Discovering your Notion pages...");

    try {
      // Find a parent page
      const parentPageId = prompt("Enter a Notion page ID to create your Career OS (or leave empty to use first available page):");

      addLog("Reading your profile data...");
      
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SETUP",
          parentPageId: parentPageId || undefined
        })
      });

      const data = await res.json();
      
      if (data.success) {
        addLog(`✅ Career OS created!`);
        addLog(`📊 ${data.stats.jobsCreated} jobs matched`);
        addLog(`📈 ${data.stats.skillsAnalyzed} trending skills`);
        
        setProfile(data.profile);
        setSetupComplete(true);
        
        // Load the data
        await generateJobRecommendations();
        await analyzeSkillGaps();
      } else {
        addLog(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateJobRecommendations = async () => {
    setIsLoading(true);
    addLog("Analyzing your profile for job matches...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "GENERATE_JOBS", count: 8 })
      });

      const data = await res.json();
      
      if (data.success) {
        setJobs(data.jobs);
        addLog(`✅ Found ${data.jobs.length} matching jobs`);
        setActiveTab("jobs");
      }
    } catch (e) {
      addLog(`Error generating jobs: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSkillGaps = async () => {
    setIsLoading(true);
    addLog("Analyzing trending skills...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ANALYZE_SKILLS" })
      });

      const data = await res.json();
      
      if (data.success) {
        setSkillGaps(data.gaps);
        addLog(`✅ Analyzed ${data.gaps.length} skill gaps`);
        setActiveTab("skills");
      }
    } catch (e) {
      addLog(`Error analyzing skills: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runForensicAnalysis = async () => {
    if (!forensicUrl) return;
    
    setIsLoading(true);
    addLog(`Analyzing: ${forensicUrl}`);

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "FORENSIC_ANALYSIS",
          url: forensicUrl
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setForensicResult(data.analysis);
        addLog(`✅ Analysis complete: ${data.analysis.verdict}`);
        setActiveTab("research");
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmailPitch = async () => {
    if (!emailCompany || !emailRole) return;
    
    setIsLoading(true);
    addLog("Generating personalized pitch...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "GENERATE_EMAIL",
          targetCompany: emailCompany,
          targetRole: emailRole,
          emailType: "cold"
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setEmailDraft(data.email);
        addLog("✅ Email draft generated (HITL)");
        setActiveTab("email");
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-300">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Career OS</h1>
              <p className="text-xs text-slate-500">Powered by Notion MCP</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{user.firstName}</p>
                <p className="text-xs text-slate-500">{profile?.headline || "Career Professional"}</p>
              </div>
            )}
            <UserButton />
          </div>
        </div>
      </header>

      {!setupComplete ? (
        /* Setup Screen */
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
              <Sparkles className="text-white" size={48} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white">Career OS</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Your personal career intelligence system. We read your resume from Notion,
                create a complete career infrastructure, match you with jobs, analyze skill gaps,
                and help you grow - all powered by AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <User className="text-indigo-400 mb-4" size={32} />
                <h3 className="font-bold text-white mb-2">Read Your Profile</h3>
                <p className="text-sm text-slate-400">We read your resume, skills, and goals from your Notion workspace</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <Target className="text-emerald-400 mb-4" size={32} />
                <h3 className="font-bold text-white mb-2">Match Jobs</h3>
                <p className="text-sm text-slate-400">AI matches you with jobs based on YOUR profile, not random scraping</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                <TrendingUp className="text-amber-400 mb-4" size={32} />
                <h3 className="font-bold text-white mb-2">Grow Skills</h3>
                <p className="text-sm text-slate-400">Discover trending skills and get personalized learning roadmaps</p>
              </div>
            </div>

            {userId ? (
              <button
                onClick={initializeCareerOS}
                disabled={isLoading}
                className="mt-8 px-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-4 mx-auto hover:bg-indigo-50 disabled:opacity-50 transition-all shadow-xl"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                {isLoading ? "Setting up..." : "Initialize Career OS"}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="mt-8 px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-4 mx-auto hover:bg-indigo-500 transition-all shadow-xl">
                  Sign In to Start
                </button>
              </SignInButton>
            )}
          </motion.div>
        </div>
      ) : (
        /* Dashboard */
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Overview", icon: Brain },
              { id: "jobs", label: "Job Matches", icon: Briefcase },
              { id: "skills", label: "Skill Gaps", icon: TrendingUp },
              { id: "research", label: "Forensic Research", icon: Search },
              { id: "email", label: "Email Pitch", icon: Mail },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-900/50 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {profile && (
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5">
                      <div className="flex items-start gap-6 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                          <User className="text-white" size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">{profile.name || "Professional"}</h2>
                          <p className="text-indigo-400 font-medium">{profile.headline}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                          <p className="text-3xl font-black text-white">{profile.skills.length}</p>
                          <p className="text-xs text-slate-400 uppercase">Skills</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                          <p className="text-3xl font-black text-white">{profile.experience.length}</p>
                          <p className="text-xs text-slate-400 uppercase">Experience</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                          <p className="text-3xl font-black text-white">{jobs.length || 0}</p>
                          <p className="text-xs text-slate-400 uppercase">Job Matches</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 10).map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={generateJobRecommendations}
                      disabled={isLoading}
                      className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all text-left"
                    >
                      <Briefcase className="text-emerald-400 mb-3" size={28} />
                      <h3 className="font-bold text-white mb-1">Find Jobs</h3>
                      <p className="text-xs text-slate-400">AI-matched jobs based on your profile</p>
                    </button>
                    <button
                      onClick={analyzeSkillGaps}
                      disabled={isLoading}
                      className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all text-left"
                    >
                      <TrendingUp className="text-amber-400 mb-3" size={28} />
                      <h3 className="font-bold text-white mb-1">Skill Analysis</h3>
                      <p className="text-xs text-slate-400">Trending skills you should learn</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Jobs Tab */}
              {activeTab === "jobs" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">AI-Matched Jobs</h2>
                    <button
                      onClick={generateJobRecommendations}
                      disabled={isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Refresh
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="bg-slate-900/50 p-12 rounded-2xl border border-white/5 text-center">
                      <Briefcase className="mx-auto text-slate-600 mb-4" size={48} />
                      <p className="text-slate-400">No jobs found yet. Click refresh to generate matches.</p>
                    </div>
                  ) : (
                    jobs.map((job, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-slate-900/50 p-6 rounded-2xl border border-white/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-white">{job.title}</h3>
                            <p className="text-indigo-400 text-sm">{job.company}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            job.matchScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                            job.matchScore >= 60 ? "bg-amber-500/20 text-amber-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>
                            {job.matchScore}% Match
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{job.reason}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          {job.location && <span>📍 {job.location}</span>}
                          {job.salary && <span>💰 {job.salary}</span>}
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {/* Skills Tab */}
              {activeTab === "skills" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Trending Skills Analysis</h2>
                  
                  {skillGaps.length === 0 ? (
                    <div className="bg-slate-900/50 p-12 rounded-2xl border border-white/5 text-center">
                      <TrendingUp className="mx-auto text-slate-600 mb-4" size={48} />
                      <p className="text-slate-400">Click analyze to find trending skills</p>
                    </div>
                  ) : (
                    skillGaps.map((skill, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-slate-900/50 p-6 rounded-2xl border border-white/5"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                              {skill.growth === "hot" && <span className="text-red-400 text-sm">🔥</span>}
                              {skill.skill}
                            </h3>
                            <p className="text-xs text-slate-500">{skill.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-white">{Math.round(skill.demand * 100)}%</p>
                            <p className="text-xs text-slate-500">Demand</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-slate-400">💰 {skill.avgSalary}</span>
                          <span className="text-slate-400">⏱️ {skill.learningTime}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button className="px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-bold">
                            Generate Roadmap
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}

              {/* Forensic Research Tab */}
              {activeTab === "research" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h3 className="font-bold text-white mb-4">Forensic Job Analysis</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Paste any job URL for deep analysis with scam detection and legitimacy verification.
                    </p>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Paste job URL..."
                        value={forensicUrl}
                        onChange={(e) => setForensicUrl(e.target.value)}
                        className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm"
                      />
                      <button
                        onClick={runForensicAnalysis}
                        disabled={isLoading || !forensicUrl}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                        Analyze
                      </button>
                    </div>
                  </div>

                  {forensicResult && (
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        {forensicResult.verdict.includes("LEGITIMATE") ? (
                          <CheckCircle2 className="text-emerald-500" size={28} />
                        ) : forensicResult.verdict.includes("SCAM") ? (
                          <AlertTriangle className="text-red-500" size={28} />
                        ) : (
                          <AlertTriangle className="text-amber-500" size={28} />
                        )}
                        <div>
                          <h3 className="font-bold text-white">{forensicResult.verdict}</h3>
                          <p className="text-sm text-slate-400">Trust Score: {forensicResult.trustScore}%</p>
                        </div>
                      </div>
                      
                      {forensicResult.redFlags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-bold text-red-400 mb-2">Red Flags:</p>
                          <div className="flex flex-wrap gap-2">
                            {forensicResult.redFlags.map((flag, i) => (
                              <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-400">{forensicResult.cultureAnalysis}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Email Tab */}
              {activeTab === "email" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="text-indigo-400" size={24} />
                      <div>
                        <h3 className="font-bold text-white">HITL Email Generator</h3>
                        <p className="text-xs text-slate-400">Generate personalized outreach with human approval</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Target Company"
                        value={emailCompany}
                        onChange={(e) => setEmailCompany(e.target.value)}
                        className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Target Role"
                        value={emailRole}
                        onChange={(e) => setEmailRole(e.target.value)}
                        className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                    
                    <button
                      onClick={generateEmailPitch}
                      disabled={isLoading || !emailCompany || !emailRole}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate Email Draft
                    </button>
                  </div>

                  {emailDraft && (
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-bold">
                          DRAFT - Review Required
                        </span>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 size={14} />
                          Approve & Use
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 uppercase mb-2">Subject:</p>
                      <p className="font-bold text-white mb-4">{emailDraft.subject}</p>
                      <div className="bg-slate-800/50 p-4 rounded-xl">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{emailDraft.body}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Logs */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="text-emerald-500" size={14} />
                  Activity Log
                </h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {logs.map((log, i) => (
                    <p key={i} className="text-xs text-indigo-400/80 font-mono">{log}</p>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold text-slate-400 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("jobs")}
                    className="w-full p-3 bg-slate-800/50 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-slate-800"
                  >
                    <Briefcase size={16} className="text-emerald-400" />
                    Browse Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className="w-full p-3 bg-slate-800/50 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-slate-800"
                  >
                    <TrendingUp size={16} className="text-amber-400" />
                    View Skills
                  </button>
                  <button
                    onClick={() => setActiveTab("email")}
                    className="w-full p-3 bg-slate-800/50 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-slate-800"
                  >
                    <Mail size={16} className="text-indigo-400" />
                    Write Email
                  </button>
                </div>
              </div>

              {/* Notion Link */}
              <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <ExternalLink className="text-indigo-400" size={18} />
                  <span className="font-bold text-white text-sm">Notion Workspace</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Your Career OS is synced to your Notion workspace with all databases and dashboards.
                </p>
                <button className="w-full px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-sm font-bold">
                  Open in Notion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Monitor */}
      <div className="fixed bottom-6 right-6 max-w-xs w-full bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          <p className="text-[9px] font-black uppercase text-slate-400">System</p>
        </div>
        <p className="text-[9px] text-indigo-400/80 font-mono truncate">
          {logs[logs.length - 1] || "Ready"}
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    }>
      <CareerOSContent />
    </Suspense>
  );
}
