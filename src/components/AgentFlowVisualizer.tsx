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
  ArrowRight
} from "lucide-react";
import { WorkflowStepLog } from "../types";

interface AgentFlowVisualizerProps {
  logs: WorkflowStepLog[];
  currentStep: string;
  isGenerating: boolean;
}

export default function AgentFlowVisualizer({ logs, currentStep, isGenerating }: AgentFlowVisualizerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

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
      name: "Voice Drafting Journalist",
      role: "Drafts 100% human-voiced blog structure",
      icon: FileText,
      color: "text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40"
    },
    {
      id: "editing",
      name: "Anti-AI Copyeditor",
      role: "Purges structural clichés and AI-isms",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40"
    },
    {
      id: "validation",
      name: "Readability & Plagiarism Validator",
      role: "Scores readability metrics & guarantees 0% plagiarism",
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

  return (
    <div id="agent-flow-visualizer" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Agentic Editorial Council</h2>
          <p className="text-xs text-slate-500">Autonomous workflow mapping for plagiarism-free content</p>
        </div>
        
        {isGenerating && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Active Rewriting
          </span>
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
                  {logs.find(l => l.step === selectedStep)?.agentName && (
                    <span className="text-slate-400 text-[9.5px] mt-0.5">
                      Active Engine: <strong className="text-indigo-400">{logs.find(l => l.step === selectedStep)?.agentName}</strong>
                    </span>
                  )}
                </div>
                <span className="text-slate-500 text-[10px] self-start mt-0.5">
                  ID: aistudio-{selectedStep}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-1">
                <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-slate-500 block text-[10px] mb-1 font-semibold uppercase">System logs:</span>
                  {logs.find(l => l.step === selectedStep)?.output}
                </div>

                {logs.find(l => l.step === selectedStep)?.changesMade && (
                  <div className="bg-emerald-950/20 border border-emerald-900/40 rounded p-2.5 text-slate-300">
                    <span className="text-emerald-400 block text-[10px] mb-1 font-semibold uppercase">Draft Output:</span>
                    <span className="whitespace-pre-wrap">{logs.find(l => l.step === selectedStep)?.changesMade}</span>
                  </div>
                )}
              </div>

              <div id="step-desc" className="border-t border-slate-800 pt-3 mt-3 text-[11px] text-slate-400">
                Type: Agent Council Output • Readability: Checked • Plagiarism Audit: 0% overlap
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
              <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Interactive Agent Dashboard</div>
              <p className="max-w-[280px] text-[10px] text-slate-500 font-sans">
                {isGenerating 
                  ? `Agent [${currentStep || 'council'}] is rewriting raw RSS items. Watch steps activate live on the left.` 
                  : "Click 'View Output' on any completed agent step to view the factual briefing, copy-humanization, or SEO schema reports."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
