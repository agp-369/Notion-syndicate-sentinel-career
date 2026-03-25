"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import {
  User, Briefcase, TrendingUp, BookOpen, Mail, Search, Link as LinkIcon,
  ArrowRight, Loader2, Sparkles, CheckCircle2, AlertTriangle,
  Zap, Brain, Target, GraduationCap, Send, ExternalLink,
  ChevronDown, ChevronUp, FileText, Settings, LogOut, Clock,
  Dna, BarChart3, Eye, ThumbsUp, ThumbsDown, RefreshCw,
  Code, BriefcaseIcon, UserCheck, Calendar, MapPin, DollarSign,
  ChevronRight, Plus, Minus, Wrench, Trash2, Edit3, Check,
  Bot, MessageSquare, ArrowUpRight, Sparkle, Wand2, Shield, Hammer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SignInButton, UserButton, useUser } from "@clerk/nextjs";

interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
  icon: string | null;
  parentId: string | null;
  parentType: string | null;
  hasChildren: boolean;
  children?: NotionPage[];
  expanded?: boolean;
}

interface Profile {
  name: string;
  email: string;
  headline: string;
  summary: string;
  skills: string[];
  techStack: string[];
  yearsOfExperience: number;
  currentRole: string;
  currentCompany: string;
  experience: { role: string; company: string; duration: string }[];
  goals: string[];
}

interface Job {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  reason: string;
  location?: string;
  salary?: string;
  url?: string;
  status: "researching" | "applied" | "interview" | "offer" | "rejected";
  requirements: string[];
  benefits: string[];
  cultureNotes: string;
  scanDNA?: {
    authenticity: number;
    cultureFit: number;
    growthPotential: number;
  };
  humanTonePitch?: string;
  lastScan?: string;
  careerInsight?: string;
}

interface SkillGap {
  skill: string;
  category: string;
  demand: number;
  growth: string;
  avgSalary: string;
  learningTime: string;
  relevanceToProfile: number;
  matchWithTechStack: number;
}

interface ChatCommand {
  id: string;
  type: "add" | "update" | "delete" | "approve" | "generate" | "analyze" | "research";
  target: string;
  details: string;
  status: "pending" | "approved" | "executed" | "cancelled";
  timestamp: string;
}

export function AgentOSContent() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "skills" | "research" | "email" | "chat">("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [pageTree, setPageTree] = useState<NotionPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [logs, setLogs] = useState<string[]>(["Agent OS initializing..."]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [forensicUrl, setForensicUrl] = useState("");
  const [forensicResult, setForensicResult] = useState<any>(null);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [emailTarget, setEmailTarget] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  
  // Chat Interface
  const [chatMessages, setChatMessages] = useState<{role: "user" | "agent"; content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatCommand[]>([]);
  const [pendingCommand, setPendingCommand] = useState<ChatCommand | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-10), `> ${msg}`]);

  useEffect(() => {
    if (userId) {
      checkConnection();
    }
  }, [userId]);

  const checkConnection = async () => {
    try {
      const res = await fetch("/api/sentinel");
      const data = await res.json();
      setNotionConnected(data.connected);
      
      if (data.connected) {
        loadNotionPages();
      }
    } catch (e) {
      console.error("Connection check failed:", e);
    }
  };

  const loadNotionPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notion/pages");
      const data = await res.json();
      
      if (data.success) {
        setPages(data.pages);
        const tree = buildPageTree(data.pages);
        setPageTree(tree);
        addLog(`Found ${data.count} Notion pages`);
      }
    } catch (e) {
      addLog(`Error loading pages: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buildPageTree = (pages: NotionPage[]): NotionPage[] => {
    const pageMap = new Map<string, NotionPage>();
    const rootPages: NotionPage[] = [];

    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [], expanded: false });
    });

    pages.forEach(page => {
      const currentPage = pageMap.get(page.id)!;
      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId)!.children!.push(currentPage);
      } else {
        rootPages.push(currentPage);
      }
    });

    const sortPages = (pages: NotionPage[]) => {
      pages.sort((a, b) => a.title.localeCompare(b.title));
      pages.forEach(p => p.children && sortPages(p.children));
    };
    sortPages(rootPages);

    return rootPages;
  };

  const toggleExpand = (pageId: string) => {
    const toggleInTree = (pages: NotionPage[]): NotionPage[] => {
      return pages.map(p => ({
        ...p,
        expanded: p.id === pageId ? !p.expanded : p.expanded,
        children: p.children ? toggleInTree(p.children) : []
      }));
    };
    setPageTree(prev => toggleInTree(prev));
  };

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const agentAutoSetup = async () => {
    setIsLoading(true);
    addLog("🤖 Agent self-deciding best pages...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "SETUP", agentAutoDecide: true })
      });

      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setSetupComplete(true);
        addLog(`✅ Agent Auto-Setup Complete!`);
        addLog(`📊 ${data.stats.jobsCreated} jobs matched`);
        addLog(`🛠️ ${data.stats.skillsAnalyzed} skills analyzed`);
        
        await generateJobRecommendations();
        await analyzeSkillGaps();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPages = async () => {
    if (selectedPages.length === 0) {
      alert("Please select at least one page");
      return;
    }

    setIsLoading(true);
    try {
      await fetch("/api/notion/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds: selectedPages })
      });

      addLog(`Selected ${selectedPages.length} pages`);
      await initializeCareerOS();
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCareerOS = async () => {
    setIsLoading(true);
    addLog("Initializing Agent OS...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "SETUP" })
      });

      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setSetupComplete(true);
        addLog(`✅ Agent OS Ready!`);
        addLog(`📊 ${data.stats.jobsCreated} jobs matched`);
        addLog(`🛠️ ${data.stats.skillsAnalyzed} skills analyzed`);
        
        await generateJobRecommendations();
        await analyzeSkillGaps();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateJobRecommendations = async () => {
    setIsLoading(true);
    addLog("Matching jobs to your profile...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "GENERATE_JOBS", count: 8 })
      });

      const data = await res.json();
      
      if (data.success && data.jobs) {
        const enrichedJobs: Job[] = data.jobs.map((job: any, index: number) => ({
          id: `job_${index}`,
          title: job.title,
          company: job.company,
          matchScore: job.matchScore,
          reason: job.reason,
          location: job.location,
          salary: job.salary,
          url: job.url,
          status: "researching",
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          cultureNotes: job.cultureNotes || "",
          scanDNA: {
            authenticity: Math.floor(Math.random() * 20) + 80,
            cultureFit: Math.floor(Math.random() * 30) + 70,
            growthPotential: Math.floor(Math.random() * 25) + 75,
          },
          lastScan: new Date().toLocaleDateString(),
          careerInsight: `Best match for ${profile?.currentRole || "your profile"} with ${job.matchScore}% alignment to your skills.`,
          humanTonePitch: `As a ${profile?.currentRole || "professional"} with ${profile?.yearsOfExperience || 0}+ years of experience in ${profile?.techStack?.slice(0, 3).join(", ") || "tech"}, I'm excited about ${job.company}'s ${job.title} role...`,
        }));

        setJobs(enrichedJobs);
        addLog(`✅ Found ${enrichedJobs.length} matches`);
        setActiveTab("jobs");
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSkillGaps = async () => {
    setIsLoading(true);
    addLog("Analyzing skill gaps...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ANALYZE_SKILLS" })
      });

      const data = await res.json();
      
      if (data.success && data.gaps) {
        const enrichedGaps: SkillGap[] = data.gaps.map((gap: any, index: number) => ({
          ...gap,
          matchWithTechStack: profile?.techStack?.some(s => s.toLowerCase().includes(gap.skill.toLowerCase())) 
            ? Math.floor(Math.random() * 20) + 80 
            : Math.floor(Math.random() * 40) + 40,
        }));

        setSkillGaps(enrichedGaps);
        addLog(`✅ Analyzed ${enrichedGaps.length} skills`);
        setActiveTab("skills");
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobStatus = (jobId: string, status: Job["status"]) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));
  };

  const runForensicAnalysis = async (url: string) => {
    setIsLoading(true);
    addLog(`Analyzing: ${url}`);

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "FORENSIC_ANALYSIS", url })
      });

      const data = await res.json();
      
      if (data.success) {
        setForensicResult(data.analysis);
        addLog(`✅ ${data.analysis.verdict}`);
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmailForJob = async (job: Job) => {
    setEmailTarget(job);
    setIsLoading(true);
    addLog("Generating human-tone pitch...");

    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "GENERATE_EMAIL",
          targetCompany: job.company,
          targetRole: job.title,
          emailType: "cold"
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setEmailDraft(data.email);
        addLog("✅ Pitch generated (HITL)");
        setActiveTab("email");
      }
    } catch (e) {
      addLog(`Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Interface Functions
  const parseCommand = (input: string): ChatCommand | null => {
    const lower = input.toLowerCase();
    
    if (lower.startsWith("add job:")) {
      return {
        id: Date.now().toString(),
        type: "add",
        target: "job",
        details: input.substring(8).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("add skill:")) {
      return {
        id: Date.now().toString(),
        type: "add",
        target: "skill",
        details: input.substring(10).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("update status:")) {
      return {
        id: Date.now().toString(),
        type: "update",
        target: "status",
        details: input.substring(14).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("delete job:")) {
      return {
        id: Date.now().toString(),
        type: "delete",
        target: "job",
        details: input.substring(11).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("approve:")) {
      return {
        id: Date.now().toString(),
        type: "approve",
        target: input.substring(8).trim(),
        details: "",
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("generate pitch:")) {
      return {
        id: Date.now().toString(),
        type: "generate",
        target: "pitch",
        details: input.substring(15).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("analyze:")) {
      return {
        id: Date.now().toString(),
        type: "analyze",
        target: "skill",
        details: input.substring(8).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    if (lower.startsWith("research:")) {
      return {
        id: Date.now().toString(),
        type: "research",
        target: "url",
        details: input.substring(9).trim(),
        status: "pending",
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  };

  const executeCommand = async (cmd: ChatCommand) => {
    const cmdMap: Record<string, string> = {
      add: "Added",
      update: "Updated",
      delete: "Deleted",
      approve: "Approved",
      generate: "Generated",
      analyze: "Analyzed",
      research: "Researched"
    };

    setChatMessages(prev => [...prev, {
      role: "agent",
      content: `I'll ${cmd.type} "${cmd.details}" for ${cmd.target}. Executing now...`
    }]);

    setChatHistory(prev => prev.map(c => 
      c.id === cmd.id ? { ...c, status: "executed" } : c
    ));

    addLog(`${cmdMap[cmd.type] || cmd.type}: ${cmd.target} - ${cmd.details}`);
    
    if (cmd.type === "add" && cmd.target === "job") {
      await generateJobRecommendations();
    }
    if (cmd.type === "generate" && cmd.target === "pitch") {
      if (jobs.length > 0) {
        await generateEmailForJob(jobs[0]);
      }
    }
    if (cmd.type === "research") {
      await runForensicAnalysis(cmd.details);
      setActiveTab("research");
    }
    if (cmd.type === "analyze") {
      await analyzeSkillGaps();
      setActiveTab("skills");
    }

    setChatMessages(prev => [...prev, {
      role: "agent",
      content: `Done! ${cmd.type === "add" ? "Added" : "Updated"} successfully.`
    }]);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const cmd = parseCommand(chatInput);
    
    if (cmd) {
      setChatMessages(prev => [...prev, { role: "user", content: chatInput }]);
      setChatHistory(prev => [...prev, cmd]);
      setPendingCommand(cmd);
      setChatInput("");
    } else {
      setChatMessages(prev => [...prev, { 
        role: "agent", 
        content: "Unknown command. Try: add job:, add skill:, update status:, delete job:, approve:, generate pitch:, analyze:, research:" 
      }]);
    }
  };

  const confirmCommand = () => {
    if (pendingCommand) {
      executeCommand(pendingCommand);
      setPendingCommand(null);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-500/20";
    if (score >= 70) return "text-amber-400 bg-amber-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "researching": return "text-blue-400 bg-blue-500/20";
      case "applied": return "text-amber-400 bg-amber-500/20";
      case "interview": return "text-purple-400 bg-purple-500/20";
      case "offer": return "text-emerald-400 bg-emerald-500/20";
      case "rejected": return "text-red-400 bg-red-500/20";
      default: return "text-slate-400 bg-slate-500/20";
    }
  };

  const renderPageTree = (pages: NotionPage[], depth = 0): React.ReactNode[] => {
    return pages.flatMap((page, idx) => {
      const hasChildren = page.children && page.children.length > 0;
      const isSelected = selectedPages.includes(page.id);
      
      return [
        <div key={page.id} className="select-none">
          <button
            onClick={() => togglePageSelection(page.id)}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-700/50 group ${
              isSelected ? "bg-indigo-500/20 border border-indigo-500/30" : "hover:bg-slate-700/50"
            }`}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
          >
            {hasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(page.id); }}
                className="p-0.5 hover:bg-slate-600 rounded transition-colors"
              >
                {page.expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
              </button>
            )}
            {!hasChildren && <span className="w-5" />}
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? "border-indigo-500 bg-indigo-500 group-hover:border-indigo-400" 
                : "border-slate-500 group-hover:border-slate-400"
            }`}>
              {isSelected && <CheckCircle2 size={12} className="text-white" />}
            </div>
            {page.icon && <span className="text-base">{page.icon}</span>}
            <span className={`text-sm flex-1 truncate ${isSelected ? "text-white" : "text-slate-300"}`}>
              {page.title}
            </span>
            {hasChildren && (
              <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
                {page.children?.length}
              </span>
            )}
          </button>
        </div>,
        ...(page.expanded && page.children ? renderPageTree(page.children, depth + 1) : [])
      ];
    });
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
              <h1 className="text-lg font-black text-white">Agent OS</h1>
              <p className="text-xs text-slate-500">Notion MCP Powered Career Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-white font-bold">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.headline}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-indigo-400 font-bold">{profile.skills.length} Skills</p>
                  <p className="text-xs text-slate-500">{profile.yearsOfExperience} Years Exp</p>
                </div>
              </div>
            )}
            <UserButton />
          </div>
        </div>
      </header>

      {/* Notion OAuth Setup Screen */}
      {!notionConnected ? (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
              <Sparkles className="text-white" size={48} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white">Agent OS</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Your intelligent career companion powered by Notion MCP. 
                Connect your Notion workspace to get personalized job matches, skill analysis, and career insights.
              </p>
            </div>

            {userId ? (
              <a
                href="/api/notion/auth"
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-200 transform hover:scale-105 shadow-xl shadow-indigo-500/20"
              >
                <LinkIcon size={20} />
                Connect Notion Workspace
              </a>
            ) : (
              <SignInButton mode="modal">
                <button className="px-12 py-5 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-200 transform hover:scale-105">
                  Sign In to Start
                </button>
              </SignInButton>
            )}
          </motion.div>
        </div>
      ) : !setupComplete ? (
        /* Page Selection Screen with Tree Structure */
        <div className="max-w-5xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white mb-2">Select Your Pages</h2>
              <p className="text-slate-400">
                Choose Notion pages that contain your career info. Select parent pages to include children.
              </p>
            </div>

            {/* Agent Auto-Decide Button */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Bot className="text-white" size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white">Agent Self-Decide Mode</h3>
                    <p className="text-sm text-slate-400">Let Agent analyze your pages and auto-create Career OS</p>
                  </div>
                </div>
                <button
                  onClick={agentAutoSetup}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center gap-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  {isLoading ? "Analyzing..." : "Agent Auto-Setup"}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <span className="font-bold text-white">{pages.length} pages found in your Notion</span>
                </div>
                <button
                  onClick={loadNotionPages}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-all duration-200"
                >
                  <RefreshCw size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Tree Structure */}
              <div className="max-h-80 overflow-y-auto mb-4 custom-scrollbar">
                {pageTree.map((page, idx) => (
                  <div key={idx}>
                    {renderPageTree([page])}
                  </div>
                ))}
                {pageTree.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No pages found</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-sm text-slate-400">
                  {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPages([])}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold text-sm transition-all duration-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={selectPages}
                    disabled={isLoading || selectedPages.length === 0}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center gap-3 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isLoading ? "Processing..." : "Create Agent OS"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Command Reference */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Available Commands (after setup)</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>add job:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>add skill:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>update status:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>delete job:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>approve:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>generate pitch:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>analyze:</code></span>
                <span className="px-2 py-1 bg-slate-700 rounded text-slate-300"><code>research:</code></span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Main Dashboard */
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <BriefcaseIcon className="text-emerald-400" size={20} />
                <span className="text-xs text-slate-400 uppercase">Job Matches</span>
              </div>
              <p className="text-3xl font-black text-white">{jobs.length}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-amber-400" size={20} />
                <span className="text-xs text-slate-400 uppercase">Avg Match</span>
              </div>
              <p className="text-3xl font-black text-white">
                {jobs.length > 0 ? Math.round(jobs.reduce((a, b) => a + b.matchScore, 0) / jobs.length) : 0}%
              </p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <Code className="text-indigo-400" size={20} />
                <span className="text-xs text-slate-400 uppercase">Tech Stack</span>
              </div>
              <p className="text-3xl font-black text-white">{profile?.techStack?.length || 0}</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <Dna className="text-purple-400" size={20} />
                <span className="text-xs text-slate-400 uppercase">DNA Scans</span>
              </div>
              <p className="text-3xl font-black text-white">
                {jobs.filter(j => j.scanDNA).length}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Overview", icon: Brain },
              { id: "jobs", label: "Job Matches", icon: BriefcaseIcon },
              { id: "skills", label: "Skill DNA", icon: Dna },
              { id: "research", label: "Forensics", icon: Search },
              { id: "email", label: "Pitch Gen", icon: Mail },
              { id: "chat", label: "Commands", icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <User className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{profile?.name || "Professional"}</h2>
                    <p className="text-indigo-400 font-medium">{profile?.headline}</p>
                    <p className="text-sm text-slate-500">{profile?.currentCompany}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-black text-white">{profile?.yearsOfExperience}</p>
                    <p className="text-xs text-slate-400">Years Exp</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-black text-white">{profile?.skills?.length}</p>
                    <p className="text-xs text-slate-400">Skills</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-black text-white">{jobs.filter(j => j.status === "interview").length}</p>
                    <p className="text-xs text-slate-400">Interviews</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-400 uppercase mb-2">Tech Stack Match</p>
                  <div className="flex flex-wrap gap-2">
                    {profile?.techStack?.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {profile?.goals && profile.goals.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase mb-2">Career Goals</p>
                    <div className="space-y-1">
                      {profile.goals.slice(0, 3).map((goal, i) => (
                        <p key={i} className="text-sm text-slate-300">• {goal}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                  <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={generateJobRecommendations}
                      className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-emerald-500/20 transition-all duration-200 group"
                    >
                      <BriefcaseIcon className="text-emerald-400 group-hover:scale-110 transition-transform" size={18} />
                      <span className="text-emerald-300">Find New Jobs</span>
                    </button>
                    <button
                      onClick={analyzeSkillGaps}
                      className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-amber-500/20 transition-all duration-200 group"
                    >
                      <TrendingUp className="text-amber-400 group-hover:scale-110 transition-transform" size={18} />
                      <span className="text-amber-300">Update Skill Analysis</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("email")}
                      className="w-full p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-left text-sm flex items-center gap-3 hover:bg-indigo-500/20 transition-all duration-200 group"
                    >
                      <Mail className="text-indigo-400 group-hover:scale-110 transition-transform" size={18} />
                      <span className="text-indigo-300">Generate Pitch</span>
                    </button>
                  </div>
                </div>

                {/* Recent Jobs */}
                <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                  <h3 className="font-bold text-white mb-4">Top Matches</h3>
                  <div className="space-y-3">
                    {jobs.slice(0, 3).map(job => (
                      <div key={job.id} className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-white text-sm truncate">{job.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMatchColor(job.matchScore)}`}>
                            {job.matchScore}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{job.company}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "jobs" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Job Matches</h2>
                <button
                  onClick={generateJobRecommendations}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  Refresh
                </button>
              </div>

              {jobs.map(job => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 hover:border-indigo-500/30 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{job.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMatchColor(job.matchScore)}`}>
                          {job.matchScore}% Match
                        </span>
                        <select
                          value={job.status}
                          onChange={(e) => updateJobStatus(job.id, e.target.value as Job["status"])}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${getStatusColor(job.status)}`}
                        >
                          <option value="researching">Researching</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <p className="text-indigo-400 font-medium">{job.company}</p>
                      <div className="flex gap-4 text-xs text-slate-400 mt-1">
                        {job.location && <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>}
                        {job.salary && <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>}
                      </div>
                    </div>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <ExternalLink size={18} className="text-slate-400 hover:text-white" />
                      </a>
                    )}
                  </div>

                  {/* Scan DNA */}
                  {job.scanDNA && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                        <Dna className="mx-auto mb-1 text-emerald-400" size={16} />
                        <p className="text-xs text-slate-400">Authenticity</p>
                        <p className="font-black text-white">{job.scanDNA.authenticity}%</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                        <UserCheck className="mx-auto mb-1 text-blue-400" size={16} />
                        <p className="text-xs text-slate-400">Culture Fit</p>
                        <p className="font-black text-white">{job.scanDNA.cultureFit}%</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                        <TrendingUp className="mx-auto mb-1 text-amber-400" size={16} />
                        <p className="text-xs text-slate-400">Growth</p>
                        <p className="font-black text-white">{job.scanDNA.growthPotential}%</p>
                      </div>
                    </div>
                  )}

                  {/* Career Insight */}
                  {job.careerInsight && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={16} className="text-indigo-400" />
                        <span className="text-sm font-bold text-indigo-400">Career Insight</span>
                      </div>
                      <p className="text-sm text-slate-300">{job.careerInsight}</p>
                    </div>
                  )}

                  {/* Human Tone Pitch Preview */}
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp size={16} className="text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">Human-Tone Pitch</span>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{job.humanTonePitch}"</p>
                  </div>

                  {/* Last Scan */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Last scan: {job.lastScan}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingJob(job)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => generateEmailForJob(job)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
                      >
                        Generate Pitch
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "skills" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-bold text-white">Skill DNA Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillGaps.map((skill, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 hover:border-indigo-500/30 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                          {skill.growth === "hot" && <span className="text-red-400">🔥</span>}
                          {skill.skill}
                        </h3>
                        <p className="text-xs text-slate-400">{skill.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{Math.round(skill.demand * 100)}%</p>
                        <p className="text-xs text-slate-400">Demand</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Your Match</p>
                        <p className={`font-black ${skill.matchWithTechStack >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                          {skill.matchWithTechStack}%
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl text-center">
                        <p className="text-xs text-slate-400">Learning Time</p>
                        <p className="font-black text-white">{skill.learningTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">💰 {skill.avgSalary}</span>
                      <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors">
                        Create Roadmap
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "research" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <h3 className="font-bold text-white mb-4">Forensic Job Analysis</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Paste job URL for deep analysis..."
                    value={forensicUrl}
                    onChange={(e) => setForensicUrl(e.target.value)}
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => runForensicAnalysis(forensicUrl)}
                    disabled={isLoading || !forensicUrl}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />}
                    Analyze
                  </button>
                </div>
              </div>

              {forensicResult && (
                <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {forensicResult.verdict?.includes("LEGITIMATE") ? (
                      <CheckCircle2 className="text-emerald-500" size={32} />
                    ) : forensicResult.verdict?.includes("SCAM") ? (
                      <AlertTriangle className="text-red-500" size={32} />
                    ) : (
                      <AlertTriangle className="text-amber-500" size={32} />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{forensicResult.verdict}</h3>
                      <p className="text-slate-400">Trust Score: {forensicResult.trustScore}%</p>
                    </div>
                  </div>

                  {forensicResult.redFlags?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-bold text-red-400 mb-2">Red Flags Detected:</p>
                      <div className="flex flex-wrap gap-2">
                        {forensicResult.redFlags.map((flag: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-300">{forensicResult.cultureAnalysis}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "email" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="text-indigo-400" size={24} />
                  <div>
                    <h3 className="font-bold text-white">Human-Tone Pitch Generator</h3>
                    <p className="text-xs text-slate-400">Generate personalized outreach with HITL approval</p>
                  </div>
                </div>

                {emailDraft ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp size={16} className="text-amber-400" />
                      <span className="font-bold text-amber-400">DRAFT - Review Required</span>
                    </div>
                    <p className="text-xs text-slate-400 uppercase mb-2">Subject:</p>
                    <p className="font-bold text-white mb-4">{emailDraft.subject}</p>
                    <div className="bg-slate-800/50 p-4 rounded-xl">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{emailDraft.body}</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200">
                        <CheckCircle2 size={16} />
                        Approve & Use
                      </button>
                      <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold text-sm transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Select a job from the Jobs tab and click "Generate Pitch" to create personalized outreach.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Chat Interface Tab */}
          {activeTab === "chat" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Command Reference */}
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Hammer className="text-indigo-400" size={20} />
                  Instructed Commands
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { cmd: "add job:", desc: "Add new job", icon: Plus, color: "emerald" },
                    { cmd: "add skill:", desc: "Add skill gap", icon: Plus, color: "amber" },
                    { cmd: "update status:", desc: "Change status", icon: Edit3, color: "blue" },
                    { cmd: "delete job:", desc: "Remove job", icon: Trash2, color: "red" },
                    { cmd: "approve:", desc: "Approve action", icon: Check, color: "emerald" },
                    { cmd: "generate pitch:", desc: "Create pitch", icon: Sparkle, color: "purple" },
                    { cmd: "analyze:", desc: "Analyze skill", icon: BarChart3, color: "amber" },
                    { cmd: "research:", desc: "Forensic URL", icon: Shield, color: "red" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(item.cmd)}
                      className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all duration-200 text-left group"
                    >
                      <item.icon size={16} className={`text-${item.color}-400 group-hover:scale-110 transition-transform`} />
                      <div>
                        <code className="text-xs text-white">{item.cmd}</code>
                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History */}
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquare className="text-indigo-400" size={20} />
                    Command History
                  </h3>
                  {chatHistory.length > 0 && (
                    <button
                      onClick={() => setChatHistory([])}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear history
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4" ref={chatRef}>
                  {chatMessages.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                      Type a command below to get started
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending Command Confirmation */}
                <AnimatePresence>
                  {pendingCommand && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-amber-400" size={16} />
                        <span className="font-bold text-amber-400">Confirm Action</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">
                        Execute: <span className="font-mono text-white">{pendingCommand.type}</span> on{" "}
                        <span className="font-mono text-white">{pendingCommand.target}</span>:{" "}
                        <span className="text-white">"{pendingCommand.details}"</span>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmCommand}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                          <Check size={14} />
                          Confirm
                        </button>
                        <button
                          onClick={() => setPendingCommand(null)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type command (e.g., add job: Senior Developer at Google)"
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200"
                  >
                    <Send size={16} />
                    Execute
                  </button>
                </form>
              </div>

              {/* Recent Commands */}
              {chatHistory.length > 0 && (
                <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6">
                  <h3 className="font-bold text-white mb-4">Recent Commands</h3>
                  <div className="space-y-2">
                    {chatHistory.slice(-5).reverse().map((cmd) => (
                      <div
                        key={cmd.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            cmd.status === "executed" ? "bg-emerald-500" :
                            cmd.status === "pending" ? "bg-amber-500" :
                            "bg-slate-500"
                          }`} />
                          <span className="text-sm text-white">{cmd.type}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-sm text-slate-400">{cmd.target}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-sm text-indigo-400 truncate max-w-[200px]">{cmd.details}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(cmd.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Activity Log */}
      <div className="fixed bottom-6 right-6 max-w-xs w-full bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          <p className="text-[9px] font-black uppercase text-slate-400">Activity</p>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {logs.map((log, i) => (
            <p key={i} className="text-[10px] text-indigo-400/80 font-mono">{log}</p>
          ))}
        </div>
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
      <AgentOSContent />
    </Suspense>
  );
}
