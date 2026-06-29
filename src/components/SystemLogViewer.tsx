import React, { useState, useMemo } from 'react';
import { Article, WorkflowStepLog } from '../types';
import { Search, Loader2, CheckCircle2, XCircle, Terminal, HardDrive, Cpu, AlertCircle, BadgeAlert } from 'lucide-react';
import Markdown from 'react-markdown';

interface SystemLogViewerProps {
  articles: Article[];
}

const parseLogTimestamp = (str: string): Date => {
  if (!str) return new Date();
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Try to parse simple time-only strings on current local day, e.g. "16:12:49" or "4:19 PM"
  const today = new Date();
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const meridiem = match[4];
    
    if (meridiem) {
      if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    today.setHours(hours, minutes, seconds, 0);
    return today;
  }
  return parsed; // Fallback
};

export const SystemLogViewer: React.FC<SystemLogViewerProps> = ({ articles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');

  // Flatten and sort logs (newest first)
  const allLogs = useMemo(() => {
    const logs: Array<{
      log: WorkflowStepLog;
      articleId: string;
      articleTitle: string;
    }> = [];

    articles.forEach(article => {
      if (article.workflowLogs && Array.isArray(article.workflowLogs)) {
        article.workflowLogs.forEach(log => {
          logs.push({
            log,
            articleId: article.id,
            articleTitle: article.title || article.sourceTitle || 'Untitled Article',
          });
        });
      }
    });

    const sorted = logs.sort((a, b) => parseLogTimestamp(b.log.timestamp).getTime() - parseLogTimestamp(a.log.timestamp).getTime());
    
    // Deduplicate 'running' logs to avoid log clutter
    const deduplicated: typeof logs = [];
    const seenCompleted = new Set<string>();
    const seenRunning = new Set<string>();
    const now = Date.now();
    
    for (const entry of sorted) {
      const clonedLog = { ...entry.log };
      const logDate = parseLogTimestamp(clonedLog.timestamp);
      const logTime = logDate.getTime();
      
      // Auto-interrupt stale agent runs: more than 5 minutes old is physically impossible to still be running actively
      if (clonedLog.status === 'running' && !isNaN(logTime) && (now - logTime) > 5 * 60 * 1000) {
        clonedLog.status = 'interrupted';
        clonedLog.output = `${clonedLog.output || ''}\n\n[SYSTEM INTEGRITY SHIELD] Process exceeded max safe runtime thresholds. Interrupted cleanly due to server recycle, client timeout, or task completion.`;
      }
      
      const entryWithClonedLog = { ...entry, log: clonedLog };
      const taskKey = `${entryWithClonedLog.articleId}-${entryWithClonedLog.log.agentName}-${entryWithClonedLog.log.step}`;
      
      if (['success', 'failed', 'error', 'warn', 'interrupted'].includes(entryWithClonedLog.log.status)) {
        seenCompleted.add(taskKey);
        deduplicated.push(entryWithClonedLog);
      } else if (entryWithClonedLog.log.status === 'running') {
        // Only show a 'running' log if we haven't seen a completion log for this task AND we haven't already shown a newer running log
        if (!seenCompleted.has(taskKey) && !seenRunning.has(taskKey)) {
          deduplicated.push(entryWithClonedLog);
          seenRunning.add(taskKey);
        }
      } else {
        deduplicated.push(entryWithClonedLog);
      }
    }

    return deduplicated;
  }, [articles]);

  const agents = useMemo(() => {
    const agentSet = new Set<string>();
    allLogs.forEach(entry => agentSet.add(entry.log.agentName));
    return Array.from(agentSet);
  }, [allLogs]);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return allLogs.filter((entry) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        entry.log.agentName.toLowerCase().includes(term) ||
        entry.log.output?.toLowerCase().includes(term) ||
        entry.log.providerResolved?.toLowerCase().includes(term) ||
        entry.log.modelActuallyUsed?.toLowerCase().includes(term) ||
        entry.log.step.toLowerCase().includes(term) ||
        entry.articleTitle.toLowerCase().includes(term);
        
      const matchStatus = filterStatus === 'all' || entry.log.status === filterStatus;
      const matchAgent = filterAgent === 'all' || entry.log.agentName === filterAgent;

      return matchSearch && matchStatus && matchAgent;
    });
  }, [allLogs, searchTerm, filterStatus, filterAgent]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'interrupted':
        return <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'failed':
      case 'error':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'running':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'interrupted':
        return 'text-slate-500 bg-slate-500/10 border-slate-500/20 dark:text-slate-400 dark:bg-slate-400/10 dark:border-slate-400/10';
      default:
        return 'text-slate-400 bg-slate-800/50 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full space-y-4">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border-[#E3E5E8] dark:border-slate-805/85 p-6 shadow-sm shrink-0">
        <h4 className="text-xl font-black text-[#0D1219] dark:text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
          <Terminal className="w-6 h-6 text-indigo-500" />
          Unified System Log Console
        </h4>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by agent, error, provider, or concept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-[#0D1219] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0D1219] dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed / Error</option>
              <option value="running">Running</option>
              <option value="interrupted">Interrupted / Stale</option>
            </select>

            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0D1219] dark:text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto w-full pr-2 space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-2xl border border border-[#E3E5E8] dark:border-slate-805/85 shadow-sm text-center">
             <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
             <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-wide uppercase">No Telemetry Logs Found</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mt-2">
                 The search query or filter combination did not match any operational logs.
             </p>
          </div>
        ) : (
          filteredLogs.map((entry, index) => (
            <div 
              key={`${entry.articleId}-${index}`}
              className="bg-white dark:bg-[#121620]/60 backdrop-blur-xl rounded-xl border border-[#E3E5E8] dark:border-slate-805/85 p-4 shadow-sm"
            >
              <div className="flex flex-col xl:flex-row gap-4 xl:gap-8 justify-between">
                
                {/* Left col - Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(entry.log.status)}`}>
                      {getStatusIcon(entry.log.status)}
                      {entry.log.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {entry.log.agentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {parseLogTimestamp(entry.log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                     Task: {entry.articleTitle} &mdash; Step: {entry.log.step}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                    {entry.log.output}
                    
                    {entry.log.output?.includes("429") && (
                      <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] text-amber-700 dark:text-amber-400 font-sans font-bold flex items-center gap-2">
                        <BadgeAlert className="w-4 h-4 shrink-0" />
                        <span>QUOTA EXCEEDED: Try switching the Agent to "🌐 Browser Assistant" in Settings to generate images manually via Gemini Studio or ChatGPT.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col - Metadata block */}
                {(entry.log.providerResolved || entry.log.modelActuallyUsed) && (
                  <div className="xl:w-64 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 pt-3 xl:pt-0 xl:pl-5 space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3" /> Execution Metadata
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      {entry.log.providerResolved && (
                        <div className="col-span-2 bg-slate-100 dark:bg-slate-800/50 rounded-md p-2">
                          <span className="text-slate-400 block mb-0.5">Provider:</span>
                          <span className="text-[#0D1219] dark:text-white font-bold">{entry.log.providerResolved}</span>
                        </div>
                      )}
                      
                      {entry.log.modelActuallyUsed && (
                        <div className="col-span-2 bg-slate-100 dark:bg-slate-800/50 rounded-md p-2">
                          <span className="text-slate-400 block mb-0.5">Model:</span>
                          <span className="text-emerald-500 dark:text-emerald-400 font-bold">{entry.log.modelActuallyUsed}</span>
                        </div>
                      )}

                      {entry.log.fallbackHappened && (
                        <div className="col-span-2 border border-amber-500/20 bg-amber-500/5 rounded-md p-2 text-amber-600 dark:text-amber-400 font-bold">
                          ⚠️ Fallback Event Triggered
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
