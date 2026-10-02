import { invoke } from "@tauri-apps/api/core";
import type { ICP } from "../types";
import { getGeminiKey, getLocalAIConfig } from "./apiKey";

export interface LeadResult {
  name: string;
  company: string;
  phone: string;
  email: string;
  title: string;
  linkedin_url: string;
  score: number;
}

export interface CallAnalysis {
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative" | "Mixed";
  objectionsRaised: string[];
  keyInsights: string[];
  nextSteps: string[];
  followUpEmail: string;
  emailSubject: string;
}

export async function simulateLeadScraping(
  query: string,
  location: string,
  icp: ICP | null,
): Promise<LeadResult[]> {
  return invoke("simulate_lead_scraping", {
    query,
    location,
    icp,
    apiKey: getGeminiKey(),
    ...getLocalAIConfig(),
  });
}

export async function analyzeCallTranscript(
  transcript: string,
  leadName: string,
  leadCompany: string,
  icp: string | null,
): Promise<CallAnalysis> {
  return invoke("analyze_call_transcript", {
    transcript,
    leadName,
    leadCompany,
    icp,
    apiKey: getGeminiKey(),
    ...getLocalAIConfig(),
  });
}

export interface ObjectionTrainerResponse {
  role: string;
  text: string;
  is_complete: boolean;
  score?: number;
  strengths: string[];
  improvements: string[];
  rebuttal_tip: string;
}

export async function objectionTrainerTurn(req: {
  mode: string;
  objection: string;
  difficulty: string;
  messages: { role: string; text: string }[];
  icp: ICP | null;
}): Promise<ObjectionTrainerResponse> {
  return invoke("objection_trainer_turn", {
    req: { ...req, apiKey: getGeminiKey(), ...getLocalAIConfig() },
  });
}
