// ============================================================
// Provider Configuration Registry
// Each provider describes its voice options, requirements, etc.
// ============================================================

export type ProviderId = "gemini" | "openai" | "elevenlabs";

interface VoiceOption {
  id: string;
  label: string;
  gender: "male" | "female" | "neutral";
  tone: string; // e.g. "Warm & Professional"
}

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  description: string;
  model: string;
  voices: VoiceOption[];
  requiresRelay: boolean; // OpenAI / ElevenLabs require server-side proxy
  apiKeyLabel: string;
  apiKeySettingKey: string; // localStorage key
  extraSettings?: Array<{ key: string; label: string; placeholder: string }>;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    label: "Gemini Live",
    description:
      "Google's native real-time audio model. Sub-50ms end-to-end. Best multi-speaker, zero relay needed.",
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    requiresRelay: false,
    apiKeyLabel: "Gemini API Key",
    apiKeySettingKey: "gemini_api_key",
    voices: [
      { id: "Zephyr", label: "Zephyr", gender: "female", tone: "Bright & Conversational" },
      { id: "Puck", label: "Puck", gender: "male", tone: "Upbeat & Playful" },
      { id: "Charon", label: "Charon", gender: "male", tone: "Deep & Authoritative" },
      { id: "Kore", label: "Kore", gender: "female", tone: "Calm & Composed" },
      { id: "Fenrir", label: "Fenrir", gender: "male", tone: "Assertive & Confident" },
      { id: "Aoede", label: "Aoede", gender: "female", tone: "Warm & Empathetic" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI Realtime",
    description:
      "GPT-4o Realtime API with natural emotion and interruption handling. Requires server relay.",
    model: "gpt-4o-realtime-preview",
    requiresRelay: true,
    apiKeyLabel: "OpenAI API Key",
    apiKeySettingKey: "openai_api_key",
    voices: [
      { id: "alloy", label: "Alloy", gender: "neutral", tone: "Clear & Neutral" },
      { id: "echo", label: "Echo", gender: "male", tone: "Deep & Rich" },
      { id: "fable", label: "Fable", gender: "neutral", tone: "Warm & Expressive" },
      { id: "onyx", label: "Onyx", gender: "male", tone: "Authoritative" },
      { id: "nova", label: "Nova", gender: "female", tone: "Professional & Crisp" },
      { id: "shimmer", label: "Shimmer", gender: "female", tone: "Soft & Empathetic" },
    ],
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs ConvAI",
    description:
      "Most human-sounding voice synthesis. Best emotional range. Requires agent ID + API key.",
    model: "elevenlabs-conversational-v1",
    requiresRelay: true,
    apiKeyLabel: "ElevenLabs API Key",
    apiKeySettingKey: "elevenlabs_api_key",
    extraSettings: [
      { key: "elevenlabs_agent_id", label: "Agent ID", placeholder: "agent_xxxxxxxxxxxx" },
    ],
    voices: [
      { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel", gender: "female", tone: "Warm & Engaging" },
      { id: "AZnzlk1XvdvUeBnXmlld", label: "Domi", gender: "female", tone: "Strong & Confident" },
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        label: "Bella",
        gender: "female",
        tone: "Soothing Professional",
      },
      { id: "ErXwobaYiN019PkySvjV", label: "Antoni", gender: "male", tone: "Friendly & Upbeat" },
      { id: "MF3mGyEYCl7XYWbV9V6O", label: "Elli", gender: "female", tone: "Bright & Clear" },
      { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh", gender: "male", tone: "Deep & Direct" },
    ],
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

export function getApiKey(provider: ProviderId): string {
  const config = getProvider(provider);
  return localStorage.getItem(config.apiKeySettingKey) || "";
}

export function hasApiKey(provider: ProviderId): boolean {
  return !!getApiKey(provider);
}
