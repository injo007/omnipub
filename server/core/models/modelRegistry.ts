/**
 * Provider-neutral model routing metadata.
 *
 * A model can be selected per agent without coupling editorial workflow code to
 * a provider SDK. Provider adapters still own transport/authentication; this
 * registry owns deterministic route resolution and capability declarations.
 */

export type ModelProvider = "gemini" | "openrouter" | "minimax";
export type ModelCapability = "text" | "json" | "image";

export type ModelRoute = {
  provider: ModelProvider;
  modelId: string;
  capabilities: ModelCapability[];
};

const GEMINI_PREFIXES = ["gemini-", "models/gemini-", "imagen-"];

function imageCapabilities(modelId: string): ModelCapability[] {
  const normalized = modelId.toLowerCase();
  if (normalized.includes("imagen") || normalized.includes("image") || normalized.includes("dall-e")) {
    return ["image"];
  }
  return ["text", "json"];
}

/**
 * Resolves a user-selected model to the provider that owns the API call.
 * Explicit `provider:model` prefixes let administrators override inference
 * safely when a model name is ambiguous.
 */
export function resolveModelRoute(input: string | undefined | null): ModelRoute {
  const raw = (input || "").trim();
  const normalized = raw.toLowerCase();

  if (normalized.startsWith("gemini:")) {
    const modelId = raw.slice("gemini:".length).trim();
    return { provider: "gemini", modelId, capabilities: imageCapabilities(modelId) };
  }
  if (normalized.startsWith("minimax:")) {
    const modelId = raw.slice("minimax:".length).trim();
    return { provider: "minimax", modelId, capabilities: imageCapabilities(modelId) };
  }
  if (normalized.startsWith("openrouter:")) {
    const modelId = raw.slice("openrouter:".length).trim();
    return { provider: "openrouter", modelId, capabilities: imageCapabilities(modelId) };
  }

  // MiniMax's direct API accepts MiniMax-M* and minimax/* model identifiers.
  if (normalized.startsWith("minimax/") || normalized.startsWith("minimax-") || normalized.includes("abab")) {
    return { provider: "minimax", modelId: raw, capabilities: imageCapabilities(raw) };
  }

  if (GEMINI_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return { provider: "gemini", modelId: raw, capabilities: imageCapabilities(raw) };
  }

  // OpenRouter is the extensibility boundary for all other text-model slugs:
  // OpenAI, Anthropic, DeepSeek, Cohere, Llama, Qwen, Kimi, etc.
  return { provider: "openrouter", modelId: raw, capabilities: imageCapabilities(raw) };
}

export function resolveModelProvider(input: string | undefined | null): ModelProvider {
  return resolveModelRoute(input).provider;
}
