import React, { useState } from "react";

interface ProviderHealthCheckProps {
  endpoint: "/api/saas-settings/test-gemini" | "/api/saas-settings/test-openrouter" | "/api/saas-settings/test-minimax";
  apiKey?: string;
  modelId: string;
}

/** Tests a provider using the currently edited credential without persisting it. */
export function ProviderHealthCheck({ endpoint, apiKey, modelId }: ProviderHealthCheckProps) {
  const [state, setState] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [message, setMessage] = useState("");

  const runCheck = async () => {
    setState("running");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, modelId }),
      });
      const result = await response.json();
      const passed = response.ok && result.status === "success";
      setState(passed ? "success" : "failed");
      setMessage(passed
        ? `${result.modelUsed || modelId} · ${result.latency ?? 0}ms`
        : (result.message || "Connection check failed."));
    } catch {
      setState("failed");
      setMessage("Could not reach the platform health-check endpoint.");
    }
  };

  const tone = state === "success" ? "text-emerald-600 dark:text-emerald-400" : state === "failed" ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400";
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={runCheck}
        disabled={state === "running"}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200 hover:border-indigo-400 disabled:cursor-wait disabled:opacity-60"
      >
        {state === "running" ? "Testing provider…" : "Test provider"}
      </button>
      {message && <p className={`break-words text-[8px] leading-relaxed ${tone}`}>{message}</p>}
    </div>
  );
}
