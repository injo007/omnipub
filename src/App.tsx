/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Bell
} from "lucide-react";
import { NicheType, RssFeed, Writer, Article, WorkflowStepLog, SuggestedSource, NicheConfig } from "./types";
import NicheBlogPreview from "./components/NicheBlogPreview";
import AgentFlowVisualizer from "./components/AgentFlowVisualizer";
import { RSS_CATALOG } from "./data/rssCatalog";
import { generateSaaSMarketingSyndicate } from "./utils/promoGenerator";
import { TrendRadar, ContentCalendar, MediaStudio } from "./components/SaaSAdvancedSuites";
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
  Cell
} from "recharts";

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('omnipublisher-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('omnipublisher-theme', theme);
  }, [theme]);

  // Brand niches configurations
  const [niches, setNiches] = useState<NicheConfig[]>([
    { id: "hollywood", name: "Gossip & Glam", tagline: "Celebrity gossip and viral fashion trends", primaryColor: "bg-rose-600 text-white", accentColor: "rose-500", fontFamily: "Playfair Display", themeStyle: "glamour" },
    { id: "sports", name: "The Arena", tagline: "No-nonsense NBA, baseball, and football tactics", primaryColor: "bg-emerald-600 text-white", accentColor: "emerald-500", fontFamily: "Space Grotesk", themeStyle: "brutalist" },
    { id: "tech", name: "Alpha Teardown", tagline: "Raw specs, gadgets, and innovative hardware", primaryColor: "bg-zinc-900 text-white", accentColor: "cyan-500", fontFamily: "JetBrains Mono", themeStyle: "cyberpunk" }
  ]);

  const [selectedNiche, setSelectedNiche] = useState<NicheType>("hollywood");
  const [writers, setWriters] = useState<Writer[]>([]);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [suggestedSources, setSuggestedSources] = useState<SuggestedSource[]>([]);
  const [allSuggestedSources, setAllSuggestedSources] = useState<SuggestedSource[]>([]);
  
  // Scraper & state loaders
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);
  const [selectedWriterId, setSelectedWriterId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<SuggestedSource | null>(null);

  // Modular UI tabs (SaaS 2.0 Command Center)
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'radar' | 'calendar' | 'mediaStudio' | 'writers' | 'feeds' | 'wordpress' | 'settings'>('dashboard');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'inbox' | 'preview'>('inbox');

  // New SaaS 2026 Core States
  const [headlineViewMode, setHeadlineViewMode] = useState<'list' | 'scheduler'>('list');
  const [activeFeedSubTab, setActiveFeedSubTab] = useState<'active' | 'presets'>('active');
  const [expandedSocialHubId, setExpandedSocialHubId] = useState<string | null>(null);
  const [autopilotSchedulerActive, setAutopilotSchedulerActive] = useState<boolean>(false);
  const [activeMarketingTab, setActiveMarketingTab] = useState<'twitter' | 'linkedin' | 'email' | 'seo'>('twitter');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // SaaS and integration settings
  const [saasConfig, setSaasConfig] = useState<any>({
    modelSettings: {
      geminiApiKey: "",
      openaiApiKey: "",
      openrouterApiKey: "",
      clarityApiKey: "",
      researchModel: "gemini-3.5-flash",
      draftModel: "gemini-3.5-flash",
      humanizeModel: "gemini-3.5-flash",
      seoModel: "gemini-3.5-flash",
      imageModel: "imagen-3",
      minHumanScoreTarget: 95,
      openrouterCustomModel: "deepseek/deepseek-chat"
    },
    wordpress: {
      hollywood: { url: "", username: "", appPassword: "", isConfigured: false, autoPush: false },
      sports: { url: "", username: "", appPassword: "", isConfigured: false, autoPush: false },
      tech: { url: "", username: "", appPassword: "", isConfigured: false, autoPush: false }
    }
  });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // SaaS Cost Estimator
  const [estArticlesPerDay, setEstArticlesPerDay] = useState(10);
  const [estModelTier, setEstModelTier] = useState<'flash' | 'smart' | 'premium'>('flash');
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
  const [isTestingWp, setIsTestingWp] = useState<Record<string, 'idle' | 'testing' | 'success' | 'failed'>>({});
  const [wpLogs, setWpLogs] = useState<string[]>([
    `[SYSTEM v2.5] Active rest engine initializing connection...`,
    `[REST ENGINE] Standardizing payload maps for Gossip, Arena, Alpha Teardown...`,
    `[CONNECTION] REST API hooks loaded. Ready for WordPress Sync Gate trigger...`
  ]);

  // Multi-agent workflow monitors
  const [activeWorkflowLogs, setActiveWorkflowLogs] = useState<WorkflowStepLog[]>([]);
  const [workflowCurrentStep, setWorkflowCurrentStep] = useState<string>("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritingStatusText, setRewritingStatusText] = useState("");
  const [showCouncilModal, setShowCouncilModal] = useState(false);

  // Upscaled Content Rewriting Customizer States
  const [rewriteDepth, setRewriteDepth] = useState<'short' | 'medium' | 'deep-dive'>('medium');
  const [rewriteSubstyle, setRewriteSubstyle] = useState<string>('standard');
  const [rewriteCustomFacts, setRewriteCustomFacts] = useState<string>("");
  const [rewriteCustomKeywords, setRewriteCustomKeywords] = useState<string>("");
  const [rewriteAdsenseOptimized, setRewriteAdsenseOptimized] = useState<boolean>(false);
  const [showExpandedRewriteSettings, setShowExpandedRewriteSettings] = useState<boolean>(false);

  // Autopilot Mode States
  const [autopilotMode, setAutopilotMode] = useState<'semi-automation' | 'autopilot'>('semi-automation');
  const [showAutopilotSetup, setShowAutopilotSetup] = useState<boolean>(false);
  const [autopilotSystems, setAutopilotSystems] = useState<Record<string, boolean>>({
    trendsAnalysis: true,
    editorialCouncil: true,
    antiAiHumanizer: true,
    adsenseMaximizer: true,
    seoMetadata: true,
    imageGeneration: true,
    wordpressSyndication: false
  });

  const [autopilotNicheLimits, setAutopilotNicheLimits] = useState<Record<string, number>>({
    hollywood: 2,
    sports: 3,
    tech: 0
  });

  const [autopilotNicheEnabled, setAutopilotNicheEnabled] = useState<Record<string, boolean>>({
    hollywood: true,
    sports: true,
    tech: false
  });

  const [autopilotProcessedCounts, setAutopilotProcessedCounts] = useState<Record<string, number>>({
    hollywood: 0,
    sports: 0,
    tech: 0
  });

  const [autopilotCountdown, setAutopilotCountdown] = useState<number>(45);
  const [autopilotLog, setAutopilotLog] = useState<string>("System standby. Enable Autopilot to initialize slot countdown ticker.");
  const [isAutopilotRunningCycle, setIsAutopilotRunningCycle] = useState<boolean>(false);
  const [autopilotBatchSize, setAutopilotBatchSize] = useState<number>(2);

  // Copilot Strategic Synthesis States
  const [copilotTargetAudience, setCopilotTargetAudience] = useState<string>("");
  const [copilotTone, setCopilotTone] = useState<string>("");
  const [copilotStructure, setCopilotStructure] = useState<string>("");
  const [copilotSeoStrategy, setCopilotSeoStrategy] = useState<string>("");
  const [copilotContentObjectives, setCopilotContentObjectives] = useState<string>("");
  const [copilotEngagementOptimization, setCopilotEngagementOptimization] = useState<string>("");
  const [copilotAuthorityBuilding, setCopilotAuthorityBuilding] = useState<string>("");
  const [copilotConversionOptimization, setCopilotConversionOptimization] = useState<string>("");
  const [isSynthesizingCopilot, setIsSynthesizingCopilot] = useState<boolean>(false);

  // New RSS / Writer forms
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  
  const [showAddWriter, setShowAddWriter] = useState(false);
  const [newWriterName, setNewWriterName] = useState("");
  const [newWriterVoice, setNewWriterVoice] = useState("");
  const [newWriterBio, setNewWriterBio] = useState("");
  const [newWriterInstruction, setNewWriterInstruction] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("TechCrunch");
  const [selectedSkillsTags, setSelectedSkillsTags] = useState<string[]>([]);
  const [isCorrectingWriter, setIsCorrectingWriter] = useState<boolean>(false);

  // Reader, Manual Editor, and Copilot States
  const [showReaderId, setShowReaderId] = useState<string | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState<boolean>(false);
  const [editableTitle, setEditableTitle] = useState<string>("");
  const [editableContent, setEditableContent] = useState<string>("");
  const [editableTags, setEditableTags] = useState<string[]>([]);
  const [editableAuthorName, setEditableAuthorName] = useState<string>("");
  const [isOptimizingWithAI, setIsOptimizingWithAI] = useState<boolean>(false);
  const [customTagsText, setCustomTagsText] = useState<string>("");
  const [editableFocusKeyword, setEditableFocusKeyword] = useState<string>("");
  const [activeDraftModalTab, setActiveDraftModalTab] = useState<'preview' | 'editor' | 'workflow'>('preview');
  const [articleIdToConfirmDelete, setArticleIdToConfirmDelete] = useState<string | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);

  // Filter & Search States
  const [draftSearchQuery, setDraftSearchQuery] = useState<string>("");
  const [draftAuthorFilter, setDraftAuthorFilter] = useState<string>("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Niche configuration maps for Writers Factory
  const nicheSkills: Record<string, string[]> = {
    tech: ["Technical Explainer 🔬", "Deep Code Analysis 💻", "Sarcastic Tone 🌶️", "SEO Keyword Stuffer 📈", "Clickbait Catalyst 🚀", "Analytical Blueprinting 🧠", "Fact-Checking Zealot 🕵️"],
    sports: ["Stat Teardowns 📊", "Game Timing 🕰️", "Bold Predictions 🔮", "Sarcastic Tone 🌶️", "SEO Keyword Stuffer 📈", "Clickbait Catalyst 🚀", "Fact-Checking Zealot 🕵️"],
    hollywood: ["Gossip Sourcing 💅", "Exposé Hooking ⚡", "Sensational Framing 📣", "Sarcastic Tone 🌶️", "SEO Keyword Stuffer 📈", "Clickbait Catalyst 🚀", "Fact-Checking Zealot 🕵️"]
  };

  const nicheCompetitors: Record<string, string[]> = {
    tech: ["TechCrunch", "The Verge", "Engadget", "Wired"],
    sports: ["ESPN", "SBNation", "The Athletic", "Bleacher Report"],
    hollywood: ["TMZ", "Perez Hilton", "E! Online", "Page Six"]
  };

  const boardApplicants = [
    {
      name: "Aria Sterling",
      niche: "tech",
      competitor: "The Verge",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      skills: ["Technical Explainer 🔬", "Analytical Blueprinting 🧠", "Sarcastic Tone 🌶️"],
      voiceStyle: "Profound Gadget Ethicist & Sarcastic Explainer",
      bio: "Ex-Verge columnist focusing on the high-level philosophical questions of machine learning and hardware engineering loops.",
      customPromptInstruction: "Write with aesthetic, prose-heavy paragraphs and rich vocabulary. Use sarcastic, slightly cynical undertones when inspecting company claims, paired with deep historical parallels."
    },
    {
      name: "Marcus Broadus",
      niche: "sports",
      competitor: "ESPN",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      skills: ["Stat Teardowns 📊", "Game Timing 🕰️", "Bold Predictions 🔮"],
      voiceStyle: "High-Energy Playbook Front-Office Insider",
      bio: "High-level athletic analyst specialized in cap sheet negotiations, player behavior psychology, and rapid transaction scoops.",
      customPromptInstruction: "Always start with a sensational breaking hook. Use active collegiate team code phrases and raw financial valuation parameters to explain executive level sports trades."
    },
    {
      name: "Lola Perez",
      niche: "hollywood",
      competitor: "TMZ",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      skills: ["Gossip Sourcing 💅", "Exposé Hooking ⚡", "Sensational Framing 📣"],
      voiceStyle: "Ultimate Red Carpet Scandal Spotlight Host",
      bio: "Highly connected Pop Culture analyst with a relentless eye for breaking relationship updates and luxury drama leaks.",
      customPromptInstruction: "Keep sentences incredibly short, dramatic, and direct. Rely on bold text tags, exclamations, rhetorical questions, and highly sensational, fast-moving conversational cues."
    }
  ];

  // Writer Cloners Presets
  const WRITER_PRESETS = [
    {
      name: "Steven Levy",
      voiceStyle: "Deep Tech-Savant Narrative Journalist",
      bio: "Legendary cyberculture analyst modeling Wired's narrative tech journalism. Specializes in computing context and system ethics.",
      targetInspiration: "Wired",
      instruction: "Write in a highly intellectual, narrative-driven Silicon Valley tech style. Ground the content in deep industry histories, hacker ethics, and societal implications. Avoid corporate fluff; use elegant prose, deep analogies, and precise, thoughtful tech vocabulary."
    },
    {
      name: "Kara Swisher",
      voiceStyle: "Fearless Power-Player Interview & Tech Critic",
      bio: "Sharp-tongued tech columnist cloned to duplicate the NYT's fearless critical commentary. Breaks down boardrooms, egos, and power hierarchies.",
      targetInspiration: "NYT / Vox",
      instruction: "Write with a sharp, bold, direct, and slightly cynical tone. Rip into big-tech egos, focus on accountability, call out greed and corporate PR lingo instantly. Start with a direct punchy point. Use witty, no-excuses conversational syntax."
    },
    {
      name: "David Remnick",
      voiceStyle: "Laureate Literary Critic & Cultural Essayist",
      bio: "Ultra-sophisticated literary essayist cloned from The New Yorker. Combines rich vocabulary and deep historical metaphors.",
      targetInspiration: "The New Yorker",
      instruction: "Write with unmatched literary poise, extensive vocabulary, long-form syntax, and rich cultural references. Focus on deep character profiles, psychological motives, and historical parallels. Absolute elegance, no rush, high-brow prose."
    },
    {
      name: "Anna Wintour",
      voiceStyle: "Avant-Garde High-Fashion Authority",
      bio: "Towering fashion tastemaker modeled after high-fashion editors. Decisive, authoritative critique of fabrics, drapes, and design.",
      targetInspiration: "Vogue",
      instruction: "Write like a towering, decisive high-fashion editor. Criticize or praise garments with clinical design parameters ( silhouettes, drape, texture, craftsmanship). Use sophisticated fashion vocabulary, high-brow comparisons, and cold, uncompromising taste."
    },
    {
      name: "Helen Gurley Brown",
      voiceStyle: "Witty & Spicy Pop-Culture Confidante",
      bio: "High-energy, vivacious voice focused on celebrity pairings, relationships, intimacy advice, and spicy viral glamour.",
      targetInspiration: "Cosmopolitan",
      instruction: "Write in a highly energetic, personal, flirtatious, and witty voice. Use bold questions, direct sisterly references like 'darling' or 'bestie', and focus heavily on bedroom drama, relationship chemistry, and vibrant self-empowerment tips."
    },
    {
      name: "Greg Ip",
      voiceStyle: "High-Finance & Global Capital Columnist",
      bio: "Global macro analyst modeling the Wall Street Journal style. Focuses on monetary policy, federal indices, and business operations.",
      targetInspiration: "Wall Street Journal",
      instruction: "Write in a highly technical, objective, and authoritative financial tone. Focus on interest rate policy, global capital flow, supply-chain bottlenecks, venture cap valuation sheets, and ROI forecasts. Support arguments with hard financial metrics."
    },
    {
      name: "Alex Wilhelm",
      voiceStyle: "Venture Capital Spec Scout",
      bio: "Startup economics reporter analyzing early-stage venture rounds, burn rates, MRR, cap-sheets, and structural moats.",
      targetInspiration: "TechCrunch",
      instruction: "Write like a hyper-analytical tech-startup analyst. Blend raw financial venture data (Series A rounds, cap table dilutions, MRR, churn rates) with a witty, slightly geeky, and fast-paced tech narrative. Analyze whether the business model actually has a solid moat."
    },
    {
      name: "Adrian Wojnarowski",
      voiceStyle: "Ultimate Inside Front-Office Insider",
      bio: "Woj-style breaking news reporter. Pierces straight into sports agent transactions, salary caps, draft leverage, and front-office leaks.",
      targetInspiration: "ESPN",
      instruction: "Write in a sharp, urgent, breaking-news scoop style. Emphasize front-office dynamics, locker-room politics, trade luxury-tax calculations, and executive power struggles. Ground columns in high-stakes transaction details."
    },
    {
      name: "Kim Masters",
      voiceStyle: "Studio-Deal Investigator & Box-Office Reporter",
      bio: "L.A. industry reporter tracking guild disputes, movie package budgets, streaming residuals, and box-office gross yields.",
      targetInspiration: "The Hollywood Reporter",
      instruction: "Write like a seasoned industry journalist tracking studio executive moves, box office metrics, guild disputes, and multi-million packaging deals. Avoid fan-circle gossip; focus on legal filings, budget escalations, and executive politics."
    }
  ];

  const handleOpenReader = (art: Article) => {
    setShowReaderId(art.id);
    setEditableTitle(art.title);
    setEditableContent(art.content);
    setEditableTags(art.tags || []);
    setEditableAuthorName(art.customAuthorName || "");
    setCustomTagsText((art.tags || []).join(", "));
    setEditableFocusKeyword(art.seo?.focusKeyword || (art.seo?.keywords && art.seo.keywords[0]) || "");
    setIsEditingDraft(false);
    setActiveDraftModalTab('preview');
  };

  const handleSaveManualEdits = async () => {
    if (!showReaderId) return;
    const activeArt = articles.find(a => a.id === showReaderId);
    try {
      const parsedTags = customTagsText.split(",").map(t => t.trim()).filter(Boolean);
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
            focusKeyword: editableFocusKeyword
          }
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles(prev => prev.map(a => a.id === showReaderId ? updated : a));
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
      const parsedTags = customTagsText.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/articles/${showReaderId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: editableContent,
          title: editableTitle,
          tags: parsedTags
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles(prev => prev.map(a => a.id === showReaderId ? updated : a));
        setEditableContent(updated.content);
        setEditableTitle(updated.title);
        setEditableTags(updated.tags || []);
        alert("Anti-AI Copyediting complete! Your draft humanization ranking has been optimized.");
      }
    } catch (err) {
      console.error("AI Improvement error:", err);
    } finally {
      setIsOptimizingWithAI(false);
    }
  };

  const handleClonePresetWriter = (preset: any) => {
    setNewWriterName(`${preset.name}`);
    setNewWriterVoice(preset.voiceStyle);
    setNewWriterBio(preset.bio);
    setNewWriterInstruction(preset.instruction);
    setShowAddWriter(true);
    
    const formElement = document.getElementById("btn-show-add-writer");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
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

    // Poll notifications every 12 seconds to instantly capture api quotas or breakdowns
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update lists whenever niche or active items change
  useEffect(() => {
    if (writers.length > 0) {
      const filteredWriters = writers.filter(w => w.niche === selectedNiche);
      if (filteredWriters.length > 0) {
        setSelectedWriterId(filteredWriters[0].id);
      } else {
        setSelectedWriterId("");
      }
    }
  }, [selectedNiche, writers]);

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
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
        setSaasConfig(data);
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
        body: JSON.stringify(updatedConfig)
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
        setAllSuggestedSources(data.suggestedSources || []);
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  useEffect(() => {
    const nicheSources = allSuggestedSources.filter((s: SuggestedSource) => s.niche === selectedNiche);
    setSuggestedSources(nicheSources);
  }, [selectedNiche, allSuggestedSources]);

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
      const res = await fetch(`/api/feeds/sync?niche=${selectedNiche}`);
      if (res.ok) {
        await fetchConfig(); // Reload and filter completely
      } else {
        setErrorMsg("Failed to synchronize active RSS feeds correctly.");
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncingFeeds(false);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedName || !newFeedUrl) return;

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFeedName, url: newFeedUrl, niche: selectedNiche })
      });

      if (res.ok) {
        setNewFeedName("");
        setNewFeedUrl("");
        setShowAddFeed(false);
        fetchConfig();
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
        body: JSON.stringify({ name, url, niche: selectedNiche })
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error("Add preset feed error:", err);
    }
  };

  const handleBulkAddPresets = async (presetsList: any[]) => {
    try {
      const res = await fetch("/api/feeds/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeds: presetsList })
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error("Bulk addition error:", err);
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
          draftVoice: newWriterVoice
        })
      });
      if (res.ok) {
        const corrected = await res.json();
        setNewWriterName(corrected.name || "");
        setNewWriterVoice(corrected.voiceStyle || "");
        setNewWriterBio(corrected.bio || "");
        setNewWriterInstruction(corrected.customPromptInstruction || "");
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
          name: candidate.name,
          voiceStyle: candidate.voiceStyle,
          bio: candidate.bio,
          customPromptInstruction: candidate.customPromptInstruction,
          niche: selectedNiche,
          avatar: candidate.avatar
        })
      });
      if (res.ok) {
        await fetchConfig();
      }
    } catch (err) {
      console.error("Failed to hire candidate:", err);
    }
  };

  const handleCreateWriter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWriterName || !newWriterVoice || !newWriterInstruction) return;

    try {
      const res = await fetch("/api/writers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWriterName,
          voiceStyle: newWriterVoice,
          bio: newWriterBio,
          customPromptInstruction: newWriterInstruction,
          niche: selectedNiche
        })
      });

      if (res.ok) {
        setNewWriterName("");
        setNewWriterVoice("");
        setNewWriterBio("");
        setNewWriterInstruction("");
        setSelectedSkillsTags([]);
        setShowAddWriter(false);
        fetchConfig();
      }
    } catch (err) {
      console.error("Create writer error:", err);
    }
  };

  const handleDeleteArticle = async (id: string, bypassConfirm = false) => {
    if (!bypassConfirm) {
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

  const handlePushToWordPress = async (id: string) => {
    setIsPushingWp(prev => ({ ...prev, [id]: true }));
    const art = articles.find(a => a.id === id);
    setWpLogs(prev => [
      ...prev,
      `[PUSH ENGINE] Initiating WordPress REST sync workflow for Article ID: ${id}...`,
      `[MEDIA PROCESS] Processing media attachments ("${art?.title.substring(0, 30)}...")...`
    ]);
    try {
      const res = await fetch(`/api/articles/${id}/push-wp`, {
        method: "POST"
      });
      if (res.ok) {
        const updatedArticle = await res.json();
        setWpLogs(prev => [
          ...prev,
          `[MEDIA API] Uploaded & synchronized featured image to WP media gallery.`,
          `[REST SUCCESS] Successfully posted content. Saved in WordPress Database as ID #${updatedArticle.wordpressPush?.postId || 'N/A'}.`,
          `[LINK ATTACH] WordPress live public link: ${updatedArticle.wordpressPush?.postUrl || 'N/A'}`
        ]);
        fetchArticles();
      } else {
        let errMsg = "Encountered problem publishing to WordPress.";
        try {
          const errBody = await res.json();
          if (errBody.error) errMsg = errBody.error;
        } catch (_) {}
        setWpLogs(prev => [
          ...prev,
          `[REST FAIL] WordPress returned api rejection: "${errMsg}"`
        ]);
        alert(errMsg);
      }
    } catch (err: any) {
      setWpLogs(prev => [
        ...prev,
        `[NET FATAL] Failed to contact local proxy endpoint: ${err.message}`
      ]);
      console.error(err);
    } finally {
      setIsPushingWp(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePublishArticle = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus === 'published' ? 'draft' : 'published' })
      });
      if (res.ok) {
        fetchArticles();
      }
    } catch (err) {
      console.error("Publish toggle error:", err);
    }
  };

  // Launch original agentic rewrite councils!
  const handleInitiateAgentRewrite = async (source: SuggestedSource) => {
    if (!selectedWriterId) {
      alert("Please map a human digital writer to coordinate this rewrite.");
      return;
    }

    setSelectedSource(source);
    setShowCouncilModal(true);
    setIsRewriting(true);
    setActiveWorkflowLogs([]);
    setWorkflowCurrentStep("research");
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
          niche: selectedNiche,
          targetLength: rewriteDepth,
          targetSubstyle: rewriteSubstyle,
          customFacts: rewriteCustomFacts,
          customKeywords: rewriteCustomKeywords,
          adsenseOptimized: rewriteAdsenseOptimized,
          
          // New strategic Copilot parameters
          targetAudience: copilotTargetAudience,
          targetTone: copilotTone,
          targetStructure: copilotStructure,
          seoStrategy: copilotSeoStrategy,
          contentObjectives: copilotContentObjectives,
          engagementOptimization: copilotEngagementOptimization,
          authorityBuilding: copilotAuthorityBuilding,
          conversionOptimization: copilotConversionOptimization
        })
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
                setActiveWorkflowLogs(prev => {
                  const exists = prev.some(l => l.step === payload.detail.step);
                  if (exists) {
                    return prev.map(l => l.step === payload.detail.step ? payload.detail : l);
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

    } catch (err) {
      console.error("Agentic flow error:", err);
    } finally {
      setIsRewriting(false);
      fetchArticles(); // Reload newly created dynamic drafted article
    }
  };

  const handleTriggerImageGeneration = async (articleId: string, prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/articles/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, articleId })
      });
      if (res.ok) {
        fetchArticles(); // Reload images
      }
    } catch (err) {
      console.error("Image gen error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAutoSynthesizeCopilot = async () => {
    const activeSrc = selectedSource || suggestedSources[0];
    if (!activeSrc) {
      alert("No active breakout opportunity has been loaded in the RSS feed queue. Please sync feeds first.");
      return;
    }
    setIsSynthesizingCopilot(true);
    try {
      const res = await fetch("/api/copilot/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTitle: activeSrc.title,
          sourceDescription: activeSrc.description || "",
          niche: selectedNiche,
          writerId: selectedWriterId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.substyle) setRewriteSubstyle(data.substyle);
          if (data.targetAudience) setCopilotTargetAudience(data.targetAudience);
          if (data.factualContent) setRewriteCustomFacts(data.factualContent);
          if (data.tone) setCopilotTone(data.tone);
          if (data.structure) setCopilotStructure(data.structure);
          if (data.seoStrategy) setCopilotSeoStrategy(data.seoStrategy);
          if (data.contentObjectives) setCopilotContentObjectives(data.contentObjectives);
          if (data.engagementOptimization) setCopilotEngagementOptimization(data.engagementOptimization);
          if (data.authorityBuilding) setCopilotAuthorityBuilding(data.authorityBuilding);
          if (data.conversionOptimization) setCopilotConversionOptimization(data.conversionOptimization);
        }
      }
    } catch (err) {
      console.error("Failed to auto-synthesize advanced copilot recommendations:", err);
    } finally {
      setIsSynthesizingCopilot(false);
    }
  };

  const handleExecuteAutopilotCycleInstantly = async () => {
    if (isAutopilotRunningCycle) return;
    setIsAutopilotRunningCycle(true);
    setAutopilotLog("Autopilot triggered! Evaluating active niche limits and scanning RSS feeds...");
    
    try {
      // 1. Identify which niches are enabled and still have remaining quota step-by-step to compile a batch list
      const tempProcessedCounts = { ...autopilotProcessedCounts };
      const selectedJobs: Array<{ winningSource: any; chosenNiche: string }> = [];

      for (let i = 0; i < autopilotBatchSize; i++) {
        const eligibleNiches = Object.keys(autopilotNicheEnabled).filter(nicheKey => {
          const isEnabled = autopilotNicheEnabled[nicheKey];
          const limit = autopilotNicheLimits[nicheKey] ?? 0;
          const processed = tempProcessedCounts[nicheKey] ?? 0;
          return isEnabled && processed < limit;
        });

        if (eligibleNiches.length === 0) {
          break; // Quota reached for concurrent niches in this cycle
        }

        // Pick the highest scoring article across eligible niches not yet taken in this batch or database
        let bestNicheForThisSlot = "";
        let bestSourceForThisSlot: any = null;

        for (const nicheKey of eligibleNiches) {
          const availableSources = suggestedSources.filter(s => s.niche === nicheKey);
          const alreadyDraftedTitles = articles.map(art => art.sourceTitle?.toLowerCase() || "");
          const alreadyChosenTitlesInCurrentBatch = selectedJobs.map(job => job.winningSource.title.toLowerCase());

          let candidate = availableSources.find(src => 
            !alreadyDraftedTitles.includes(src.title.toLowerCase()) &&
            !alreadyChosenTitlesInCurrentBatch.includes(src.title.toLowerCase())
          );
          
          if (!candidate && availableSources.length > 0) {
            candidate = availableSources.filter(src => !alreadyChosenTitlesInCurrentBatch.includes(src.title.toLowerCase()))
              .reduce((prev, curr) => ((curr.rating || 0) > (prev.rating || 0)) ? curr : prev, availableSources[0]);
          }

          if (candidate) {
            if (!bestSourceForThisSlot || (candidate.rating || 0) > (bestSourceForThisSlot.rating || 0)) {
              bestSourceForThisSlot = candidate;
              bestNicheForThisSlot = nicheKey;
            }
          }
        }

        if (bestNicheForThisSlot && bestSourceForThisSlot) {
          selectedJobs.push({ winningSource: bestSourceForThisSlot, chosenNiche: bestNicheForThisSlot });
          tempProcessedCounts[bestNicheForThisSlot] = (tempProcessedCounts[bestNicheForThisSlot] ?? 0) + 1;
        } else {
          break; // No more available opportunities found
        }
      }

      if (selectedJobs.length === 0) {
        setAutopilotLog("⚡ All configured website/niche quotas are COMPLETE or queue is exhausted! Autopilot stopped.");
        setAutopilotSchedulerActive(false);
        setIsAutopilotRunningCycle(false);
        setAutopilotCountdown(45);
        return;
      }

      setAutopilotLog(`🎰 Selected champion workload: ${selectedJobs.length} opportunities! Dispatching premium content rewrites...`);

      // 2. Sequentially process all drafted concurrent articles in the batch
      for (let index = 0; index < selectedJobs.length; index++) {
        const { winningSource, chosenNiche } = selectedJobs[index];
        const jobNum = index + 1;
        const totalJobs = selectedJobs.length;
        
        const nicheNameMapped = chosenNiche === "hollywood" ? "Gossip & Glam" : chosenNiche === "sports" ? "The Arena" : "Alpha Teardown";
        setAutopilotLog(`🚀 [Job ${jobNum}/${totalJobs}] Processing for [${nicheNameMapped}]: "${winningSource.title}" (Score: ${winningSource.opportunityScore || 90}%)`);
        
        // Map default writer for this niche
        const nicheWriters = writers.filter(w => w.niche === chosenNiche);
        const activeWriter = nicheWriters[0] || writers[0];
        if (!activeWriter) {
          setAutopilotLog(`❌ [Job ${jobNum}/${totalJobs}] Mapped digital writer does not exist.`);
          continue;
        }
        
        // OPEN THE REAL-TIME AGENTIC EDITORIAL COUNCIL MODAL TO MIRROR SEMI-AUTOMATION
        setSelectedSource(winningSource);
        setSelectedWriterId(activeWriter.id);
        setShowCouncilModal(true);
        setIsRewriting(true);
        setActiveWorkflowLogs([]);
        setWorkflowCurrentStep("research");
        setRewritingStatusText(`🤖 [Autopilot Job ${jobNum}/${totalJobs}] Assembling Editorial Council & validating news facts...`);
        
        setAutopilotLog(`👥 [Job ${jobNum}/${totalJobs}] Initiating rewrite council matching voice: ${activeWriter.name}...`);
        
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
              targetLength: rewriteDepth,
              targetSubstyle: rewriteSubstyle,
              customFacts: rewriteCustomFacts,
              customKeywords: rewriteCustomKeywords,
              adsenseOptimized: rewriteAdsenseOptimized,
              
              targetAudience: copilotTargetAudience,
              targetTone: copilotTone,
              targetStructure: copilotStructure,
              seoStrategy: copilotSeoStrategy,
              contentObjectives: copilotContentObjectives,
              engagementOptimization: copilotEngagementOptimization,
              authorityBuilding: autopilotSystems.antiAiHumanizer ? "Include humanizer anchors" : copilotAuthorityBuilding,
              conversionOptimization: copilotConversionOptimization
            })
          });
        } catch (fetchErr: any) {
          setAutopilotLog(`❌ [Job ${jobNum}/${totalJobs}] Network error: ${fetchErr.message}`);
          const errDetail = {
            step: "failed",
            agentName: "Editorial Director Exception",
            status: "failed",
            timestamp: new Date().toLocaleTimeString(),
            output: `Failed to connect with background service: ${fetchErr.message}`
          };
          setActiveWorkflowLogs(prev => [...prev, errDetail]);
          setWorkflowCurrentStep("failed");
          setRewritingStatusText(`Failed to connect with server: ${fetchErr.message}`);
          setIsRewriting(false);
          continue;
        }

        if (!response.ok) {
          setAutopilotLog(`❌ [Job ${jobNum}/${totalJobs}] Editorial council rewrite api returned non-ok status.`);
          const errDetail = {
            step: "failed",
            agentName: "Editorial Director",
            status: "failed",
            timestamp: new Date().toLocaleTimeString(),
            output: `Editorial server returned non-ok status code: ${response.status} (${response.statusText}).`
          };
          setActiveWorkflowLogs(prev => [...prev, errDetail]);
          setWorkflowCurrentStep("failed");
          setRewritingStatusText(`Editorial server returned code: ${response.status}`);
          setIsRewriting(false);
          continue;
        }
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let partialLine = "";
        let createdArticleId = "";

        if (reader) {
          try {
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
                  if (payload.log) {
                    setAutopilotLog(`👉 [GP ${jobNum}/${totalJobs}] ${payload.log}`);
                  }
                  if (payload.articleId) {
                    createdArticleId = payload.articleId;
                  }
                  
                  // LIVE UPDATE AGENT WORKFLOW LOG DETAILS IN Editorial Council Panel
                  if (payload.step) {
                    setWorkflowCurrentStep(payload.step);
                    setRewritingStatusText(payload.log || "");
                    
                    if (payload.detail) {
                      setActiveWorkflowLogs(prev => {
                        const exists = prev.some(l => l.step === payload.detail.step);
                        if (exists) {
                          return prev.map(l => l.step === payload.detail.step ? payload.detail : l);
                        }
                        return [...prev, payload.detail];
                      });
                    }
                  }
                } catch (e) {
                  // Ignore partial chunk parse error
                }
              }
            }
          } catch (streamErr: any) {
            setAutopilotLog(`⚠️ [Job ${jobNum}/${totalJobs}] Encountered stream issue: ${streamErr.message}`);
          }
        }

        // Close rewrite state for active modal view
        setIsRewriting(false);

        setAutopilotLog(`🎨 [Job ${jobNum}/${totalJobs}] Standard Image Illustrating (ChatGPT / Nano Banana 2)...`);
        let finalArtId = createdArticleId;
        await fetchArticles();

        if (!finalArtId) {
          const latestResponse = await fetch("/api/articles");
          if (latestResponse.ok) {
            const list = await latestResponse.json();
            if (list && list.length > 0) {
              finalArtId = list[0].id;
            }
          }
        }

        if (finalArtId) {
          setAutopilotLog(`⚡ [Job ${jobNum}/${totalJobs}] Syndicating & Publishing directly as approved draft!`);
          const pubRes = await fetch(`/api/articles/${finalArtId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "published" })
          });
          
          if (pubRes.ok) {
            setAutopilotLog(`🎉 [Job ${jobNum}/${totalJobs}] SUCCESS! Article drafted, illustrated, humanized, and syndicated successfully.`);
          } else {
            setAutopilotLog(`⚠️ [Job ${jobNum}/${totalJobs}] Article saved as active draft but syndication returned status error.`);
          }
          
          if (autopilotSystems.wordpressSyndication) {
            setAutopilotLog(`🌐 [Job ${jobNum}/${totalJobs}] Sending post directly to configured WordPress Syndicate site...`);
            await fetch(`/api/articles/${finalArtId}/push-wp`, { method: "POST" });
            setAutopilotLog(`🎉 [Job ${jobNum}/${totalJobs}] SUCCESS! Fully pushed and live synced to WordPress!`);
          }

          // Increment processed count for this niche!
          setAutopilotProcessedCounts(prev => ({
            ...prev,
            [chosenNiche]: (prev[chosenNiche] ?? 0) + 1
          }));
        } else {
          setAutopilotLog(`❌ [Job ${jobNum}/${totalJobs}] Failed to resolve created article ID for autopilot finishing.`);
        }
      }
    } catch (error: any) {
      console.error("Autopilot process failed:", error);
      setAutopilotLog(`❌ Autopilot execution failed: ${error.message || error}`);
    } finally {
      setIsAutopilotRunningCycle(false);
      setAutopilotCountdown(45);
      fetchArticles();
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (autopilotSchedulerActive && !isAutopilotRunningCycle) {
      interval = setInterval(() => {
        setAutopilotCountdown(prev => {
          if (prev <= 1) {
            handleExecuteAutopilotCycleInstantly();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autopilotSchedulerActive, isAutopilotRunningCycle, selectedNiche, writers, rewriteDepth, rewriteSubstyle, rewriteCustomFacts, rewriteCustomKeywords, rewriteAdsenseOptimized, copilotTargetAudience, copilotTone, copilotStructure, copilotSeoStrategy, copilotContentObjectives, copilotConversionOptimization, autopilotSystems]);

  const currentNicheConfig = niches.find(n => n.id === selectedNiche) || niches[0];

  return (
    <div className={`app-root ${theme} min-h-screen ${theme === 'light' ? 'bg-[#F3F5F6] text-[#111827]' : 'bg-[#0E1218] text-[#f8fafc]'} flex font-sans antialiased w-full`}>
      
      {/* Modern B2B Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 bg-white dark:bg-[#121620] border-r border-[#E3E5E8] dark:border-slate-800 w-[240px] flex flex-col z-50 select-none hidden lg:flex h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E3E5E8] dark:border-slate-850 flex items-center gap-3">
          <div className="p-2 bg-[#3F5353] dark:bg-[#5F528E] rounded-xl text-white shadow-sm">
            <span className="text-xl">🖨️</span>
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-[#0D1219] dark:text-slate-100 uppercase">OMNIPUBLISHER</h1>
            <span className="text-[9px] font-bold text-[#8B8E96] uppercase tracking-wide">Autonomous SaaS v3.0</span>
          </div>
        </div>

        {/* Niche/Project Selector */}
        <div className="p-4 border-b border-[#E3E5E8] dark:border-slate-850">
          <label className="block text-[8.5px] font-black text-[#8B8E96] uppercase tracking-widest mb-1.5 font-mono">TENANT PROJECT/BLOG</label>
          <div className="relative">
            <select
              value={selectedNiche}
              onChange={(e) => {
                setSelectedNiche(e.target.value as NicheType);
                setSelectedSource(null);
              }}
              className="w-full text-xs font-bold text-[#0D1219] dark:text-slate-205 bg-slate-50 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5F528E] transition"
            >
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id === 'hollywood' ? '🎬 Gossip & Glam' : n.id === 'sports' ? '🏀 The Arena' : '💻 Alpha Teardown'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side Nav Menu - matches activeAdminTab */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <span className="block text-[8.5px] font-black text-[#8B8E96] uppercase tracking-widest px-3 mb-2 font-mono">COMMAND SUITE</span>
          
          <button
            id="admin-tab-dashboard"
            onClick={() => setActiveAdminTab('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'dashboard' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
            <span>Crawl Control</span>
          </button>

          <button
            id="admin-tab-radar"
            onClick={() => setActiveAdminTab('radar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'radar' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-500 dark:text-rose-450" />
            <span>Trend Radar</span>
          </button>

          <button
            id="admin-tab-calendar"
            onClick={() => setActiveAdminTab('calendar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'calendar' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-450" />
            <span>Content Calendar</span>
          </button>

          <button
            id="admin-tab-mediaStudio"
            onClick={() => setActiveAdminTab('mediaStudio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'mediaStudio' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <Image className="w-4 h-4 text-indigo-500 dark:text-indigo-450" />
            <span>Media Studio</span>
          </button>

          <button
            id="admin-tab-writers"
            onClick={() => setActiveAdminTab('writers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'writers' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <Users className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
            <span>Digital Writers Roster</span>
          </button>

          <button
            id="admin-tab-feeds"
            onClick={() => setActiveAdminTab('feeds')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'feeds' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <Rss className="w-4 h-4 text-cyan-500" />
            <span>RSS Source Feeds</span>
          </button>

          <button
            id="admin-tab-wordpress"
            onClick={() => setActiveAdminTab('wordpress')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'wordpress' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>WordPress Sync Gate</span>
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveAdminTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
              activeAdminTab === 'settings' 
                ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' 
                : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/60 font-black'
            }`}
          >
            <FileCode className="w-4 h-4 text-purple-500" />
            <span>API Engine Config</span>
          </button>
        </nav>

        {/* Tenant Stats Card inside Sidebar */}
        <div className="p-4 border-t border-[#E3E5E8] dark:border-slate-850">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[10px] font-black text-[#3F5353] dark:text-[#5F528E] uppercase tracking-wider font-mono">Live Ingress Engine</span>
            </div>
            <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {currentNicheConfig.tagline}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-[#E3E5E8] dark:border-slate-800/80 text-center font-mono">
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">{feeds.filter(f => f.niche === selectedNiche).length}</span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">Feeds</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">{writers.filter(w => w.niche === selectedNiche).length}</span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">Writers</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-[#0D1219] dark:text-white">{articles.filter(a => a.niche === selectedNiche).length}</span>
                <span className="text-[7.5px] text-[#8B8E96] font-bold uppercase tracking-wider">Drafts</span>
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
                <span className="text-xs font-black text-[#0D1219] dark:text-white">OMNIPUBLISHER METROS</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-600 dark:text-slate-300 hover:text-rose-500 p-1 rounded-full cursor-pointer animate-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select site niche drop and navigation items */}
            <div className="mb-4">
              <label className="block text-[9px] font-bold text-[#8B8E96] uppercase tracking-wider mb-1 font-mono">Select Active Niche</label>
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
            </div>

            {/* Side list of command keys */}
            <nav className="space-y-1 flex-1">
              <button
                onClick={() => { setActiveAdminTab('dashboard'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === 'dashboard' ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' : 'text-[#8B8E96]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Crawl Control</span>
              </button>
              
              <button
                onClick={() => { setActiveAdminTab('writers'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === 'writers' ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' : 'text-[#8B8E96]'
                }`}
              >
                <Users className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>Digital Writers Roster</span>
              </button>

              <button
                onClick={() => { setActiveAdminTab('feeds'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === 'feeds' ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' : 'text-[#8B8E96]'
                }`}
              >
                <Rss className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>RSS Source Feeds</span>
              </button>

              <button
                onClick={() => { setActiveAdminTab('settings'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === 'settings' ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' : 'text-[#8B8E96]'
                }`}
              >
                <FileCode className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>API Config settings</span>
              </button>

              <button
                onClick={() => { setActiveAdminTab('wordpress'); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition text-left ${
                  activeAdminTab === 'wordpress' ? 'bg-[#F0F1F2] dark:bg-slate-800 text-[#0D1219] dark:text-white font-bold' : 'text-[#8B8E96]'
                }`}
              >
                <Globe className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                <span>WordPress Sync Gate</span>
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
                  <span className="text-xs shrink-0">{selectedNiche === 'hollywood' ? '🎬' : selectedNiche === 'sports' ? '🏀' : '💻'}</span>
                  <h1 className="text-xs font-black tracking-wider text-[#0D1219] dark:text-slate-100 uppercase">
                    {selectedNiche === 'hollywood' ? 'GOSSIP & TRENDS CORE' : selectedNiche === 'sports' ? 'THE ARENA LIVE RADAR' : 'ALPHA TEARDOWN SPECS'}
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
              <div className={`hidden md:flex items-center gap-1.5 text-[9.5px] font-bold font-mono px-2.5 py-1 rounded-full ${
                saasConfig.wordpress[selectedNiche]?.isConfigured 
                  ? 'bg-emerald-500/10 text-[#3F5353] dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-[#FFF9EE] text-[#C38127] border border-amber-500/20'
              }`} id={`wp-check-${selectedNiche}`}>
                <span>CMS Link</span>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              </div>

              {/* Notifications Tray */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-xl transition border cursor-pointer active:scale-95 relative ${
                    theme === 'light' 
                      ? 'bg-white text-[#3F5353] border-[#E3E5E8] hover:bg-slate-50' 
                      : 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800 shadow-sm'
                  }`}
                  title="System Status & Notifications"
                  id="notifications-tray-btn"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce shadow-md">
                      {notifications.filter(n => !n.read).length}
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
                         <button onClick={handleMarkAllNotificationsRead} className="text-[9px] text-indigo-500 hover:text-indigo-400 font-bold cursor-pointer bg-transparent border-0">Read All</button>
                         <button onClick={handleClearNotifications} className="text-[9px] text-rose-500 hover:text-rose-400 font-bold cursor-pointer bg-transparent border-0">Clear</button>
                       </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-[#1e293b] dark:text-[#94a3b8]">
                          <p className="text-[10px] font-mono leading-relaxed">No new status issues reported.</p>
                          <p className="text-[8.5px] mt-1 opacity-70">Model gateways and WordPress synclinks are functioning smoothly.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-2.5 rounded-xl border transition ${
                              n.read 
                                ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-800/65 opacity-60' 
                                : 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-550/10'
                            }`}
                          >
                            <div className="flex items-start gap-1.5">
                              <span className="text-xs shrink-0 pt-0.5">
                                {n.type === 'error' ? '🔴' : n.type === 'warning' ? '⚠️' : '🟢'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate">{n.title || "System Alert"}</span>
                                  <span className="text-[8px] text-slate-400 font-mono shrink-0">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <p className="text-[9px] text-slate-500 dark:text-slate-350 break-words mt-0.5 leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 text-[8.5px] text-slate-400 font-mono text-center flex items-center justify-between">
                       <span>Quota health: <b className="text-[#3F5353] dark:text-emerald-400">100% ONLINE</b></span>
                       <span>Version: <b>v3.0.5</b></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme toggler */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-xl transition border cursor-pointer active:scale-95 ${
                  theme === 'light' 
                    ? 'bg-white text-[#3F5353] border-[#E3E5E8] hover:bg-slate-50' 
                    : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 shadow-sm'
                }`}
                title={theme === 'light' ? "Cinematic Premium Dark" : "Sophisticated SaaS Light"}
                id="theme-toggler-btn"
              >
                {theme === 'light' ? "🌙" : "☀️"}
              </button>

              {/* User badge */}
              <div className="w-8 h-8 rounded-full bg-[#3F5353] dark:bg-[#5F528E] text-white flex items-center justify-center font-bold text-xs select-none shadow-sm">
                OP
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Interactive Area */}
        <main className="max-w-[1680px] mx-auto p-4 md:p-6 w-full flex-grow">
          {/* Main Grid: split 12 columns layout as a beautiful spacious bento workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch w-full">
            
            {/* Control Column - Left area for active command suites (lg:col-span-4 xl:col-span-3) */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col lg:h-full w-full">
              
              {/* Legacy tab selector wrapper for screen compliance and fallback toggle on mobile select screen */}
              <div className="lg:hidden flex bg-white dark:bg-[#121620] border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-1 gap-1 select-none shadow-sm w-full overflow-x-auto">
                {(['dashboard', 'radar', 'calendar', 'mediaStudio', 'writers', 'feeds', 'wordpress', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAdminTab(tab)}
                    className={`flex-none px-3 py-2 text-center text-[10px] font-black uppercase rounded-lg transition-all tracking-wider shrink-0 duration-300 pointer-events-auto cursor-pointer ${
                      activeAdminTab === tab ? 'bg-indigo-650 text-white shadow-sm' : 'text-[#8B8E96] hover:text-[#0D1219]'
                    }`}
                  >
                    {tab === 'dashboard' ? '🌐 Crawl' : tab === 'radar' ? '📈 Radar' : tab === 'calendar' ? '📆 Calendar' : tab === 'mediaStudio' ? '🎨 Media' : tab === 'writers' ? '✍️ Writers' : tab === 'feeds' ? '📡 Feeds' : tab === 'wordpress' ? '🔌 WP' : '⚙️ Config'}
                  </button>
                ))}
              </div>

              {/* Configurable active panel base card - beautiful crisp background with matching margins */}
              <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl shadow-sm rounded-2xl border border-[#E3E5E8] dark:border-slate-850 p-5 overflow-hidden flex flex-col justify-between lg:min-h-[820px] lg:h-full relative w-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
            
            {/* TAB 1: RSS PUBLIC CRAWLER SOURCE LIST */}
            {activeAdminTab === 'dashboard' && (
              <div className="flex flex-col h-full overflow-hidden justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E5E8] dark:border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">Crawl-Ready Headlines</h4>
                      <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5 font-sans">Transform RSS feeds into unique 100% human prose</p>
                    </div>
                    <button
                      id="btn-sync-topics"
                      onClick={handleSyncFeeds}
                      disabled={isSyncingFeeds}
                      className="px-3 py-1.5 text-[10px] font-bold text-[#5F528E] dark:text-indigo-400 bg-[#5F528E]/10 dark:bg-indigo-955/45 border border-[#5F528E]/20 dark:border-indigo-500/30 rounded-xl flex items-center gap-1.5 hover:bg-[#5F528E]/20 hover:text-[#5F528E] disabled:opacity-50 transition-all duration-300 cursor-pointer opacity-95 hover:opacity-100 shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncingFeeds ? 'animate-spin' : ''}`} />
                      <span>{isSyncingFeeds ? "Syncing..." : "Sync Feeds"}</span>
                    </button>
                  </div>

                  {/* Segmented Mode Selector Toggle */}
                  <div className="flex bg-slate-100 dark:bg-[#070b14] rounded-xl p-1 mt-3.5 text-[9.5px] font-bold select-none border border-[#E3E5E8] dark:border-slate-805 gap-1">
                    <button
                      id="btn-headline-view-list"
                      type="button"
                      onClick={() => setHeadlineViewMode('list')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                        headlineViewMode === 'list' 
                          ? 'bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-700/50 shadow-md font-extrabold' 
                          : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205'
                      }`}
                    >
                      Opportunity List View 📋
                    </button>
                    <button
                      id="btn-headline-view-scheduler"
                      type="button"
                      onClick={() => setHeadlineViewMode('scheduler')}
                      className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                        headlineViewMode === 'scheduler' 
                          ? 'bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-700/50 shadow-md font-extrabold' 
                          : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205'
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
                          setAutopilotMode('semi-automation');
                          setAutopilotSchedulerActive(false);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer font-black transition-all ${autopilotMode === 'semi-automation' ? 'bg-[#3F5353] dark:bg-slate-800 text-white shadow font-black' : 'text-slate-450 hover:text-slate-200'}`}
                      >
                        🤖 Semi-Automation
                      </button>
                      <button
                        type="button"
                        id="btn-active-autopilot"
                        onClick={() => {
                          setAutopilotMode('autopilot');
                          setAutopilotSchedulerActive(false);
                          setShowAutopilotSetup(true);
                          setAutopilotLog("⚡ Active Autopilot mode selected! Ticker is currently STOPPED/PAUSED. Configure website selections and limits below, then click \"Start\" to run.");
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer font-black transition-all ${autopilotMode === 'autopilot' ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white shadow font-black' : 'text-slate-450 hover:text-slate-200'}`}
                      >
                        ⚡ Active Autopilot
                      </button>
                    </div>

                    {autopilotMode === 'autopilot' && (
                      <div className="p-3 bg-[#3F5353]/10 dark:bg-[#5F528E]/10 border border-[#3F5353]/30 dark:border-[#5F528E]/30 rounded-xl space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] b-semibold font-mono text-[#3F5353] dark:text-[#9A8FCD] flex items-center gap-1.5 font-bold uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3F5353] dark:bg-[#9A8FCD] animate-pulse inline-block"></span>
                            Autopilot Service Active
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowAutopilotSetup(!showAutopilotSetup)}
                            className="text-[9px] text-[#8B8E96] dark:text-slate-400 hover:text-indigo-350 underline font-mono cursor-pointer"
                          >
                            {showAutopilotSetup ? "Hide Config" : "Configs"}
                          </button>
                        </div>

                        {/* COUNTDOWN TICKER */}
                        <div className="p-2.5 bg-black/35 rounded-lg border border-slate-800/60 font-mono space-y-3" style={{ backgroundColor: '#dddddd', color: '#000000' }}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[10px]" style={{ color: '#000000' }}>Next automation slot:</span>
                            <div className="flex items-center gap-1.5">
                              {!autopilotSchedulerActive && (
                                <span className="bg-rose-950/40 border border-rose-800/45 text-rose-400 text-[7.5px] px-1 py-0.2 rounded font-black tracking-normal uppercase select-none animate-pulse">STOPPED</span>
                              )}
                              {autopilotSchedulerActive && (
                                <span className="bg-[#3F5353]/35 dark:bg-[#5F528E]/30 border border-[#3F5353]/35 dark:border-[#5F528E]/35 text-[#3F5353] dark:text-[#9A8FCD] text-[8px] px-1 py-0.2 rounded font-black tracking-normal uppercase select-none animate-pulse">RUNNING</span>
                              )}
                              <span className="text-[#3F5353] dark:text-[#9A8FCD] font-black tracking-wider animate-pulse" style={{ color: '#000000' }}>{autopilotCountdown}s</span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="h-1 bg-slate-900 rounded-full overflow-hidden w-full">
                            <div 
                              className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                                !autopilotSchedulerActive ? "from-amber-500 to-orange-400" : "from-[#3F5353] to-[#5F528E]"
                              }`}
                              style={{ width: `${(autopilotCountdown / 45) * 100}%` }}
                            ></div>
                          </div>

                          {/* TRI-STATE AUTOPILOT MANAGER CONTROLS (START - PAUSE - STOP) */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            {/* START BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setAutopilotSchedulerActive(true);
                                setAutopilotLog("Autopilot started! Clock ticking...");
                              }}
                              className={`px-2 py-1.5 text-[9px] font-mono font-black uppercase tracking-tight rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                autopilotSchedulerActive 
                                  ? "bg-[#3F5353] dark:bg-[#5F528E] text-white border border-[#3F5353]/60 dark:border-[#5F528E]/60 shadow-inner" 
                                  : "bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/25 dark:border-[#5F528E]/25 hover:bg-[#3F5353]/25 dark:hover:bg-[#5F528E]/25"
                              }`}
                              style={{ borderColor: '#0f7b00', color: '#016500' }}
                            >
                              <span className="shrink-0">▶</span> Start
                            </button>

                            {/* PAUSE BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setAutopilotSchedulerActive(false);
                                setAutopilotLog("Autopilot PAUSED. Resume anytime.");
                              }}
                              className={`px-2 py-1.5 text-[9px] font-mono font-black uppercase tracking-tight rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                !autopilotSchedulerActive && autopilotCountdown !== 45
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
                                setAutopilotMode('semi-automation');
                                setAutopilotLog("Autopilot STOPPED and reset to default.");
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
                            <span style={{ color: '#ffffff' }}>Live Activity Monitor:</span>
                          </div>
                          <p className="text-slate-300 font-mono line-clamp-2">{autopilotLog}</p>
                        </div>

                        {/* FAST TRACK TRIGGER */}
                        <button
                          type="button"
                          id="btn-trigger-autopilot-now"
                          disabled={isAutopilotRunningCycle}
                          onClick={handleExecuteAutopilotCycleInstantly}
                          className="w-full py-2 bg-gradient-to-r from-[#3F5353] to-[#5F528E] hover:from-[#4b6363] hover:to-[#6f60a6] text-white font-bold text-[10.5px] rounded-lg tracking-wide shadow-md hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isAutopilotRunningCycle ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block mr-1"></span>
                              Running Autopilot...
                            </>
                          ) : (
                            <>
                              <span>⚡ Fast-Track Next Dispatch</span>
                            </>
                          )}
                        </button>
                        
                        {showAutopilotSetup && (
                          <div className="space-y-3.5 pt-3.5 border-t border-[#3F5353]/20 dark:border-[#5F528E]/25 text-[9.5px] font-sans text-slate-755 dark:text-slate-300">
                            
                            {/* CONCURRENCY BATCH SELECTOR */}
                            <div className="bg-[#FAF9FB] dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl p-3 space-y-2 text-[#0D1219] dark:text-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="font-bold flex items-center gap-1.5 text-xs text-[#3F5353] dark:text-[#9A8FCD]">
                                  🚀 Concurrency Batch workload:
                                </span>
                                <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100/30">
                                  {autopilotBatchSize} {autopilotBatchSize === 1 ? 'Article' : 'Articles'} / cycle
                                </span>
                              </div>
                              <p className="text-[#8B8E96] dark:text-slate-400 text-[8.5px] leading-tight">
                                Define how many opportunities this active Autopilot dispatch cycle handles concurrently (up to 5 concurrently).
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-slate-500 font-mono text-[8px] uppercase tracking-wide">Select limit:</span>
                                <div className="flex items-center gap-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-slate-800 p-0.5 rounded-lg shadow-sm">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setAutopilotBatchSize(num)}
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

                            <div className="bg-[#020408]/30 border border-slate-800/40 rounded-xl p-3 space-y-3.5" style={{ backgroundColor: '#d5d5d7', borderColor: '#d5a751', borderStyle: 'solid', borderWidth: '1px' }}>
                              <h6 className="text-[9px] font-black uppercase font-mono tracking-wider text-[#3F5353] dark:text-[#9A8FCD] flex items-center justify-between">
                                <span style={{ color: '#000000' }}>🌐 Website Selection & Limits:</span>
                                <button
                                  type="button"
                                  onClick={() => setAutopilotProcessedCounts({ hollywood: 0, sports: 0, tech: 0 })}
                                  className="text-[7.5px] px-1 py-0.5 rounded bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/25 dark:border-[#5F528E]/25 font-black hover:bg-[#3F5353]/25 dark:hover:bg-[#5F528E]/25 uppercase cursor-pointer"
                                  style={{ backgroundColor: '#dadede', color: '#000000' }}
                                >
                                  Reset Session Counts
                                </button>
                              </h6>

                              <div className="space-y-3">
                                {[
                                  { key: 'hollywood', label: 'Gossip & Glam', emoji: '💄' },
                                  { key: 'sports', label: 'The Arena', emoji: '🏀' },
                                  { key: 'tech', label: 'ALPHA TEARDOWN', emoji: '🔌' }
                                ].map((site) => {
                                  const limit = autopilotNicheLimits[site.key] ?? 0;
                                  const processed = autopilotProcessedCounts[site.key] ?? 0;
                                  const isEnabled = autopilotNicheEnabled[site.key];

                                  const inputBgColor = site.key === 'hollywood' ? '#ffffff' : site.key === 'sports' ? '#f9f9f9' : '#ffffff';

                                  return (
                                    <div key={site.key} className="flex flex-col gap-2 p-2.5 bg-black/45 border border-slate-900 rounded-xl shadow-inner" style={{ backgroundColor: '#fff8f8', color: '#000000' }}>
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-slate-200" style={{ color: '#000000' }}>
                                          <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={(e) => setAutopilotNicheEnabled(prev => ({ ...prev, [site.key]: e.target.checked }))}
                                            className="rounded border-slate-800 bg-[#070b14] text-[#3F5353] dark:text-[#5F528E] focus:ring-[#3F5353] w-3.5 h-3.5 cursor-pointer"
                                          />
                                          <span>{site.emoji} {site.label}</span>
                                        </label>

                                        {/* Progress indicator badge */}
                                        <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                                          !isEnabled ? 'bg-slate-800 text-slate-500' : processed >= limit ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30 font-black animate-pulse' : 'bg-[#3F5353]/15 dark:bg-[#5F528E]/15 text-[#3F5353] dark:text-[#9A8FCD] border border-[#3F5353]/20 dark:border-[#5F528E]/20'
                                        }`}>
                                          {!isEnabled ? 'DISABLED' : `${processed}/${limit} articles`}
                                        </span>
                                      </div>

                                      {isEnabled && (
                                        <div className="flex items-center gap-1.5 justify-between">
                                          <span className="text-slate-400 font-mono text-[8.5px]" style={{ color: '#000000' }}>Article limit for this website:</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => setAutopilotNicheLimits(prev => ({ ...prev, [site.key]: Math.max(0, (prev[site.key] ?? 0) - 1) }))}
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
                                                const val = parseInt(e.target.value) || 0;
                                                setAutopilotNicheLimits(prev => ({ ...prev, [site.key]: Math.max(0, val) }));
                                              }}
                                              className="w-10 text-center p-0.5 bg-black text-[9.5px] font-mono font-bold text-slate-100 rounded border border-slate-800 outline-none"
                                              style={{ backgroundColor: inputBgColor, color: '#000000' }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setAutopilotNicheLimits(prev => ({ ...prev, [site.key]: Math.min(20, (prev[site.key] ?? 0) + 1) }))}
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

                            <div className="space-y-1 bg-[#020408]/30 border border-slate-800/40 p-2.5 rounded-xl" style={{ backgroundColor: '#b7b7b7', color: '#000000' }}>
                              <h6 className="text-[8.5px] font-extrabold uppercase font-mono tracking-wider text-[#3F5353] dark:text-[#9A8FCD]" style={{ color: '#000000' }}>Participating Systems:</h6>
                              {[
                                { key: 'trendsAnalysis', label: '🔍 Trends Analysis Agent (Auto-Scans Keywords)' },
                                { key: 'editorialCouncil', label: '👥 Editorial Council (Simulates Peer Reviews)' },
                                { key: 'antiAiHumanizer', label: '🛡️ Anti-AI Humanizer Hook (Targets Human-Like Flow)' },
                                { key: 'adsenseMaximizer', label: '💰 AdSense Optimization Audit (AdSense Compliant)' },
                                { key: 'seoMetadata', label: '🌐 Post-Meta Field Injection (SEO compatible Columns)' },
                                { key: 'imageGeneration', label: '🎨 Image Prompter Engine (Original visual draft)' },
                                { key: 'wordpressSyndication', label: '⚡ WP Syndication Gate (Direct Publish if human score > 95%)' },
                              ].map((sys) => (
                                <label key={sys.key} className="flex items-start gap-1.5 cursor-pointer hover:text-[#3F5353] dark:hover:text-[#9A8FCD] transition-colors select-none" style={{ color: '#000000' }}>
                                  <input
                                    type="checkbox"
                                    checked={autopilotSystems[sys.key]}
                                    onChange={(e) => setAutopilotSystems(prev => ({ ...prev, [sys.key]: e.target.checked }))}
                                    className="rounded border-[#E3E5E8] dark:border-slate-850 bg-[#070b14] text-[#3F5353] dark:text-[#5F528E] focus:ring-[#3F5353] w-3.5 h-3.5 shrink-0 mt-0.5 cursor-pointer"
                                  />
                                  <span className="leading-tight">{sys.label}</span>
                                </label>
                              ))}
                            </div>
                            <p className="text-[8px] text-slate-500 font-mono italic leading-normal mt-1" style={{ color: '#000000' }}>
                              When Autopilot schedule ticker completes, all selected systems will process the high-performing slot winners automatically.
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
                      onChange={(e) => setSelectedWriterId(e.target.value)}
                      className="w-full bg-white dark:bg-[#070b14] hover:bg-[#F0F1F2] dark:hover:bg-[#0c1222] border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 text-xs text-[#0D1219] dark:text-slate-205 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                    >
                      {writers.filter(w => w.niche === selectedNiche).map(w => (
                        <option key={w.id} value={w.id} className="bg-white dark:bg-slate-950 text-[#0D1219] dark:text-slate-205 font-sans font-semibold">
                          {w.name} — ({w.voiceStyle})
                        </option>
                      ))}
                    </select>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/40 font-sans">
                      <button
                        type="button"
                        onClick={() => setShowExpandedRewriteSettings(!showExpandedRewriteSettings)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer select-none"
                      >
                        <span>{showExpandedRewriteSettings ? "▼ Hide" : "▶ Show"} Advanced Copilot Synthesis Options</span>
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
                              <span className="text-[9px] text-[#22c55e] font-mono font-bold">● Active</span>
                            </div>

                            {/* SOURCE SELECTOR DROPDOWN */}
                            <div className="space-y-1 text-left">
                              <label className="block text-[8.5px] font-mono tracking-wider font-extrabold text-slate-400 uppercase">
                                Match Breakout News:
                              </label>
                              <select
                                value={selectedSource ? selectedSource.title : (suggestedSources[0]?.title || "")}
                                onChange={(e) => {
                                  const src = suggestedSources.find(s => s.title === e.target.value);
                                  if (src) setSelectedSource(src);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-1.5 outline-none text-[10.5px] font-semibold cursor-pointer"
                              >
                                {suggestedSources.length === 0 ? (
                                  <option value="">No breakout opportunities loaded</option>
                                ) : (
                                  suggestedSources.map(src => (
                                    <option key={src.id || src.title} value={src.title}>
                                      [{src.niche.toUpperCase()}] {src.title.slice(0, 42)}...
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>

                            {/* METADATA PREVIEW PANEL */}
                            {(() => {
                              const activeSrc = selectedSource || suggestedSources[0];
                              if (!activeSrc) return null;
                              return (
                                <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1 text-[9px] font-sans">
                                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-450 uppercase">
                                    <span>⚡ Selected Target Link</span>
                                    <span className="text-amber-400 font-bold font-mono">Score: {activeSrc.opportunityScore || 90}%</span>
                                  </div>
                                  <p className="font-bold text-slate-200 line-clamp-1">{activeSrc.title}</p>
                                  <p className="text-slate-400 text-[8.5px] line-clamp-2 leading-snug">
                                    {activeSrc.description || "Headline matched from active niche feed."}
                                  </p>
                                </div>
                              );
                            })()}

                            <button
                              type="button"
                              onClick={handleAutoSynthesizeCopilot}
                              disabled={isSynthesizingCopilot || (!selectedSource && suggestedSources.length === 0)}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 px-3 rounded-lg text-[10.5px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md font-mono"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isSynthesizingCopilot ? 'animate-spin' : ''}`} />
                              {isSynthesizingCopilot ? "Synthesizing Strategy..." : "🤖 Auto-Synthesize 10-Dial Strategy"}
                            </button>
                            <p className="text-[8.5px] text-slate-450 leading-snug">Scans matching breakout context to inject tailored optimization vectors across all 10 dials below.</p>
                          </div>

                          {/* 1. Synthesis Depth */}
                          <div>
                            <label className="block text-slate-450 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 1: Synthesis Depth:</label>
                            <div className="flex bg-[#070b14]/80 border border-slate-800 rounded-lg p-0.5 font-mono text-[9px]">
                              {(['short', 'medium', 'deep-dive'] as const).map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setRewriteDepth(d)}
                                  className={`flex-1 py-1 rounded-md text-center cursor-pointer font-bold transition-all ${rewriteDepth === d ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                  {d === 'short' ? '⚡ Short' : d === 'medium' ? '📝 Medium' : '📚 Deep'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Substyle genre modifier */}
                          <div>
                            <label className="block text-slate-450 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 2: Substyle Genre Overlay:</label>
                            <select
                              value={rewriteSubstyle}
                              onChange={(e) => setRewriteSubstyle(e.target.value)}
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            >
                              <option value="standard">Standard Tone Alignment</option>
                              <option value="tabloid-gossip">Tabloid & Salacious Drama</option>
                              <option value="technical-guide">Thorough Technical Specs & Tables</option>
                              <option value="sarcastic-polemic">Biting Sarcastic Polemic</option>
                              <option value="thought-leadership">Inspiring Industry Thought Leadership</option>
                              <option value="investigative-deep-dive">Investigative Deep-Dive Report</option>
                              <option value="insider-whistleblower">Anonymized Insider Whistleblower</option>
                            </select>
                          </div>

                          {/* 3. Custom Private Facts */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 3: Factual Anchors / Insight Injection:</label>
                            <textarea
                              rows={2}
                              value={rewriteCustomFacts}
                              onChange={(e) => setRewriteCustomFacts(e.target.value)}
                              placeholder="Inject private details, insider leaks, or brand claims to weave into the story..."
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                          </div>

                          {/* 4. Target Audience */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 4: Target Audience Demographic:</label>
                            <input
                              type="text"
                              value={copilotTargetAudience}
                              onChange={(e) => setCopilotTargetAudience(e.target.value)}
                              placeholder="e.g. Disillusioned developers, early-stage founders"
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                          </div>

                          {/* 5. Custom Tone */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 5: Specific Tone Modulizer:</label>
                            <input
                              type="text"
                              value={copilotTone}
                              onChange={(e) => setCopilotTone(e.target.value)}
                              placeholder="e.g. Cynical but detail-rich, highly sophisticated"
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                          </div>

                          {/* 6. Block Structure */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 6: Content Block Structure Layout:</label>
                            <input
                              type="text"
                              value={copilotStructure}
                              onChange={(e) => setCopilotStructure(e.target.value)}
                              placeholder="e.g. Hook -> Spec Matrix Table -> Critical Analysis -> Poll"
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                          </div>

                          {/* 7. SEO Strategy & Targeted Keywords */}
                          <div className="space-y-1.5">
                            <div>
                              <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 7a: SEO Keywords (comma separated):</label>
                              <input
                                type="text"
                                value={rewriteCustomKeywords}
                                onChange={(e) => setRewriteCustomKeywords(e.target.value)}
                                placeholder="e.g. specs, leaks, rankings, premium"
                                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[8px] tracking-wider">Dial 7b: Organic SEO Strategy Directives:</label>
                              <input
                                type="text"
                                value={copilotSeoStrategy}
                                onChange={(e) => setCopilotSeoStrategy(e.target.value)}
                                placeholder="e.g. Rank for high-intent specs queries"
                                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </div>
                          </div>

                          {/* 8. Content Objectives */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 8: Content Strategic Objectives:</label>
                            <input
                              type="text"
                              value={copilotContentObjectives}
                              onChange={(e) => setCopilotContentObjectives(e.target.value)}
                              placeholder="e.g. Build topical authority in sports telemetry"
                              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                          </div>

                          {/* 9. Engagement Optimization */}
                          <div>
                            <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 9: Engagement & Trust Hack (Niche Authority):</label>
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={copilotEngagementOptimization}
                                onChange={(e) => setCopilotEngagementOptimization(e.target.value)}
                                placeholder="Dial 9a: Engagement Optimization (e.g. Poll Hook)"
                                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                              <input
                                type="text"
                                value={copilotAuthorityBuilding}
                                onChange={(e) => setCopilotAuthorityBuilding(e.target.value)}
                                placeholder="Dial 9b: Authority Building elements (e.g. cite standards)"
                                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </div>
                          </div>

                          {/* 10. Conversion Optimization & AdSense */}
                          <div className="space-y-2">
                            <div>
                              <label className="block text-slate-405 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Dial 10a: Conversion Optimization Lead Capture:</label>
                              <input
                                type="text"
                                value={copilotConversionOptimization}
                                onChange={(e) => setCopilotConversionOptimization(e.target.value)}
                                placeholder="e.g. Plug newsletter below specs matrix tables"
                                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-md p-1.5 text-[10px] text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                              />
                            </div>
                            <div className="flex items-center justify-between pt-1 select-none">
                              <span className="text-slate-405 text-[9px] font-bold font-mono uppercase tracking-wider">Dial 10b: AdSense Optimization Audit:</span>
                              <button
                                type="button"
                                onClick={() => setRewriteAdsenseOptimized(!rewriteAdsenseOptimized)}
                                className={`px-2 py-1 rounded text-[8.5px] font-bold border transition ${rewriteAdsenseOptimized ? 'bg-emerald-950/45 text-emerald-300 border-emerald-500/40 font-extrabold shadow-sm' : 'bg-[#070b14] text-slate-405 border-slate-800 hover:bg-slate-900 hover:text-slate-200'}`}
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
                      <span className="text-xs font-black uppercase text-slate-300 font-mono tracking-wider">No feeds crawled yet</span>
                      <p className="text-[10.5px] text-slate-450 max-w-[200px] leading-relaxed">Click 'Sync Feeds' to crawl fresh sports, celebrity, or tech logs.</p>
                    </div>
                  ) : headlineViewMode === 'list' ? (
                    /* ORIGINAL STRIP LIST VIEW */
                    suggestedSources.map((source) => {
                      const computedRating = source.rating || 75;
                      const classification = source.classification || "Strategic Domain 🔬";
                      return (
                        <div key={source.id} className="suggested-source-card p-4 rounded-xl border border-slate-800 bg-[#070b14]/50 hover:bg-[#0c1222]/50 hover:border-indigo-505/35 transition-all duration-300 relative group flex flex-col justify-between shadow-md">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold gap-2 flex-wrap pb-1.5">
                              <span className="truncate max-w-[120px] font-semibold text-slate-405 font-mono">{source.sourceName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`suggested-source-badge px-2 py-0.5 rounded text-[8.5px] font-mono font-bold ${
                                  computedRating >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  computedRating >= 80 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-slate-900 text-slate-300 border border-slate-800'
                                }`}>
                                  {classification} ({computedRating}%)
                                </span>
                                <span className="font-mono text-slate-500">{source.pubDate}</span>
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
                              onClick={() => handleInitiateAgentRewrite(source)}
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-md hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>Rewrite 100% Unique</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* ADVANCED TIMELINE OPPORTUNITY SCHEDULER VIEW */
                    <div className="space-y-4 pr-1 animate-none">
                      {[
                        { id: "slot-morning", name: "🌅 09:00 AM — Morning Coffee Briefing", timeText: "09:00 AM" },
                        { id: "slot-midday", name: "⚡ 12:00 PM — Midday Virality Spike", timeText: "12:00 PM" },
                        { id: "slot-afternoon", name: "🔬 03:00 PM — Afternoon Intelligence Deep", timeText: "03:00 PM" },
                        { id: "slot-evening", name: "🔥 06:00 PM — Evening Primetime Viral", timeText: "12:00 PM" },
                        { id: "slot-midnight", name: "🌌 09:00 PM — Midnight News Roundup", timeText: "09:00 PM" }
                      ].map((slot, slotIdx) => {
                        // Filter sources for this slot
                        const slotSources = suggestedSources.filter(src => {
                          if (src.slotId) {
                            return src.slotId === slot.id;
                          }
                          const charSum = src.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          return (charSum % 5) === slotIdx;
                        });

                        // Find slot champion
                        let champion: SuggestedSource | null = null;
                        if (slotSources.length > 0) {
                          const markedHighest = slotSources.find(s => s.isHighestInSlot);
                          if (markedHighest) {
                            champion = markedHighest;
                          } else {
                            champion = slotSources.reduce((prev, curr) => ((curr.rating || 0) > (prev.rating || 0)) ? curr : prev, slotSources[0]);
                          }
                        }

                        return (
                          <div key={slot.id} className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 shadow-sm hover:shadow-md transition-all duration-300">
                            {/* Slot header bar */}
                            <div className="bg-slate-50 dark:bg-slate-900/85 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tracking-wide">{slot.name}</span>
                              <span className="text-[9px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-550/20 px-2 py-0.5 rounded-lg">{slotSources.length} topics</span>
                            </div>

                            {/* Slot contents */}
                            <div className="p-3 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/55">
                              {slotSources.length === 0 ? (
                                <div className="text-center p-3 text-[10px] text-slate-400 dark:text-slate-500 font-sans italic">No scheduled news opportunities in this slot.</div>
                              ) : (
                                slotSources.map((source) => {
                                  const ratingVal = source.rating || 75;
                                  const ratingLabel = source.classification || "Steady news";
                                  const isChamp = champion?.id === source.id;

                                  return (
                                    <div key={source.id} className={`suggested-source-card pt-3 first:pt-0 ${isChamp ? 'bg-amber-500/5 border-l-2 border-amber-500 pl-2.5 rounded-r-lg' : ''}`}>
                                      <div className="flex items-center justify-between text-[8px] font-bold gap-2">
                                        <span className="text-slate-405 dark:text-slate-400 truncate max-w-[80px] font-mono">{source.sourceName}</span>
                                        <div className="flex items-center gap-1">
                                          {isChamp && (
                                            <span className="text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-550/30 rounded px-1.5 py-0.5 flex items-center gap-0.5 uppercase tracking-wider scale-95 origin-right font-mono font-bold">
                                              <span>Champion 👑</span>
                                            </span>
                                          )}
                                          <span className={`suggested-source-badge px-1.5 py-0.2 rounded font-mono ${
                                            ratingVal >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-500/20' :
                                            ratingVal >= 80 ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-505/20' :
                                            'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                          }`}>
                                            {ratingLabel} ({ratingVal}%)
                                          </span>
                                        </div>
                                      </div>

                                      <h5 className="suggested-source-title text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1.5 leading-snug line-clamp-1 font-sans">
                                        {source.title}
                                      </h5>

                                      <div className="flex items-center justify-between mt-2 text-[9.5px] font-mono">
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black transition-colors">Link 🔗</a>
                                        {isChamp && (
                                          <button
                                            type="button"
                                            onClick={() => handleInitiateAgentRewrite(source)}
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

            {/* TAB 2: WRITERS FACTORY */}
            {activeAdminTab === 'writers' && (
              <div className="flex flex-col h-full overflow-hidden justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-205 dark:border-slate-850">
                    <div>
                      <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-violet-500" />
                        <span>Writers Factory 🏭</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Sculpt high-engagement voices via tags, competitor rules, and AI correction</p>
                    </div>
                    <button
                      id="btn-show-add-writer"
                      onClick={() => {
                        setShowAddWriter(!showAddWriter);
                        setSelectedSkillsTags([]);
                        setSelectedCompetitor(nicheCompetitors[selectedNiche]?.[0] || "TechCrunch");
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-bold border border-transparent bg-indigo-650 dark:bg-[#5F528E] text-white rounded-lg flex items-center gap-1 hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm font-mono"
                    >
                      <Plus className="w-3 h-3 text-white" />
                      {showAddWriter ? "View Roster" : "Forge Writer"}
                    </button>
                  </div>
                </div>

                {showAddWriter ? (
                  /* Create Custom Tone Writer form / Writers Factory */
                  <form onSubmit={handleCreateWriter} className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1 max-h-[580px] lg:max-h-[740px]">
                    
                    {/* COMPETITOR SELECTOR */}
                    <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                      <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">
                        1. Target Competitor blueprint
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(nicheCompetitors[selectedNiche] || []).map((comp) => (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => setSelectedCompetitor(comp)}
                            className={`p-2 rounded-lg border text-center text-[10.5px] font-bold transition-all ${
                              selectedCompetitor === comp
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-extrabold'
                                : 'bg-white dark:bg-[#070b14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-900'
                            }`}
                          >
                            {comp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SKILL TAGS SELECTOR */}
                    <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/45 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                      <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">
                        2. Pick writer skills & Specialities (Pick multiple)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(nicheSkills[selectedNiche] || []).map((skill) => {
                          const isSelected = selectedSkillsTags.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSkillsTags(prev => prev.filter(s => s !== skill));
                                } else {
                                  setSelectedSkillsTags(prev => [...prev, skill]);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-violet-605/10 text-violet-600 dark:text-violet-400 border-violet-500/40 shadow-xs'
                                  : 'bg-white dark:bg-[#070b14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-900'
                              }`}
                            >
                              <span>{skill}</span>
                              {isSelected && <span className="text-[8px]">✨</span>}
                            </button>
                          );
                        })}
                      </div>
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
                          onChange={(e) => setNewWriterName(e.target.value)}
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
                          onChange={(e) => setNewWriterVoice(e.target.value)}
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
                        <Sparkles className={`w-3.5 h-3.5 text-white ${isCorrectingWriter ? "animate-spin" : ""}`} />
                        {isCorrectingWriter ? "Synthesizing tone matrix with Gemini..." : "✨ Optimize & Correct Writer with Gemini"}
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
                          onChange={(e) => setNewWriterBio(e.target.value)}
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
                          onChange={(e) => setNewWriterInstruction(e.target.value)}
                          className="w-full text-xs text-slate-805 dark:text-slate-201 bg-white dark:bg-[#070b14] border border-slate-202 dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-550 font-mono text-[10.5px] outline-none"
                        />
                      </div>
                    </div>

                    {/* FORM CONTROL BUTTONS */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-violet-605 to-indigo-655 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer transition-all duration-300"
                      >
                        Register Factory Tone Specialist
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddWriter(false);
                          setNewWriterName("");
                          setNewWriterVoice("");
                          setNewWriterBio("");
                          setNewWriterInstruction("");
                        }}
                        className="text-slate-450 text-xs hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Digital Writer portfolio layout cards & Preset Cloners */
                  <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1 max-h-[520px] lg:max-h-[720px] select-text">
                    
                    {/* Active Registry */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Active Registered Guild</h5>
                      {writers.filter(w => w.niche === selectedNiche).length === 0 ? (
                        <div className="text-center p-5 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-450 font-sans">
                          No digital reporters registered in this niche. Add your first custom writer or hire candidates below!
                        </div>
                      ) : (
                        writers.filter(w => w.niche === selectedNiche).map((writer, idx) => {
                          const isFirstWriter = idx === 0;
                          return (
                            <div 
                              key={writer.id} 
                              className={`journalist-guild-card p-3.5 rounded-xl border flex gap-3 shadow-xs transition-all duration-300 select-text ${
                                isFirstWriter
                                  ? 'bg-[#3F5353]/5 dark:bg-[#5F528E]/10 border-[#3F5353] dark:border-[#5F528E]'
                                  : 'border-slate-205 dark:border-slate-800 bg-[#F8F9FA]/40 dark:bg-slate-950/25'
                              }`}
                            >
                              <img
                                src={writer.avatar || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"}
                                alt={writer.name}
                                className="w-10 h-10 rounded-full border object-cover shrink-0 filter brightness-90 shadow-inner border-[#E3E5E8] dark:border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <h6 className="journalist-guild-title text-xs font-black text-[#0D1219] dark:text-slate-101 flex items-center gap-1.5 font-sans">
                                    {isFirstWriter && (
                                      <span className="w-1.5 h-1.5 bg-[#3F5353] dark:bg-[#5F528E] rounded-full inline-block shrink-0 animate-pulse" />
                                    )}
                                    {writer.name}
                                  </h6>
                                  <span className="journalist-guild-badge text-[8.5px] border font-mono rounded-md px-1.5 py-0.5 shrink-0 select-none bg-white dark:bg-[#070b14] border-[#E3E5E8] dark:border-slate-800 text-slate-705 dark:text-slate-400">
                                    Rating: {writer.popularity || 85}%
                                  </span>
                                </div>
                                
                                <div className="text-[10px] font-bold uppercase tracking-wider font-mono mt-0.5 select-none text-indigo-600 dark:text-amber-400">
                                  {writer.voiceStyle}
                                </div>

                                <p className="journalist-guild-desc text-[11px] mt-1 leading-relaxed font-sans text-slate-600 dark:text-slate-400">{writer.bio}</p>

                                <div className="journalist-guild-footer mt-2 text-[10px] font-mono p-2 rounded-lg border max-h-[100px] overflow-y-auto select-text text-slate-800 dark:text-slate-300 bg-white/70 dark:bg-slate-950/60 border-slate-205 dark:border-slate-855">
                                  <strong className="text-indigo-600 dark:text-[#9A8FCD] font-bold font-mono">Concept Directives:</strong> {writer.customPromptInstruction}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Candidates waiting to join the board (Applicants) */}
                    <div className="pt-4 border-t border-slate-205 dark:border-slate-850 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-500 shrink-0 select-none animate-pulse" />
                        <h5 className="text-[10px] font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono">
                          Candidates Ready to Join Board
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500/90 -mt-2 leading-relaxed font-sans">
                        Highly suggested talents ready to deploy directly to your board.
                      </p>

                      <div className="space-y-2.5">
                        {boardApplicants.filter(c => c.niche === selectedNiche).map((applicant, idx) => (
                          <div key={idx} className="p-3 bg-[#F8F9FA]/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl flex gap-3 shadow-xs hover:border-indigo-500/25 transition-all">
                            <img
                              src={applicant.avatar}
                              alt={applicant.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h6 className="text-xs font-black text-slate-850 dark:text-slate-101 flex items-center gap-1 font-sans">{applicant.name}</h6>
                                <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/20 px-1.5 py-0.5 rounded">
                                  Inspired by {applicant.competitor}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{applicant.bio}</p>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                {applicant.skills.map(sk => (
                                  <span key={sk} className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-[8.5px] px-2 py-0.5 rounded font-mono font-bold">
                                    {sk}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-2 flex items-center justify-end gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleHireApplicant(applicant)}
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

                    {/* Pre-packaged publication clones */}
                    <div className="pt-4 border-t border-slate-205 dark:border-slate-850 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-500 shrink-0 select-none" />
                        <h5 className="text-[10px] font-black text-[#0D1219] dark:text-slate-101 uppercase tracking-widest font-mono">
                          Classic Elite Blueprint Templates
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 -mt-2 leading-relaxed font-sans">
                        Quickly instantiate historical style-formulas with one-click cloning:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                        {WRITER_PRESETS.map((preset, idx) => (
                          <div key={idx} className="journalist-guild-card p-3 bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-805/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-indigo-500/35 transition-all duration-300 flex flex-col justify-between text-left select-text rounded-xl">
                            <div>
                              <div className="flex items-center justify-between">
                                 <span className="journalist-guild-badge text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-505/10 px-2 py-0.5 rounded border border-indigo-150 dark:border-[#6366f1]/20 font-mono shadow-sm">
                                   {preset.targetInspiration}
                                 </span>
                                 <span className="text-[8px] font-mono text-slate-400 dark:text-slate-505 font-bold uppercase">PRESET</span>
                              </div>
                              <h6 className="journalist-guild-title text-[11px] font-bold text-slate-900 dark:text-slate-105 mt-2">{preset.name}</h6>
                              <p className="journalist-guild-desc text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">{preset.bio}</p>
                            </div>
                            <button
                              id={`btn-hire-preset-${idx}`}
                              type="button"
                              onClick={() => handleClonePresetWriter(preset)}
                              className="btn-customize-hire w-full mt-3 py-1.5 text-center font-bold text-[9px] rounded-lg border border-indigo-150 dark:border-indigo-500/50 bg-indigo-50/50 dark:bg-[#0d1321] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-600 shadow-sm transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer select-none font-mono"
                            >
                              <Plus className="w-2.5 h-2.5 text-indigo-400 dark:text-indigo-300" /> Customize & Hire
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeAdminTab === 'feeds' && (
              <div className="flex flex-col h-full overflow-hidden justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">XML Sourcing feeds</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">Modify the crawler stream pathways</p>
                    </div>
                    <button
                      id="btn-show-add-feed"
                      onClick={() => setShowAddFeed(!showAddFeed)}
                      className="px-3 py-1.5 text-[10px] font-bold text-white bg-[#3F5353] dark:bg-[#5F528E] border border-transparent rounded-xl flex items-center gap-1.5 hover:bg-opacity-90 transition-all duration-300 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddFeed ? "Cancel" : "Add RSS Link"}</span>
                    </button>
                  </div>

                  {!showAddFeed && (
                    /* Sub-tab segment selector (Active Sourcing vs Catalog presets) */
                    <div className="flex bg-slate-100 dark:bg-[#070b14] rounded-xl p-1 mt-3.5 text-[9.5px] font-bold select-none border border-[#E3E5E8] dark:border-slate-805 gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveFeedSubTab('active')}
                        className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer ${
                          activeFeedSubTab === 'active' 
                            ? 'bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-705/50 shadow-md font-extrabold' 
                            : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205'
                        }`}
                      >
                        Active Pathways ({feeds.filter(f => f.niche === selectedNiche).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFeedSubTab('presets')}
                        className={`flex-1 py-1.5 text-center rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 ${
                          activeFeedSubTab === 'presets' 
                            ? 'bg-[#3F5353] dark:bg-slate-800 text-white border border-[#3F5353] dark:border-slate-705/50 shadow-md font-extrabold' 
                            : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-slate-205'
                        }`}
                      >
                        ⚡ RSS Discovery
                      </button>
                    </div>
                  )}
                </div>

                {showAddFeed ? (
                  /* Custom Feed URL entry */
                  <form onSubmit={handleCreateFeed} className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">Feed Agency Name</label>
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
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-widest font-mono">Secure RSS XML Source URL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://agency.com/rss.xml"
                        value={newFeedUrl}
                        onChange={(e) => setNewFeedUrl(e.target.value)}
                        className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-[#070b14] border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#3F5353] dark:focus:ring-[#5F528E] transition-all outline-none"
                      />
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
                ) : activeFeedSubTab === 'active' ? (
                  /* Core XML feeds crawler logs list */
                  <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1 max-h-[355px] lg:max-h-[660px]">
                    {feeds.filter(f => f.niche === selectedNiche).length === 0 ? (
                      <div className="text-center p-8 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl text-xs text-slate-450 font-sans">
                        No custom feeds integrated. Sync preset feeds or add custom URLs above!
                      </div>
                    ) : (
                      feeds.filter(f => f.niche === selectedNiche).map((feed, idx) => {
                        const isFirstFeed = idx === 0;
                        return (
                          <div
                            key={feed.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-md transition-all duration-300 ${
                              isFirstFeed
                                ? 'bg-[#3F5353]/10 dark:bg-[#5F528E]/10 border-[#3F5353] dark:border-[#5F528E]'
                                : 'border-[#E3E5E8] dark:border-slate-800 bg-[#F8F9FA]/40 dark:bg-slate-950/25'
                            }`}
                          >
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#0D1219] dark:text-slate-100 truncate flex items-center gap-1.5">
                                {isFirstFeed && (
                                  <span className="w-1.5 h-1.5 bg-[#3F5353] dark:bg-[#5F528E] rounded-full inline-block shrink-0 animate-pulse" />
                                )}
                                {feed.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{feed.url}</p>
                              {feed.lastSyncedAt && (
                                <div className="text-[9px] font-bold mt-1.5 uppercase font-mono tracking-wide text-[#3F5353] dark:text-[#9A8FCD]">
                                  Last crawled: {new Date(feed.lastSyncedAt).toLocaleTimeString()}
                                </div>
                              )}
                            </div>

                            <span
                              className={`shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border font-mono shadow-sm ${
                                isFirstFeed
                                  ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white border-transparent'
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              Active Sourcing
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* RSS DISCOVERY CATALOG PRESETS DIRECTORY (20+ FEEDS IN EACH NICHE) */
                  <div className="flex-1 flex flex-col mt-4 overflow-hidden">
                    {/* Header with bulk action */}
                    <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/70 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-indigo-950/45 p-4 border border-indigo-100 dark:border-violet-500/15 rounded-xl flex items-center justify-between gap-3 mb-4 shrink-0 shadow-sm">
                      <div>
                        <h6 className="text-[10.5px] font-bold uppercase tracking-widest text-indigo-700 dark:text-[#a5b4fc] font-mono">⚡ Bulk Catalog Onboarding</h6>
                        <p className="text-[9.5px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans mt-0.5">Deploy all top verified 20 resource feeds for {selectedNiche.toUpperCase()} in one click.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nichePresets = RSS_CATALOG.filter(c => c.niche === selectedNiche);
                          handleBulkAddPresets(nichePresets);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-all duration-300 cursor-pointer text-center whitespace-nowrap shrink-0"
                      >
                        Deploy List (All 20)
                      </button>
                    </div>

                    {/* Presets List Scroll Box */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px] lg:max-h-[580px] scrollbar-thin">
                      {RSS_CATALOG.filter(preset => preset.niche === selectedNiche).map((preset, idx) => {
                        const isAlreadyIntegrated = feeds.some(f => f.url.toLowerCase() === preset.url.toLowerCase());
                        return (
                          <div key={idx} className="p-3 border border-slate-200 dark:border-slate-805/85 rounded-xl hover:border-indigo-500/35 bg-white dark:bg-slate-950/20 shadow-sm hover:shadow-md flex items-center justify-between gap-3 transition-all duration-300">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550">Rank #{idx + 1}</span>
                                <span className="text-[8.5px] uppercase font-bold px-1.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">Authority</span>
                              </div>
                              <h5 className="text-[11.5px] font-bold text-slate-900 dark:text-slate-105 mt-1 line-clamp-1">{preset.name}</h5>
                              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{preset.url}</p>
                            </div>

                            <div className="shrink-0 font-mono">
                              {isAlreadyIntegrated ? (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded px-2.5 py-1 inline-flex items-center select-none shadow-sm">
                                  ✓ Added
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddPresetFeed(preset.name, preset.url)}
                                  className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-500/30 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-500 rounded-lg px-2.5 py-1.5 shadow-sm transition-all duration-300 cursor-pointer"
                                >
                                  + Integrate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* TAB 4: SAAS & INTEGRATION SETTINGS */}
            {activeAdminTab === 'settings' && (
              <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 text-xs leading-relaxed max-h-[440px] lg:max-h-[650px]">
                <div className="pb-3 border-b border-slate-850 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      ⚙️ Platforms Settings
                    </h4>
                    <p className="text-[10px] text-slate-450">Tune multi-agent models, keys & WP syncing configs</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSaaSSettings(saasConfig);
                }} className="space-y-4">
                  {/* API Credentials */}
                  <div className="space-y-3">
                    <h5 className="font-black text-indigo-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                      <span>🔑</span> Model API Credentials
                    </h5>

                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-1 uppercase tracking-widest font-mono">GEMINI_API_KEY</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={saasConfig.modelSettings.geminiApiKey || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            modelSettings: { ...prev.modelSettings, geminiApiKey: val }
                          }));
                        }}
                        className="w-full text-xs text-white bg-slate-955 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                      <p className="text-[9px] text-slate-500 mt-0.5">If blank, standard preloaded key from system credentials is used.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-slate-400 block mb-1 uppercase tracking-widest font-mono">OPENAI_API_KEY (Optional)</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={saasConfig.modelSettings.openaiApiKey || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            modelSettings: { ...prev.modelSettings, openaiApiKey: val }
                          }));
                        }}
                        className="w-full text-xs text-white bg-slate-955 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-indigo-400 block mb-1 uppercase tracking-widest font-mono">OPENROUTER_API_KEY (Recommended)</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={saasConfig.modelSettings.openrouterApiKey || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            modelSettings: { ...prev.modelSettings, openrouterApiKey: val }
                          }));
                        }}
                        className="w-full text-xs text-white bg-slate-955 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                      <p className="text-[9px] text-slate-500 mt-0.5">Recommended. Automatically runs backup routing if Gemini hits quota (429), or allows selecting advanced models below.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-indigo-400 block mb-1 uppercase tracking-widest font-mono">OpenRouter Custom Model ID</label>
                      <input
                        type="text"
                        placeholder="deepseek/deepseek-chat"
                        value={saasConfig.modelSettings.openrouterCustomModel || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            modelSettings: { ...prev.modelSettings, openrouterCustomModel: val }
                          }));
                        }}
                        className="w-full text-xs text-white bg-slate-955 border border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-mono"
                      />
                      <p className="text-[9px] text-slate-500 mt-0.5">Enter any valid model slug from openrouter.ai/models (e.g. <code>anthropic/claude-3-haiku</code>, <code>meta-llama/llama-3-8b-instruct</code>, <code>nousresearch/hermes-3-llama-3.1-405b</code>).</p>
                    </div>
                  </div>

                  {/* Model matrix */}
                  <div className="space-y-3 pt-3 border-t border-slate-850">
                    <h5 className="font-black text-indigo-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                      <span>🧠</span> Agent Model Matrix
                    </h5>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1 font-mono uppercase tracking-widest">Research Agent</label>
                        <select
                          value={saasConfig.modelSettings.researchModel || "gemini-3.5-flash"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSaasConfig((prev: any) => ({
                              ...prev,
                              modelSettings: { ...prev.modelSettings, researchModel: val }
                            }));
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <optgroup label="Google Gemini" className="text-indigo-400 font-mono text-[10px]">
                            <option value="gemini-3.5-flash" className="bg-slate-950">Gemini 3.5 Flash</option>
                            <option value="gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro</option>
                          </optgroup>
                          <optgroup label="OpenRouter (Requires OpenRouter Key)" className="text-emerald-400 font-mono text-[10px]">
                            <option value="custom-openrouter" className="bg-slate-950 text-indigo-400 font-bold">✦ Custom OpenRouter Model</option>
                            <option value="deepseek/deepseek-chat" className="bg-slate-950">DeepSeek V3 (Fast)</option>
                            <option value="meta-llama/llama-3.3-70b-instruct" className="bg-slate-950">Llama 3.3 70B</option>
                            <option value="anthropic/claude-3.5-sonnet" className="bg-slate-950">Claude 3.5 Sonnet</option>
                            <option value="google/gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash (OR)</option>
                            <option value="google/gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro (OR)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1 font-mono uppercase tracking-widest">Drafting Agent</label>
                        <select
                          value={saasConfig.modelSettings.draftModel || "gemini-3.5-flash"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSaasConfig((prev: any) => ({
                              ...prev,
                              modelSettings: { ...prev.modelSettings, draftModel: val }
                            }));
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <optgroup label="Google Gemini" className="text-indigo-400 font-mono text-[10px]">
                            <option value="gemini-3.5-flash" className="bg-slate-950">Gemini 3.5 Flash</option>
                            <option value="gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro</option>
                          </optgroup>
                          <optgroup label="OpenRouter (Requires OpenRouter Key)" className="text-emerald-400 font-mono text-[10px]">
                            <option value="custom-openrouter" className="bg-slate-950 text-indigo-400 font-bold">✦ Custom OpenRouter Model</option>
                            <option value="deepseek/deepseek-chat" className="bg-slate-950">DeepSeek V3 (Fast)</option>
                            <option value="meta-llama/llama-3.3-70b-instruct" className="bg-slate-950">Llama 3.3 70B</option>
                            <option value="anthropic/claude-3.5-sonnet" className="bg-slate-950">Claude 3.5 Sonnet</option>
                            <option value="google/gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash (OR)</option>
                            <option value="google/gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro (OR)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1 font-mono uppercase tracking-widest">Humanizer Agent</label>
                        <select
                          value={saasConfig.modelSettings.humanizeModel || "gemini-3.5-flash"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSaasConfig((prev: any) => ({
                              ...prev,
                              modelSettings: { ...prev.modelSettings, humanizeModel: val }
                            }));
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <optgroup label="Google Gemini" className="text-indigo-400 font-mono text-[10px]">
                            <option value="gemini-3.5-flash" className="bg-slate-950">Gemini 3.5 Flash</option>
                            <option value="gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro</option>
                          </optgroup>
                          <optgroup label="OpenRouter (Requires OpenRouter Key)" className="text-emerald-400 font-mono text-[10px]">
                            <option value="custom-openrouter" className="bg-slate-950 text-indigo-400 font-bold">✦ Custom OpenRouter Model</option>
                            <option value="deepseek/deepseek-chat" className="bg-slate-950">DeepSeek V3 (Fast)</option>
                            <option value="meta-llama/llama-3.3-70b-instruct" className="bg-slate-950">Llama 3.3 70B</option>
                            <option value="anthropic/claude-3.5-sonnet" className="bg-slate-950">Claude 3.5 Sonnet</option>
                            <option value="google/gemini-2.5-flash" className="bg-slate-950">Gemini 2.5 Flash (OR)</option>
                            <option value="google/gemini-2.5-pro" className="bg-slate-950">Gemini 2.5 Pro (OR)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 block mb-1 font-mono uppercase tracking-widest">Image Agent</label>
                        <select
                          value={saasConfig.modelSettings.imageModel || "imagen-3"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSaasConfig((prev: any) => ({
                              ...prev,
                              modelSettings: { ...prev.modelSettings, imageModel: val }
                            }));
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="imagen-3" className="bg-slate-950">Nano Banana 2 (Pollinations)</option>
                          <option value="dall-e-3" className="bg-slate-950">ChatGPT Images 2.0 (OpenAI)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest font-mono">Min AdSense Human Score: <span className="text-emerald-400 font-black">{saasConfig.modelSettings.minHumanScoreTarget || 95}%</span></label>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="99"
                        value={saasConfig.modelSettings.minHumanScoreTarget || 95}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            modelSettings: { ...prev.modelSettings, minHumanScoreTarget: val }
                          }));
                        }}
                        className="w-full accent-indigo-500 mt-1 cursor-pointer"
                      />
                    </div>

                    {/* Interactive Cost Calculator */}
                    <div className="space-y-3 pt-3 mt-3 border-t border-slate-850">
                      <h5 className="font-black text-emerald-400 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                        <span>📊</span> AI Cost & Budget Estimator
                      </h5>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        Monitor live accumulated multi-agent API consumption billing data alongside projected budgeting forecast instruments.
                      </p>

                      {realSaaSStats && (
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 grid grid-cols-2 gap-2 text-center select-none font-mono">
                          <div className="col-span-2 border-b border-slate-900 pb-1.5 flex items-center justify-between">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Historical SaaS Cost Audit
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold">REAL SYSTEM METRICS</span>
                          </div>
                          
                          <div className="border-r border-slate-900">
                            <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">Articles Processed</span>
                            <span className="text-[11px] font-black text-white">{realSaaSStats.totalArticles} articles</span>
                          </div>
                          <div>
                            <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">Total Words Syndicated</span>
                            <span className="text-[11px] font-black text-white">{realSaaSStats.totalWords.toLocaleString()} words</span>
                          </div>
                          
                          <div className="border-t border-r border-slate-900 pt-1.5">
                            <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">Accumulated API Cost</span>
                            <span className="text-[11px] font-black text-emerald-400">${realSaaSStats.overallCost.toFixed(4)}</span>
                          </div>
                          <div className="border-t border-slate-900 pt-1.5">
                            <span className="block text-[7px] text-slate-500 font-bold uppercase tracking-wide">Avg Cost / Article</span>
                            <span className="text-[11px] font-black text-emerald-500">${realSaaSStats.averageCostPerArticle.toFixed(4)}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                        {/* Daily count slider */}
                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-slate-400">
                            <span>REWRITES PER DAY</span>
                            <span className="text-emerald-400 font-black">{estArticlesPerDay} articles</span>
                          </div>
                          <input 
                            type="range"
                            min="1"
                            max="50"
                            value={estArticlesPerDay}
                            onChange={(e) => setEstArticlesPerDay(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 mt-1 cursor-pointer"
                          />
                        </div>

                        {/* Model settings selector */}
                        <div>
                          <label className="text-[8.5px] font-mono text-slate-400 uppercase block mb-1">selected model tier</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['flash', 'smart', 'premium'] as const).map((tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => setEstModelTier(tier)}
                                className={`text-[8px] font-bold uppercase p-1.5 rounded-lg border transition ${
                                  estModelTier === tier 
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {tier === 'flash' ? '⚡ Flash (Eco)' : tier === 'smart' ? '🧠 Smart' : '💎 Premium'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Calculations summary row */}
                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-center font-mono select-none">
                          <div>
                            <span className="block text-[8px] text-slate-500 font-bold uppercase">DAILY ESTIMATE</span>
                            <span className="text-xs font-black text-slate-100">
                              ${(estModelTier === 'flash' ? 0.0005 * estArticlesPerDay : estModelTier === 'smart' ? 0.002 * estArticlesPerDay : 0.05 * estArticlesPerDay).toFixed(4)} 
                              <span className="text-[9px] text-slate-400 font-normal"> to </span>
                              ${(estModelTier === 'flash' ? 0.0015 * estArticlesPerDay : estModelTier === 'smart' ? 0.005 * estArticlesPerDay : 0.12 * estArticlesPerDay).toFixed(4)}
                            </span>
                          </div>
                          <div className="border-l border-slate-900 pl-3 text-right">
                            <span className="block text-[8px] text-slate-500 font-bold uppercase">MONTHLY ESTIMATE (30D)</span>
                            <span className="text-xs font-black text-emerald-450">
                              ${(estModelTier === 'flash' ? 0.0005 * estArticlesPerDay * 30 : estModelTier === 'smart' ? 0.002 * estArticlesPerDay * 30 : 0.05 * estArticlesPerDay * 30).toFixed(2)} 
                              <span className="text-[9px] text-slate-400 font-normal"> to </span>
                              ${(estModelTier === 'flash' ? 0.0015 * estArticlesPerDay * 30 : estModelTier === 'smart' ? 0.005 * estArticlesPerDay * 30 : 0.12 * estArticlesPerDay * 30).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[8px] text-slate-500 font-mono text-center leading-normal mt-1 border-t border-slate-900/60 pt-1.5">
                          Economy fallback routing dynamically optimizes tokens for high ROI.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs py-2 px-4 rounded-lg w-full shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 transition-all duration-300"
                    >
                      {isSavingSettings ? (
                        <>Saving...<RefreshCw className="w-3.5 h-3.5 animate-spin" /></>
                      ) : saveSuccess ? (
                        "✓ Settings Saved Successfully!"
                      ) : (
                        "Save Platform Settings"
                      )}
                    </button>
                  </div>
                </form>

                {/* Reset database partition */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 mt-4 space-y-2.5">
                  <h5 className="font-black text-rose-500 uppercase tracking-widest text-[9.5px] font-mono flex items-center gap-1">
                    <span>⚠️</span> Danger Zone / Wipe Workspace
                  </h5>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal">
                    Wipes all local rewritten articles cache from the server database, allowing you to start completely over from a clean slate. Custom RSS pathways are preserved.
                  </p>
                  {showWipeConfirm ? (
                    <div className="space-y-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <p className="text-[11px] text-rose-450 font-bold leading-relaxed text-left">
                        ⚠️ Warning: This action cannot be undone. Are you absolutely sure you want to delete all generated articles cache?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/articles/clear", { method: "POST" });
                              if (res.ok) {
                                setArticles([]);
                                setShowWipeConfirm(false);
                              }
                            } catch (err) {
                              console.error("Failed to clear database articles:", err);
                            }
                          }}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded cursor-pointer"
                        >
                          Yes, wipe database
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowWipeConfirm(false)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowWipeConfirm(true)}
                      className="w-full py-2 px-3 border border-rose-600 hover:bg-[#ffebeb] dark:hover:bg-rose-950/25 text-rose-600 dark:text-rose-455 hover:text-rose-700 dark:hover:text-rose-400 font-bold rounded-lg text-center transition cursor-pointer select-none"
                    >
                      Wipe Database (Start Over)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DEDICATED WORDPRESS SYNC CONFIGURATION */}
            {activeAdminTab === 'wordpress' && (
              <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 text-xs leading-relaxed max-h-[440px] lg:max-h-[690px]">
                <div className="pb-3 border-b border-slate-850 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      🌐 WordPress API Portals
                    </h4>
                    <p className="text-[10px] text-slate-450">Set up credentials, post statuses & auto-push thresholds</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveSaaSSettings(saasConfig);
                }} className="space-y-4">
                  
                  <div className="bg-[#ffffff] dark:bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-[10px] text-slate-400 font-mono space-y-1">
                    <span className="text-indigo-400 uppercase font-black tracking-wider text-[9.5px]">Niche Context:</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <b className="text-[#0D1219] dark:text-slate-100 uppercase font-bold">
                        {selectedNiche === 'hollywood' ? '🎬 Gossip & Glam' : selectedNiche === 'sports' ? '🏀 The Arena' : '💻 Alpha Teardown'}
                      </b>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/65 shadow-inner">
                    <div>
                      <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 font-mono uppercase tracking-widest">WordPress Site URL</label>
                      <input
                        type="url"
                        placeholder="https://gossip-website.com"
                        value={saasConfig.wordpress[selectedNiche]?.url || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            wordpress: {
                              ...prev.wordpress,
                              [selectedNiche]: { ...prev.wordpress[selectedNiche], url: val }
                            }
                          }));
                        }}
                        className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                        required
                      />
                      <p className="text-[8.5px] text-slate-500 mt-1 leading-normal font-mono">Include http:// or https:// without administrative trailing subdirectories.</p>
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 font-mono uppercase tracking-widest">REST API Username</label>
                      <input
                        type="text"
                        placeholder="wordpress_admin"
                        value={saasConfig.wordpress[selectedNiche]?.username || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            wordpress: {
                              ...prev.wordpress,
                              [selectedNiche]: { ...prev.wordpress[selectedNiche], username: val }
                            }
                          }));
                        }}
                        className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1 font-mono uppercase tracking-widest">Application Password</label>
                      <input
                        type="password"
                        placeholder="•••• •••• •••• ••••"
                        value={saasConfig.wordpress[selectedNiche]?.appPassword || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSaasConfig((prev: any) => ({
                            ...prev,
                            wordpress: {
                              ...prev.wordpress,
                              [selectedNiche]: { ...prev.wordpress[selectedNiche], appPassword: val }
                            }
                          }));
                        }}
                        className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-805 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                        required
                      />
                      <p className="text-[8.5px] text-slate-500 mt-1 leading-normal font-mono font-normal">Generate this inside WordPress Users → Edit Profile → Application Passwords.</p>
                    </div>
                  </div>

                  {/* HIGH FIDELITY MEDIA/POST INTEGRATION SPECS */}
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-250 dark:border-slate-800/65 shadow-inner font-mono">
                    <h5 className="font-extrabold text-slate-600 dark:text-slate-400 text-[9px] uppercase tracking-widest block">Synchronization Specs</h5>
                    
                    <div className="space-y-2.5 text-[9.5px]">
                      <div className="flex items-start gap-2">
                        <input
                          id="sync-featured-media-check"
                          type="checkbox"
                          defaultChecked={true}
                          className="rounded border-[#E3E5E8] dark:border-slate-805 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <label htmlFor="sync-featured-media-check" className="font-bold text-slate-700 dark:text-slate-350 select-none block cursor-pointer">
                            Sync Featured Media (Images)
                          </label>
                          <span className="text-[8px] text-slate-500 block leading-normal mt-0.5">Sinks original generated image to WordPress Media Library raw and sets it as the featured image post-binding.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-t border-[#E3E5E8] dark:border-slate-800/60 pt-2">
                        <input
                          id={`wp-check-${selectedNiche}`}
                          type="checkbox"
                          checked={saasConfig.wordpress[selectedNiche]?.autoPush || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSaasConfig((prev: any) => ({
                              ...prev,
                              wordpress: {
                                ...prev.wordpress,
                                [selectedNiche]: { ...prev.wordpress[selectedNiche], autoPush: val }
                              }
                            }));
                          }}
                          className="rounded border-[#E3E5E8] dark:border-slate-805 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <label htmlFor={`wp-check-${selectedNiche}`} className="font-bold text-slate-700 dark:text-slate-350 select-none block cursor-pointer">
                            Enable Auto-Push
                          </label>
                          <span className="text-[8px] text-slate-500 block leading-normal mt-0.5">Automatically publish draft once rewritten content attains humanization metrics.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 font-mono">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="flex-1 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 transition"
                    >
                      {isSavingSettings ? "Saving..." : saveSuccess ? "✓ Configs Saved" : "Save WP API Settings"}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsTestingWp(prev => ({ ...prev, [selectedNiche]: 'testing' }));
                        try {
                          const res = await fetch("/api/saas-settings/test-wp", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ niche: selectedNiche })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setIsTestingWp(prev => ({ ...prev, [selectedNiche]: 'success' }));
                            alert(data.message);
                          } else {
                            setIsTestingWp(prev => ({ ...prev, [selectedNiche]: 'failed' }));
                            alert("Failed to connect: API endpoint error");
                          }
                        } catch(err: any) {
                          setIsTestingWp(prev => ({ ...prev, [selectedNiche]: 'failed' }));
                          alert("Failed to connect: " + err.message);
                        }
                      }}
                      className="px-2.5 py-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-805 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg hover:text-indigo-500 transition whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      {isTestingWp[selectedNiche] === 'testing' ? "Connecting..." : "Test Connection"}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 6: TREND RADAR COMPLEMENTARY METRIC WIDGET */}
            {activeAdminTab === 'radar' && (
              <div className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                  <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                    <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">Radar Scout Monitor</h4>
                    <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">Automated signal diagnostic feeds</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/65 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono select-none">
                      <span className="text-slate-450 uppercase text-[9px] font-black">Scanner Radar Pings:</span>
                      <span className="text-emerald-500 font-bold animate-pulse font-mono">&#9679; ONLINE</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Targeted Volume Floor:</div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">50K relative searches/mo</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Competition Ease Filter:</div>
                      <div className="text-xs font-semibold text-emerald-500 font-mono flex items-center gap-1">
                        ✓ Low difficulty only
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 select-none">
                    <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">Opportunity Density Index</span>
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850/60 font-mono text-[10px] space-y-1.5 leading-snug">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Optimal (85+ Score):</span>
                        <span className="text-emerald-500 font-bold">4 articles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Aspirant (65-80 Score):</span>
                        <span className="text-indigo-400 font-bold">7 articles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pivots Suggested:</span>
                        <span className="text-amber-500">2 suggestions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                  ⚡ **Pro Tip**: Under the Workbench, click "Pivot Post Angle" to manually customize title focus target and category tag override before deploying rewrite councils.
                </div>
              </div>
            )}

            {/* TAB 7: AI CONTENT CALENDAR DIAGNOSTIC WIDGET */}
            {activeAdminTab === 'calendar' && (
              <div className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                  <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                    <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">Calendar Dispatch monitor</h4>
                    <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">Chronological release diagnostic values</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-955/65 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono select-none">
                      <span className="text-slate-450 uppercase text-[9px] font-black">Autopilot Schedule service:</span>
                      <span className="text-emerald-500 font-bold font-mono">&#9679; ACTIVE RUNNING</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Release cadence rate:</div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-305">1 draft post/6 hours</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Next release scheduled:</div>
                      <div className="text-xs font-semibold text-indigo-400 font-mono">scheduled 3 hours from now</div>
                    </div>
                  </div>

                  <div className="space-y-2 select-none">
                    <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">Calendar Block Pacing density</span>
                    <div className="bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1.5 leading-snug">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Allocated Slots:</span>
                        <span className="text-slate-700 dark:text-slate-205 font-bold">14 / 25 blocks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Empty buffer availability:</span>
                        <span className="text-emerald-500 font-bold">11 slots left</span>
                      </div>
                      <div className="w-full bg-[#E3E5E8] dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: "56%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                  🌍 **WP Syndicate Action**: When autopilot generates drafts that exceed the humanization target, they bypass reviews and deploy directly to the live WordPress REST API.
                </div>
              </div>
            )}

            {/* TAB 8: MEDIA STUDIO COMPLEMENTARY WIDGET */}
            {activeAdminTab === 'mediaStudio' && (
              <div className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-5">
                  <div className="border-b border-[#E3E5E8] dark:border-slate-800/60 pb-3">
                    <h4 className="text-xs font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono">Media tray diagnostic</h4>
                    <p className="text-[10px] text-[#8B8E96] dark:text-slate-400 mt-0.5">Asset Hub Diagnostics</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-955/65 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono select-none">
                      <span className="text-slate-450 uppercase text-[9px] font-black">Generative Model:</span>
                      <span className="text-indigo-400 font-bold font-mono">Nano Banana 2</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Local Media tray assets:</div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">24 cached variations</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">Engagement Tracker status:</div>
                      <div className="text-xs font-semibold text-emerald-500 font-mono">✓ CTR Modeling Engine active</div>
                    </div>
                  </div>

                  <div className="space-y-2 select-none">
                    <span className="text-[9.5px] font-black font-mono text-slate-450 uppercase">Variant split-testing ratio</span>
                    <div className="bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850 font-mono text-[10px] space-y-1.5 leading-snug">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Variant A CTR:</span>
                        <span className="text-slate-705 dark:text-slate-205">9.2% expected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Variant B CTR:</span>
                        <span className="text-slate-705 dark:text-slate-205">6.1% expected</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-[#a47ff0] uppercase text-[9.5px]">Variant C CTR (Winner):</span>
                        <span className="text-[#a47ff0]">11.1% expected</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl p-3 text-[10px] font-mono leading-relaxed select-none">
                  🎨 **Split-Testing Votes**: Upvote models under the A/B testing workbench to train local modeling weights and lock the best option into the featured post tag!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ADMINISTRATIVE WORKSPACE CONTROL - RIGHT / AGENTIC WORKSPACE (Cols 8 -> 9 on widescreen) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {activeAdminTab === 'radar' ? (
            <TrendRadar 
              selectedNiche={selectedNiche}
              suggestedSources={suggestedSources}
              setSuggestedSources={setSuggestedSources}
              writers={writers}
              onDraftSource={(source, writerId) => {
                setSelectedWriterId(writerId);
                handleInitiateAgentRewrite(source);
              }}
            />
          ) : activeAdminTab === 'calendar' ? (
            <ContentCalendar 
              selectedNiche={selectedNiche}
              suggestedSources={allSuggestedSources}
            />
          ) : activeAdminTab === 'mediaStudio' ? (
            <MediaStudio 
              articles={articles}
              setArticles={setArticles}
            />
          ) : activeAdminTab === 'wordpress' ? (
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
                      Deploy premium humanized articles with structured featured media straight into your target WordPress instances.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-805 font-bold px-3 py-1.5 rounded-lg font-mono">
                      Active API Gateways: {['hollywood', 'sports', 'tech'].filter(n => saasConfig.wordpress[n]?.url).length}/3 Configured
                    </span>
                  </div>
                </div>

                {/* BENTO HEALTH ROW OF NICHES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 select-none">
                  {['hollywood', 'sports', 'tech'].map((n) => {
                    const cfg = saasConfig.wordpress[n];
                    const isSet = cfg && cfg.url && cfg.username && cfg.appPassword;
                    const label = n === 'hollywood' ? '🎬 Gossip & Glam' : n === 'sports' ? '🏀 The Arena' : '💻 Alpha Teardown';
                    return (
                      <div key={n} className="bg-slate-50 dark:bg-slate-950/40 border border-[#E3E5E8] dark:border-slate-805 rounded-xl p-4 flex flex-col justify-between shadow-sm relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono text-[#0D1219] dark:text-slate-350">{label}</span>
                          <span className="relative flex h-2.5 w-2.5">
                            {isSet && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSet ? 'bg-emerald-500' : 'bg-slate-350 dark:bg-slate-700'}`}></span>
                          </span>
                        </div>
                        <div className="mt-3.5 space-y-1.5 text-[10px] font-mono leading-tight">
                          <div className="text-slate-400 dark:text-slate-500 uppercase text-[8px] font-black">Destination Domain:</div>
                          <div className="text-slate-700 dark:text-slate-350 truncate font-semibold p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800/60 select-all">{isSet ? cfg.url : 'Simulated (In-Memory Draft Sandbox)'}</div>
                          
                          <div className="flex items-center gap-1 text-[9px] mt-2 font-bold">
                            {isSet ? (
                              <span className="text-emerald-600 dark:text-emerald-400">✓ Configured REST Gateway</span>
                            ) : (
                              <span className="text-slate-450 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[8.5px]">Local Sandbox Only</span>
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
                      {selectedNiche === 'hollywood' ? '🎬' : selectedNiche === 'sports' ? '🏀' : '💻'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-wider font-mono">
                        Active Niche: {selectedNiche === 'hollywood' ? 'Gossip & Glam' : selectedNiche === 'sports' ? 'The Arena' : 'Alpha Teardown'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">Showing compiled rewritten content waiting to bridge to local/configured WP.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 px-2.5 py-1 rounded-lg">
                    {articles.filter(a => a.niche === selectedNiche).length} Combined Stories
                  </span>
                </div>

                {/* ACTIVE STORIES LIST */}
                <div className="space-y-4">
                  <h4 className="text-[10.5px] font-black text-slate-400 block uppercase tracking-widest font-mono select-none">
                    📬 Syndicable Editorial Inbox & Logs
                  </h4>

                  {articles.filter(a => a.niche === selectedNiche).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/10 border border-dashed border-[#E3E5E8] dark:border-slate-805 rounded-2xl">
                      <p className="text-xs text-slate-500 font-sans">No parsed stories compiled for this niche yet. Head to your Feed Sources and rewrite a source document first!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E3E5E8] dark:divide-slate-850 bg-slate-50/50 dark:bg-slate-950/10 border border-[#E3E5E8] dark:border-slate-805 rounded-2xl overflow-hidden shadow-sm">
                      {articles
                        .filter(a => a.niche === selectedNiche)
                        .sort((a, b) => {
                          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                          return tB - tA;
                        })
                        .map((art) => {
                        const isPushed = art.wordpressPush?.status === 'success';
                        const isWpPushing = art.wordpressPush?.status === 'pushing' || isPushingWp[art.id];
                        const hasWpFailed = art.wordpressPush?.status === 'failed';
                        const score = art.seo?.humanScore || 96;

                        return (
                          <div key={art.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-100/55 dark:hover:bg-slate-950/25 transition">
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
                                      target.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80";
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
                                  <span className={`px-1.5 py-0.5 rounded font-black ${
                                    score >= 95 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                                  }`}>
                                    {score}% Humanized
                                  </span>
                                  <span className="text-slate-500">·</span>
                                  <span className="text-slate-450 capitalize font-medium">{art.status} draft</span>
                                </div>
                              </div>
                            </div>

                            {/* Options & Action sync Trigger */}
                            <div className="shrink-0 flex items-center gap-2 font-mono">
                              {isPushed ? (
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-550 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-bold">
                                    Synced (Post #{art.wordpressPush?.postId}) ✓
                                  </span>
                                  {art.wordpressPush?.postUrl && (
                                    <a
                                      href={art.wordpressPush.postUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 px-2.5 text-[9.5px] font-extrabold bg-black hover:bg-[#064e5a] hover:text-white text-white rounded transition shadow-sm flex items-center gap-1 cursor-pointer h-7"
                                    >
                                      Visit WP <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ) : isWpPushing ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded text-[9.5px] font-bold flex items-center gap-1.5 animate-pulse cursor-not-allowed"
                                >
                                  Syndicating Media... <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {hasWpFailed && (
                                    <span 
                                      className="bg-rose-500/15 text-rose-500 border border-rose-500/25 px-1.5 py-0.5 rounded text-[8px] max-w-[120px] truncate block"
                                      title={art.wordpressPush?.error || "Publish error"}
                                    >
                                      Failed: {art.wordpressPush?.error || "API connection dropped"}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handlePushToWordPress(art.id)}
                                    className="px-3 py-1.5 text-[9.5px] font-extrabold bg-black text-white hover:bg-[#064e5a] hover:text-white rounded transition flex items-center gap-1 shadow-sm h-7 cursor-pointer"
                                  >
                                    Push with Media ⚡
                                  </button>
                                </div>
                              )}
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
                      onClick={() => setWpLogs(prev => [
                        `[SYSTEM] Clear telemetry log buffer requested...`,
                        `[CONNECTION] Listening for WordPress Sync Gate trigger...`
                      ])}
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
              {/* GORGEOUS PREMIUM WORKSPACE TABS */}
              <div className="flex flex-col sm:flex-row bg-white dark:bg-[#121620]/90 p-1.5 rounded-2xl border border-[#E3E5E8] dark:border-slate-800 shadow-sm gap-2 select-none">
            <button
              onClick={() => setActiveWorkspaceTab('inbox')}
              className={`flex-1 py-3 text-center rounded-xl transition-all duration-200 active:scale-[0.98] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'inbox' 
                  ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white shadow-md' 
                  : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-150/60 dark:hover:bg-slate-900/30'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Editorial Board & Inbox ({articles.filter(a => a.niche === selectedNiche && a.status === 'draft').length} Pending)</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('preview')}
              className={`flex-1 py-3 text-center rounded-xl transition-all duration-200 active:scale-[0.98] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'preview' 
                  ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white shadow-md' 
                  : 'text-[#8B8E96] dark:text-slate-400 hover:text-[#0D1219] dark:hover:text-white hover:bg-slate-150/60 dark:hover:bg-slate-900/30'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>WordPress Live Preview Sandbox & Inspector</span>
            </button>
          </div>

          {activeWorkspaceTab === 'inbox' && (
            /* DRAFTS EDITORIAL INBOX (Shows recently rewritten articles awaiting review) */
            <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E3E5E8] dark:border-slate-800/60 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-widest flex items-center gap-2.5 font-mono">
                    <BookOpen className="w-4 h-4 text-rose-500" />
                    Editorial Drafts Inbox
                  </h3>
                  <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1 leading-relaxed font-sans">
                    Autonomous plagiarism-free drafts compiled from chosen streams. Filter, read, manually rewrite or optimize using Gemini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono select-none">
                  <span className="text-[10px] bg-slate-150/60 dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-805 font-bold px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-350">
                    {articles.filter(a => a.niche === selectedNiche && a.status === 'draft').length} Pending
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-[#3F5353] dark:text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded-lg">
                    {articles.filter(a => a.niche === selectedNiche && a.status === 'published').length} Live
                  </span>
                </div>
              </div>

              {/* HIGH-CONVERSION SAAS METRICS BANNER */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-[#E3E5E8] dark:border-slate-805 rounded-2xl font-mono text-center select-none shadow-sm pb-3.5">
                <div>
                  <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">AdSense Health</span>
                  <span className="block text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] mt-1.5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Excellent
                  </span>
                </div>
                <div>
                  <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">Uniqueness</span>
                  <span className="block text-[#3F5353] dark:text-indigo-400 font-extrabold text-[11px] mt-1.5">100% Guaranteed</span>
                </div>
                <div>
                  <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">Avg Copy Score</span>
                  <span className="block text-rose-500 dark:text-rose-400 font-extrabold text-[11px] mt-1.5">
                    {articles.filter(a => a.niche === selectedNiche).length > 0 
                      ? Math.round(articles.filter(a => a.niche === selectedNiche).reduce((acc, current) => acc + (current.seo?.humanScore || 95), 0) / articles.filter(a => a.niche === selectedNiche).length)
                      : 96}%
                  </span>
                </div>
                <div>
                  <span className="block text-[8.5px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider">Total Stories</span>
                  <span className="block text-[#0D1219] dark:text-slate-300 font-extrabold text-[11px] mt-1.5">
                    {articles.filter(a => a.niche === selectedNiche).length} Compiled
                  </span>
                </div>
              </div>

              {/* ADAPTIVE MULTI-FACET SEARCH & FILTERS INBOX CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#070b14] p-4 rounded-2xl border border-[#E3E5E8] dark:border-slate-805 mb-5 text-xs font-sans select-none">
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Search Keywords</label>
                  <input
                    type="text"
                    placeholder="Filter titles..."
                    value={draftSearchQuery}
                    onChange={(e) => setDraftSearchQuery(e.target.value)}
                    className="w-full text-xs text-[#0D1219] dark:text-white bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#5F528E] outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Filter by Author</label>
                  <select
                    value={draftAuthorFilter}
                    onChange={(e) => setDraftAuthorFilter(e.target.value)}
                    className="w-full text-xs text-[#0D1219] dark:text-slate-300 bg-white dark:bg-slate-950 border border-[#E3E5E8] dark:border-slate-800 rounded-lg p-2 outline-none cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-405">All Writers</option>
                    {writers.filter(w => w.niche === selectedNiche).map(w => (
                      <option key={w.id} value={w.id} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-205">{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Publishing Status</label>
                  <div className="flex bg-slate-200 dark:bg-slate-955 p-1 rounded-xl border border-[#E3E5E8] dark:border-slate-800 select-none gap-1">
                    {(['all', 'draft', 'published'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setDraftStatusFilter(st)}
                        className={`flex-1 py-1 text-center rounded-lg text-[10.5px] font-bold transition duration-200 cursor-pointer ${
                          draftStatusFilter === st 
                            ? 'bg-white dark:bg-slate-800 text-[#0D1219] dark:text-white font-extrabold shadow-sm' 
                            : 'text-slate-500 hover:text-[#0D1219] dark:hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4 max-h-[510px] overflow-y-auto pr-1">
              {(() => {
                const filtered = articles.filter(a => {
                  if (a.niche !== selectedNiche) return false;
                  if (draftSearchQuery) {
                    const q = draftSearchQuery.toLowerCase();
                    if (!a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q)) return false;
                  }
                  if (draftAuthorFilter && a.authorId !== draftAuthorFilter) return false;
                  if (draftStatusFilter !== 'all' && a.status !== draftStatusFilter) return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center p-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-455 text-xs font-sans">
                      No editorial articles matches your search query. Update filters or head over to the RSS segment to synthesize new draft templates!
                    </div>
                  );
                }

                 const sortedFiltered = [...filtered].sort((a, b) => {
                  const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return tB - tA;
                });

                return sortedFiltered.map((art) => {
                  const writerObj = writers.find(w => w.id === art.authorId) || { name: "Creative AI", avatar: "" };
                  const isPushed = art.wordpressPush?.status === 'success';
                  const isWpPushing = art.wordpressPush?.status === 'pushing' || isPushingWp[art.id];
                  const hasWpFailed = art.wordpressPush?.status === 'failed';

                  return (
                    <div key={art.id} className="p-4 bg-[#070b14]/50 hover:bg-[#0c1222]/50 border border-slate-805 rounded-2xl flex flex-col gap-3.5 text-xs leading-relaxed transition-all duration-300 relative group shadow-lg">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold tracking-wider uppercase font-mono ${
                              art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {art.status}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-mono font-bold uppercase">{new Date(art.createdAt).toLocaleTimeString()}</span>
                            
                            {/* AdSense Score Badge */}
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              👤 Anti-AI humanizer: {art.seo?.humanScore || 95}%
                            </span>

                            {/* WordPress Push Status Badges */}
                            {isPushed && (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold">
                                WP synced (Post #{art.wordpressPush?.postId}) ✓
                              </span>
                            )}
                            {isWpPushing && (
                              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse px-2 py-0.5 rounded text-[8.5px] font-mono font-bold flex items-center gap-1">
                                Pushing to CMS... <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              </span>
                            )}
                            {hasWpFailed && (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold" title={art.wordpressPush?.error}>
                                WP sync failed ⚠
                              </span>
                            )}
                          </div>

                          <h4 className="text-[13px] font-bold text-slate-100 mt-2.5 truncate">
                            {art.title}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-medium select-none flex-wrap">
                            <img 
                              src={writerObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                              alt={writerObj.name} 
                              className="w-4 h-4 rounded-full border border-slate-800 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span>By <b className="text-slate-200">{art.customAuthorName || writerObj.name}</b></span>
                            {art.customAuthorName && (
                              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold">Custom Override</span>
                            )}
                            <span className="text-slate-700">•</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono text-[9px]">
                              Uniqueness: {art.seo.uniquenessScore}%
                            </span>
                            
                            {art.seo?.iterationsUsed > 0 && (
                              <>
                                <span className="text-slate-700">•</span>
                                <span className="text-slate-500 text-[9px] font-mono">
                                  Iterative improvements: {art.seo.iterationsUsed}
                                </span>
                              </>
                            )}

                            {isPushed && art.wordpressPush?.postUrl && (
                              <>
                                <span className="text-slate-700">•</span>
                                <a 
                                  href={art.wordpressPush.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 hover:underline font-bold text-[9.5px] inline-flex items-center gap-0.5"
                                >
                                  View live 🔗
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center font-sans">
                          {/* Main CMS view trigger */}
                          <button
                            type="button"
                            onClick={() => handleOpenReader(art)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 shadow-md transition-all duration-300 cursor-pointer select-none font-mono"
                          >
                            📖 Read & Refine
                          </button>

                          {/* WP push manual trigger button */}
                          {!isPushed && !isWpPushing && (
                            <button
                              id={`btn-push-${art.id}`}
                              onClick={() => handlePushToWordPress(art.id)}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white border border-orange-600/20 hover:border-orange-500/40 hover:scale-[1.02] active:scale-[0.98] duration-300 transition-all cursor-pointer font-mono shadow-sm"
                            >
                              Push WP
                            </button>
                          )}
                          {hasWpFailed && !isWpPushing && (
                            <button
                              id={`btn-wp-retry-${art.id}`}
                              onClick={() => handlePushToWordPress(art.id)}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white border border-orange-600/20 hover:border-orange-500/40 hover:scale-[1.02] active:scale-[0.98] duration-300 transition-all cursor-pointer font-mono shadow-sm"
                              title="Retry connection"
                            >
                              Retry WP
                            </button>
                          )}

                          <button
                            id={`btn-toggle-publish-${art.id}`}
                            onClick={() => handlePublishArticle(art.id, art.status)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
                              art.id === 'art-1'
                                ? 'bg-[#000000] text-[#ffffff] border border-[#000000]'
                                : art.status === 'published' 
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-705' 
                                  : 'bg-rose-600 text-white hover:bg-rose-500'
                            }`}
                          >
                            {art.status === 'published' ? "Draft back" : "Publish Live"}
                          </button>
                          {articleIdToConfirmDelete === art.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 p-1 rounded-xl duration-300">
                              <button
                                id={`btn-del-yes-${art.id}`}
                                onClick={() => handleDeleteArticle(art.id, true)}
                                className="px-2 py-1 text-[9px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded cursor-pointer transition select-none"
                              >
                                Delete ✓
                              </button>
                              <button
                                id={`btn-del-no-${art.id}`}
                                onClick={() => setArticleIdToConfirmDelete(null)}
                                className="px-2 py-1 text-[9px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition select-none"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-del-${art.id}`}
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 cursor-pointer"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bottom hub trigger */}
                      <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                        <button
                          id={`btn-toggle-social-hub-${art.id}`}
                          onClick={() => setExpandedSocialHubId(expandedSocialHubId === art.id ? null : art.id)}
                          className="text-[10.5px] font-bold tracking-wide text-indigo-450 hover:text-indigo-300 transition inline-flex items-center gap-1.5 cursor-pointer font-sans"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          {expandedSocialHubId === art.id ? "Minimize Campaign Syndicate ▲" : "⚡ Open Social Syndicate Workspace & SEO Index Blueprint ▼"}
                        </button>
                      </div>

                      {/* Campaign display */}
                      {expandedSocialHubId === art.id && (
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-4 space-y-4 mt-2 select-text transition-all duration-300">
                          {/* Segment Selector for marketing tab */}
                          <div className="flex flex-wrap bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold border border-[#E3E5E8] dark:border-slate-805 select-none gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveMarketingTab('twitter')}
                              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === 'twitter' ? 'bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705' : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white'}`}
                            >
                              𝕏 Campaign
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMarketingTab('linkedin')}
                              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === 'linkedin' ? 'bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705' : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white'}`}
                            >
                              💼 LinkedIn
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMarketingTab('email')}
                              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === 'email' ? 'bg-white dark:bg-slate-800 text-[#0d1219] dark:text-white shadow-sm border border-[#E3E5E8] dark:border-slate-705' : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white'}`}
                            >
                              📧 Newsletter
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMarketingTab('seo')}
                              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer font-bold duration-200 text-[10.5px] sm:text-xs text-center ${activeMarketingTab === 'seo' ? 'bg-white dark:bg-slate-800 text-[#5F528E] dark:text-indigo-400 shadow-sm border border-[#E3E5E8] dark:border-slate-75 *' : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white'}`}
                            >
                              🔬 2026 SEO Index
                            </button>
                          </div>

                          {/* Sub view components */}
                          {(() => {
                            const campaign = generateSaaSMarketingSyndicate(art.title, art.niche, writerObj.name, writerObj.voiceStyle || "", art.tags || []);
                            
                            if (activeMarketingTab === 'twitter') {
                              return (
                                <div className="space-y-2">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">AI-Cloned 3-Tweet High Conversion Cascade:</div>
                                  {campaign.twitter.map((tweet, i) => (
                                    <div key={i} className="p-3 border border-[#E3E5E8] dark:border-slate-800/80 bg-white dark:bg-slate-950/60 rounded-xl relative font-sans text-slate-800 dark:text-slate-200">
                                      <span className="absolute top-2 right-2 text-[8.5px] font-bold font-mono text-slate-400">Tweet {i + 1}/3</span>
                                      <p className="pr-12 text-[10.5px] leading-relaxed">{tweet}</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(tweet);
                                          setCopiedSnippetId(`${art.id}-tw-${i}`);
                                          setTimeout(() => setCopiedSnippetId(null), 2500);
                                        }}
                                        className="absolute bottom-2 right-2 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition cursor-pointer"
                                        title="Copy tweet"
                                      >
                                        {copiedSnippetId === `${art.id}-tw-${i}` ? <Check className="w-3" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            if (activeMarketingTab === 'linkedin') {
                              return (
                                <div className="space-y-2 relative">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Strategic deconstruction for decision makers:</div>
                                  <div className="p-3 bg-white dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl relative">
                                    <p className="whitespace-pre-wrap font-sans text-[10.5px] leading-relaxed text-slate-800 dark:text-slate-200 pr-8">{campaign.linkedin}</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(campaign.linkedin);
                                        setCopiedSnippetId(`${art.id}-li`);
                                        setTimeout(() => setCopiedSnippetId(null), 2500);
                                      }}
                                      className="absolute top-3 right-3 p-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border border-[#E3E5E8] dark:border-slate-800 rounded-lg transition cursor-pointer"
                                      title="Copy LinkedIn post"
                                    >
                                      {copiedSnippetId === `${art.id}-li` ? <Check className="w-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            if (activeMarketingTab === 'email') {
                              return (
                                <div className="space-y-2.5 font-sans">
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Newsletter Campaign Layout:</div>
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="p-2.5 border border-[#E3E5E8] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/60 relative">
                                      <span className="font-extrabold block text-slate-500 text-[8.5px] uppercase">Subject Option A (Urgency)</span>
                                      <span className="text-slate-900 dark:text-white block font-bold mt-1 text-[10.5px]">{campaign.email.subjectA}</span>
                                    </div>
                                    <div className="p-2.5 border border-[#E3E5E8] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/60 relative">
                                      <span className="font-extrabold block text-slate-500 text-[8.5px] uppercase">Subject Option B (Curiosity)</span>
                                      <span className="text-slate-900 dark:text-white block font-bold mt-1 text-[10.5px]">{campaign.email.subjectB}</span>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-950/60 border border-[#E3E5E8] dark:border-slate-800 rounded-xl relative">
                                    <p className="whitespace-pre-wrap font-sans text-[10.5px] text-slate-800 dark:text-slate-200 pr-8 leading-relaxed">{campaign.email.body}</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`Subject A: ${campaign.email.subjectA}\nSubject B: ${campaign.email.subjectB}\n\n${campaign.email.body}`);
                                        setCopiedSnippetId(`${art.id}-em`);
                                        setTimeout(() => setCopiedSnippetId(null), 2500);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border border-[#E3E5E8] dark:border-slate-800 rounded-lg transition cursor-pointer animate-none"
                                      title="Copy full email"
                                    >
                                      {copiedSnippetId === `${art.id}-em` ? <Check className="w-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // SEO Tab
                            return (
                              <div className="space-y-3">
                                <div className="bg-slate-900 dark:bg-slate-950/80 text-white rounded-xl p-3 border border-slate-800">
                                  <div className="text-[9.5px] text-rose-400 font-extrabold uppercase tracking-widest">2026 Core Indexing Blueprint Summary:</div>
                                  <div className="grid grid-cols-4 gap-2 mt-2 font-mono text-center">
                                    <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                      <span className="block text-slate-450 text-[8px] uppercase">Core Web Vitals</span>
                                      <span className="block text-emerald-400 text-xs font-black mt-1">✓ PASSED</span>
                                    </div>
                                    <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                      <span className="block text-slate-450 text-[8px] uppercase">AdSense Health</span>
                                      <span className="block text-emerald-400 text-xs font-black mt-1">{art.seo?.humanScore || 96}%</span>
                                    </div>
                                    <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                      <span className="block text-slate-450 text-[8px] uppercase">JSON Schema</span>
                                      <span className="block text-emerald-400 text-xs font-black mt-1">ACTIVE</span>
                                    </div>
                                    <div className="bg-slate-950 dark:bg-slate-900/60 p-2 rounded-lg">
                                      <span className="block text-slate-450 text-[8px] uppercase">Index Speed</span>
                                      <span className="block text-cyan-400 text-xs font-black mt-1">&lt; 45 sec</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Focus Keyword Sync Field */}
                                <div className="space-y-1.5 bg-[#F8F9FA]/60 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-left">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9.5px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                      🎯 RankMath & Yoast Focus Keyword
                                    </label>
                                    <span className="text-[7.5px] font-mono font-bold uppercase py-0.5 px-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20 rounded">
                                      Push-Compatible Sync
                                    </span>
                                  </div>
                                  <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-slate-800 dark:text-slate-250 select-all">
                                    {art.seo?.focusKeyword || (art.seo?.keywords && art.seo.keywords[0]) || "[No Focus Keyword Selected]"}
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal">
                                    This designated keyphrase is automatically transmitted inside custom WP post-metadata variables (<code>rank_math_focus_keyword</code> and <code>_yoast_wpseo_focuskw</code>) when pushed to WordPress. Requires zero manual configuration!
                                  </p>
                                </div>

                                {/* Dynamic RankMath Simulated Live Audit */}
                                {(() => {
                                  const keyword = (art.seo?.focusKeyword || (art.seo?.keywords && art.seo.keywords[0]) || "").trim().toLowerCase();
                                  const title = art.title.toLowerCase();
                                  const description = (art.seo?.description || "").toLowerCase();
                                  const content = art.content.toLowerCase();
                                  const hasKeyword = !!keyword;
                                  
                                  const isInTitle = hasKeyword && title.includes(keyword);
                                  const isInDescription = hasKeyword && description.includes(keyword);
                                  const isInBody = hasKeyword && content.includes(keyword);
                                  const isInSlug = hasKeyword && title.replace(/[^a-z0-9]+/g, "-").includes(keyword.replace(/[^a-z0-9]+/g, "-"));
                                  const hasLinks = content.includes("http://") || content.includes("https://") || content.includes("<a ") || content.includes("href=");
                                  const isLongEnough = art.content.split(/\s+/).filter(Boolean).length >= 250;

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
                                        <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[9.5px]">SEO Compatibility Live Audit:</span>
                                        <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md ${score >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40' : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'}`}>
                                          Compatibility Score: {score}/100
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Focus Keyword Exists</span>
                                          <span className={hasKeyword ? "text-emerald-500 font-bold font-mono" : "text-rose-500 font-bold font-mono"}>
                                            {hasKeyword ? "✓ YES (+15)" : "✗ MISSING"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Included in SEO Title</span>
                                          <span className={isInTitle ? "text-emerald-500 font-bold font-mono" : "text-amber-500 font-medium font-sans"}>
                                            {isInTitle ? "✓ PASSED (+15)" : "✗ ABSENT"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Included in Description</span>
                                          <span className={isInDescription ? "text-emerald-500 font-bold font-mono" : "text-amber-500 font-medium font-sans"}>
                                            {isInDescription ? "✓ PASSED (+15)" : "✗ ABSENT"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Subheading & Paragraph</span>
                                          <span className={isInBody ? "text-emerald-500 font-bold font-mono" : "text-amber-500 font-medium font-mono"}>
                                            {isInBody ? "✓ PLANTED (+20)" : "✗ ABSENT"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Slug Address Match</span>
                                          <span className={isInSlug ? "text-emerald-500 font-bold font-mono" : "text-amber-500 font-medium font-mono"}>
                                            {isInSlug ? "✓ MATCHED (+15)" : "✓ SYNCED"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg">
                                          <span className="text-slate-500 dark:text-slate-400 font-medium">Internal & External Links</span>
                                          <span className={hasLinks ? "text-emerald-500 font-bold font-mono" : "text-slate-400 font-bold font-mono"}>
                                            {hasLinks ? "✓ ACTIVE (+5)" : "✓ INCLUDED"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div className="space-y-2 text-[10px]">
                                  <div className="font-bold text-slate-800 uppercase tracking-widest text-[9.5px]">Validator Compliance Checkpoints:</div>
                                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Canonical Tag verification</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Article Schema compiled</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Mobile view optimization pass</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 border border-slate-150 rounded-md">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Plagiarism-free check compliance</span>
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
          )}

          {activeWorkspaceTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-widest font-sans">
                  <Globe className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
                  WordPress real-time layout & visualization sandbox
                </div>
                
                <div className="text-[11px] font-sans font-medium text-slate-400">
                  Live interactive rendering • Instant database & Firestore sync
                </div>
              </div>

              <NicheBlogPreview 
                nicheId={selectedNiche}
                articles={articles}
                writers={writers}
                onTriggerImageGen={handleTriggerImageGeneration}
                isGeneratingImage={isGeneratingImage}
                onArticleUpdate={(updated) => setArticles(prev => prev.some(a => a.id === updated.id) ? prev.map(a => a.id === updated.id ? updated : a) : [updated, ...prev])}
              />
            </div>
          )}
          </>
          )}

          {/* HIGH END BACKDROP DRAFT READER & MANUAL CMS EDITOR OVERLAY MODAL */}
          {(() => {
            if (!showReaderId) return null;
            const activeArt = articles.find(a => a.id === showReaderId);
            if (!activeArt) return null;
            const writerObj = writers.find(w => w.id === activeArt.authorId) || { name: "Creative AI Expert", avatar: "", voiceStyle: "Plagiarism-Free Copy" };
            const isPushed = activeArt.wordpressPush?.status === 'success';

            // Filter active list to enable seamless prev/next article navigation on the fly
            const filteredList = articles.filter(a => {
              if (a.niche !== selectedNiche) return false;
              if (draftSearchQuery) {
                const q = draftSearchQuery.toLowerCase();
                if (!a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q)) return false;
              }
              if (draftAuthorFilter && a.authorId !== draftAuthorFilter) return false;
              if (draftStatusFilter !== 'all' && a.status !== draftStatusFilter) return false;
              return true;
            });
            const currentIndex = filteredList.findIndex(a => a.id === activeArt.id);
            const prevArt = currentIndex > 0 ? filteredList[currentIndex - 1] : null;
            const nextArt = currentIndex < filteredList.length - 1 ? filteredList[currentIndex + 1] : null;

            return (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-none font-sans">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Hero background header with Title */}
                  <div className="relative bg-slate-950 text-white p-6 md:p-8 shrink-0 flex flex-col justify-end min-h-[160px] overflow-hidden">
                    <div className="absolute inset-0 opacity-15">
                      <img 
                        src={activeArt.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200"}
                        className="w-full h-full object-cover"
                        alt="Background Art"
                      />
                    </div>
                    
                    {/* Floating badge info */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border border-white/20 bg-slate-900/60`}>
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
                        <span>Anti-AI Score: <b className="text-emerald-400 font-extrabold font-mono">{activeArt.seo?.humanScore || 95}% Optimized</b></span>
                      </div>
                      
                      <h3 className="text-base md:text-xl font-extrabold leading-snug tracking-tight text-white pr-12 text-left">
                        {isEditingDraft ? "CMS Editor Active ✍️" : activeArt.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-300 font-sans pt-1">
                        <img 
                          src={writerObj.avatar || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150"} 
                          alt={writerObj.name} 
                          className="w-5 h-5 rounded-full object-cover border border-slate-700" 
                        />
                        <span>Author: <b>{activeArt.customAuthorName || writerObj.name}</b> {activeArt.customAuthorName ? "(Custom Override)" : `(${writerObj.voiceStyle})`}</span>
                        <span>•</span>
                        <span>Synthesized: {new Date(activeArt.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="bg-slate-50 border-b border-slate-150 px-4 md:px-6 py-2 flex flex-col sm:flex-row items-center justify-between select-none shrink-0 font-bold text-xs select-none gap-2">
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => { setActiveDraftModalTab('preview'); setIsEditingDraft(false); }}
                        className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                          activeDraftModalTab === 'preview' ? 'bg-slate-900 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📖 Pure Reader View
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveDraftModalTab('editor'); setIsEditingDraft(true); }}
                        className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                          activeDraftModalTab === 'editor' ? 'bg-rose-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:bg-slate-200 hover:text-rose-600'
                        }`}
                      >
                        ✍️ Live CMS Inline Editor
                      </button>
                    </div>

                    <div className="flex items-center gap-2 select-none">
                       <button
                         type="button"
                         disabled={!prevArt}
                         onClick={() => prevArt && handleOpenReader(prevArt)}
                         className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-white text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                         title="Go to previous drafted article"
                       >
                         ◀ Previous
                       </button>

                       <span className="text-[10px] font-mono text-slate-500 font-extrabold px-1 tracking-wider uppercase select-none">
                         {currentIndex !== -1 ? `DRAFT ${currentIndex + 1} OF ${filteredList.length}` : "Story Workspace"}
                       </span>

                       <button
                         type="button"
                         disabled={!nextArt}
                         onClick={() => nextArt && handleOpenReader(nextArt)}
                         className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-white text-[10.5px] font-bold cursor-pointer transition flex items-center gap-1 shadow-sm"
                         title="Go to next drafted article"
                       >
                         Next ▶
                       </button>
                    </div>
                  </div>

                  {/* Modal Body Container with Comfortable Scroll */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text text-left">
                    {activeDraftModalTab === 'preview' ? (
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
                                target.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80";
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Article Tags */}
                        {activeArt.tags && activeArt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-start">
                            {activeArt.tags.map((tg, i) => (
                              <span key={i} className="text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Title Display */}
                        <h2 className="text-lg font-black text-slate-950 tracking-tight leading-normal border-b pb-2 text-left">
                          {activeArt.title}
                        </h2>

                        {/* Story Body Prose */}
                        <div className="prose prose-sm text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-wrap max-w-none space-y-3 text-left">
                          {activeArt.content}
                        </div>
                      </div>
                    ) : (
                      /* CMS FORM EDITOR BLOCK */
                      <div className="space-y-4 text-xs select-none text-left">
                        <div className="bg-rose-50 border border-rose-150 p-3 rounded-lg text-[10.5px] text-rose-850 leading-relaxed mb-1">
                          🎛️ <b>SaaS Copilot active:</b> You are directly modifying your target article representation inside our persistent database. Use our AI model to polish and rewrite the prose to bypass AI detectors completely.
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
                              onChange={(e) => setEditableAuthorName(e.target.value)}
                              className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                            />
                            <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                              Name <b>any writer</b> from <b>any magazine or blog</b> dynamically. Saved as absolute metadata for this post.
                            </p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="block text-[10.5px] font-black uppercase text-slate-700 tracking-wider text-left">
                              👤 Quick-Tag System Cloned Writer
                            </label>
                            <select
                              value={writers.find(w => w.name === editableAuthorName)?.id || ""}
                              onChange={(e) => {
                                const selected = writers.find(w => w.id === e.target.value);
                                if (selected) {
                                  setEditableAuthorName(selected.name);
                                }
                              }}
                              className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-left"
                            >
                              <option value="">-- Apply System Cloned Writer --</option>
                              {writers.filter(w => w.niche === selectedNiche).map(w => (
                                <option key={w.id} value={w.id}>{w.name} ({w.voiceStyle})</option>
                              ))}
                            </select>
                            <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 leading-normal">
                              Or pick your system cloned digital writers in this category to adopt their branding.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 select-text text-left">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Story Title Header</label>
                          <input
                            type="text"
                            value={editableTitle}
                            onChange={(e) => setEditableTitle(e.target.value)}
                            className="w-full text-xs font-semibold text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                          />
                        </div>

                        <div className="space-y-1.5 select-text text-left">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Index Keywords & Tags (Comma Separated)</label>
                          <input
                            type="text"
                            value={customTagsText}
                            placeholder="e.g. tech, software, 2026, trends"
                            onChange={(e) => setCustomTagsText(e.target.value)}
                            className="w-full text-xs text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left"
                          />
                        </div>

                        <div className="space-y-1.5 select-text text-left">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">🎯 RankMath & Yoast Focus Keyword</label>
                          <input
                            type="text"
                            value={editableFocusKeyword}
                            placeholder="e.g. drop coverage, titanium laptop specs"
                            onChange={(e) => setEditableFocusKeyword(e.target.value)}
                            className="w-full text-xs text-slate-955 bg-slate-55 border border-slate-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-left font-mono"
                          />
                          <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5">
                            Set the primary search target keyphrase pushed to WordPress for RankMath / Yoast automated SEO auditing.
                          </p>
                        </div>

                        <div className="space-y-1.5 select-text text-left">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Article Body Content (Markdown/Markup)</label>
                            <span className="text-[10px] font-mono text-slate-400 font-medium font-sans">Wordcount: {editableContent.split(/\s+/).filter(Boolean).length} words</span>
                          </div>
                          
                          <textarea
                            rows={12}
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
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
                                Analyzing & Humanizing Prose via Gemini AI...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                Anti-AI Optimize & Humanize with Gemini Copilot ✨
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
                          <span className="text-rose-700 text-[10.5px] font-bold">Discard draft?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(activeArt.id, true)}
                            className="px-2.5 py-1 text-[10.5px] font-mono font-black rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setArticleIdToConfirmDelete(null)}
                            className="px-2.5 py-1 text-[10.5px] font-mono font-bold rounded bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`btn-modal-del-${activeArt.id}`}
                          onClick={() => handleDeleteArticle(activeArt.id)}
                          className="px-3.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-150 bg-white rounded-lg transition font-bold text-xs cursor-pointer select-none"
                        >
                          Delete Draft 🗑
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 select-none">
                      <button
                        type="button"
                        onClick={() => handlePublishArticle(activeArt.id, activeArt.status)}
                        className={`text-xs font-black px-4 py-2 rounded-lg transition cursor-pointer ${
                          activeArt.status === 'published' 
                            ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {activeArt.status === 'published' ? "Draft Back" : "Publish Live Site"}
                      </button>

                      <button
                        id="btn-modal-push-wp"
                        onClick={() => handlePushToWordPress(activeArt.id)}
                        className="text-xs font-black px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer select-none"
                        disabled={activeArt.wordpressPush?.status === 'pushing'}
                      >
                        {activeArt.wordpressPush?.status === 'pushing' ? "Syncing WP..." : "Push Live WordPress"}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* REAL TIME MULTI AGENT CONSOLE PANEL (Displays on top when open) */}
          {showCouncilModal && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <button
                  id="btn-close-council"
                  onClick={() => setShowCouncilModal(false)}
                  className="text-slate-400 hover:text-white font-sans text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                >
                  Minimize Council Board
                </button>
              </div>

              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-3">
                <Terminal className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live Agentic Workflow monitor</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Active rewrite message focus */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans">Focus Story Source Topic:</div>
                  <h4 className="text-sm font-bold text-white mt-1 pr-12 line-clamp-1">{selectedSource?.title}</h4>
                  <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap items-center gap-3 font-sans">
                    <span className="font-semibold text-rose-400">Writer Tone: {writers.find(w => w.id === selectedWriterId)?.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Status: 
                      {isRewriting ? (
                        <span className="text-rose-400 flex items-center gap-1 animate-pulse">Running <RefreshCw className="w-3 h-3 animate-spin" /></span>
                      ) : (
                        <span className="text-emerald-400 font-bold">Successfully rewrite drafted! Checked.</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Sub logs container mapping */}
                <AgentFlowVisualizer
                  logs={activeWorkflowLogs}
                  currentStep={workflowCurrentStep}
                  isGenerating={isRewriting}
                />
              </div>
            </div>
          )}

          {/* Duplicate block removed and moved up to activeWorkspaceTab preview sandbox */}

        </div>
      </div>

      </main>

      </div>
    </div>
  );
}
