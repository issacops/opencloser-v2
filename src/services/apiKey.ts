// Central access to locally stored API keys and demo-mode detection.

export function getGeminiKey(): string | undefined {
  const key = localStorage.getItem("gemini_api_key");
  return key ? key : undefined;
}

export interface LocalAIConfig {
  ollamaBaseUrl: string;
  ollamaModel: string;
}

/** Local Ollama settings — empty strings mean offline mode is not configured. */
export function getLocalAIConfig(): LocalAIConfig {
  return {
    ollamaBaseUrl: localStorage.getItem("ollama_base_url") || "",
    ollamaModel: localStorage.getItem("ollama_model") || "",
  };
}

export function isOllamaConfigured(): boolean {
  return !!(localStorage.getItem("ollama_base_url") || "").trim();
}

function hasAnyVoiceKey(): boolean {
  return !!(
    localStorage.getItem("gemini_api_key") ||
    localStorage.getItem("openai_api_key") ||
    localStorage.getItem("elevenlabs_api_key")
  );
}

/** Demo mode: no cloud keys and no local Ollama — AI falls back to canned data. */
export function isDemoMode(): boolean {
  return !hasAnyVoiceKey() && !isOllamaConfigured();
}
