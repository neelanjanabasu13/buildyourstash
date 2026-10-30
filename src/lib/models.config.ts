// One place to change which model does what, and which Nebius region serves it.
// baseUrl: null means "use NEBIUS_BASE_URL secret, or the default EU endpoint".
// To move a model to the US region, set baseUrl to NEBIUS_US_BASE_URL below.

export const NEBIUS_DEFAULT_BASE_URL = "https://api.tokenfactory.nebius.com/v1/";
export const NEBIUS_US_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1/";

export type ModelRole = "extract" | "reason" | "write";

export interface ModelConfig {
  model: string;
  baseUrl: string | null;
  maxTokens: number;
  temperature: number;
}

export const MODELS: Record<ModelRole, ModelConfig> = {
  // Extraction of ideas and flags (JSON). Nano is a reasoning model: it needs a big
  // output budget or it burns every token thinking and returns empty content.
  extract: { model: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", baseUrl: null, maxTokens: 16000, temperature: 0.1 },
  // Shared idea interests, research context and verdicts (JSON)
  reason: { model: "nvidia/nemotron-3-super-120b-a12b", baseUrl: null, maxTokens: 6000, temperature: 0.2 },
  // Revival kit writing
  write: { model: "nvidia/Nemotron-3-Ultra-550b-a55b", baseUrl: null, maxTokens: 4000, temperature: 0.6 },
};

export const TAVILY_URL = "https://api.tavily.com/search";

export const LIMITS = {
  sweepsPerDay: 20,
  maxPileChars: 30000,
  maxIdeas: 8,
};
