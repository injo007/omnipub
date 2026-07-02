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
  Copy,
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
import { Article, Writer, // Optional legacy alias
  NicheType } from "../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { YouTubePlayerBlock } from "./YouTubePlayerBlock";

interface NicheBlogPreviewProps {
  nicheId: NicheType;
  articles: Article[];
  writers: Writer[];
  saasConfig?: any;
  onTriggerImageGen?: (articleId: string, prompt: string) => void;
  isGeneratingImage?: boolean;
  onArticleUpdate?: (updatedArticle: Article) => void;
}

const NICHE_IMAGE_POOLS: Record<string, string[]> = {
  hollywood: [
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"
  ],
  sports: [
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502012652142-6e585671a421?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484480974693-2ca0a72f31a2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800&auto=format&fit=crop&q=80"
  ],
  tech: [
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80"
  ],
  traveling: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&auto=format&fit=crop&q=80"
  ]
};

const getTextFromChildren = (children: any): string => {
  if (!children) return "";
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }
  if (children.props && children.props.children) {
    return getTextFromChildren(children.props.children);
  }
  return "";
};

const decodeHtmlEntities = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8165;/g, "‘")
    .replace(/&#8166;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8194;/g, " ")
    .replace(/&#8195;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "...")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&bull;/g, "•")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/&#(\d+);/g, (match, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch (e) {
        return match;
      }
    });
};

const convertMarkdownToHTML = (markdown: string, title?: string): string => {
  if (!markdown) return "";
  
  // If the content is already highly-structured HTML or contains HTML paragraph tags, return it directly!
  const hasHtml = (markdown.includes("<p") || markdown.includes("<h2") || markdown.includes("<div") || markdown.includes("<!-- wp:") || markdown.includes("<h3") || markdown.includes("<ul") || markdown.includes("<ol"));
  if (hasHtml) {
    if (title && !markdown.includes(`<h1>${title}</h1>`) && !markdown.includes(`<h1>${title}`) && !markdown.includes(`# ${title}`)) {
      return `<h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; color: #1e293b;">${title}</h1>\n\n` + markdown;
    }
    return markdown;
  }
  
  // Basic markdown to clean HTML parser
  let html = markdown;
  
  // If there's a title, prepend it as an h1
  if (title) {
    html = `# ${title}\n\n` + html;
  }
  
  // Normalize newlines
  html = html.replace(/\r\n/g, "\n");
  
  // Code blocks: ```code``` => <pre><code>code</code></pre>
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto;"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Headers: ### text, ## text, # text
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bold: **text** => <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* => <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Blockquotes: > text
  html = html.replace(/^> (.*?)$/gm, '<blockquote style="border-left: 4px solid #4f46e5; padding-left: 10px; color: #4b5563; font-style: italic;">$1</blockquote>');
  
  // Lists: unordered and ordered
  const lines = html.split("\n");
  let inUl = false;
  let inOl = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check UL line (- or *)
    if (/^[-*]\s+(.*)$/.test(line)) {
      const content = line.replace(/^[-*]\s+/, "");
      if (!inUl) {
        lines[i] = "<ul>\n  <li>" + content + "</li>";
        inUl = true;
      } else {
        lines[i] = "  <li>" + content + "</li>";
      }
    } 
    // Check OL line (digits like 1. )
    else if (/^\d+\.\s+(.*)$/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, "");
      if (!inOl) {
        lines[i] = "<ol>\n  <li>" + content + "</li>";
        inOl = true;
      } else {
        lines[i] = "  <li>" + content + "</li>";
      }
    } 
    // Closed tag
    else {
      let extra = "";
      if (inUl) {
        extra += "</ul>\n";
        inUl = false;
      }
      if (inOl) {
        extra += "</ol>\n";
        inOl = false;
      }
      lines[i] = extra + lines[i];
    }
  }
  
  // Close any remaining lists
  let finalHtml = lines.join("\n");
  if (inUl) finalHtml += "\n</ul>";
  if (inOl) finalHtml += "\n</ol>";
  
  // Paragraph tag mapping (skip existing block tags)
  const blockTags = ['h1', 'h2', 'h3', 'pre', 'blockquote', 'ul', 'ol', 'li', 'table', 'tr', 'th', 'td', 'thead', 'tbody', 'div', '<h1', '<h2', '<h3', '<pre', '<blockquote', '<ul', '<ol', '<li', '<table', '<p', '</p'];
  const finalLines = finalHtml.split("\n");
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i].trim();
    if (line === "") continue;
    
    // Convert text lines to <p>
    const startsWithBlock = blockTags.some(tag => line.toLowerCase().startsWith(tag));
    if (!startsWithBlock) {
      finalLines[i] = `<p>${finalLines[i]}</p>`;
    }
  }
  
  return finalLines.join("\n");
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export default function NicheBlogPreview({ 
  nicheId, 
  articles, 
  writers, 
  saasConfig,
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
  const [editFocusKeyword, setEditFocusKeyword] = useState("");
  const [editSeoTitle, setEditSeoTitle] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Interactive user-appendable simulated WP comments
  const [customComments, setCustomComments] = useState<Record<string, { author: string; text: string; date: string; avatar: string }[]>>({});
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const activeArticle = articles.find(a => a.id === selectedArticleId);

  // -------------------------------------------------------------
  // ADVANCED CONVERSION & ENGAGEMENT BOOSTER SYSTEM STATES
  // -------------------------------------------------------------
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [activeAudioBrief, setActiveAudioBrief] = useState<any>(null);
  const [audioPlaySrc, setAudioPlaySrc] = useState<string | null>(null);
  
  // Interactive reader poll states
  const [pollVoted, setPollVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState<number | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({ 0: 42, 1: 28, 2: 15 });

  // Customized Lead magnet newsletter email submission
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<'idle' | 'loading' | 'success'>('idle');

  // Booster display settings
  const [showEngagementSection, setShowEngagementSection] = useState(true);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const convertBase64ToBlobUrl = (base64: string) => {
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: "audio/wav" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Base64 audio conversion failed", e);
      return null;
    }
  };

  const handleGenerateAudioBriefing = async () => {
    if (!selectedArticleId) return;
    setAudioLoading(true);
    setAudioPlaying(false);
    setAudioPlaySrc(null);

    try {
      const res = await fetch(`/api/articles/${selectedArticleId}/generate-audio`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setActiveAudioBrief(data);
        const url = convertBase64ToBlobUrl(data.audioBase64);
        if (url) {
          setAudioPlaySrc(url);
          setAudioPlaying(true);
        }
        if (onArticleUpdate && activeArticle) {
          onArticleUpdate({
            ...activeArticle,
            audioBriefing: data
          });
        }
      }
    } catch (err) {
      console.error("Failed to generate voice speech briefing:", err);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleToggleAudioPlay = () => {
    if (audioPlaying) {
      setAudioPlaying(false);
    } else {
      if (!audioPlaySrc && activeAudioBrief) {
        const url = convertBase64ToBlobUrl(activeAudioBrief.audioBase64);
        if (url) setAudioPlaySrc(url);
      }
      setAudioPlaying(true);
    }
  };

  // Synchronize audio element ref
  useEffect(() => {
    if (audioPlaySrc) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioPlaySrc);
        audioRef.current.onended = () => setAudioPlaying(false);
      } else {
        if (audioRef.current.src !== audioPlaySrc) {
          audioRef.current.src = audioPlaySrc;
        }
      }

      if (audioPlaying) {
        audioRef.current.play().catch(e => console.log("Audio presentation postponed slightly.", e));
      } else {
        audioRef.current.pause();
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioPlaySrc, audioPlaying]);

  // Handle article transition
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioPlaying(false);
    setAudioPlaySrc(null);
    setPollVoted(false);
    setVotedChoice(null);
    setSubscriberEmail("");
    setSubscribeState("idle");

    if (activeArticle?.audioBriefing) {
      setActiveAudioBrief(activeArticle.audioBriefing);
    } else {
      setActiveAudioBrief(null);
    }
    
    // Seed nice poll metrics for the active article!
    const textHash = (activeArticle?.title || "").length;
    setPollVotes({
      0: 38 + (textHash % 17),
      1: 24 + (textHash % 13),
      2: 12 + (textHash % 9)
    });
  }, [selectedArticleId, activeArticle]);

  // Tabs for layout inspector
  const [inspectorTab, setInspectorTab] = useState<'inspector' | 'preview' | 'seo' | 'publish'>('inspector');
  
  const [copyState, setCopyState] = useState<'idle' | 'markdown' | 'html'>('idle');

  useEffect(() => {
    if (copyState !== 'idle') {
      const timer = setTimeout(() => {
        setCopyState('idle');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  const handleCopyToClipboard = async (text: string, type: 'markdown' | 'html') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopyState(type);
      } else {
        // Fallback for older browsers or iframe constraints
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyState(type);
      }
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

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
  useEffect(() => {
    if (activeArticle) {
       setEditTitle(decodeHtmlEntities(activeArticle.title));
       setEditContent(activeArticle.content);
       setEditTagsText((activeArticle.tags || []).join(", "));
       setEditImageUrl(activeArticle.originalImageUrl || "");
       setEditAuthorOverride(activeArticle.customAuthorName || "");
       setEditFocusKeyword(activeArticle.seo?.focusKeyword || "");
       setEditSeoTitle(activeArticle.seo?.title || "");
       setEditSeoDescription(activeArticle.seo?.description || "");
       setEditSlug(activeArticle.seo?.slug || activeArticle.slug || "");
       setEditImageAlt(activeArticle.seo?.imageAlt || "");
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
          customAuthorName: editAuthorOverride || "",
          seo: {
            ...activeArticle.seo,
            focusKeyword: editFocusKeyword,
            title: editSeoTitle,
            description: editSeoDescription,
            slug: editSlug,
            imageAlt: editImageAlt
          },
          slug: editSlug
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
  // DYNAMIC INLINE MEDIA INJECTOR
  // -------------------------------------------------------------
  const injectAdditionalMedia = (markdown: string): string => {
    if (!markdown) return "";
    
    // Respect the user's selected choice or global settings
    const activeInlineImageMode = saasConfig?.modelSettings?.inlineImageMode || "generate";
    
    // If the mode is 'none', do not inject any additional inline visual hooks
    if (activeInlineImageMode === 'none') {
      return markdown;
    }
    
    const lines = markdown.split("\n");
    const result: string[] = [];
    let headingCount = 0;
    let paraCount = 0;
    
    // Dynamic image pool based on active niche
    let normNiche = (nicheId || "tech").toLowerCase().trim();
    if (normNiche === "travel" || normNiche === "traveling" || normNiche === "nomad" || normNiche === "nomad-chronics" || normNiche === "nomad_chronics" || normNiche === "lifestyle") {
      normNiche = "traveling";
    }
    const pool = NICHE_IMAGE_POOLS[normNiche] || NICHE_IMAGE_POOLS.traveling || NICHE_IMAGE_POOLS.tech;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match headings like ## Some Subtitle
      if (line.startsWith("## ")) {
        headingCount++;
        const titleText = line.substring(3).trim();
        
        // Let's inject a beautiful related inline article image every 2 headings (e.g. at count 1, 3, etc.)
        if (headingCount % 2 !== 0) {
          if (activeInlineImageMode === 'promptOnly') {
            const promptPrompt = `Create a high-quality, professional 16:9 photorealistic editorial background illustration highlighting: "${titleText}" for a blog post about "${activeArticle?.title || titleText}". Style: modern ${normNiche} journalism aesthetic, vibrant color palette, rich detail, no text overlays or captions.`;
            result.push(`\n![Focus Highlight: ${titleText}](#prompt-only:${encodeURIComponent(promptPrompt)})\n`);
          } else {
            const imgUrl = pool[(headingCount - 1) % pool.length];
            // We put the image right before the heading
            result.push(`\n![Focus Highlight: ${titleText}](${imgUrl})\n`);
          }
        }
      } else {
        const trimmed = line.trim();
        // Count plain paragraphs without stars, hashes, etc.
        if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("-") && !trimmed.startsWith("|") && !trimmed.startsWith(">") && !trimmed.startsWith("![")) {
          paraCount++;
          // Fallback image injection if we have zero headers in some draft
          if (paraCount === 3 && headingCount === 0) {
            if (activeInlineImageMode === 'promptOnly') {
              const promptPrompt = `Create a high-quality, professional 16:9 blog editorial showcase visual representing: "${activeArticle?.title || 'Editorial Spotlight'}". Style: modern ${normNiche} design aesthetic, clean composition, no text overlays or labels.`;
              result.push(`\n![Editorial Spotlight Showcase](#prompt-only:${encodeURIComponent(promptPrompt)})\n`);
            } else {
              const imgUrl = pool[0];
              result.push(`\n![Editorial Spotlight Showcase](${imgUrl})\n`);
            }
          }
        }
      }
      
      result.push(line);
    }
    
    return result.join("\n");
  };

  // -------------------------------------------------------------
  // DESIGN PRESET MATCHES FOR WP THEMES
  // -------------------------------------------------------------
  const themePresets = {
    modern: {
      navBg: "bg-white border-b border-neutral-300 text-neutral-900 shadow-sm",
      bodyBg: "bg-neutral-50/60 text-neutral-800",
      contentBg: "bg-white border border-neutral-200 shadow-lg hover:shadow-xl rounded-2xl transition-all duration-300",
      fontHeading: "font-space tracking-tight font-black text-slate-900",
      fontBody: "font-sans text-neutral-800",
      siteTitle: `📰 ${nicheId.toUpperCase()} DAILY • TWENTY TWENTY-FOUR`,
      name: "Twenty Twenty-Four",
      tagline: "Standard Premium Gutenberg Block theme styled with clean human Inter typography"
    },
    editorial: {
      navBg: "bg-[#FDFCF9] border-b border-stone-300 text-stone-900 shadow-xs",
      bodyBg: "bg-[#F4F3ED] text-stone-900",
      contentBg: "bg-[#FCFBF7] border border-stone-300/90 shadow-xl hover:shadow-2xl rounded-2xl transition-all duration-300",
      fontHeading: "font-serif tracking-normal font-bold text-stone-950",
      fontBody: "font-serif text-stone-950 leading-relaxed",
      siteTitle: `🏛️ THE GEORGIA ${nicheId.toUpperCase()} DIGEST`,
      name: "Elegant Editorial",
      tagline: "Classic Gutenberg styling pairing authoritative Playfair Display serif elements"
    },
    astra: {
      navBg: "bg-[#0b0f19] border-b border-slate-800 text-cyan-400 font-mono shadow-md",
      bodyBg: "bg-[#070a13] text-slate-200",
      contentBg: "bg-[#0f1423]/95 border border-slate-750 shadow-2xl rounded-2xl transition-all duration-300",
      fontHeading: "font-mono font-bold tracking-tight text-white",
      fontBody: "font-mono text-slate-300",
      siteTitle: `⚡ // ${nicheId.toUpperCase().replace(/[^A-Za-z0-9]/g, "")}.NET - SYSTEM`,
      name: "Astra Cyan Console",
      tagline: "Raw, minimalist, high-contrast console interface curated in JetBrains Mono"
    }
  };

  const currentTheme = themePresets[wpTheme];

  // Font scales classes
  const fontScaleClasses = {
    sm: "text-[13px] sm:text-[14px]",
    base: "text-[14.5px] sm:text-[15.5px] md:text-[16px]",
    lg: "text-[16px] sm:text-[17px] md:text-[18px]",
    xl: "text-[17.5px] sm:text-[19px] md:text-[20px]"
  };

  // Line height classes
  const lineHeightClasses = {
    tight: "leading-snug space-y-3",
    normal: "leading-relaxed space-y-5",
    loose: "leading-loose space-y-7"
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

      {/* PERSISTENT INSTANT EDITORIAL CLIPBOARD ASSISTANT */}
      {activeArticle && (
        <div className="bg-indigo-50/50 dark:bg-[#1f1b2e]/65 border-b border-[#E3E5E8] dark:border-slate-800 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 text-left font-sans animate-none shadow-sm select-none">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg shrink-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div className="text-left leading-normal">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Editorial Clipboard Assistant
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Active article: <b className="font-extrabold text-[#0D1219] dark:text-white">"{decodeHtmlEntities(editTitle)}"</b> • {editContent ? editContent.split(/\s+/).filter(Boolean).length : 0} words
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Copy Markdown Button */}
            <button
              type="button"
              onClick={() => {
                const markdownText = `# ${editTitle}\n\n${editContent}`;
                handleCopyToClipboard(markdownText, "markdown");
              }}
              className={`text-xs font-black px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-250 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm select-none ${
                copyState === "markdown"
                  ? "bg-emerald-600 border-emerald-600 text-white font-extrabold"
                  : "bg-white dark:bg-slate-900 border-[#E3E5E8] dark:border-slate-800 text-slate-700 dark:text-slate-255 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              {copyState === "markdown" ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span>Markdown Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span>Copy Article Markdown</span>
                </>
              )}
            </button>

            {/* Copy Clean HTML Button */}
            <button
              type="button"
              onClick={() => {
                const htmlText = convertMarkdownToHTML(editContent, editTitle);
                handleCopyToClipboard(htmlText, "html");
              }}
              className={`text-xs font-black px-4 py-2 rounded-xl border flex items-center gap-2 transition-all duration-250 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm select-none ${
                copyState === "html"
                  ? "bg-emerald-600 border-emerald-600 text-white font-extrabold"
                  : "bg-white dark:bg-slate-900 border-[#E3E5E8] dark:border-slate-800 text-slate-700 dark:text-slate-255 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              {copyState === "html" ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span>HTML Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>Copy Clean HTML</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
                        {art.status === 'draft' ? '📝 [Draft] ' : '🚀 [Live] '} {decodeHtmlEntities(art.title).substring(0, 48)}...
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
                  <div className="space-y-4 bg-white dark:bg-[#121620]/80 p-5 md:p-6 rounded-2xl border border-slate-250 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300">
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
                          onClick={() => {
                            if (saasConfig?.modelSettings?.imageModel === 'browser-assistant') {
                              const prompt = `Generate a high-quality featured image for an article titled: "${activeArticle?.title}". The niche is ${activeArticle?.niche}. Style should be professional and cinematic.`;
                              navigator.clipboard.writeText(prompt);
                              alert("Visual prompt copied to clipboard! Paste it into Gemini or ChatGPT.");
                            } else {
                              triggerImageGeneration();
                            }
                          }}
                          disabled={isGeneratingImage}
                          title={saasConfig?.modelSettings?.imageModel === 'browser-assistant' ? "Copy Browser Gen Prompt" : "AI Cover Painter"}
                          className={`${
                            saasConfig?.modelSettings?.imageModel === 'browser-assistant' 
                              ? 'bg-amber-500 hover:bg-amber-600' 
                              : 'bg-[#3F5353] dark:bg-[#5F528E] hover:bg-opacity-90'
                          } text-white p-2 rounded-lg cursor-pointer transition active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50`}
                        >
                          {isGeneratingImage ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : saasConfig?.modelSettings?.imageModel === 'browser-assistant' ? (
                            <ExternalLink className="w-3.5 h-3.5" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
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

                    {/* Manual Generation Link & Helper */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-violet-400 uppercase">Browser Gen Assistant</span>
                        <div className="flex gap-1">
                           <a 
                             href={`https://aistudio.google.com/app/prompts/new?auto_run=true&prompt=${encodeURIComponent(`Generate a photorealistic 16:9 modern blog header for: ${editTitle}. High detail, no text.`)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition"
                             title="Open in Gemini Studio"
                           >
                             <ExternalLink className="w-3 h-3" />
                           </a>
                           <a 
                             href={`https://chatgpt.com/?q=${encodeURIComponent(`Generate a DALL-E 3 image: ${editTitle}. 16:9 aspect ratio, professional blog header.`)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600 transition"
                             title="Open in ChatGPT"
                           >
                             <Zap className="w-3 h-3" />
                           </a>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between group">
                          <span className="text-[9px] text-slate-500 font-medium truncate pr-2">Prompt: {editTitle.substring(0, 30)}...</span>
                          <button 
                            onClick={() => {
                               navigator.clipboard.writeText(`Create a high-quality 16:9 photorealistic blog header image for the topic: "${editTitle}". It should be clean, modern, and have no text annotations.`);
                            }}
                            className="text-[9px] text-indigo-600 hover:underline font-bold"
                          >
                            Copy Prompt
                          </button>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Paste External Image URL here..."
                          className="w-full text-[9px] p-1.5 border border-slate-200 rounded bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                          onBlur={(e) => {
                            if (e.target.value.startsWith("http")) {
                              setEditImageUrl(e.target.value);
                            }
                          }}
                        />
                      </div>
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
                  <div className="space-y-4 bg-white dark:bg-[#121620]/80 p-5 md:p-6 rounded-2xl border border-slate-250 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-300 text-xs">
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

                        <label className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-350 cursor-pointer col-span-2">
                          <input 
                            type="checkbox" 
                            checked={showEngagementSection}
                            onChange={(e) => setShowEngagementSection(e.target.checked)}
                            className="rounded text-indigo-600 w-3.5 h-3.5"
                          />
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">🚀 Audience Conversion Kit</span>
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
                    <span className="text-slate-600 font-bold truncate max-w-[150px]">{decodeHtmlEntities(editTitle)}</span>
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
                  {decodeHtmlEntities(editTitle)}
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
                      <span>Naturalness Score: {activeArticle.seo?.humanScore || 95}%</span>
                    </div>
                  </div>
                )}

                {/* E. Featured image block with correct alignment layout */}
                {(() => {
                  const activeInlineImageMode = saasConfig?.modelSettings?.inlineImageMode || "generate";
                  
                  // 1. None / STRIP GRAPHICS mode:
                  if (activeInlineImageMode === 'none') {
                    return null;
                  }
                  
                  // 2. Prompt Only mode (or if original image started with #prompt-only):
                  const isHeroPromptOnly = (editImageUrl && editImageUrl.startsWith("#prompt-only:")) || activeInlineImageMode === 'promptOnly';
                  const heroPromptValue = editImageUrl && editImageUrl.startsWith("#prompt-only:") 
                    ? decodeURIComponent(editImageUrl.replace("#prompt-only:", "")) 
                    : `Create a high-quality, professional 16:9 photorealistic featured hero image for an article titled: "${editTitle || activeArticle?.title || 'Editorial Story'}". Style: modern ${nicheId || 'general'} journalism aesthetic, cinematic composition, vibrant colors, clear details, no text annotations or overlays.`;

                  if (isHeroPromptOnly) {
                    return (
                      <div className="w-full mb-6 rounded-xl border-2 border-dashed border-violet-200 dark:border-slate-800 bg-violet-50/10 dark:bg-slate-900/40 p-6 md:p-8 flex flex-col items-center text-center gap-4 select-none shadow-sm text-left">
                        <div className="p-2.5 bg-violet-100 dark:bg-violet-950/50 rounded-full text-violet-600 dark:text-violet-400">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-1 max-w-xl text-center">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Featured Image Prompt Slot</span>
                          <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-tight">Post Featured Image - Manual External Generation</span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-750 mt-3 select-text italic">
                            "{heroPromptValue}"
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const fullPrompt = heroPromptValue.includes("Create a high-quality") ? heroPromptValue : `Create a high-quality, professional 16:9 photorealistic featured hero image for a blog article. Subject: "${heroPromptValue}". Cinematic composition, vibrant colors, suitable for ${nicheId || 'general'} media, no text annotations.`;
                            navigator.clipboard.writeText(fullPrompt);
                            alert("Featured image generation prompt copied successfully! Paste this prompt into Gemini, ChatGPT, or Midjourney.");
                          }}
                          className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Copy className="w-4 h-4" />
                          <span>COPY HERO PROMPT</span>
                        </button>
                      </div>
                    );
                  }

                  // 3. Normal / Generate mode:
                  return (
                    <div className={`relative mb-6 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 max-h-[360px] aspect-video transition-all duration-300 select-none ${
                      featuredImageAlign === 'floating' && viewport === 'desktop'
                        ? 'float-right w-80 ml-6 mb-4 shadow-lg' 
                        : featuredImageAlign === 'wide' && viewport === 'desktop'
                          ? 'w-full -mx-4 md:-mx-8 rounded-none border-x-0'
                          : 'w-full shadow-md'
                    }`}>
                      <img 
                        src={editImageUrl || (() => {
                          let normNiche = (nicheId || "tech").toLowerCase().trim();
                          if (normNiche === "travel" || normNiche === "traveling" || normNiche === "nomad" || normNiche === "nomad-chronics" || normNiche === "nomad_chronics" || normNiche === "lifestyle") {
                            normNiche = "traveling";
                          }
                          const pool = NICHE_IMAGE_POOLS[normNiche] || NICHE_IMAGE_POOLS.traveling || NICHE_IMAGE_POOLS.tech;
                          return pool[0];
                        })()} 
                        alt="The featured context photo in wordpress theme representation" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.dataset.failed) return;
                          target.dataset.failed = "true";
                          let normNiche = (nicheId || "tech").toLowerCase().trim();
                          if (normNiche === "travel" || normNiche === "traveling" || normNiche === "nomad" || normNiche === "nomad-chronics" || normNiche === "nomad_chronics" || normNiche === "lifestyle") {
                            normNiche = "traveling";
                          }
                          const pool = NICHE_IMAGE_POOLS[normNiche] || NICHE_IMAGE_POOLS.traveling || NICHE_IMAGE_POOLS.tech;
                          target.src = pool[Math.floor(Math.random() * pool.length)];
                        }}
                      />
                      
                      {/* Browser Assistant Mode Alert */}
                      {saasConfig?.modelSettings?.imageModel === 'browser-assistant' && (
                        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-4 text-center select-none backdrop-blur-[1px]">
                          <div className="p-3 bg-white rounded-2xl shadow-2xl flex flex-col items-center gap-2 max-w-[240px]">
                            <div className="p-2 bg-indigo-50 rounded-full">
                              <ExternalLink className="w-5 h-5 text-indigo-600 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 uppercase">Browser Generation Mode</span>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                              Generation paused for external creation. Copy the prompt below, generate in Gemini/ChatGPT, and paste the URL here.
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => {
                                  const prompt = `Generate a high-quality featured image for an article titled: "${activeArticle?.title}". The niche is ${activeArticle?.niche}. Style should be professional and cinematic.`;
                                  navigator.clipboard.writeText(prompt);
                                  alert("Visual prompt copied to clipboard! Paste it into Gemini or ChatGPT.");
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy Visual Prompt
                              </button>
                              <button
                                onClick={() => {
                                  if (onArticleUpdate && activeArticle) {
                                    // We switch back to default model in settings to "help" the user escape
                                    fetch("/api/saas-settings", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        modelSettings: { imageModel: "imagen-4.0-generate-001" }
                                      })
                                    }).then(() => {
                                      window.location.reload();
                                    });
                                  }
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                Return to Auto AI
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ADVANCED AUDIENCE CONVERSION & ENGAGEMENT BOOSTER PANEL */}
                {showEngagementSection && activeArticle && (
                  <div className="mb-8 p-5 bg-[#FAF9F6]/90 dark:bg-slate-900 border-2 border-dashed border-indigo-200/90 dark:border-indigo-900/50 rounded-2xl shadow-sm space-y-5 select-none animate-fade-in text-left">
                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg text-indigo-700 dark:text-indigo-400 font-sans font-black text-[10px] tracking-wider uppercase">
                          ENTERPRISE SaaS MODULE
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-sans">
                          Audience Conversion Kit
                        </h4>
                      </div>
                      <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase select-none">
                        Active Port: 3000
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* COLUMN 1: AI SPOKEN BROADCAST EDITION */}
                      <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-sans">
                              Editorial Voice AI
                            </span>
                            {activeAudioBrief && (
                              <span className="text-[9px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                Voice Ready ({activeAudioBrief.voiceName})
                              </span>
                            )}
                          </div>
                          <h5 className="text-[14px] font-bold text-slate-900 dark:text-slate-150 leading-snug mb-1">
                            Narrated Briefing Update
                          </h5>
                          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                            Generate and stream a 45-second high-fidelity spoken editorial briefing podcast compiled using Gemini TTS.
                          </p>
                        </div>

                        {/* Audio controls action */}
                        {audioLoading ? (
                          <div className="flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 gap-2 font-sans select-none w-full">
                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                            <span>Synthesizing TTS wave...</span>
                          </div>
                        ) : activeAudioBrief ? (
                          <div className="space-y-3 w-full">
                            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg">
                              <button 
                                type="button"
                                onClick={handleToggleAudioPlay}
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow transition ${
                                  audioPlaying 
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                {audioPlaying ? (
                                  <span className="text-xs font-black">❚❚</span>
                                ) : (
                                  <span className="text-xs font-bold pl-0.5">▶</span>
                                )}
                              </button>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-none mb-1">
                                  {decodeHtmlEntities(editTitle)}
                                </div>
                                <div className="flex items-center justify-between gap-2.5">
                                  {/* Waveform graphic matching play */}
                                  <div className="flex items-end gap-0.5 h-4 w-28 shrink-0">
                                    {[2, 5, 8, 3, 6, 9, 4, 7, 5, 2, 8, 4, 6].map((h, i) => (
                                      <span 
                                        key={i} 
                                        style={{ height: audioPlaying ? `${h * 1.5 + 2}px` : '3px' }}
                                        className={`w-[2px] bg-indigo-500 rounded-full transition-all duration-300 ${
                                          audioPlaying ? 'animate-pulse animate-duration-500' : 'bg-slate-300'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[9.5px] font-mono text-slate-400 shrink-0 font-extrabold select-none">
                                    {audioPlaying ? 'STREAMING' : 'READY'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Spoken content brief collapsing text for validation check */}
                            <div className="text-left bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850 select-text max-h-[85px] overflow-y-auto">
                              <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest block mb-0.5 select-none">
                                Script Text Verification
                              </span>
                              <p className="text-[10px] italic leading-normal text-slate-500 font-medium">
                                "{activeAudioBrief.textBrief}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGenerateAudioBriefing}
                            className="w-full bg-[#3F5353] dark:bg-[#5F528E] hover:bg-slate-850 text-white font-sans font-bold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#4F6363] dark:border-slate-700"
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>Compile Spoken Briefing</span>
                          </button>
                        )}
                      </div>

                      {/* COLUMN 2: STRATEGIC EDITORIAL OPINION POLL */}
                      <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#E28743] uppercase tracking-widest font-sans">
                              Interactive Verdict Poll
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                              Reader Board
                            </span>
                          </div>
                          
                          {/* Determine question according to active niche */}
                          {(() => {
                            const qData = 
                              nicheId === 'hollywood' 
                                ? { 
                                    q: "Is this Tribeca rendezvous a commercial transaction of clout or raw creative chemistry?",
                                    opts: ["Commercial Clout Strategy", "Authentic Creative Spark", "Pretentious Disaster Frame"]
                                  }
                                : nicheId === 'sports'
                                  ? {
                                      q: "Will Denver's high-spread defensive setup withstand this tactical adjustment?",
                                      opts: ["Yes, supreme rotation", "No, pocket pass is deadly", "Requires custom baseline depth"]
                                    }
                                  : nicheId === 'tech'
                                    ? {
                                        q: "Are Spec cooling compromises acceptable for a matte titanium chassis style?",
                                        opts: ["No, give me raw thermals", "Yes, colder shell is comfortable", "Depends purely on workstation load"]
                                      }
                                    : {
                                        q: "Do you agree with the strategic direction taken in this original column dispatch?",
                                        opts: ["Fully agree, very insightful", "Slightly skeptical of the metrics", "Prefer alternative perspective"]
                                      };

                            const totalVoteCount = pollVotes[0] + pollVotes[1] + pollVotes[2] + (pollVoted ? 1 : 0);

                            return (
                              <div className="space-y-3">
                                <h6 className="text-[12.5px] font-bold text-slate-900 dark:text-slate-150 leading-tight">
                                  {qData.q}
                                </h6>

                                {pollVoted ? (
                                  <div className="space-y-1.5 animate-fade-in select-none">
                                    {qData.opts.map((opt, i) => {
                                      const votes = pollVotes[i] + (votedChoice === i ? 1 : 0);
                                      const percent = totalVoteCount > 0 ? Math.round((votes / totalVoteCount) * 100) : 0;
                                      return (
                                        <div key={i} className="text-xs">
                                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 mb-0.5">
                                            <span className={`${votedChoice === i ? 'text-indigo-600 font-bold' : ''}`}>
                                              {opt} {votedChoice === i && " (Your Verdict)"}
                                            </span>
                                            <span className="font-mono">{percent}% ({votes} votes)</span>
                                          </div>
                                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-slate-800">
                                            <div 
                                              style={{ width: `${percent}%` }}
                                              className={`h-full duration-500 transition-all ${
                                                votedChoice === i ? 'bg-indigo-650 dark:bg-indigo-500' : 'bg-slate-400'
                                              }`}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block pt-1 select-none text-left">
                                      ✓ Verdict registered on active WordPress database!
                                    </span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {qData.opts.map((opt, i) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          setVotedChoice(i);
                                          setPollVoted(true);
                                        }}
                                        className="w-full text-left text-[11px] font-bold text-slate-705 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 hover:text-indigo-750 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-2 transition cursor-pointer select-none"
                                      >
                                        👉 {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE LEAD-CAPTURE VIP NEWSLETTER CIRCLE */}
                    <div className="p-5 md:p-6 bg-indigo-50/80 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 shadow-md select-none">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div className="max-w-md">
                          <div className="flex items-center gap-1.5 mb-1 select-none">
                            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-sans">
                              Editorial VIP Newsletter
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          </div>
                          <h6 className="text-[12.5px] font-black text-slate-900 dark:text-slate-150 leading-tight">
                            {nicheId === 'hollywood' 
                              ? "Glitter-Soaked Gossip Dossier" 
                              : nicheId === 'sports' 
                                ? "Baseline Chalkboard Tactics" 
                                : "Matte Spec Thermal Telemetry"}
                          </h6>
                          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-0.5">
                            {nicheId === 'hollywood' 
                              ? "Receive absolute, unvarnished paparazzi breakdowns and Tribeca secrets drafted in Gigi's elite voice." 
                              : nicheId === 'sports' 
                                ? "Receive deep locker room tactical analyses, player stats telemetry, and match predictions ahead of game time." 
                                : "Receive raw, unbiased spec audits, thermals telemetry reports, and copper-pipe architecture reviews."}
                          </p>
                        </div>

                        {subscribeState === 'success' ? (
                          <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2 px-4 rounded-xl border border-emerald-150 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center max-w-sm shrink-0 self-center animate-fade-in select-none">
                            <span>✓ Added! First Editorial is routed.</span>
                          </div>
                        ) : (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!subscriberEmail.trim() || !subscriberEmail.includes("@")) return;
                              setSubscribeState('loading');
                              setTimeout(() => setSubscribeState('success'), 800);
                            }}
                            className="flex items-center gap-1.5 shrink-0 self-center w-full sm:w-auto"
                          >
                            <input 
                              type="email" 
                              required
                              placeholder="Enter email address..." 
                              value={subscriberEmail}
                              onChange={(e) => setSubscriberEmail(e.target.value)}
                              className="bg-white dark:bg-slate-950 text-xs font-semibold p-2 px-3 border border-indigo-200/60 focus:border-indigo-500 rounded-lg outline-none w-full sm:w-44 select-text text-left text-slate-800 dark:text-slate-100"
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-550 dark:hover:bg-indigo-600 text-white font-sans font-black text-[10px] uppercase tracking-wider py-2 px-3 rounded-lg shadow-sm transition select-none cursor-pointer text-center shrink-0"
                            >
                              Join Circle
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* F. Gutenberg styled content body paragraphs with real-time feedback */}
                {(() => {
                  let hasRenderedFirstPara = false;
                  return (
                    <article className={`${currentTheme.fontBody} ${fontScaleClasses[fontScale]} ${lineHeightClasses[lineHeight]} text-left select-text markdown-body`}>
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => (
                            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold mt-12 mb-6 border-b-2 pb-3 leading-tight tracking-tight ${
                              wpTheme === 'astra' 
                                ? 'text-cyan-400 border-slate-800 font-mono' 
                                : wpTheme === 'editorial' 
                                  ? 'text-stone-950 border-stone-250 font-serif' 
                                  : 'text-slate-900 border-slate-200 font-sans'
                            }`} {...props} />
                          ),
                          h2: ({node, ...props}) => {
                            return (
                              <div className="mt-14 mb-6">
                                <h2 className={`text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight ${
                                  wpTheme === 'astra' 
                                    ? 'text-white border-l-4 border-cyan-400 pl-4 font-mono' 
                                    : wpTheme === 'editorial' 
                                      ? 'text-stone-950 font-serif border-b-2 border-stone-250 pb-2' 
                                      : 'text-slate-900 font-sans border-l-4 border-indigo-600 pl-4'
                                }`} {...props} />
                              </div>
                            );
                          },
                          h3: ({node, ...props}) => (
                            <h3 className={`text-lg md:text-xl font-bold mt-10 mb-4 leading-snug ${
                              wpTheme === 'astra' 
                                ? 'text-cyan-300 font-mono' 
                                : wpTheme === 'editorial' 
                                  ? 'text-stone-900 font-serif' 
                                  : 'text-slate-800 font-sans'
                            }`} {...props} />
                          ),
                          p: ({node, children, ...props}) => {
                            const hasBlockInNode = (n: any): boolean => {
                              if (!n) return false;
                              if (n.tagName === "img") return true;
                              if (n.tagName === "a" && n.properties && n.properties.href) {
                                const href = n.properties.href;
                                if (typeof href === "string" && (href.includes("youtube.com") || href.includes("youtu.be"))) {
                                  return true;
                                }
                              }
                              if (n.children && Array.isArray(n.children)) {
                                return n.children.some((child: any) => hasBlockInNode(child));
                              }
                              return false;
                            };
                            const hasBlock = hasBlockInNode(node);

                            const isEditorialOrModern = wpTheme === 'modern' || wpTheme === 'editorial';
                            if (!hasRenderedFirstPara && isEditorialOrModern && !hasBlock) {
                              hasRenderedFirstPara = true;
                              const paragraphText = getTextFromChildren(children);
                              if (paragraphText && paragraphText.length > 5) {
                                const firstChar = paragraphText.charAt(0);
                                const restText = paragraphText.substring(1);
                                return (
                                  <p className={`mb-6 leading-relaxed text-left text-base sm:text-lg ${
                                    wpTheme === 'editorial' ? 'font-serif text-stone-900' : 'font-sans text-slate-800'
                                  }`} {...props}>
                                    <span className={`float-left ${viewport === 'mobile' ? 'text-4xl mr-2' : 'text-5xl md:text-6xl mr-3'} font-black text-slate-900 dark:text-white leading-none ${
                                      wpTheme === 'editorial' ? 'font-serif text-[#064E5A] font-bold' : 'font-sans text-indigo-650'
                                    }`}>
                                      {firstChar}
                                    </span>
                                    {restText}
                                  </p>
                                );
                              }
                            }
                            if (hasBlock) {
                              return (
                                <div className={`mb-6 leading-relaxed text-base ${
                                  wpTheme === 'astra' ? 'text-slate-300 font-mono' : wpTheme === 'editorial' ? 'font-serif text-stone-900' : 'font-sans text-slate-800'
                                }`} {...props}>
                                  {children}
                                </div>
                              );
                            }
                            return (
                              <p className={`mb-6 leading-relaxed text-base ${
                                wpTheme === 'astra' ? 'text-slate-300 font-mono' : wpTheme === 'editorial' ? 'font-serif text-stone-900' : 'font-sans text-slate-800'
                              }`} {...props}>
                                {children}
                              </p>
                            );
                          },
                          ul: ({node, ...props}) => (
                            <ul className={`list-disc pl-6 mb-8 mt-2 space-y-3 ${
                              wpTheme === 'astra' ? 'text-slate-300 font-mono' : wpTheme === 'editorial' ? 'font-serif text-stone-900' : 'font-sans text-slate-800'
                            }`} {...props} />
                          ),
                          ol: ({node, ...props}) => (
                            <ol className={`list-decimal pl-6 mb-8 mt-2 space-y-3 ${
                              wpTheme === 'astra' ? 'text-slate-300 font-mono' : wpTheme === 'editorial' ? 'font-serif text-stone-900' : 'font-sans text-slate-800'
                            }`} {...props} />
                          ),
                          li: ({node, ...props}) => (
                            <li className="leading-relaxed pl-1.5 text-base" {...props} />
                          ),
                          blockquote: ({node, ...props}) => (
                            <blockquote className={`my-10 p-6 rounded-r-2xl border-l-4 ${
                              wpTheme === 'astra' 
                                ? 'border-cyan-500 bg-cyan-950/25 text-cyan-200 font-mono' 
                                : wpTheme === 'editorial'
                                  ? 'border-stone-800 bg-[#F5F4EE] text-stone-950 font-serif italic'
                                  : 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100 font-sans italic'
                            } shadow-md select-none`}>
                              <div className="text-base leading-relaxed mb-0 font-medium">{props.children}</div>
                            </blockquote>
                          ),
                          hr: ({node, ...props}) => (
                            <hr className={`my-10 border-t-2 border-dashed ${wpTheme === 'astra' ? 'border-slate-800' : 'border-stone-300'}`} {...props} />
                          ),
                          table: ({node, ...props}) => (
                            <div className="w-full my-10 overflow-hidden rounded-xl border border-slate-350 shadow-lg">
                              <div className="overflow-x-auto w-full max-w-full animate-fade-in">
                                <table className="w-full text-left border-collapse text-sm md:text-base font-sans" {...props} />
                              </div>
                            </div>
                          ),
                          thead: ({node, ...props}) => (
                            <thead className={`${wpTheme === 'astra' ? 'bg-slate-800/80 text-cyan-400 border-b border-slate-700' : wpTheme === 'editorial' ? 'bg-stone-200/80 text-stone-900 border-b border-stone-300 font-serif uppercase tracking-wider' : 'bg-neutral-100 text-neutral-900 border-b border-neutral-200 font-bold'} select-none`} {...props} />
                          ),
                          tbody: ({node, ...props}) => (
                            <tbody className="divide-y divide-slate-100/80" {...props} />
                          ),
                          tr: ({node, ...props}) => (
                            <tr className={`${wpTheme === 'astra' ? 'hover:bg-slate-800/40' : wpTheme === 'editorial' ? 'hover:bg-stone-50/50' : 'hover:bg-slate-50/50'} transition-all`} {...props} />
                          ),
                          th: ({node, ...props}) => (
                            <th className="px-4 py-3 md:px-5 md:py-3.5 font-bold uppercase tracking-wider text-[11px] md:text-xs select-none" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className={`px-4 py-3 md:px-5 md:py-3.5 ${wpTheme === 'astra' ? 'text-slate-300' : 'text-slate-700'} font-medium select-text`} {...props} />
                          ),
                          img: ({node, ...props}) => {
                            const activeInlineImageMode = saasConfig?.modelSettings?.inlineImageMode || "generate";
                            
                            // 1. Strip graphics mode:
                            if (activeInlineImageMode === 'none') {
                              return null;
                            }
                            
                            const altText = props.alt || "Editorial Illustration";
                            const isPromptOnly = (props.src && props.src.startsWith("#prompt-only:")) || activeInlineImageMode === 'promptOnly';
                            const promptText = (props.src && props.src.startsWith("#prompt-only:")) 
                              ? decodeURIComponent(props.src.replace("#prompt-only:", "")) 
                              : altText;

                            if (isPromptOnly) {
                              return (
                                <div className="w-full my-8 flex flex-col items-center select-none relative group">
                                  <div className="w-full rounded-2xl border-2 border-dashed border-violet-250 dark:border-slate-800 bg-violet-50/15 dark:bg-slate-900/40 p-6 md:p-8 flex flex-col items-center text-center gap-4 shadow-sm">
                                    <div className="p-2.5 bg-violet-100 dark:bg-violet-950/50 rounded-full text-violet-600 dark:text-violet-400">
                                      <Sparkles className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-lg">
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Offline Image Prompt Slot</span>
                                      <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-tight">Manual External Generation Enabled</span>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-2 italic bg-white dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-750 select-text text-center">
                                        "{promptText}"
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const fullPrompt = `Create a high-quality, professional 16:9 photorealistic editorial image for a blog article. Concept: "${promptText}". Beautiful composition, clear details, suitable for ${nicheId || 'general'} media, no text or overlays.`;
                                        navigator.clipboard.writeText(fullPrompt);
                                        alert("Visual generation prompt copied successfully! Paste this prompt into Midjourney, ChatGPT, or Gemini.");
                                      }}
                                      className="mt-2 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>COPY MULTIDIMENSIONAL PROMPT</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="w-full my-8 flex flex-col items-center select-none relative group">
                                <div className={`overflow-hidden rounded-2xl w-full border border-slate-200/90 shadow-lg ${
                                  viewport === 'mobile' ? 'max-h-[220px]' : 'max-h-[440px]'
                                }`}>
                                  <img 
                                    src={props.src} 
                                    alt={altText}
                                    className="w-full h-full object-cover transform hover:scale-[1.015] transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  
                                  {/* Browser Assistant Mode Alert for Inline Image */}
                                  {saasConfig?.modelSettings?.imageModel === 'browser-assistant' && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-4 text-center select-none backdrop-blur-[2px] opacity-100 transition-opacity">
                                      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col items-center gap-2 max-w-[280px] border border-indigo-200 dark:border-slate-700">
                                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 rounded-full">
                                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">Browser Generation Mode</span>
                                          <span className="text-[8px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Manual Visual Orchestration</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                          Create a custom visual using the prompt below.
                                        </p>
                                        <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button
                                          onClick={() => {
                                            const prompt = `Create a high-quality, professional 16:9 photorealistic blog header image for: "${altText}". It should be clean, modern, contextual to "${activeArticle?.title || 'this news story'}", and have no text annotations. Style: ${nicheId} journalism aesthetic.`;
                                            navigator.clipboard.writeText(prompt);
                                            alert("Visual generation prompt copied! Paste into Gemini, ChatGPT, or Midjourney.");
                                          }}
                                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>COPY GENERATION PROMPT</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className={`mt-3 px-4 py-1.5 border-l-2 border-indigo-600/70 ${
                                  wpTheme === 'astra' ? 'text-cyan-400 bg-slate-900/50' : wpTheme === 'editorial' ? 'font-serif text-stone-600 italic bg-[#FAF8F5]' : 'text-slate-500 bg-slate-50'
                                } text-xs rounded-r-lg w-full text-left font-medium tracking-wide flex justify-between items-center gap-2`}>
                                  <span>📸 {altText}</span>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Premium Media Asset</span>
                                </div>
                              </div>
                            );
                          },
                          a: ({node, href, children, ...props}) => {
                            const isYouTube = href && (href.includes("youtube.com") || href.includes("youtu.be"));
                            if (isYouTube) {
                              const text = children ? String(children) : "Watch related video updates and highlights";
                              return (
                                <YouTubePlayerBlock url={href} title={text} />
                              );
                            }
                            return (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-bold"
                                {...props}
                              >
                                {children} <ExternalLink className="w-3.5 h-3.5 inline" />
                              </a>
                            );
                          }
                        }}
                      >
                        {injectAdditionalMedia(editContent)}
                      </Markdown>
                    </article>
                  );
                })()}

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
              <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1">Real-time meta parser auditing SEO density, schema outputs, and editorial originality factors</p>
            </div>
            {activeArticle && (
              <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 select-none self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Compliance: {activeArticle.seo?.humanScore || 95}% Optimized</span>
              </div>
            )}
          </div>

          {!activeArticle ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 text-xs italic py-12">
              <BadgeAlert className="w-8 h-8 text-slate-300 mb-2" />
              Select an article to parse SEO metrics.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-fade-in">
              {/* Main Column: Editor Fields */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 font-mono">Rank Math Meta Editors</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8B8E96] mb-1">Focus Keyword</label>
                      <input
                        type="text"
                        value={editFocusKeyword}
                        onChange={(e) => setEditFocusKeyword(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200"
                        placeholder="e.g. Thick Mermaid Hair for Summer"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8B8E96] mb-1">URL Slug</label>
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                        placeholder="e.g. thick-mermaid-hair-summer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#8B8E96] mb-1">SEO Title (Rank Math Title)</label>
                    <input
                      type="text"
                      value={editSeoTitle}
                      onChange={(e) => setEditSeoTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                      placeholder="SEO Title"
                    />
                    <div className="flex justify-between items-center mt-1 text-[9px] text-slate-400 font-mono">
                      <span>Focus keyword near beginning represents ideal score weight.</span>
                      <span className={editSeoTitle.length > 60 ? "text-rose-500 font-bold" : "text-slate-500"}>
                        {editSeoTitle.length} / 60 chars
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8B8E96] mb-1">Meta Description (140 - 160 Chars)</label>
                      <textarea
                        rows={3}
                        value={editSeoDescription}
                        onChange={(e) => setEditSeoDescription(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans"
                        placeholder="Provide search snippets matching core context..."
                      />
                      <div className="flex justify-between items-center mt-1 text-[9px] text-slate-400 font-mono">
                        <span>Includes Focus Keyword</span>
                        <span className={(editSeoDescription.length < 140 || editSeoDescription.length > 160) ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                          {editSeoDescription.length} / 160 chars
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#8B8E96] mb-1">Featured Image Alt Text</label>
                      <textarea
                        rows={3}
                        value={editImageAlt}
                        onChange={(e) => setEditImageAlt(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans"
                        placeholder="Alt description with Focus Keyword... for Google Images..."
                      />
                      <div className="flex justify-between items-center mt-1 text-[9px] text-[#8B8E96] font-mono">
                        <span>Helps Rank Media search index</span>
                        <span>{editImageAlt.length} chars</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400">Save edits to trigger real-time SEO recalculation and audit.</span>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveChanges}
                      className="bg-[#3F5353] dark:bg-[#5F528E] text-white text-xs cursor-pointer font-bold px-4 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-sm active:scale-95 duration-100"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? "Saving..." : "Apply SEO Attributes"}
                    </button>
                  </div>
                </div>

                {/* Structured JSON Schema Output */}
                <div className="bg-[#F8F9FA] dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase font-bold text-[#8B8E95] tracking-wider font-mono">Structured JSON-LD Article Schema Snippet</span>
                    <span className="text-[9px] uppercase font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">Schema.org</span>
                  </div>
                  <pre className="p-3 bg-[#0D1219] text-[10px] text-emerald-400 font-mono rounded-lg overflow-x-auto max-h-[160px] border border-slate-850 select-all scrollbar-thin leading-relaxed">
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
                </div>
              </div>

              {/* Sidebar stats panel */}
              <div className="bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-850 pb-2">
                  <h4 className="text-xs font-bold uppercase text-[#0D1219] dark:text-slate-300 select-none">Rank Math Active Audit</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex items-center justify-center">
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                        {activeArticle.seoAuditReport?.estimated_rank_math_score || activeArticle.seo?.readabilityScore || 85}
                      </div>
                      <span className="text-xs text-slate-400 font-bold font-mono">/100</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      (activeArticle.seoAuditReport?.seo_ready || activeArticle.status !== 'manual_review')
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450"
                    }`}>
                      { (activeArticle.seoAuditReport?.seo_ready || activeArticle.status !== 'manual_review') ? "Optimized & Passed" : "SEO Held/Review" }
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10.5px] font-bold text-slate-400 uppercase font-mono tracking-wider">Audit Checklists</div>
                  
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* Render Passed Checks */}
                    {(activeArticle.seoAuditReport?.passed_checks || []).map((check: string, idx: number) => (
                      <div key={`pass-${idx}`} className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-905/10 p-2 rounded-lg text-xs leading-snug">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{check}</span>
                      </div>
                    ))}

                    {/* Render Failed Checks */}
                    {(activeArticle.seoAuditReport?.failed_checks || []).map((check: string, idx: number) => (
                      <div key={`fail-${idx}`} className="flex items-start gap-2 bg-rose-50/50 dark:bg-rose-905/5 border border-rose-100 dark:border-[#EB5757]/10 p-2 rounded-lg text-xs leading-snug">
                        <BadgeAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-rose-600 dark:text-rose-400">{check}</span>
                      </div>
                    ))}

                    {/* Fallback if no report */}
                    {(!activeArticle.seoAuditReport) && (
                      <div className="text-slate-400 text-xs italic">
                        Generate or edit this draft to construct standard Rank Math audit checklist profiles automatically.
                      </div>
                    )}
                  </div>
                </div>

                {activeArticle.status === "manual_review" && (
                  <div className="bg-rose-50/65 dark:bg-rose-950/10 p-3.5 border border-rose-100 dark:border-rose-900/40 rounded-xl select-none">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block mb-1 font-mono">Quality Alert: Held</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      This article is held under **Manual Review** due to failing critical SEO scores or containing unverified entities. It will NOT auto-publish to remote sites until issues are addressed.
                    </p>
                  </div>
                )}
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
