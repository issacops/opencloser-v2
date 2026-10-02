import { invoke } from "@tauri-apps/api/core";
import type { ICP } from "../types";
import { getGeminiKey, getLocalAIConfig } from "./apiKey";

export async function processOnboardingChat(
  messages: { role: string; content: string }[],
): Promise<{ isComplete: boolean; reply?: string; icp?: ICP }> {
  return invoke("process_onboarding_chat", {
    messages,
    apiKey: getGeminiKey(),
    ...getLocalAIConfig(),
  });
}
