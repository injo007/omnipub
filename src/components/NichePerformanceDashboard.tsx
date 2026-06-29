import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { TrendingUp, Activity, BarChart2, Search, Filter, FilterX, FileText } from 'lucide-react';

interface NichePerformanceDashboardProps {
  selectedNiche: string;
  articles: any[];
  niches: any[];
}

export function NichePerformanceDashboard({ selectedNiche, articles, niches }: NichePerformanceDashboardProps) {
  const currentNicheObj = niches.find(n => n.id === selectedNiche);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const trendData = useMemo(() => {
    // Generate actual trend data based on articles creation dates
    const daysMap = new Map<string, { name: string, engagement: number, publications: number, clicks: number }>();
    
    // Initialize last 7 days with zero
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      daysMap.set(dateStr, { name: dateStr, engagement: 0, publications: 0, clicks: 0 });
    }

    // Populate data
    articles.forEach(article => {
      // only count for the selected niche if valid
      if (selectedNiche !== "all" && article.niche !== selectedNiche) return;

      const dateStr = new Date(article.createdAt || article.pubDate || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (daysMap.has(dateStr)) {
        const stats = daysMap.get(dateStr)!;
        stats.publications += 1;
        // Approximation of engagement/clicks based on real opportunity score 
        const baseScore = article.opportunityScore || 10;
        stats.engagement += Math.floor(baseScore * 0.5);
        stats.clicks += Math.floor(baseScore * 2);
      }
    });

    return Array.from(daysMap.values());
  }, [articles, selectedNiche]);

  const nicheStats = useMemo(() => {
    return niches.map(n => ({
      name: n.name,
      totalArticles: articles.filter((a: any) => a.niche === n.id).length
    }));
  }, [articles, niches]);

  const selectedNicheArticlesList = useMemo(() => {
    return articles.filter(a => selectedNiche === "all" ? true : a.niche === selectedNiche);
  }, [articles, selectedNiche]);

  const filteredArticles = useMemo(() => {
    return selectedNicheArticlesList.filter(article => {
      const matchSearch = article.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.sourceTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || article.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [selectedNicheArticlesList, searchQuery, statusFilter]);

  const selectedNicheArticles = selectedNicheArticlesList.length;

  const avgClickRate = selectedNicheArticles > 0 
    ? (selectedNicheArticlesList.reduce((acc, a) => acc + (a.opportunityScore || 50), 0) / selectedNicheArticles / 10).toFixed(1) + "%"
    : "0.0%";
  
  const estEngagement = selectedNicheArticles > 0 
    ? "+" + Math.floor(selectedNicheArticles * 5) + "%"
    : "0%";

  return (
    <div className="space-y-6 flex flex-col w-full">
      <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm overflow-hidden flex-shrink-0">
        <h3 className="text-sm font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-widest flex items-center gap-2.5 font-mono">
          <Activity className="w-5 h-5 text-indigo-500" />
          Niche Performance Dashboard
        </h3>
        <p className="text-xs text-[#8B8E96] dark:text-slate-400 mt-1 leading-relaxed font-sans mb-4">
          Monitor publication rate and engagement trends for your configured niches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Articles</h4>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedNicheArticles}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">In {currentNicheObj?.name || (selectedNiche === 'all' ? 'All Niches' : selectedNiche)}</p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Est. Engagement</h4>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{estEngagement}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">Weekly Growth Rate</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Avg. Click Rate</h4>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{avgClickRate}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">Opp. Score Adjusted</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-64 mb-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col bg-white dark:bg-slate-950">
             <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 tracking-widest uppercase font-mono">Engagement Trends</h4>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trendData}>
                   <defs>
                     <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                   <YAxis fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff' }} />
                   <Area type="monotone" dataKey="engagement" stroke="#6366f1" fillOpacity={1} fill="url(#colorEngage)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>
          
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col bg-white dark:bg-slate-950">
             <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 tracking-widest uppercase font-mono">Articles Created by Niche</h4>
             <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={nicheStats}>
                   <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                   <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff' }} cursor={{fill: 'transparent'}} />
                   <Bar dataKey="totalArticles" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                 </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}