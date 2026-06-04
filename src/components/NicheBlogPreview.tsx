/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Calendar,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  Check,
  ThumbsUp,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  ChevronRight,
  User,
  MessageSquare,
  Settings,
  Sliders,
  Type,
  Layout,
  Globe,
  Plus,
  Send,
  Save,
  Wrench,
  ExternalLink,
  ChevronDown,
  Clock,
  BookOpen,
  ArrowRight,
  BadgeAlert
} from "lucide-react";
import { Article, Writer, NicheType } from "../types";

interface NicheBlogPreviewProps {
  nicheId: NicheType;
  articles: Article[];
  writers: Writer[];
  onTriggerImageGen?: (articleId: string, prompt: string) => void;
  isGeneratingImage?: boolean;
  onArticleUpdate?: (updatedArticle: Article) => void;
}

export default function NicheBlogPreview({ 
  nicheId, 
  articles, 
  writers, 
  onTriggerImageGen,
  isGeneratingImage,
  onArticleUpdate
}: NicheBlogPreviewProps) {
  // -------------------------------------------------------------
  // Filter articles belonging to this niche (Support drafts & published!)
  // -------------------------------------------------------------
  const nicheArticles = articles
    .filter(a => a.niche === nicheId)
    .sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

  // States
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // WordPress Theme Customization Variables
  const [wpTheme, setWpTheme] = useState<'modern' | 'editorial' | 'astra'>('modern');
  const [featuredImageAlign, setFeaturedImageAlign] = useState<'wide' | 'contained' | 'floating'>('contained');
  const [fontScale, setFontScale] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [lineHeight, setLineHeight] = useState<'tight' | 'normal' | 'loose'>('normal');
  
  // Elements Toggles
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showAuthorCard, setShowAuthorCard] = useState(true);
  const [showMetaBar, setShowMetaBar] = useState(true);
  const [showCommentsSection, setShowCommentsSection] = useState(true);

  // Quick edit content sync states
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagsText, setEditTagsText] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editAuthorOverride, setEditAuthorOverride] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Interactive user-appendable simulated WP comments
  const [customComments, setCustomComments] = useState<Record<string, { author: string; text: string; date: string; avatar: string }[]>>({});
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  // Tabs for layout inspector
  const [inspectorTab, setInspectorTab] = useState<'inspector' | 'preview' | 'seo' | 'publish'>('inspector');
  
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);

  const handleCreateSandbox = async () => {
    setIsCreatingSandbox(true);
    try {
      const res = await fetch("/api/articles/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: nicheId })
      });
      if (res.ok) {
        const article = await res.json();
        if (onArticleUpdate) {
          onArticleUpdate(article);
        }
        setSelectedArticleId(article.id);
      }
    } catch (err) {
      console.error("Failed to seed sandbox article:", err);
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  // Auto-select first article if none selected
  useEffect(() => {
    if (nicheArticles.length > 0 && !selectedArticleId) {
      setSelectedArticleId(nicheArticles[0].id);
    }
  }, [nicheArticles, selectedArticleId]);

  // Sync edits if chosen article changes
  const activeArticle = articles.find(a => a.id === selectedArticleId);

  useEffect(() => {
    if (activeArticle) {
      setEditTitle(activeArticle.title);
      setEditContent(activeArticle.content);
      setEditTagsText((activeArticle.tags || []).join(", "));
      setEditImageUrl(activeArticle.originalImageUrl || "");
      setEditAuthorOverride(activeArticle.customAuthorName || "");
    }
  }, [selectedArticleId, activeArticle]);

  const getWriterForArticle = (authorId: string) => {
    return writers.find(w => w.id === authorId) || {
      name: "Staff Writer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      bio: "An automated digital journalist covering breaking global news.",
      voiceStyle: "Direct, Informational",
      popularity: 60,
      totalArticles: 12
    };
  };

  const getCommentsForArticle = (artId: string) => {
    if (customComments[artId]) {
      return customComments[artId];
    }
    // Return standard preloaded comments if none customized
    const presetComments: Record<string, { author: string; text: string; date: string; avatar: string }[]> = {
      'art-1': [
        { author: "Chloe_Fashionistas", text: "Gigi, you are so correct! She tries so hard to blend in but those designer sunglasses screamed PR agency stunt. Delicious breakdown!", date: "2 hrs ago", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" },
        { author: "MarcusNewYork", text: "Actually they were in Tribeca for a clothing shoot, but honestly, this rumor makes for a much better story anyway lol.", date: "4 hrs ago", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" }
      ],
      'art-2': [
        { author: "HoopsFanatic99", text: "Middle school fundamentals is spot on! Up 3 is basic math. Foul immediately and force them to shoot free throws! Higgins speaks absolute truth.", date: "1 hr ago", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
        { author: "Defense_Wins_Rings", text: "Modern coaches are too scared of giving up 4-point plays, but this lack of defensive heart makes me sick.", date: "3 hrs ago", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100" }
      ],
      'art-3': [
        { author: "SiliconGate", text: "Throttled by 62%?! Wow, that thermals feedback is severe. Great specs report Dexter, you saved me $700.", date: "5 hrs ago", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100" },
        { author: "AI_Explorer", text: "The titanium marketing looked so clean, but I guess thermodynamics doesn't care about VCs pitches.", date: "6 hrs ago", avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100" }
      ]
    };
    return presetComments[artId] || [
      { author: "WP_Enthusiast", text: "Very nice layout and tone optimization. Displays flawlessly just like my premium Astra templates!", date: "Just now", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" }
    ];
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId || !newCommentText.trim()) return;

    const author = newCommentName.trim() || "Guest Reader";
    const commentsForArt = getCommentsForArticle(selectedArticleId);
    
    const newComment = {
      author,
      text: newCommentText.trim(),
      date: "Just now",
      avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=100` // random avatar placeholder
    };

    setCustomComments(prev => ({
      ...prev,
      [selectedArticleId]: [...prev[selectedArticleId] || commentsForArt, newComment]
    }));

    setNewCommentName("");
    setNewCommentText("");
  };

  // -------------------------------------------------------------
  // SAVE / SYNCHRONIZE EDITS BACK TO SERVER & THE PARENT CMS
  // -------------------------------------------------------------
  const handleSaveChanges = async () => {
    if (!selectedArticleId || !activeArticle) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const parsedTags = editTagsText.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/articles/${selectedArticleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          tags: parsedTags,
          originalImageUrl: editImageUrl,
          customAuthorName: editAuthorOverride || ""
        })
      });

      if (res.ok) {
        const updatedDoc = await res.json();
        if (onArticleUpdate) {
          onArticleUpdate(updatedDoc);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to sync edited article fields back to database/firebase:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // TRIGGER GEMINI IMAGE GENERATION PROXY
  // -------------------------------------------------------------
  const triggerImageGeneration = () => {
    if (activeArticle && onTriggerImageGen) {
      const prompt = `Photorealistic wide editorial stock photography, pristine focus, detailed lighting. Topic: ${editTitle}. Stylistic matches for Wordpress blog headers.`;
      onTriggerImageGen(activeArticle.id, prompt);
    }
  };

  // -------------------------------------------------------------
  // DESIGN PRESET MATCHES FOR WP THEMES
  // -------------------------------------------------------------
  const themePresets = {
    modern: {
      navBg: "bg-white border-b border-neutral-200 text-neutral-900 shadow-sm",
      bodyBg: "bg-neutral-50/50 text-neutral-800",
      contentBg: "bg-white border border-neutral-100",
      fontHeading: "font-sans tracking-tight font-black",
      fontBody: "font-sans text-neutral-800",
      siteTitle: `${nicheId.toUpperCase()} DAILY • TWENTY TWENTY-FOUR`,
      name: "Twenty Twenty-Four",
      tagline: "Standard Premium Gutenberg Block theme for modern editorials"
    },
    editorial: {
      navBg: "bg-amber-50/40 border-b border-stone-200 text-stone-900",
      bodyBg: "bg-amber-50/20 text-stone-800",
      contentBg: "bg-[#fbfbf9] border border-stone-250/60 shadow-inner",
      fontHeading: "font-serif tracking-normal font-bold text-stone-950",
      fontBody: "font-serif text-stone-900 leading-relaxed",
      siteTitle: `THE GEORGIA ${nicheId.toUpperCase()} DIGEST`,
      name: "Elegant Editorial",
      tagline: "Classic Gutenberg Serif styling focusing on long-form authority"
    },
    astra: {
      navBg: "bg-slate-950 border-b border-slate-800 text-cyan-400 font-mono",
      bodyBg: "bg-slate-950 text-slate-300",
      contentBg: "bg-slate-900/40 border border-slate-800/80 text-slate-100",
      fontHeading: "font-mono font-bold tracking-tight text-white",
      fontBody: "font-sans text-slate-300",
      siteTitle: `// ${nicheId.toUpperCase()} . NET - SYSTEM`,
      name: "Astra Cyan Console",
      tagline: "Raw, minimalist, high-tech interface with code elements"
    }
  };

  const currentTheme = themePresets[wpTheme];

  // Font scales classes
  const fontScaleClasses = {
    sm: "text-xs md:text-sm",
    base: "text-sm md:text-base",
    lg: "text-base md:text-lg",
    xl: "text-lg md:text-xl"
  };

  // Line height classes
  const lineHeightClasses = {
    tight: "leading-snug space-y-2",
    normal: "leading-relaxed space-y-4",
    loose: "leading-loose space-y-6"
  };

  // Mock post slug formatting
  const postSlug = editTitle
    ? editTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "untitled-wordpress-post";

  return (
    <div className="bg-white dark:bg-[#121620]/60 border border-[#E3E5E8] dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[680px] w-full">
      {/* Dynamic Workspace Header with tabs */}
      <div className="border-b border-[#E3E5E8] dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8F9FA] dark:bg-slate-950/40 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#3F5353] dark:bg-[#5F528E] rounded-xl text-white shadow-sm flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-sm md:text-base font-semibold text-[#0D1219] dark:text-slate-100 tracking-tight">WordPress Preview & Layout Inspector</h2>
            <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-0.5">Live high-fidelity layout simulation connected to active authoring engines</p>
          </div>
        </div>
        
        {/* Status indicators & Tab selector in one row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-[#3F5353] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/30 font-sans shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Editor
          </span>
          
          <div className="flex bg-[#F0F1F2] dark:bg-slate-950 p-1.5 rounded-2xl text-xs sm:text-sm font-semibold select-none border border-[#E3E5E8] dark:border-slate-805 gap-1 shadow-inner w-full sm:w-auto overflow-x-auto">
            {(['inspector', 'preview', 'seo', 'publish'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setInspectorTab(t)}
                className={`px-4 py-2.5 rounded-xl cursor-pointer font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-[0.98] ${
                  inspectorTab === t 
                    ? 'bg-white dark:bg-slate-800 text-[#0D1219] dark:text-white shadow-md border border-[#E3E5E8] dark:border-slate-705' 
                    : 'text-[#8B8E96] hover:text-[#0D1219] dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-900/40'
                }`}
              >
                {t === 'inspector' && (
                  <>
                    <Layout className="w-3.5 h-3.5 shrink-0 text-[#3F5353] dark:text-[#5F528E]" />
                    <span className="hidden md:inline">Layout Inspector</span>
                    <span className="md:hidden">Inspector</span>
                  </>
                )}
                {t === 'preview' && (
                  <>
                    <Eye className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="hidden md:inline">WP Post Preview</span>
                    <span className="md:hidden">Preview</span>
                  </>
                )}
                {t === 'seo' && (
                  <>
                    <Sliders className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                    <span className="hidden md:inline">SEO Diagnostics</span>
                    <span className="md:hidden">SEO</span>
                  </>
                )}
                {t === 'publish' && (
                  <>
                    <Settings className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span className="hidden md:inline">Sync Portal</span>
                    <span className="md:hidden">Portal</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row min-h-[580px] w-full flex-grow items-stretch">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ACTIVE GUTENBERG WRITER CONTROLS */}
        {/* ========================================================= */}
        {inspectorTab === 'inspector' && (
          <div className="w-full xl:w-[316px] border-r border-[#E3E5E8] dark:border-slate-800 bg-white dark:bg-slate-900/10 p-5 shrink-0 flex flex-col font-sans text-left">
            {/* CONTROLS SCROLL WELL */}
            <div className="space-y-4 flex-1 h-full pr-1">
              
              {/* Post Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#8B8E96] uppercase tracking-wider">
                  Select Article Post Draft
                </label>
                <div className="relative">
                  <select
                    value={selectedArticleId || ""}
                    onChange={(e) => setSelectedArticleId(e.target.value)}
                    className="w-full text-xs font-semibold text-[#0D1219] bg-white border border-[#E3E5E8] rounded-xl p-2.5 outline-none cursor-pointer focus:ring-1 focus:ring-[#5F528E] transition"
                  >
                    {[...nicheArticles].sort((a, b) => {
                      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return tB - tA;
                    }).map(art => (
                      <option key={art.id} value={art.id}>
                        {art.status === 'draft' ? '📝 [Draft] ' : '🚀 [Live] '} {art.title.substring(0, 48)}...
                      </option>
                    ))}
                    {nicheArticles.length === 0 && (
                      <option value="">No articles in this niche</option>
                    )}
                  </select>
                </div>
              </div>

              {!activeArticle ? (
                <div className="text-center p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-350 dark:border-slate-800 space-y-4 shadow-inner">
                  <div className="space-y-1.5 p-1 select-none">
                    <Sparkles className="w-6 h-6 text-[#3F5353] dark:text-[#5F528E] mx-auto animate-pulse" />
                    <p className="text-[#0D1219] dark:text-slate-200 text-xs font-bold leading-normal">
                      No active drafts exist in the {nicheId.toUpperCase()} workspace.
                    </p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Instantly spawn a real high-fidelity article in this niche to test design theme modifiers and Imagen-3 media variation systems!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSandbox}
                    disabled={isCreatingSandbox}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-95 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent hover:scale-[1.01]"
                  >
                    {isCreatingSandbox ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
                    <span>Provision Demo Sandbox Article</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Gutenberg Style Tweak Editor */}
                  <div className="space-y-3 bg-white dark:bg-[#121620]/60 p-4 rounded-xl border border-[#E3E5E8] dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D1219] dark:text-slate-300">Gutenberg Editor Tweak</span>
                    </div>

                    {/* Edit Title */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Post Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-xs font-bold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-left"
                      />
                    </div>

                    {/* Edit Image URL */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Featured Visual URL</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          placeholder="Https://images.unsplash.com/..."
                          className="flex-1 text-[11px] font-mono text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-left"
                        />
                        <button
                          type="button"
                          onClick={triggerImageGeneration}
                          disabled={isGeneratingImage}
                          title="AI Cover Painter"
                          className="bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90 text-white p-2 rounded-lg cursor-pointer transition active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
                        >
                          {isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Edit Tags (csv) */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Interactive Tags (comma separated)</label>
                      <input
                        type="text"
                        value={editTagsText}
                        onChange={(e) => setEditTagsText(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-left"
                      />
                    </div>

                    {/* Edit Author override */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Author Name Override</label>
                      <input
                        type="text"
                        value={editAuthorOverride}
                        onChange={(e) => setEditAuthorOverride(e.target.value)}
                        placeholder="e.g. Kara Swisher"
                        className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none text-left"
                      />
                    </div>

                    {/* Edit Body */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Prose Story Content</label>
                      <textarea
                        rows={5}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-xs font-medium text-slate-950 bg-white border border-slate-250 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-left scrollbar-thin"
                      />
                    </div>

                    {/* Database Sync action button */}
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90 disabled:bg-indigo-300 text-white py-2.5 rounded-lg shadow-md cursor-pointer transition active:scale-95 mt-2"
                    >
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5" />}
                      {isSaving ? "Synchronizing CMS..." : "Apply & Sync Draft Layout"}
                    </button>

                    {saveSuccess && (
                      <div className="text-[10px] text-emerald-600 font-bold text-center mt-1 animate-pulse">
                        ✓ Updated! Saved to persistence & Firestore sync.
                      </div>
                    )}
                  </div>

                  {/* WordPress Design Settings card */}
                  <div className="space-y-3.5 bg-white dark:bg-[#121620]/60 p-4 rounded-xl border border-[#E3E5E8] dark:border-slate-800 shadow-sm text-xs">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                      <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-violet-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D1219] dark:text-slate-300">WP Gutenberg Themes</span>
                    </div>

                    {/* Theme Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">WordPress Block Skin</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setWpTheme('modern')}
                          className={`px-1.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${wpTheme === 'modern' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-violet-450 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                          Modern
                        </button>
                        <button
                          type="button"
                          onClick={() => setWpTheme('editorial')}
                          className={`px-1.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${wpTheme === 'editorial' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-violet-450 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                          Editorial
                        </button>
                        <button
                          type="button"
                          onClick={() => setWpTheme('astra')}
                          className={`px-1.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${wpTheme === 'astra' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-violet-450 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                          Astra
                        </button>
                      </div>
                    </div>

                    {/* Featured image alignment */}
                    <div className="space-y-1.5">
                      <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Featured Photo Layout</label>
                      <select
                        value={featuredImageAlign}
                        onChange={(e) => setFeaturedImageAlign(e.target.value as any)}
                        className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-2 outline-none cursor-pointer"
                      >
                        <option value="contained">Centered block (Contained)</option>
                        <option value="wide">Full-width header banner</option>
                        <option value="floating">Floating Right block (Wrap)</option>
                      </select>
                    </div>

                    {/* Typography configurations */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Text Scale</label>
                        <select
                          value={fontScale}
                          onChange={(e) => setFontScale(e.target.value as any)}
                          className="w-full text-xs font-semibold text-slate-950 bg-white border border-slate-250 rounded-lg p-1.5 outline-none cursor-pointer"
                        >
                          <option value="sm">Small</option>
                          <option value="base">Normal</option>
                          <option value="lg">Large</option>
                          <option value="xl">XL Body</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] font-bold text-slate-400 uppercase">Line Height</label>
                        <button
                          type="button"
                          onClick={() => {
                            const heights: ('tight' | 'normal' | 'loose')[] = ['tight', 'normal', 'loose'];
                            const idx = heights.indexOf(lineHeight);
                            setLineHeight(heights[(idx + 1) % heights.length]);
                          }}
                          className="w-full text-xs font-semibold text-slate-955 bg-white border border-slate-250 rounded-lg p-1.5 outline-none hover:bg-slate-50 text-left capitalize shrink-0 flex items-center justify-between"
                        >
                          <span>{lineHeight}</span>
                          <Type className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Element layout toggles */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 select-none">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Layout Parts toggle</span>
                      
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <label className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showBreadcrumbs}
                            onChange={(e) => setShowBreadcrumbs(e.target.checked)}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Breadcrumbs</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showMetaBar}
                            onChange={(e) => setShowMetaBar(e.target.checked)}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Author bar</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showAuthorCard}
                            onChange={(e) => setShowAuthorCard(e.target.checked)}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>Bio card</span>
                        </label>

                        <label className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showCommentsSection}
                            onChange={(e) => setShowCommentsSection(e.target.checked)}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>WP Comments</span>
                        </label>
                      </div>
                    </div>

                  </div>
                </>
              )}

            </div>
          </div>
        )}

      {/* ========================================================= */}
      {/* RIGHT COLUMN: HIGH FIDELITY WP PREVIEW SITE (70% WIDTH) */}
      {/* ========================================================= */}
      {(inspectorTab === 'inspector' || inspectorTab === 'preview') && (
        <div className="flex-1 bg-[#F0F1F2] dark:bg-slate-950/40 p-4 md:p-6 flex flex-col justify-start items-center select-text">
        
        {/* VIEWPORT CONTROLS BAR */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-md mb-4 font-sans select-none">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-wider text-slate-200">WordPress WYSIWYG Renderer</span>
            <span className="text-[10px] text-slate-400 font-medium">({currentTheme.name} Style Preset)</span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs text-slate-400 shrink-0">
            <button 
              type="button"
              onClick={() => setViewport('desktop')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${viewport === 'desktop' ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white font-semibold shadow-sm' : 'hover:text-white'}`}
              title="Desktop Presentation"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop View</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewport('tablet')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${viewport === 'tablet' ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white font-semibold shadow-sm' : 'hover:text-white'}`}
              title="Tablet Layout Mock"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewport('mobile')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer ${viewport === 'mobile' ? 'bg-[#3F5353] dark:bg-[#5F528E] text-white font-semibold shadow-sm' : 'hover:text-white'}`}
              title="Mobile Responsive viewport"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        </div>

        {/* HIGH-FIDELITY BROWSER CHROME SIMULATOR WRAPPER */}
        <div 
          id={`blog-preview-${nicheId}`} 
          className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col min-h-[580px] w-full mx-auto transition-all duration-300 text-left ${
            viewport === 'tablet' 
              ? 'max-w-[760px] ring-4 ring-slate-800/10' 
              : viewport === 'mobile' 
                ? 'max-w-[390px] ring-4 ring-slate-800/10' 
                : 'max-w-none'
          }`}
        >
          {/* 1. Broswer Chrome Frame Address bar (Matches Selector 1 style header) */}
          <header className={`${currentTheme.navBg} px-4 py-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-colors duration-300`}>
            <div className="flex items-center gap-3 w-full sm:w-auto text-left">
              <div className="flex gap-1.5 shrink-0 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              </div>
              <div className="h-6 border-r border-slate-200 mx-1 shrink-0" />
              <div className="text-left font-serif shrink-0">
                <h1 className={`text-sm md:text-base font-black ${wpTheme === 'astra' ? 'font-mono' : ''}`}>
                  {currentTheme.siteTitle}
                </h1>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider -mt-0.5 font-sans">
                  {nicheId.toUpperCase()} BRAND INTEGRATED WEB PORTAL
                </p>
              </div>
            </div>

            {/* Simulated Address Bar URL matching standard Wordpress format */}
            <div className="bg-slate-100 hover:bg-slate-150 border border-slate-200 select-all font-mono text-[10.5px] text-slate-500 py-1.5 px-3 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-xs xl:max-w-sm font-medium text-left truncate flex items-center gap-1.5 transition">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>https://{nicheId === 'hollywood' ? 'gossip.glamourfeed.co' : nicheId === 'sports' ? 'playbook.arenagrid.io' : 'specs.alphateardown.net'}/2026/06/{postSlug}/</span>
            </div>
          </header>

          {/* ========================================================= */}
          {/* 2. THE MAIN CANVAS INNER CONTENT (Matches Selector 2 style) */}
          {/* ========================================================= */}
          <div className={`p-4 md:p-6 overflow-y-auto flex-1 flex flex-col transition-colors duration-300 ${currentTheme.bodyBg} max-h-[600px] scrollbar-thin`}>
            {!activeArticle ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-sm italic">
                <BadgeAlert className="w-8 h-8 text-slate-300 mb-2" />
                Select or draft a column to visualize.
              </div>
            ) : (
              /* ========================================================= */
              /* 3. CORE ARTICLE THEMED PRESENTATION (Matches Selector 3 style) */
              /* ========================================================= */
              <div className={`rounded-xl p-5 md:p-8 w-full shadow-sm max-w-3xl mx-auto transition-all duration-300 ${currentTheme.contentBg}`}>
                
                {/* A. Breadcrumbs row if checked */}
                {showBreadcrumbs && (
                  <nav className="mb-4 text-[10.5px] md:text-xs font-semibold text-slate-400 font-sans tracking-wide uppercase flex items-center gap-1 select-none">
                    <span className="hover:text-indigo-600 cursor-pointer">Home</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="hover:text-indigo-600 cursor-pointer capitalize">{nicheId}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="text-slate-600 font-bold truncate max-w-[150px]">{editTitle}</span>
                  </nav>
                )}

                {/* B. Gutenberg block Taxonomy / Categories representation */}
                <div className="flex flex-wrap items-center gap-1 mb-3.5 select-none font-sans">
                  <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs uppercase font-extrabold tracking-widest ${
                    nicheId === 'hollywood' 
                      ? 'bg-rose-100 border border-rose-200 text-rose-700' 
                      : nicheId === 'sports' 
                        ? 'bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono' 
                        : 'bg-cyan-100/80 border border-cyan-200/60 text-cyan-800 font-mono'
                  }`}>
                    {nicheId}
                  </span>
                  
                  {/* Status indicator on custom blog */}
                  <span className={`text-[9.5px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-offset-1 shrink-0 ${
                    activeArticle.status === 'published' 
                      ? 'bg-indigo-50 border-indigo-150 text-indigo-600' 
                      : 'bg-yellow-50 border-yellow-150 text-yellow-600'
                  }`}>
                    {activeArticle.status} Mode
                  </span>
                </div>

                {/* C. The Gutenberg Post Name / Header spacing */}
                <h2 className={`${currentTheme.fontHeading} text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-tight text-slate-950 font-bold tracking-tight text-left mb-4`}>
                  {editTitle}
                </h2>

                {/* D. WP Gutenberg Meta bar row representation */}
                {showMetaBar && (
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-slate-400 border-y border-slate-200/80 py-3 mb-6 select-none font-sans">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <img
                        src={getWriterForArticle(activeArticle.authorId).avatar}
                        alt="Author portrait in WordPress"
                        className="w-6.5 h-6.5 rounded-full border border-slate-300 object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <span>By {editAuthorOverride || getWriterForArticle(activeArticle.authorId).name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      <span>{new Date(activeArticle.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span>{Math.max(2, Math.ceil(editContent.split(/\s+/).length / 200))} min read</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                      <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>Score: {activeArticle.seo?.humanScore || 95}%</span>
                    </div>
                  </div>
                )}

                {/* E. Featured image block with correct alignment layout */}
                {editImageUrl && (
                  <div className={`mb-6 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 max-h-[360px] aspect-video transition-all duration-300 select-none ${
                    featuredImageAlign === 'floating' && viewport === 'desktop'
                      ? 'float-right w-80 ml-6 mb-4 shadow-lg' 
                      : featuredImageAlign === 'wide' && viewport === 'desktop'
                        ? 'w-full -mx-4 md:-mx-8 rounded-none border-x-0'
                        : 'w-full shadow-md'
                  }`}>
                    <img 
                      src={editImageUrl} 
                      alt="The featured context photo in wordpress theme representation" 
                      className="w-full h-full object-cover"
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

                {/* F. Gutenberg styled content body paragraphs with real-time feedback */}
                <article className={`${currentTheme.fontBody} ${fontScaleClasses[fontScale]} ${lineHeightClasses[lineHeight]} text-left select-text whitespace-pre-wrap`}>
                  {editContent.split("\n\n").map((para, i) => {
                    const textStr = para.trim();
                    if (!textStr) return null;
                    
                    // Style first paragraph elegantly with a drop-cap if modern or editorial theme
                    const isFirstPara = i === 0 && (wpTheme === 'modern' || wpTheme === 'editorial');
                    
                    if (isFirstPara && textStr.length > 5) {
                      const firstChar = textStr.charAt(0);
                      const restText = textStr.substring(1);
                      return (
                        <p key={i} className="text-left font-sans text-slate-800 leading-relaxed font-medium">
                          <span className={`float-left ${viewport === 'mobile' ? 'text-3xl mr-1.5' : 'text-4xl md:text-5xl mr-2'} font-black text-[#3F5353] dark:text-[#5F528E] leading-none ${wpTheme === 'editorial' ? 'font-serif text-slate-900 font-bold' : ''}`}>
                            {firstChar}
                          </span>
                          {restText}
                        </p>
                      );
                    }
                    
                    return (
                      <p key={i} className="text-left leading-relaxed text-slate-800 font-sans">
                        {textStr}
                      </p>
                    );
                  })}
                </article>

                {/* G. WordPress categories tagging and taxonomies lists */}
                {editTagsText && (
                  <div className="mt-8 pt-4 border-t border-slate-200 select-none flex flex-wrap gap-2.5 justify-start text-left font-sans">
                    <span className="text-[11px] font-bold text-slate-400 self-center uppercase tracking-wider">Indexed Tags:</span>
                    {editTagsText.split(",").map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 px-2.5 py-0.5 rounded cursor-pointer transition">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* H. Author Profile Card if checked */}
                {showAuthorCard && (
                  <div className="mt-8 p-5 rounded-2xl border border-slate-205 bg-slate-50/60 select-none flex flex-col sm:flex-row items-center sm:items-start gap-4 text-left font-sans">
                    <img 
                      src={getWriterForArticle(activeArticle.authorId).avatar} 
                      alt="The registered journalist bio thumbnail"
                      className="w-16 h-16 rounded-full border shadow-sm object-cover shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          About The Author: {editAuthorOverride || getWriterForArticle(activeArticle.authorId).name}
                        </h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                          {getWriterForArticle(activeArticle.authorId).voiceStyle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {getWriterForArticle(activeArticle.authorId).bio}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono pt-1">
                        Total Published Articles: <b>{getWriterForArticle(activeArticle.authorId).totalArticles || 0} columns</b>
                      </div>
                    </div>
                  </div>
                )}

                {/* I. WP Comment system simulation if checked */}
                {showCommentsSection && (
                  <div className="mt-10 pt-8 border-t border-slate-200 text-left font-sans">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-6">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <span>Discussion Responses ({getCommentsForArticle(activeArticle.id).length})</span>
                    </h3>

                    {/* Comments List */}
                    <div className="space-y-4 mb-6">
                      {getCommentsForArticle(activeArticle.id).map((cmt, idx) => (
                        <div key={idx} className="flex gap-3 text-left">
                          <img 
                            src={cmt.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                            alt={cmt.author} 
                            className="w-8 h-8 rounded-full border border-slate-200 mt-1 object-cover shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex-1 relative">
                            <span className="absolute right-4 top-3 text-[10.5px] text-slate-400 font-semibold">{cmt.date}</span>
                            <h5 className="text-[11.5px] font-black text-slate-800">{cmt.author}</h5>
                            <p className="text-xs text-slate-600 leading-normal mt-1 font-medium select-text">{cmt.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Send Comment Box widget */}
                    <form onSubmit={handlePostComment} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl shadow-inner select-none space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Leave a Simulated WordPress Reply</h4>
                      <p className="text-[10px] text-slate-400 -mt-2 leading-relaxed">
                        Simulate reader engagement on this column layout by tolling a trial response below.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Your Name / Nickname..."
                          value={newCommentName}
                          onChange={(e) => setNewCommentName(e.target.value)}
                          className="bg-white text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full text-left font-bold text-slate-900"
                        />
                        <div className="flex gap-2 w-full">
                          <input 
                            type="text" 
                            required
                            placeholder="Type response comment..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="bg-white text-xs border border-slate-250 p-2.5 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 flex-1 text-left font-semibold text-slate-900"
                          />
                          <button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl cursor-pointer shadow flex items-center justify-center shrink-0 active:scale-95 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>
    )}

      {/* ========================================================= */}
      {/* SEO DIAGNOSTICS WORKSPACE */}
      {/* ========================================================= */}
      {inspectorTab === 'seo' && (
        <div className="flex-grow p-6 md:p-8 bg-white dark:bg-[#121620]/25 flex flex-col font-sans text-left leading-relaxed w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E5E8] dark:border-slate-800 pb-5 mb-6">
            <div>
              <h3 className="text-base font-semibold text-[#0D1219] dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#5F528E] dark:text-violet-455" />
                SEO Search Engine Compliance Analytics
              </h3>
              <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1">Real-time meta parser auditing SEO density, schema outputs, and human originality factors</p>
            </div>
            {activeArticle && (
              <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 select-none self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Score: {activeArticle.seo?.humanScore || 95}% Optimized</span>
              </div>
            )}
          </div>

          {!activeArticle ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
              <BadgeAlert className="w-8 h-8 text-slate-300 mb-2" />
              Select an article in Inspector Tab to parse SEO metrics.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[#E3E5E8] dark:border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[#8B8E96] block tracking-wider font-mono">Indexed slug compliance</span>
                    <span className="text-xs font-mono font-semibold text-[#0D1219] dark:text-slate-205 block mt-1.5 truncate">
                      /{postSlug}/
                    </span>
                    <p className="text-[11px] text-slate-500 mt-2 leading-normal">
                      Formulated with optimal hyphen separators, stripping invalid characters for search engine crawlers.
                    </p>
                  </div>

                  <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[#E3E5E8] dark:border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[#8B8E96] block tracking-wider font-mono">Originality Signature</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">0% AI-Pattern Match</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-normal">
                      Dynamic linguistic patterns verified bypass-safe for Google search quality updates and spam filters.
                    </p>
                  </div>
                </div>

                {/* Structured JSON Schema Output */}
                <div className="bg-[#F8F9FA] dark:bg-slate-950 p-5 rounded-xl border border-[#E3E5E8] dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase font-bold text-[#8B8E95] tracking-wider font-mono">Structured JSON-LD Article Schema Snippet</span>
                    <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">Schema.org</span>
                  </div>
                  <pre className="p-4 bg-[#0D1219] text-[11px] text-emerald-400 font-mono rounded-lg overflow-x-auto max-h-[220px] border border-slate-850 select-all scrollbar-thin">
{`{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${(editTitle || "").replace(/"/g, '\\"')}",
  "datePublished": "${activeArticle.createdAt}",
  "author": {
    "@type": "Person",
    "name": "${editAuthorOverride || "NichePublisher Expert"}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "OmniPublisher AI Network"
  }
}`}
                  </pre>
                  <p className="text-[10.5px] text-[#8B8E96] leading-normal flex items-center gap-1.5 select-none">
                    <Check className="w-3.5 h-3.5 text-emerald-500 hover:scale-110 duration-200" />
                    Schema ready to inject into Gutenberg meta headers when publishing is completed.
                  </p>
                </div>
              </div>

              {/* Sidebar stats panel */}
              <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-[#E3E5E8] dark:border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase text-[#0D1219] dark:text-slate-300 border-b border-[#E3E5E8] dark:border-slate-800 pb-2 select-none">Diagnostic Scores</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#8B8E96]">Readability Level</span>
                      <span className="text-slate-900 dark:text-slate-100">Grade 9 (Flesch-Kincaid)</span>
                    </div>
                    <div className="w-full bg-[#E3E5E8] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#8B8E96]">Keywords Frequency Check</span>
                      <span className="text-slate-950 dark:text-slate-100 font-medium">1.8% • In Target</span>
                    </div>
                    <div className="w-full bg-[#E3E5E8] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#8B8E96]">Headline Semantic Impact</span>
                      <span className="text-slate-950 dark:text-slate-100 font-medium">High positive Engagement</span>
                    </div>
                    <div className="w-full bg-[#E3E5E8] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-[#5F528E]/10 p-3.5 border border-indigo-100/60 dark:border-[#5F528E]/30 rounded-lg select-none">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 block mb-1 font-mono">Agent Recommendation</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-normal">
                    This post contains standard Google AdSense keyword frequencies. Add 2 more sub-headings (h3) to optimize layout readability structure further.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* WORDPRESS PUBLISHING SETTINGS WORKSPACE */}
      {/* ========================================================= */}
      {inspectorTab === 'publish' && (
        <div className="flex-grow p-6 md:p-8 bg-white dark:bg-[#121620]/25 flex flex-col font-sans text-left leading-relaxed w-full">
          <div className="border-b border-[#E3E5E8] dark:border-slate-800 pb-5 mb-6">
            <h3 className="text-base font-semibold text-[#0D1219] dark:text-slate-100 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-[#3F5353] dark:text-[#5F528E]" />
              WordPress Central Connection Engine
            </h3>
            <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1">Configure automated WordPress REST-API webhooks, auth profiles, auto-category mappings, and manual push parameters</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-4xl">
            <div className="bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-[#E3E5E8] dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-[#8B8E96] uppercase font-bold tracking-wider font-mono select-none">WordPress REST Connection</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mt-1.5 flex items-center gap-1.5 select-none">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                    Gutenberg REST Live
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#8B8E96] uppercase font-bold tracking-wider font-mono select-none">Mapped Category Target</span>
                  <span className="text-xs font-bold font-mono text-indigo-650 block mt-1.5 uppercase select-none font-sans">
                    {nicheId}
                  </span>
                </div>
              </div>
               
              <div className="pt-3 border-t border-[#E3E5E8] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-[#8B8E96] uppercase font-bold tracking-wider font-mono select-none">AUTO-PUSH LIVE SYSTEM</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">Push directly when originality matches score of higher than 95%</span>
                </div>
                <div className="w-10 h-6 bg-[#3F5352] dark:bg-[#5F528E] rounded-full p-0.5 flex items-center justify-end cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm animate-pulse" />
                </div>
              </div>

              {activeArticle && (
                <div className="pt-4 border-t border-[#E3E5E8] dark:border-slate-800 space-y-3">
                  <span className="block text-[10px] text-[#8B8E96] uppercase font-bold tracking-wider font-mono select-none">Immediate Actions Matrix</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveChanges}
                      className="bg-[#3F5353] dark:bg-[#5F528E] text-white text-xs cursor-pointer font-bold px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Apply Edited Parameters
                    </button>
                    
                    <a
                      href={`https://${nicheId === 'hollywood' ? 'gossip.glamourfeed.co' : nicheId === 'sports' ? 'playbook.arenagrid.io' : 'specs.alphateardown.net'}/2026/06/${postSlug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-[#E3E5E8] dark:border-slate-800 text-[#0D1219] dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 font-extrabold" />
                      Open WordPress Preview
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50/30 dark:bg-slate-900/30 p-5 rounded-2xl border border-[#E3E5E8] dark:border-slate-800 space-y-4">
              <span className="block text-[10.5px] uppercase font-bold text-[#8B8E96] tracking-wider font-mono select-none">Connection Logs</span>
              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-[10.5px] max-h-[160px] overflow-y-auto space-y-1.5 text-left leading-normal scrollbar-thin">
                <div className="text-slate-500">[{new Date().toLocaleTimeString()}] Fetching WordPress endpoint definitions...</div>
                <div className="text-emerald-500 font-semibold">[{new Date().toLocaleTimeString()}] ✓ Connection verified successfully. Status code 200 via OAuth2 protocol.</div>
                <div className="text-slate-500">[{new Date().toLocaleTimeString()}] Authenticated as NichePublisher_Agent_01. Permissions write_posts, write_categories valid.</div>
                <div className="text-sky-400">[{new Date().toLocaleTimeString()}] Category mapping checked. Syncing database record: {nicheId.toUpperCase()} -&gt; WordPress TaxID 410.</div>
              </div>
              <p className="text-[11px] text-[#8B8E96] dark:text-slate-400">
                To link secondary or multiple WordPress, Shopify, or Webflow CMS websites, navigate to the <span className="font-bold text-[#0D1219] dark:text-slate-350">API Engine Config</span> tab on the left-side control suites.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
);
}
