import React from "react";
import { ModelSettings } from "../types";

interface AgentModelSelectorProps {
  label: string;
  badge: string;
  modelKey: keyof ModelSettings;
  customModelKey: keyof ModelSettings;
  fallbackModelKey: keyof ModelSettings;
  fallbackCustomModelKey: keyof ModelSettings;
  settings: ModelSettings;
  onChange: (updates: Partial<ModelSettings>) => void;
  optionsMode?: "text" | "image";
}

export function AgentModelSelector({
  label,
  badge,
  modelKey,
  customModelKey,
  fallbackModelKey,
  fallbackCustomModelKey,
  settings,
  onChange,
  optionsMode = "text",
  children
}: AgentModelSelectorProps & { children?: React.ReactNode }) {
  const modelValue = settings[modelKey] || (optionsMode === "image" ? "imagen-4.0-generate-001" : "gemini-3.5-flash");
  const fallbackModelValue = settings[fallbackModelKey] || "global";

  const renderOptions = () => {
    if (optionsMode === "image") {
      return (
        <>
          <option value="imagen-4.0-generate-001">Google Imagen 4 Premium ✨</option>
          <option value="gemini-3.1-pro-image">Google Imagen 3.1 Pro ✦</option>
          <option value="gemini-2.5-flash-image">Google Nano Banana Image ✦</option>
          <option value="dall-e-3">ChatGPT Images 2.0 (OpenAI)</option>
          <option value="browser-assistant">🌐 Browser Assistant (Click & Paste)</option>
          <option value="custom-image">✦ Custom Image Model Engine</option>
        </>
      );
    }
    return (
      <>
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
        <optgroup label="MiniMax" className="text-rose-400 font-mono text-[10px]">
          <option value="custom-minimax">✦ Custom MiniMax Model</option>
          <option value="minimax/abab6.5g-chat">abab6.5g Chat</option>
          <option value="minimax/abab7-chat">abab7 Chat</option>
        </optgroup>
      </>
    );
  };

  const isCustom = modelValue === "custom-openrouter" || modelValue === "custom-minimax" || modelValue === "custom-image";
  const isFallbackCustom = fallbackModelValue === "custom-openrouter" || fallbackModelValue === "custom-minimax" || fallbackModelValue === "custom-image";

  const getPlaceholderText = (isFallback: boolean) => {
    if (optionsMode === "image") return "e.g. Nanobana....";
    const activeVal = isFallback ? fallbackModelValue : modelValue;
    if (activeVal === "custom-minimax") return "e.g. minimax/abab6.5g-chat";
    return "e.g. openrouter/free";
  };

  return (
    <div className="bg-[#ffffff] dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-2 relative group hover:border-indigo-500/30 transition-colors">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-extrabold text-[#7c3aed] uppercase tracking-widest font-mono">
          {label}
        </label>
        <span className="text-[8px] px-1 bg-violet-950/40 text-violet-300 border border-violet-800/20 rounded font-mono font-bold">
          {badge}
        </span>
      </div>
      
      <div className="flex flex-col space-y-2.5">
        <div>
          <label className="text-[8px] text-slate-500 dark:text-slate-400 font-bold mb-1 block">Primary Model</label>
          <select
            value={modelValue as string}
            onChange={(e) => onChange({ [modelKey]: e.target.value })}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {renderOptions()}
          </select>
        </div>

        {isCustom && (
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-in fade-in zoom-in duration-200 shadow-inner">
            <label className="text-[9px] font-extrabold text-indigo-400 block mb-1.5 uppercase tracking-widest font-mono">
              ✨ Custom Model ID
            </label>
            <input
              type="text"
              placeholder={getPlaceholderText(false)}
              value={(settings[customModelKey] as string) || ""}
              onChange={(e) => onChange({ [customModelKey]: e.target.value })}
              className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
            />
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
          <label className="text-[8px] text-amber-500 font-bold mb-1 block">Fallback Model</label>
          <select
            value={fallbackModelValue as string}
            onChange={(e) => onChange({ [fallbackModelKey]: e.target.value })}
            className="w-full text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-slate-600 dark:text-slate-400 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="global">Use Global Fallback</option>
            {renderOptions()}
            <option value="none">Disable Fallback for this Agent</option>
          </select>
        </div>

        {isFallbackCustom && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-in fade-in zoom-in duration-200 shadow-inner">
            <label className="text-[9px] font-extrabold text-amber-400 block mb-1.5 uppercase tracking-widest font-mono">
              ⚠️ Fallback Custom Model ID
            </label>
            <input
              type="text"
              placeholder={getPlaceholderText(true)}
              value={(settings[fallbackCustomModelKey] as string) || ""}
              onChange={(e) => onChange({ [fallbackCustomModelKey]: e.target.value })}
              className="w-full text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-amber-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-sm"
            />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
