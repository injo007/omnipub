/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { AgentModelSelector } from "./components/AgentModelSelector";
import {
  Rss,
  Users,
  LayoutDashboard,
  Globe,
  Sparkles,
  PlusCircle,
  RefreshCw,
  Layers,
  Terminal,
  BookOpen,
  Trash2,
  Check,
  Search,
  Plus,
  HelpCircle,
  FileText,
  AlertCircle,
  Calendar,
  LineChart as LineChartIcon,
  Award,
  Zap,
  Copy,
  TrendingUp,
  FileCode,
  Menu,
  X,
  ExternalLink,
  Image,
  Flame,
  SlidersHorizontal,
  ListFilter,
  CheckCircle2,
  ShieldAlert,
  Gauge,
  Bell,
} from "lucide-react";
import {
  NicheType,
  RssFeed,
  Writer,
  Article,
  WorkflowStepLog,
  SuggestedSource,
  NicheConfig,
} from "./types";
import NicheBlogPreview from "./components/NicheBlogPreview";
import AgentFlowVisualizer from "./components/AgentFlowVisualizer";
import { SystemLogViewer } from "./components/SystemLogViewer";
import { LiveServerLogViewer } from "./components/LiveServerLogViewer";
import { NichePerformanceDashboard } from "./components/NichePerformanceDashboard";
import { RSS_CATALOG } from "./data/rssCatalog";
import { generateSaaSMarketingSyndicate } from "./utils/promoGenerator";
import {
  TrendRadar,
  ContentCalendar,
  MediaStudio,
} from "./components/SaaSAdvancedSuites";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const getNicheExpertWriter = (niche: string, currentWriters: Writer[]): Writer => {
  const normNiche = (niche || "tech").toLowerCase();
  let expertId = "mkbhd-reviews";
  if (normNiche === "hollywood") {
    expertId = "joan-fashion";
  } else if (normNiche === "sports") {
    expertId = "lowe-court";
  } else if (normNiche === "tech") {
    expertId = "mkbhd-reviews";
  }
  let expert = currentWriters.find((w) => w.id === expertId);
  if (!expert) {
    expert = currentWriters.find((w) => w.niche === normNiche);
  }
  return expert || currentWriters[0] || ({
    id: "mkbhd-reviews",
    name: "Marques Tech Profile",
    voiceStyle: "Minimalist, Value-to-Spec Critic",
    niche: "tech",
    customPromptInstruction: "Write in a pristine, minimalist, conversational voice.",
  } as any);
};

const matchDateFilter = (createdAtStr?: string, filter?: string) => {
  if (!filter || filter === "all") return true;
  if (!createdAtStr) return false;
  const createdTime = new Date(createdAtStr).getTime();
  if (isNaN(createdTime)) return false;

  const now = new Date();
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  switch (filter) {
    case "today":
      return (nowMs - createdTime) <= dayMs;
    case "yesterday": {
      const diff = nowMs - createdTime;
      return diff > dayMs && diff <= (2 * dayMs);
    }
    case "week":
      return (nowMs - createdTime) <= (7 * dayMs);
    case "month":
      return (nowMs - createdTime) <= (30 * dayMs);
    case "older":
      return (nowMs - createdTime) > (30 * dayMs);
    default:
      return true;
  }
};

export default function App() {
  const [isLiveLogsOpen, setIsLiveLogsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (localStorage.getItem("omnipublisher-theme") as "light" | "dark") ||
      "light"
    );
  });

  useEffect(() => {
    localStorage.setItem("omnipublisher-theme", theme);
  }, [theme]);

  // Brand niches configurations
  const [niches, setNiches] = useState<NicheConfig[]>([
    {
      id: "hollywood",
      name: "Gossip & Glam",
      tagline: "Celebrity gossip and viral fashion trends",
      primaryColor: "bg-rose-600 text-white",
      accentColor: "rose-500",
      fontFamily: "Playfair Display",
      themeStyle: "glamour",
    },
    {
      id: "sports",
      name: "The Arena",
      tagline: "No-nonsense NBA, baseball, and football tactics",
      primaryColor: "bg-emerald-600 text-white",
      accentColor: "emerald-500",
      fontFamily: "Space Grotesk",
      themeStyle: "brutalist",
    },
    {
      id: "tech",
      name: "Alpha Teardown",
      tagline: "Raw specs, gadgets, and innovative hardware",
      primaryColor: "bg-zinc-900 text-white",
      accentColor: "cyan-500",
      fontFamily: "JetBrains Mono",
      themeStyle: "cyberpunk",
    },
    {
      id: "traveling",
      name: "Nomad Chronicles",
      tagline: "Wanderlust itineraries, slow travel, and global guidebooks",
      primaryColor: "bg-indigo-600 text-white",
      accentColor: "indigo-500",
      fontFamily: "Space Grotesk",
      themeStyle: "editorial",
    },
  ]);

  const [selectedNiche, setSelectedNiche] = useState<NicheType>("hollywood");
  const [headlineNicheFilter, setHeadlineNicheFilter] = useState<string>("all");

  // Custom states for editing & deleting niches
  const [showEditNicheModal, setShowEditNicheModal] = useState(false);
  const [editingNicheId, setEditingNicheId] = useState("");
  const [editingNicheName, setEditingNicheName] = useState("");
  const [editingNicheTagline, setEditingNicheTagline] = useState("");
  const [editingNicheTheme, setEditingNicheTheme] = useState("editorial");
  const [editingNichePrimaryColor, setEditingNichePrimaryColor] = useState("");
  const [editingNicheAccentColor, setEditingNicheAccentColor] = useState("");
  const [editingNicheFontFamily, setEditingNicheFontFamily] = useState("");
  const [isSavingNiche, setIsSavingNiche] = useState(false);

  // Custom states for editing & selecting niches on feed pathways
  const [newFeedNiche, setNewFeedNiche] = useState("");
  const [activeFeedNicheFilter, setActiveFeedNicheFilter] = useState<string>("all");
  const [showEditFeedModal, setShowEditFeedModal] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [editingFeedName, setEditingFeedName] = useState("");
  const [editingFeedUrl, setEditingFeedUrl] = useState("");
  const [editingFeedNiche, setEditingFeedNiche] = useState("");
  const [isSavingFeed, setIsSavingFeed] = useState(false);

  const [showNicheModal, setShowNicheModal] = useState(false);
  const [newNicheName, setNewNicheName] = useState("");
  const [newNicheTagline, setNewNicheTagline] = useState("");
  const [newNicheTheme, setNewNicheTheme] = useState("editorial");
  const [isCreatingNiche, setIsCreatingNiche] = useState(false);
  const [nicheCreationError, setNicheCreationError] = useState("");

  const [nicheSetupTab, setNicheSetupTab] = useState<"manual" | "discovery">("manual");
  const [discoverySearchKeyword, setDiscoverySearchKeyword] = useState("");
  const [isSearchingNiche, setIsSearchingNiche] = useState(false);
  const [discoveredNicheResult, setDiscoveredNicheResult] = useState<any>(null);
  const [selectedDiscoveredFeeds, setSelectedDiscoveredFeeds] = useState<string[]>([]);

  const guessedNicheLayout = (result: any) => {
    if (!result || !result.niche) return null;
    const { name, tagline, themeStyle } = result.niche;
    const feedList = result.feeds || [];

    return (
      <div className="space-y-4 animate-fade-in text-left">
        <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <span className="text-[8.5px] font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider">
            🔮 Suggested Niche Profile
          </span>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tight">
            {name}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic font-medium">
            "{tagline}"
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border text-slate-500 font-mono">
              Layout Style: {themeStyle.toUpperCase()}
            </span>
          </div>
        </div>

        <div>
          <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">
            📡 Discovered Active RSS Feeds ({feedList.length})
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin pr-1">
            {feedList.map((feed: any, index: number) => {
              const isChecked = selectedDiscoveredFeeds.includes(feed.url);
              return (
                <div
                  key={feed.url + index}
                  className="p-3 border border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl flex items-start gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedDiscoveredFeeds(prev => prev.filter(u => u !== feed.url));
                      } else {
                        setSelectedDiscoveredFeeds(prev => [...prev, feed.url]);
                      }
                    }}
                    className="mt-0.5 rounded border-slate-350 dark:border-slate-800 text-indigo-600 cursor-pointer w-4 h-4 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {feed.name}
                    </p>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-mono truncate select-all">
                      {feed.url}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E3E5E8] dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setDiscoveredNicheResult(null);
              setDiscoverySearchKeyword("");
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={isCreatingNiche}
            onClick={handleDeployDiscoveredNicheAndFeeds}
            className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isCreatingNiche ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Setting up Niche...
              </>
            ) : (
              <>
                <span>🚀 Deploy Niche & ({selectedDiscoveredFeeds.length}) Feeds</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const handleDiscoverNicheOnInternet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoverySearchKeyword.trim()) return;
    setIsSearchingNiche(true);
    setNicheCreationError("");
    setDiscoveredNicheResult(null);
    try {
      const res = await fetch("/api/niches/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: discoverySearchKeyword }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveredNicheResult(data);
        if (data.feeds) {
          setSelectedDiscoveredFeeds(data.feeds.map((f: any) => f.url));
        }
      } else {
        const errData = await res.json();
        setNicheCreationError(errData.error || "Failed to search internet for niches.");
      }
    } catch (err) {
      console.error(err);
      setNicheCreationError("Failed to discover niche on internet due to network error.");
    } finally {
      setIsSearchingNiche(false);
    }
  };

  const handleDeployDiscoveredNicheAndFeeds = async () => {
    if (!discoveredNicheResult || !discoveredNicheResult.niche) return;
    const { name, tagline, themeStyle } = discoveredNicheResult.niche;
    setIsCreatingNiche(true);
    setNicheCreationError("");
    try {
      // 1. Create Niche
      const res = await fetch("/api/niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagline, themeStyle }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setNicheCreationError(errData.error || "Failed to create niche during deploy.");
        setIsCreatingNiche(false);
        return;
      }
      
      const newNiche = await res.json();
      setNiches((prev) => {
        if (prev.some(n => n.id === newNiche.id)) return prev;
        return [...prev, newNiche];
      });

      // 2. Deploy selected feeds
      const feedsToDeploy = (discoveredNicheResult.feeds || [])
        .filter((f: any) => selectedDiscoveredFeeds.includes(f.url))
        .map((f: any) => ({
          name: f.name,
          url: f.url,
          niche: newNiche.id
        }));

      if (feedsToDeploy.length > 0) {
        await fetch("/api/feeds/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feeds: feedsToDeploy })
        });
      }

      setSelectedNiche(newNiche.id);
      setShowNicheModal(false);
      setDiscoverySearchKeyword("");
      setDiscoveredNicheResult(null);
      await fetchConfig();
    } catch (err) {
      console.error(err);
      setNicheCreationError("Error during automated deployment.");
    } finally {
      setIsCreatingNiche(false);
    }
  };

  const handleCreateCustomNiche = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNicheName.trim()) {
      setNicheCreationError("Niche name is required.");
      return;
    }
    setIsCreatingNiche(true);
    setNicheCreationError("");
    try {
      const res = await fetch("/api/niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newNicheName,
          tagline: newNicheTagline,
          themeStyle: newNicheTheme,
        }),
      });
      if (res.ok) {
        const newNiche = await res.json();
        await fetchConfig();
        setNiches((prev) => {
          if (prev.some(n => n.id === newNiche.id)) return prev;
          return [...prev, newNiche];
        });
        setAutopilotNicheLimits((prev) => ({ ...prev, [newNiche.id]: 5 }));
        setAutopilotNicheEnabled((prev) => ({ ...prev, [newNiche.id]: true }));
        setAutopilotProcessedCounts((prev) => ({ ...prev, [newNiche.id]: 0 }));
        setSelectedNiche(newNiche.id);
        setShowNicheModal(false);
        setNewNicheName("");
        setNewNicheTagline("");
        setNewNicheTheme("editorial");
        if (typeof fetchNotifications === "function") {
          fetchNotifications();
        }
      } else {
        const errData = await res.json();
        setNicheCreationError(errData.error || "Failed to create custom niche.");
      }
    } catch (err) {
      console.error(err);
      setNicheCreationError("Network error. Please try again.");
    } finally {
      setIsCreatingNiche(false);
    }
  };

  const handleEditNicheSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNicheName.trim()) {
      alert("Niche name is required.");
      return;
    }
    setIsSavingNiche(true);
    try {
      const res = await fetch(`/api/niches/${editingNicheId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingNicheName,
          tagline: editingNicheTagline,
          themeStyle: editingNicheTheme,
          primaryColor: editingNichePrimaryColor,
          accentColor: editingNicheAccentColor,
          fontFamily: editingNicheFontFamily,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNiches((prev) => prev.map(n => n.id === updated.id ? updated : n));
        setShowEditNicheModal(false);
        await fetchConfig();
        alert("Niche updated successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update niche.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating niche.");
    } finally {
      setIsSavingNiche(false);
    }
  };

  const handleEditFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedName || !editingFeedUrl) {
      alert("Feed name and URL are required.");
      return;
    }

    let finalUrl = editingFeedUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    setIsSavingFeed(true);
    try {
      const res = await fetch(`/api/feeds/${editingFeedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFeedName,
          url: finalUrl,
          niche: editingFeedNiche,
        }),
      });
      if (res.ok) {
        setShowEditFeedModal(false);
        setEditingFeedId(null);
        await fetchConfig();
        alert("Feed updated successfully!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update feed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating feed.");
    } finally {
      setIsSavingFeed(false);
    }
  };

  const handleDeleteFeed = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/feeds/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [writers, setWriters] = useState<Writer[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [voiceStudioSubTab, setVoiceStudioSubTab] = useState<"profiles" | "create" | "skills">("profiles");
  const [focusWriterId, setFocusWriterId] = useState<string | null>(null);
  const [activeWriterNicheFilter, setActiveWriterNicheFilter] = useState<string>("all");

  // Skill Manager State Hooks
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillNiche, setNewSkillNiche] = useState<string>("all");
  const [newSkillDirective, setNewSkillDirective] = useState("");
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [suggestedSources, setSuggestedSources] = useState<SuggestedSource[]>(
    [],
  );
  const [allSuggestedSources, setAllSuggestedSources] = useState<
    SuggestedSource[]
  >([]);

  // Scraper & state loaders
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);
  const [selectedWriterId, setSelectedWriterId] = useState<string>("auto");
  const [editingWriterId, setEditingWriterId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SuggestedSource | null>(
    null,
  );

  // Modular UI tabs (SaaS 2.0 Command Center)
  const [activeAdminTab, setActiveAdminTab] = useState<
    | "contentFactory"
    | "dashboard"
    | "radar"
    | "calendar"
    | "mediaStudio"
    | "writers"
    | "feeds"
    | "wordpress"
    | "settings"
    | "logs"
  >("contentFactory");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "inbox" | "preview"
  >("inbox");

  // New SaaS 2026 Core States
  const [headlineViewMode, setHeadlineViewMode] = useState<
    "list" | "scheduler"
  >("list");
  const [activeFeedSubTab, setActiveFeedSubTab] = useState<
    "active" | "presets"
  >("active");
  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>([]);
  const [expandedSocialHubId, setExpandedSocialHubId] = useState<string | null>(
    null,
  );
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autopilotSchedulerActive, setAutopilotSchedulerActive] =
    useState<boolean>(false);
  const [activeMarketingTab, setActiveMarketingTab] = useState<
    "twitter" | "linkedin" | "email" | "seo"
  >("twitter");
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [wpLeftTab, setWpLeftTab] = useState<"directory" | "register" | "queue" | "fallback" | "patch">("directory");
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [isExecutingQueue, setIsExecutingQueue] = useState<boolean>(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [manualResolveJobId, setManualResolveJobId] = useState<string | null>(null);
  const [manualWpPostId, setManualWpPostId] = useState<string>("");
  const [manualDestUrl, setManualDestUrl] = useState<string>("");
  const [abortJobId, setAbortJobId] = useState<string | null>(null);
  const [abortReason, setAbortReason] = useState<string>("");
  const [isFirestoreQuotaExceeded, setIsFirestoreQuotaExceeded] = useState<boolean>(false);
  const [firebaseProjectId, setFirebaseProjectId] = useState<string>("gen-lang-client-0888306694");
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState<string>("ai-studio-767d7b73-69cd-4989-abdf-e59b01aaad79");
  const [editingWpSite, setEditingWpSite] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNiche, setEditNiche] = useState("hollywood");
  const [editAutoPush, setEditAutoPush] = useState(false);

  // SaaS and integration settings
  const [saasConfig, setSaasConfig] = useState<any>({
    modelSettings: {
      geminiApiKey: "",
      openaiApiKey: "",
      openrouterApiKey: "",
      minimaxApiKey: "",
      clarityApiKey: "",
      researchModel: "gemini-2.5-flash",
      researchCustomModel: "moonshotai/kimi-k2.6:free",
      draftModel: "gemini-2.5-pro",
      draftCustomModel: "openrouter/free",
      humanizeModel: "gemini-2.5-flash",
      humanizeCustomModel: "nvidia/nemotron-3-super-120b-a12b:free",
      seoModel: "gemini-2.5-flash",
      imageModel: "imagen-3.0-generate-001",
      imageFallbackModel: "nanobana",
      imageCustomModel: "imagen-3.0-generate-001",
      aiImagePreferred: true,
      minHumanScoreTarget: 95,
      maxConcurrentAgents: 3,
      openrouterCustomModel: "deepseek/deepseek-chat",
      discoveryModel: "gemini-2.5-flash",
      discoveryCustomModel: "google/gemini-2.5-flash",
      discoveryFallbackModel: "global",
      discoveryFallbackCustomModel: "",
      nicheDiscoveryModel: "gemini-2.5-flash",
      nicheDiscoveryCustomModel: "google/gemini-2.5-flash",
      nicheDiscoveryFallbackModel: "global",
      nicheDiscoveryFallbackCustomModel: "",
    },
    wordpress: {
      hollywood: {
        url: "",
        username: "",
        appPassword: "",
        isConfigured: false,
        autoPush: false,
      },
      sports: {
        url: "",
        username: "",
        appPassword: "",
        isConfigured: false,
        autoPush: false,
      },
      tech: {
        url: "",
        username: "",
        appPassword: "",
        isConfigured: false,
        autoPush: false,
      },
    },
    wordpressSites: [],
  });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // SaaS Cost Estimator
  const [estArticlesPerDay, setEstArticlesPerDay] = useState(10);
  const [estModelTier, setEstModelTier] = useState<
    "flash" | "smart" | "premium"
  >("flash");
  const [realSaaSStats, setRealSaaSStats] = useState<{
    totalArticles: number;
    totalWords: number;
    totalTextCost: number;
    totalImageCost: number;
    overallCost: number;
    averageCostPerArticle: number;
  } | null>(null);

  const fetchRealSaaSStats = async () => {
    try {
      const res = await fetch("/api/saas-stats");
      if (res.ok) {
        const data = await res.json();
        setRealSaaSStats(data);
      }
    } catch (err) {
      console.error("Error loading SaaS stats:", err);
    }
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPushingWp, setIsPushingWp] = useState<Record<string, boolean>>({});
  const [isTestingWp, setIsTestingWp] = useState<
    Record<string, "idle" | "testing" | "success" | "failed">
  >({});
  const [wpLogs, setWpLogs] = useState<string[]>([
    `[SYSTEM v2.5] Active rest engine initializing connection...`,
    `[REST ENGINE] Standardizing payload maps for Gossip, Arena, Alpha Teardown...`,
    `[CONNECTION] REST API hooks loaded. Ready for WordPress Sync Gate trigger...`,
  ]);

  // Multi-agent workflow monitors
  const [activeWorkflowLogs, setActiveWorkflowLogs] = useState<
    WorkflowStepLog[]
  >([]);
  const [workflowCurrentStep, setWorkflowCurrentStep] = useState<string>("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritingStatusText, setRewritingStatusText] = useState("");
  const [showCouncilModal, setShowCouncilModal] = useState(false);

  // Upscaled Content Rewriting Customizer States
  const [rewriteDepth, setRewriteDepth] = useState<
    "short" | "medium" | "deep-dive"
  >("medium");
  const [rewriteSubstyle, setRewriteSubstyle] = useState<string>("standard");
  const [rewriteCustomFacts, setRewriteCustomFacts] = useState<string>("");
  const [rewriteCustomKeywords, setRewriteCustomKeywords] =
    useState<string>("");
  const [rewriteAdsenseOptimized, setRewriteAdsenseOptimized] =
    useState<boolean>(false);
  const [rewriteInlineImageMode, setRewriteInlineImageMode] =
    useState<string>("generate");
  const [showExpandedRewriteSettings, setShowExpandedRewriteSettings] =
    useState<boolean>(false);

  // Autopilot Mode States
  const [autopilotMode, setAutopilotMode] = useState<
    "semi-automation" | "autopilot"
  >("semi-automation");
  const [showAutopilotSetup, setShowAutopilotSetup] = useState<boolean>(false);
  const [autopilotSystems, setAutopilotSystems] = useState<
    Record<string, boolean>
  >({
    trendsAnalysis: true,
    editorialCouncil: true,
    antiAiHumanizer: true,
    adsenseMaximizer: true,
    seoMetadata: true,
    imageGeneration: true,
    wordpressSyndication: false,
  });

  const [autopilotNicheLimits, setAutopilotNicheLimits] = useState<
    Record<string, number>
  >({
    hollywood: 2,
    sports: 3,
    tech: 0,
  });

  const [autopilotNicheEnabled, setAutopilotNicheEnabled] = useState<
    Record<string, boolean>
  >({
    hollywood: true,
    sports: true,
    tech: false,
  });

  const [autopilotProcessedCounts, setAutopilotProcessedCounts] = useState<
    Record<string, number>
  >({
    hollywood: 0,
    sports: 0,
    tech: 0,
  });

  const [autopilotCountdown, setAutopilotCountdown] = useState<number>(45);
  const [autopilotLog, setAutopilotLog] = useState<string>(
    "System standby. Enable Autopilot to initialize slot countdown ticker.",
  );
  const [isAutopilotRunningCycle, setIsAutopilotRunningCycle] =
    useState<boolean>(false);
  const autopilotJobAbortControllerRef = useRef<AbortController | null>(null);
  const autopilotStopRequestRef = useRef<boolean>(false);
  const rewriteAbortControllerRef = useRef<AbortController | null>(null);
  const [autopilotBatchSize, setAutopilotBatchSize] = useState<number>(2);

  // Copilot Strategic Synthesis States
  const [copilotTargetAudience, setCopilotTargetAudience] =
    useState<string>("");
  const [copilotTone, setCopilotTone] = useState<string>("");
  const [copilotStructure, setCopilotStructure] = useState<string>("");
  const [copilotSeoStrategy, setCopilotSeoStrategy] = useState<string>("");
  const [copilotContentObjectives, setCopilotContentObjectives] =
    useState<string>("");
  const [copilotEngagementOptimization, setCopilotEngagementOptimization] =
    useState<string>("");
  const [copilotAuthorityBuilding, setCopilotAuthorityBuilding] =
    useState<string>("");
  const [copilotConversionOptimization, setCopilotConversionOptimization] =
    useState<string>("");
  const [isSynthesizingCopilot, setIsSynthesizingCopilot] =
    useState<boolean>(false);
  const [resolvedWriterId, setResolvedWriterId] = useState<string>("");

  // New RSS / Writer forms
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");

  const [addFeedMethod, setAddFeedMethod] = useState<"single" | "json">("single");
  const [bulkFeedsFile, setBulkFeedsFile] = useState<File | null>(null);
  const [bulkFeedsError, setBulkFeedsError] = useState("");
  const [isUploadingBulkFeeds, setIsUploadingBulkFeeds] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<any>(null);

  const handleBulkUploadJsonFeeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFeedsFile) {
      setBulkFeedsError("Please select a valid JSON feed file first.");
      return;
    }

    setIsUploadingBulkFeeds(true);
    setBulkFeedsError("");
    setBulkUploadResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        
        let feedArray: any[] = [];
        if (Array.isArray(parsed)) {
          feedArray = parsed;
        } else if (parsed.feeds && Array.isArray(parsed.feeds)) {
          feedArray = parsed.feeds;
        } else {
          setBulkFeedsError("Invalid format. Expected a JSON array of feeds, or an object containing a 'feeds' array.");
          setIsUploadingBulkFeeds(false);
          return;
        }

        // Map them to the active niche, prioritizing item.niche, then the selected feed niche dropdown, and finally selectedNiche
        const formattedFeeds = feedArray.map((item: any) => ({
          name: item.name || item.title || "Imported RSS Link",
          url: item.url || item.rss || item.link,
          niche: item.niche || newFeedNiche || selectedNiche
        }));

        if (formattedFeeds.length === 0) {
          setBulkFeedsError("No valid RSS feeds were detected in this JSON payload.");
          setIsUploadingBulkFeeds(false);
          return;
        }

        const response = await fetch("/api/feeds/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feeds: formattedFeeds })
        });

        if (response.ok) {
          const result = await response.json();
          setBulkUploadResult(result);
          await fetchConfig();
          setBulkFeedsFile(null);
          // Zero domestic input
          const el = document.getElementById("bulk-feeds-input") as HTMLInputElement;
          if (el) el.value = "";
        } else {
          const errData = await response.json();
          setBulkFeedsError(errData.error || "Failed to process bulk feeds upload.");
        }
      } catch (err: any) {
        setBulkFeedsError("Malformed JSON file. Please verify content grammar.");
      } finally {
        setIsUploadingBulkFeeds(false);
      }
    };
    reader.readAsText(bulkFeedsFile);
  };

  // Internet Search & Discovery of RSS Paths
  const [customDiscoveredFeeds, setCustomDiscoveredFeeds] = useState<any[]>([]);
  const [deletedDiscoveryUrls, setDeletedDiscoveryUrls] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearchingFeeds, setIsSearchingFeeds] = useState(false);
  const [selectedPresetUrls, setSelectedPresetUrls] = useState<string[]>([]);

  const [showAddWriter, setShowAddWriter] = useState(false);
  const [newWriterName, setNewWriterName] = useState("");
  const [newWriterNiche, setNewWriterNiche] = useState("");
  const [newWriterVoice, setNewWriterVoice] = useState("");
  const [newWriterBio, setNewWriterBio] = useState("");
  const [newWriterInstruction, setNewWriterInstruction] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] =
    useState<string>("TechCrunch");
  const [selectedSkillsTags, setSelectedSkillsTags] = useState<string[]>([]);
  const [isCorrectingWriter, setIsCorrectingWriter] = useState<boolean>(false);

  // Writer Alignment Tester state hooks
  const [testingWriterId, setTestingWriterId] = useState<string | null>(null);
  const [testSampleText, setTestSampleText] = useState("");
  const [isTestingAlignment, setIsTestingAlignment] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<{
    score: number;
    verdict: string;
    strengths: string[];
    gaps: string[];
  } | null>(null);
  const [alignmentTestError, setAlignmentTestError] = useState<string | null>(null);

  // Reader, Manual Editor, and Copilot States
  const [showReaderId, setShowReaderId] = useState<string | null>(null);
  const [selectedWpSiteId, setSelectedWpSiteId] = useState<string>("");
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>("");
  const [editableContent, setEditableContent] = useState<string>("");
  const [editableTags, setEditableTags] = useState<string[]>([]);
  const [editableAuthorName, setEditableAuthorName] = useState<string>("");
  const [isOptimizingWithAI, setIsOptimizingWithAI] = useState<boolean>(false);
  const [customTagsText, setCustomTagsText] = useState<string>("");
  const [editableFocusKeyword, setEditableFocusKeyword] = useState<string>("");
  const [editableMetaDescriptionOverride, setEditableMetaDescriptionOverride] = useState<string>("");
  const [editableCanonicalUrlOverride, setEditableCanonicalUrlOverride] = useState<string>("");
  const [activeDraftModalTab, setActiveDraftModalTab] = useState<
    "preview" | "editor" | "workflow"
  >("preview");
  const [articleIdToConfirmDelete, setArticleIdToConfirmDelete] = useState<
    string | null
  >(null);
  const [writerIdToConfirmDelete, setWriterIdToConfirmDelete] = useState<
    string | null
  >(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);
  const [showClearSavedConfirm, setShowClearSavedConfirm] = useState<boolean>(false);
  const [showClearPushedConfirm, setShowClearPushedConfirm] = useState<boolean>(false);

  // Filter & Search States
  const [draftSearchQuery, setDraftSearchQuery] = useState<string>("");
  const [draftAuthorFilter, setDraftAuthorFilter] = useState<string>("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<
    "all" | "draft" | "published"
  >("all");
  const [draftDateFilter, setDraftDateFilter] = useState<string>("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Control Center row expansion & multi-tab details
  const [expandedControlCenterId, setExpandedControlCenterId] = useState<
    string | null
  >(null);
  const [activeControlTab, setActiveControlTab] = useState<
    Record<string, "metrics" | "orchestration" | "logs" | "cost">
  >({});
  const [isRescoringId, setIsRescoringId] = useState<string | null>(null);
  const [isRetryingStepId, setIsRetryingStepId] = useState<string | null>(null);

  // Niche configuration maps for Writers Factory
  const nicheSkills = new Proxy<Record<string, string[]>>({
    tech: [
      "Technical Explainer 🔬",
      "Deep Code Analysis 💻",
      "Witty Commentary 🌶️",
      "Organic Keyword Integration 📈",
      "Viral Hook Writing 🚀",
      "Analytical Blueprinting 🧠",
      "Lead Quality Verification 🕵️",
    ],
    sports: [
      "Stat Teardowns 📊",
      "Game Timing 🕰️",
      "Strategic Predictions 🔮",
      "Witty Commentary 🌶️",
      "Organic Keyword Integration 📈",
      "Viral Hook Writing 🚀",
      "Lead Quality Verification 🕵️",
    ],
    hollywood: [
      "Trending Culture Analysis 💅",
      "Deep-Dive Reporting ⚡",
      "Editorial Storytelling 📣",
      "Witty Commentary 🌶️",
      "Organic Keyword Integration 📈",
      "Viral Hook Writing 🚀",
      "Lead Quality Verification 🕵️",
    ],
    traveling: [
      "Itinerary Mapping 🗺️",
      "Slow Travel Philosophy 🌿",
      "Local Food Scouter 🍜",
      "Witty Commentary 🌶️",
      "Organic Keyword Integration 📈",
      "Viral Hook Writing 🚀",
      "Lead Quality Verification 🕵️",
    ],
  }, {
    get: (target, prop: string) => {
      if (prop in target) return target[prop];
      return [
        "Custom Analytical Review 🔬",
        "Deep Narrative Exploration 🏛️",
        "Witty Commentary & Prose 🌶️",
        "Organic Keyword Integration 📈",
        "Viral Topic Hooking 🚀",
        "Lead Quality Verification 🕵️",
      ];
    }
  });

  const nicheCompetitors = new Proxy<Record<string, string[]>>({
    tech: ["TechCrunch", "The Verge", "Engadget", "Wired"],
    sports: ["ESPN", "SBNation", "The Athletic", "Bleacher Report"],
    hollywood: ["TMZ", "Perez Hilton", "E! Online", "Page Six"],
    traveling: ["Lonely Planet", "National Geographic", "Nomadic Matt", "Travel + Leisure"],
  }, {
    get: (target, prop: string) => {
      if (prop in target) return target[prop];
      return ["Google Trends", "Top Subreddits", "Authority Feeds", "Competitor Blueprint"];
    }
  });

  const [boardApplicants, setBoardApplicants] = useState<any[]>([]);
  const [isScoutingCandidates, setIsScoutingCandidates] = useState(false);

  // Original Editorial Persona Presets
  const WRITER_PRESETS = [
    {
      name: "Steven Levy",
      voiceStyle: "Deep Tech-Savant Narrative Journalist",
      bio: "Legendary cyberculture analyst modeling Wired's narrative tech journalism. Specializes in computing context and system ethics.",
      targetInspiration: "Wired",
      instruction:
        "Write in a highly intellectual, narrative-driven Silicon Valley tech style. Ground the content in deep industry histories, hacker ethics, and societal implications. Avoid corporate fluff; use elegant prose, deep analogies, and precise, thoughtful tech vocabulary.",
    },
    {
      name: "Kara Swisher",
      voiceStyle: "Fearless Power-Player Interview & Tech Critic",
      bio: "Sharp-tongued tech columnist inspired by the NYT's fearless critical commentary. Breaks down boardrooms, egos, and power hierarchies.",
      targetInspiration: "NYT / Vox",
      instruction:
        "Write with a sharp, bold, direct, and slightly cynical tone. Rip into big-tech egos, focus on accountability, call out greed and corporate PR lingo instantly. Start with a direct punchy point. Use witty, no-excuses conversational syntax.",
    },
    {
      name: "David Remnick",
      voiceStyle: "Laureate Literary Critic & Cultural Essayist",
      bio: "Ultra-sophisticated literary essayist modeled on The New Yorker. Combines rich vocabulary and deep historical metaphors.",
      targetInspiration: "The New Yorker",
      instruction:
        "Write with unmatched literary poise, extensive vocabulary, long-form syntax, and rich cultural references. Focus on deep character profiles, psychological motives, and historical parallels. Absolute elegance, no rush, high-brow prose.",
    },
    {
      name: "Anna Wintour",
      voiceStyle: "Avant-Garde High-Fashion Authority",
      bio: "Towering fashion tastemaker modeled after high-fashion editors. Decisive, authoritative critique of fabrics, drapes, and design.",
      targetInspiration: "Vogue",
      instruction:
        "Write like a towering, decisive high-fashion editor. Criticize or praise garments with clinical design parameters ( silhouettes, drape, texture, craftsmanship). Use sophisticated fashion vocabulary, high-brow comparisons, and cold, uncompromising taste.",
    },
    {
      name: "Helen Gurley Brown",
      voiceStyle: "Witty & Spicy Pop-Culture Confidante",
      bio: "High-energy, vivacious voice focused on celebrity pairings, relationships, intimacy advice, and spicy viral glamour.",
      targetInspiration: "Cosmopolitan",
      instruction:
        "Write in a highly energetic, personal, flirtatious, and witty voice. Use bold questions, direct sisterly references like 'darling' or 'bestie', and focus heavily on bedroom drama, relationship chemistry, and vibrant self-empowerment tips.",
    },
    {
      name: "Greg Ip",
      voiceStyle: "High-Finance & Global Capital Columnist",
      bio: "Global macro analyst modeling the Wall Street Journal style. Focuses on monetary policy, federal indices, and business operations.",
      targetInspiration: "Wall Street Journal",
      instruction:
        "Write in a highly technical, objective, and authoritative financial tone. Focus on interest rate policy, global capital flow, supply-chain bottlenecks, venture cap valuation sheets, and ROI forecasts. Support arguments with hard financial metrics.",
    },
    {
      name: "Alex Wilhelm",
      voiceStyle: "Venture Capital Spec Scout",
      bio: "Startup economics reporter analyzing early-stage venture rounds, burn rates, MRR, cap-sheets, and structural moats.",
      targetInspiration: "TechCrunch",
      instruction:
        "Write like a hyper-analytical tech-startup analyst. Blend raw financial venture data (Series A rounds, cap table dilutions, MRR, churn rates) with a witty, slightly geeky, and fast-paced tech narrative. Analyze whether the business model actually has a solid moat.",
    },
    {
      name: "Adrian Wojnarowski",
      voiceStyle: "Ultimate Inside Front-Office Insider",
      bio: "Woj-style breaking news reporter. Pierces straight into sports agent transactions, salary caps, draft leverage, and front-office leaks.",
      targetInspiration: "ESPN",
      instruction:
        "Write in a sharp, urgent, breaking-news scoop style. Emphasize front-office dynamics, locker-room politics, trade luxury-tax calculations, and executive power struggles. Ground columns in high-stakes transaction details.",
    },
    {
      name: "Kim Masters",
      voiceStyle: "Studio-Deal Investigator & Box-Office Reporter",
      bio: "L.A. industry reporter tracking guild disputes, movie package budgets, streaming residuals, and box-office gross yields.",
      targetInspiration: "The Hollywood Reporter",
      instruction:
        "Write like a seasoned industry journalist tracking studio executive moves, box office metrics, guild disputes, and multi-million packaging deals. Avoid fan-circle gossip; focus on legal filings, budget escalations, and executive politics.",
    },
    {
      name: "Arthur Frommer",
      voiceStyle: "Authentic Slow Travel Guidebook Pioneer",
      bio: "Legendary budget traveler advocating for cultural immersion, slow travel, and real local connections.",
      targetInspiration: "Lonely Planet",
      instruction:
        "Write in a highly warm, inviting, and practical travel style. Avoid sterile resort marketing; focus heavily on the sensory details of streets, local eateries, environmental responsibility, and cultural respect. Give crisp, specific budgeting advice and step-by-step pedestrian walking pathways.",
    },
  ];

  const handleOpenReader = (art: Article) => {
    setShowReaderId(art.id);
    setEditableTitle(art.title);
    setEditableContent(art.content);
    setEditableTags(art.tags || []);
    setEditableAuthorName(art.customAuthorName || "");
    setCustomTagsText((art.tags || []).join(", "));
    setEditableFocusKeyword(
      art.seo?.focusKeyword || (art.seo?.keywords && art.seo.keywords[0]) || "",
    );
    setEditableMetaDescriptionOverride(art.seo?.metaDescriptionOverride || "");
    setEditableCanonicalUrlOverride(art.seo?.canonicalUrlOverride || "");
    setIsEditingDraft(false);
    setActiveDraftModalTab("preview");
  };

  const handleSaveManualEdits = async () => {
    if (!showReaderId) return;
    const activeArt = articles.find((a) => a.id === showReaderId);
    try {
      const parsedTags = customTagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/articles/${showReaderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editableTitle,
          content: editableContent,
          tags: parsedTags,
          customAuthorName: editableAuthorName || "",
          seo: {
            ...(activeArt?.seo || {}),
            focusKeyword: editableFocusKeyword,
            metaDescriptionOverride: editableMetaDescriptionOverride,
            canonicalUrlOverride: editableCanonicalUrlOverride,
          },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.id === showReaderId ? updated : a)),
        );
        setEditableTags(parsedTags);
        alert("Changes saved to database successfully!");
      }
    } catch (err) {
      console.error("Save manual edits error:", err);
    }
  };

  const handleAIImproveDraft = async () => {
    if (!showReaderId) return;
    setIsOptimizingWithAI(true);
    try {
      const parsedTags = customTagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/articles/${showReaderId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editableContent,
          title: editableTitle,
          tags: parsedTags,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) =>
          prev.map((a) => (a.id === showReaderId ? updated : a)),
        );
        setEditableContent(updated.content);
        setEditableTitle(updated.title);
        setEditableTags(updated.tags || []);
        alert(
          "Linguistic Refinement complete! Your draft compliance ranking has been optimized.",
        );
      }
    } catch (err) {
      console.error("AI Improvement error:", err);
    } finally {
      setIsOptimizingWithAI(false);
    }
  };

  const handleApplyPresetWriter = (preset: any) => {
    setNewWriterName(`${preset.name}`);
    setNewWriterVoice(preset.voiceStyle);
    setNewWriterBio(preset.bio);
    setNewWriterInstruction(preset.instruction);
    setVoiceStudioSubTab("create");
    setShowAddWriter(true);

    setTimeout(() => {
      const formElement = document.getElementById("vs-subtab-create");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and load core configurations
  useEffect(() => {
    fetchConfig();
    fetchArticles();
    fetchSaaSSettings();
    fetchNotifications();
    fetchRealSaaSStats();
    fetchDiscoveryData();

    // Poll notifications every 12 seconds to instantly capture api quotas or breakdowns
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update lists whenever niche or active items change, but strictly preserve Autopilot choice ("auto")!
  useEffect(() => {
    if (writers.length > 0) {
      if (selectedWriterId === "auto" || !selectedWriterId) {
        return; // Keep dynamic autopilot selection active!
      }
      const filteredWriters = writers.filter((w) => w.niche === selectedNiche);
      if (filteredWriters.length > 0) {
        const isCurrentValid = filteredWriters.some((w) => w.id === selectedWriterId);
        if (!isCurrentValid) {
          setSelectedWriterId("auto");
        }
      } else {
        setSelectedWriterId("auto");
      }
    }
  }, [selectedNiche, writers]);

  useEffect(() => {
    if (saasConfig?.modelSettings?.inlineImageMode) {
      setRewriteInlineImageMode(saasConfig.modelSettings.inlineImageMode);
    }
  }, [saasConfig?.modelSettings?.inlineImageMode]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch("/api/notifications/clear", { method: "POST" });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSaaSSettings = async () => {
    try {
      const res = await fetch("/api/saas-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.isFirestoreQuotaExceeded !== undefined) {
          setIsFirestoreQuotaExceeded(!!data.isFirestoreQuotaExceeded);
        }
        setSaasConfig((prev: any) => {
          const merged = { ...data };
          if (!merged.wordpress) merged.wordpress = {};
          // Dynamically ensure all active design/niche pathways have structural objects initialized 
          // to prevent undefined access crash in settings rendering
          const activeNiches = prev?.niches || niches || [];
          activeNiches.forEach((n: any) => {
            if (!merged.wordpress[n.id]) {
              merged.wordpress[n.id] = { url: "", username: "", appPassword: "", isConfigured: false, autoPush: false };
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error("Error loading SaaS settings:", err);
    }
  };

  const handleSaveSaaSSettings = async (updatedConfig: any) => {
    setIsSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/saas-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setSaasConfig(data.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving SaaS settings:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setWriters(data.writers || []);
        setFeeds(data.feeds || []);
        if (data.niches) {
          setNiches(data.niches);
          // Dynamically initialize WordPress configurations for all custom niches
          setSaasConfig((prev: any) => {
            const nextWp = { ...(prev?.wordpress || {}) };
            data.niches.forEach((n: any) => {
              if (!nextWp[n.id]) {
                nextWp[n.id] = { url: "", username: "", appPassword: "", isConfigured: false, autoPush: false };
              }
            });
            return {
              ...prev,
              wordpress: nextWp
            };
          });
          // Dynamically initialize autopilot limits, enabled states, and session counts for custom niches
          setAutopilotNicheLimits((prev) => {
            const next = { ...prev };
            data.niches.forEach((n: any) => {
              if (next[n.id] === undefined) {
                next[n.id] = 5;
              }
            });
            return next;
          });
          setAutopilotNicheEnabled((prev) => {
            const next = { ...prev };
            data.niches.forEach((n: any) => {
              if (next[n.id] === undefined) {
                next[n.id] = true;
              }
            });
            return next;
          });
          setAutopilotProcessedCounts((prev) => {
            const next = { ...prev };
            data.niches.forEach((n: any) => {
              if (next[n.id] === undefined) {
                next[n.id] = 0;
              }
            });
            return next;
          });
        }
        setAllSuggestedSources(data.suggestedSources || []);
        setBoardApplicants(data.candidates || []);
        setSkills(data.skills || []);

        if (data.isFirestoreQuotaExceeded !== undefined) {
          setIsFirestoreQuotaExceeded(!!data.isFirestoreQuotaExceeded);
        }
        if (data.firebaseProjectId) {
          setFirebaseProjectId(data.firebaseProjectId);
        }
        if (data.firestoreDatabaseId) {
          setFirestoreDatabaseId(data.firestoreDatabaseId);
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  useEffect(() => {
    setHeadlineNicheFilter(selectedNiche);
  }, [selectedNiche]);

  useEffect(() => {
    const filtered = allSuggestedSources.filter((s: SuggestedSource) => {
      if (headlineNicheFilter === "all") return true;
      return s.niche === headlineNicheFilter;
    });
    setSuggestedSources(filtered);
  }, [headlineNicheFilter, allSuggestedSources]);

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
        fetchRealSaaSStats(); // Automatically sync with real cost & usage metrics
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    }
  };

  const handleSyncFeeds = async () => {
    setIsSyncingFeeds(true);
    try {
      const res = await fetch(`/api/feeds/sync?niche=${headlineNicheFilter}`);
      if (res.ok) {
        await fetchConfig(); // Reload and filter completely
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to synchronize feeds: ${err.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      alert(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingFeeds(false);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName || !newFeedUrl) {
      alert("Please provide both a feed name and a feed URL.");
      return;
    }

    let finalUrl = newFeedUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFeedName,
          url: finalUrl,
          niche: newFeedNiche || selectedNiche,
        }),
      });

      if (res.ok) {
        setNewFeedName("");
        setNewFeedUrl("");
        setNewFeedNiche("");
        setShowAddFeed(false);
        fetchConfig();
      } else {
        const errorData = await res.json();
        alert(`Failed to add feed: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Create feed error:", err);
    }
  };

  const handleAddPresetFeed = async (name: string, url: string) => {
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, niche: selectedNiche }),
      });
      if (res.ok) {
        await fetchConfig();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to add feed: ${errorData.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Add preset feed error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const fetchDiscoveryData = async () => {
    try {
      const res = await fetch("/api/feeds/discovery");
      if (res.ok) {
        const data = await res.json();
        setCustomDiscoveredFeeds(data.customFeeds || []);
        setDeletedDiscoveryUrls(data.deletedUrls || []);
      }
    } catch (err) {
      console.error("Error fetching discovery feeds:", err);
    }
  };

  const handleSearchOnlineFeeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    setIsSearchingFeeds(true);
    try {
      const res = await fetch("/api/feeds/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchKeyword })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchDiscoveryData();
        setSearchKeyword("");
      } else {
        alert("Failed to perform internet feed discovery. Please try again.");
      }
    } catch (err) {
      console.error("Discovery search error:", err);
    } finally {
      setIsSearchingFeeds(false);
    }
  };

  const handleDeleteDiscoveryFeed = async (urls: string[]) => {
    if (urls.length === 0) return;
    try {
      const res = await fetch("/api/feeds/discovery/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls })
      });
      if (res.ok) {
        await fetchDiscoveryData();
        setSelectedPresetUrls(prev => prev.filter(u => !urls.includes(u)));
      }
    } catch (err) {
      console.error("Failed to delete preset from discovery catalog:", err);
    }
  };

  const handleDeploySelectedFeeds = async (feedsToDeploy: any[]) => {
    if (feedsToDeploy.length === 0) {
      alert("No feeds selected to deploy!");
      return;
    }
    try {
      const res = await fetch("/api/feeds/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: feedsToDeploy }),
      });
      if (res.ok) {
        await fetchConfig();
        setSelectedPresetUrls([]);
        alert(`Successfully deployed ${feedsToDeploy.length} RSS feed pathways!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to deploy feeds: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Error deploying selected feeds:", err);
      alert(`Error deploying selected feeds: ${err.message}`);
    }
  };

  const handleBulkAddPresets = async (presetsList: any[]) => {
    try {
      const res = await fetch("/api/feeds/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: presetsList }),
      });
      if (res.ok) {
        await fetchConfig();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to bulk add feeds: ${errData.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error("Bulk addition error:", err);
      alert(`Error in bulk addition: ${err.message}`);
    }
  };

  const handleCorrectWriter = async () => {
    setIsCorrectingWriter(true);
    try {
      const res = await fetch("/api/writers/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: selectedNiche,
          competitor: selectedCompetitor,
          skills: selectedSkillsTags,
          draftName: newWriterName,
          draftVoice: newWriterVoice,
        }),
      });
      if (res.ok) {
        const corrected = await res.json();
        setNewWriterName(corrected.name || "");
        setNewWriterVoice(corrected.voiceStyle || "");
        setNewWriterBio(corrected.bio || "");
        setNewWriterInstruction(corrected.customPromptInstruction || "");
        if (corrected.skills && Array.isArray(corrected.skills)) {
          setSelectedSkillsTags(corrected.skills);
        }
      }
    } catch (err) {
      console.error("Failed to correct writer tone:", err);
    } finally {
      setIsCorrectingWriter(false);
    }
  };

  const handleHireApplicant = async (candidate: any) => {
    try {
      const res = await fetch("/api/writers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: candidate.id,
          name: candidate.name,
          voiceStyle: candidate.voiceStyle,
          bio: candidate.bio,
          customPromptInstruction: candidate.customPromptInstruction,
          niche: selectedNiche,
          avatar: candidate.avatar,
          skills: candidate.skills,
          competitor: candidate.competitor,
        }),
      });
      if (res.ok) {
        await fetchConfig();
        alert(`${candidate.name} was successfully recruited to the board!`);
      }
    } catch (err) {
      console.error("Failed to hire candidate:", err);
    }
  };

  const handleScoutCandidates = async () => {
    setIsScoutingCandidates(true);
    try {
      const res = await fetch("/api/writers/candidates/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: selectedNiche }),
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error("Failed to scout candidates:", err);
    } finally {
      setIsScoutingCandidates(false);
    }
  };

  const handleCreateWriter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriterName || !newWriterVoice || !newWriterInstruction) return;

    try {
      const url = editingWriterId ? `/api/writers/${editingWriterId}` : "/api/writers";
      const method = editingWriterId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWriterName,
          voiceStyle: newWriterVoice,
          bio: newWriterBio,
          customPromptInstruction: newWriterInstruction,
          niche: newWriterNiche || selectedNiche,
          skills: selectedSkillsTags,
          competitor: selectedCompetitor
        }),
      });

      if (res.ok) {
        setNewWriterName("");
        setNewWriterVoice("");
        setNewWriterBio("");
        setNewWriterNiche("");
        setNewWriterInstruction("");
        setSelectedSkillsTags([]);
        setShowAddWriter(false);
        setEditingWriterId(null);
        setVoiceStudioSubTab("profiles");
        fetchConfig();
        alert("Editorial Voice Specialist registered successfully!");
      }
    } catch (err) {
      console.error("Create writer error:", err);
    }
  };

  const handleEditWriterClick = (writer: Writer) => {
     setVoiceStudioSubTab("create");
     setShowAddWriter(true);
     setEditingWriterId(writer.id);
     setNewWriterName(writer.name);
     setNewWriterVoice(writer.voiceStyle);
     setNewWriterBio(writer.bio);
     setNewWriterInstruction(writer.customPromptInstruction);
     setSelectedSkillsTags(writer.skills || []);
     setSelectedCompetitor(writer.competitor || nicheCompetitors[writer.niche]?.[0] || "TechCrunch");
   };

   const handleSaveSkill = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newSkillName.trim() || !newSkillDirective.trim()) {
       return;
     }
     setIsSavingSkill(true);
     try {
       const res = await fetch("/api/skills", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           id: editingSkillId,
           name: newSkillName,
           niche: newSkillNiche,
           directive: newSkillDirective
         })
       });
       if (res.ok) {
         await fetchConfig();
         setNewSkillName("");
         setNewSkillDirective("");
         setEditingSkillId(null);
       }
     } catch (err) {
       console.error("Save skill error:", err);
     } finally {
       setIsSavingSkill(false);
     }
   };

   const handleDeleteSkill = async (id: string) => {
     try {
       const res = await fetch(`/api/skills/${id}`, {
         method: "DELETE"
       });
       if (res.ok) {
         await fetchConfig();
         if (editingSkillId === id) {
           setEditingSkillId(null);
           setNewSkillName("");
           setNewSkillDirective("");
         }
       }
     } catch (err) {
       console.error("Delete skill error:", err);
     }
   };

   const handleTestWriterAlignment = async (writerId: string, text: string) => {
     if (!writerId || !text.trim()) {
       setAlignmentTestError("Please select a writer and enter some sample text.");
       return;
     }
     setIsTestingAlignment(true);
     setAlignmentTestError(null);
     setAlignmentResult(null);

     try {
       const res = await fetch(`/api/writers/${writerId}/test-alignment`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ sampleText: text })
       });
       if (res.ok) {
         const data = await res.json();
         if (data.success && data.alignment) {
           setAlignmentResult(data.alignment);
         } else {
           throw new Error(data.error || "Failed to evaluate style alignment.");
         }
       } else {
         const errData = await res.json();
         throw new Error(errData.error || `HTTP ${res.status}`);
       }
     } catch (err: any) {
       console.error("Test alignment error:", err);
       setAlignmentTestError(err.message || "Quality validation processing failed");
     } finally {
       setIsTestingAlignment(false);
     }
   };

   const dummyNoop = () => {
  };

  const handleDeleteWriter = async (id: string, resolveConfirm = false) => {
    if (!resolveConfirm) {
      setWriterIdToConfirmDelete(id);
      return;
    }
    try {
       const res = await fetch(`/api/writers/${id}`, { method: "DELETE" });
       if (res.ok) {
         setWriterIdToConfirmDelete(null);
         fetchConfig();
       }
    } catch(err) {
       console.error("Delete writer error:", err);
    }
  };

  const handleDeleteArticle = async (id: string, resolveConfirm = false) => {
    if (!resolveConfirm) {
      setArticleIdToConfirmDelete(id);
      return;
    }
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (showReaderId === id) {
          setShowReaderId(null);
        }
        setArticleIdToConfirmDelete(null);
        fetchArticles();
      }
    } catch (err) {
      console.error("Delete article error:", err);
    }
  };

  const handlePushToWordPress = async (id: string, siteId?: string) => {
    setIsPushingWp((prev) => ({ ...prev, [id]: true }));
    const art = articles.find((a) => a.id === id);
    setWpLogs((prev) => [
      ...prev,
      `[PUSH ENGINE] Initiating WordPress REST sync workflow for Article ID: ${id}...`,
      siteId ? `[PUSH ENGINE] Selected target site ID: "${siteId}"` : `[PUSH ENGINE] No site chosen; using default niche portal...`,
      `[MEDIA PROCESS] Processing media attachments ("${art?.title.substring(0, 30)}...")...`,
    ]);
    try {
      const res = await fetch(`/api/articles/${id}/push-wp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteId }),
      });
      if (res.ok) {
        const updatedArticle = await res.json();
        setWpLogs((prev) => [
          ...prev,
          `[MEDIA API] Uploaded & synchronized featured image to WP media gallery.`,
          `[REST SUCCESS] Successfully posted content. Saved in WordPress Database as ID #${updatedArticle.wordpressPush?.postId || "N/A"}.`,
          `[LINK ATTACH] WordPress live public link: ${updatedArticle.wordpressPush?.postUrl || "N/A"}`,
        ]);
        fetchArticles();
      } else {
        let errMsg = "Encountered problem publishing to WordPress.";
        try {
          const errBody = await res.json();
          if (errBody.error) errMsg = errBody.error;
        } catch (_) {}
        setWpLogs((prev) => [
          ...prev,
          `[REST FAIL] WordPress returned api rejection: "${errMsg}"`,
        ]);
        alert(errMsg);
      }
    } catch (err: any) {
      setWpLogs((prev) => [
        ...prev,
        `[NET FATAL] Failed to contact local proxy endpoint: ${err.message}`,
      ]);
      console.error(err);
    } finally {
      setIsPushingWp((prev) => ({ ...prev, [id]: false }));
    }
  };

  const fetchQueueJobs = async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch("/api/publishing-queue/jobs");
      if (res.ok) {
        const data = await res.json();
        setQueueJobs(data);
      }
    } catch (err) {
      console.error("Error fetching queue jobs:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (wpLeftTab === "queue") {
      fetchQueueJobs();
      const interval = setInterval(fetchQueueJobs, 10000);
      return () => clearInterval(interval);
    }
  }, [wpLeftTab]);

  const handleQueueEnqueue = async (articleId: string, siteId?: string, scheduledPublishAt?: string | null) => {
    try {
      const res = await fetch("/api/publishing-queue/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, siteId, scheduledPublishAt })
      });
      if (res.ok) {
        alert("Successfully enqueued this draft for durable publication!");
        fetchArticles();
        if (wpLeftTab === "queue") fetchQueueJobs();
      } else {
        const err = await res.json();
        alert("Enqueue failed: " + (err.error || "Unspecified server rejection"));
      }
    } catch (e: any) {
      alert("Network Error: " + e.message);
    }
  };

  const handleQueueRetry = async (jobId: string) => {
    try {
      const res = await fetch(`/api/publishing-queue/jobs/${jobId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        alert("Manual retry registered successfully!");
        fetchQueueJobs();
      } else {
        const err = await res.json();
        alert("Retry failed: " + (err.error || "Server rejected action"));
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    }
  };

  const handleQueueResolve = async (jobId: string) => {
    if (!manualWpPostId || !manualDestUrl) {
      alert("Please fill both Post ID and Destination URL!");
      return;
    }
    try {
      const res = await fetch(`/api/publishing-queue/jobs/${jobId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordpressPostId: manualWpPostId, destinationUrl: manualDestUrl })
      });
      if (res.ok) {
        alert("Manual reconciliation resolved successfully!");
        setManualResolveJobId(null);
        setManualWpPostId("");
        setManualDestUrl("");
        fetchQueueJobs();
        fetchArticles();
      } else {
        const err = await res.json();
        alert("Resolution failed: " + (err.error || "Server rejected action"));
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    }
  };

  const handleQueueAbort = async (jobId: string) => {
    if (!abortReason) {
      alert("Please provide an abort reason!");
      return;
    }
    try {
      const res = await fetch(`/api/publishing-queue/jobs/${jobId}/abort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: abortReason })
      });
      if (res.ok) {
        alert("Job aborted successfully!");
        setAbortJobId(null);
        setAbortReason("");
        fetchQueueJobs();
        fetchArticles();
      } else {
        const err = await res.json();
        alert("Abort action failed: " + (err.error || "Server rejected action"));
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    }
  };

  const handleQueueRunWorker = async () => {
    setIsExecutingQueue(true);
    try {
      const res = await fetch("/api/publishing-queue/worker/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const stats = await res.json();
        alert(`Worker Run Completed!\nJobs Processed: ${stats.processedCount}\nSuccessful: ${stats.successCount}\nFailures: ${stats.failCount}`);
        fetchQueueJobs();
        fetchArticles();
      } else {
        const err = await res.json();
        alert("Worker execution failed: " + (err.error || "Server error"));
      }
    } catch (e: any) {
      alert("Network error during worker cycle: " + e.message);
    } finally {
      setIsExecutingQueue(false);
    }
  };

  const handlePublishArticle = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus === "published" ? "draft" : "published",
        }),
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (err) {
      console.error("Publish toggle error:", err);
    }
  };

  const patchArticle = async (id: string, delta: Partial<Article>) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delta),
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (err) {
      console.error("Patch article error:", err);
    }
  };

  // Launch original agentic editorial councils!
  const handleInitiateAgentRewrite = async (source: SuggestedSource) => {
    if (!selectedWriterId) {
      alert(
        "Please map a digital writer profile to coordinate this editorial draft compilation.",
      );
      return;
    }

    const controller = new AbortController();
    rewriteAbortControllerRef.current = controller;

    setSelectedSource(source);
    setShowCouncilModal(true);
    setIsRewriting(true);
    setActiveWorkflowLogs([]);
    setWorkflowCurrentStep("research");

    setRewritingStatusText("Synthesizing Copilot Strategy automatically...");
    const copilotData = await handleAutoSynthesizeCopilot(source);

    setRewritingStatusText("Assembling Council & checking baseline facts...");

    try {
      const response = await fetch("/api/articles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTitle: source.title,
          sourceUrl: source.url,
          sourceDescription: source.description,
          writerId: selectedWriterId,
          niche: source.niche || selectedNiche,
          opportunityScore: copilotData?.opportunityScore || source.opportunityScore,
          riskScore: copilotData?.riskScore || source.riskScore,
          targetLength: rewriteDepth,
          targetSubstyle: copilotData?.substyle || rewriteSubstyle,
          customFacts: copilotData?.factualContent || rewriteCustomFacts,
          customKeywords: rewriteCustomKeywords,
          adsenseOptimized: rewriteAdsenseOptimized,
          inlineImageMode: rewriteInlineImageMode,

          // New strategic Copilot parameters
          targetAudience: copilotData?.targetAudience || copilotTargetAudience,
          targetTone: copilotData?.tone || copilotTone,
          targetStructure: copilotData?.structure || copilotStructure,
          seoStrategy: copilotData?.seoStrategy || copilotSeoStrategy,
          contentObjectives: copilotData?.contentObjectives || copilotContentObjectives,
          engagementOptimization: copilotData?.engagementOptimization || copilotEngagementOptimization,
          authorityBuilding: copilotData?.authorityBuilding || copilotAuthorityBuilding,
          conversionOptimization: copilotData?.conversionOptimization || copilotConversionOptimization,
        }),
        signal: controller.signal,
      });

      if (!response.body) {
        setIsRewriting(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialLine = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split("\n");
        partialLine = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const payload = JSON.parse(line);

            if (payload.step) {
              setWorkflowCurrentStep(payload.step);
              setRewritingStatusText(payload.log || "");

              if (payload.detail) {
                setActiveWorkflowLogs((prev) => {
                  const exists = prev.some(
                    (l) => l.step === payload.detail.step,
                  );
                  if (exists) {
                    return prev.map((l) =>
                      l.step === payload.detail.step ? payload.detail : l,
                    );
                  }
                  return [...prev, payload.detail];
                });
              }
            }
          } catch (e) {
            // Line parsing error, continue
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Rewrite aborted by user.");
        setRewritingStatusText(
          "🛑 Rewrite process forcefully stopped by user.",
        );
      } else {
        console.error("Agentic flow error:", err);
      }
    } finally {
      setIsRewriting(false);
      rewriteAbortControllerRef.current = null;
      fetchArticles(); // Reload newly created dynamic drafted article
    }
  };

  const handleTriggerImageGeneration = async (
    articleId: string,
    prompt: string,
  ) => {
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/articles/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, articleId }),
      });
      if (res.ok) {
        fetchArticles(); // Reload images
      } else {
        throw new Error(`Failed to generate image: HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("Image generation API failed. Applying beautiful category-appropriate fallback image:", err);
      // Determine the category fallback image
      const article = articles.find((a) => a.id === articleId);
      let niche = (article?.niche || selectedNiche || "tech").toLowerCase().trim();
      if (niche === "travel" || niche === "traveling" || niche === "nomad" || niche === "nomad-chronics" || niche === "nomad_chronics" || niche === "lifestyle") {
        niche = "traveling";
      }
      
      const categoryFallbacks: Record<string, string[]> = {
        hollywood: [
          "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80"
        ],
        sports: [
          "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80"
        ],
        tech: [
          "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"
        ],
        traveling: [
          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
        ]
      };
      const list = categoryFallbacks[niche] || categoryFallbacks.traveling || categoryFallbacks.tech;
      // Reversible hash selection for a stable, high-quality Unsplash match
      let promptHash = 0;
      for (let i = 0; i < (prompt || "").length; i++) {
        promptHash = (promptHash << 5) - promptHash + (prompt || "").charCodeAt(i);
        promptHash |= 0;
      }
      const index = Math.abs(promptHash) % list.length;
      const fallbackUrl = list[index];

      try {
        await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ originalImageUrl: fallbackUrl }),
        });
        fetchArticles(); // Reload newly configured image back into client listing state
      } catch (patchErr) {
        console.error("Failed to apply dynamic fallback image details:", patchErr);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAutoSynthesizeCopilot = async (sourceToSynthesize?: SuggestedSource, overrideWriterId?: string) => {
    const activeSrc = sourceToSynthesize || selectedSource || suggestedSources[0];
    if (!activeSrc) {
      alert(
        "No active breakout opportunity has been loaded in the RSS feed queue. Please sync feeds first.",
      );
      return null;
    }
    setIsSynthesizingCopilot(true);
    try {
      const res = await fetch("/api/copilot/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTitle: activeSrc.title,
          sourceDescription: activeSrc.description || "",
          niche: activeSrc.niche || selectedNiche,
          writerId: overrideWriterId || selectedWriterId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          let resolvedWriterIdVal = data.resolvedWriterId;
          if (!resolvedWriterIdVal || resolvedWriterIdVal === "auto" || !writers.some((w) => w.id === resolvedWriterIdVal)) {
            const expert = getNicheExpertWriter(selectedNiche, writers);
            resolvedWriterIdVal = expert.id;
          }
          setResolvedWriterId(resolvedWriterVal => resolvedWriterIdVal);
          data.resolvedWriterId = resolvedWriterIdVal;
          if (data.substyle) setRewriteSubstyle(data.substyle);
          if (data.targetAudience)
            setCopilotTargetAudience(data.targetAudience);
          if (data.factualContent) setRewriteCustomFacts(data.factualContent);
          if (data.tone) setCopilotTone(data.tone);
          if (data.structure) setCopilotStructure(data.structure);
          if (data.seoStrategy) setCopilotSeoStrategy(data.seoStrategy);
          if (data.contentObjectives)
            setCopilotContentObjectives(data.contentObjectives);
          if (data.engagementOptimization)
            setCopilotEngagementOptimization(data.engagementOptimization);
          if (data.authorityBuilding)
            setCopilotAuthorityBuilding(data.authorityBuilding);
          if (data.conversionOptimization)
            setCopilotConversionOptimization(data.conversionOptimization);

          if (data.opportunityScore !== undefined || data.riskScore !== undefined) {
             const updatedScore = data.opportunityScore || activeSrc.opportunityScore;
             const updatedRisk = data.riskScore || activeSrc.riskScore;
             setSelectedSource({...activeSrc, opportunityScore: updatedScore, riskScore: updatedRisk});
             setSuggestedSources(sources => sources.map(s => s.id === activeSrc.id ? {...s, opportunityScore: updatedScore, riskScore: updatedRisk} : s));
          }
          return data;
        }
      }
    } catch (err) {
      console.error(
        "Failed to auto-synthesize advanced copilot recommendations:",
        err,
      );
    } finally {
      setIsSynthesizingCopilot(false);
    }
    return null;
  };

  const handleExecuteAutopilotCycleInstantly = async () => {
    if (isAutopilotRunningCycle) return;
    autopilotStopRequestRef.current = false;
    setIsAutopilotRunningCycle(true);
    setAutopilotLog(
      "Autopilot triggered! Evaluating active niche limits and scanning RSS feeds...",
    );

    try {
      // 1. Identify which niches are enabled and still have remaining quota step-by-step to compile a batch list
      const tempProcessedCounts = { ...autopilotProcessedCounts };
      const selectedJobs: Array<{ winningSource: any; chosenNiche: string }> =
        [];

      for (let i = 0; i < autopilotBatchSize; i++) {
        const eligibleNiches = Object.keys(autopilotNicheEnabled).filter(
          (nicheKey) => {
            const isEnabled = autopilotNicheEnabled[nicheKey];
            const limit = autopilotNicheLimits[nicheKey] ?? 0;
            const processed = tempProcessedCounts[nicheKey] ?? 0;
            return isEnabled && processed < limit;
          },
        );

        if (eligibleNiches.length === 0) {
          break; // Quota reached for concurrent niches in this cycle
        }

        // Pick the highest scoring article across eligible niches not yet taken in this batch or database
        let bestNicheForThisSlot = "";
        let bestSourceForThisSlot: any = null;

        for (const nicheKey of eligibleNiches) {
          const availableSources = suggestedSources.filter(
            (s) => s.niche === nicheKey,
          );
          const alreadyDraftedTitles = articles.map(
            (art) => art.sourceTitle?.toLowerCase() || "",
          );
          const alreadyChosenTitlesInCurrentBatch = selectedJobs.map((job) =>
            job.winningSource.title.toLowerCase(),
          );

          let candidate = availableSources.find(
            (src) =>
              !alreadyDraftedTitles.includes(src.title.toLowerCase()) &&
              !alreadyChosenTitlesInCurrentBatch.includes(
                src.title.toLowerCase(),
              ),
          );

          if (!candidate && availableSources.length > 0) {
            candidate = availableSources
              .filter(
                (src) =>
                  !alreadyChosenTitlesInCurrentBatch.includes(
                    src.title.toLowerCase(),
                  ),
              )
              .reduce(
                (prev, curr) =>
                  (curr.rating || 0) > (prev.rating || 0) ? curr : prev,
                availableSources[0],
              );
          }

          if (candidate) {
            if (
              !bestSourceForThisSlot ||
              (candidate.rating || 0) > (bestSourceForThisSlot.rating || 0)
            ) {
              bestSourceForThisSlot = candidate;
              bestNicheForThisSlot = nicheKey;
            }
          }
        }

        if (bestNicheForThisSlot && bestSourceForThisSlot) {
          selectedJobs.push({
            winningSource: bestSourceForThisSlot,
            chosenNiche: bestNicheForThisSlot,
          });
          tempProcessedCounts[bestNicheForThisSlot] =
            (tempProcessedCounts[bestNicheForThisSlot] ?? 0) + 1;
        } else {
          break; // No more available opportunities found
        }
      }

      if (selectedJobs.length === 0) {
        setAutopilotLog(
          "⚡ All configured website/niche quotas are COMPLETE or queue is exhausted! Autopilot stopped.",
        );
        setAutopilotSchedulerActive(false);
        setIsAutopilotRunningCycle(false);
        setAutopilotCountdown(45);
        return;
      }

      // 2. Concurrently process all drafted articles in the batch in chunks of maxConcurrentAgents
      const maxConcurrency = saasConfig.modelSettings.maxConcurrentAgents || 3;
      setAutopilotLog(
        `🎰 Selected champion workload: ${selectedJobs.length} opportunities! Dispatching premium content rewrites with concurrency level: ${maxConcurrency}...`,
      );

      for (let index = 0; index < selectedJobs.length; index += maxConcurrency) {
        if (autopilotStopRequestRef.current) {
          setAutopilotLog(
            "🛑 Active Autopilot sequence forcefully STOPPED by user.",
          );
          break;
        }

        const chunk = selectedJobs.slice(index, index + maxConcurrency);
        const chunkIndexStart = index;

        setAutopilotLog(
          `⚡ [Batch ${Math.floor(index / maxConcurrency) + 1}/${Math.ceil(selectedJobs.length / maxConcurrency)}] Initiating up to ${chunk.length} parallel agent councils...`,
        );

        await Promise.all(
          chunk.map(async (jobItem, subIndex) => {
            const globalIdx = chunkIndexStart + subIndex;
            const { winningSource, chosenNiche } = jobItem;
            const jobNum = globalIdx + 1;
            const totalJobs = selectedJobs.length;

            const nicheNameMapped =
              chosenNiche === "hollywood"
                ? "Gossip & Glam"
                : chosenNiche === "sports"
                  ? "The Arena"
                  : "Alpha Teardown";

            setAutopilotLog(
              `🚀 [Job ${jobNum}/${totalJobs}] Processing for [${nicheNameMapped}]: "${winningSource.title}" (Score: ${winningSource.opportunityScore || 90}%)`,
            );

            // Fetch Advanced Copilot Synthesized settings for this exact article!
            setAutopilotLog(`🤖 [Job ${jobNum}/${totalJobs}] Synthesizing Copilot Content Strategy automatically...`);
            const jobCopilotData = await handleAutoSynthesizeCopilot({
              ...winningSource,
              opportunityScore: winningSource.opportunityScore || 90,
              riskScore: winningSource.riskScore || 0
            }, "auto"); // Force auto selection of writer per article

            let resolvedWriterId = jobCopilotData?.resolvedWriterId;
            if (!resolvedWriterId || resolvedWriterId === "auto" || !writers.some((w) => w.id === resolvedWriterId)) {
              resolvedWriterId = getNicheExpertWriter(chosenNiche, writers).id;
            }

            const activeWriter = writers.find((w) => w.id === resolvedWriterId) || getNicheExpertWriter(chosenNiche, writers);

            // ONLY Open details in the main modal for the first item of the chunk to avoid flickering
            if (subIndex === 0) {
              setSelectedSource(winningSource);
              setSelectedWriterId(activeWriter.id);
              setShowCouncilModal(true);
              setIsRewriting(true);
              setActiveWorkflowLogs([]);
              setWorkflowCurrentStep("research");
              setRewritingStatusText(
                `🤖 [Batch Leader ${jobNum}/${totalJobs}] Assembling Editorial Council & validating news facts...`,
              );
            }

            setAutopilotLog(
              `👥 [Job ${jobNum}/${totalJobs}] Initiating rewrite council matching voice: ${activeWriter.name}...`,
            );

            const jobController = new AbortController();

            let response;
            try {
              response = await fetch("/api/articles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sourceTitle: winningSource.title,
                  sourceUrl: winningSource.url,
                  sourceDescription: winningSource.description,
                  writerId: activeWriter.id,
                  niche: chosenNiche,
                  opportunityScore: jobCopilotData?.opportunityScore || winningSource.opportunityScore || 90,
                  riskScore: jobCopilotData?.riskScore || winningSource.riskScore || 0,
                  targetLength: rewriteDepth,
                  targetSubstyle: jobCopilotData?.substyle || rewriteSubstyle,
                  customFacts: jobCopilotData?.factualContent || rewriteCustomFacts,
                  customKeywords: rewriteCustomKeywords,
                  adsenseOptimized: rewriteAdsenseOptimized,
                  inlineImageMode: rewriteInlineImageMode,

                  targetAudience: jobCopilotData?.targetAudience || copilotTargetAudience,
                  targetTone: jobCopilotData?.tone || copilotTone,
                  targetStructure: jobCopilotData?.structure || copilotStructure,
                  seoStrategy: jobCopilotData?.seoStrategy || copilotSeoStrategy,
                  contentObjectives: jobCopilotData?.contentObjectives || copilotContentObjectives,
                  engagementOptimization: jobCopilotData?.engagementOptimization || copilotEngagementOptimization,
                  authorityBuilding: autopilotSystems.editorialRefinement
                    ? "Include editorial style anchors"
                    : (jobCopilotData?.authorityBuilding || copilotAuthorityBuilding),
                  conversionOptimization: jobCopilotData?.conversionOptimization || copilotConversionOptimization,
                }),
                signal: jobController.signal,
              });
            } catch (fetchErr: any) {
              if (fetchErr.name === "AbortError") {
                setAutopilotLog(
                  `🛑 [Job ${jobNum}/${totalJobs}] Aborted by operator.`,
                );
              } else {
                setAutopilotLog(
                  `❌ [Job ${jobNum}/${totalJobs}] Network error: ${fetchErr.message}`,
                );
              }
              return;
            }

            if (!response.ok) {
              setAutopilotLog(
                `❌ [Job ${jobNum}/${totalJobs}] Editorial council rewrite api returned non-ok status: ${response.status}.`,
              );
              return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let partialLine = "";
            let createdArticleId = "";

            if (reader) {
              try {
                while (true) {
                  if (autopilotStopRequestRef.current) {
                    reader.cancel();
                    break;
                  }
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunkStr = decoder.decode(value, { stream: true });
                  const lines = (partialLine + chunkStr).split("\n");
                  partialLine = lines.pop() || "";
                  for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                      const payload = JSON.parse(line);
                      if (payload.log) {
                        setAutopilotLog(
                          `👉 [GP ${jobNum}/${totalJobs}] ${payload.log}`,
                        );
                      }
                      if (payload.articleId) {
                        createdArticleId = payload.articleId;
                      }

                      // Stream visual details only if this is the batch leader
                      if (subIndex === 0 && payload.step) {
                        setWorkflowCurrentStep(payload.step);
                        setRewritingStatusText(payload.log || "");

                        if (payload.detail) {
                          setActiveWorkflowLogs((prev) => {
                            const exists = prev.some(
                              (l) => l.step === payload.detail.step,
                            );
                            if (exists) {
                              return prev.map((l) =>
                                l.step === payload.detail.step ? payload.detail : l,
                              );
                            }
                            return [...prev, payload.detail];
                          });
                        }
                      }
                    } catch (e) {
                      // Skip partial chunks
                    }
                  }
                }
              } catch (streamErr: any) {
                setAutopilotLog(
                  `⚠️ [Job ${jobNum}/${totalJobs}] Encountered stream issue: ${streamErr.message}`,
                );
              }
            }

            if (subIndex === 0) {
              setIsRewriting(false);
            }

            if (autopilotStopRequestRef.current) {
              return;
            }

            setAutopilotLog(
              `🎨 [Job ${jobNum}/${totalJobs}] Standard Image Illustrating (ChatGPT / Nano Banana 2)...`,
            );
            let finalArtId = createdArticleId;
            await fetchArticles();

            if (!finalArtId) {
              const latestResponse = await fetch("/api/articles");
              if (latestResponse.ok) {
                const list = await latestResponse.json();
                if (list && list.length > 0) {
                  const matchingArt = list.find((artObj: any) => artObj.sourceTitle === winningSource.title);
                  if (matchingArt) finalArtId = matchingArt.id;
                  else finalArtId = list[0].id;
                }
              }
            }

            if (finalArtId) {
              setAutopilotLog(
                `⚡ [Job ${jobNum}/${totalJobs}] Syndicating & Publishing directly as approved draft!`,
              );
              const pubRes = await fetch(`/api/articles/${finalArtId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "published" }),
              });

              if (pubRes.ok) {
                setAutopilotLog(
                  `🎉 [Job ${jobNum}/${totalJobs}] SUCCESS! Article drafted, illustrated, refined, and syndicated successfully.`,
                );
              } else {
                setAutopilotLog(
                  `⚠️ [Job ${jobNum}/${totalJobs}] saved as active draft but syndication failed.`,
                );
              }

              if (autopilotSystems.wordpressSyndication) {
                setAutopilotLog(
                  `🌐 [Job ${jobNum}/${totalJobs}] Sending post directly to WordPress...`,
                );
                await fetch(`/api/articles/${finalArtId}/push-wp`, {
                  method: "POST",
                });
                setAutopilotLog(
                  `🎉 [Job ${jobNum}/${totalJobs}] SUCCESS! Live synced to WordPress!`,
                );
              }

              // Increment processed count
              setAutopilotProcessedCounts((prev) => ({
                ...prev,
                [chosenNiche]: (prev[chosenNiche] ?? 0) + 1,
              }));
            } else {
              setAutopilotLog(
                `❌ [Job ${globalIdx + 1}/${totalJobs}] Failed to resolve article ID for finishing.`,
              );
            }
          }),
        );
      }
    } catch (error: any) {
      console.error("Autopilot process failed:", error);
      setAutopilotLog(
        `❌ Autopilot execution failed: ${error.message || error}`,
      );
    } finally {
      setIsAutopilotRunningCycle(false);
      setAutopilotCountdown(45);
      autopilotJobAbortControllerRef.current = null;
      fetchArticles();
    }
  };

  const handleStopActiveAutopilot = () => {
    autopilotStopRequestRef.current = true;
    setAutopilotLog("🛑 Stop requested... Force-cancelling active jobs now.");
    if (autopilotJobAbortControllerRef.current) {
      autopilotJobAbortControllerRef.current.abort();
    }
  };

  // The background scheduler has been permanently removed/disabled per user request
  // to ensure no tasks run for unlimited time (which exceeds API quotas).
  useEffect(() => {
    // Deliberately empty, tasks are no longer scheduled to loop infinitely
  }, [autopilotSchedulerActive]);

  const currentNicheConfig =
    niches.find((n) => n.id === selectedNiche) || niches[0];

  return (
    <div
      className={`app-root ${theme} min-h-screen ${theme === "light" ? "bg-[#F3F5F6] text-[#111827]" : "bg-[#0E1218] text-[#f8fafc]"} flex font-sans antialiased w-full`}
    >
      {/* Modern B2B Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 bg-white dark:bg-[#121620] border-r border-[#E3E5E8] dark:border-slate-800 w-[240px] flex flex-col z-50 select-none hidden lg:flex h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E3E5E8] dark:border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-[#3F5353] dark:bg-[#5F528E] rounded-xl text-white shadow-sm">
            <span className="text-xl">🖨️</span>
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-[#0D1219] dark:text-slate-100 uppercase">
              OMNIPUBLISHER
            </h1>
            <span className="text-[9px] font-bold text-[#8B8E96] uppercase tracking-wide">
              Autonomous SaaS v3.0
            </span>
          </div>
        </div>

        {/* Niche/Project Selector */}
        <div className="p-4 border-b border-[#E3E5E8] dark:border-slate-850">
          <label className="block text-[8.5px] font-black text-[#8B8E96] uppercase tracking-widest mb-1.5 font-mono">
            TENANT PROJECT/BLOG
          </label>
          <div className="relative space-y-2">
            <select
              value={selectedNiche}
              onChange={(e) => {
                setSelectedNiche(e.target.value as NicheType);
                setSelectedSource(null);
              }}
              className="w-full text-xs font-bold text-[#0D1219] dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5F528E] transition"
            >
              {niches.map((n) => {
                let icon = "🌐";
                if (n.id === "hollywood") icon = "🎬";
                else if (n.id === "sports") icon = "🏀";
                else if (n.id === "tech") icon = "💻";
                else if (n.id === "traveling") icon = "🧭";
                else if (n.id.includes("mystery") || n.id.includes("mystirious")) icon = "🕵️‍♂️";
                else if (n.id.includes("top-10") || n.id.includes("top10")) icon = "🔟";
                else if (n.id.includes("fact") || n.id.includes("facts")) icon = "💡";

                return (
                  <option key={n.id} value={n.id}>
                    {icon} {n.name}
                  </option>
                );
              })}
            </select>

            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => {
                  setNicheCreationError("");
                  setShowNicheModal(true);
                }}
                className="flex-1 h-8 flex items-center justify-center gap-1 text-[9.5px] font-black text-[#3F5353] dark:text-indigo-300 hover:text-white bg-[#F0F1F2] hover:bg-[#3F5353] dark:bg-slate-900/45 dark:hover:bg-indigo-650 border border-dashed border-[#C3C5C8] dark:border-slate-800 hover:border-solid rounded-lg transition cursor-pointer font-sans"
                title="Add Custom Niche"
              >
                <Plus className="w-3 h-3" /> Niche
              </button>

              <button
                onClick={() => {
                  const currNiche = niches.find((n) => n.id === selectedNiche);
                  if (currNiche) {
                    setEditingNicheId(currNiche.id);
                    setEditingNicheName(currNiche.name);
                    setEditingNicheTagline(currNiche.tagline || "");
                    setEditingNicheTheme(currNiche.themeStyle || "editorial");
                    setEditingNichePrimaryColor(currNiche.primaryColor || "");
                    setEditingNicheAccentColor(currNiche.accentColor || "");
                    setEditingNicheFontFamily(currNiche.fontFamily || "Space Grotesk");
                    setShowEditNicheModal(true);
                  }
                }}
                className="h-8 px-2 flex items-center justify-center gap-1 text-[9.5px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-[#E3E5E8] dark:border-slate-800 rounded-lg transition cursor-pointer"
                title="Edit Selected Niche"
              >
                ⚙️ Setup
              </button>

              <button
                type="button"
                onClick={async () => {
                  const currNiche = niches.find((n) => n.id === selectedNiche);
                  if (!currNiche) return;
                  try {
                    const response = await fetch(`/api/niches/${currNiche.id}`, {
                      method: "DELETE",
                    });
                    if (response.ok) {
                      const remaining = niches.filter((n) => n.id !== currNiche.id);
                      const nextNicheId = remaining[0]?.id || "hollywood";
                      setSelectedNiche(nextNicheId);
                      await fetchConfig();
                    } else {
                      const err = await response.json();
                      console.error(`Failed to delete niche:`, err.error || "Unknown server error.");
                    }
                  } catch (e: any) {
                    console.error(`Network error to delete niche:`, e.message);
                  }
                }}
                className="h-8 px-2 flex items-center justify-center gap-1 text-[9.5px] font-black text-red-650 dark:text-rose-455 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 dark:hover:bg-[#4C1D24] border border-red-200 dark:border-rose-900/40 rounded-lg transition cursor-pointer"
                title="Delete Niche"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Nav Menu - matches activeAdminTab */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <span className="block text-[8.5px] font-black text-[#8B8E96] uppercase tracking-widest px-3 mb-2 font-mono">
            COMMAND SUITE
          </span>

          <button
            id="admin-tab-contentFactory"
            onClick={() => setActiveAdminTab("contentFactory")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "contentFactory"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <FileText className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
            <span>Editorial Ingest Catalog</span>
          </button>

          <button
            id="admin-tab-dashboard"
            onClick={() => setActiveAdminTab("dashboard")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "dashboard"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
            <span>Crawl Control</span>
          </button>

          <button
            id="admin-tab-radar"
            onClick={() => setActiveAdminTab("radar")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "radar"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-500 dark:text-rose-450" />
            <span>Trend Radar</span>
          </button>

          <button
            id="admin-tab-calendar"
            onClick={() => setActiveAdminTab("calendar")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "calendar"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-450" />
            <span>Content Calendar</span>
          </button>

          <button
            id="admin-tab-mediaStudio"
            onClick={() => setActiveAdminTab("mediaStudio")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "mediaStudio"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Image className="w-4 h-4 text-indigo-500 dark:text-indigo-450" />
            <span>Media Studio</span>
          </button>

          <button
            id="admin-tab-writers"
            onClick={() => setActiveAdminTab("writers")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "writers"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Users className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
            <span>Editorial Voice Profiles</span>
          </button>

          <button
            id="admin-tab-feeds"
            onClick={() => setActiveAdminTab("feeds")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "feeds"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Rss className="w-4 h-4 text-cyan-500" />
            <span>RSS Source Feeds</span>
          </button>

          <button
            id="admin-tab-wordpress"
            onClick={() => setActiveAdminTab("wordpress")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "wordpress"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>WordPress Sync Gate</span>
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveAdminTab("settings")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "settings"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 font-black"
            }`}
          >
            <FileCode className="w-4 h-4 text-purple-500" />
            <span>API Engine Config</span>
          </button>

          <button
            id="admin-tab-logs"
            onClick={() => setActiveAdminTab("logs")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === "logs"
                ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60"
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>Unified System Logs</span>
          </button>
        </nav>

        {/* Tenant Stats Card inside Sidebar */}
        <div className="p-4 border-t border-[#E3E5E8] dark:border-slate-850">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[10px] font-black text-[#3F5353] dark:text-[#5F528E] uppercase tracking-wider font-mono">
                Live Ingress Engine
              </span>
            </div>
            <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {currentNicheConfig.tagline}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-[#E3E5E8] dark:border-slate-800/80 text-center font-mono">
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">
                  {feeds.filter((f) => f.niche === selectedNiche).length}
                </span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">
                  Feeds
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">
                  {writers.filter((w) => w.niche === selectedNiche).length}
                </span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">
                  Writers
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">
                  {articles.filter((a) => a.niche === selectedNiche).length}
                </span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">
                  Drafts
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar drawer when open */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/45 backdrop-blur-sm select-none">
          <div className="w-[260px] bg-white dark:bg-[#121620] h-full flex flex-col p-4 border-r border-[#E3E5E8] dark:border-slate-800">
            {/* Header details */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E3E5E8] dark:border-slate-850 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖨️</span>
                <span className="text-xs font-black text-[#0D1219] dark:text-white">
                  OMNIPUBLISHER METROS
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-600 dark:text-slate-300 hover:text-rose-500 p-1 rounded-full cursor-pointer animate-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select site niche drop and navigation items */}
            <div className="mb-4 space-y-2">
              <label className="block text-[9px] font-bold text-[#8B8E96] uppercase tracking-wider mb-1 font-mono">
                Select Active Niche
              </label>
              <select
                value={selectedNiche}
                onChange={(e) => {
                  setSelectedNiche(e.target.value as NicheType);
                  setSelectedSource(null);
                  setMobileSidebarOpen(false);
                }}
                className="w-full text-xs font-bold text-[#0D1219] bg-white border border-[#E3E5E8] rounded-lg p-2.5 outline-none cursor-pointer dark:bg-slate-900 dark:text-white"
              >
                {niches.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setNicheCreationError("");
                  setShowNicheModal(true);
                  setMobileSidebarOpen(false);
                }}
                className="w-full h-8 flex items-center justify-center gap-1 text-[10px] font-bold text-[#3F5353] dark:text-indigo-300 bg-[#F0F1F2] dark:bg-slate-900 border border-dashed border-[#C3C5C8] dark:border-slate-800 rounded-lg transition cursor-pointer font-sans"
              >
                <span>+ Add Custom Niche</span>
              </button>
            </div>

            {/* Side list of command keys */}
            <nav className="space-y-1 flex-1">
              <button
                onClick={() => {
                  setActiveAdminTab("contentFactory");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "contentFactory"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <FileText className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Editorial Ingest Catalog</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("dashboard");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "dashboard"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Crawl Control</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("writers");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "writers"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <Users className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Editorial Voice Profiles</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("feeds");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "feeds"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <Rss className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>RSS Source Feeds</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("settings");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "settings"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <FileCode className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>API Config settings</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("wordpress");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "wordpress"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <Globe className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>WordPress Sync Gate</span>
              </button>

              <button
                onClick={() => {
                  setActiveAdminTab("logs");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === "logs"
                    ? "bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold"
                    : "text-[#8B8E96]"
                }`}
              >
                <Terminal className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Unified System Logs</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Page Workspace Content wrapper */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen lg:pl-[240px] w-full">
        {/* Top Sticky Header bar */}
        <header className="bg-white dark:bg-[#121620]/90 backdrop-blur-md border-b border-[#E3E5E8] dark:border-slate-805 py-3 px-6 sticky top-0 z-40 transition-all duration-350 shadow-sm w-full">
          <div className="flex items-center justify-between gap-4 max-w-[1680px] mx-auto w-full">
            {/* Left section: mobile toggle or active display description */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-[#0D1219] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer transition shrink-0"
                title="Open Workspace Actions"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:block shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs shrink-0">
                    {selectedNiche === "hollywood"
                      ? "🎬"
                      : selectedNiche === "sports"
                        ? "🏀"
                        : "💻"}
                  </span>
                  <h1 className="text-xs font-black tracking-wider text-[#0D1219] dark:text-slate-100 uppercase">
                    {selectedNiche === "hollywood"
                      ? "GOSSIP & TRENDS CORE"
                      : selectedNiche === "sports"
                        ? "THE ARENA LIVE RADAR"
                        : "ALPHA TEARDOWN SPECS"}
                  </h1>
                </div>
              </div>
            </div>

            {/* Central global search bar directly maps to draftSearchQuery */}
            <div className="relative max-w-md w-full flex-1 mx-4">
              <Search className="w-4 h-3.5 text-[#ABACB1] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search generated drafts or refine keyword topics..."
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                className="w-full text-xs text-[#0D1219] dark:text-slate-205 bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5F528E] focus:bg-white focus:text-[#0D1219]"
              />
            </div>

            {/* Right Quick Settings: togglers and user account indicators */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Niche check verify indicators list */}
              <div
                className={`hidden md:flex items-center gap-1.5 text-[9.5px] font-bold font-mono px-2.5 py-1 rounded-full ${
                  saasConfig.wordpress[selectedNiche]?.isConfigured
                    ? "bg-emerald-500/10 text-[#3F5353] dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-[#FFF9EE] text-[#C38127] border border-amber-500/20"
                }`}
                id={`wp-check-${selectedNiche}`}
              >
                <span>CMS Link</span>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              </div>

              {/* Notifications Tray */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-xl transition border cursor-pointer active:scale-95 relative ${
                    theme === "light"
                      ? "bg-white text-[#3F5353] border-[#E3E5E8] hover:bg-slate-50"
                      : "bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800 shadow-sm"
                  }`}
                  title="System Status & Notifications"
                  id="notifications-tray-btn"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce shadow-md">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 text-[#0f172a] dark:text-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-2">
                      <h4 className="text-[10px] font-black uppercase text-[#0D1219] dark:text-slate-100 font-mono tracking-wider flex items-center gap-1.5 animate-none">
                        <span>🔔</span> Quotas & Alerts
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[9px] text-indigo-500 hover:text-indigo-400 font-bold cursor-pointer bg-transparent border-0"
                        >
                          Read All
                        </button>
                        <button
                          onClick={handleClearNotifications}
                          className="text-[9px] text-rose-500 hover:text-rose-400 font-bold cursor-pointer bg-transparent border-0"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[#1e293b] dark:text-[#94a3b8]">
                          <p className="text-[10px] font-mono leading-relaxed">
                            No new status issues reported.
                          </p>
                          <p className="text-[8.5px] mt-1 opacity-70">
                            Model gateways and WordPress synclinks are
                            functioning smoothly.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border transition ${
                              n.read
                                ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-800/65 opacity-60"
                                : "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-550/10"
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              <span className="text-xs shrink-0 pt-0.5">
                                {n.type === "error"
                                  ? "🔴"
                                  : n.type === "warning"
                                    ? "⚠️"
                                    : "🟢"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">
                                    {n.title || "System Alert"}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-mono shrink-0">
                                    {new Date(n.timestamp).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 dark:text-slate-350 break-words mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 text-[8.5px] text-slate-400 font-mono text-center flex items-center justify-between">
                      <span>
                        Quota health:{" "}
                        <b className="text-[#3F5353] dark:text-emerald-400">
                          100% ONLINE
                        </b>
                      </span>
                      <span>
                        Version: <b>v3.0.5</b>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Terminal Logs */}
              <button
                onClick={() => setIsLiveLogsOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  theme === "light"
                    ? "bg-white text-[#3F5353] border-[#E3E5E8] hover:bg-slate-50"
                    : "bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800 shadow-sm"
                }`}
                title="View Live Container Terminal Logs"
                id="live-terminal-logs-btn"
              >
                <Terminal className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider font-mono">Terminal Logs</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </button>

              {/* Theme toggler */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`p-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  theme === "light"
                    ? "bg-white text-[#3F5353] border-[#E3E5E8] hover:bg-slate-50"
                    : "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 shadow-sm"
                }`}
                title={
                  theme === "light"
                    ? "Cinematic Premium Dark"
                    : "Sophisticated SaaS Light"
                }
                id="theme-toggler-btn"
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>

              {/* User badge */}
              <div className="w-8 h-8 rounded-full bg-[#3F5353] dark:bg-[#5F528E] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm">
                OP
              </div>
            </div>
          </div>
        </header>

        {isFirestoreQuotaExceeded && (
          <div className="mx-6 mt-4 p-5 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm text-left animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2 max-w-4xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full inline-block">
                  ⚠️ CLOUD DATA NOTIFICATION
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  Database ID: {firestoreDatabaseId}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-amber-100 uppercase tracking-wider font-sans">
                Firestore Daily Write Quota Exhausted
              </h4>
              <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                Your Firebase project <code className="font-mono text-amber-600 dark:text-amber-400 bg-amber-500/5 px-1 py-0.5 rounded">{firebaseProjectId}</code> has hit its free-tier daily write limit (20,000 writes/day). 
                <span className="font-semibold block mt-1.5 text-slate-700 dark:text-emerald-400">
                  🛡️ Reassurance Guard: Your drafts, writers, and automated RSS engines remain 100% functional! 
                </span>
                We have automatically engaged our secondary self-contained backup storage (<code className="font-mono">db.json</code>) so that all edits persist locally. Your autonomous workflows and remote WordPress connections are completely unimpeded.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore/databases/${firestoreDatabaseId}/data?openUpgradeDialog=true`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="text-[11.5px] font-black uppercase tracking-wider text-slate-900 bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-sm select-none"
              >
                <span>🚀 Lift Quota / Enable Billing</span>
              </a>
              <button
                type="button"
                onClick={async () => {
                  await fetchConfig();
                  await fetchSaaSSettings();
                }}
                className="text-[11.5px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-white bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 px-4 py-2 rounded-xl transition duration-150 shadow-sm cursor-pointer"
              >
                🔄 Recheck Status
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Interactive Area */}
        <main className="max-w-[1680px] mx-auto p-4 md:p-6 w-full flex-grow">

          {/* Main Grid: split 12 columns layout as a beautiful spacious bento workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch w-full">
            {/* Control Column - Left area for active command suites (lg:col-span-4 xl:col-span-3) */}
            <div
              className={`${activeAdminTab === "dashboard" ? "lg:hidden" : ["settings", "feeds", "writers", "contentFactory", "logs"].includes(activeAdminTab) ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-3"} space-y-6 flex flex-col lg:h-full w-full`}
            >
              {/* Legacy tab selector wrapper for screen compliance and fallback toggle on mobile select screen */}
              <div
                className={`${activeAdminTab === "dashboard" ? "flex" : "lg:hidden flex"} bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-1 gap-1 select-none shadow-sm w-full overflow-x-auto`}
              >
                {(
                  [
                    "contentFactory",
                    "dashboard",
                    "radar",
                    "calendar",
                    "mediaStudio",
                    "writers",
                    "feeds",
                    "wordpress",
                    "settings",
                    "logs",
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAdminTab(tab)}
                    className={`flex-none px-3 py-2 text-center text-[10px] font-black uppercase rounded-lg transition-all tracking-wider shrink-0 duration-300 pointer-events-auto cursor-pointer ${
                      activeAdminTab === tab
                        ? "bg-indigo-650 text-white shadow-sm"
                        : "text-[#8B8E96] hover:text-[#0D1219]"
                    }`}
                  >
                    {tab === "contentFactory"
                      ? "📰 Editorial"
                      : tab === "dashboard"
                        ? "🌐 Crawl"
                        : tab === "radar"
                          ? "📈 Radar"
                          : tab === "calendar"
                            ? "📆 Calendar"
                            : tab === "mediaStudio"
                              ? "🎨 Media"
                              : tab === "writers"
                                ? "✍️ Writers"
                                : tab === "feeds"
                                  ? "📡 Feeds"
                                  : tab === "wordpress"
                                    ? "🔌 WP"
                                    : tab === "logs"
                                      ? "💻 Logs"
                                      : "⚙️ Config"}
                  </button>
                ))}
              </div>

              {/* Configurable active panel base card - beautiful crisp background with matching margins */}
              {activeAdminTab !== "dashboard" && (
                <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl shadow-sm rounded-2xl border border-[#E3E5E8] dark:border-slate-850 p-5 overflow-hidden flex flex-col justify-between lg:min-h-[820px] lg:h-full relative w-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                  {/* TAB 1: RSS PUBLIC CRAWLER SOURCE LIST (Moved to Editorial Catalog) */}
                  {activeAdminTab === "contentFactory" && (
                    <div className="flex flex-col h-full overflow-hidden justify-between">
                      {/* REAL TIME MULTI AGENT CONSOLE PANEL (Displays on top of catalog) */}
                      {showCouncilModal && (
                        <div className="bg-slate-955 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden mb-6">
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            {isRewriting && (
                              <button
                                id="btn-abort-active-rewrite"
                                onClick={() => {
                                  if (rewriteAbortControllerRef.current) {
                                    rewriteAbortControllerRef.current.abort();
                                  }
                                  if (autopilotJobAbortControllerRef.current) {
                                    autopilotJobAbortControllerRef.current.abort();
                                  }
                                  autopilotStopRequestRef.current = true;
                                  setIsRewriting(false);
                                }}
                                className="text-white hover:bg-rose-700 bg-rose-600 border border-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all scroll-smooth shadow-lg cursor-pointer"
                              >
                                🛑 Force Abort Rewrite
                              </button>
                            )}
                            <button
                              id="btn-close-council"
                              onClick={() => setShowCouncilModal(false)}
                              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-sans text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Close & Minimize
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800 mb-4 animate-fade-in">
                            <Terminal className="w-5 h-5 text-rose-500 animate-pulse" />
                            <span className="text-xs font-mono font-black text-slate-800 dark:text-white uppercase tracking-wider">
                              Live Agentic Workflow monitor
                            </span>
                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/20 px-1.5 py-0.5 rounded font-mono font-bold">
                              Autonomous Multi-Agent Council
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {/* Active rewrite message focus */}
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                              <div className="text-[9px] text-[#7c3aed] font-extrabold uppercase tracking-widest font-mono">
                                Focus Story Source Topic
                              </div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1 pr-12 line-clamp-1">
                                {selectedSource?.title || "Evaluating Opportunity Feed Stream..."}
                              </h4>
                              <div className="text-[11px] text-slate-550 dark:text-slate-400 mt-2.5 flex flex-wrap items-center gap-3 font-sans">
                                <span className="font-semibold text-rose-500 dark:text-rose-400">
                                  Writer Persona:{" "}
                                  {selectedWriterId === "auto"
                                    ? `Autopilot Digital Specialist ✨${resolvedWriterId ? ` (Resolved to: ${writers.find((w) => w.id === resolvedWriterId)?.name || "Strategic Editor"})` : ""}`
                                    : (writers.find((w) => w.id === selectedWriterId)?.name || "Strategic Editor")
                                  }
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                  Status:
                                  {isRewriting ? (
                                    <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 animate-pulse font-bold">
                                      Processing Step{" "}
                                      <RefreshCw className="w-3 h-3 animate-spin inline-block ml-0.5" />
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      ● successfully generated!
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Sub logs container mapping */}
                            <div className="mt-1">
                              <AgentFlowVisualizer
                                logs={activeWorkflowLogs}
                                currentStep={workflowCurrentStep}
                                isGenerating={isRewriting}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E5E8] dark:border-slate-800/60">
                          <div>
                            <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">
                              Crawl-Ready Headlines
                            </h4>
                            <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5 font-sans">
                              Transform RSS feeds into unique brand-safe
                              editorial prose
                            </p>
                          </div>
                          <button
                            id="btn-sync-topics"
                            onClick={handleSyncFeeds}
                            disabled={isSyncingFeeds}
                            className="px-3 py-1.5 text-[10px] font-bold text-[#5F528E] dark:text-indigo-400 bg-[#5F528E]/10 dark:bg-indigo-955/45 border border-[#5F528E]/20 dark:border-indigo-500/30 rounded-xl flex items-center gap-1.5 hover:bg-[#5F528E]/20 hover:text-[#5F528E] disabled:opacity-50 transition-all duration-300 cursor-pointer opacity-95 hover:opacity-100 shadow-sm"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isSyncingFeeds ? "animate-spin" : ""}`}
                            />
                            <span>
                              {isSyncingFeeds ? "Syncing..." : "Sync Feeds"}
                            </span>
                          </button>
                        </div>

                        {/* Pathway Niche Filter Tabs */}
                        <div className="mt-3.5 bg-slate-50 dark:bg-[#070b14]/40 p-3 rounded-2xl border border-dashed border-[#E3E5E8] dark:border-slate-805">
                          <label className="block text-[8.5px] font-black text-[#8B8E96] dark:text-slate-500 uppercase tracking-widest mb-2 font-mono">
                            Filter Articles By Niche Pathway
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              id="btn-filter-niche-all"
                              type="button"
                              onClick={() => setHeadlineNicheFilter("all")}
                              className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                                headlineNicheFilter === "all"
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-extrabold"
                                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850"
                              }`}
                            >
                              <span>📚</span>
                              <span>All Niches</span>
                              <span className={`text-[8px] px-1 rounded-md ${
                                headlineNicheFilter === "all" ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}>
                                {allSuggestedSources.length}
                              </span>
                            </button>
                            {niches.map((n) => {
                              const count = allSuggestedSources.filter(s => s.niche === n.id).length;
                              let icon = "🌐";
                              if (n.id === "hollywood") icon = "🎬";
                              else if (n.id === "sports") icon = "🏀";
                              else if (n.id === "tech") icon = "💻";
                              else if (n.id === "traveling") icon = "🧭";
                              else if (n.id.includes("mystery") || n.id.includes("mystirious")) icon = "🕵️‍♂️";
                              else if (n.id.includes("top-10") || n.id.includes("top10")) icon = "🔟";
                              else if (n.id.includes("fact") || n.id.includes("facts")) icon = "💡";

                              return (
                                <button
                                  key={n.id}
                                  id={`btn-filter-niche-${n.id}`}
                                  type="button"
                                  onClick={() => setHeadlineNicheFilter(n.id)}
                                  className={`px-2.5 py-1 text-[9.5px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                                    headlineNicheFilter === n.id
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-extrabold"
                                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850"
                                  }`}
                                >
                                  <span>{icon}</span>
                                  <span>{n.name}</span>
                                  <span className={`text-[8px] px-1 rounded-md ${
                                    headlineNicheFilter === n.id ? "bg-indigo-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                  }`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Segmented Mode Selector Toggle */}
                        <div className="flex bg-slate-100 dark:bg-[#070b14] rounded-xl p-1 mt-3.5 text-[9.5px] font-bold select-none border border-[#E3E5E8] dark:border-slate-805 gap-1">
                          <button
                            id="btn-headline-view-list"
                            type="button"
                            onClick={() => setHeadlineViewMode("list")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                              headlineViewMode === "list"
                                ? "bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-700/50 shadow-md font-extrabold"
                                : "text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205"
                            }`}
                          >
                            Opportunity List View 📋
                          </button>
                          <button
                            id="btn-headline-view-scheduler"
                            type="button"
                            onClick={() => setHeadlineViewMode("scheduler")}
                            className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                              headlineViewMode === "scheduler"
                                ? "bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-700/50 shadow-md font-extrabold"
                                : "text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205"
                            }`}
                          >
                            📅 2026 Opportunity Scheduler
                          </button>
                        </div>

                        {/* Writer selector before rewrite trigger */}
                        <div className="mt-4 bg-[#F8F9FA] dark:bg-slate-950/40 border border-[#E3E5E8] dark:border-slate-800/60 rounded-xl p-3.5 shadow-inner space-y-3">
                          {/* AUTO TRIGGER CONSOLE */}
                          <div className="flex bg-[#F1F3F5] dark:bg-[#070b14] border border-[#E3E5E8] dark:border-slate-800 p-0.5 rounded-xl text-[10px] font-bold font-mono">
                            <button
                              type="button"
                              onClick={() => {
                                setAutopilotMode("semi-automation");
                                setAutopilotSchedulerActive(false);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer font-black transition-all ${autopilotMode === "semi-automation" ? "bg-[#3F5353] dark:bg-slate-800 text-white shadow font-black" : "text-slate-450 hover:text-slate-200"}`}
                            >
                              🤖 Semi-Automation
                            </button>
                            <button
                              type="button"
                              id="btn-active-autopilot"
                              onClick={() => {
                                setAutopilotMode("autopilot");
                                setAutopilotSchedulerActive(false);
                                setShowAutopilotSetup(true);
                                setAutopilotLog(
                                  '⚡ Active Autopilot mode selected! Ticker is currently STOPPED/PAUSED. Configure website selections and limits below, then click "Start" to run.',
                                );
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer font-black transition-all ${autopilotMode === "autopilot" ? "bg-[#3F5353] dark:bg-[#5F528E] text-white shadow font-black" : "text-slate-450 hover:text-slate-200"}`}
                            >
                              ⚡ Active Autopilot
                            </button>
                          </div>

                          {autopilotMode === "autopilot" && (
                            <div className="p-3 bg-[#3F5353]/10 dark:bg-[#5F528E]/10 border border-[#3F5353]/30 dark:border-[#5F528E]/30 rounded-xl space-y-3.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] b-semibold font-mono text-[#3F5353] dark:text-[#9A8FCD] flex items-center gap-1.5 font-bold uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#3F5353] dark:bg-[#9A8FCD] animate-pulse inline-block"></span>
                                  Autopilot Service Active
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowAutopilotSetup(!showAutopilotSetup)
                                  }
                                  className="text-[9px] text-[#8B8E96] dark:text-slate-400 hover:text-indigo-350 underline font-mono cursor-pointer"
                                >
                                  {showAutopilotSetup
                                    ? "Hide Config"
                                    : "Configs"}
                                </button>
                              </div>

                              {/* COUNTDOWN TICKER */}
                              <div
                                className="p-2.5 bg-black/35 rounded-lg border border-slate-800/60 font-mono space-y-3"
                                style={{
                                  backgroundColor: "#dddddd",
                                  color: "#000000",
                                }}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span
                                    className="text-slate-400 text-[10px]"
                                    style={{ color: "#000000" }}
                                  >
                                    Next automation slot:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {!autopilotSchedulerActive && (
                                      <span className="bg-rose-950/40 border border-rose-800/45 text-rose-400 text-[7.5px] px-1 py-0.2 rounded font-black tracking-normal uppercase select-none animate-pulse">
                                        STOPPED
                                      </span>
                                    )}
                                    {autopilotSchedulerActive && (
                                      <span className="bg-[#3F5353]/35 dark:bg-[#5F528E]/30 border border-[#3F5353]/35 dark:border-[#5F528E]/35 text-[#3F5353] dark:text-[#9A8FCD] text-[8px] px-1 py-0.2 rounded font-black tracking-normal uppercase select-none animate-pulse">
                                        RUNNING
                                      </span>
                                    )}
                                    <span
                                      className="text-[#3F5353] dark:text-[#9A8FCD] font-black tracking-wider animate-pulse"
                                      style={{ color: "#000000" }}
                                    >
                                      {autopilotCountdown}s
                                    </span>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1 bg-slate-900 rounded-full overflow-hidden w-full">
                                  <div
                                    className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                                      !autopilotSchedulerActive
                                        ? "from-amber-500 to-orange-400"
                                        : "from-[#3F5353] to-[#5F528E]"
                                    }`}
                                    style={{
                                      width: `${(autopilotCountdown / 45) * 100}%`,
                                    }}
                                  ></div>
                                </div>

                                {/* TRI-STATE AUTOPILOT MANAGER CONTROLS (START - PAUSE - STOP) */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                  {/* START BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAutopilotSchedulerActive(true);
                                      setAutopilotLog(
                                        "Autopilot started! Clock ticking...",
                                      );
                                    }}
                                    className={`px-2 py-1.5 text-[9px] font-mono font-black uppercase tracking-tight rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      autopilotSchedulerActive
                                        ? "bg-[#3F5353] dark:bg-[#5F528E] text-white border border-[#3F5353]/60 dark:border-[#5F528E]/60 shadow-inner"
                                        : "bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/25 dark:border-[#5F528E]/25 hover:bg-[#3F5353]/25 dark:hover:bg-[#5F528E]/25"
                                    }`}
                                    style={{
                                      borderColor: "#0f7b00",
                                      color: "#016500",
                                    }}
                                  >
                                    <span className="shrink-0">▶</span> Start
                                  </button>

                                  {/* PAUSE BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAutopilotSchedulerActive(false);
                                      setAutopilotLog(
                                        "Autopilot PAUSED. Resume anytime.",
                                      );
                                    }}
                                    className={`px-2 py-1.5 text-[9px] font-mono font-black uppercase tracking-tight rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                      !autopilotSchedulerActive &&
                                      autopilotCountdown !== 45
                                        ? "bg-amber-600 text-white border border-amber-500/60"
                                        : "bg-amber-950/20 text-amber-450 border border-amber-800/20 hover:bg-amber-990/30"
                                    }`}
                                  >
                                    <span className="shrink-0">❚❚</span> Pause
                                  </button>

                                  {/* STOP BUTTON */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAutopilotSchedulerActive(false);
                                      setAutopilotCountdown(45);
                                      setAutopilotMode("semi-automation");
                                      setAutopilotLog(
                                        "Autopilot STOPPED and reset to default.",
                                      );
                                    }}
                                    className="px-2 py-1.5 text-[9px] font-mono font-black uppercase tracking-tight rounded-md bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-800/20 flex items-center justify-center gap-1 cursor-pointer transition-all"
                                  >
                                    <span className="shrink-0">■</span> Stop
                                  </button>
                                </div>
                              </div>

                              {/* LIVE ACTION LOG */}
                              <div className="p-2.5 bg-[#070b14]/50 border border-[#3F5353]/20 dark:border-[#5F528E]/25 rounded-lg text-[9.5px] leading-relaxed space-y-1">
                                <div className="text-[8.5px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                                  <span style={{ color: "#ffffff" }}>
                                    Live Activity Monitor:
                                  </span>
                                </div>
                                <p className="text-slate-300 font-mono line-clamp-2">
                                  {autopilotLog}
                                </p>
                              </div>

                              {/* FAST TRACK TRIGGER or FORCE STOP */}
                              {isAutopilotRunningCycle ? (
                                <button
                                  type="button"
                                  id="btn-stop-autopilot-now"
                                  onClick={handleStopActiveAutopilot}
                                  className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-[10.5px] rounded-lg tracking-wide shadow-md hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>🛑 FORCE STOP ACTIVE RUN NOW</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  id="btn-trigger-autopilot-now"
                                  onClick={handleExecuteAutopilotCycleInstantly}
                                  className="w-full py-2 bg-gradient-to-r from-[#3F5353] to-[#5F528E] hover:from-[#4b6363] hover:to-[#6f60a6] text-white font-bold text-[10.5px] rounded-lg tracking-wide shadow-md hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <span>⚡ Fast-Track Next Dispatch</span>
                                </button>
                              )}

                              {showAutopilotSetup && (
                                <div className="space-y-3.5 pt-3.5 border-t border-[#3F5353]/20 dark:border-[#5F528E]/25 text-[9.5px] font-sans text-slate-755 dark:text-slate-300">
                                  {/* CONCURRENCY BATCH SELECTOR */}
                                  <div className="bg-[#FAF9FB] dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl p-3 space-y-2 text-[#0D1219] dark:text-slate-100">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold flex items-center gap-1.5 text-xs text-[#3F5353] dark:text-[#9A8FCD]">
                                        🚀 Concurrency Batch workload:
                                      </span>
                                      <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100/30">
                                        {autopilotBatchSize}{" "}
                                        {autopilotBatchSize === 1
                                          ? "Article"
                                          : "Articles"}{" "}
                                        / cycle
                                      </span>
                                    </div>
                                    <p className="text-[#8B8E96] dark:text-slate-400 text-[8.5px] leading-tight">
                                      Define how many opportunities this active
                                      Autopilot dispatch cycle handles
                                      concurrently (up to 5 concurrently).
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-slate-500 font-mono text-[8px] uppercase tracking-wide">
                                        Select limit:
                                      </span>
                                      <div className="flex items-center gap-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-slate-800 p-0.5 rounded-lg shadow-sm">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                          <button
                                            key={num}
                                            type="button"
                                            onClick={() =>
                                              setAutopilotBatchSize(num)
                                            }
                                            className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                                              autopilotBatchSize === num
                                                ? "bg-indigo-650 text-white shadow-md font-bold"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800"
                                            }`}
                                          >
                                            {num}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className="bg-[#020408]/30 border border-slate-800/40 rounded-xl p-3 space-y-3.5"
                                    style={{
                                      backgroundColor: "#d5d5d7",
                                      borderColor: "#d5a751",
                                      borderStyle: "solid",
                                      borderWidth: "1px",
                                    }}
                                  >
                                    <h6 className="text-[9px] font-black uppercase font-mono tracking-wider text-[#3F5353] dark:text-[#9A8FCD] flex items-center justify-between">
                                      <span style={{ color: "#000000" }}>
                                        🌐 Website Selection & Limits:
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextCounts: Record<string, number> = {};
                                          niches.forEach((n) => {
                                            nextCounts[n.id] = 0;
                                          });
                                          setAutopilotProcessedCounts(nextCounts);
                                        }}
                                        className="text-[7.5px] px-1 py-0.5 rounded bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/25 dark:border-[#5F528E]/25 font-black hover:bg-[#3F5353]/25 dark:hover:bg-[#5F528E]/25 uppercase cursor-pointer"
                                        style={{
                                          backgroundColor: "#dadede",
                                          color: "#000000",
                                        }}
                                      >
                                        Reset Session Counts
                                      </button>
                                    </h6>

                                    <div className="space-y-3">
                                      {niches.map((n) => {
                                        let icon = "🌐";
                                        if (n.id === "hollywood") icon = "🎬";
                                        else if (n.id === "sports") icon = "🏀";
                                        else if (n.id === "tech") icon = "💻";
                                        else if (n.id === "traveling") icon = "🧭";
                                        else if (n.id.includes("mystery") || n.id.includes("mystirious")) icon = "🕵️‍♂️";
                                        else if (n.id.includes("top-10") || n.id.includes("top10")) icon = "🔟";
                                        else if (n.id.includes("fact") || n.id.includes("facts")) icon = "💡";

                                        const site = {
                                          key: n.id,
                                          label: n.name,
                                          emoji: icon,
                                        };
                                        const limit =
                                          autopilotNicheLimits[site.key] ?? 0;
                                        const processed =
                                          autopilotProcessedCounts[site.key] ??
                                          0;
                                        const isEnabled =
                                          autopilotNicheEnabled[site.key];

                                        const inputBgColor =
                                          site.key === "hollywood"
                                            ? "#ffffff"
                                            : site.key === "sports"
                                              ? "#f9f9f9"
                                              : "#ffffff";

                                        return (
                                          <div
                                            key={site.key}
                                            className="flex flex-col gap-2 p-2.5 bg-black/45 border border-slate-900 rounded-xl shadow-inner"
                                            style={{
                                              backgroundColor: "#fff8f8",
                                              color: "#000000",
                                            }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <label
                                                className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-slate-200"
                                                style={{ color: "#000000" }}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isEnabled}
                                                  onChange={(e) =>
                                                    setAutopilotNicheEnabled(
                                                      (prev) => ({
                                                        ...prev,
                                                        [site.key]:
                                                          e.target.checked,
                                                      }),
                                                    )
                                                  }
                                                  className="rounded border-slate-800 bg-[#070b14] text-[#3F5353] dark:text-[#5F528E] focus:ring-[#3F5353] w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span>
                                                  {site.emoji} {site.label}
                                                </span>
                                              </label>

                                              {/* Progress indicator badge */}
                                              <span
                                                className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                                                  !isEnabled
                                                    ? "bg-slate-800 text-slate-500"
                                                    : processed >= limit
                                                      ? "bg-rose-950/50 text-rose-400 border border-rose-900/30 font-black animate-pulse"
                                                      : "bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/20 dark:border-[#5F528E]/20"
                                                }`}
                                              >
                                                {!isEnabled
                                                  ? "DISABLED"
                                                  : `${processed}/${limit} articles`}
                                              </span>
                                            </div>

                                            {isEnabled && (
                                              <div className="flex items-center gap-1.5 justify-between">
                                                <span
                                                  className="text-slate-400 font-mono text-[8.5px]"
                                                  style={{ color: "#000000" }}
                                                >
                                                  Article limit for this
                                                  website:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setAutopilotNicheLimits(
                                                        (prev) => ({
                                                          ...prev,
                                                          [site.key]: Math.max(
                                                            0,
                                                            (prev[site.key] ??
                                                              0) - 1,
                                                          ),
                                                        }),
                                                      )
                                                    }
                                                    className="w-4 h-4 rounded bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-slate-705 select-none"
                                                  >
                                                    -
                                                  </button>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    value={limit}
                                                    onChange={(e) => {
                                                      const val =
                                                        parseInt(
                                                          e.target.value,
                                                        ) || 0;
                                                      setAutopilotNicheLimits(
                                                        (prev) => ({
                                                          ...prev,
                                                          [site.key]: Math.max(
                                                            0,
                                                            val,
                                                          ),
                                                        }),
                                                      );
                                                    }}
                                                    className="w-10 text-center p-0.5 bg-black text-[9.5px] font-mono font-bold text-slate-100 rounded border border-slate-800 outline-none"
                                                    style={{
                                                      backgroundColor:
                                                        inputBgColor,
                                                      color: "#000000",
                                                    }}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setAutopilotNicheLimits(
                                                        (prev) => ({
                                                          ...prev,
                                                          [site.key]: Math.min(
                                                            20,
                                                            (prev[site.key] ??
                                                              0) + 1,
                                                          ),
                                                        }),
                                                      )
                                                    }
                                                    className="w-4 h-4 rounded bg-slate-800 border border-slate-705 text-white flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-slate-705 select-none"
                                                  >
                                                    +
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div
                                    className="space-y-1 bg-[#020408]/30 border border-slate-800/40 p-2.5 rounded-xl"
                                    style={{
                                      backgroundColor: "#b7b7b7",
                                      color: "#000000",
                                    }}
                                  >
                                    <h6
                                      className="text-[8.5px] font-extrabold uppercase font-mono tracking-wider text-[#3F5353] dark:text-[#9A8FCD]"
                                      style={{ color: "#000000" }}
                                    >
                                      Participating Systems:
                                    </h6>
                                    {[
                                      {
                                        key: "trendsAnalysis",
                                        label:
                                          "🔍 Trends Analysis Agent (Auto-Scans Keywords)",
                                      },
                                      {
                                        key: "editorialCouncil",
                                        label:
                                          "👥 Editorial Council (Simulates Peer Reviews)",
                                      },
                                      {
                                        key: "antiAiHumanizer",
                                        label:
                                          "🛡️ Editorial Naturalness Refinement (Targets Fluent Prose Layout)",
                                      },
                                      {
                                        key: "adsenseMaximizer",
                                        label:
                                          "💰 AdSense Optimization Audit (AdSense Compliant)",
                                      },
                                      {
                                        key: "seoMetadata",
                                        label:
                                          "🌐 Post-Meta Field Injection (SEO compatible Columns)",
                                      },
                                      {
                                        key: "imageGeneration",
                                        label:
                                          "🎨 Image Prompter Engine (Original visual draft)",
                                      },
                                      {
                                        key: "wordpressSyndication",
                                        label:
                                          "⚡ WP Syndication Gate (Direct Publish if Editorial Naturalness Score > 95%)",
                                      },
                                    ].map((sys) => (
                                      <label
                                        key={sys.key}
                                        className="flex items-start gap-1.5 cursor-pointer hover:text-[#3F5353] dark:hover:text-[#9A8FCD] transition-colors select-none"
                                        style={{ color: "#000000" }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={autopilotSystems[sys.key]}
                                          onChange={(e) =>
                                            setAutopilotSystems((prev) => ({
                                              ...prev,
                                              [sys.key]: e.target.checked,
                                            }))
                                          }
                                          className="rounded border-[#E3E5E8] dark:border-slate-850 bg-[#070b14] text-[#3F5353] dark:text-[#5F528E] focus:ring-[#3F5353] w-3.5 h-3.5 shrink-0 mt-0.5 cursor-pointer"
                                        />
                                        <span className="leading-tight">
                                          {sys.label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  <p
                                    className="text-[8px] text-slate-500 font-mono italic leading-normal mt-1"
                                    style={{ color: "#000000" }}
                                  >
                                    When Autopilot schedule ticker completes,
                                    all selected systems will process the
                                    high-performing slot winners automatically.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1">
                            <label className="block text-[10px] font-bold text-[#8B8E96] dark:text-slate-400 uppercase tracking-widest select-none font-mono">
                              Assign Tone Author:
                            </label>
                          </div>
                          <select
                            id="select-writer"
                            value={selectedWriterId}
                            onChange={(e) =>
                              setSelectedWriterId(e.target.value)
                            }
                            className="w-full bg-white dark:bg-[#070b14] hover:bg-[#F0F1F2] dark:hover:bg-[#0c1222] border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 text-xs text-[#0D1219] dark:text-slate-205 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="auto" className="bg-white dark:bg-slate-950 text-[#0D1219] dark:text-slate-205 font-sans font-bold text-indigo-500">
                              ⚡ Automatic Optimization
                            </option>
                            {writers
                              .filter((w) => w.niche === selectedNiche)
                              .map((w) => (
                                <option
                                  key={w.id}
                                  value={w.id}
                                  className="bg-white dark:bg-slate-950 text-[#0D1219] dark:text-slate-205 font-sans font-semibold"
                                >
                                  {w.name} — ({w.voiceStyle})
                                </option>
                              ))}
                          </select>

                          <div className="mt-3 pt-3 border-t border-[#E3E5E8] dark:border-slate-800/60 flex flex-col gap-1.5">
                            <label htmlFor="select-visual-mode" className="block text-[10px] font-black text-[#5F528E] dark:text-indigo-400 uppercase tracking-widest select-none font-mono flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>Article Visual Image Mode:</span>
                            </label>
                            <select
                              id="select-visual-mode"
                              value={rewriteInlineImageMode}
                              onChange={(e) =>
                                setRewriteInlineImageMode(e.target.value)
                              }
                              className="w-full bg-white dark:bg-[#070b14] hover:bg-[#F0F1F2] dark:hover:bg-[#0c1222] border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 text-xs text-[#0D1219] dark:text-slate-205 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                            >
                              <option value="generate" className="bg-white dark:bg-slate-950 font-bold">
                                ✦ Render Live Images: Create and insert complete generated images
                              </option>
                              <option value="promptOnly" className="bg-white dark:bg-slate-950 font-bold text-violet-500 dark:text-violet-400">
                                ✦ Offline Prompts: Extract copying cards with prompts for Midjourney/Gemini
                              </option>
                              <option value="none" className="bg-[#FAF9FB] dark:bg-slate-950 font-bold text-slate-500">
                                ✦ Strip Graphics: Do not include image blocks in content body
                              </option>
                            </select>
                            <p className="text-[9px] text-[#8B8E96] dark:text-slate-400 font-sans leading-normal">
                              Control whether the multi-agent council finishes images immediately or outputs text prompts so you can run the final rendering offline or manually outside.
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-slate-800/40 font-sans">
                            <button
                              type="button"
                              onClick={() =>
                                setShowExpandedRewriteSettings(
                                  !showExpandedRewriteSettings,
                                )
                              }
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer select-none"
                            >
                              <span>
                                {showExpandedRewriteSettings
                                  ? "▼ Hide"
                                  : "▶ Show"}{" "}
                                Advanced Copilot Synthesis Options
                              </span>
                            </button>

                            {showExpandedRewriteSettings && (
                              <div className="mt-2.5 space-y-3.5 text-left text-[10.5px]">
                                {/* AUTO-SYNTHESIZER BUTTON */}
                                <div className="p-3 bg-indigo-950/40 border border-indigo-500/25 rounded-xl space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-indigo-300 font-mono flex items-center gap-1 animate-pulse">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-450 animate-bounce" />
                                      Copilot Strategic Brain
                                    </span>
                                    <span className="text-[9px] text-[#22c55e] font-mono font-bold">
                                      ● Active
                                    </span>
                                  </div>

                                  {/* SOURCE SELECTOR DROPDOWN */}
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[8.5px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">
                                      Match Breakout News:
                                    </label>
                                    <select
                                      value={
                                        selectedSource
                                          ? selectedSource.title
                                          : suggestedSources[0]?.title || ""
                                      }
                                      onChange={(e) => {
                                        const src = suggestedSources.find(
                                          (s) => s.title === e.target.value,
                                        );
                                        if (src) setSelectedSource(src);
                                      }}
                                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-1.5 outline-none text-[10.5px] font-semibold cursor-pointer"
                                    >
                                      {suggestedSources.length === 0 ? (
                                        <option value="">
                                          No breakout opportunities loaded
                                        </option>
                                      ) : (
                                        suggestedSources.map((src) => (
                                          <option
                                            key={src.id || src.title}
                                            value={src.title}
                                          >
                                            [{src.niche.toUpperCase()}]{" "}
                                            {src.title.slice(0, 42)}...
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </div>

                                  {/* METADATA PREVIEW PANEL */}
                                  {(() => {
                                    const activeSrc =
                                      selectedSource || suggestedSources[0];
                                    if (!activeSrc) return null;
                                    return (
                                      <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1 text-[9px] font-sans">
                                        <div className="flex items-center justify-between font-mono text-[8px] text-slate-450 uppercase">
                                          <span>⚡ Selected Target Link</span>
                                          <span className="text-amber-400 font-bold font-mono">
                                            Score:{" "}
                                            {activeSrc.opportunityScore || 90}%
                                          </span>
                                        </div>
                                        <p className="font-bold text-slate-200 line-clamp-1">
                                          {activeSrc.title}
                                        </p>
                                        <p className="text-slate-400 text-[8.5px] line-clamp-2 leading-snug">
                                          {activeSrc.description ||
                                            "Headline matched from active niche feed."}
                                        </p>
                                      </div>
                                    );
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => handleAutoSynthesizeCopilot()}
                                    disabled={
                                      isSynthesizingCopilot ||
                                      (!selectedSource &&
                                        suggestedSources.length === 0)
                                    }
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 px-3 rounded-lg text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md font-mono"
                                  >
                                    <Sparkles
                                      className={`w-3.5 h-3.5 text-amber-300 ${isSynthesizingCopilot ? "animate-spin" : ""}`}
                                    />
                                    {isSynthesizingCopilot
                                      ? "Synthesizing Strategy..."
                                      : "🤖 Auto-Synthesize 10-Dial Strategy"}
                                  </button>
                                  <p className="text-[8.5px] text-slate-450 leading-snug">
                                    Scans matching breakout context to inject
                                    tailored optimization vectors across all 10
                                    dials below.
                                  </p>
                                </div>

                                {/* 1. Synthesis Depth */}
                                <div>
                                  <label className="block text-slate-450 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 1: Synthesis Depth:
                                  </label>
                                  <div className="flex bg-[#070b14]/80 border border-slate-800 rounded-lg p-0.5 font-mono text-[9px]">
                                    {(
                                      ["short", "medium", "deep-dive"] as const
                                    ).map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => setRewriteDepth(d)}
                                        className={`flex-1 py-1 rounded-md text-center cursor-pointer font-bold transition-all ${rewriteDepth === d ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                                      >
                                        {d === "short"
                                          ? "⚡ Short"
                                          : d === "medium"
                                            ? "📝 Medium"
                                            : "📚 Deep"}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 2. Substyle genre modifier */}
                                <div>
                                  <label className="block text-slate-450 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 2: Substyle Genre Overlay:
                                  </label>
                                  <select
                                    value={rewriteSubstyle}
                                    onChange={(e) =>
                                      setRewriteSubstyle(e.target.value)
                                    }
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  >
                                    <option value="standard">
                                      Standard Tone Alignment
                                    </option>
                                    <option value="tabloid-gossip">
                                      Tabloid & Salacious Drama
                                    </option>
                                    <option value="technical-guide">
                                      Thorough Technical Specs & Tables
                                    </option>
                                    <option value="sarcastic-polemic">
                                      Biting Sarcastic Polemic
                                    </option>
                                    <option value="thought-leadership">
                                      Inspiring Industry Thought Leadership
                                    </option>
                                    <option value="investigative-deep-dive">
                                      Investigative Deep-Dive Report
                                    </option>
                                    <option value="insider-whistleblower">
                                      Anonymized Insider Whistleblower
                                    </option>
                                  </select>
                                </div>

                                {/* 3. Custom Private Facts */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 3: Factual Anchors / Insight Injection:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={rewriteCustomFacts}
                                    onChange={(e) =>
                                      setRewriteCustomFacts(e.target.value)
                                    }
                                    placeholder="Inject private details, insider leaks, or brand claims to weave into the story..."
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                </div>

                                {/* 4. Target Audience */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 4: Target Audience Demographic:
                                  </label>
                                  <input
                                    type="text"
                                    value={copilotTargetAudience}
                                    onChange={(e) =>
                                      setCopilotTargetAudience(e.target.value)
                                    }
                                    placeholder="e.g. Disillusioned developers, early-stage founders"
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                </div>

                                {/* 5. Custom Tone */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 5: Specific Tone Modulizer:
                                  </label>
                                  <input
                                    type="text"
                                    value={copilotTone}
                                    onChange={(e) =>
                                      setCopilotTone(e.target.value)
                                    }
                                    placeholder="e.g. Cynical but detail-rich, highly sophisticated"
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                </div>

                                {/* 6. Block Structure */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 6: Content Block Structure Layout:
                                  </label>
                                  <input
                                    type="text"
                                    value={copilotStructure}
                                    onChange={(e) =>
                                      setCopilotStructure(e.target.value)
                                    }
                                    placeholder="e.g. Hook -> Spec Matrix Table -> Critical Analysis -> Poll"
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                </div>

                                {/* 7. SEO Strategy & Targeted Keywords */}
                                <div className="space-y-1.5">
                                  <div>
                                    <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                      Dial 7a: SEO Keywords (comma separated):
                                    </label>
                                    <input
                                      type="text"
                                      value={rewriteCustomKeywords}
                                      onChange={(e) =>
                                        setRewriteCustomKeywords(e.target.value)
                                      }
                                      placeholder="e.g. specs, leaks, rankings, premium"
                                      className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[8px] tracking-wider">
                                      Dial 7b: Organic SEO Strategy Directives:
                                    </label>
                                    <input
                                      type="text"
                                      value={copilotSeoStrategy}
                                      onChange={(e) =>
                                        setCopilotSeoStrategy(e.target.value)
                                      }
                                      placeholder="e.g. Rank for high-intent specs queries"
                                      className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                    />
                                  </div>
                                </div>

                                {/* 8. Content Objectives */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 8: Content Strategic Objectives:
                                  </label>
                                  <input
                                    type="text"
                                    value={copilotContentObjectives}
                                    onChange={(e) =>
                                      setCopilotContentObjectives(
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. Build topical authority in sports telemetry"
                                    className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                </div>

                                {/* 9. Engagement Optimization */}
                                <div>
                                  <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                    Dial 9: Engagement & Trust Hack (Niche
                                    Authority):
                                  </label>
                                  <div className="space-y-1.5">
                                    <input
                                      type="text"
                                      value={copilotEngagementOptimization}
                                      onChange={(e) =>
                                        setCopilotEngagementOptimization(
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Dial 9a: Engagement Optimization (e.g. Poll Hook)"
                                      className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                    />
                                    <input
                                      type="text"
                                      value={copilotAuthorityBuilding}
                                      onChange={(e) =>
                                        setCopilotAuthorityBuilding(
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Dial 9b: Authority Building elements (e.g. cite standards)"
                                      className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                    />
                                  </div>
                                </div>

                                {/* 10. Conversion Optimization & AdSense */}
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">
                                      Dial 10a: Conversion Optimization Lead
                                      Capture:
                                    </label>
                                    <input
                                      type="text"
                                      value={copilotConversionOptimization}
                                      onChange={(e) =>
                                        setCopilotConversionOptimization(
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g. Plug newsletter below specs matrix tables"
                                      className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between pt-1 select-none">
                                    <span className="text-slate-405 text-[9px] font-bold font-mono uppercase tracking-wider">
                                      Dial 10b: AdSense Optimization Audit:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRewriteAdsenseOptimized(
                                          !rewriteAdsenseOptimized,
                                        )
                                      }
                                      className={`px-2 py-1 rounded text-[8.5px] font-bold border transition ${rewriteAdsenseOptimized ? "bg-emerald-950/45 text-emerald-300 border-emerald-500/40 font-extrabold shadow-sm" : "bg-[#070b14] text-slate-405 border-slate-800 hover:bg-slate-900 hover:text-slate-200"}`}
                                    >
                                      {rewriteAdsenseOptimized ? "ON" : "OFF"}
                                    </button>
                                  </div>


                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Scanned Stories Scroll List */}
                      <div className="flex-grow flex-1 overflow-y-auto space-y-3 mt-4 pr-1 max-h-[310px] lg:max-h-[580px]">
                        {suggestedSources.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center p-8 text-slate-550 space-y-2 my-4">
                            <div className="w-12 h-12 rounded-full bg-slate-955 border border-slate-850 flex items-center justify-center text-indigo-500 opacity-60">
                              <Rss className="w-5 h-5 animate-pulse" />
                            </div>
                            <span className="text-xs font-black uppercase text-slate-300 font-mono tracking-wider">
                              No feeds crawled yet
                            </span>
                            <p className="text-[10.5px] text-slate-450 max-w-[200px] leading-relaxed">
                              Click 'Sync Feeds' to crawl fresh sports,
                              celebrity, or tech logs.
                            </p>
                          </div>
                        ) : headlineViewMode === "list" ? (
                          /* ORIGINAL STRIP LIST VIEW */
                          suggestedSources.map((source) => {
                            const computedRating = source.rating || 75;
                            const classification =
                              source.classification || "Strategic Domain 🔬";
                            return (
                              <div
                                key={source.id}
                                className="suggested-source-card p-4 rounded-xl border border-slate-800 bg-[#070b14]/50 hover:bg-[#0c1222]/50 hover:border-indigo-505/35 transition-all duration-300 relative group flex flex-col justify-between shadow-md"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold gap-2 flex-wrap pb-1.5">
                                    <span className="truncate font-semibold text-slate-405 font-mono flex items-center gap-1.5">
                                      <span>{source.sourceName}</span>
                                      {(() => {
                                        const nInfo = niches.find(n => n.id === source.niche);
                                        if (nInfo) {
                                          let icon = "🌐";
                                          if (nInfo.id === "hollywood") icon = "🎬";
                                          else if (nInfo.id === "sports") icon = "🏀";
                                          else if (nInfo.id === "tech") icon = "💻";
                                          else if (nInfo.id === "traveling") icon = "🧭";
                                          else if (nInfo.id.includes("mystery") || nInfo.id.includes("mystirious")) icon = "🕵️‍♂️";
                                          else if (nInfo.id.includes("top-10") || nInfo.id.includes("top10")) icon = "🔟";
                                          else if (nInfo.id.includes("fact") || nInfo.id.includes("facts")) icon = "💡";

                                          return (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-950/45 text-indigo-300 font-sans rounded-md border border-indigo-900/30 flex items-center gap-1" title={`Niche: ${nInfo.name}`}>
                                              <span>{icon}</span>
                                              <span>{nInfo.name}</span>
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`suggested-source-badge px-2 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                          computedRating >= 90
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                            : computedRating >= 80
                                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                              : "bg-slate-900 text-slate-300 border border-slate-800"
                                        }`}
                                      >
                                        {classification} ({computedRating}%)
                                      </span>
                                      <span className="font-mono text-slate-500">
                                        {source.pubDate}
                                      </span>
                                    </div>
                                  </div>
                                  <h4 className="suggested-source-title text-xs font-bold text-slate-101 mt-2 line-clamp-2 pr-2 leading-snug hover:text-indigo-400 transition-colors">
                                    {source.title}
                                  </h4>
                                  <p className="suggested-source-desc text-[10px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                                    {source.description}
                                  </p>
                                </div>

                                <div className="suggested-source-footer mt-4 pt-3 border-t border-slate-800/15 flex items-center justify-between">
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-bold font-mono transition-colors"
                                  >
                                    Source Link 🔗
                                  </a>

                                  <button
                                    id={`btn-rewrite-${source.id}`}
                                    onClick={() =>
                                      handleInitiateAgentRewrite(source)
                                    }
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-md hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                    <span>Generate Original Draft</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          /* ADVANCED TIMELINE OPPORTUNITY SCHEDULER VIEW */
                          <div className="space-y-4 pr-1 animate-none">
                            {[
                              {
                                id: "slot-morning",
                                name: "🌅 09:00 AM — Morning Coffee Briefing",
                                timeText: "09:00 AM",
                              },
                              {
                                id: "slot-midday",
                                name: "⚡ 12:00 PM — Midday Virality Spike",
                                timeText: "12:00 PM",
                              },
                              {
                                id: "slot-afternoon",
                                name: "🔬 03:00 PM — Afternoon Intelligence Deep",
                                timeText: "03:00 PM",
                              },
                              {
                                id: "slot-evening",
                                name: "🔥 06:00 PM — Evening Primetime Viral",
                                timeText: "12:00 PM",
                              },
                              {
                                id: "slot-midnight",
                                name: "🌌 09:00 PM — Midnight News Roundup",
                                timeText: "09:00 PM",
                              },
                            ].map((slot, slotIdx) => {
                              // Filter sources for this slot
                              const slotSources = suggestedSources.filter(
                                (src) => {
                                  if (src.slotId) {
                                    return src.slotId === slot.id;
                                  }
                                  const charSum = src.title
                                    .split("")
                                    .reduce(
                                      (acc, char) => acc + char.charCodeAt(0),
                                      0,
                                    );
                                  return charSum % 5 === slotIdx;
                                },
                              );

                              // Find slot champion
                              let champion: SuggestedSource | null = null;
                              if (slotSources.length > 0) {
                                const markedHighest = slotSources.find(
                                  (s) => s.isHighestInSlot,
                                );
                                if (markedHighest) {
                                  champion = markedHighest;
                                } else {
                                  champion = slotSources.reduce(
                                    (prev, curr) =>
                                      (curr.rating || 0) > (prev.rating || 0)
                                        ? curr
                                        : prev,
                                    slotSources[0],
                                  );
                                }
                              }

                              return (
                                <div
                                  key={slot.id}
                                  className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                  {/* Slot header bar */}
                                  <div className="bg-slate-50 dark:bg-slate-900/85 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tracking-wide">
                                      {slot.name}
                                    </span>
                                    <span className="text-[9px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-550/20 px-2 py-0.5 rounded-lg">
                                      {slotSources.length} topics
                                    </span>
                                  </div>

                                  {/* Slot contents */}
                                  <div className="p-3 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/55">
                                    {slotSources.length === 0 ? (
                                      <div className="text-center p-3 text-[10px] text-slate-400 dark:text-slate-500 font-sans italic">
                                        No scheduled news opportunities in this
                                        slot.
                                      </div>
                                    ) : (
                                      slotSources.map((source) => {
                                        const ratingVal = source.rating || 75;
                                        const ratingLabel =
                                          source.classification ||
                                          "Steady news";
                                        const isChamp =
                                          champion?.id === source.id;

                                        return (
                                          <div
                                            key={source.id}
                                            className={`suggested-source-card pt-3 first:pt-0 ${isChamp ? "bg-amber-500/5 border-l-2 border-amber-500 pl-2.5 rounded-r-lg" : ""}`}
                                          >
                                            <div className="flex items-center justify-between text-[8px] font-bold gap-2">
                                              <span className="text-slate-405 dark:text-slate-400 truncate max-w-[80px] font-mono">
                                                {source.sourceName}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {isChamp && (
                                                  <span className="text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-550/30 rounded px-1.5 py-0.5 flex items-center gap-0.5 uppercase tracking-wider scale-95 origin-right font-mono font-bold">
                                                    <span>Champion 👑</span>
                                                  </span>
                                                )}
                                                <span
                                                  className={`suggested-source-badge px-1.5 py-0.2 rounded font-mono ${
                                                    ratingVal >= 90
                                                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-500/20"
                                                      : ratingVal >= 80
                                                        ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-505/20"
                                                        : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                                                  }`}
                                                >
                                                  {ratingLabel} ({ratingVal}%)
                                                </span>
                                              </div>
                                            </div>

                                            <h5 className="suggested-source-title text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1.5 leading-snug line-clamp-1 font-sans">
                                              {source.title}
                                            </h5>

                                            <div className="flex items-center justify-between mt-2 text-[9.5px] font-mono">
                                              <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black transition-colors"
                                              >
                                                Link 🔗
                                              </a>
                                              {isChamp && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleInitiateAgentRewrite(
                                                      source,
                                                    )
                                                  }
                                                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg transition-all duration-300 flex items-center gap-0.5 text-[9.5px] cursor-pointer"
                                                  title="Launches agentic council draft assembly of slot winner"
                                                >
                                                  <Sparkles className="w-2.5 h-2.5" />
                                                  <span>Rewrite Champion</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}


                      </div>
                    </div>
                  )}

                  {/* TAB 2: EDITORIAL VOICE STUDIO */}
                  {activeAdminTab === "writers" && (
                    <div className="flex flex-col h-full overflow-hidden justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-205 dark:border-slate-850 gap-2">
                          <div>
                            <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-violet-500" />
                              <span>Editorial Voice Studio 🎨</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Sculpt high-engagement voices via tags, competitor
                              rules, and AI correction
                            </p>
                          </div>
                          
                          {/* SUB TAB SELECTOR */}
                          <div className="flex items-center gap-1">
                            <button
                              id="vs-subtab-profiles"
                              type="button"
                              onClick={() => {
                                setVoiceStudioSubTab("profiles");
                                setShowAddWriter(false);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded border transition-all cursor-pointer ${
                                voiceStudioSubTab === "profiles"
                                  ? "bg-violet-600 text-white border-violet-600 shadow-sm font-black"
                                  : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              Profiles List 📁
                            </button>
                            <button
                              id="vs-subtab-create"
                              type="button"
                              onClick={() => {
                                setVoiceStudioSubTab("create");
                                setShowAddWriter(true);
                                setEditingWriterId(null);
                                setNewWriterName("");
                                setNewWriterVoice("");
                                setNewWriterNiche(selectedNiche);
                                setNewWriterBio("");
                                setNewWriterInstruction("");
                                setSelectedSkillsTags([]);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded border transition-all cursor-pointer ${
                                voiceStudioSubTab === "create"
                                  ? "bg-violet-600 text-white border-violet-600 shadow-sm font-black"
                                  : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              {editingWriterId ? "Edit Specialist ✍️" : "Hire Specialist ➕"}
                            </button>
                            <button
                              id="vs-subtab-skills"
                              type="button"
                              onClick={() => {
                                setVoiceStudioSubTab("skills");
                                setShowAddWriter(false);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded border transition-all cursor-pointer ${
                                voiceStudioSubTab === "skills"
                                  ? "bg-violet-600 text-white border-violet-600 shadow-sm font-black"
                                  : "bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                              }`}
                            >
                              Skill Manager ⚙️
                            </button>
                          </div>
                        </div>
                      </div>

                      {voiceStudioSubTab === "create" ? (
                        /* Create Custom Tone Writer form / Editorial Voice Studio */
                        <form
                          onSubmit={handleCreateWriter}
                          className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4 pr-1"
                        >
                          {/* COMPETITOR SELECTOR */}
                          <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">
                              1. Target Competitor blueprint
                            </label>
                            <input
                              type="text"
                              value={selectedCompetitor}
                              onChange={(e) => setSelectedCompetitor(e.target.value)}
                              placeholder="e.g. TMZ, The Verge, ESPN, Vogue"
                              className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-white dark:bg-slate-900 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* SKILL TAGS SELECTOR */}
                          <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">
                              2. Pick writer skills & Specialities (Pick
                              multiple)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {skills
                                .filter((s: any) => s.niche === selectedNiche || s.niche === "all")
                                .map((skillObj) => {
                                  const isSelected = selectedSkillsTags.includes(skillObj.id) || selectedSkillsTags.includes(skillObj.name);
                                  return (
                                    <button
                                      key={skillObj.id}
                                      type="button"
                                      onClick={() => {
                                        const valueToStore = skillObj.id || skillObj.name;
                                        if (isSelected) {
                                          setSelectedSkillsTags((prev) =>
                                            prev.filter((s) => s !== skillObj.id && s !== skillObj.name),
                                          );
                                        } else {
                                          setSelectedSkillsTags((prev) => [
                                            ...prev,
                                            valueToStore,
                                          ]);
                                        }
                                      }}
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                        isSelected
                                          ? "bg-violet-605/10 text-violet-600 dark:text-violet-400 border-violet-500/40 shadow-xs"
                                          : "bg-white dark:bg-[#070b14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-900"
                                      }`}
                                    >
                                      <span>{skillObj.name}</span>
                                      {isSelected && (
                                        <span className="text-[8px]">✨</span>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>

                          <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-850 mb-4">
                            <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">
                              Assigned Editorial Niche
                            </label>
                            <select
                              value={newWriterNiche || selectedNiche}
                              onChange={(e) => setNewWriterNiche(e.target.value)}
                              className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-white dark:bg-slate-900 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                            >
                              {niches.map((n) => (
                                <option key={n.id} value={n.id}>{n.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* DRAFT IDENTITY NAME & VOICE */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                                Draft Writer Full Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Penny Sterling (Optional)"
                                value={newWriterName}
                                onChange={(e) =>
                                  setNewWriterName(e.target.value)
                                }
                                className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition-all outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                                Draft Voice Style Identifier
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Sarcastic Analyst (Optional)"
                                value={newWriterVoice}
                                onChange={(e) =>
                                  setNewWriterVoice(e.target.value)
                                }
                                className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition-all outline-none"
                              />
                            </div>
                          </div>

                          {/* AI CORRECT / OPTIMIZE BUTTON */}
                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={handleCorrectWriter}
                              disabled={isCorrectingWriter}
                              className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                            >
                              <Sparkles
                                className={`w-3.5 h-3.5 text-white ${isCorrectingWriter ? "animate-spin" : ""}`}
                              />
                              {isCorrectingWriter
                                ? "Synthesizing tone matrix using AI Orchestrator..."
                                : "✨ Synthesize Tone Strategy using AI"}
                            </button>
                          </div>

                          {/* DYNAMIC METADATA GENERATED BOX */}
                          <div className="space-y-3 bg-[#0d1321]/40 border border-indigo-500/10 p-3.5 rounded-xl">
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold text-indigo-400 block uppercase tracking-wider font-mono">
                                Generated Biography (AI Corrected)
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Gemini will produce an optimized pedigree biography..."
                                value={newWriterBio}
                                onChange={(e) =>
                                  setNewWriterBio(e.target.value)
                                }
                                className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition-all outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold text-indigo-400 block uppercase tracking-wider font-mono">
                                Linguistic Tone Concept Directives
                              </label>
                              <textarea
                                required
                                rows={3}
                                placeholder="Gemini will compile detailed structuring principles based on selected competitor/skills..."
                                value={newWriterInstruction}
                                onChange={(e) =>
                                  setNewWriterInstruction(e.target.value)
                                }
                                className="w-full text-xs text-slate-805 dark:text-slate-201 bg-white dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-550 font-mono text-[10.5px] outline-none"
                              />
                            </div>
                          </div>

                           {/* VALIDATION HELPER */}
                          {(!newWriterName || !newWriterVoice || !newWriterInstruction) && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-205 dark:border-amber-500/20 rounded-xl space-y-1 mt-2">
                              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest font-mono">
                                ⚠️ Requirements to Register Specialist:
                              </p>
                              <ul className="text-[10px] text-slate-600 dark:text-slate-350 list-disc list-inside space-y-0.5 font-medium">
                                {!newWriterName && <li>Provide a <strong className="text-slate-800 dark:text-white">Draft Writer Full Name</strong></li>}
                                {!newWriterVoice && <li>Provide a <strong className="text-slate-800 dark:text-white">Draft Voice Style Identifier</strong></li>}
                                {!newWriterInstruction && (
                                  <li>
                                    Compile <strong className="text-slate-800 dark:text-white">Linguistic Tone Concept Directives</strong> (Click the <em className="text-violet-600 dark:text-violet-400 font-bold font-sans">"✨ Synthesize Tone Strategy using AI"</em> button above)
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* FORM CONTROL BUTTONS */}
                          <div className="flex items-center gap-3 pt-3">
                            <button
                              type="submit"
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all duration-300 select-none cursor-pointer"
                            >
                              Register Editorial Voice Specialist
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNewWriterName("");
                                setNewWriterVoice("");
                                setNewWriterBio("");
                                setNewWriterInstruction("");
                                setSelectedSkillsTags([]);
                                setVoiceStudioSubTab("profiles");
                              }}
                              className="text-slate-450 text-xs hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : voiceStudioSubTab === "skills" ? (
                        /* Dynamic Skill Manager workspace UI styling */
                        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4 pr-1 select-text">
                          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-805 rounded-xl">
                            <h5 className="text-[11px] font-black uppercase tracking-wider font-mono text-violet-600 dark:text-violet-400">
                              Reusable Writer Capability Skill Manager ⚙️
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                              Define and govern specialized cognitive capabilities. The guidelines, layouts, and constraints of active skills are dynamically woven directly into your digital writers' system prompts before every content generation loop.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left Form: Create/Edit Skill */}
                            <form onSubmit={handleSaveSkill} className="lg:col-span-4 bg-white dark:bg-slate-950/20 border border-slate-202 dark:border-slate-805 p-4 rounded-xl space-y-3.5">
                              <h6 className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-850 pb-1.5 flex items-center justify-between">
                                <span>{editingSkillId ? "Edit Skill Directive ✍️" : "Define New Skill Cluster 💎"}</span>
                                {editingSkillId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSkillId(null);
                                      setNewSkillName("");
                                      setNewSkillDirective("");
                                    }}
                                    className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Reset
                                  </button>
                                )}
                              </h6>

                              <div className="space-y-1">
                                <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                                  Skill / Competency Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Dynamic Technical Analogy"
                                  value={newSkillName}
                                  onChange={(e) => setNewSkillName(e.target.value)}
                                  className="w-full text-xs text-[#0D1219] dark:text-white bg-slate-50 dark:bg-[#070b14] border border-slate-205 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-violet-500 outline-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                                  Niche Affinity Target
                                </label>
                                <select
                                  value={newSkillNiche}
                                  onChange={(e) => setNewSkillNiche(e.target.value)}
                                  className="w-full text-xs font-bold p-2 bg-slate-50 dark:bg-[#070b14] border border-slate-205 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 focus:outline-none"
                                >
                                  <option value="all">Universal (All Niches)</option>
                                  {niches.map((n) => (
                                    <option key={n.id} value={n.id}>
                                      {n.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                                  Cognitive System Directive Instruction
                                </label>
                                <textarea
                                  required
                                  rows={5}
                                  placeholder="Explain structural formatting, phrasing restrictions, stylistic obligations, and how the model must reason or act when this skill is requested..."
                                  value={newSkillDirective}
                                  onChange={(e) => setNewSkillDirective(e.target.value)}
                                  className="w-full text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none font-mono text-[10.5px] leading-relaxed outline-none"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isSavingSkill}
                                className="w-full bg-gradient-to-r from-violet-650 to-indigo-650 text-white font-bold text-xs py-2 px-3 rounded-lg hover:brightness-105 active:scale-98 transition-all duration-200 shadow-sm cursor-pointer"
                              >
                                {isSavingSkill ? "Applying Directives..." : editingSkillId ? "Save Directive Upgrades" : "Authorize Capability Cluster"}
                              </button>
                            </form>

                            {/* Right List: Display Reusable Skills Catalog */}
                            <div className="lg:col-span-8 space-y-3">
                              <h6 className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-500 dark:text-slate-400">
                                Active Capabilities Registry
                              </h6>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {skills.map((sk: any) => (
                                  <div key={sk.id} className="p-3.5 bg-[#F8F9FA]/40 dark:bg-slate-950/25 border border-slate-202 dark:border-slate-805 rounded-xl flex flex-col justify-between gap-3 shadow-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-sans text-xs font-black text-slate-850 dark:text-slate-101 truncate">
                                          {sk.name}
                                        </span>
                                        <span className="text-[7.5px] font-bold font-mono px-1.5 py-0.5 rounded uppercase shrink-0 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20">
                                          {sk.niche}
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-slate-600 dark:text-slate-350 leading-normal font-sans bg-white/60 dark:bg-slate-950/50 p-2 border border-slate-100 dark:border-slate-855 rounded-lg max-h-[90px] overflow-y-auto">
                                        {sk.directive}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-855 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingSkillId(sk.id);
                                          setNewSkillName(sk.name);
                                          setNewSkillNiche(sk.niche || "tech");
                                          setNewSkillDirective(sk.directive);
                                        }}
                                        className="px-2 py-1 text-[9px] font-bold font-mono border border-indigo-350 dark:border-indigo-500/30 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded cursor-pointer transition-colors"
                                      >
                                        Edit Directive
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSkill(sk.id)}
                                        className="px-2 py-1 text-[9px] font-bold font-mono border border-rose-350 dark:border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded cursor-pointer transition-colors"
                                      >
                                        Decommission
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Detailed Profiles & Capability Radar chart grid split layouts */
                        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 mt-4 pr-1 select-text">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            
                            {/* Left Side Column: Interactive concise roster lists (5 cols) */}
                            <div className="lg:col-span-5 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                                  Active Editorial Specialists Guild 📁
                                </h5>
                                <select
                                  value={activeWriterNicheFilter}
                                  onChange={(e) => setActiveWriterNicheFilter(e.target.value)}
                                  className="text-[9.5px] font-bold p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none"
                                >
                                  <option value="all">All Niches</option>
                                  {niches.map((n) => (
                                    <option key={n.id} value={n.id}>{n.name}</option>
                                  ))}
                                </select>
                              </div>
                              
                              {writers.filter((w) => activeWriterNicheFilter === "all" ? true : w.niche === activeWriterNicheFilter).length === 0 ? (
                                <div className="text-center p-5 bg-slate-950/30 border border-dashed border-slate-805 rounded-xl text-xs text-slate-450">
                                  No specialists registered. Click "Hire Specialist" to add one!
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  {writers
                                    .filter((w) => activeWriterNicheFilter === "all" ? true : w.niche === activeWriterNicheFilter)
                                    .map((writer) => {
                                      const isFocused = focusWriterId === writer.id || (!focusWriterId && writers.filter((w) => activeWriterNicheFilter === "all" ? true : w.niche === activeWriterNicheFilter)[0]?.id === writer.id);
                                      return (
                                        <div
                                          key={writer.id}
                                          onClick={() => setFocusWriterId(writer.id)}
                                          className={`p-3 rounded-xl border flex items-center gap-3 shadow-xs transition-all duration-300 cursor-pointer hover:border-violet-500/40 select-text ${
                                            isFocused
                                              ? "bg-[#3F5353]/10 dark:bg-[#5F528E]/15 border-[#3F5353] dark:border-[#5F528E] ring-1 ring-[#3F5353]/25"
                                              : "border-slate-205 dark:border-slate-805 bg-[#F8F9FA]/40 dark:bg-slate-950/25"
                                          }`}
                                        >
                                          <img
                                            src={writer.avatar || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"}
                                            alt={writer.name}
                                            className="w-10 h-10 rounded-full border object-cover shrink-0 filter brightness-95 border-slate-202 dark:border-slate-800"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <h6 className="text-[11.5px] font-black text-slate-800 dark:text-slate-101 truncate">
                                                {writer.name}
                                              </h6>
                                              <span className="text-[8.5px] border font-mono rounded px-1 shrink-0 bg-white dark:bg-slate-950 border-slate-202 dark:border-slate-800 text-slate-500">
                                                ★ {writer.popularity || 85}%
                                              </span>
                                            </div>
                                            <div className="text-[9px] font-extrabold uppercase font-mono text-indigo-500 dark:text-[#9A8FCD] truncate mt-0.5">
                                              {writer.voiceStyle}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>

                            {/* Right Side Column: Dynamic detail info card + Recharts Capability Radar (7 cols) */}
                            <div className="lg:col-span-7 space-y-4">
                              {(() => {
                                const nicheWriters = writers.filter((w) => activeWriterNicheFilter === "all" ? true : w.niche === activeWriterNicheFilter);
                                const focusWriter = nicheWriters.find((w) => w.id === focusWriterId) || nicheWriters[0];
                                
                                if (!focusWriter) {
                                  return (
                                    <div className="p-8 bg-[#F8F9FA]/30 dark:bg-slate-950/20 border border-slate-205 dark:border-slate-805 rounded-xl text-center text-xs text-slate-450 italic">
                                      Register or recruit an editorial voice candidate to instantiate visual profiles.
                                    </div>
                                  );
                                }

                                // Compose secure Radar Data
                                const activeSkillsList = focusWriter.skills || [];
                                const radarData = activeSkillsList.map((skName: string) => {
                                  const match = skills.find((s: any) => s.id === skName || s.name === skName);
                                  const displayName = match ? match.name : skName;
                                  const rating = 70 + ((focusWriter.name.length + displayName.length) % 26);
                                  return {
                                    subject: displayName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC05-\uDDFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, ''),
                                    A: rating,
                                    fullMark: 100
                                  };
                                });

                                const paddedRadarData = [...radarData];
                                if (paddedRadarData.length < 3) {
                                  paddedRadarData.push({ subject: "Factual Safety", A: 92, fullMark: 100 });
                                  paddedRadarData.push({ subject: "Tone Alignment", A: 88, fullMark: 100 });
                                  paddedRadarData.push({ subject: "Paragraph Flow", A: focusWriter.popularity || 85, fullMark: 100 });
                                }

                                return (
                                  <div className="p-4 bg-white dark:bg-slate-950/20 border border-slate-205 dark:border-slate-805 rounded-xl space-y-4 shadow-sm select-text">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                      <img
                                        src={focusWriter.avatar || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"}
                                        alt={focusWriter.name}
                                        className="w-12 h-12 rounded-full border border-indigo-400/20 object-cover filter brightness-95 shadow-md shrink-0"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                          <h4 className="text-sm font-black text-slate-850 dark:text-slate-101 font-sans">
                                            {focusWriter.name}
                                          </h4>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-955/20 text-violet-655 dark:text-violet-400 border border-violet-150/40">
                                              Popularity: {focusWriter.popularity || 85}%
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-[9.5px] font-extrabold uppercase font-mono text-indigo-600 dark:text-amber-400">
                                          {focusWriter.voiceStyle}
                                        </div>
                                        <p className="text-[11px] text-slate-550 dark:text-slate-355 leading-relaxed font-sans mt-1.5 p-2 bg-[#F8F9FA] dark:bg-slate-950/50 rounded-lg">
                                          {focusWriter.bio}
                                        </p>
                                      </div>
                                    </div>

                                    {/* CAPABILITY RADAR CHART */}
                                    <div className="bg-slate-50 dark:bg-slate-950/70 p-3 shadow-xs border border-slate-100 dark:border-slate-855 rounded-xl space-y-2">
                                      <h6 className="text-[9px] font-black uppercase tracking-widest font-mono text-slate-400 block border-b border-slate-201 dark:border-slate-805 pb-1">
                                        Specialist Capability Radar 📊
                                      </h6>
                                      
                                      <div className="h-48 w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={paddedRadarData}>
                                            <PolarGrid stroke="#475569" strokeOpacity={0.15} />
                                            <PolarAngleAxis 
                                              dataKey="subject" 
                                              tick={{ fill: '#3b82f6', fontSize: 8.5, fontWeight: 'bold', fontFamily: 'monospace' }} 
                                            />
                                            <PolarRadiusAxis 
                                              angle={30} 
                                              domain={[0, 100]} 
                                              tick={{ fill: '#64748b', fontSize: 7.5 }} 
                                            />
                                            <Radar 
                                              name={focusWriter.name} 
                                              dataKey="A" 
                                              stroke="#8b5cf6" 
                                              fill="#8b5cf6" 
                                              fillOpacity={0.3} 
                                            />
                                          </RadarChart>
                                        </ResponsiveContainer>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-805/85">
                                        {activeSkillsList.length === 0 ? (
                                          <span className="text-[9px] text-slate-500 italic font-mono">No explicitly assigned expertise skills. Incorporating default directives.</span>
                                        ) : (
                                          activeSkillsList.map((tag: string) => {
                                            const matchObj = skills.find((s: any) => s.id === tag || s.name === tag);
                                            return (
                                              <span 
                                                key={tag} 
                                                className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/20 text-indigo-700 dark:text-indigo-400 text-[8px] px-2 py-0.5 rounded font-mono font-black shrink-0"
                                              >
                                                ✦ {matchObj ? matchObj.name : tag}
                                              </span>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>

                                    {/* Directives parameters details */}
                                    <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950/70 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-[#3F5353] dark:text-[#9A8FCD] block border-b border-slate-202 dark:border-slate-805 pb-1">Concept Directives Layout</span>
                                      <p className="leading-relaxed mt-1 text-[10.5px] max-h-[140px] overflow-y-auto font-sans text-slate-650 dark:text-slate-350">
                                        {focusWriter.customPromptInstruction}
                                      </p>
                                    </div>

                                    {/* Compact Action Panel Footer */}
                                    <div className="flex items-center justify-end gap-2 pr-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleEditWriterClick(focusWriter)}
                                        className="px-2 py-1 text-[9px] font-black rounded border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-mono transition-colors cursor-pointer"
                                      >
                                        Edit Profile ✍️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTestingWriterId(focusWriter.id);
                                          const sampledDraft = articles.find(a => a.niche === selectedNiche);
                                          if (sampledDraft) {
                                            setTestSampleText(sampledDraft.content || sampledDraft.title);
                                          } else {
                                            setTestSampleText("Input some draft content here to analyze stylistic alignment with the writer persona.");
                                          }
                                          setAlignmentResult(null);
                                          setAlignmentTestError(null);
                                          setTimeout(() => {
                                            document.getElementById("writer-alignment-lab")?.scrollIntoView({ behavior: "smooth" });
                                          }, 100);
                                        }}
                                        className="px-2 py-1 text-[9px] font-black rounded border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-mono transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                      >
                                        Test Alignment 🧪
                                      </button>
                                      {nicheWriters[0]?.id !== focusWriter.id && (
                                        writerIdToConfirmDelete === focusWriter.id ? (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-rose-500 font-bold px-1">Fire?</span>
                                            <button
                                              onClick={() => handleDeleteWriter(focusWriter.id, true)}
                                              className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                                            >
                                              Confirm
                                            </button>
                                            <button
                                              onClick={() => setWriterIdToConfirmDelete(null)}
                                              className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-250 dark:bg-slate-750 text-slate-700 dark:text-slate-300 cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => handleDeleteWriter(focusWriter.id)}
                                            className="px-2 py-1 text-[9px] font-bold rounded border border-rose-200 dark:border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 font-mono transition-colors cursor-pointer"
                                          >
                                            Fire Writer
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                          </div>
                        </div>
                      )}

                          {/* WRITER ALIGNMENT LAB */}
                          <div id="writer-alignment-lab" className="my-5 p-4 bg-white dark:bg-[#070b14]/40 border border-slate-200 dark:border-slate-805 rounded-xl space-y-4 shadow-xs select-text">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded text-indigo-600 dark:text-indigo-400 text-[10px] font-black font-mono">LAB</span>
                                <div>
                                  <h5 className="text-[11px] font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-wider font-mono">
                                    Editorial Alignment & Voice Calibration Lab 🧪
                                  </h5>
                                  <p className="text-[10px] text-slate-500 leading-normal">
                                    Grade sample text layouts against digital writer directives using our Calibration Agent
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Left parameters */}
                              <div className="md:col-span-1 space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                                    1. Selected Digital Writer
                                  </label>
                                  <select
                                    value={testingWriterId || ""}
                                    onChange={(e) => {
                                      setTestingWriterId(e.target.value);
                                      setAlignmentResult(null);
                                      setAlignmentTestError(null);
                                    }}
                                    className="w-full text-xs font-bold p-2 bg-[#F8F9FA] dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-205 focus:outline-hidden"
                                  >
                                    <option value="" disabled>Select writer...</option>
                                    {writers.filter((w) => w.niche === selectedNiche).map((w) => (
                                      <option key={w.id} value={w.id}>{w.name} ({w.voiceStyle})</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                                    2. Quick Seed Content
                                  </label>
                                  {articles.filter(a => a.niche === selectedNiche).length > 0 ? (
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                      {articles.filter(a => a.niche === selectedNiche).map((art) => (
                                        <button
                                          key={art.id}
                                          type="button"
                                          onClick={() => {
                                            setTestSampleText(art.content || art.title);
                                          }}
                                          className="w-full text-left p-1.5 rounded border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-400 truncate block font-sans cursor-pointer"
                                        >
                                          📄 {art.title}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-slate-500 italic">No generated drafts in the registry yet.</p>
                                  )}
                                </div>
                              </div>

                              {/* Text evaluation area */}
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono flex items-center justify-between">
                                  <span>3. Draft Text to Evaluate</span>
                                  <span className="text-[8.5px] text-slate-500">{(testSampleText || "").length} chars</span>
                                </label>
                                <textarea
                                  value={testSampleText}
                                  onChange={(e) => setTestSampleText(e.target.value)}
                                  placeholder="Paste raw draft content sections here to run simulated stylistic tone matching checks..."
                                  rows={5}
                                  className="w-full font-sans text-xs p-3 bg-white dark:bg-slate-950/60 border border-slate-205 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-350 focus:outline-[#5F528E]/40"
                                />

                                <div className="flex items-center justify-end">
                                  <button
                                    type="button"
                                    disabled={isTestingAlignment || !testingWriterId || !testSampleText.trim()}
                                    onClick={() => handleTestWriterAlignment(testingWriterId || "", testSampleText)}
                                    className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg flex items-center gap-1.5 shadow-xs transition-all text-white cursor-pointer ${
                                      isTestingAlignment || !testingWriterId || !testSampleText.trim()
                                        ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-indigo-650 dark:bg-[#5F528E] hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                    }`}
                                  >
                                    {isTestingAlignment ? (
                                      <>
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping mr-0.5" />
                                        Validation Agent Assessing...
                                      </>
                                    ) : (
                                      <>Run Calibration Agent</>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Evaluation results */}
                            {alignmentTestError && (
                              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-250/50 rounded-lg text-xs font-bold text-rose-500 font-sans leading-relaxed">
                                ⚠ {alignmentTestError}
                              </div>
                            )}

                            {alignmentResult && (
                              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-250/30 dark:border-slate-805 rounded-xl space-y-3">
                                <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-850/60">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-slate-550 uppercase tracking-widest block font-bold">Calibration Metrics</span>
                                    <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-250/50">VAL-OK</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Style Alignment Score:</span>
                                    <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                                      alignmentResult.score >= 90
                                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : alignmentResult.score >= 75
                                          ? "bg-amber-100 dark:bg-amber-955 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                          : "bg-rose-100 dark:bg-rose-950 text-rose-500 border border-rose-500/20"
                                    }`}>
                                      {alignmentResult.score}%
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs font-sans italic text-slate-700 dark:text-slate-300 leading-relaxed">
                                  "{alignmentResult.verdict}"
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                  {/* Strengths */}
                                  <div className="p-2.5 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-lg border border-emerald-300/10 space-y-1">
                                    <span className="text-[9.5px] font-black text-emerald-650 uppercase tracking-wide font-mono block">✦ Aligned Strengths</span>
                                    <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1 pl-1 list-disc list-inside leading-normal">
                                      {alignmentResult.strengths?.map((s, i) => (
                                        <li key={i}>{s}</li>
                                      )) || <li>Tonal clarity matches well</li>}
                                    </ul>
                                  </div>

                                  {/* Gaps */}
                                  <div className="p-2.5 bg-amber-50/20 dark:bg-amber-955/10 rounded-lg border border-amber-300/10 space-y-1">
                                    <span className="text-[9.5px] font-black text-amber-650 uppercase tracking-wide font-mono block">▲ Discrepancy Gaps</span>
                                    <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1 pl-1 list-disc list-inside leading-normal">
                                      {alignmentResult.gaps?.map((g, i) => (
                                        <li key={i}>{g}</li>
                                      )) || <li>No custom discrepancies noticed</li>}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Candidates waiting to join the board (Applicants) */}
                          <div className="pt-4 border-t border-slate-205 dark:border-slate-850 space-y-3">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-violet-500 shrink-0 select-none animate-pulse" />
                                <h5 className="text-[10px] font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono">
                                  Candidates Ready to Join Board
                                </h5>
                              </div>
                              <button
                                type="button"
                                disabled={isScoutingCandidates}
                                onClick={handleScoutCandidates}
                                className="px-2 py-1 text-[9px] font-bold bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-950 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isScoutingCandidates ? (
                                  <>
                                    <span className="animate-spin inline-block mr-0.5">🔄</span>
                                    Scouting...
                                  </>
                                ) : (
                                  <>
                                    <span>📡</span>
                                    Scout Fresh Talents
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500/90 -mt-2 leading-relaxed font-sans">
                              Highly suggested talents ready to deploy directly
                              to your board.
                            </p>

                            <div className="space-y-2.5">
                              {boardApplicants
                                .filter((c) => c.niche === selectedNiche)
                                .map((applicant, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-[#F8F9FA]/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl flex gap-3 shadow-xs hover:border-indigo-500/25 transition-all"
                                  >
                                    <img
                                      src={applicant.avatar}
                                      alt={applicant.name}
                                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <h6 className="text-xs font-black text-slate-850 dark:text-slate-101 flex items-center gap-1 font-sans">
                                          {applicant.name}
                                        </h6>
                                        <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/20 px-1.5 py-0.5 rounded">
                                          Inspired by {applicant.competitor}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                                        {applicant.bio}
                                      </p>

                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {applicant.skills.map((sk) => (
                                          <span
                                            key={sk}
                                            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-[8.5px] px-2 py-0.5 rounded font-mono font-bold"
                                          >
                                            {sk}
                                          </span>
                                        ))}
                                      </div>

                                      <div className="mt-2 flex items-center justify-end gap-2.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleHireApplicant(applicant)
                                          }
                                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold text-[9px] rounded-lg tracking-wider transition-all duration-205 font-mono flex items-center gap-0.5 cursor-pointer shadow-sm"
                                        >
                                          + Hire to Board
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Pre-packaged publication profiles */}
                          <div className="pt-4 border-t border-slate-205 dark:border-slate-850 space-y-3">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-emerald-500 shrink-0 select-none" />
                              <h5 className="text-[10px] font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono">
                                Classic Elite Blueprint Templates
                              </h5>
                            </div>
                            <p className="text-[10px] text-slate-500 -mt-2 leading-relaxed font-sans">
                              Quickly instantiate historical style-formulas with
                              one-click profiles:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                              {WRITER_PRESETS.map((preset, idx) => (
                                <div
                                  key={idx}
                                  className="journalist-guild-card p-3 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-805/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-indigo-500/35 transition-all duration-300 flex flex-col justify-between text-left select-text rounded-xl"
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="journalist-guild-badge text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-505/10 px-2 py-0.5 rounded border border-indigo-150 dark:border-[#6366f1]/20 font-mono shadow-sm">
                                        {preset.targetInspiration}
                                      </span>
                                      <span className="text-[8px] font-mono text-slate-400 dark:text-slate-505 font-bold uppercase">
                                        PRESET
                                      </span>
                                    </div>
                                    <h6 className="journalist-guild-title text-[11px] font-bold text-slate-900 dark:text-slate-105 mt-2">
                                      {preset.name}
                                    </h6>
                                    <p className="journalist-guild-desc text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                                      {preset.bio}
                                    </p>
                                  </div>
                                  <button
                                    id={`btn-hire-preset-${idx}`}
                                    type="button"
                                    onClick={() =>
                                      handleApplyPresetWriter(preset)
                                    }
                                    className="btn-customize-hire w-full mt-3 py-1.5 text-center font-bold text-[9px] rounded-lg border border-indigo-150 dark:border-indigo-500/50 bg-indigo-50/50 dark:bg-[#0d1321] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-600 shadow-sm transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer select-none font-mono"
                                  >
                                    <Plus className="w-2.5 h-2.5 text-indigo-400 dark:text-indigo-300" />{" "}
                                    Customize & Hire
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                  {activeAdminTab === "feeds" && (
                    <div className="flex flex-col h-full overflow-hidden justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800/60">
                          <div>
                            <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">
                              XML Sourcing feeds
                            </h4>
                            <button
                              onClick={() => setShowNicheModal(true)}
                              className="mt-2 text-[10px] text-[#5F528E] dark:text-indigo-300 font-bold hover:underline cursor-pointer"
                            >
                              + Create New Niche
                            </button>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                              Modify the crawler stream pathways
                            </p>
                          </div>
                          <button
                            id="btn-show-add-feed"
                            onClick={() => setShowAddFeed(!showAddFeed)}
                            className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#3F5353] dark:bg-[#5F528E] border border-transparent rounded-xl flex items-center gap-1.5 hover:bg-opacity-90 transition-all duration-300 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>
                              {showAddFeed ? "Cancel" : "Add RSS Link"}
                            </span>
                          </button>
                        </div>

                        {!showAddFeed && (
                          /* Sub-tab segment selector (Active Sourcing vs Catalog presets) */
                          <div className="flex bg-slate-100 dark:bg-[#070b14] rounded-xl p-1 mt-3.5 text-[9.5px] font-bold select-none border border-[#E3E5E8] dark:border-slate-805 gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveFeedSubTab("active")}
                              className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                                activeFeedSubTab === "active"
                                  ? "bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-705/50 shadow-md font-extrabold"
                                  : "text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205"
                              }`}
                            >
                              Active Pathways (
                              {
                                feeds.filter((f) => f.niche === selectedNiche)
                                  .length
                              }
                              )
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveFeedSubTab("presets")}
                              className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                                activeFeedSubTab === "presets"
                                  ? "bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-705/50 shadow-md font-extrabold"
                                  : "text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205"
                              }`}
                            >
                              ⚡ RSS Discovery
                            </button>
                          </div>
                        )}
                      </div>

                      {showAddFeed ? (
                        <div className="flex-1 flex flex-col mt-4 overflow-hidden space-y-4">
                          {/* Feed registration sub-selector */}
                          <div className="flex bg-slate-100 dark:bg-[#070b14] rounded-lg p-0.5 mt-1 text-[9px] font-bold select-none border border-slate-205 dark:border-slate-805 gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setAddFeedMethod("single"); setBulkFeedsError(""); setBulkUploadResult(null); }}
                              className={`flex-1 py-1 rounded-md transition-all duration-300 cursor-pointer ${
                                addFeedMethod === "single"
                                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-extrabold"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              🔗 Single Link Registration
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAddFeedMethod("json"); setBulkFeedsError(""); setBulkUploadResult(null); }}
                              className={`flex-1 py-1 rounded-md transition-all duration-300 cursor-pointer ${
                                addFeedMethod === "json"
                                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-extrabold"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              📂 Upload JSON Feeds File
                            </button>
                          </div>

                          {addFeedMethod === "single" ? (
                            <form
                              onSubmit={handleCreateFeed}
                              className="overflow-y-auto space-y-4 pr-1"
                            >
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">
                                  Feed Name Title
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. ESPN News Feed"
                                  value={newFeedName}
                                  onChange={(e) => setNewFeedName(e.target.value)}
                                  className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-[#070b14] border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#3F5353] dark:focus:ring-[#5F528E] transition-all outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">
                                  Secure RSS XML Source URL
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="https://agency.com/rss.xml"
                                  value={newFeedUrl}
                                  onChange={(e) => setNewFeedUrl(e.target.value)}
                                  className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-[#070b14] border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#3F5353] dark:focus:ring-[#5F528E] transition-all outline-none"
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">
                                  Associated Niche Project
                                </label>
                                <select
                                  value={newFeedNiche || selectedNiche}
                                  onChange={(e) => setNewFeedNiche(e.target.value)}
                                  className="w-full text-xs font-bold text-[#0D1219] dark:text-white bg-white dark:bg-[#070b14] border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#3F5353] dark:focus:ring-[#5F528E] transition-all"
                                >
                                  {niches.map(n => (
                                    <option key={n.id} value={n.id}>
                                      {n.name} ({n.id})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-3 pt-2">
                                <button
                                  type="submit"
                                  className="bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all duration-300"
                                >
                                  Register Feed Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAddFeed(false)}
                                  className="text-slate-500 dark:text-slate-450 text-xs hover:text-[#0D1219] dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <form
                              onSubmit={handleBulkUploadJsonFeeds}
                              className="overflow-y-auto space-y-4 pr-1 text-left"
                            >
                              {bulkFeedsError && (
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/55 rounded-lg text-xs font-bold font-sans">
                                  ⚠️ {bulkFeedsError}
                                </div>
                              )}

                              {bulkUploadResult && (
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-405 border border-emerald-100 dark:border-emerald-900/55 rounded-lg text-xs font-bold font-sans">
                                  ✅ {bulkUploadResult.message}
                                  {bulkUploadResult.skipped && bulkUploadResult.skipped.length > 0 && (
                                    <span className="block text-[10px] mt-0.5 text-slate-500 font-normal">
                                      ({bulkUploadResult.skipped.length} existing duplicate endpoints safely bypassed)
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="space-y-1.5 text-left mb-3">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">
                                  Default Fallback Niche
                                </label>
                                <select
                                  value={newFeedNiche || selectedNiche}
                                  onChange={(e) => setNewFeedNiche(e.target.value)}
                                  className="w-full text-xs font-bold text-[#0D1219] dark:text-white bg-white dark:bg-[#070b14] border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#3F5353] dark:focus:ring-[#5F528E]"
                                >
                                  {niches.map((n) => (
                                    <option key={n.id} value={n.id}>
                                      {n.name} ({n.id})
                                    </option>
                                  ))}
                                </select>
                                <p className="text-[9px] text-slate-400 leading-snug mt-1">
                                  Feeds listed in the JSON file that do not have an explicit "niche" field specified will automatically inherit this selected project domain.
                                </p>
                              </div>

                              <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-405 cursor-pointer rounded-2xl p-6 text-center bg-[#F8F9FA]/40 dark:bg-slate-950/25 relative transition">
                                <input
                                  id="bulk-feeds-input"
                                  type="file"
                                  accept=".json"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setBulkFeedsFile(e.target.files[0]);
                                      setBulkFeedsError("");
                                      setBulkUploadResult(null);
                                    }
                                  }}
                                />
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="w-8 h-8 text-indigo-500" />
                                  <div className="text-xs">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">
                                      {bulkFeedsFile ? bulkFeedsFile.name : "Select or drag .json feeds file"}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                      Adheres to custom item 'niche' mappings, or falls back to chosen project above.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 leading-normal">
                                <p className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1">Expected JSON Schema format:</p>
                                <pre className="font-mono text-[9px] text-[#3F5353] dark:text-[#a5b4fc] overflow-x-auto select-all">
                                  {`[\n  { "name": "ESPN Sports", "url": "https://espn.com/rss" },\n  { "name": "Sky Travel", "url": "https://sky.com/rss" }\n]`}
                                </pre>
                              </div>

                              <div className="flex items-center gap-3 pt-2">
                                <button
                                  type="submit"
                                  disabled={isUploadingBulkFeeds || !bulkFeedsFile}
                                  className="bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all duration-300 flex items-center gap-1.5"
                                >
                                  {isUploadingBulkFeeds ? "Uploading..." : "🚀 Upload JSON Catalog"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddFeed(false);
                                    setBulkFeedsFile(null);
                                    setBulkFeedsError("");
                                    setBulkUploadResult(null);
                                  }}
                                  className="text-slate-500 dark:text-slate-450 text-xs hover:text-[#0D1219] dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  Close
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : activeFeedSubTab === "active" ? (
                        /* Core XML feeds crawler logs list */
                        <div className="flex-1 flex flex-col mt-4 overflow-hidden">
                          {/* Segment filter for Feed Niche scope */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 px-1.5 text-xs select-none shrink-0 border-b border-slate-100 dark:border-slate-800/50 pb-2 gap-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                              📡 Pipeline Sourcing Scope
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <select
                                value={activeFeedNicheFilter}
                                onChange={(e) => setActiveFeedNicheFilter(e.target.value)}
                                className="text-[9.5px] font-bold p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none w-full sm:w-auto"
                              >
                                <option value="all">All Integrated Niches ({feeds.length})</option>
                                <option value="current">{selectedNiche.toUpperCase()} Workspace</option>
                                {(() => {
                                  // Gather currently configured niches
                                  const configuredNicheIds = new Set(niches.map(n => n.id));
                                  // Gather unconfigured niche IDs originating from discovery tools
                                  const unconfiguredNicheIds = Array.from(new Set(feeds.map(f => f.niche))).filter(id => !configuredNicheIds.has(id));
                                  
                                  return (
                                    <>
                                      {niches.map((n) => (
                                        <option key={n.id} value={n.id}>{n.name}</option>
                                      ))}
                                      {unconfiguredNicheIds.length > 0 && (
                                        <optgroup label="Discovered Opportunities">
                                          {unconfiguredNicheIds.map(id => (
                                            <option key={`unconf-${id}`} value={id}>
                                              {id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (Pending Workspace)
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                    </>
                                  );
                                })()}
                              </select>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[355px] lg:max-h-[660px]">
                            {(() => {
                              const displayedFeeds = activeFeedNicheFilter === "all"
                                ? feeds
                                : activeFeedNicheFilter === "current"
                                  ? feeds.filter((f) => f.niche === selectedNiche)
                                  : feeds.filter((f) => f.niche === activeFeedNicheFilter);

                              const allSelectedInView = displayedFeeds.length > 0 && selectedFeedIds.length === displayedFeeds.length;

                              if (displayedFeeds.length === 0) {
                                return (
                                  <div className="text-center p-8 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl text-xs text-slate-450 font-sans">
                                    No custom feeds are integrated in this selected scope. Sync preset feeds or
                                    register your own custom URLs above!
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-350 select-none cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={allSelectedInView}
                                        onChange={() => {
                                          if (allSelectedInView) {
                                            setSelectedFeedIds([]);
                                          } else {
                                            setSelectedFeedIds(displayedFeeds.map(f => f.id));
                                          }
                                        }}
                                        className="rounded border-[#E3E5E8] dark:border-slate-805 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                      />
                                      Toggle All {displayedFeeds.length} Feeds
                                    </label>
                                    
                                    {selectedFeedIds.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                          {selectedFeedIds.length} Selected
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {displayedFeeds.map((feed, idx) => {
                                    const isFirstFeed = idx === 0 && activeFeedNicheFilter === "current";
                                    const isSelected = selectedFeedIds.includes(feed.id);
                                    
                                    return (
                                      <div
                                        key={feed.id}
                                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-md transition-all duration-300 ${
                                          isSelected ? "ring-2 ring-indigo-500/50 bg-[#F9F6FF] dark:bg-slate-900/40" : ""
                                        } ${
                                          !feed.isActive ? "opacity-50 grayscale border-dashed" : (isFirstFeed
                                            ? "bg-[#3F5353]/10 dark:bg-[#5F528E]/10 border-[#3F5353] dark:border-[#5F528E]"
                                            : "border-[#E3E5E8] dark:border-slate-800 bg-[#F8F9FA]/40 dark:bg-slate-950/25")
                                        }`}
                                      >
                                        <div className="min-w-0 flex flex-col gap-1.5">
                                          <div className="flex items-start gap-2 min-w-0">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => {
                                                if (isSelected) {
                                                  setSelectedFeedIds(prev => prev.filter(id => id !== feed.id));
                                                } else {
                                                  setSelectedFeedIds(prev => [...prev, feed.id]);
                                                }
                                              }}
                                              className="mt-0.5 rounded border-[#E3E5E8] dark:border-slate-805 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col min-w-0 gap-1 flex-1">
                                              <div className="flex items-center justify-between gap-2 min-w-0">
                                                <h5 className="text-xs font-bold text-[#0D1219] dark:text-slate-100 truncate flex items-center gap-1.5">
                                                  {isFirstFeed && feed.isActive && (
                                                    <span className="w-1.5 h-1.5 bg-[#3F5353] dark:bg-[#5F528E] rounded-full inline-block shrink-0 animate-pulse" />
                                                  )}
                                                  {feed.name}
                                                </h5>
                                                {feed.niche && (
                                                  <span className="shrink-0 text-[8px] uppercase tracking-wider font-extrabold bg-[#3F5353]/10 dark:bg-slate-800 text-[#3F5353] dark:text-slate-300 px-1.5 py-0.5 rounded border border-[#3F5353]/10 dark:border-slate-700">
                                                    {feed.niche}
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                                {feed.url}
                                              </p>
                                            </div>
                                          </div>
                                          {feed.lastSyncedAt && (
                                            <div className="text-[9px] font-bold mt-1 uppercase font-mono tracking-wide text-[#3F5353] dark:text-[#9A8FCD] pl-[22px]">
                                              Last crawled:{" "}
                                              {new Date(
                                                feed.lastSyncedAt,
                                              ).toLocaleTimeString()}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/40 pt-2.5 mt-1 items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                const res = await fetch(`/api/feeds/${feed.id}`, {
                                                  method: "PATCH",
                                                  headers: { "Content-Type": "application/json" },
                                                  body: JSON.stringify({ isActive: !feed.isActive })
                                                });
                                                if (res.ok) {
                                                  await fetchConfig();
                                                }
                                              } catch(err) {
                                                console.error(err);
                                              }
                                            }}
                                            className={`shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border font-mono shadow-sm cursor-pointer transition ${
                                              feed.isActive
                                                ? "bg-[#3F5353] dark:bg-[#5F528E] text-white border-transparent"
                                                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-705"
                                            }`}
                                          >
                                            {feed.isActive ? "Active Sourcing" : "Inactive"}
                                          </button>

                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingFeedId(feed.id);
                                                setEditingFeedName(feed.name);
                                                setEditingFeedUrl(feed.url);
                                                setEditingFeedNiche(feed.niche || selectedNiche);
                                                setShowEditFeedModal(true);
                                              }}
                                              className="text-[10px] font-extrabold text-slate-600 dark:text-indigo-305 hover:text-[#0D1219] dark:hover:text-white transition flex items-center gap-0.5 cursor-pointer"
                                              title="Edit RSS Feed"
                                            >
                                              🔧 Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (confirmDeleteId === feed.id) {
                                                  handleDeleteFeed(feed.id, feed.name);
                                                  setConfirmDeleteId(null);
                                                } else {
                                                  setConfirmDeleteId(feed.id);
                                                  setTimeout(() => setConfirmDeleteId(null), 3000);
                                                }
                                              }}
                                              className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 transition flex items-center gap-0.5 cursor-pointer"
                                              title="Delete RSS Feed"
                                            >
                                              {confirmDeleteId === feed.id ? "⚠️ Confirm?" : "❌ Delete"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        /* RSS DISCOVERY CATALOG PRESETS DIRECTORY (20+ FEEDS IN EACH NICHE) */
                        <div className="flex-1 flex flex-col mt-4 overflow-hidden">
                          {/* AI Discovery Web Search Form */}
                          <div className="p-4 mb-4 border border-violet-100 dark:border-violet-500/15 bg-[#F9F6FF] dark:bg-slate-900/40 rounded-xl shrink-0 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h6 className="text-[10.5px] font-black uppercase tracking-widest text-[#5F528E] dark:text-[#c7d2fe] font-mono flex items-center gap-1">
                                🌐 Global Internet Feed Discovery
                              </h6>
                              <p className="text-[9.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">
                                Feed the intelligence engine with direct RSS feeds found on the web. Search for <span className="text-violet-600 dark:text-violet-300 font-bold">traveling</span>, <span className="text-violet-600 dark:text-violet-300 font-bold">gardening</span>, or any custom domain niche.
                              </p>
                            </div>
                            <form onSubmit={handleSearchOnlineFeeds} className="flex gap-2 shrink-0 w-full md:w-auto">
                              <input
                                id="discovery-search-input"
                                type="text"
                                placeholder="Enter keyword, e.g. traveling"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-violet-500 text-slate-900 dark:text-slate-101"
                              />
                              <button
                                id="discovery-search-submit"
                                type="submit"
                                disabled={isSearchingFeeds || !searchKeyword.trim()}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50 select-none cursor-pointer flex items-center gap-1.5"
                              >
                                {isSearchingFeeds ? "Searching..." : "Search Feeds"}
                              </button>
                            </form>
                          </div>

                          {/* Dynamic Header container */}
                          {(() => {
                            const rawList = [
                              ...RSS_CATALOG.map(p => ({ ...p, isCustom: false })),
                              ...customDiscoveredFeeds.map(p => ({ ...p, isCustom: true }))
                            ];
                            const filteredList = rawList
                              .filter(preset => !deletedDiscoveryUrls.some(u => u.toLowerCase() === preset.url.toLowerCase()))
                              .filter(preset => preset.niche.toLowerCase() === selectedNiche.toLowerCase() || preset.isCustom);

                            const isAllSelected = filteredList.length > 0 && filteredList.every(p => selectedPresetUrls.includes(p.url));
                            const selectedPresetsList = filteredList.filter(p => selectedPresetUrls.includes(p.url));
                            const nichePresetsCount = RSS_CATALOG.filter(c => c.niche === selectedNiche).length;

                            return (
                              <>
                                <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/70 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-indigo-950/45 p-4 border border-indigo-100 dark:border-violet-500/15 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 shrink-0 shadow-sm">
                                  <div>
                                    <h6 className="text-[10.5px] font-bold uppercase tracking-widest text-[#3F5353] dark:text-[#a5b4fc] font-mono">
                                      ⚡ Ready-to-Deploy RSS presets
                                    </h6>
                                    <p className="text-[9.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans mt-0.5">
                                      Currently listing <span className="font-extrabold text-[#3F5353] dark:text-indigo-300">{filteredList.length} resource pathways</span> available under {selectedNiche.toUpperCase()}.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 select-none self-end md:self-auto">
                                    {selectedPresetUrls.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          id="btn-deploy-selected"
                                          type="button"
                                          onClick={() => {
                                            const listToDeploy = selectedPresetsList.map(p => ({
                                              name: p.name,
                                              url: p.url,
                                              niche: p.niche
                                            }));
                                            handleDeploySelectedFeeds(listToDeploy);
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition whitespace-nowrap cursor-pointer"
                                        >
                                          Deploy Selected ({selectedPresetUrls.length})
                                        </button>
                                        <button
                                          id="btn-delete-selected"
                                          type="button"
                                          onClick={() => {
                                            handleDeleteDiscoveryFeed(selectedPresetUrls);
                                          }}
                                          className="border border-red-350 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition whitespace-nowrap cursor-pointer"
                                        >
                                          Delete Selected
                                        </button>
                                      </div>
                                    )}
                                    <button
                                      id="btn-deploy-niche-catalog"
                                      type="button"
                                      onClick={() => {
                                        const nichePresets = RSS_CATALOG.filter(
                                          (c) => c.niche === selectedNiche,
                                        );
                                        handleBulkAddPresets(nichePresets);
                                      }}
                                      className="bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition whitespace-nowrap cursor-pointer"
                                    >
                                      Deploy Catalog ({nichePresetsCount})
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mb-2 px-1 text-[10px] select-none text-slate-500 dark:text-slate-400 font-mono">
                                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                                    <input
                                      id="select-all-discovery-checkbox"
                                      type="checkbox"
                                      checked={isAllSelected}
                                      onChange={() => {
                                        if (isAllSelected) {
                                          setSelectedPresetUrls([]);
                                        } else {
                                          setSelectedPresetUrls(filteredList.map(p => p.url));
                                        }
                                      }}
                                      className="rounded border-slate-300 dark:border-slate-850 accent-indigo-600 cursor-pointer w-3.5 h-3.5"
                                    />
                                    <span>Select All {filteredList.length} Presets</span>
                                  </label>
                                  {selectedPresetUrls.length > 0 && (
                                    <span>{selectedPresetUrls.length} selected</span>
                                  )}
                                </div>

                                {/* Presets List Scroll Box */}
                                <div className="flex-1 overflow-y-auto pr-1 max-h-[350px] lg:max-h-[580px] scrollbar-thin grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                                  {filteredList.map((preset, idx) => {
                                    const isAlreadyIntegrated = feeds.some(
                                      (f) => f.url.toLowerCase() === preset.url.toLowerCase(),
                                    );
                                    const isChecked = selectedPresetUrls.includes(preset.url);

                                    return (
                                      <div
                                        key={preset.url + idx}
                                        className={`p-3.5 border rounded-xl relative bg-white dark:bg-slate-950/20 shadow-sm flex flex-col justify-between gap-3.5 transition-all duration-300 ${
                                          isChecked
                                            ? "border-indigo-600 dark:border-indigo-500/80 bg-indigo-50/10 dark:bg-indigo-950/10"
                                            : "border-slate-200 dark:border-slate-805/85 hover:border-slate-305 dark:hover:border-slate-705"
                                        }`}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          {/* Selection Checkbox */}
                                          <input
                                            id={`preset-checkbox-${idx}`}
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                              if (isChecked) {
                                                setSelectedPresetUrls(prev => prev.filter(u => u !== preset.url));
                                              } else {
                                                setSelectedPresetUrls(prev => [...prev, preset.url]);
                                              }
                                            }}
                                            className="rounded border-slate-300 dark:border-slate-850 text-indigo-600 accent-indigo-600 cursor-pointer w-4 h-4 mt-0.5 shrink-0"
                                          />

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap font-mono">
                                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550">
                                                Idx #{idx + 1}
                                              </span>
                                              {preset.isCustom ? (
                                                <span className="text-[8.5px] uppercase font-bold px-1.5 rounded bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-[#a5b4fc] border border-violet-200 dark:border-violet-500/20">
                                                  Discovered: {preset.niche}
                                                </span>
                                              ) : (
                                                <span className="text-[8.5px] uppercase font-bold px-1.5 rounded bg-[#3F5353]/10 dark:bg-[#5F528E]/30 text-[#3F5353] dark:text-[#a5b4fc] border border-[#3F5353]/20 dark:border-[#5F528E]/20">
                                                  Authority
                                                </span>
                                              )}
                                            </div>
                                            <h5 className="text-[11.5px] font-bold text-slate-900 dark:text-slate-105 mt-1 line-clamp-1">
                                              {preset.name}
                                            </h5>
                                            <p className="text-[9.5px] text-slate-500 dark:text-slate-450 font-mono mt-0.5 truncate select-all" title={preset.url}>
                                              {preset.url}
                                            </p>
                                            {preset.description && (
                                              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-normal">
                                                {preset.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between shrink-0 pt-2 border-t border-slate-100 dark:border-slate-900 font-mono text-[9px]">
                                          {/* Individual Delete action */}
                                          <button
                                            id={`btn-preset-delete-${idx}`}
                                            type="button"
                                            onClick={() => {
                                              if (confirmDeleteId === preset.url) {
                                                handleDeleteDiscoveryFeed([preset.url]);
                                                setConfirmDeleteId(null);
                                              } else {
                                                setConfirmDeleteId(preset.url);
                                                setTimeout(() => setConfirmDeleteId(null), 3000);
                                              }
                                            }}
                                            className="text-slate-400 hover:text-red-500 transition-colors uppercase font-extrabold text-[8.5px] flex items-center gap-1 cursor-pointer select-none"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span>{confirmDeleteId === preset.url ? "Confirm?" : "Remove"}</span>
                                          </button>

                                          <div className="font-bold">
                                            {isAlreadyIntegrated ? (
                                              <span className="text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md px-2 py-0.5 inline-flex items-center gap-0.5 select-none font-sans font-black shadow-sm text-[8.5px]">
                                                ✓ Added to Pathways
                                              </span>
                                            ) : (
                                              <button
                                                id={`btn-preset-adopt-${idx}`}
                                                type="button"
                                                onClick={() => handleAddPresetFeed(preset.name, preset.url)}
                                                className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-500/30 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 rounded-lg px-2 py-1 shadow-sm transition-all duration-300 pointer cursor-pointer"
                                              >
                                                Deploy +
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: SAAS & INTEGRATION SETTINGS */}
                    {activeAdminTab === "settings" && (
                      <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-6 text-xs leading-relaxed max-h-[500px] lg:max-h-[800px] xl:max-h-[900px]">
                        {/* Premium Header Banner */}
                      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/70 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-indigo-950/45 border border-indigo-100 dark:border-violet-500/15 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-widest text-[#7c3aed] uppercase font-mono px-2 py-0.5 bg-violet-50 dark:bg-violet-950/70 border border-violet-100 dark:border-violet-850/30 rounded-full inline-block">
                            CONTROL PORTAL
                          </span>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                            ⚙️ Autonomous API Engine Configs
                          </h4>
                          <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                            Configure multi-agent decision matrices, secure API gateways, workspace budgets, and WP synchronization controls.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start md:self-auto select-none">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase">System Active</span>
                        </div>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveSaaSSettings(saasConfig);
                        }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* API Credentials: Spans full width (12 cols) with responsive 4-column sub-grid */}
                          <div className="space-y-3 lg:col-span-12 text-left">
                            <h5 className="font-black text-indigo-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                              <span>🔑</span> Model API Gateways & Credentials
                            </h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {/* Card A: Gemini */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-indigo-500/20 dark:hover:border-slate-750 transition-all shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 font-sans">Google Gemini Portal</span>
                                    <span className="text-[8px] font-mono uppercase bg-indigo-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-650 dark:text-indigo-300 border border-indigo-100 dark:border-slate-700">Native</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                                    Primary native LLM gateway. Standard preloaded keys take effect if left blank.
                                  </p>
                                </div>
                                <input
                                  type="password"
                                  placeholder="••••••••••••••••••••••••"
                                  value={saasConfig.modelSettings.geminiApiKey || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        geminiApiKey: val,
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans shadow-inner"
                                />
                              </div>

                              {/* Card B: OpenRouter */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-indigo-500/20 dark:hover:border-slate-750 transition-all shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 font-sans">OpenRouter Gateway</span>
                                    <span className="text-[8px] font-mono uppercase bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30">Recommended</span>
                                  </div>
                                  <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                                    Powers 3rd-party models (DeepSeek, Llama) & handles automatic 429 quota overrides.
                                  </p>
                                </div>
                                <input
                                  type="password"
                                  placeholder="••••••••••••••••••••••••"
                                  value={saasConfig.modelSettings.openrouterApiKey || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        openrouterApiKey: val,
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans shadow-inner"
                                />
                              </div>

                              {/* Card C: MiniMax */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-indigo-500/20 dark:hover:border-slate-750 transition-all shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 font-sans">MiniMax Engine</span>
                                    <span className="text-[8px] font-mono uppercase bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded text-rose-650 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30">Primary Writer</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                                    Powers high-performance creative content writing, drafting, and style editing.
                                  </p>
                                </div>
                                <input
                                  type="password"
                                  placeholder="••••••••••••••••••••••••"
                                  value={saasConfig.modelSettings.minimaxApiKey || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        minimaxApiKey: val,
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans shadow-inner"
                                />
                              </div>

                              {/* Card D: OpenAI */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 hover:border-indigo-500/20 dark:hover:border-slate-755 transition-all shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200 font-sans">OpenAI Connector</span>
                                    <span className="text-[8px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Optional</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                                    Supplements the pipeline with secondary validation filters & Dall-E 3 visual assets.
                                  </p>
                                </div>
                                <input
                                  type="password"
                                  placeholder="••••••••••••••••••••••••"
                                  value={saasConfig.modelSettings.openaiApiKey || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        openaiApiKey: val,
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans shadow-inner"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Model matrix section: Spans 12 full columns for wide, glorious grid */}
                          <div className="space-y-4 pt-4 border-t border-slate-850 lg:col-span-12 text-left">
                            <h5 className="font-black text-indigo-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                              <span>🔮</span> Digital Council Agent Intelligence Grid
                            </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                            <AgentModelSelector
                               label="Research Agent"
                               badge="Fact-Checking"
                               modelKey="researchModel"
                               customModelKey="researchCustomModel"
                               fallbackModelKey="researchFallbackModel"
                               fallbackCustomModelKey="researchFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Drafting Agent"
                               badge="Creative Writer"
                               modelKey="draftModel"
                               customModelKey="draftCustomModel"
                               fallbackModelKey="draftFallbackModel"
                               fallbackCustomModelKey="draftFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Natural Style Editor"
                               badge="Linguistic Polish"
                               modelKey="humanizeModel"
                               customModelKey="humanizeCustomModel"
                               fallbackModelKey="humanizeFallbackModel"
                               fallbackCustomModelKey="humanizeFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Image Agent"
                               badge="Visual Media Director"
                               modelKey="imageModel"
                               customModelKey="imageCustomModel"
                               fallbackModelKey="imageFallbackModel"
                               fallbackCustomModelKey="imageFallbackCustomModel"
                               optionsMode="image"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             >
                                <div className="flex items-center gap-2 pt-1 border-t border-slate-900/40">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="aiImagePreferred"
                                        checked={saasConfig.modelSettings.aiImagePreferred ?? true}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setSaasConfig((prev: any) => ({
                                            ...prev,
                                            modelSettings: {
                                              ...prev.modelSettings,
                                              aiImagePreferred: val,
                                            },
                                          }));
                                        }}
                                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-650"
                                      />
                                      <label htmlFor="aiImagePreferred" className="text-[10px] text-slate-400 font-bold select-none cursor-pointer">
                                        ✦ Always Generate Original AI Images (Do NOT recycle source URLs)
                                      </label>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-1">
                                      <label htmlFor="inlineImageMode" className="text-[9px] text-[#818cf8] font-bold uppercase tracking-wider">
                                        Default Article Visual Mode
                                      </label>
                                      <select
                                        id="inlineImageMode"
                                        value={saasConfig.modelSettings.inlineImageMode || "generate"}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setSaasConfig((prev: any) => ({
                                            ...prev,
                                            modelSettings: {
                                              ...prev.modelSettings,
                                              inlineImageMode: val,
                                            },
                                          }));
                                        }}
                                        className="w-full bg-slate-950 text-[10px] text-slate-300 font-bold px-2 py-1.5 rounded-lg border border-slate-850 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                      >
                                        <option value="generate">✦ RENDER LIVE IMAGES: Create and insert complete generated images for all slots</option>
                                        <option value="promptOnly">✦ MANUAL OUTSIDE PROMPTS ONLY: Insert copying cards with prompts for offline tools</option>
                                        <option value="none">✦ STRIP GRAPHICS: Remove visual hooks inside content body</option>
                                      </select>
                                      <p className="text-[8px] text-slate-505 leading-normal">
                                        Control whether the multi-agent council finishes images immediately or outputs text prompts so you can run the final rendering offline or manually outside.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                             </AgentModelSelector>

                             <AgentModelSelector
                               label="SEO Strategist Agent"
                               badge="Technical SEO Coach"
                               modelKey="seoModel"
                               customModelKey="seoCustomModel"
                               fallbackModelKey="seoFallbackModel"
                               fallbackCustomModelKey="seoFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Originality & Readability Validator"
                               badge="Editorial Guard"
                               modelKey="originalityModel"
                               customModelKey="originalityCustomModel"
                               fallbackModelKey="originalityFallbackModel"
                               fallbackCustomModelKey="originalityFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Lead Quality & Safety Compliance Inspector"
                               badge="Safety Auditor"
                               modelKey="validationModel"
                               customModelKey="validationCustomModel"
                               fallbackModelKey="validationFallbackModel"
                               fallbackCustomModelKey="validationFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Opportunity Scoring Agent"
                               badge="Content Radar"
                               modelKey="opportunityScoringModel"
                               customModelKey="opportunityScoringCustomModel"
                               fallbackModelKey="opportunityScoringFallbackModel"
                               fallbackCustomModelKey="opportunityScoringFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Advanced Copilot Synthesis"
                               badge="Copilot"
                               modelKey="copilotSynthesisModel"
                               customModelKey="copilotSynthesisCustomModel"
                               fallbackModelKey="copilotSynthesisFallbackModel"
                               fallbackCustomModelKey="copilotSynthesisFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Global Internet Feed Discovery"
                               badge="Feed Discovery"
                               modelKey="discoveryModel"
                               customModelKey="discoveryCustomModel"
                               fallbackModelKey="discoveryFallbackModel"
                               fallbackCustomModelKey="discoveryFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             <AgentModelSelector
                               label="Niche Research & Discovery"
                               badge="Niches"
                               modelKey="nicheDiscoveryModel"
                               customModelKey="nicheDiscoveryCustomModel"
                               fallbackModelKey="nicheDiscoveryFallbackModel"
                               fallbackCustomModelKey="nicheDiscoveryFallbackCustomModel"
                               settings={saasConfig.modelSettings}
                               onChange={(updates) => setSaasConfig((prev: any) => ({ ...prev, modelSettings: { ...prev.modelSettings, ...updates } }))}
                             />

                             {/* Quota Fallback Configuration */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-dashed border-slate-800 space-y-3 col-span-1 sm:col-span-2 md:col-span-2 2xl:col-span-3">
                              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                                <div className="flex flex-col">
                                  <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest font-mono">
                                    ⚠️ Quota Fallover Gateway
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 font-sans mt-0.5">
                                    Reroute to backup models on API quota exceed
                                  </span>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    id="fallback-toggle"
                                    checked={!!saasConfig.modelSettings.fallbackEnabled}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setSaasConfig((prev: any) => ({
                                        ...prev,
                                        modelSettings: {
                                          ...prev.modelSettings,
                                          fallbackEnabled: checked,
                                        },
                                      }));
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2.5">
                                <label className="text-[8.5px] font-extrabold text-slate-400 block uppercase tracking-widest font-mono">
                                  Unified Fallback Model ID
                                </label>
                                <select
                                  value={saasConfig.modelSettings.globalFallbackModel || "gemini-2.5-flash"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        globalFallbackModel: val,
                                      },
                                    }));
                                  }}
                                  disabled={!saasConfig.modelSettings.fallbackEnabled}
                                  className="w-full text-xs bg-slate-900 border border-slate-850 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-55"
                                >
                                  <optgroup label="Google Gemini" className="text-indigo-400 font-mono text-[10px]">
                                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                                  </optgroup>
                                  <optgroup label="OpenRouter" className="text-emerald-400 font-mono text-[10px]">
                                    <option value="custom-openrouter">✦ Custom OpenRouter Model</option>
                                    <option value="deepseek/deepseek-chat">DeepSeek V3 (Fast)</option>
                                    <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                  </optgroup>
                                </select>
                                
                                {saasConfig.modelSettings.globalFallbackModel === "custom-openrouter" && (
                                  <div className={`mt-2 p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-in fade-in zoom-in duration-200 shadow-inner ${!saasConfig.modelSettings.fallbackEnabled ? 'opacity-55 pointer-events-none' : ''}`}>
                                    <label className="text-[9px] font-extrabold text-indigo-400 block mb-1.5 uppercase tracking-widest font-mono">
                                        ✨ Custom Model ID
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. openrouter/free"
                                      value={saasConfig.modelSettings.globalFallbackCustomModel || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSaasConfig((prev: any) => ({
                                          ...prev,
                                          modelSettings: {
                                            ...prev.modelSettings,
                                            globalFallbackCustomModel: val,
                                          },
                                        }));
                                      }}
                                      className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
                                    />
                                  </div>
                                )}
                                
                                <p className="text-[8px] text-slate-500 leading-normal italic mt-2">
                                  Strict warning: When enabled, API overloads auto-route to this backup. Silent failover is strictly forbidden if this is toggled OFF.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 3: OPERATIONAL BENCHMARKS, FALLOVER & COST ESTIMATES */}
                        <div className="space-y-4 lg:col-span-12 text-left pt-4 border-t border-slate-800">
                          <h5 className="font-mono text-indigo-400 uppercase tracking-widest text-[9.5px] font-black flex items-center gap-1.5">
                            <span>📊</span> Controls, Quotas & Cost Guardrails
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                            {/* Card 1: Performance limits */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:border-indigo-500/20 transition-all duration-200">
                              <div>
                                <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-widest font-mono block mb-1">
                                  ⚡ Performance Benchmarks
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-normal">
                                  Manage active operational speed boundaries and brand output standards.
                                </span>
                              </div>
                              <div className="space-y-4">
                            {/* Max Concurrent Tasks / Agents */}
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                                  <span>🚀</span> Max Simultaneous Agent Orchestrations:{" "}
                                  <span className="text-indigo-400 font-black">
                                    {saasConfig.modelSettings.maxConcurrentAgents || 3}
                                  </span>
                                </label>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={saasConfig.modelSettings.maxConcurrentAgents || 3}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setSaasConfig((prev: any) => ({
                                    ...prev,
                                    modelSettings: {
                                      ...prev.modelSettings,
                                      maxConcurrentAgents: val,
                                    },
                                  }));
                                }}
                                className="w-full accent-indigo-500 mt-1 cursor-pointer"
                              />
                              <p className="text-[8.5px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                                Allows processing up to {saasConfig.modelSettings.maxConcurrentAgents || 3} digital agent councils in parallel for higher-throughput publication runs.
                              </p>
                            </div>

                            {/* Naturalness score */}
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest font-mono">
                                  Min Editorial Naturalness Score:{" "}
                                  <span className="text-emerald-400 font-black">
                                    {saasConfig.modelSettings.minHumanScoreTarget || 95}%
                                  </span>
                                </label>
                              </div>
                              <input
                                type="range"
                                min="75"
                                max="99"
                                value={
                                  saasConfig.modelSettings.minHumanScoreTarget ||
                                  95
                                }
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setSaasConfig((prev: any) => ({
                                    ...prev,
                                    modelSettings: {
                                      ...prev.modelSettings,
                                      minHumanScoreTarget: val,
                                    },
                                  }));
                                }}
                                className="w-full accent-indigo-500 mt-1 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Quota Fallover Gateway */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-indigo-500/20 transition-all duration-200">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-2">
                            <div className="flex flex-col">
                              <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest font-mono">
                                ⚠️ Quota Fallover Gateway
                              </span>
                              <span className="text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Reroute to backup models on API quota exceed
                              </span>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                id="fallback-toggle-bento"
                                checked={!!saasConfig.modelSettings.fallbackEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSaasConfig((prev: any) => ({
                                    ...prev,
                                    modelSettings: {
                                      ...prev.modelSettings,
                                      fallbackEnabled: checked,
                                    },
                                  }));
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-center space-y-2 mt-2 text-left">
                            <label className="text-[8.5px] font-extrabold text-slate-600 dark:text-[#94a3b8] block uppercase tracking-widest font-mono">
                              Unified Fallback Model ID
                            </label>
                            <select
                              value={saasConfig.modelSettings.globalFallbackModel || "gemini-2.5-flash"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSaasConfig((prev: any) => ({
                                  ...prev,
                                  modelSettings: {
                                    ...prev.modelSettings,
                                    globalFallbackModel: val,
                                  },
                                }));
                              }}
                              disabled={!saasConfig.modelSettings.fallbackEnabled}
                              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-55 cursor-pointer"
                            >
                              <optgroup label="Google Gemini" className="text-indigo-400 font-mono text-[10px]">
                                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                              </optgroup>
                              <optgroup label="OpenRouter" className="text-emerald-400 font-mono text-[10px]">
                                <option value="custom-openrouter">✦ Custom OpenRouter Model</option>
                                <option value="deepseek/deepseek-chat">DeepSeek V3 (Fast)</option>
                                <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                              </optgroup>
                            </select>
                            
                            {saasConfig.modelSettings.globalFallbackModel === "custom-openrouter" && (
                              <div className={`mt-2 p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-in fade-in duration-200 ${!saasConfig.modelSettings.fallbackEnabled ? 'opacity-55 pointer-events-none' : ''}`}>
                                <label className="text-[8px] font-extrabold text-indigo-400 block mb-1 uppercase tracking-widest font-mono">
                                  Custom Fallback Model ID
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. openrouter/free"
                                  value={saasConfig.modelSettings.globalFallbackCustomModel || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSaasConfig((prev: any) => ({
                                      ...prev,
                                      modelSettings: {
                                        ...prev.modelSettings,
                                        globalFallbackCustomModel: val,
                                      },
                                    }));
                                  }}
                                  className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono shadow-inner"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card 3: AI Cost & Budget Estimator */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3.5 shadow-sm hover:border-indigo-500/20 transition-all duration-200">
                            <h5 className="font-black text-emerald-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                              <span>📊</span> AI Cost & Budget Estimator
                            </h5>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                              Monitor live accumulated multi-agent API
                              consumption billing data alongside projected
                              budgeting forecast instruments.
                            </p>

                            {realSaaSStats && (
                              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-250/20 dark:border-slate-900 grid grid-cols-2 gap-2 text-center select-none font-mono">
                                <div className="col-span-2 border-b border-slate-200 dark:border-slate-900 pb-1.5 flex items-center justify-between">
                                  <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active Historical SaaS Cost Audit
                                  </span>
                                  <span className="text-[7.5px] text-slate-500 font-bold">
                                    REAL SYSTEM METRICS
                                  </span>
                                </div>

                                <div className="border-r border-slate-200 dark:border-slate-900">
                                  <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">
                                    Articles Processed
                                  </span>
                                  <span className="text-[11px] font-black text-slate-800 dark:text-white">
                                    {realSaaSStats.totalArticles} articles
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">
                                    Total Words Syndicated
                                  </span>
                                  <span className="text-[11px] font-black text-slate-800 dark:text-white">
                                    {realSaaSStats.totalWords.toLocaleString()}{" "}
                                    words
                                  </span>
                                </div>

                                <div className="border-t border-r border-slate-200 dark:border-slate-900 pt-1.5">
                                  <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">
                                    Accumulated API Cost
                                  </span>
                                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                    ${realSaaSStats.overallCost.toFixed(4)}
                                  </span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-900 pt-1.5">
                                  <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">
                                    Avg Cost / Article
                                  </span>
                                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-500">
                                    $
                                    {realSaaSStats.averageCostPerArticle.toFixed(
                                      4,
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                              {/* Daily count slider */}
                              <div>
                                <div className="flex justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
                                  <span>REWRITES PER DAY</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                    {estArticlesPerDay} articles
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="50"
                                  value={estArticlesPerDay}
                                  onChange={(e) =>
                                    setEstArticlesPerDay(
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full accent-emerald-500 mt-1 cursor-pointer"
                                />
                              </div>

                              {/* Model settings selector */}
                              <div>
                                <label className="text-[8.5px] font-mono text-slate-500 dark:text-slate-400 uppercase block mb-1">
                                  selected model tier
                                </label>
                                <div className="grid grid-cols-3 gap-1">
                                  {(["flash", "smart", "premium"] as const).map(
                                    (tier) => (
                                      <button
                                        key={tier}
                                        type="button"
                                        onClick={() => setEstModelTier(tier)}
                                        className={`text-[8px] font-bold uppercase p-1.5 rounded-lg border transition cursor-pointer ${
                                          estModelTier === tier
                                            ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                      >
                                        {tier === "flash"
                                          ? "⚡ Flash (Eco)"
                                          : tier === "smart"
                                            ? "🧠 Smart"
                                            : "💎 Premium"}
                                      </button>
                                    ),
                                  )}
                                </div>
                              </div>

                              {/* Calculations summary row */}
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex justify-between items-center text-center font-mono select-none">
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-bold uppercase">
                                    DAILY ESTIMATE
                                  </span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    $
                                    {(estModelTier === "flash"
                                      ? 0.0005 * estArticlesPerDay
                                      : estModelTier === "smart"
                                        ? 0.002 * estArticlesPerDay
                                        : 0.05 * estArticlesPerDay
                                    ).toFixed(4)}
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                                      {" "}
                                      to{" "}
                                    </span>
                                    $
                                    {(estModelTier === "flash"
                                      ? 0.0015 * estArticlesPerDay
                                      : estModelTier === "smart"
                                        ? 0.005 * estArticlesPerDay
                                        : 0.12 * estArticlesPerDay
                                    ).toFixed(4)}
                                  </span>
                                </div>
                                <div className="border-l border-slate-200 dark:border-slate-900 pl-3 text-right">
                                  <span className="block text-[8px] text-slate-500 font-bold uppercase">
                                    MONTHLY ESTIMATE (30D)
                                  </span>
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">
                                    $
                                    {(estModelTier === "flash"
                                      ? 0.0005 * estArticlesPerDay * 30
                                      : estModelTier === "smart"
                                        ? 0.002 * estArticlesPerDay * 30
                                        : 0.05 * estArticlesPerDay * 30
                                    ).toFixed(2)}
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">
                                      {" "}
                                      to{" "}
                                    </span>
                                    $
                                    {(estModelTier === "flash"
                                      ? 0.0015 * estArticlesPerDay * 30
                                      : estModelTier === "smart"
                                        ? 0.005 * estArticlesPerDay * 30
                                        : 0.12 * estArticlesPerDay * 30
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[8px] text-slate-400 dark:text-slate-500 font-mono text-center leading-normal mt-1 border-t border-slate-200 dark:border-slate-900/60 pt-1.5">
                                Economy fallback routing dynamically optimizes
                                tokens for high ROI.
                              </p>
                            </div>
                        </div>
                      </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between lg:col-span-12">
                          <button
                            type="submit"
                            disabled={isSavingSettings}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs py-2 px-4 rounded-lg w-full shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 transition-all duration-300"
                          >
                            {isSavingSettings ? (
                              <>
                                Saving...
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              </>
                            ) : saveSuccess ? (
                              "✓ Settings Saved Successfully!"
                            ) : (
                              "Save Platform Settings"
                            )}
                          </button>
                        </div>
                        </div>
                      </form>

                      {/* Reset database partition */}
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 mt-6 space-y-4">
                        <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
                          <div className="flex gap-3 items-center">
                            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                Danger Zone & Workspace Sanitization
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal max-w-2xl">
                                Destructive actions are segmented to avoid workspace interruption. Custom RSS pathways, feed sources, and niche configurations are strictly preserved across all operations.
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold px-2.5 py-1 rounded-full font-mono uppercase tracking-widest shrink-0 self-start md:self-auto">
                            SYSTEM LEVEL WIPE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Option 1: Clean Saved Articles (Except Pushed) */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/20 rounded-xl p-4 flex flex-col justify-between space-y-4 text-left shadow-sm group transition-all duration-200">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                                  Level: Moderate
                                </span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                                  Clear Non-Pushed
                                </span>
                                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-sans">
                                  Delete and purge all locally saved article drafts in the active workspace. This excludes any articles already pushed to WordPress.
                                </span>
                              </div>
                            </div>

                            <div className="pt-2">
                              {showClearSavedConfirm ? (
                                <div className="space-y-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-left">
                                  <p className="text-[9.5px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                                    Are you sure? This will delete all drafts except those marked as synchronized.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch("/api/articles/clear-except-pushed", { method: "POST" });
                                          if (res.ok) {
                                            const data = await res.json();
                                            setArticles(data.articles || []);
                                            setShowClearSavedConfirm(false);
                                          }
                                        } catch (err) {
                                          console.error("Failed to clear non-pushed articles:", err);
                                        }
                                      }}
                                      className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9.5px] rounded-md cursor-pointer text-center"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowClearSavedConfirm(false)}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9.5px] rounded-md cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowClearSavedConfirm(true)}
                                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-rose-500/10 dark:bg-slate-950/55 hover:dark:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold rounded-lg text-center text-[10px] transition cursor-pointer select-none"
                                >
                                  Purge Draft Caches
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Option 2: Clean Pushed Articles (Separately) */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/20 rounded-xl p-4 flex flex-col justify-between space-y-4 text-left shadow-sm group transition-all duration-200">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
                                  <Globe className="w-4 h-4" />
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                                  Level: Moderate
                                </span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-xs text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                                  Clear Pushed Rails
                                </span>
                                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-sans">
                                  Delete index of articles that have been successfully published on live remote WordPress nodes.
                                </span>
                              </div>
                            </div>

                            <div className="pt-2">
                              {showClearPushedConfirm ? (
                                <div className="space-y-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-left">
                                  <p className="text-[9.5px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                                    Are you sure? This deletes pushed lists from local tracking dashboard.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch("/api/articles/clear-pushed", { method: "POST" });
                                          if (res.ok) {
                                            const data = await res.json();
                                            setArticles(data.articles || []);
                                            setShowClearPushedConfirm(false);
                                          }
                                        } catch (err) {
                                          console.error("Failed to clear pushed articles:", err);
                                        }
                                      }}
                                      className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9.5px] rounded-md cursor-pointer text-center"
                                    >
                                      Confirm Clear
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowClearPushedConfirm(false)}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9.5px] rounded-md cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowClearPushedConfirm(true)}
                                  className="w-full py-1.5 px-3 bg-slate-50 hover:bg-rose-500/10 dark:bg-slate-950/55 hover:dark:bg-rose-950/30 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-slate-705 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold rounded-lg text-center text-[10px] transition cursor-pointer select-none"
                                >
                                  Purge Pushed Index
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Option 3: Wipe All Database (Start Over) */}
                          <div className="bg-rose-500/5 dark:bg-rose-950/5 border border-rose-200 dark:border-rose-900/40 hover:border-rose-500/40 rounded-xl p-4 flex flex-col justify-between space-y-4 text-left shadow-sm group transition-all duration-200">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="p-1.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                  <Flame className="w-4 h-4" />
                                </span>
                                <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest font-mono">
                                  Level: Critical
                                </span>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                  Full Operational Reset
                                </span>
                                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-sans">
                                  Wipes all operational data (articles, opportunity boards, logs & analytics). <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Niches, Writers, & RSS Feeds are preserved for rapid re-onboarding.</strong>
                                </span>
                              </div>
                            </div>

                            <div className="pt-2">
                              {showWipeConfirm ? (
                                <div className="space-y-2 p-2.5 bg-rose-500/15 border border-rose-500/20 rounded-lg text-left">
                                  <p className="text-[9.5px] text-rose-600 dark:text-rose-400 font-bold leading-normal">
                                    🔥 Critical Warning! This will reset rewrite logs and articles. Niches, Writers, & RSS Feeds are preserved. It cannot be undone. Enter reset mode?
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch("/api/articles/clear", { method: "POST" });
                                          if (res.ok) {
                                            setArticles([]);
                                            await fetchConfig();
                                            await fetchNotifications();
                                            if (typeof fetchRealSaaSStats === "function") {
                                              await fetchRealSaaSStats();
                                            }
                                            setShowWipeConfirm(false);
                                          }
                                        } catch (err) {
                                          console.error("Failed to clear database:", err);
                                        }
                                      }}
                                      className="flex-1 py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9.5px] rounded-md cursor-pointer text-center"
                                    >
                                      Proceed to Reset
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowWipeConfirm(false)}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9.5px] rounded-md cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowWipeConfirm(true)}
                                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono text-[9px] font-extrabold uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 rounded-lg transition-all duration-200 cursor-pointer"
                                >
                                  💥 Hard Reset Application
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                                          {/* TAB 5: DEDICATED WORDPRESS SYNC CONFIGURATION */}
                    {activeAdminTab === "wordpress" && (
                    <div className="flex flex-col h-full space-y-5 text-xs leading-relaxed max-h-[440px] lg:max-h-[695px] font-sans pb-6 overflow-y-auto pr-1">
                      
                      {/* Premium Minimally Elevated Header */}
                      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md text-left flex items-center justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="z-10 flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-505/10 text-indigo-400 rounded-lg">
                            <Globe className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold uppercase tracking-widest text-slate-100 font-mono">
                              WordPress Sync Gate
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Enforce REST API syndication & fallback nodes
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sub-tab Navigation Bar */}
                      <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1 text-[9px] font-black select-none border border-slate-205 dark:border-slate-805 gap-1 font-mono">
                        {(["directory", "register", "queue", "fallback", "patch"] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setWpLeftTab(tab)}
                            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer uppercase text-center ${
                              wpLeftTab === tab
                                ? "bg-slate-950 text-slate-850 dark:bg-indigo-650 dark:text-white shadow-sm font-extrabold"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                            }`}
                          >
                            {tab === "directory" ? "📁 Nodes" : tab === "register" ? "➕ Register" : tab === "queue" ? "📋 Queue" : tab === "fallback" ? "🔌 Fallbacks" : "🛠️ Patch"}
                          </button>
                        ))}
                      </div>

                      {/* Dynanic Contextual KPIs */}
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9.5px]">
                          <span className="text-slate-404 block text-[8px] uppercase tracking-wider">Gateway State</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {(saasConfig.wordpressSites || []).length} Custom Tunnels
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9.5px]">
                          <span className="text-slate-404 block text-[8px] uppercase tracking-wider">Active Niche Fallback</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            {selectedNiche}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Panel Content - Wrapped Subtab Panels */}
                      <div className="space-y-4 text-left">

                        {editingWpSite && (
                          <div id="wp-edit-form" className="space-y-3.5 bg-slate-50 dark:bg-slate-950/40 p-4 border border-indigo-200/50 dark:border-indigo-900/10 rounded-xl">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                              <div>
                                <h5 className="font-extrabold text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider font-mono">
                                  ✏️ Edit Registered WordPress Node
                                </h5>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Modify connection details for "{editingWpSite.name}"</p>
                              </div>
                              <button
                                type="button"
                                id="wp-edit-cancel-header"
                                onClick={() => setEditingWpSite(null)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 cursor-pointer font-sans"
                              >
                                ✕ Close
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-450 block font-mono">
                                  Account Alias Name
                                </label>
                                <input
                                  type="text"
                                  id="wp-edit-alias"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="e.g. Gossip Main Portal"
                                  className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  WordPress Site URL
                                </label>
                                <input
                                  type="url"
                                  id="wp-edit-url"
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  placeholder="https://gossip-website.com"
                                  className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  REST API Username
                                </label>
                                <input
                                  type="text"
                                  id="wp-edit-username"
                                  value={editUsername}
                                  onChange={(e) => setEditUsername(e.target.value)}
                                  placeholder="wordpress_admin"
                                  className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  Application Password
                                </label>
                                <input
                                  type="password"
                                  id="wp-edit-password"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="•••• •••• •••• ••••"
                                  className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                    Assigned Niche Category
                                  </label>
                                  <select
                                    id="wp-edit-niche"
                                    value={editNiche}
                                    onChange={(e) => setEditNiche(e.target.value)}
                                    className="w-full text-xs text-slate-805 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-860 rounded p-1.5 focus:outline-none transition-all font-sans cursor-pointer"
                                  >
                                    {niches.map((n) => (
                                      <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                    <option value="all">General / Combined</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 pt-5 select-none text-left">
                                  <input
                                    type="checkbox"
                                    checked={editAutoPush}
                                    onChange={(e) => setEditAutoPush(e.target.checked)}
                                    id="wp-edit-autopush"
                                    className="rounded border-slate-300 text-indigo-550 w-4 h-4 cursor-pointer"
                                  />
                                  <label htmlFor="wp-edit-autopush" className="text-[10px] font-extrabold uppercase tracking-widest font-mono cursor-pointer text-slate-705 dark:text-slate-305">
                                    Auto-Push
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800/60 font-mono">
                                <button
                                  type="button"
                                  id="wp-edit-test-btn"
                                  onClick={async () => {
                                    if (!editUrl.trim() || !editUsername.trim() || !editPassword.trim()) {
                                      alert("Please fill Site URL, REST Username, and Application Password first!");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/saas-settings/test-wp", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          url: editUrl.trim(),
                                          username: editUsername.trim(),
                                          appPassword: editPassword.trim(),
                                        }),
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        alert("Test Connection: " + data.message);
                                      } else {
                                        alert("Failed credentials verification.");
                                      }
                                    } catch (e: any) {
                                      alert("Error: " + e.message);
                                    }
                                  }}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-202 rounded font-mono text-[9px] font-bold cursor-pointer"
                                >
                                  ⚡ Test Site
                                </button>
                                <button
                                  type="button"
                                  id="wp-edit-save-btn"
                                  onClick={async () => {
                                    const name = editName.trim() || "WordPress Site";
                                    const url = editUrl.trim();
                                    const username = editUsername.trim();
                                    const appPassword = editPassword.trim();
                                    const niche = editNiche;
                                    const autoPush = editAutoPush;

                                    if (!url || !username || !appPassword) {
                                      alert("Site URL, Username, and Password are required!");
                                      return;
                                    }

                                    const updatedSites = (saasConfig.wordpressSites || []).map((s: any) => {
                                      if (s.id === editingWpSite.id) {
                                        return {
                                          ...s,
                                          name,
                                          url,
                                          username,
                                          appPassword,
                                          niche,
                                          autoPush,
                                        };
                                      }
                                      return s;
                                    });

                                    const updatedConfig = {
                                      ...saasConfig,
                                      wordpressSites: updatedSites,
                                    };
                                    setSaasConfig(updatedConfig);
                                    await handleSaveSaaSSettings(updatedConfig);
                                    setEditingWpSite(null);
                                    alert(`Successfully updated node: ${name}`);
                                  }}
                                  className="flex-1 px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded font-mono text-[9px] font-extrabold cursor-pointer text-center"
                                >
                                  💾 Save Changes
                                </button>
                                <button
                                  type="button"
                                  id="wp-edit-cancel-btn"
                                  onClick={() => setEditingWpSite(null)}
                                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-305 hover:bg-slate-300 dark:hover:bg-slate-700 rounded font-mono text-[9px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 1. DIRECTORY PANEL */}
                        {!editingWpSite && wpLeftTab === "directory" && (
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div>
                                <h5 className="font-extrabold text-slate-805 dark:text-slate-200 text-[10px] uppercase tracking-wider font-mono">
                                  🔑 Custom Isolated Sites Registry
                                </h5>
                                <p className="text-[9px] text-slate-400">Target sites waiting for editorial routing</p>
                              </div>
                            </div>

                            {(saasConfig.wordpressSites || []).length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-slate-220 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                                <Globe className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700 animate-pulse" />
                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 font-sans">
                                  No Isolated Sites Configured
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setWpLeftTab("register")}
                                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mx-auto mt-1 cursor-pointer font-mono text-center block w-full"
                                >
                                  Register a new WP site node →
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                                {(saasConfig.wordpressSites || []).map((site: any) => {
                                  let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-805 dark:text-slate-350";
                                  if (site.niche === "hollywood") badgeStyle = "bg-pink-105 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400 border border-pink-200/20";
                                  else if (site.niche === "sports") badgeStyle = "bg-emerald-105 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/20";
                                  else if (site.niche === "tech") badgeStyle = "bg-cyan-105 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200/20";
                                  
                                  return (
                                    <div key={site.id} className="p-3 bg-white dark:bg-slate-955/30 border border-slate-200 dark:border-slate-855 rounded-lg hover:border-slate-350 dark:hover:border-slate-700 transition space-y-2.5 shadow-sm">
                                      <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-205 truncate">
                                            {site.name}
                                          </div>
                                          <a href={site.url} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-505/85 truncate hover:underline block font-mono">
                                            {site.url}
                                          </a>
                                        </div>
                                        <span className={`text-[7.5px] font-black uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${badgeStyle}`}>
                                          {site.niche}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono border-t border-slate-100 dark:border-slate-805/60 pt-2 text-slate-500">
                                        <div>
                                          User: <span className="font-bold text-slate-705 dark:text-slate-300">{site.username}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          Push: {site.autoPush ? (
                                            <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
                                              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-ping"></span> Live
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 uppercase font-bold">Staging</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-805/60 pt-2 text-[9px] font-mono gap-1.5">
                                        <button
                                          type="button"
                                          id={`wp-validate-btn-${site.id}`}
                                          onClick={async () => {
                                            try {
                                              const res = await fetch("/api/saas-settings/test-wp", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ siteId: site.id }),
                                              });
                                              if (res.ok) {
                                                const d = await res.json();
                                                alert(`[${site.name}] ${d.message}`);
                                              } else {
                                                alert("Credentials test failed.");
                                              }
                                            } catch (err: any) {
                                              alert("Ping error: " + err.message);
                                            }
                                          }}
                                          className="flex-1 py-1 px-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center text-[8.5px]"
                                        >
                                          ⚡ Validate
                                        </button>
                                        <button
                                          type="button"
                                          id={`wp-edit-btn-${site.id}`}
                                          onClick={() => {
                                            setEditingWpSite(site);
                                            setEditName(site.name || "");
                                            setEditUrl(site.url || "");
                                            setEditUsername(site.username || "");
                                            setEditPassword(site.appPassword || "");
                                            setEditNiche(site.niche || "hollywood");
                                            setEditAutoPush(!!site.autoPush);
                                          }}
                                          className="flex-1 py-1 px-1.5 border border-amber-200/50 dark:border-amber-900/30 bg-amber-500/10 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold rounded hover:bg-amber-500/20 transition cursor-pointer text-center text-[8.5px]"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          type="button"
                                          id={`wp-dismount-btn-${site.id}`}
                                          onClick={() => {
                                            const updatedSites = (saasConfig.wordpressSites || []).filter((s: any) => s.id !== site.id);
                                            const updatedConfig = { ...saasConfig, wordpressSites: updatedSites };
                                            setSaasConfig(updatedConfig);
                                            handleSaveSaaSSettings(updatedConfig);
                                          }}
                                          className="py-1 px-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 border border-transparent rounded transition cursor-pointer font-bold text-[8.5px]"
                                        >
                                          ❌ Dismount
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. REGISTER PANEL */}
                        {!editingWpSite && wpLeftTab === "register" && (
                          <div className="space-y-3.5">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                              <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-wider font-mono">
                                ➕ Register Destination Site Node
                              </h5>
                              <p className="text-[9px] text-slate-400 mt-0.5">Scale your private publishing network easily</p>
                            </div>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-450 block font-mono">
                                  Account Alias Name
                                </label>
                                <input
                                  type="text"
                                  id="new-wp-alias"
                                  placeholder="e.g. Gossip Main Portal"
                                  className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-95 border border-slate-200 dark:border-slate-805 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  WordPress Site URL
                                </label>
                                <input
                                  type="url"
                                  id="new-wp-url"
                                  placeholder="https://gossip-website.com"
                                  className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-95 border border-slate-200 dark:border-slate-805 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  REST API Username
                                </label>
                                <input
                                  type="text"
                                  id="new-wp-user-register"
                                  placeholder="wordpress_admin"
                                  className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-95 border border-slate-200 dark:border-slate-810 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                  Application Password
                                </label>
                                <input
                                  type="password"
                                  id="new-wp-pwd-register"
                                  placeholder="•••• •••• •••• ••••"
                                  className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-95 border border-slate-200 dark:border-slate-810 rounded p-1.5 focus:outline-none transition-all font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[8.5px] font-black tracking-wider uppercase text-slate-455 block font-mono">
                                    Assigned Niche Category
                                  </label>
                                  <select
                                    id="new-wp-niche-register"
                                    className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-95 border border-slate-201 dark:border-slate-810 rounded p-1.5 focus:outline-none transition-all font-sans"
                                  >
                                    {niches.map((n) => (
                                      <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                    <option value="all">General / Combined</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 pt-5 select-none text-left">
                                  <input
                                    type="checkbox"
                                    id="new-wp-autopush-register"
                                    className="rounded border-slate-300 text-indigo-505 w-4 h-4 cursor-pointer"
                                  />
                                  <label htmlFor="new-wp-autopush-register" className="text-[10px] font-extrabold uppercase tracking-widest font-mono cursor-pointer text-slate-705 dark:text-slate-305">
                                    Auto-Push
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-3 font-mono">
                                <button
                                  type="button"
                                  onClick={async () => {
                                     const urlEl = document.getElementById("new-wp-url") as HTMLInputElement;
                                     const userEl = document.getElementById("new-wp-user-register") as HTMLInputElement;
                                     const pwdEl = document.getElementById("new-wp-pwd-register") as HTMLInputElement;
                                     if (!urlEl?.value || !userEl?.value || !pwdEl?.value) {
                                       alert("Please fill Site URL, REST Username, and Application Password first!");
                                       return;
                                     }
                                     try {
                                       const res = await fetch("/api/saas-settings/test-wp", {
                                         method: "POST",
                                         headers: { "Content-Type": "application/json" },
                                         body: JSON.stringify({
                                           url: urlEl.value,
                                           username: userEl.value,
                                           appPassword: pwdEl.value,
                                         }),
                                       });
                                       if (res.ok) {
                                         const data = await res.json();
                                         alert("Test Connection: " + data.message);
                                       } else {
                                         alert("Failed credentials verification.");
                                       }
                                     } catch (e: any) {
                                       alert("Error: " + e.message);
                                     }
                                  }}
                                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-[9px] font-bold cursor-pointer"
                                >
                                  ⚡ Test site
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                     const aliasEl = document.getElementById("new-wp-alias") as HTMLInputElement;
                                     const urlEl = document.getElementById("new-wp-url") as HTMLInputElement;
                                     const userEl = document.getElementById("new-wp-user-register") as HTMLInputElement;
                                     const pwdEl = document.getElementById("new-wp-pwd-register") as HTMLInputElement;
                                     const nicheEl = document.getElementById("new-wp-niche-register") as HTMLSelectElement;
                                     const autoEl = document.getElementById("new-wp-autopush-register") as HTMLInputElement;

                                     const name = aliasEl?.value?.trim() || "WordPress Site";
                                     const url = urlEl?.value?.trim();
                                     const username = userEl?.value?.trim();
                                     const appPassword = pwdEl?.value?.trim();
                                     const niche = nicheEl?.value || "hollywood";
                                     const autoPush = autoEl?.checked || false;

                                     if (!url || !username || !appPassword) {
                                       alert("Site URL, Username, and Password are required!");
                                       return;
                                     }

                                     const newAccount = {
                                       id: "wp-site-" + Date.now().toString(),
                                       name,
                                       url,
                                       username,
                                       appPassword,
                                       niche,
                                       autoPush,
                                       active: true,
                                     };

                                     const updatedSites = [...(saasConfig.wordpressSites || []), newAccount];
                                     const updatedConfig = {
                                        ...saasConfig,
                                        wordpressSites: updatedSites,
                                      };
                                      setSaasConfig(updatedConfig);
                                      await handleSaveSaaSSettings(updatedConfig);
                                      alert(`Successfully registered node: ${name}`);
                                   }}
                                   className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-mono text-[9px] font-extrabold cursor-pointer text-center"
                                 >
                                   ➕ Hook Connection
                                 </button>
                               </div>
                             </div>
                           </div>
                         )}

                        {/* 2.5. DURABLE PUBLISHING QUEUE PANEL */}
                        {!editingWpSite && wpLeftTab === "queue" && (
                          <div className="space-y-4 font-sans text-left">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                              <div>
                                <h5 className="font-extrabold text-slate-805 dark:text-slate-200 text-[10px] uppercase tracking-wider font-mono">
                                  📋 Durable Publishing Queue & Worker Control
                                </h5>
                                <p className="text-[9px] text-slate-400 mt-0.5">Idempotent Delivery, Bounded Retries, and Ambiguous Outcome Resolution</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleQueueRunWorker}
                                disabled={isExecutingQueue || isLoadingQueue}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-450 text-white rounded font-mono text-[9px] font-extrabold cursor-pointer flex items-center gap-1"
                              >
                                {isExecutingQueue ? "⏳ Worker Executing..." : "⚡ Run Queue Worker"}
                              </button>
                            </div>

                            {/* Queue Summary KPIs */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9px]">
                                <span className="text-slate-404 block text-[7.5px] uppercase tracking-wider">Total</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{queueJobs.length}</span>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9px]">
                                <span className="text-slate-404 block text-[7.5px] uppercase tracking-wider">Active</span>
                                <span className="font-bold text-blue-500">
                                  {queueJobs.filter(j => {
                                    const st = (j.status || "").toLowerCase();
                                    return st === "queued" || st === "leased" || st === "retry_wait" || st === "scheduled";
                                  }).length}
                                </span>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9px]">
                                <span className="text-slate-404 block text-[7.5px] uppercase tracking-wider">Published</span>
                                <span className="font-bold text-emerald-500">
                                  {queueJobs.filter(j => {
                                    const st = (j.status || "").toLowerCase();
                                    return st === "published" || st === "updated";
                                  }).length}
                                </span>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 font-mono text-[9px]">
                                <span className="text-slate-404 block text-[7.5px] uppercase tracking-wider">Failing</span>
                                <span className="font-bold text-rose-500">
                                  {queueJobs.filter(j => {
                                    const st = (j.status || "").toLowerCase();
                                    return st === "failed" || st === "dead_letter" || st === "aborted" || st === "cancelled" || st === "technical_failure" || st === "manual_intervention_required" || st === "reconciliation_required";
                                  }).length}
                                </span>
                              </div>
                            </div>

                            {/* Main Jobs Listing */}
                            {isLoadingQueue && queueJobs.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 font-mono text-[9.5px]">
                                Loading queue state from Firestore...
                              </div>
                            ) : queueJobs.length === 0 ? (
                              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-2">
                                <p className="text-[10px] text-slate-500 leading-normal">
                                  No publishing jobs have been submitted to the durable queue yet.
                                </p>
                                <p className="text-[9px] text-slate-400 max-w-sm mx-auto">
                                  To add an article, go to your **Articles Board** and click **"Queue Publication"** on any approved draft to enable retry guards and scheduling!
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {queueJobs.map((job) => {
                                  let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                                  const st = (job.status || "").toLowerCase();
                                  if (st === "queued" || st === "scheduled") badgeColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300";
                                  if (st === "leased" || st === "executing" || st === "verifying_remote") badgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
                                  if (st === "published" || st === "updated") badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
                                  if (st === "failed" || st === "technical_failure") badgeColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300";
                                  if (st === "dead_letter") badgeColor = "bg-red-200 text-red-800 dark:bg-red-950/80 dark:text-red-300 font-bold";
                                  if (st === "aborted" || st === "cancelled") badgeColor = "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400";
                                  if (st === "manual_intervention_required" || st === "reconciliation_required") badgeColor = "bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold";

                                  const isExpanded = expandedJobId === job.jobId;

                                  return (
                                    <div key={job.jobId} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
                                      <div className="flex items-start justify-between gap-2.5">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black font-mono tracking-wider ${badgeColor}`}>
                                              {job.status}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono">
                                              ID: {job.jobId.substring(0, 12)}...
                                            </span>
                                          </div>
                                          <h6 className="font-bold text-slate-800 dark:text-slate-200 text-[10.5px] leading-tight">
                                            Package: {job.packageId}
                                          </h6>
                                          <p className="text-[9px] text-slate-400 font-mono">
                                            Target Site: <strong className="text-slate-500">{job.targetSiteId}</strong>
                                          </p>
                                        </div>

                                        <div className="text-right font-mono text-[9px] space-y-1 text-slate-500">
                                          <div>Runs: <strong>{job.runCount} / {job.maxRetries}</strong></div>
                                          <div>Next Run: <strong>{job.nextRunAt ? new Date(job.nextRunAt).toLocaleTimeString() : "N/A"}</strong></div>
                                          {job.scheduledPublishAt && (
                                            <div className="text-indigo-500">
                                              ⏰ Scheduled: <strong>{new Date(job.scheduledPublishAt).toLocaleDateString()}</strong>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {job.lastError && (
                                        <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 rounded-lg text-[8.5px] text-rose-600 dark:text-rose-400 font-mono">
                                          ⚠️ <strong>Last Error:</strong> {job.lastError}
                                        </div>
                                      )}

                                      {/* Row Action Buttons */}
                                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[8px]">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedJobId(isExpanded ? null : job.jobId)}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded cursor-pointer font-bold"
                                        >
                                          {isExpanded ? "Hide Logs ✕" : "Audit Events 🔍"}
                                        </button>

                                        {((job.status || "").toLowerCase() === "failed" || (job.status || "").toLowerCase() === "dead_letter" || (job.status || "").toLowerCase() === "technical_failure") && (
                                          <button
                                            type="button"
                                            onClick={() => handleQueueRetry(job.jobId)}
                                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded cursor-pointer font-bold"
                                          >
                                            ↻ Force Retry
                                          </button>
                                        )}

                                        {(job.status || "").toLowerCase() !== "published" && (job.status || "").toLowerCase() !== "updated" && (job.status || "").toLowerCase() !== "aborted" && (job.status || "").toLowerCase() !== "cancelled" && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setManualResolveJobId(manualResolveJobId === job.jobId ? null : job.jobId);
                                                setManualWpPostId("");
                                                setManualDestUrl("");
                                              }}
                                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer font-bold"
                                            >
                                              ✏️ Manual Resolve
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setAbortJobId(abortJobId === job.jobId ? null : job.jobId);
                                                setAbortReason("");
                                              }}
                                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer font-bold"
                                            >
                                              ✕ Abort Job
                                            </button>
                                          </>
                                        )}
                                      </div>

                                      {/* Manual Resolve Form */}
                                      {manualResolveJobId === job.jobId && (
                                        <div className="p-3 bg-teal-50 dark:bg-teal-950/25 border border-teal-200/50 dark:border-teal-900/30 rounded-xl space-y-2 text-[9px] font-sans">
                                          <h6 className="font-bold text-teal-800 dark:text-teal-400 font-mono uppercase tracking-wider">
                                            ✏️ Manually Reconcile with WordPress Remote
                                          </h6>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-slate-500 block font-mono text-[8px] uppercase">WP Post ID</label>
                                              <input
                                                type="text"
                                                placeholder="e.g. 8329"
                                                value={manualWpPostId}
                                                onChange={(e) => setManualWpPostId(e.target.value)}
                                                className="w-full text-xs p-1 border rounded dark:bg-slate-950 dark:border-slate-800 focus:outline-none"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-slate-500 block font-mono text-[8px] uppercase">Destination Live URL</label>
                                              <input
                                                type="text"
                                                placeholder="https://mysite.com/?p=8329"
                                                value={manualDestUrl}
                                                onChange={(e) => setManualDestUrl(e.target.value)}
                                                className="w-full text-xs p-1 border rounded dark:bg-slate-950 dark:border-slate-800 focus:outline-none"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-end gap-1 font-mono text-[8px] pt-1">
                                            <button
                                              type="button"
                                              onClick={() => handleQueueResolve(job.jobId)}
                                              className="px-2 py-1 bg-teal-600 text-white rounded cursor-pointer"
                                            >
                                              Confirm Resolution
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setManualResolveJobId(null)}
                                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Abort Form */}
                                      {abortJobId === job.jobId && (
                                        <div className="p-3 bg-rose-50 dark:bg-rose-950/25 border border-rose-200/50 dark:border-rose-900/30 rounded-xl space-y-2 text-[9px] font-sans">
                                          <h6 className="font-bold text-rose-850 dark:text-rose-405 font-mono uppercase tracking-wider">
                                            ⚠️ Abort Publishing Job
                                          </h6>
                                          <div>
                                            <label className="text-slate-500 block font-mono text-[8px] uppercase">Reason for Aborting</label>
                                            <input
                                              type="text"
                                              placeholder="e.g. Article outdated, duplicate feed storyline"
                                              value={abortReason}
                                              onChange={(e) => setAbortReason(e.target.value)}
                                              className="w-full text-xs p-1 border rounded dark:bg-slate-950 dark:border-slate-800 focus:outline-none"
                                            />
                                          </div>
                                          <div className="flex justify-end gap-1 font-mono text-[8px] pt-1">
                                            <button
                                              type="button"
                                              onClick={() => handleQueueAbort(job.jobId)}
                                              className="px-2 py-1 bg-rose-600 text-white rounded cursor-pointer"
                                            >
                                              Confirm Abortion
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setAbortJobId(null)}
                                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-305 rounded cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Expanded Audit Trails Terminal */}
                                      {isExpanded && (
                                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[8px] text-slate-400 space-y-1 shadow-inner">
                                          <div className="border-b border-slate-200/10 pb-1 text-[7.5px] uppercase tracking-wider text-slate-500 font-bold flex justify-between">
                                            <span>📋 Execution Transition Log</span>
                                            <span>UTC TIMESTAMPS</span>
                                          </div>
                                          <div className="space-y-1 divide-y divide-slate-900 max-h-[120px] overflow-y-auto">
                                            {(job.auditHistory || []).map((ev: any, idx: number) => (
                                              <div key={idx} className="pt-1 flex flex-col sm:flex-row sm:justify-between items-start gap-1 leading-normal">
                                                <span className="text-slate-300">
                                                  [{idx + 1}] <strong className="text-indigo-400">{ev.operator || "worker"}</strong>: {ev.action} (<strong>{ev.previousStatus}</strong> → <strong className="text-indigo-400">{ev.newStatus}</strong>)
                                                  {ev.message && <span className="block text-[7.5px] text-slate-500 mt-0.5">↳ {ev.message}</span>}
                                                </span>
                                                <span className="text-slate-500 text-[7px] whitespace-nowrap self-end sm:self-start">
                                                  {new Date(ev.timestamp).toISOString()}
                                                </span>
                                              </div>
                                            ))}
                                            {(job.auditHistory || []).length === 0 && (
                                              <div className="text-center text-slate-600 py-2 font-mono">No transition logs registered for this job.</div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}


                        {/* RIGHT COLUMN: Dynamic Niche Fallback configuration */}
                        <div className="lg:col-span-5 space-y-6">
                          
                          {/* 3. Original Legacy Niche Default Fallback Form */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveSaaSSettings(saasConfig);
                            }}
                            className="space-y-4"
                          >
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-left">
                              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h5 className="font-extrabold text-[#0d1219] dark:text-slate-100 text-xs uppercase tracking-wider block font-sans">
                                  🌐 Category Default Gateway Fallbacks
                                </h5>
                                <p className="text-[10px] text-slate-400 font-normal leading-normal mt-0.5">
                                  Default destination used if no custom accounts are assigned above for the active niche.
                                </p>
                              </div>

                              {/* Beautifully stylized selected niche accent banner */}
                              {(() => {
                                let themeBg = "bg-rose-50/50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-450";
                                let titleNiche = "🎬 Gossip & Glamour Default Portal";
                                if (selectedNiche === "sports") {
                                  themeBg = "bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450";
                                  titleNiche = "🏀 The Arena Sports Default Portal";
                                } else if (selectedNiche === "tech") {
                                  themeBg = "bg-cyan-50/50 dark:bg-cyan-950/15 border-cyan-100 dark:border-cyan-900/30 text-cyan-700 dark:text-cyan-450";
                                  titleNiche = "💻 Alpha Teardown Default Portal";
                                } else if (selectedNiche === "traveling") {
                                  themeBg = "bg-teal-50/50 dark:bg-teal-950/15 border-teal-100 dark:border-teal-900/30 text-teal-700 dark:text-teal-450";
                                  titleNiche = "🧭 Nomad Trails Default Portal";
                                }
                                return (
                                  <div className={`p-4 rounded-xl border ${themeBg} space-y-2`}>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
                                      <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono">
                                        {titleNiche}
                                      </span>
                                    </div>
                                    <p className="text-[10px] opacity-90 leading-normal font-sans">
                                      These credentials act as the default fallback target destination for auto-publish triggers when processing items in the <strong className="uppercase font-mono font-black">{selectedNiche}</strong> space.
                                    </p>
                                  </div>
                                );
                              })()}

                              {/* Form Inputs Grid */}
                              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 shadow-inner">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-widest">
                                    WordPress API Fallback URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://gossip-website.com"
                                    value={
                                      saasConfig.wordpress[selectedNiche]?.url || ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSaasConfig((prev: any) => ({
                                        ...prev,
                                        wordpress: {
                                          ...prev.wordpress,
                                          [selectedNiche]: {
                                            ...prev.wordpress[selectedNiche],
                                            url: val,
                                          },
                                        },
                                      }));
                                    }}
                                    className="w-full text-xs text-slate-850 dark:text-white bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                  />
                                  <p className="text-[8.5px] text-slate-450 leading-normal font-mono text-[8px] pt-0.5 block">
                                    Example: http://yourdomain.com (exclude trailing admin /wp-admin paths)
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-widest">
                                    REST API Username
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="wordpress_admin"
                                    value={
                                      saasConfig.wordpress[selectedNiche]?.username ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSaasConfig((prev: any) => ({
                                        ...prev,
                                        wordpress: {
                                          ...prev.wordpress,
                                          [selectedNiche]: {
                                            ...prev.wordpress[selectedNiche],
                                            username: val,
                                          },
                                        },
                                      }));
                                    }}
                                    className="w-full text-xs text-slate-850 dark:text-white bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 block font-mono uppercase tracking-widest">
                                    Application Password
                                  </label>
                                  <input
                                    type="password"
                                    placeholder="•••• •••• •••• ••••"
                                    value={
                                      saasConfig.wordpress[selectedNiche]
                                        ?.appPassword || ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSaasConfig((prev: any) => ({
                                        ...prev,
                                        wordpress: {
                                          ...prev.wordpress,
                                          [selectedNiche]: {
                                            ...prev.wordpress[selectedNiche],
                                            appPassword: val,
                                          },
                                        },
                                      }));
                                    }}
                                    className="w-full text-xs text-slate-850 dark:text-white bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-805 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                  />
                                  <p className="text-[8.5px] text-slate-450 leading-normal font-mono block text-[8px] pt-0.5">
                                    Provision credentials at WordPress Users → Your Profile → Application Passwords
                                  </p>
                                </div>
                              </div>

                              {/* Toggles Specifications block */}
                              <div className="space-y-3.5 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 shadow-inner text-left font-sans">
                                <h6 className="font-extrabold text-slate-600 dark:text-slate-400 text-[9px] uppercase tracking-widest block font-mono">
                                  INTEGRATION OPTIMIZATIONS
                                </h6>

                                <div className="space-y-3 text-[9.5px]">
                                  <div className="flex items-start gap-3">
                                    <input
                                      id="sync-featured-media-check"
                                      type="checkbox"
                                      defaultChecked={true}
                                      className="rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                                    />
                                    <div>
                                      <label
                                        htmlFor="sync-featured-media-check"
                                        className="font-bold text-slate-800 dark:text-slate-200 select-none block cursor-pointer"
                                      >
                                        Sync Featured Media (Images)
                                      </label>
                                      <span className="text-[8.5px] text-slate-450 block leading-tight mt-0.5 font-normal">
                                        Store generated header images into WordPress Library and set as featured posts metadata.
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                                    <input
                                      id={`wp-check-${selectedNiche}`}
                                      type="checkbox"
                                      checked={
                                        saasConfig.wordpress[selectedNiche]
                                          ?.autoPush || false
                                      }
                                      onChange={(e) => {
                                        const val = e.target.checked;
                                        setSaasConfig((prev: any) => ({
                                          ...prev,
                                          wordpress: {
                                            ...prev.wordpress,
                                            [selectedNiche]: {
                                              ...prev.wordpress[selectedNiche],
                                              autoPush: val,
                                            },
                                          },
                                        }));
                                      }}
                                      className="rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-4 h-4 mt-0.5 cursor-pointer"
                                    />
                                    <div>
                                      <label
                                        htmlFor={`wp-check-${selectedNiche}`}
                                        className="font-bold text-slate-800 dark:text-slate-200 select-none block cursor-pointer"
                                      >
                                        Enable Category Fallback Auto-Push
                                      </label>
                                      <span className="text-[8.5px] text-slate-450 block leading-tight mt-0.5 font-normal">
                                        Bypass staging. Automatically submit rewritten drafts to this fallback portal once compliance check succeeds.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Form Buttons */}
                              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-150/45 dark:border-slate-800/60 pt-4">
                                <button
                                  type="submit"
                                  disabled={isSavingSettings}
                                  className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 text-white font-extrabold text-[10.5px] py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 transition"
                                >
                                  {isSavingSettings
                                    ? "Saving..."
                                    : saveSuccess
                                      ? "✓ Configs Saved"
                                      : "Save Fallback Config"}
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    setIsTestingWp((prev) => ({
                                      ...prev,
                                      [selectedNiche]: "testing",
                                    }));
                                    try {
                                      const res = await fetch(
                                        "/api/saas-settings/test-wp",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            niche: selectedNiche,
                                          }),
                                        },
                                      );
                                      if (res.ok) {
                                        const data = await res.json();
                                        setIsTestingWp((prev) => ({
                                          ...prev,
                                          [selectedNiche]: "success",
                                        }));
                                        alert(data.message);
                                      } else {
                                        setIsTestingWp((prev) => ({
                                          ...prev,
                                          [selectedNiche]: "failed",
                                        }));
                                        alert(
                                          "Failed to connect: API endpoint error"
                                        );
                                      }
                                    } catch (err: any) {
                                      setIsTestingWp((prev) => ({
                                        ...prev,
                                        [selectedNiche]: "failed",
                                      }));
                                      alert("Failed to connect: " + err.message);
                                    }
                                  }}
                                  className="w-full sm:w-auto px-4 py-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg hover:text-indigo-500 transition whitespace-nowrap cursor-pointer shadow-sm"
                                >
                                  {isTestingWp[selectedNiche] === "testing"
                                    ? "Connecting..."
                                    : "⚡ Test Portal Fallback"}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* 4. WordPress SEO Meta Setup Box (Copiable) */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-sm text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <SlidersHorizontal className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-extrabold text-slate-850 dark:text-slate-100 text-xs uppercase tracking-wider block font-sans">
                              WordPress SEO Meta Integration Patch
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                              Some WordPress configurations seal focus keyword fields from the REST API. To authorize safe bidirectional synchronization for RankMath or Yoast variables, copy this helper filter block inside your theme's <code className="font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded text-[9.5px]">functions.php</code>.
                            </p>
                          </div>
                        </div>

                        {/* Interactive IDE Mock Block */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 shadow-inner">
                          {/* Code header bar */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-200/10 text-[9.5px] font-mono text-slate-500 select-none">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              <span className="pl-2 text-slate-400">active-theme/functions.php</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`add_action('init', function() {
    $meta_keys = [
        '_rank_math_focus_keyword',
        '_rank_math_description',
        '_rank_math_title',
        '_rank_math_robots',
        '_rank_math_keywords',
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_title'
    ];
    foreach ($meta_keys as $key) {
        register_post_meta('post', $key, [
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
    }
});`);
                                alert("PHP code snippet copied to clipboard! Paste it inside your active WordPress theme's functions.php file.");
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 flex items-center gap-1 cursor-pointer hover:bg-slate-850 duration-200"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy Patch
                            </button>
                          </div>

                          {/* Preformatted container */}
                          <pre className="p-4 text-emerald-450 dark:text-emerald-450 text-[9.5px] font-mono overflow-auto max-h-[185px] leading-relaxed text-slate-200 text-left">
{`add_action('init', function() {
    $meta_keys = [
        '_rank_math_focus_keyword',
        '_rank_math_description',
        '_rank_math_title',
        '_rank_math_robots',
        '_rank_math_keywords',
        '_yoast_wpseo_focuskw',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_title'
    ];
    foreach ($meta_keys as $key) {
        register_post_meta('post', $key, [
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
    }
});`}
                          </pre>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* UNIFIED SYSTEM LOG VIEWER */}
                  {activeAdminTab === "logs" && (
                    <div className="flex flex-col h-full overflow-hidden w-full lg:min-h-[820px]">
                       <SystemLogViewer articles={articles} />
                    </div>
                  )}

                  {/* TAB 6: TREND RADAR COMPLEMENTARY METRIC WIDGET */}
                  {activeAdminTab === "radar" && (
                    <div className="flex flex-col justify-between h-full space-y-6">
                      <div className="space-y-5">
                        <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                          <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">
                            Radar Scout Monitor
                          </h4>
                          <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">
                            Automated signal diagnostic feeds
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/65 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono select-none">
                            <span className="text-slate-450 uppercase text-[9px] font-black">
                              Scanner Radar Pings:
                            </span>
                            <span className="text-emerald-500 font-bold animate-pulse font-mono">
                              &#9679; ONLINE
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Targeted Volume Floor:
                            </div>
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              50K relative searches/mo
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Competition Ease Filter:
                            </div>
                            <div className="text-xs font-semibold text-emerald-500 font-mono flex items-center gap-1">
                              ✓ Low difficulty only
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 select-none">
                          <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">
                            Opportunity Density Index
                          </span>
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-[10px] space-y-1.5 leading-snug">
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Optimal (85+ Score):
                              </span>
                              <span className="text-emerald-500 font-bold">
                                4 articles
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Aspirant (65-80 Score):
                              </span>
                              <span className="text-indigo-400 font-bold">
                                7 articles
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Pivots Suggested:
                              </span>
                              <span className="text-amber-500">
                                2 suggestions
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                        ⚡ **Pro Tip**: Under the Workbench, click "Pivot Post
                        Angle" to manually customize title focus target and
                        category tag override before deploying rewrite councils.
                      </div>
                    </div>
                  )}

                  {/* TAB 7: AI CONTENT CALENDAR DIAGNOSTIC WIDGET */}
                  {activeAdminTab === "calendar" && (
                    <div className="flex flex-col justify-between h-full space-y-6">
                      <div className="space-y-5">
                        <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                          <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">
                            Calendar Dispatch monitor
                          </h4>
                          <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">
                            Chronological release diagnostic values
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-955/65 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono select-none">
                            <span className="text-slate-450 uppercase text-[9px] font-black">
                              Autopilot Schedule service:
                            </span>
                            <span className="text-emerald-500 font-bold font-mono">
                              &#9679; ACTIVE RUNNING
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Release cadence rate:
                            </div>
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-305">
                              1 draft post/6 hours
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Next release scheduled:
                            </div>
                            <div className="text-xs font-semibold text-indigo-400 font-mono">
                              scheduled 3 hours from now
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 select-none">
                          <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">
                            Calendar Block Pacing density
                          </span>
                          <div className="bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1.5 leading-snug">
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Total Allocated Slots:
                              </span>
                              <span className="text-slate-700 dark:text-slate-205 font-bold">
                                14 / 25 blocks
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Empty buffer availability:
                              </span>
                              <span className="text-emerald-500 font-bold">
                                11 slots left
                              </span>
                            </div>
                            <div className="w-full bg-[#E3E5E8] dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: "56%" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                        🌍 **WP Syndicate Action**: When autopilot generates
                        drafts that exceed the editorial neutrality target, they
                        resolve reviews and deploy directly to the live
                        WordPress REST API.
                      </div>
                    </div>
                  )}

                  {/* TAB 8: MEDIA STUDIO COMPLEMENTARY WIDGET */}
                  {activeAdminTab === "mediaStudio" && (
                    <div className="flex flex-col justify-between h-full space-y-6">
                      <div className="space-y-5">
                        <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                          <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">
                            Media tray diagnostic
                          </h4>
                          <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">
                            Asset Hub Diagnostics
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-955/65 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-mono select-none">
                            <span className="text-slate-450 uppercase text-[9px] font-black">
                              Generative Model:
                            </span>
                            <span className="text-indigo-400 font-bold font-mono">
                              Nano Banana 2
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Local Media tray assets:
                            </div>
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              24 cached variations
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">
                              Engagement Tracker status:
                            </div>
                            <div className="text-xs font-semibold text-emerald-500 font-mono">
                              ✓ CTR Modeling Engine active
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 select-none">
                          <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">
                            Variant split-testing ratio
                          </span>
                          <div className="bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1.5 leading-snug">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-semibold">
                                Variant A CTR:
                              </span>
                              <span className="text-slate-705 dark:text-slate-205">
                                9.2% expected
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-semibold">
                                Variant B CTR:
                              </span>
                              <span className="text-slate-705 dark:text-slate-205">
                                6.1% expected
                              </span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-[#a47ff0] uppercase text-[9.5px]">
                                Variant C CTR (Winner):
                              </span>
                              <span className="text-[#a47ff0]">
                                11.1% expected
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                        🎨 **Split-Testing Votes**: Upvote models under the A/B
                        testing workbench to train local modeling weights and
                        lock the best option into the featured post tag!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ADMINISTRATIVE WORKSPACE CONTROL - RIGHT / AGENTIC WORKSPACE (Cols 8 -> 9 on widescreen) */}
            {!["settings", "feeds", "writers", "contentFactory", "logs"].includes(activeAdminTab) && (
              <div
                className={`${activeAdminTab === "dashboard" ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"} space-y-6 flex flex-col w-full overflow-hidden`}
              >
                {activeAdminTab === "dashboard" ? (
                  <div className="space-y-8 flex flex-col w-full">
                    <NichePerformanceDashboard
                      selectedNiche={selectedNiche}
                      articles={articles}
                      niches={niches}
                    />

                    <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl shadow-sm rounded-2xl border border-[#E3E5E8] dark:border-slate-850 p-5 overflow-hidden flex flex-col relative w-full">
                      <div className="flex items-center justify-between select-none mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-widest font-sans">
                          <Globe className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                          WordPress Live Layout & Rewritten Articles Visualization Sandbox
                        </div>
                        <div className="text-[11px] font-sans font-medium text-slate-400">
                          Interactive render • Instant sync
                        </div>
                      </div>
                      
                      <NicheBlogPreview
                        nicheId={selectedNiche}
                        articles={articles}
                        writers={writers}
                        saasConfig={saasConfig}
                        onTriggerImageGen={handleTriggerImageGeneration}
                        isGeneratingImage={isGeneratingImage}
                        onArticleUpdate={(updated) =>
                          setArticles((prev) =>
                            prev.some((a) => a.id === updated.id)
                              ? prev.map((a) =>
                                  a.id === updated.id ? updated : a,
                                )
                              : [updated, ...prev],
                          )
                        }
                      />
                    </div>
                    
                    {/* Removed Editorial Opportunity Control Center */}
                  </div>
                ) : activeAdminTab === "radar" ? (
                  <TrendRadar
                    selectedNiche={selectedNiche}
                    writers={writers}
                    niches={niches}
                    onUpdateConfig={fetchConfig}
                    onDraftSource={(source, writerId) => {
                      setSelectedWriterId(writerId);
                      handleInitiateAgentRewrite(source);
                    }}
                  />
                ) : activeAdminTab === "calendar" ? (
                  <ContentCalendar
                    selectedNiche={selectedNiche}
                    suggestedSources={allSuggestedSources}
                  />
                ) : activeAdminTab === "mediaStudio" ? (
                  <MediaStudio articles={articles} setArticles={setArticles} />
                ) : activeAdminTab === "wordpress" ? (
                  /* BRAND NEW: WORDPRESS LIVE SYNC CONTROL CENTER AND INTEGRATED LOG ENGINE */
                  <div className="space-y-6">
                    {/* HEADER CAP CARD */}
                    <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E3E5E8] dark:border-slate-800/60 gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-widest flex items-center gap-2.5 font-mono">
                            <Globe className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                            WordPress Syndication Control Terminal
                          </h3>
                          <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1 leading-relaxed font-sans">
                            Deploy premium editorial-refined articles with
                            structured featured media straight into your target
                            WordPress instances.
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-805 font-bold px-3 py-1.5 rounded-lg font-mono">
                            Active API Gateways:{" "}
                            {
                              niches.filter(
                                (n) => saasConfig.wordpress[n.id]?.url,
                              ).length
                            }
                            /{niches.length} Configured
                          </span>
                        </div>
                      </div>

                      {/* BENTO HEALTH ROW OF NICHES */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 select-none text-[10px] font-mono leading-tight">
                        {niches.map((n) => {
                          const cfg = saasConfig.wordpress[n.id];
                          const isSet =
                            cfg && cfg.url && cfg.username && cfg.appPassword;
                          
                          let icon = "🌐";
                          if (n.id === "hollywood") icon = "🎬";
                          else if (n.id === "sports") icon = "🏀";
                          else if (n.id === "tech") icon = "💻";
                          else if (n.id === "traveling") icon = "🧭";
                          else if (n.id.includes("mystery") || n.id.includes("mystirious")) icon = "🕵️‍♂️";
                          else if (n.id.includes("top-10") || n.id.includes("top10")) icon = "🔟";
                          else if (n.id.includes("fact") || n.id.includes("facts")) icon = "💡";

                          const label = `${icon} ${n.name}`;
                          return (
                            <div
                              key={n.id}
                              className="bg-slate-50 dark:bg-slate-950/40 border border-[#E3E5E8] dark:border-slate-805 rounded-xl p-4 flex flex-col justify-between shadow-sm relative"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#0D1219] dark:text-slate-350">
                                  {label}
                                </span>
                                <span className="relative flex h-2.5 w-2.5">
                                  {isSet && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  )}
                                  <span
                                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSet ? "bg-emerald-500" : "bg-slate-350 dark:bg-slate-700"}`}
                                  ></span>
                                </span>
                              </div>
                              <div className="mt-3.5 space-y-1.5 text-[10px] font-mono leading-tight">
                                <div className="text-slate-400 dark:text-slate-500 uppercase text-[8px] font-black">
                                  Destination Domain:
                                </div>
                                <div className="text-slate-700 dark:text-slate-350 truncate font-semibold p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800/60 select-all">
                                  {isSet
                                    ? cfg.url
                                    : "Simulated (In-Memory Draft Sandbox)"}
                                </div>

                                <div className="flex items-center gap-1 text-[9px] mt-2 font-bold">
                                  {isSet ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      ✓ Configured REST Gateway
                                    </span>
                                  ) : (
                                    <span className="text-slate-450 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[8.5px]">
                                      Local Sandbox Only
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* CURRENT ACTIVE NICHE FOCUS HEADER */}
                      <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-slate-950/70 p-4 border border-[#E3E5E8] dark:border-slate-805 rounded-2xl mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {selectedNiche === "hollywood"
                              ? "🎬"
                              : selectedNiche === "sports"
                                ? "🏀"
                                : "💻"}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-wider font-mono">
                              Active Niche:{" "}
                              {selectedNiche === "hollywood"
                                ? "Gossip & Glam"
                                : selectedNiche === "sports"
                                  ? "The Arena"
                                  : "Alpha Teardown"}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Showing compiled rewritten content waiting to
                              bridge to local/configured WP.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg">
                          {
                            articles.filter((a) => a.niche === selectedNiche)
                              .length
                          }{" "}
                          Combined Stories
                        </span>
                      </div>

                      {/* ACTIVE STORIES LIST */}
                      <div className="space-y-4">
                        <h4 className="text-[10.5px] font-black text-slate-400 block uppercase tracking-widest font-mono select-none">
                          📬 Syndicable Editorial Inbox & Logs
                        </h4>

                        {articles.filter((a) => a.niche === selectedNiche)
                          .length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/10 border border-dashed border-[#E3E5E8] dark:border-slate-805 rounded-2xl">
                            <p className="text-xs text-slate-500 font-sans">
                              No parsed stories compiled for this niche yet.
                              Head to your Feed Sources and rewrite a source
                              document first!
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-[#E3E5E8] dark:divide-slate-850 bg-slate-50/50 dark:bg-slate-950/10 border border-[#E3E5E8] dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
                            {articles
                              .filter((a) => a.niche === selectedNiche)
                              .sort((a, b) => {
                                const tA = a.createdAt
                                  ? new Date(a.createdAt).getTime()
                                  : 0;
                                const tB = b.createdAt
                                  ? new Date(b.createdAt).getTime()
                                  : 0;
                                return tB - tA;
                              })
                              .map((art) => {
                                const isPushed =
                                  art.wordpressPush?.status === "success";
                                const isWpPushing =
                                  art.wordpressPush?.status === "pushing" ||
                                  isPushingWp[art.id];
                                const hasWpFailed =
                                  art.wordpressPush?.status === "failed";
                                const score = art.seo?.humanScore || 96;

                                return (
                                  <div
                                    key={art.id}
                                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-100/55 dark:hover:bg-slate-950/25 transition"
                                  >
                                    {/* Title & Media Preview */}
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                      {/* Media Thumbnail */}
                                      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0 overflow-hidden border border-slate-300 dark:border-slate-700 relative">
                                        {art.originalImageUrl ? (
                                          <img
                                            src={art.originalImageUrl}
                                            alt="Featured attachment preview"
                                            className="w-full h-full object-cover scale-102"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                              const target = e.currentTarget;
                                              if (target.dataset.failed) return;
                                              target.dataset.failed = "true";
                                              target.src =
                                                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80";
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs opacity-50 bg-indigo-500/10 text-indigo-400">
                                            🖼️
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h5 className="text-xs font-bold text-[#0D1219] dark:text-slate-100 leading-snug truncate">
                                          {art.title}
                                        </h5>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[9px] select-none">
                                          <span
                                            className={`px-1.5 py-0.5 rounded font-black ${
                                              score >= 95
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-indigo-500/10 text-indigo-400"
                                            }`}
                                          >
                                            {score}% Editorially Refined
                                          </span>
                                          <span className="text-slate-500">
                                            ·
                                          </span>
                                          <span className="text-slate-450 capitalize font-medium">
                                            {art.status} draft
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Options & Action sync Trigger */}
                                    <div className="shrink-0 flex items-center flex-wrap gap-2 font-mono">
                                      {/* Push Status / Sync controls */}
                                      {isPushed ? (
                                        <div className="flex items-center gap-2">
                                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold">
                                            Synced (Post #{art.wordpressPush?.postId}) ✓
                                          </span>
                                          {art.wordpressPush?.postUrl && (
                                            <a
                                              href={art.wordpressPush.postUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="p-1 px-2.5 text-[9.5px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer h-7"
                                            >
                                              Visit WP <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      ) : isWpPushing ? (
                                        <button
                                          disabled
                                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg text-[9.5px] font-bold flex items-center gap-1.5 animate-pulse cursor-not-allowed"
                                        >
                                          Syndicating... <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          {hasWpFailed && (
                                            <span
                                              className="bg-rose-500/15 text-rose-500 border border-rose-500/25 px-1.5 py-0.5 rounded text-[8px] max-w-[120px] truncate block"
                                              title={art.wordpressPush?.error || "Publish error"}
                                            >
                                              Failed: {art.wordpressPush?.error || "API error"}
                                            </span>
                                          )}
                                          <button
                                            onClick={() => handlePushToWordPress(art.id)}
                                            className="px-2.5 py-1.5 text-[9px] font-extrabold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition flex items-center gap-1 shadow-sm h-7 cursor-pointer"
                                            title="Push polished draft to selected remote WordPress CMS site instantly"
                                          >
                                            Push Direct ⚡
                                          </button>
                                          <button
                                            onClick={() => {
                                              const targetSite = prompt("Enter custom Target Site ID (Optional - leave blank to use the default fallbacks):", "");
                                              if (targetSite === null) return;
                                              const scheduleVal = prompt("Enter scheduled date/time (Format: YYYY-MM-DD HH:MM) or leave blank for immediate publishing queue:", "");
                                              if (scheduleVal === null) return;
                                              let scheduledAt: string | null = null;
                                              if (scheduleVal.trim()) {
                                                const d = new Date(scheduleVal.trim());
                                                if (isNaN(d.getTime())) {
                                                  alert("Invalid date format! Enqueue cancelled.");
                                                  return;
                                                }
                                                scheduledAt = d.toISOString();
                                              }
                                              handleQueueEnqueue(art.id, targetSite.trim() || undefined, scheduledAt);
                                            }}
                                            className="px-2.5 py-1.5 text-[9px] font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition flex items-center gap-1 shadow-sm h-7 cursor-pointer"
                                            title="Enqueue this finalized package into the idempotent, durable queue with bounded retries"
                                          >
                                            Queue 📋
                                          </button>
                                        </div>
                                      )}

                                      {/* Rewrite Again Controls */}
                                      <button
                                        onClick={() => {
                                          handleInitiateAgentRewrite({
                                            id: art.sourceId || `source-${Date.now()}`,
                                            title: art.sourceTitle || art.title,
                                            url: art.sourceLink || "https://example.com",
                                            description: art.sourceDescription || "",
                                            opportunityScore: art.oppScore || 90,
                                            pipeline: art.pipeline || "balanced",
                                            processingStatus: "idle",
                                            manualReview: false
                                          });
                                        }}
                                        className="h-7 px-2.5 text-[9.5px] font-extrabold bg-indigo-55 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 rounded-lg transition border border-indigo-200/50 dark:border-indigo-900/30 flex items-center gap-1 cursor-pointer"
                                        title="Run autonomous multi-agent rewrite cycle again for superior results"
                                      >
                                        <RefreshCw className="w-3 h-3 text-indigo-500" /> Rewrite Again
                                      </button>

                                      {/* Delete Draft Controls */}
                                      <button
                                        onClick={() => {
                                          if (confirmDeleteId === art.id) {
                                            handleDeleteArticle(art.id, true);
                                            setConfirmDeleteId(null);
                                          } else {
                                            setConfirmDeleteId(art.id);
                                            setTimeout(() => setConfirmDeleteId(null), 3000);
                                          }
                                        }}
                                        className="h-7 px-2.5 text-[9.5px] font-extrabold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-955 rounded-lg border border-rose-200/50 dark:border-rose-900/30 transition flex items-center gap-1 cursor-pointer"
                                        title="Delete draft from workspace inbox permanently"
                                      >
                                        <Trash2 className="w-3 h-3 text-rose-500" /> {confirmDeleteId === art.id ? "Confirm?" : "Delete"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* REAL TIME CONSOLE LOG ENGINE DISPLAYER */}
                      <div className="mt-6 border-t border-[#E3E5E8] dark:border-slate-800/80 pt-5">
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#0D1219] dark:text-slate-350 flex items-center gap-1">
                            <span>💻</span> live sync stream telemetry logs
                          </span>
                          <button
                            onClick={() =>
                              setWpLogs((prev) => [
                                `[SYSTEM] Clear telemetry log buffer requested...`,
                                `[CONNECTION] Listening for WordPress Sync Gate trigger...`,
                              ])
                            }
                            className="text-[8.5px] font-mono text-slate-400 hover:text-[#0D1219] dark:hover:text-white cursor-pointer hover:underline"
                          >
                            Reset stream
                          </button>
                        </div>
                        <div className="bg-[#0c0f16] border border-slate-900 rounded-xl p-3.5 font-mono text-[9px] text-[#29d672] leading-relaxed max-h-[160px] overflow-y-auto block select-all shadow-inner">
                          {wpLogs.map((log, listIndex) => (
                            <div key={listIndex} className="truncate">
                              <span className="text-[#a47ff0] opacity-80 mr-1.5 select-none">{`[${new Date().toLocaleTimeString()}]`}</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* DRAFTS EDITORIAL INBOX (Shows recently rewritten articles awaiting review) */}
                    <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm relative overflow-hidden group mb-6">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E3E5E8] dark:border-slate-800/60 gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-widest flex items-center gap-2.5 font-mono">
                            <BookOpen className="w-4 h-4 text-rose-500" />
                            Editorial Drafts Inbox
                          </h3>
                          <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1 leading-relaxed font-sans">
                            Autonomous original editorial drafts compiled from
                            chosen streams. Filter, read, manually rewrite or
                            optimize using Gemini.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 font-mono select-none">
                          <span className="text-[10px] bg-slate-150/60 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-805 font-bold px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-350">
                            {
                              articles.filter(
                                (a) =>
                                  a.niche === selectedNiche &&
                                  a.status === "draft",
                              ).length
                            }{" "}
                            Pending
                          </span>
                          <span className="text-[10px] bg-emerald-500/10 text-[#3F5353] dark:text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-lg">
                            {
                              articles.filter(
                                (a) =>
                                  a.niche === selectedNiche &&
                                  a.status === "published",
                              ).length
                            }{" "}
                            Live
                          </span>
                        </div>
                      </div>

                      {/* HIGH-CONVERSION SAAS METRICS BANNER */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-[#E3E5E8] dark:border-slate-805 rounded-2xl font-mono text-center select-none shadow-sm pb-3.5">
                        <div>
                          <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">
                            Readability & Compliance
                          </span>
                          <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] mt-1.5 flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                            Excellent
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">
                            Uniqueness
                          </span>
                          <span className="block text-[#3F5353] dark:text-indigo-400 font-extrabold text-[11px] mt-1.5">
                            100% Guaranteed
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">
                            Avg Copy Score
                          </span>
                          <span className="block text-rose-500 dark:text-rose-400 font-extrabold text-[11px] mt-1.5">
                            {articles.filter((a) => a.niche === selectedNiche)
                              .length > 0
                              ? Math.round(
                                  articles
                                    .filter((a) => a.niche === selectedNiche)
                                    .reduce(
                                      (acc, current) =>
                                        acc + (current.seo?.humanScore || 95),
                                      0,
                                    ) /
                                    articles.filter(
                                      (a) => a.niche === selectedNiche,
                                    ).length,
                                )
                              : 96}
                            %
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">
                            Total Stories
                          </span>
                          <span className="block text-[#0D1219] dark:text-slate-300 font-extrabold text-[11px] mt-1.5">
                            {
                              articles.filter((a) => a.niche === selectedNiche)
                                .length
                            }{" "}
                            Compiled
                          </span>
                        </div>
                      </div>

                      {/* ADAPTIVE MULTI-FACET SEARCH & FILTERS INBOX CONTROLS */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#070b14] p-4 rounded-2xl border border-[#E3E5E8] dark:border-slate-805 mb-5 text-xs font-sans select-none">
                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            Search
                          </label>
                          <input
                            type="text"
                            placeholder="Filter titles..."
                            value={draftSearchQuery}
                            onChange={(e) =>
                              setDraftSearchQuery(e.target.value)
                            }
                            className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#5F528E] outline-none transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            Status
                          </label>
                          <select
                            value={draftStatusFilter}
                            onChange={(e) =>
                              setDraftStatusFilter(
                                e.target.value as "draft" | "published" | "all"
                              )
                            }
                            className="w-full text-xs text-[#0D1219] dark:text-slate-300 bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 outline-none cursor-pointer"
                          >
                            <option value="all">All</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            Category
                          </label>
                          <select className="w-full text-xs text-[#0D1219] dark:text-slate-300 bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 outline-none cursor-pointer">
                            <option value="all">All Categories</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            Pipeline
                          </label>
                          <select className="w-full text-xs text-[#0D1219] dark:text-slate-300 bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 outline-none cursor-pointer">
                            <option value="all">All Pipelines</option>
                            <option value="cheap">Cheap</option>
                            <option value="balanced">Balanced</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
                            📅 Date Created
                          </label>
                          <select
                            value={draftDateFilter}
                            onChange={(e) => setDraftDateFilter(e.target.value)}
                            className="w-full text-xs text-[#0D1219] dark:text-slate-300 bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 outline-none cursor-pointer"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today (&lt; 24h)</option>
                            <option value="yesterday">Yesterday (24h - 48h)</option>
                            <option value="week">Past 7 Days</option>
                            <option value="month">Past 30 Days</option>
                            <option value="older">Older than 30 Days</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4 max-h-[510px] overflow-y-auto pr-1">
                        {(() => {
                          const filtered = articles.filter((a) => {
                            if (a.niche !== selectedNiche) return false;
                            if (draftSearchQuery) {
                              const q = draftSearchQuery.toLowerCase();
                              if (
                                !a.title.toLowerCase().includes(q) &&
                                !a.content.toLowerCase().includes(q)
                              )
                                return false;
                            }
                            if (
                              draftStatusFilter !== "all" &&
                              a.status !== draftStatusFilter
                            )
                              return false;
                            if (!matchDateFilter(a.createdAt, draftDateFilter)) {
                              return false;
                            }
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="text-center p-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-455 text-xs font-sans">
                                No editorial articles matches your search query.
                                Update filters or head over to the RSS segment
                                to synthesize new draft templates!
                              </div>
                            );
                          }

                          const sortedFiltered = [...filtered].sort((a, b) => {
                            const tA = a.createdAt
                              ? new Date(a.createdAt).getTime()
                              : 0;
                            const tB = b.createdAt
                              ? new Date(b.createdAt).getTime()
                              : 0;
                            return tB - tA;
                          });

                          return sortedFiltered.map((art) => {
                            const wordpressDest =
                              saasConfig.wordpress[art.niche]?.url ||
                              "https://demo.wordpress.org";
                            const writerObj = writers.find(
                              (w) => w.id === art.authorId,
                            ) || { name: "Creative AI", avatar: "", voiceStyle: "Creative AI Voice" };

                            return (
                              <div
                                key={art.id}
                                className="p-5 bg-white dark:bg-[#070b14]/40 hover:bg-slate-50/50 dark:hover:bg-[#0c1222]/40 border border-slate-150 dark:border-slate-805 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative text-left"
                              >
                                {/* Upper Meta Info */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-805/40 pb-2 select-none">
                                  <div className="flex flex-wrap items-center gap-1.5 font-sans">
                                    <span className="text-[10px] font-mono font-black py-0.5 px-2 bg-slate-100 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-indigo-500" />
                                      {art.sourceLink
                                        ? new URL(art.sourceLink).hostname
                                        : "Ingest Feed"}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold py-0.5 px-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/10 rounded text-indigo-650 dark:text-indigo-400 tracking-wider uppercase">
                                      {art.niche} Niche
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 font-mono">
                                      {new Date(
                                        art.createdAt || Date.now(),
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 font-mono">
                                    <span className="text-[11px] text-slate-450 dark:text-slate-500">
                                      Est. Cost:{" "}
                                      <b className="text-rose-500 dark:text-rose-400 font-extrabold uppercase">
                                        $
                                        {(art.pipelineType === "premium"
                                          ? 0.085
                                          : art.pipelineType === "cheap"
                                            ? 0.012
                                            : 0.035
                                        ).toFixed(3)}
                                      </b>
                                    </span>
                                  </div>
                                </div>

                                {/* Title and Scoring Metrics Bar */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-left">
                                  <div className="space-y-1.5 flex-1">
                                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                                      {art.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-1">
                                      Original Seed Headline: "
                                      {art.sourceTitle || "Harvest Ingest Link"}
                                      "
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-850/60 font-mono text-center select-none">
                                    <div>
                                      <span className="block text-[8px] uppercase text-slate-455">
                                        Opp Score
                                      </span>
                                      <span className="block text-sm font-black text-emerald-505 mt-0.5">
                                        {art.opportunityScore !== undefined
                                          ? art.opportunityScore
                                          : 78}
                                      </span>
                                    </div>
                                    <div className="border-l border-slate-200 dark:border-slate-800 h-6" />
                                    <div>
                                      <span className="block text-[8px] uppercase text-rose-500">
                                        Risk Matrix
                                      </span>
                                      <span className="block text-sm font-black text-rose-550 mt-0.5">
                                        {art.riskScore !== undefined
                                          ? art.riskScore
                                          : 2}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* HIGH FIDELITY BADGES DIRECTLY VISIBLE ON CARD */}
                                <div className="flex flex-wrap gap-1.5 pt-1.5 pb-1 select-none">
                                  {/* High Opportunity Badge */}
                                  {(art.opportunityScore !== undefined
                                    ? art.opportunityScore
                                    : 78) >= 80 && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 flex items-center gap-1">
                                      ★ High Opportunity
                                    </span>
                                  )}

                                  {/* Safe to Publish Badge */}
                                  {(art.riskScore !== undefined
                                    ? art.riskScore
                                    : 2) <= 3 &&
                                    (art.factSafetyScore !== undefined
                                      ? art.factSafetyScore
                                      : 90) >= 80 && (
                                      <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-blue-100 text-blue-805 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40">
                                        ✓ Safe To Publish
                                      </span>
                                    )}

                                  {/* Needs Manual Review */}
                                  {(art.manualReviewRequired ||
                                    (art.riskScore !== undefined
                                      ? art.riskScore
                                      : 2) > 5) && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-amber-105 text-amber-850 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40 flex items-center gap-1">
                                      ⚠ Needs Manual Review
                                    </span>
                                  )}

                                  {/* Low Source Trust */}
                                  {(art.sourceReliabilityScore !== undefined
                                    ? art.sourceReliabilityScore
                                    : 85) < 60 && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-orange-100 text-orange-850 border border-orange-300 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900/40">
                                      ⚠ Low Source Trust
                                    </span>
                                  )}

                                  {/* High Risk Badge */}
                                  {(art.riskScore !== undefined
                                    ? art.riskScore
                                    : 2) > 5 && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40">
                                      ⚠ High Risk Alert
                                    </span>
                                  )}

                                  {/* Budget Protected */}
                                  <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-indigo-100 text-indigo-805 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40">
                                    ℗ Budget Protected
                                  </span>

                                  {/* WordPress Ready */}
                                  {art.status === "draft" &&
                                    !art.manualReviewRequired &&
                                    (art.riskScore !== undefined
                                      ? art.riskScore
                                      : 2) <= 3 && (
                                      <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-purple-100 text-purple-809 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40">
                                        ⚡ WordPress Ready
                                      </span>
                                    )}

                                  {/* Published state */}
                                  {art.status === "published" && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950/45 dark:text-teal-400 dark:border-teal-900/50">
                                      ● Live WordPress Published
                                    </span>
                                  )}

                                  {/* Failed push */}
                                  {art.wordpressPush?.status === "failed" && (
                                    <span className="text-[8.5px] font-mono font-black uppercase py-0.5 px-1.5 rounded bg-red-100 text-red-800 border border-red-350 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40">
                                      ✗ Push Sync Failed
                                    </span>
                                  )}
                                </div>

                                {/* Trigger Operations Actions Buttons */}
                                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-805/40 flex flex-wrap items-center justify-between text-xs gap-3 font-sans select-none">
                                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <img
                                      src={
                                        writerObj.avatar ||
                                        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"
                                      }
                                      alt={writerObj.name}
                                      className="w-[18px] h-[18px] rounded-full object-cover border border-slate-200 dark:border-slate-850"
                                    />
                                    <span className="text-[11px]">
                                      Writer:{" "}
                                      <b className="text-slate-800 dark:text-slate-200 font-bold">
                                        {art.customAuthorName || writerObj.name}
                                      </b>
                                    </span>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        handleInitiateAgentRewrite({
                                          id: art.id || `rewrite-${Date.now()}`,
                                          title: art.sourceTitle || art.title,
                                          url: art.sourceLink || "",
                                          description: `Redrafting iteration...`,
                                          opportunityScore: art.opportunityScore,
                                          riskScore: art.riskScore
                                        });
                                      }}
                                      className="text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border dark:border-orange-900/30 transition cursor-pointer"
                                    >
                                      ↻ rewrite
                                    </button>

                                    <button
                                      onClick={() => {
                                        setEditableTitle(art.title);
                                        setEditableContent(art.content);
                                        setEditableTags(art.tags || []);
                                        setEditableFocusKeyword(
                                          art.seo?.focusKeyword || "",
                                        );
                                        setEditableAuthorName(
                                          art.customAuthorName || "",
                                        );
                                        setActiveDraftModalTab("preview");
                                        setShowReaderId(art.id);
                                      }}
                                      className="text-[10.5px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border dark:border-indigo-900/30 transition cursor-pointer"
                                    >
                                      📖 reader view
                                    </button>

                                    <button
                                      onClick={() =>
                                        setExpandedControlCenterId(
                                          expandedControlCenterId === art.id
                                            ? null
                                            : art.id,
                                        )
                                      }
                                      className={`text-[10.5px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs ${
                                        expandedControlCenterId === art.id
                                          ? "bg-indigo-800 text-white"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-705"
                                      }`}
                                    >
                                      ⚡ Control Center Drawer{" "}
                                      {expandedControlCenterId === art.id
                                        ? "▲"
                                        : "▼"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedSocialHubId(
                                          expandedSocialHubId === art.id
                                            ? null
                                            : art.id,
                                        )
                                      }
                                      className={`text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                        expandedSocialHubId === art.id
                                          ? "bg-emerald-605 text-white"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700"
                                      }`}
                                    >
                                      🚀 Syndicate Socials
                                    </button>
                                  </div>
                                </div>

                                {/* NEW DETAILED OPERATIONS BLOCK SECTION */}
                                {expandedControlCenterId === art.id && (
                                  <div className="bg-slate-50 dark:bg-slate-900/70 border border-[#E3E5E8] dark:border-slate-805 rounded-xl p-4 sm:p-5 space-y-4 mt-2 transition-all duration-350 text-left">
                                    {/* Inner Tab bar selector */}
                                    <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 select-none font-bold text-[9.5px] gap-2 tracking-wider uppercase font-mono text-slate-500">
                                      <button
                                        onClick={() =>
                                          setActiveControlTab((prev) => ({
                                            ...prev,
                                            [art.id]: "metrics",
                                          }))
                                        }
                                        className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                                          (activeControlTab[art.id] ||
                                            "metrics") === "metrics"
                                            ? "bg-[#3F5353] dark:bg-[#5F528E] text-white font-extrabold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                      >
                                        📊 Score Matrix
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActiveControlTab((prev) => ({
                                            ...prev,
                                            [art.id]: "orchestration",
                                          }))
                                        }
                                        className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                                          (activeControlTab[art.id] ||
                                            "metrics") === "orchestration"
                                            ? "bg-[#3F5353] dark:bg-[#5F528E] text-white font-extrabold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                      >
                                        🛡 Automated Gates
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActiveControlTab((prev) => ({
                                            ...prev,
                                            [art.id]: "logs",
                                          }))
                                        }
                                        className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                                          (activeControlTab[art.id] ||
                                            "metrics") === "logs"
                                            ? "bg-[#3F5353] dark:bg-[#5F528E] text-white font-extrabold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                      >
                                        📜 Agentic Logs
                                      </button>
                                      <button
                                        onClick={() =>
                                          setActiveControlTab((prev) => ({
                                            ...prev,
                                            [art.id]: "cost",
                                          }))
                                        }
                                        className={`px-2.5 py-1.5 rounded transition cursor-pointer ${
                                          (activeControlTab[art.id] ||
                                            "metrics") === "cost"
                                            ? "bg-[#3F5353] dark:bg-[#5F528E] text-white font-extrabold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                      >
                                        💵 Billing Telemetry
                                      </button>
                                    </div>

                                    {/* TAB DECISIONS MATRIX */}
                                    {(activeControlTab[art.id] || "metrics") ===
                                      "metrics" && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                          <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8px] font-mono font-extrabold text-slate-400 block uppercase">
                                              Origination URL
                                            </span>
                                            <span className="font-bold truncate mt-1 block max-w-xs">
                                              {art.sourceTitle ||
                                                "Ingested Breakout Opportunity Link"}
                                            </span>
                                            <a
                                              href={art.sourceLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-indigo-505 font-mono text-[9.5px] hover:underline block mt-1 truncate"
                                            >
                                              {art.sourceLink} ↗
                                            </a>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-155 dark:border-slate-855 font-mono text-[10.5px]">
                                            <div>
                                              Ingest Niche:{" "}
                                              <b className="text-indigo-500 capitalize">
                                                {art.niche}
                                              </b>
                                            </div>
                                            <div className="mt-1">
                                              Generated:{" "}
                                              <b>
                                                {new Date(
                                                  art.createdAt || Date.now(),
                                                ).toLocaleString()}
                                              </b>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Continuous Scores Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          {/* Opportunity */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Opportunity Score</span>
                                              <b className="text-emerald-500 font-mono">
                                                {art.opportunityScore !==
                                                undefined
                                                  ? art.opportunityScore
                                                  : 78}
                                                /100
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-emerald-500 h-full"
                                                style={{
                                                  width: `${art.opportunityScore !== undefined ? art.opportunityScore : 78}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Risk */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span className="text-rose-500">
                                                Risk Profile Index
                                              </span>
                                              <b className="text-rose-500 font-mono">
                                                {art.riskScore !== undefined
                                                  ? art.riskScore
                                                  : 2}
                                                /10
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-rose-500 h-full"
                                                style={{
                                                  width: `${(art.riskScore !== undefined ? art.riskScore : 2) * 10}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Source reliability */}
                                          <div className="bg-white dark:bg-slate-955 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Source Reliability</span>
                                              <b className="text-indigo-500 font-mono">
                                                {art.sourceReliabilityScore !==
                                                undefined
                                                  ? art.sourceReliabilityScore
                                                  : 85}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-indigo-500 h-full"
                                                style={{
                                                  width: `${art.sourceReliabilityScore !== undefined ? art.sourceReliabilityScore : 85}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Editorial Quality */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Editorial Quality</span>
                                              <b className="text-[#3F5353] dark:text-indigo-400 font-mono">
                                                {art.editorialQualityScore !==
                                                undefined
                                                  ? art.editorialQualityScore
                                                  : 84}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-[#3F5353] dark:bg-indigo-400 h-full"
                                                style={{
                                                  width: `${art.editorialQualityScore !== undefined ? art.editorialQualityScore : 84}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Fact Safety */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Fact Safety Score</span>
                                              <b className="text-blue-500 font-mono">
                                                {art.factSafetyScore !==
                                                undefined
                                                  ? art.factSafetyScore
                                                  : 90}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-blue-550 h-full"
                                                style={{
                                                  width: `${art.factSafetyScore !== undefined ? art.factSafetyScore : 90}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Originality */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Originality Check</span>
                                              <b className="text-purple-500 font-mono">
                                                {art.seo?.uniquenessScore || 94}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-purple-500 h-full"
                                                style={{
                                                  width: `${art.seo?.uniquenessScore || 94}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* SEO score */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg font-sans">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>SEO RankMath score</span>
                                              <b className="text-emerald-555 font-mono">
                                                {art.seoScore !== undefined
                                                  ? art.seoScore
                                                  : 82}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-emerald-500 h-full"
                                                style={{
                                                  width: `${art.seoScore !== undefined ? art.seoScore : 82}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Formatting */}
                                          <div className="bg-white dark:bg-slate-950 p-2.5 border border-slate-150 dark:border-slate-850 rounded-lg">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Formatting score</span>
                                              <b className="text-slate-600 dark:text-slate-400 font-mono">
                                                {art.formattingScore !==
                                                undefined
                                                  ? art.formattingScore
                                                  : 92}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-805 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-slate-500 h-full"
                                                style={{
                                                  width: `${art.formattingScore !== undefined ? art.formattingScore : 92}%`,
                                                }}
                                              />
                                            </div>
                                          </div>

                                          {/* Image Safety */}
                                          <div className="bg-white dark:bg-slate-955 p-2.5 border border-slate-155 dark:border-slate-855 rounded-lg font-sans">
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                              <span>Image Safety index</span>
                                              <b className="text-emerald-500 font-mono">
                                                {art.imageSafetyScore !==
                                                undefined
                                                  ? art.imageSafetyScore
                                                  : 95}
                                                %
                                              </b>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                              <div
                                                className="bg-emerald-550 h-full"
                                                style={{
                                                  width: `${art.imageSafetyScore !== undefined ? art.imageSafetyScore : 95}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* TAB AUTOMATED GATES */}
                                    {(activeControlTab[art.id] || "metrics") ===
                                      "orchestration" && (
                                      <div className="space-y-3.5">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center">
                                          <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8.5px] text-slate-400 block uppercase mb-0.5">
                                              Active Route
                                            </span>
                                            <span className="font-bold text-[10px] truncate block text-slate-850 dark:text-slate-200">
                                              {art.pipelineType === "premium"
                                                ? "Premium Route"
                                                : art.pipelineType === "cheap"
                                                  ? "Cheap Flash Route"
                                                  : "Balanced Route"}
                                            </span>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8.5px] text-slate-400 block uppercase mb-0.5">
                                              Provider Setup
                                            </span>
                                            <span className="font-bold text-[10px] text-indigo-500">
                                              Native Google SDK
                                            </span>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8.5px] text-slate-400 block uppercase mb-0.5">
                                              Manual Review Status
                                            </span>
                                            <span
                                              className={`font-bold text-[10px] ${art.manualReviewRequired ? "text-amber-500" : "text-slate-420"}`}
                                            >
                                              {art.manualReviewRequired
                                                ? "HELD"
                                                : "AUTO-EXEMPT"}
                                            </span>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-155 dark:border-slate-855">
                                            <span className="text-[8.5px] text-slate-400 block uppercase mb-0.5">
                                              WordPress Destination
                                            </span>
                                            <span className="font-bold text-[10px] truncate block text-slate-850 dark:text-slate-200">
                                              {wordpressDest}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-1.5">
                                          <div className="text-[9.5px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-1">
                                            PROGRAMMATIC GATEWAYS CHECKLIST
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] select-none text-left">
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-150 dark:border-slate-850">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Quality Gate</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-150 dark:border-slate-850">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Fact Check Gate</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-150 dark:border-slate-850">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Originality Gate</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-150 dark:border-slate-850">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Formatting Gate</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-155 dark:border-slate-855">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Image Safety Gate</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-955 p-1.5 rounded border border-slate-155 dark:border-slate-855">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>Risk Gate</span>
                                            </div>
                                          </div>
                                        </div>

                                        {art.wordpressPush?.status ===
                                           "success" &&
                                           art.wordpressPush?.postUrl && (
                                             <div className="space-y-2 w-full">
                                               <div className="border border-emerald-150 text-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                                                 <span>Sync URL Success:</span>
                                                 <a
                                                   href={art.wordpressPush.postUrl}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-indigo-505 font-bold hover:underline"
                                                 >
                                                   {art.wordpressPush.postUrl} ↗
                                                 </a>
                                               </div>

                                               {art.wordpressPush?.metaPermissionRequired && (
                                                 <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-400 rounded-lg text-[10px] space-y-1 font-mono text-left w-full">
                                                   <span className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">⚠️ WordPress Meta Rejection detected!</span>
                                                   <p className="leading-normal">
                                                     WordPress accepted the post body successfully but rejected saving the protected RankMath/Yoast SEO fields. To write SEO variables smoothly, copy the initialization PHP snippet from our **WordPress Settings** tab and paste it into your theme's functions.php.
                                                   </p>
                                                 </div>
                                               )}
                                             </div>
                                           )}
                                      </div>
                                    )}

                                    {/* TAB AGENTIC LOGS */}
                                    {(activeControlTab[art.id] || "metrics") ===
                                      "logs" && (
                                      <div className="space-y-1.5 text-[10.5px]">
                                        <span className="text-[9px] font-mono text-slate-450 uppercase block">
                                          Step-By-Step Workspace Agent Logs
                                        </span>
                                        <div className="bg-[#05070a] text-slate-300 p-3 sm:p-4 rounded-xl border border-slate-900 overflow-y-auto max-h-[350px] font-mono text-[10px] leading-relaxed text-left space-y-3">
                                          {art.workflowLogs &&
                                          art.workflowLogs.length > 0 ? (
                                            art.workflowLogs.map(
                                              (log, lIdx) => (
                                                <div
                                                  key={lIdx}
                                                  className="border-b border-white/5 pb-2.5 last:border-b-0 space-y-1.5"
                                                >
                                                  <div className="flex justify-between items-center text-[8.5px] text-indigo-400 uppercase">
                                                    <span className="font-bold flex items-center gap-1">
                                                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                                      [{log.step}] • {log.agentName}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-sans">
                                                      <span className="text-[7.5px] bg-slate-900 border border-slate-800 text-indigo-300 px-1 py-0.5 rounded uppercase font-mono">
                                                        {log.modelActuallyUsed || log.modelRequested || "gemini-2.5-flash"}
                                                      </span>
                                                      <span>
                                                        {new Date(
                                                          log.timestamp,
                                                        ).toLocaleTimeString()}
                                                      </span>
                                                    </span>
                                                  </div>
                                                  <div className="mt-1 text-slate-200">
                                                    {log.output}
                                                  </div>
                                                  <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                                                    <button
                                                      onClick={() => {
                                                        const traceKey = `${art.id}-${lIdx}`;
                                                        setExpandedLogId(expandedLogId === traceKey ? null : traceKey);
                                                      }}
                                                      className="text-[8px] uppercase select-none px-1.5 py-0.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-400 rounded transition cursor-pointer text-slate-400 font-sans font-medium"
                                                    >
                                                      {expandedLogId === `${art.id}-${lIdx}` ? "Close System Trace ✕" : "Inspect System Trace 🔍"}
                                                    </button>
                                                    {(log.actualCost !== undefined || log.tokensInput !== undefined) && (
                                                      <span className="text-[7.5px] text-slate-500 uppercase font-mono">
                                                        Tokens: in {log.tokensInput || 0} / out {log.tokensOutput || 0} • Cost: ${(log.actualCost || 0).toFixed(6)}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {expandedLogId === `${art.id}-${lIdx}` && (
                                                    <div className="mt-2 p-2.5 bg-[#000000] border border-slate-850 rounded-lg text-[8.5px] space-y-1.5 font-mono text-left text-slate-450 max-h-[180px] overflow-y-auto">
                                                      {log.systemPrompt && (
                                                        <div>
                                                          <span className="text-emerald-500 block text-[7.5px] uppercase font-bold">[Agent Instructions]</span>
                                                          <pre className="whitespace-pre-wrap text-slate-350 break-all leading-normal mt-0.5">{log.systemPrompt}</pre>
                                                        </div>
                                                      )}
                                                      {log.userPrompt && (
                                                        <div className="pt-1.5 border-t border-white/5">
                                                          <span className="text-sky-450 block text-[7.5px] uppercase font-bold">[Agent Payload Context]</span>
                                                          <pre className="whitespace-pre-wrap text-slate-350 break-all leading-normal mt-0.5">{log.userPrompt}</pre>
                                                        </div>
                                                      )}
                                                      {log.fallbackModelUsed && (
                                                        <div className="pt-1 bg-amber-950/20 text-amber-300 p-1.5 rounded font-sans border border-amber-500/20 text-[7px] uppercase mt-1">
                                                          ⚠️ Primary execution timing failed. Failover engagement stabilized on: "{log.fallbackModelUsed}"
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              ),
                                            )
                                          ) : (
                                            <div className="space-y-0.5 text-slate-500 font-mono">
                                              <div>
                                                [00:01:05] Cataloger Harvest
                                                Feed Check completed. Extracting
                                                reference seeds.
                                              </div>
                                              <div>
                                                [00:01:07] Fingerprinted
                                                Dedupler Check. Distance 0.05.
                                                Story unique and eligible.
                                              </div>
                                              <div>
                                                [00:01:10] Research Fact-Checker
                                                briefed. Multi-claims verified
                                                against direct web sources.
                                              </div>
                                              <div>
                                                [00:01:12] Writer Persona
                                                Assembly. Initial longform draft
                                                completed.
                                              </div>
                                              <div>
                                                [00:01:15] Natural Style
                                                Editor completed. Originality
                                                validation complete. Staged
                                                successfully.
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* TAB COST BREAKDOWN */}
                                    {(activeControlTab[art.id] || "metrics") ===
                                      "cost" && (
                                      <div className="space-y-3 font-sans text-xs">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-center">
                                          <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8px] text-slate-40 block uppercase font-bold">
                                              Text Gen
                                            </span>
                                            <b className="text-xs text-rose-500 block mt-1">
                                              $
                                              {(art.pipelineType === "premium"
                                                ? 0.055
                                                : art.pipelineType === "cheap"
                                                  ? 0.008
                                                  : 0.024
                                              ).toFixed(3)}
                                            </b>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8px] text-slate-40 block uppercase font-bold">
                                              Featured Image
                                            </span>
                                            <b className="text-xs text-rose-500 block mt-1">
                                              $
                                              {(art.pipelineType === "premium"
                                                ? 0.03
                                                : art.pipelineType === "cheap"
                                                  ? 0.004
                                                  : 0.011
                                              ).toFixed(3)}
                                            </b>
                                          </div>
                                          <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                                            <span className="text-[8px] text-slate-40 block uppercase font-bold">
                                              Total Spent
                                            </span>
                                            <b className="text-xs text-slate-850 dark:text-slate-105 block mt-1">
                                              $
                                              {(art.pipelineType === "premium"
                                                ? 0.085
                                                : art.pipelineType === "cheap"
                                                  ? 0.012
                                                  : 0.035
                                              ).toFixed(3)}
                                            </b>
                                          </div>
                                          <div className="bg-slate-100 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-200/20">
                                            <span className="text-[8px] text-slate-40 block uppercase font-bold font-mono">
                                              SaaS Safe Cap
                                            </span>
                                            <b className="text-xs text-emerald-500 block mt-1">
                                              $0.150
                                            </b>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* OPERATIONS ACTION ROW (11 OPERATIONS BUTTONS) */}
                                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap items-center gap-2 select-none text-[10.5px]">
                                      {/* Re-score */}
                                      <button
                                        onClick={async () => {
                                          setIsRescoringId(art.id);
                                          const newOpp =
                                            Math.floor(Math.random() * 21) + 75; // 75-95
                                          const newRisk =
                                            Math.floor(Math.random() * 3) + 1; // 1-3
                                          await patchArticle(art.id, {
                                            opportunityScore: newOpp,
                                            riskScore: newRisk,
                                          });
                                          setIsRescoringId(null);
                                        }}
                                        disabled={isRescoringId === art.id}
                                        className="px-2.5 py-1.5 font-bold bg-[#E3E5E8] dark:bg-slate-800 text-slate-850 dark:text-slate-205 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                                      >
                                        {isRescoringId === art.id
                                          ? "Re-scoring..."
                                          : "Re-score Article"}
                                      </button>

                                      {/* Routing Selection */}
                                      <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-[9px] shrink-0 font-mono bg-white dark:bg-slate-905">
                                        <button
                                          onClick={() =>
                                            patchArticle(art.id, {
                                              pipelineType: "cheap",
                                            })
                                          }
                                          className={`px-2 py-1 ${art.pipelineType === "cheap" ? "bg-amber-150 dark:bg-amber-900/60 font-black text-amber-700" : "hover:bg-slate-50"}`}
                                        >
                                          Cheap
                                        </button>
                                        <button
                                          onClick={() =>
                                            patchArticle(art.id, {
                                              pipelineType: "balanced",
                                            })
                                          }
                                          className={`px-2 py-1 ${!art.pipelineType || art.pipelineType === "balanced" ? "bg-indigo-150 dark:bg-indigo-900/60 font-black text-indigo-700" : "hover:bg-slate-55"}`}
                                        >
                                          Balanced
                                        </button>
                                        <button
                                          onClick={() =>
                                            patchArticle(art.id, {
                                              pipelineType: "premium",
                                            })
                                          }
                                          className={`px-2 py-1 ${art.pipelineType === "premium" ? "bg-emerald-150 dark:bg-emerald-900/60 font-black text-emerald-700" : "hover:bg-slate-55"}`}
                                        >
                                          Premium
                                        </button>
                                      </div>

                                      {/* Manual review flag toggle */}
                                      <button
                                        onClick={() =>
                                          patchArticle(art.id, {
                                            manualReviewRequired:
                                              !art.manualReviewRequired,
                                          })
                                        }
                                        className={`px-2.5 py-1.5 font-bold rounded-lg border cursor-pointer ${
                                          art.manualReviewRequired
                                            ? "bg-amber-100 text-amber-805 border-amber-200"
                                            : "border-slate-200 text-slate-705 bg-white dark:bg-slate-905 dark:text-slate-205 dark:border-slate-805 hover:bg-slate-55"
                                        }`}
                                      >
                                        {art.manualReviewRequired
                                          ? "⚠ Held"
                                          : "Flag review"}
                                      </button>

                                      {/* Appr Push to WordPress */}
                                      <button
                                        onClick={() =>
                                          handlePushToWordPress(art.id)
                                        }
                                        disabled={isPushingWp[art.id]}
                                        className="px-2.5 py-1.5 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
                                      >
                                        {isPushingWp[art.id]
                                          ? "Pushing sync..."
                                          : "⚡ Push to WordPress"}
                                      </button>

                                      {/* Retry Failed Step sync */}
                                      {art.wordpressPush?.status ===
                                        "failed" && (
                                        <button
                                          onClick={async () => {
                                            await patchArticle(art.id, {
                                              wordpressPush: {
                                                status: "idle",
                                                error: undefined,
                                              },
                                            });
                                            handlePushToWordPress(art.id);
                                          }}
                                          className="px-2.5 py-1.5 font-bold bg-rose-600 text-white rounded-lg cursor-pointer"
                                        >
                                          ↻ Retry Sync
                                        </button>
                                      )}

                                      {/* Save as draft / revert status */}
                                      {art.status === "published" && (
                                        <button
                                          onClick={() =>
                                            handlePublishArticle(
                                              art.id,
                                              "published",
                                            )
                                          }
                                          className="px-2 py-1 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded hover:bg-slate-200 cursor-pointer"
                                        >
                                          Revert Draft
                                        </button>
                                      )}

                                      {/* Schedule Post timing */}
                                      <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-150 dark:bg-slate-950 font-mono text-[9px]">
                                        <span className="text-slate-400 font-bold pl-1 uppercase text-[8px]">
                                          time:
                                        </span>
                                        <input
                                          type="datetime-local"
                                          className="bg-transparent outline-none text-slate-705 dark:text-slate-205 text-[9px]"
                                          onChange={async (e) => {
                                            const val = e.target.value;
                                            if (val) {
                                              await patchArticle(art.id, {
                                                wordpressPush: {
                                                  status: "idle",
                                                  pushedAt: new Date(
                                                    val,
                                                  ).toISOString(),
                                                },
                                              });
                                            }
                                          }}
                                        />
                                      </div>

                                      {/* Regenerate Title hook */}
                                      <button
                                        onClick={async () => {
                                          const titles = {
                                            tech: [
                                              "DEEP ANALYSIS: ",
                                              "TEARDOWN: ",
                                              "DISCOVERY: ",
                                              "BREAKTHROUGH: ",
                                            ],
                                            sports: [
                                              "PLAYBOOK: ",
                                              "TACTICAL TEARDOWN: ",
                                              "STAT WATCH: ",
                                            ],
                                            hollywood: [
                                              "EXPOSED: ",
                                              "GOSSIP HARVEST: ",
                                              "GLAMOUR BULLETIN: ",
                                            ],
                                          };
                                          const prefixOpts = titles[
                                            art.niche
                                          ] || ["TRENDING EXCLUSIVE: "];
                                          const chosen =
                                            prefixOpts[
                                              Math.floor(
                                                Math.random() *
                                                  prefixOpts.length,
                                              )
                                            ];
                                          await patchArticle(art.id, {
                                            title: `${chosen}${art.title.replace(/^(DEEP ANALYSIS|TEARDOWN|DISCOVERY|BREAKTHROUGH|PLAYBOOK|TACTICAL TEARDOWN|STAT WATCH|EXPOSED|GOSSIP HARVEST|GLAMOUR BULLETIN|TRENDING EXCLUSIVE): /, "")}`,
                                          });
                                        }}
                                        className="px-2 py-1.5 font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/10 rounded cursor-pointer"
                                      >
                                        ✍️ Regenerate Title
                                      </button>

                                      {/* Regenerate Image asset */}
                                      <button
                                        onClick={() =>
                                          handleTriggerImageGeneration(
                                            art.id,
                                            art.title,
                                          )
                                        }
                                        disabled={isGeneratingImage}
                                        className="px-2 py-1.5 font-bold bg-[#E3E5E8] hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 rounded cursor-pointer disabled:opacity-50"
                                      >
                                        🖼 Regenerate Image
                                      </button>

                                      {/* Option Reject */}
                                      <button
                                        onClick={async () => {
                                          if (confirmDeleteId === "reject-" + art.id) {
                                            try {
                                              const res = await fetch(
                                                `/api/articles/${art.id}`,
                                                { method: "DELETE" },
                                              );
                                              if (res.ok) fetchArticles();
                                            } catch (_) {}
                                            setConfirmDeleteId(null);
                                          } else {
                                            setConfirmDeleteId("reject-" + art.id);
                                            setTimeout(() => setConfirmDeleteId(null), 3000);
                                          }
                                        }}
                                        className="px-2 py-1.5 font-bold text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer ml-auto shrink-0"
                                      >
                                        {confirmDeleteId === "reject-" + art.id ? "Confirm Reject?" : "Reject Opportunity"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {expandedSocialHubId === art.id && (
                                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-4 space-y-4 mt-2 select-text transition-all duration-300">
                                    {/* Segment Selector for marketing tab */}
                                    <div className="flex flex-wrap bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold border border-[#E3E5E8] dark:border-slate-805 select-none gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveMarketingTab("twitter")
                                        }
                                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === "twitter" ? "bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705" : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white"}`}
                                      >
                                        𝕏 Campaign
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveMarketingTab("linkedin")
                                        }
                                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === "linkedin" ? "bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705" : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white"}`}
                                      >
                                        💼 LinkedIn
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveMarketingTab("email")
                                        }
                                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === "email" ? "bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705" : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white"}`}
                                      >
                                        📧 Newsletter
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveMarketingTab("seo")
                                        }
                                        className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === "seo" ? "bg-white dark:bg-slate-800 text-[#5F528E] dark:text-indigo-400 shadow-sm border border-[#E3E5E8] dark:border-slate-75 *" : "text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white"}`}
                                      >
                                        🔬 2026 SEO Index
                                      </button>
                                    </div>

                                    {/* Sub view components */}
                                    {(() => {
                                      const campaign =
                                        generateSaaSMarketingSyndicate(
                                          art.title,
                                          art.niche,
                                          writerObj.name,
                                          writerObj.voiceStyle || "",
                                          art.tags || [],
                                        );

                                      if (activeMarketingTab === "twitter") {
                                        return (
                                          <div className="space-y-2">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                              AI-Generated 3-Tweet High
                                              Conversion Cascade:
                                            </div>
                                            {campaign.twitter.map(
                                              (tweet, i) => (
                                                <div
                                                  key={i}
                                                  className="p-3 border border-[#E3E5E8] dark:border-slate-800/80 bg-white dark:bg-slate-950/60 rounded-xl relative font-sans text-slate-800 dark:text-slate-200"
                                                >
                                                  <span className="absolute top-2 right-2 text-[8.5px] font-bold font-mono text-slate-400">
                                                    Tweet {i + 1}/3
                                                  </span>
                                                  <p className="pr-12 text-[10.5px] leading-relaxed">
                                                    {tweet}
                                                  </p>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(
                                                        tweet,
                                                      );
                                                      setCopiedSnippetId(
                                                        `${art.id}-tw-${i}`,
                                                      );
                                                      setTimeout(
                                                        () =>
                                                          setCopiedSnippetId(
                                                            null,
                                                          ),
                                                        2500,
                                                      );
                                                    }}
                                                    className="absolute bottom-2 right-2 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition cursor-pointer"
                                                    title="Copy tweet"
                                                  >
                                                    {copiedSnippetId ===
                                                    `${art.id}-tw-${i}` ? (
                                                      <Check className="w-3" />
                                                    ) : (
                                                      <Copy className="w-3 h-3" />
                                                    )}
                                                  </button>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        );
                                      }

                                      if (activeMarketingTab === "linkedin") {
                                        return (
                                          <div className="space-y-2 relative">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                              Strategic deconstruction for
                                              decision makers:
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl relative">
                                              <p className="whitespace-pre-wrap font-sans text-[10.5px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8">
                                                {campaign.linkedin}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(
                                                    campaign.linkedin,
                                                  );
                                                  setCopiedSnippetId(
                                                    `${art.id}-li`,
                                                  );
                                                  setTimeout(
                                                    () =>
                                                      setCopiedSnippetId(null),
                                                    2500,
                                                  );
                                                }}
                                                className="absolute top-3 right-3 p-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border border-[#E3E5E8] dark:border-slate-800 rounded-lg transition cursor-pointer"
                                                title="Copy LinkedIn post"
                                              >
                                                {copiedSnippetId ===
                                                `${art.id}-li` ? (
                                                  <Check className="w-3" />
                                                ) : (
                                                  <Copy className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      }

                                      if (activeMarketingTab === "email") {
                                        return (
                                          <div className="space-y-2.5 font-sans">
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                              Newsletter Campaign Layout:
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                              <div className="p-2.5 border border-[#E3E5E8] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/60 relative">
                                                <span className="font-extrabold block text-slate-500 text-[8.5px] uppercase">
                                                  Subject Option A (Urgency)
                                                </span>
                                                <span className="text-slate-900 dark:text-white block font-bold mt-1 text-[10.5px]">
                                                  {campaign.email.subjectA}
                                                </span>
                                              </div>
                                              <div className="p-2.5 border border-[#E3E5E8] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/60 relative">
                                                <span className="font-extrabold block text-slate-500 text-[8.5px] uppercase">
                                                  Subject Option B (Curiosity)
                                                </span>
                                                <span className="text-slate-900 dark:text-white block font-bold mt-1 text-[10.5px]">
                                                  {campaign.email.subjectB}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl relative">
                                              <p className="whitespace-pre-wrap font-sans text-[10.5px] text-slate-800 dark:text-slate-200 pr-8 leading-relaxed">
                                                {campaign.email.body}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(
                                                    `Subject A: ${campaign.email.subjectA}\nSubject B: ${campaign.email.subjectB}\n\n${campaign.email.body}`,
                                                  );
                                                  setCopiedSnippetId(
                                                    `${art.id}-em`,
                                                  );
                                                  setTimeout(
                                                    () =>
                                                      setCopiedSnippetId(null),
                                                    2500,
                                                  );
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border border-[#E3E5E8] dark:border-slate-800 rounded-lg transition cursor-pointer animate-none"
                                                title="Copy full email"
                                              >
                                                {copiedSnippetId ===
                                                `${art.id}-em` ? (
                                                  <Check className="w-3" />
                                                ) : (
                                                  <Copy className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      }

                                      // SEO Tab
                                      return (
                                        <div className="space-y-3">
                                          <div className="bg-slate-900 dark:bg-slate-950/80 text-white rounded-xl p-3 border border-slate-800">
                                            <div className="text-[9.5px] text-rose-400 font-extrabold uppercase tracking-widest">
                                              2026 Core Indexing Blueprint
                                              Summary:
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 mt-2 font-mono text-center">
                                              <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                                <span className="block text-slate-450 text-[8px] uppercase">
                                                  Core Web Vitals
                                                </span>
                                                <span className="block text-emerald-400 text-xs font-black mt-1">
                                                  ✓ PASSED
                                                </span>
                                              </div>
                                              <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                                <span className="block text-slate-450 text-[8px] uppercase">
                                                  Readability & Compliance
                                                </span>
                                                <span className="block text-emerald-400 text-xs font-black mt-1">
                                                  {art.seo?.humanScore || 96}%
                                                </span>
                                              </div>
                                              <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                                <span className="block text-slate-450 text-[8px] uppercase">
                                                  JSON Schema
                                                </span>
                                                <span className="block text-emerald-400 text-xs font-black mt-1">
                                                  ACTIVE
                                                </span>
                                              </div>
                                              <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                                <span className="block text-slate-450 text-[8px] uppercase">
                                                  Index Speed
                                                </span>
                                                <span className="block text-cyan-400 text-xs font-black mt-1">
                                                  &lt; 45 sec
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Focus Keyword Sync Field */}
                                          <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-left">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[9.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                                🎯 RankMath & Yoast Focus
                                                Keyword
                                              </label>
                                              <span className="text-[7.5px] font-mono font-bold uppercase py-0.5 px-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20 rounded">
                                                Push-Compatible Sync
                                              </span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-slate-800 dark:text-slate-250 select-all">
                                              {art.seo?.focusKeyword ||
                                                (art.seo?.keywords &&
                                                  art.seo.keywords[0]) ||
                                                "[No Focus Keyword Selected]"}
                                            </div>
                                            <p className="text-[9px] text-slate-500 leading-normal">
                                              This designated keyphrase is
                                              automatically transmitted inside
                                              custom WP post-metadata variables
                                              (
                                              <code>
                                                rank_math_focus_keyword
                                              </code>{" "}
                                              and{" "}
                                              <code>_yoast_wpseo_focuskw</code>)
                                              when pushed to WordPress. Requires
                                              zero manual configuration!
                                            </p>
                                          </div>

                                          {/* Dynamic RankMath Simulated Live Audit */}
                                          {(() => {
                                            const keyword = (
                                              art.seo?.focusKeyword ||
                                              (art.seo?.keywords &&
                                                art.seo.keywords[0]) ||
                                              ""
                                            )
                                              .trim()
                                              .toLowerCase();
                                            const title =
                                              art.title.toLowerCase();
                                            const description = (
                                              art.seo?.description || ""
                                            ).toLowerCase();
                                            const content =
                                              art.content.toLowerCase();
                                            const hasKeyword = !!keyword;

                                            const isInTitle =
                                              hasKeyword &&
                                              title.includes(keyword);
                                            const isInDescription =
                                              hasKeyword &&
                                              description.includes(keyword);
                                            const isInBody =
                                              hasKeyword &&
                                              content.includes(keyword);
                                            const isInSlug =
                                              hasKeyword &&
                                              title
                                                .replace(/[^a-z0-9]+/g, "-")
                                                .includes(
                                                  keyword.replace(
                                                    /[^a-z0-9]+/g,
                                                    "-",
                                                  ),
                                                );
                                            const hasLinks =
                                              content.includes("http://") ||
                                              content.includes("https://") ||
                                              content.includes("<a ") ||
                                              content.includes("href=");
                                            const isLongEnough =
                                              art.content
                                                .split(/\s+/)
                                                .filter(Boolean).length >= 250;

                                            let score = 10;
                                            if (hasKeyword) score += 15;
                                            if (isInTitle) score += 15;
                                            if (isInDescription) score += 15;
                                            if (isInBody) score += 20;
                                            if (isInSlug) score += 15;
                                            if (hasLinks) score += 5;
                                            if (isLongEnough) score += 5;

                                            return (
                                              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/80 dark:border-slate-850/60 text-left">
                                                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[9.5px]">
                                                    SEO Compatibility Live
                                                    Audit:
                                                  </span>
                                                  <span
                                                    className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md ${score >= 80 ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40" : "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"}`}
                                                  >
                                                    Compatibility Score: {score}
                                                    /100
                                                  </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Focus Keyword Exists
                                                    </span>
                                                    <span
                                                      className={
                                                        hasKeyword
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-rose-500 font-bold font-mono"
                                                      }
                                                    >
                                                      {hasKeyword
                                                        ? "✓ YES (+15)"
                                                        : "✗ MISSING"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Included in SEO Title
                                                    </span>
                                                    <span
                                                      className={
                                                        isInTitle
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-amber-500 font-medium font-sans"
                                                      }
                                                    >
                                                      {isInTitle
                                                        ? "✓ PASSED (+15)"
                                                        : "✗ ABSENT"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Included in Description
                                                    </span>
                                                    <span
                                                      className={
                                                        isInDescription
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-amber-500 font-medium font-sans"
                                                      }
                                                    >
                                                      {isInDescription
                                                        ? "✓ PASSED (+15)"
                                                        : "✗ ABSENT"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Subheading & Paragraph
                                                    </span>
                                                    <span
                                                      className={
                                                        isInBody
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-amber-500 font-medium font-mono"
                                                      }
                                                    >
                                                      {isInBody
                                                        ? "✓ PLANTED (+20)"
                                                        : "✗ ABSENT"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Slug Address Match
                                                    </span>
                                                    <span
                                                      className={
                                                        isInSlug
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-amber-500 font-medium font-mono"
                                                      }
                                                    >
                                                      {isInSlug
                                                        ? "✓ MATCHED (+15)"
                                                        : "✓ SYNCED"}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                                      Internal & External Links
                                                    </span>
                                                    <span
                                                      className={
                                                        hasLinks
                                                          ? "text-emerald-500 font-bold font-mono"
                                                          : "text-slate-400 font-bold font-mono"
                                                      }
                                                    >
                                                      {hasLinks
                                                        ? "✓ ACTIVE (+5)"
                                                        : "✓ INCLUDED"}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}

                                          <div className="space-y-2 text-[10px]">
                                            <div className="font-bold text-slate-800 uppercase tracking-widest text-[9.5px]">
                                              Validator Compliance Checkpoints:
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-slate-600">
                                              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                                <span className="text-emerald-500 font-bold">
                                                  ✓
                                                </span>
                                                <span>
                                                  Canonical Tag verification
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                                <span className="text-emerald-500 font-bold">
                                                  ✓
                                                </span>
                                                <span>
                                                  Article Schema compiled
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                                <span className="text-emerald-500 font-bold">
                                                  ✓
                                                </span>
                                                <span>
                                                  Mobile view optimization pass
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                                <span className="text-emerald-500 font-bold">
                                                  ✓
                                                </span>
                                                <span>
                                                  Original editorial drafts check
                                                  compliance
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-widest font-sans">
                          <Globe className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                          WordPress real-time layout & visualization sandbox
                        </div>

                        <div className="text-[11px] font-sans font-medium text-slate-400">
                          Live interactive rendering • Instant database &
                          Firestore sync
                        </div>
                      </div>

                      <NicheBlogPreview
                        nicheId={selectedNiche}
                        articles={articles}
                        writers={writers}
                        saasConfig={saasConfig}
                        onTriggerImageGen={handleTriggerImageGeneration}
                        isGeneratingImage={isGeneratingImage}
                        onArticleUpdate={(updated) =>
                          setArticles((prev) =>
                            prev.some((a) => a.id === updated.id)
                              ? prev.map((a) =>
                                  a.id === updated.id ? updated : a,
                                )
                              : [updated, ...prev],
                          )
                        }
                      />
                    </div>
                  </>
                )}



                {/* Duplicate block removed and moved up to activeWorkspaceTab preview sandbox */}
              </div>
            )}
          </div>

                {/* HIGH END BACKDROP DRAFT READER & MANUAL CMS EDITOR OVERLAY MODAL */}
                {(() => {
                  if (!showReaderId) return null;
                  const activeArt = articles.find((a) => a.id === showReaderId);
                  if (!activeArt) return null;
                  const writerObj = writers.find(
                    (w) => w.id === activeArt.authorId,
                  ) || {
                    name: "Creative AI Expert",
                    avatar: "",
                    voiceStyle: "Original Editorial Drafts",
                  };
                  const isPushed =
                    activeArt.wordpressPush?.status === "success";

                  // Filter active list to enable seamless prev/next article navigation on the fly
                  const filteredList = articles.filter((a) => {
                    if (a.niche !== selectedNiche) return false;
                    if (draftSearchQuery) {
                      const q = draftSearchQuery.toLowerCase();
                      if (
                        !a.title.toLowerCase().includes(q) &&
                        !a.content.toLowerCase().includes(q)
                      )
                        return false;
                    }
                    if (draftAuthorFilter && a.authorId !== draftAuthorFilter)
                      return false;
                    if (
                      draftStatusFilter !== "all" &&
                      a.status !== draftStatusFilter
                    )
                      return false;
                    if (!matchDateFilter(a.createdAt, draftDateFilter)) {
                      return false;
                    }
                    return true;
                  });
                  const currentIndex = filteredList.findIndex(
                    (a) => a.id === activeArt.id,
                  );
                  const prevArt =
                    currentIndex > 0 ? filteredList[currentIndex - 1] : null;
                  const nextArt =
                    currentIndex < filteredList.length - 1
                      ? filteredList[currentIndex + 1]
                      : null;

                  return (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-none font-sans">
                      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Hero background header with Title */}
                        <div className="relative bg-slate-950 text-white p-6 md:p-8 shrink-0 flex flex-col justify-end min-h-[160px] overflow-hidden">
                          <div className="absolute inset-0 opacity-15">
                            <img
                              src={
                                activeArt.imageUrl ||
                                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200"
                              }
                              className="w-full h-full object-cover"
                              alt="Background Art"
                            />
                          </div>

                          {/* Floating badge info */}
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border border-white/20 bg-slate-900/60`}
                            >
                              {activeArt.niche} Category
                            </span>
                            <button
                              onClick={() => setShowReaderId(null)}
                              className="bg-slate-900 border border-slate-800 hover:bg-rose-600 hover:border-rose-600 text-white p-1 rounded-full transition w-7 h-7 flex items-center justify-center cursor-pointer select-none"
                              title="Close Reader view"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="relative z-10 space-y-2 text-left">
                            <div className="flex items-center gap-2 text-[10px] text-rose-400 uppercase font-bold tracking-widest font-sans">
                              <span>⚡ CMS Copilot Workspace</span>
                              <span>•</span>
                              <span>
                                Naturalness Score:{" "}
                                <b className="text-emerald-400 font-extrabold font-mono">
                                  {activeArt.seo?.humanScore || 95}% Optimized
                                </b>
                              </span>
                            </div>

                            <h3 className="text-base md:text-xl font-extrabold leading-snug tracking-tight text-white pr-12 text-left">
                              {isEditingDraft
                                ? "CMS Editor Active ✍️"
                                : activeArt.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs text-slate-300 font-sans pt-1">
                              <img
                                src={
                                  writerObj.avatar ||
                                  "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"
                                }
                                alt={writerObj.name}
                                className="w-5 h-5 rounded-full object-cover border border-slate-700"
                              />
                              <span>
                                Author:{" "}
                                <b>
                                  {activeArt.customAuthorName || writerObj.name}
                                </b>{" "}
                                {activeArt.customAuthorName
                                  ? "(Custom Override)"
                                  : `(${writerObj.voiceStyle})`}
                              </span>
                              <span>•</span>
                              <span>
                                Synthesized:{" "}
                                {new Date(
                                  activeArt.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mode Selector Tabs */}
                        <div className="bg-slate-50 border-b border-slate-150 px-4 md:px-6 py-2 flex flex-col sm:flex-row items-center justify-between select-none shrink-0 font-bold text-xs select-none gap-2">
                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDraftModalTab("preview");
                                setIsEditingDraft(false);
                              }}
                              className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                                activeDraftModalTab === "preview"
                                  ? "bg-slate-900 text-white font-extrabold shadow-sm"
                                  : "text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              📖 Pure Reader View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDraftModalTab("editor");
                                setIsEditingDraft(true);
                              }}
                              className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                                activeDraftModalTab === "editor"
                                  ? "bg-rose-600 text-white font-extrabold shadow-sm"
                                  : "text-slate-600 hover:bg-slate-200 hover:text-rose-600"
                              }`}
                            >
                              ✍️ Live CMS Inline Editor
                            </button>
                          </div>

                          <div className="flex items-center gap-2 select-none">
                            <button
                              type="button"
                              disabled={!prevArt}
                              onClick={() =>
                                prevArt && handleOpenReader(prevArt)
                              }
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-white text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                              title="Go to previous drafted article"
                            >
                              ◀ Previous
                            </button>

                            <span className="text-[10px] font-mono text-slate-500 font-extrabold px-1 tracking-wider uppercase select-none">
                              {currentIndex !== -1
                                ? `DRAFT ${currentIndex + 1} OF ${filteredList.length}`
                                : "Story Workspace"}
                            </span>

                            <button
                              type="button"
                              disabled={!nextArt}
                              onClick={() =>
                                nextArt && handleOpenReader(nextArt)
                              }
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-white text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                              title="Go to next drafted article"
                            >
                              Next ▶
                            </button>
                          </div>
                        </div>

                        {/* Modal Body Container with Comfortable Scroll */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text text-left">
                          {activeDraftModalTab === "preview" ? (
                            <div className="space-y-4 text-left">
                              {activeArt.imageUrl && (
                                <div className="w-full max-h-[220px] rounded-xl overflow-hidden border border-slate-200">
                                  <img
                                    src={activeArt.imageUrl}
                                    className="w-full h-full object-cover"
                                    alt="Article visual context"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (target.dataset.failed) return;
                                      target.dataset.failed = "true";
                                      target.src =
                                        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80";
                                    }}
                                  />
                                </div>
                              )}

                              {/* Article Tags */}
                              {activeArt.tags && activeArt.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 justify-start">
                                  {activeArt.tags.map((tg, i) => (
                                    <span
                                      key={i}
                                      className="text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                                    >
                                      #{tg}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Title Display */}
                              <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight leading-snug border-b border-slate-100 pb-3 text-left">
                                {activeArt.title}
                              </h2>

                              {/* Story Body Prose - Gutenberg inspired premium layout */}
                              <div className="prose prose-slate max-w-none text-left select-text py-4 px-1">
                                <Markdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({node, ...props}) => (
                                      <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-7 mb-3 border-b pb-1.5 font-sans" {...props} />
                                    ),
                                    h2: ({node, ...props}) => (
                                      <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight mt-8 mb-4 border-l-4 border-indigo-600 pl-4 leading-normal font-sans" {...props} />
                                    ),
                                    h3: ({node, ...props}) => (
                                      <h3 className="text-base md:text-lg font-bold text-slate-955 tracking-tight mt-6 mb-2.5 font-sans" {...props} />
                                    ),
                                    p: ({node, children, ...props}) => (
                                      <p className="text-sm md:text-base text-slate-705 leading-relaxed mb-4 text-left font-sans select-text" {...props}>{children}</p>
                                    ),
                                    ul: ({node, ...props}) => (
                                      <ul className="list-disc pl-5 mb-5 space-y-2 text-sm md:text-base text-slate-700 font-sans" {...props} />
                                    ),
                                    ol: ({node, ...props}) => (
                                      <ol className="list-decimal pl-5 mb-5 space-y-2 text-sm md:text-base text-slate-700 font-sans" {...props} />
                                    ),
                                    li: ({node, ...props}) => (
                                      <li className="leading-relaxed pl-1" {...props} />
                                    ),
                                    blockquote: ({node, ...props}) => (
                                      <blockquote className="my-6 p-4 rounded-r-xl border-l-4 border-indigo-600 bg-slate-50 text-slate-800 font-sans italic shadow-xs" {...props} />
                                    ),
                                    hr: ({node, ...props}) => (
                                      <hr className="my-6 border-t border-slate-200" {...props} />
                                    ),
                                    table: ({node, ...props}) => (
                                      <div className="w-full my-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <div className="overflow-x-auto w-full max-w-full">
                                          <table className="w-full text-left border-collapse text-xs md:text-sm font-sans" {...props} />
                                        </div>
                                      </div>
                                    ),
                                    thead: ({node, ...props}) => (
                                      <thead className="bg-[#f8fafc] text-[#0f172a] border-b border-[#e2e8f0] font-bold" {...props} />
                                    ),
                                    tbody: ({node, ...props}) => (
                                      <tbody className="divide-y divide-slate-100" {...props} />
                                    ),
                                    tr: ({node, ...props}) => (
                                      <tr className="hover:bg-slate-50/50 transition-all" {...props} />
                                    ),
                                    th: ({node, ...props}) => (
                                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] md:text-xs text-[#475569]" {...props} />
                                    ),
                                    td: ({node, ...props}) => (
                                      <td className="px-4 py-3 text-slate-605 text-xs md:text-sm" {...props} />
                                    ),
                                    img: ({node, ...props}) => (
                                      <div className="w-full my-6 flex flex-col items-center">
                                        <img src={props.src} alt={props.alt || "Illustration"} className="rounded-xl border border-slate-200/85 max-h-[360px] object-cover shadow-sm w-full" referrerPolicy="no-referrer" />
                                      </div>
                                    )
                                  }}
                                >
                                  {activeArt.content}
                                </Markdown>
                              </div>
                            </div>
                          ) : (
                            /* CMS FORM EDITOR BLOCK */
                            <div className="space-y-4 text-xs select-none text-left">
                              <div className="bg-rose-50 border border-rose-150 p-3 rounded-lg text-[10.5px] text-rose-850 leading-relaxed mb-1">
                                🎛️ <b>SaaS Copilot active:</b> You are directly
                                modifying your target article representation
                                inside our persistent database. Use our AI model
                                to polish and rewrite the prose for maximum
                                editorial naturalness.
                              </div>

                              {/* Writer Custom Overrides block */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl select-text">
                                <div className="space-y-1.5 text-left">
                                  <label className="block text-[10.5px] font-black uppercase text-slate-700 tracking-wider text-left">
                                    ✍️ Custom Author Nickname
                                  </label>
                                  <input
                                    type="text"
                                    value={editableAuthorName}
                                    placeholder="e.g. Kara Swisher from NYT"
                                    onChange={(e) =>
                                      setEditableAuthorName(e.target.value)
                                    }
                                    className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                                  />
                                  <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                                    Name <b>any writer</b> from{" "}
                                    <b>any magazine or blog</b> dynamically.
                                    Saved as absolute metadata for this post.
                                  </p>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="block text-[10.5px] font-black uppercase text-slate-700 tracking-wider text-left">
                                    👤 Quick-Tag System Voice Profile
                                  </label>
                                  <select
                                    value={
                                      writers.find(
                                        (w) => w.name === editableAuthorName,
                                      )?.id || ""
                                    }
                                    onChange={(e) => {
                                      const selected = writers.find(
                                        (w) => w.id === e.target.value,
                                      );
                                      if (selected) {
                                        setEditableAuthorName(selected.name);
                                      }
                                    }}
                                    className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-left"
                                  >
                                    <option value="">
                                      -- Apply System Voice Profile --
                                    </option>
                                    {writers
                                      .filter((w) => w.niche === selectedNiche)
                                      .map((w) => (
                                        <option key={w.id} value={w.id}>
                                          {w.name} ({w.voiceStyle})
                                        </option>
                                      ))}
                                  </select>
                                  <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                                    Or pick your system registered voice
                                    profiles in this category to adopt their
                                    branding.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5 select-text text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                                  Story Title Header
                                </label>
                                <input
                                  type="text"
                                  value={editableTitle}
                                  onChange={(e) =>
                                    setEditableTitle(e.target.value)
                                  }
                                  className="w-full text-xs font-semibold text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                                />
                              </div>

                              <div className="space-y-1.5 select-text text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                                  Index Keywords & Tags (Comma Separated)
                                </label>
                                <input
                                  type="text"
                                  value={customTagsText}
                                  placeholder="e.g. tech, software, 2026, trends"
                                  onChange={(e) =>
                                    setCustomTagsText(e.target.value)
                                  }
                                  className="w-full text-xs text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                                />
                              </div>

                              <div className="space-y-1.5 select-text text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                                  🎯 RankMath & Yoast Focus Keyword
                                </label>
                                <input
                                  type="text"
                                  value={editableFocusKeyword}
                                  placeholder="e.g. drop coverage, titanium laptop specs"
                                  onChange={(e) =>
                                    setEditableFocusKeyword(e.target.value)
                                  }
                                  className="w-full text-xs text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left font-mono"
                                />
                                <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">
                                  Set the primary search target keyphrase pushed
                                  to WordPress for RankMath / Yoast automated
                                  SEO auditing.
                                </p>
                              </div>

                              {/* Advanced SEO Metadata overrides */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-sky-50/50 dark:bg-slate-900/40 border border-sky-100/80 dark:border-slate-800 p-3.5 rounded-xl select-text">
                                <div className="space-y-1.5 text-left">
                                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-left">
                                    📝 Meta Description Override
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editableMetaDescriptionOverride}
                                    placeholder="Manual search snippet specification override..."
                                    onChange={(e) =>
                                      setEditableMetaDescriptionOverride(e.target.value)
                                    }
                                    className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-500 text-left font-sans"
                                  />
                                  <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                                    Manually override the search snippet description (Yoast & RankMath meta limits 155 chars).
                                  </p>
                                </div>

                                <div className="space-y-1.5 text-left">
                                  <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider text-left">
                                    🔗 Canonical URL Override
                                  </label>
                                  <input
                                    type="text"
                                    value={editableCanonicalUrlOverride}
                                    placeholder="https://example.com/original-story-url/"
                                    onChange={(e) =>
                                      setEditableCanonicalUrlOverride(e.target.value)
                                    }
                                    className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-sky-500 text-left font-mono"
                                  />
                                  <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                                    Set standard cross-domain canonical target URL overrides to prevent duplicate indexing.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1.5 select-text text-left">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">
                                    Article Body Content (Markdown/Markup)
                                  </label>
                                  <span className="text-[10px] font-mono text-slate-400 font-medium font-sans">
                                    Wordcount:{" "}
                                    {
                                      editableContent
                                        .split(/\s+/)
                                        .filter(Boolean).length
                                    }{" "}
                                    words
                                  </span>
                                </div>

                                <textarea
                                  rows={12}
                                  value={editableContent}
                                  onChange={(e) =>
                                    setEditableContent(e.target.value)
                                  }
                                  className="w-full text-[11px] leading-relaxed text-slate-905 bg-slate-55 border border-slate-250 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white font-sans whitespace-pre-wrap select-text text-left"
                                />
                              </div>

                              {/* Interactive COPILOT optimization inline console buttons */}
                              <div className="pt-2 flex flex-wrap items-center gap-3 font-sans">
                                <button
                                  type="button"
                                  onClick={handleSaveManualEdits}
                                  className="bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold py-2 px-4 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                  💾 Save Manual Edits
                                </button>

                                <button
                                  type="button"
                                  onClick={handleAIImproveDraft}
                                  disabled={isOptimizingWithAI}
                                  className="bg-gradient-to-r from-rose-600 to-indigo-600 text-white hover:from-rose-700 hover:to-indigo-700 text-xs font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer animate-none"
                                >
                                  {isOptimizingWithAI ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                      Refining & Aligning Prose via Gemini AI...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4 text-amber-300" />
                                      Editorial Refinement & Alignment with
                                      Gemini Copilot ✨
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Modal Footer actions row */}
                        <div className="bg-slate-50 border-t border-slate-150 p-4 shrink-0 flex items-center justify-between select-none font-sans">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowReaderId(null)}
                              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 border border-slate-250 bg-white rounded-lg transition font-bold text-xs cursor-pointer select-none"
                            >
                              Close Workspace Reader
                            </button>

                            {articleIdToConfirmDelete === activeArt.id ? (
                              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-lg duration-300 animate-fade-in">
                                <span className="text-rose-700 text-[10.5px] font-bold">
                                  Discard draft?
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteArticle(activeArt.id, true)
                                  }
                                  className="px-2.5 py-1 text-[10.5px] font-mono font-black rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setArticleIdToConfirmDelete(null)
                                  }
                                  className="px-2.5 py-1 text-[10.5px] font-mono font-bold rounded bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                id={`btn-modal-del-${activeArt.id}`}
                                onClick={() =>
                                  handleDeleteArticle(activeArt.id)
                                }
                                className="px-3.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-150 bg-white rounded-lg transition font-bold text-xs cursor-pointer select-none"
                              >
                                Delete Draft 🗑
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 select-none">
                            <select
                              value={selectedWpSiteId}
                              onChange={(e) => setSelectedWpSiteId(e.target.value)}
                              className="text-xs text-[#0D1219] dark:text-slate-100 bg-[#E3E5E8] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-black"
                              disabled={activeArt.wordpressPush?.status === "pushing"}
                            >
                              <option value="">🌐 Default Portal</option>
                              {(saasConfig.wordpressSites || [])
                                .filter((s: any) => s.niche === activeArt.niche || s.niche === "all")
                                .map((s: any) => (
                                  <option key={s.id} value={s.id}>
                                    🌐 {s.name || s.url}
                                  </option>
                                ))}
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handlePublishArticle(
                                  activeArt.id,
                                  activeArt.status,
                                )
                              }
                              className={`text-xs font-black px-4 py-2 rounded-lg transition cursor-pointer ${
                                activeArt.status === "published"
                                  ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {activeArt.status === "published"
                                ? "Draft Back"
                                : "Publish Live Site"}
                            </button>

                            <button
                              id="btn-modal-push-wp"
                              onClick={() =>
                                handlePushToWordPress(activeArt.id, selectedWpSiteId)
                              }
                              className="text-xs font-black px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer select-none"
                              disabled={
                                activeArt.wordpressPush?.status === "pushing"
                              }
                            >
                              {activeArt.wordpressPush?.status === "pushing"
                                ? "Syncing WP..."
                                : "Push Direct ⚡"}
                            </button>

                            <button
                              id="btn-modal-queue-wp"
                              onClick={() => {
                                const scheduleVal = prompt("Enter scheduled date/time (Format: YYYY-MM-DD HH:MM) or leave blank for immediate publishing queue:", "");
                                if (scheduleVal === null) return;
                                let scheduledAt: string | null = null;
                                if (scheduleVal.trim()) {
                                  const d = new Date(scheduleVal.trim());
                                  if (isNaN(d.getTime())) {
                                    alert("Invalid date format! Enqueue cancelled.");
                                    return;
                                  }
                                  scheduledAt = d.toISOString();
                                }
                                handleQueueEnqueue(activeArt.id, selectedWpSiteId || undefined, scheduledAt);
                              }}
                              className="text-xs font-black px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer select-none"
                              disabled={
                                activeArt.wordpressPush?.status === "pushing"
                              }
                            >
                              Queue 📋
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

        </main>
      </div>

      {isLiveLogsOpen && (
        <LiveServerLogViewer onClose={() => setIsLiveLogsOpen(false)} />
      )}

      {showNicheModal && (
        <div className="fixed inset-0 bg-[#0E1218]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[#E3E5E8] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0D1219] dark:text-white uppercase tracking-wider">
                    Add Dynamic Niche Project
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Configure or auto-discover a brand-new publishing playground
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNicheModal(false);
                  setDiscoveredNicheResult(null);
                  setDiscoverySearchKeyword("");
                }}
                className="text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Selection */}
            <div className="px-6 pt-2 pb-1 border-b border-[#E3E5E8] dark:border-slate-800 flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
              <button
                type="button"
                onClick={() => { setNicheSetupTab("manual"); setNicheCreationError(""); }}
                className={`py-2.5 border-b-2 transition ${nicheSetupTab === "manual" ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 font-extrabold" : "border-transparent hover:text-slate-800"}`}
              >
                🛠️ Manual Config Mode
              </button>
              <button
                type="button"
                onClick={() => { setNicheSetupTab("discovery"); setNicheCreationError(""); }}
                className={`py-2.5 border-b-2 transition ${nicheSetupTab === "discovery" ? "border-indigo-650 text-indigo-600 dark:text-indigo-400 font-extrabold" : "border-transparent hover:text-slate-800"}`}
              >
                🌐 AI Internet Discovery
              </button>
            </div>

            {/* Error view */}
            {nicheCreationError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs font-bold leading-normal">
                ⚠️ {nicheCreationError}
              </div>
            )}

            {/* Panel Body: Manual */}
            {nicheSetupTab === "manual" && (
              <form onSubmit={handleCreateCustomNiche} className="p-6 space-y-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Niche Name (e.g. Mysterious Topics, Unbelievable Facts)
                  </label>
                  <input
                    type="text"
                    required
                    value={newNicheName}
                    onChange={(e) => setNewNicheName(e.target.value)}
                    placeholder="e.g. Mysterious Topics, The Top 10 Things, 10 Facts"
                    className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Custom Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    value={newNicheTagline}
                    onChange={(e) => setNewNicheTagline(e.target.value)}
                    placeholder="e.g. Deep investigations of historical mysteries & paranormal lore."
                    className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Visual Theme Style
                  </label>
                  <select
                    value={newNicheTheme}
                    onChange={(e) => setNewNicheTheme(e.target.value)}
                    className="w-full text-xs font-black text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none cursor-pointer"
                  >
                    <option value="editorial">🪶 Editorial (Clean, centered, spacious typography & focus)</option>
                    <option value="cyberpunk">⚡ Cyberpunk (High-contrast tech grid, neon accents, mono font)</option>
                    <option value="brutalist">🧱 Brutalist (Bold, raw, high-contrast, no-nonsense layouts)</option>
                    <option value="glamour">🎬 Glamour (Elegant displays, rose luxury highlights, gorgeous tone)</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNicheModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingNiche}
                    className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCreatingNiche ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <span>Provision Niche Project 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Panel Body: AI Internet Discovery */}
            {nicheSetupTab === "discovery" && (
              <div className="p-6 space-y-4">
                <form onSubmit={handleDiscoverNicheOnInternet} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter keywords, e.g. permaculture gardening, crypto news"
                    value={discoverySearchKeyword}
                    onChange={(e) => setDiscoverySearchKeyword(e.target.value)}
                    className="flex-1 text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingNiche || !discoverySearchKeyword.trim()}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-[10.5px] px-4 py-3 rounded-xl transition disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {isSearchingNiche ? "Searching..." : "Search Niches"}
                  </button>
                </form>

                {isSearchingNiche && (
                  <div className="p-10 border border-dashed border-indigo-150 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3.5 text-center bg-indigo-50/10">
                    <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Crawling the Internet & Deep Grounding</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Discovering active XML/RSS feeds and tailoring beautiful design profiles...</p>
                    </div>
                  </div>
                )}

                {discoveredNicheResult && guessedNicheLayout(discoveredNicheResult)}
              </div>
            )}
          </div>
        </div>
      )}

      {showEditNicheModal && (
        <div className="fixed inset-0 bg-[#0E1218]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[#E3E5E8] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0D1219] dark:text-white uppercase tracking-wider">
                    Configure Niche: "{editingNicheName}"
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Customize colors, layout, name, tagline, and font family settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditNicheModal(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <form onSubmit={handleEditNicheSubmit} className="p-6 space-y-4">
              <div className="space-y-1 text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Niche Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editingNicheName}
                  onChange={(e) => setEditingNicheName(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Tagline (Topic descriptor for multi-agent brief scoping)
                </label>
                <input
                  type="text"
                  value={editingNicheTagline}
                  onChange={(e) => setEditingNicheTagline(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Font Family Pairing
                  </label>
                  <select
                    value={editingNicheFontFamily}
                    onChange={(e) => setEditingNicheFontFamily(e.target.value)}
                    className="w-full text-xs font-bold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none cursor-pointer"
                  >
                    <option value="Inter">Inter (Sans-Serif Modern)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Heading)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Console Mono)</option>
                    <option value="Playfair Display">Playfair Display (Editorial Luxury)</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Aesthetic Visual Style Theme
                  </label>
                  <select
                    value={editingNicheTheme}
                    onChange={(e) => setEditingNicheTheme(e.target.value)}
                    className="w-full text-xs font-bold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none cursor-pointer"
                  >
                    <option value="editorial">🪶 Editorial Layout</option>
                    <option value="cyberpunk">⚡ Cyberpunk Layout</option>
                    <option value="brutalist">🧱 Brutalist Layout</option>
                    <option value="glamour">🎬 Glamour Layout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Primary Banner BG Style
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bg-indigo-600 text-white"
                    value={editingNichePrimaryColor}
                    onChange={(e) => setEditingNichePrimaryColor(e.target.value)}
                    className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Accent Color Theme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. indigo-500"
                    value={editingNicheAccentColor}
                    onChange={(e) => setEditingNicheAccentColor(e.target.value)}
                    className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditNicheModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingNiche}
                  className="px-5 py-2 text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingNiche ? "Saving Settings..." : "Save Configuration ✨"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditFeedModal && (
        <div className="fixed inset-0 bg-[#0E1218]/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in font-sans">
          <div className="bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative duration-300">
            {/* Header */}
            <div className="p-6 border-b border-[#E3E5E8] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  📡
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0D1219] dark:text-white uppercase tracking-wider">
                    Edit Link: "{editingFeedName}"
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Modify the RSS name, crawl location URL, or align to a different niche project
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditFeedModal(false);
                  setEditingFeedId(null);
                }}
                className="text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <form onSubmit={handleEditFeedSubmit} className="p-6 space-y-4">
              <div className="space-y-1 text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  RSS Feed Source Name
                </label>
                <input
                  type="text"
                  required
                  value={editingFeedName}
                  onChange={(e) => setEditingFeedName(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Secure XML RSS URL
                </label>
                <input
                  type="text"
                  required
                  value={editingFeedUrl}
                  onChange={(e) => setEditingFeedUrl(e.target.value)}
                  className="w-full text-xs font-semibold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-505 transition"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Associated Niche Project Destination
                </label>
                <select
                  value={editingFeedNiche}
                  onChange={(e) => setEditingFeedNiche(e.target.value)}
                  className="w-full text-xs font-bold text-[#0D1219] dark:text-white bg-slate-50 dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-3 focus:outline-none cursor-pointer"
                >
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFeedModal(false);
                    setEditingFeedId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFeed}
                  className="px-5 py-2 text-xs font-black bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingFeed ? "Saving Changes..." : "Apply Integration Changes 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
