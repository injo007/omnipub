import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Terminal, 
  Search, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  X, 
  Settings, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ArrowDownCircle,
  HelpCircle
} from "lucide-react";

interface LiveLogEntry {
  timestamp: string;
  severity: string;
  message: string;
  environment?: string;
  service?: string;
  [key: string]: any;
}

interface LiveServerLogViewerProps {
  onClose: () => void;
}

export const LiveServerLogViewer: React.FC<LiveServerLogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LiveLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [limit, setLimit] = useState(300);
  const [autoScroll, setAutoScroll] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogs(data);
        setErrorMsg(null);
      }
    } catch (err: any) {
      console.error("Failed to stream live server logs:", err);
      setErrorMsg("Failed to connect to the server log stream. Retrying...");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll server logs
  useEffect(() => {
    fetchLogs();
    
    if (!isLive) return;

    const intervalId = setInterval(() => {
      fetchLogs();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isLive, limit]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    setLogs([]);
  };

  const getSeverityStyles = (severity: string) => {
    const s = String(severity).toUpperCase();
    if (s === "ERROR" || s === "CRITICAL") {
      return {
        bg: "bg-rose-950/40 text-rose-400 border-rose-900/50",
        badge: "bg-rose-500 text-white",
        text: "text-rose-400",
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      };
    }
    if (s === "WARN" || s === "WARNING") {
      return {
        bg: "bg-amber-950/40 text-amber-400 border-amber-900/50",
        badge: "bg-amber-500 text-black",
        text: "text-amber-300",
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      };
    }
    if (s === "SUCCESS") {
      return {
        bg: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
        badge: "bg-emerald-500 text-white",
        text: "text-emerald-400",
        icon: <CheckCircle className="w-3.5 h-3.5" />
      };
    }
    return {
      bg: "bg-slate-900 text-slate-300 border-slate-800",
      badge: "bg-indigo-600 text-white",
      text: "text-slate-300",
      icon: <Info className="w-3.5 h-3.5" />
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = searchTerm.toLowerCase();
      
      // Handle searching across JSON structure or message
      const logString = JSON.stringify(log).toLowerCase();
      const matchesSearch = logString.includes(term);

      const matchesSeverity = 
        severityFilter === "all" || 
        String(log.severity).toUpperCase() === severityFilter.toUpperCase();

      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchTerm, severityFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        id="live-logs-modal"
        className="flex flex-col w-full max-w-6xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-900">
              <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Live Container Terminal Logs
                </h3>
                {isLive ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Real-time active container stdout & system agent outputs
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/50 border-b border-slate-850">
          
          {/* Search and severity filters */}
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search log output..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Severities</option>
                <option value="info">INFO</option>
                <option value="warn">WARN</option>
                <option value="error">ERROR</option>
                <option value="critical">CRITICAL</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="100">Last 100 lines</option>
                <option value="300">Last 300 lines</option>
                <option value="500">Last 500 lines</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                isLive
                  ? "bg-amber-950/30 text-amber-400 border-amber-900/50 hover:bg-amber-900/20"
                  : "bg-indigo-950/30 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/20"
              }`}
              title={isLive ? "Pause auto-streaming" : "Resume auto-streaming"}
            >
              {isLive ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE STREAM</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RESUME LIVE</span>
                </>
              )}
            </button>

            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
              title="Force manual refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 transition cursor-pointer"
              title="Clear screen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                autoScroll
                  ? "bg-indigo-950/30 text-indigo-400 border-indigo-900/50"
                  : "text-slate-400 border-slate-800 hover:text-white"
              }`}
              title="Auto scroll to bottom"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Error Alert Bar */}
        {errorMsg && (
          <div className="bg-rose-950/40 border-b border-rose-900/50 px-6 py-2 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Logs Terminal Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-slate-950 text-[#F1F5F9] font-mono text-xs leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800"
        >
          {isLoading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs uppercase tracking-widest font-black">Connecting to system daemon...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 select-none">
              <Terminal className="w-8 h-8 text-slate-700" />
              <p className="text-xs uppercase tracking-widest font-black">Terminal Buffer Empty</p>
              <p className="text-[10px] text-slate-600">No logs matching search criteria were loaded.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log, index) => {
                const styles = getSeverityStyles(log.severity);
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
                
                // Formulate metadata block safely
                const metaKeys = ["agentName", "step", "modelActuallyUsed", "providerResolved"];
                const metaBlock = metaKeys
                  .filter(k => log[k])
                  .map(k => `${k === "modelActuallyUsed" ? "model" : k === "providerResolved" ? "provider" : k}:${log[k]}`)
                  .join(" | ");

                return (
                  <div 
                    key={index} 
                    className="group border border-transparent hover:border-slate-850 hover:bg-slate-900/20 py-1 px-2.5 rounded transition flex items-start gap-3.5"
                  >
                    {/* Timestamp */}
                    <span className="text-slate-600 select-none whitespace-nowrap shrink-0 pt-0.5">
                      [{dateStr || "00:00:00"}]
                    </span>

                    {/* Severity Tag */}
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.25 rounded tracking-wide shrink-0 font-sans select-none ${styles.text}`}>
                      {log.severity || "INFO"}
                    </span>

                    {/* Main Log Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-200 break-words whitespace-pre-wrap selection:bg-indigo-500/35 selection:text-white">
                        {log.message}
                      </span>

                      {/* Display key-value metadata if present */}
                      {metaBlock && (
                        <div className="mt-1 text-[10px] text-indigo-400/80 font-semibold select-all">
                          &raquo; {metaBlock}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Terminal Footer Info Bar */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-850 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-3">
            <span>Lines: <strong className="text-slate-350">{filteredLogs.length}</strong></span>
            <span>All logs in buffer: <strong className="text-indigo-400">{logs.length}</strong></span>
            <span>Environment: <strong className="text-emerald-400">{logs[0]?.environment || "production"}</strong></span>
          </div>
          <div>
            <span>Poller Rate: <strong>2s</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
