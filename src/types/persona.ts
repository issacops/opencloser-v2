import { ProviderId } from "../features/voice/lib/providers";

type AIVoiceId = string; // now any string — provider-specific voice IDs

export type SalesFramework =
  "SPIN Selling" | "Challenger Sale" | "Sandler System" | "Straight Line Persuasion";

export type VoicePreset =
  | "Friendly Professional"
  | "Assertive Closer"
  | "Empathetic Consultant"
  | "High-Energy Pitch"
  | "Custom";

export interface AIPersona {
  // Identity
  voiceId: AIVoiceId;
  language: string;
  framework: SalesFramework;
  provider: ProviderId;
  voicePreset: VoicePreset;

  // 5-Axis Emotional Modulation
  emotionalModulation: {
    empathy: number; // 0=Assertive → 100=Highly Empathetic
    energy: number; // 0=Calm → 100=High-Octane
    formality: number; // 0=Casual → 100=Professional
    assertiveness: number; // 0=Collaborative → 100=Pressure-Close
    humor: number; // 0=Serious → 100=Light Banter
    pacing: number; // 0=Deliberate → 100=Rapid-fire
    interruptionHandling: number; // 0=Never → 100=Highly interruptible
    dynamicToneShift: boolean; // Auto-adjust axes based on prospect behavior
  };

  // Speech Pattern Controls
  speechPatterns: {
    useFillers: boolean; // "um", "you know", "right"
    useMirroring: boolean; // Echo last 2-3 words of prospect
    useStrategicSilence: boolean; // Pause after objections
    nameDropFrequency: "never" | "low" | "medium" | "high";
  };
}

export const VOICE_PRESETS: Record<VoicePreset, Partial<AIPersona["emotionalModulation"]>> = {
  "Friendly Professional": {
    empathy: 70,
    energy: 60,
    formality: 55,
    assertiveness: 45,
    humor: 35,
    pacing: 60,
    interruptionHandling: 75,
    dynamicToneShift: true,
  },
  "Assertive Closer": {
    empathy: 40,
    energy: 85,
    formality: 60,
    assertiveness: 85,
    humor: 20,
    pacing: 80,
    interruptionHandling: 85,
    dynamicToneShift: true,
  },
  "Empathetic Consultant": {
    empathy: 90,
    energy: 45,
    formality: 50,
    assertiveness: 30,
    humor: 25,
    pacing: 40,
    interruptionHandling: 60,
    dynamicToneShift: true,
  },
  "High-Energy Pitch": {
    empathy: 50,
    energy: 95,
    formality: 40,
    assertiveness: 75,
    humor: 55,
    pacing: 90,
    interruptionHandling: 90,
    dynamicToneShift: true,
  },
  Custom: {},
};

export const DEFAULT_PERSONA: AIPersona = {
  voiceId: "Zephyr",
  language: "English (US)",
  framework: "SPIN Selling",
  provider: "gemini",
  voicePreset: "Friendly Professional",
  emotionalModulation: {
    empathy: 70,
    energy: 60,
    formality: 55,
    assertiveness: 45,
    humor: 35,
    pacing: 60,
    interruptionHandling: 75,
    dynamicToneShift: true,
  },
  speechPatterns: {
    useFillers: true,
    useMirroring: true,
    useStrategicSilence: true,
    nameDropFrequency: "medium",
  },
};
