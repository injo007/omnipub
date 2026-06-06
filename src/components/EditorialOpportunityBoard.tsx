import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Filter, Search, ChevronDown, Award, ShieldAlert, Zap, 
  RefreshCw, FileText, CheckCircle2, XCircle, Clock, ExternalLink,
  MoreVertical, FileCode, SlidersHorizontal
} from 'lucide-react';
import { Article, Writer } from '../types';

interface BoardProps {
  articles: Article[];
  writers: Writer[];
  selectedNiche: string;
}

export default function EditorialOpportunityBoard({ articles, writers, selectedNiche }: BoardProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      if (a.niche !== selectedNiche) return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      return true;
    });
  }, [articles, selectedNiche, filterStatus, searchQuery]);

  return (
    <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-[#0D1219] dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
          <BookOpen className="w-5 h-5 text-rose-500" />
          Editorial Opportunity Control Center
        </h3>
        <div className="flex gap-2">
            <button className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <input 
              type="text"
              placeholder="Search articles..."
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Opp. Score</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Pipeline</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredArticles.map(art => (
              <tr key={art.id} className="hover:bg-slate-800/50">
                <td className="p-3 font-medium text-slate-200">{art.title}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${art.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {art.status}
                  </span>
                </td>
                <td className="p-3 text-slate-300">{art.opportunityScore || '-'}</td>
                <td className="p-3 text-slate-300">{art.riskScore || '-'}</td>
                <td className="p-3 text-slate-300 capitalize">{art.pipelineType || '-'}</td>
                <td className="p-3">
                  <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
