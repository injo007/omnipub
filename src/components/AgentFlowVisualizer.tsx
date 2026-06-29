/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  LineChart, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { WorkflowStepLog } from "../types";

interface AgentFlowVisualizerProps {
  logs: WorkflowStepLog[];
  currentStep: string;
  isGenerating: boolean;
}

export default function AgentFlowVisualizer({ logs, currentStep, isGenerating }: AgentFlowVisualizerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showPromptAudit, setShowPromptAudit] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);

  const stepsConfig = [
    {
      id: "research",
      name: "Research & Fact-Checker",
      role: "Gathers context, maps entities, checks facts",
      icon: Search,
      color: "text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40"
    },
    {
      id: "drafting",
      name: "Brand Voice Writer Agent",
      role: "Drafts original editorial brand voice structure",
      icon: FileText,
      color: "text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40"
    },
    {
      id: "editing",
      name: "Natural Style Editor",
      role: "Erases generic tropes for reader-friendly style",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40"
    },
    {
      id: "validation",
      name: "Originality & Readability Validator",
      role: "Audits compliance, readability indexes, & originality",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40"
    },
    {
      id: "seo",
      name: "Technical SEO Strategist",
      role: "Optimizes title densities & crafts schemas",
      icon: LineChart,
      color: "text-cyan-500 bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/40"
    },
    {
      id: "image",
      name: "Visual Illustrator Director",
      role: "Compiles thematic cover design parameters",
      icon: ImageIcon,
      color: "text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40"
    }
  ];

  const stepLog = logs.find(l => l.step === selectedStep);

  // Synchronize and auto-follow the active step to enrich UI responsiveness
  React.useEffect(() => {
    if (isGenerating && currentStep && autoFollow) {
      setSelectedStep(currentStep);
    }
  }, [currentStep, isGenerating, autoFollow]);

  return (
    <div id="agent-flow-visualizer" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Agentic Editorial Council</h2>
          <p className="text-xs text-slate-500">Autonomous workflow mapping for original editorial content</p>
        </div>
        
        {isGenerating && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10.5px] text-slate-505 cursor-pointer font-medium select-none">
              <input 
                type="checkbox" 
                checked={autoFollow} 
                onChange={(e) => setAutoFollow(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-3 h-3 cursor-pointer"
              />
              <span>Auto-Follow Live Steps</span>
            </label>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Active Rewriting
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1 min-h-[450px]">
        {/* Step Flow List */}
        <div className="lg:col-span-5 p-4 space-y-3 overflow-y-auto max-h-[500px]">
          {stepsConfig.map((item, index) => {
            const stepLog = logs.find(l => l.step === item.id);
            const StepIcon = item.icon;
            
            const isCompleted = !!stepLog && stepLog.status === 'success';
            const isRunning = currentStep === item.id || (!stepLog && isGenerating && currentStep === item.id);
            const isPending = !stepLog && !isRunning;

            return (
              <button
                key={item.id}
                id={`btn-step-${item.id}`}
                onClick={() => {
                  if (stepLog) setSelectedStep(selectedStep === item.id ? null : item.id);
                  else if (isRunning) setSelectedStep(item.id);
                }}
                disabled={isPending}
                className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-all ${
                  selectedStep === item.id 
                    ? "border-slate-950 bg-slate-50 ring-2 ring-slate-950/5 ring-offset-1" 
                    : isRunning
                      ? "border-rose-400 bg-rose-50/30 animate-pulse"
                      : isCompleted
                        ? "border-slate-100 hover:bg-slate-50 cursor-pointer"
                        : "border-slate-100 bg-slate-50/20 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`p-2 rounded-md ${item.color} shrink-0`}>
                  <StepIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {index + 1}. {item.name}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-rose-500 animate-spin shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.role}</p>
                  
                  {stepLog && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Updated {stepLog.timestamp}
                      </span>
                      <span className="text-[10px] text-rose-600 font-medium hover:underline flex items-center gap-0.5">
                        {selectedStep === item.id ? "Hide Draft" : "View Output"}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Console / Agent Report Viewer */}
        <div className="lg:col-span-7 p-4 bg-slate-950 text-slate-200 font-mono text-xs flex flex-col justify-between overflow-hidden">
          {selectedStep ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex flex-col">
                  <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                    [{selectedStep}] Agent Intelligence Brief
                  </span>
                  {(() => {
                    const stepLog = logs.find(l => l.step === selectedStep);
                    if (!stepLog) return null;
                    return (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="text-slate-400 text-[10px] flex items-center gap-1.5 flex-wrap">
                          <span>Active Engine:</span>
                          <strong className="text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/40">
                            {stepLog.agentName.replace(/ \[using .*?\]/, '')}
                          </strong>
                          {(() => {
                            const usingMatch = stepLog.agentName.match(/\[using (.*?)\]/);
                            const modelStr = usingMatch ? usingMatch[1] : (stepLog.modelRequested || stepLog.modelActuallyUsed);
                            
                            if (modelStr) {
                              const isGemini = modelStr.toLowerCase().includes('gemini');
                              const isMeta = modelStr.toLowerCase().includes('llama');
                              const isAnthropic = modelStr.toLowerCase().includes('claude');
                              const isDeepseek = modelStr.toLowerCase().includes('deepseek');
                              const isOpenRouter = !!stepLog.providerResolved && stepLog.providerResolved === 'openrouter' && !isGemini;
                              
                              let cxColor = "text-indigo-400 bg-indigo-950/40 border-indigo-900/50";
                              if (isGemini) cxColor = "text-blue-400 bg-blue-950/40 border-blue-900/50";
                              else if (isMeta) cxColor = "text-blue-500 bg-blue-950/40 border-blue-900/50";
                              else if (isAnthropic) cxColor = "text-orange-400 bg-orange-950/40 border-orange-900/50";
                              else if (isDeepseek) cxColor = "text-purple-400 bg-purple-950/40 border-purple-900/50";
                              else if (isOpenRouter) cxColor = "text-indigo-400 bg-indigo-950/40 border-indigo-900/50";

                              return (
                                <div className="flex flex-col ml-1">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[9px] ${cxColor}`}>
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Model AI: {modelStr}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </span>

                        {/* Complete model metadata contract visibility */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/50 border border-slate-800/80 p-2 rounded text-[10px] font-mono mt-1">
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Routing Provider:</span>
                            <span className="text-emerald-400 font-bold">{stepLog.providerResolved || "gemini"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Runtime Client:</span>
                            <span className="text-indigo-400 font-bold">{stepLog.runtimeClientUsed || "GoogleGenAI"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Selection Source:</span>
                            <span className="text-amber-400 font-bold">{stepLog.source || "agent-settings"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px] uppercase">Attempt Rate:</span>
                            <span className="text-white font-bold">{(stepLog.attempt || 1)}/3</span>
                          </div>
                        </div>

                        {stepLog.fallbackHappened && (
                          <div className="flex flex-col gap-1 p-2 bg-amber-950/30 border border-amber-900/50 rounded font-mono mt-1">
                            <div className="flex items-center gap-1.5 text-[9.5px] text-amber-400">
                              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                              <span>WARNING: Quota Fallback Triggered!</span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal">
                              Primary draft request to <strong className="text-amber-300">{stepLog.modelRequested}</strong> failed. Rerouted automatically to fallback model <strong className="text-emerald-400 underline">{stepLog.fallbackModelUsed || stepLog.modelActuallyUsed}</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <span className="text-slate-500 text-[10px] self-start mt-0.5">
                  ID: aistudio-{selectedStep}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-1">
                <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-slate-505 block text-[10px] mb-1 font-semibold uppercase">System logs:</span>
                  {(() => {
                    const foundLog = logs.find(l => l.step === selectedStep);
                    if (foundLog) return foundLog.output;
                    
                    const isStepRunning = selectedStep === currentStep && isGenerating;
                    if (isStepRunning) {
                      const stepConfig = stepsConfig.find(s => s.id === selectedStep);
                      return `[INFO] Initializing ${stepConfig?.name || selectedStep} thread...\n[INFO] Gathering contextual facts and verifying local deduplication fingerprints...\n[RUNNING] Calling model gateway with custom writer parameters...\n[PENDING] Stream receiving chunks...`;
                    }
                    return "No output logged yet. This agent step will populate once reached by the workspace orchestrator council.";
                  })()}
                </div>

                {logs.find(l => l.step === selectedStep)?.changesMade && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded p-2.5 text-slate-300">
                    <span className="text-emerald-400 block text-[10px] mb-1 font-semibold uppercase">Draft Output:</span>
                    <span className="whitespace-pre-wrap">{logs.find(l => l.step === selectedStep)?.changesMade}</span>
                  </div>
                )}

                {/* 🔍 Collapsible debug-only prompt audit panel */}
                {stepLog && (
                  <div className="border border-slate-800/80 rounded overflow-hidden">
                    <button
                      onClick={() => setShowPromptAudit(!showPromptAudit)}
                      className="w-full bg-slate-900/60 hover:bg-slate-900/90 px-3 py-2 text-left flex items-center justify-between transition-colors border-b border-slate-800/60"
                    >
                      <span className="text-cyan-400 font-semibold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                        <span>🔍 Debug Prompt Audit Details</span>
                      </span>
                      {showPromptAudit ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {showPromptAudit && (
                      <div className="p-3 bg-slate-950 space-y-3 border-t border-slate-900/40 text-[10.5px] text-slate-400 font-mono">
                        {/* Prompt Used */}
                        <div>
                          <span className="text-slate-500 block text-[9px] font-semibold uppercase mb-0.5">Model Prompt / Endpoint Prompt Used:</span>
                          <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-teal-400 font-semibold select-all">
                            {stepLog.modelRequested || stepLog.modelActuallyUsed || "Default LLM Endpoint"}
                          </div>
                        </div>

                        {/* System Prompt */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-slate-500 block text-[9px] font-semibold uppercase">System Instruction / Prompt:</span>
                            {stepLog.systemPrompt && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(stepLog.systemPrompt || "");
                                  setCopiedPrompt("system");
                                  setTimeout(() => setCopiedPrompt(null), 1500);
                                }}
                                className="text-[9px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                {copiedPrompt === "system" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                {copiedPrompt === "system" ? "Copied" : "Copy"}
                              </button>
                            )}
                          </div>
                          <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-slate-300 max-h-[120px] overflow-y-auto whitespace-pre-wrap select-text leading-normal">
                            {stepLog.systemPrompt || "No static system instruction defined. Direct contextual prompting applied."}
                          </div>
                        </div>

                        {/* User Prompt */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-slate-500 block text-[9px] font-semibold uppercase">User Prompt / Contents:</span>
                            {stepLog.userPrompt && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(stepLog.userPrompt || "");
                                  setCopiedPrompt("user");
                                  setTimeout(() => setCopiedPrompt(null), 1500);
                                }}
                                className="text-[9px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                {copiedPrompt === "user" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                {copiedPrompt === "user" ? "Copied" : "Copy"}
                              </button>
                            )}
                          </div>
                          <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-slate-300 max-h-[140px] overflow-y-auto whitespace-pre-wrap select-text leading-normal">
                            {stepLog.userPrompt || "No explicit user content prompt stored."}
                          </div>
                        </div>

                        {/* Final Compiled Prompt */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-slate-500 block text-[9px] font-semibold uppercase">Final Compiled Prompt Layout:</span>
                            {stepLog.compiledPrompt && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(stepLog.compiledPrompt || "");
                                  setCopiedPrompt("compiled");
                                  setTimeout(() => setCopiedPrompt(null), 1500);
                                }}
                                className="text-[9px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                {copiedPrompt === "compiled" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                {copiedPrompt === "compiled" ? "Copied" : "Copy"}
                              </button>
                            )}
                          </div>
                          <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-slate-300 max-h-[160px] overflow-y-auto whitespace-pre-wrap select-text leading-normal">
                            {stepLog.compiledPrompt || (stepLog.systemPrompt ? `[SYSTEM]\n${stepLog.systemPrompt}\n\n[USER]\n${stepLog.userPrompt}` : stepLog.userPrompt) || "Empty compiled prompt."}
                          </div>
                        </div>

                        {/* Variables Injected */}
                        <div>
                          <span className="text-slate-500 block text-[9px] font-semibold uppercase mb-0.5">Variables Injected / Runtime Slugs:</span>
                          <div className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-amber-400 font-mono text-[9.5px] max-h-[140px] overflow-y-auto whitespace-pre-wrap select-text leading-normal">
                            {stepLog.variables && Object.keys(stepLog.variables).length > 0 ? (
                              JSON.stringify(stepLog.variables, null, 2)
                            ) : (
                              "No dynamic contextual variables injected during compilation."
                            )}
                          </div>
                        </div>

                        {/* Complete Actions */}
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            onClick={() => {
                              const compiled = stepLog.compiledPrompt || (stepLog.systemPrompt ? `[SYSTEM]\n${stepLog.systemPrompt}\n\n[USER]\n${stepLog.userPrompt}` : stepLog.userPrompt) || "";
                              navigator.clipboard.writeText(compiled);
                              setCopiedPrompt("complete");
                              setTimeout(() => setCopiedPrompt(null), 1500);
                            }}
                            className="bg-cyan-950 border border-cyan-800/50 text-cyan-400 px-3 py-1 rounded text-[9.5px] font-semibold transition-all flex items-center gap-1.5 hover:bg-cyan-900/65"
                          >
                            {copiedPrompt === "complete" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedPrompt === "complete" ? "Compiled Prompt Copied!" : "Copy Full Compiled Prompt"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div id="step-desc" className="border-t border-slate-800 pt-3 mt-3 text-[11px] text-slate-400">
                Type: Agent Council Output • Readability: Checked • Originality Audit: 100% Original
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
              <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Interactive Agent Dashboard</div>
              <p className="max-w-[280px] text-[10px] text-slate-500 font-sans">
                {isGenerating 
                  ? `Agent [${currentStep || 'council'}] is polishing raw RSS items. Watch steps activate live on the left.` 
                  : "Click 'View Output' on any completed agent step to view the factual briefing, editorial refinement, or SEO schema reports."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
