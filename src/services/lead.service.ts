import { invoke } from "@tauri-apps/api/core";
import { Lead, LeadStatus } from "../types";

export interface CallLog {
  id: string;
  lead_id: string;
  duration_seconds: number;
  transcript: string;
  status: string;
  sentiment?: string;
  created_at: string;
  lead_name: string | null;
  lead_company: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

export async function getLeads(): Promise<Lead[]> {
  return invoke("get_leads");
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  return invoke("update_lead_status", { id, status });
}

export async function addLeads(
  leads: { id: string; name: string; company: string; phone: string; score: number }[],
): Promise<number> {
  return invoke("add_leads", { leads });
}

export async function deleteLead(id: string): Promise<void> {
  return invoke("delete_lead", { id });
}

export async function getCallLogs(): Promise<CallLog[]> {
  return invoke("get_call_logs");
}

export async function addCallLog(
  id: string,
  leadId: string,
  durationSeconds: number,
  transcript: string,
  status: string,
): Promise<void> {
  return invoke("add_call_log", {
    id,
    leadId,
    durationSeconds,
    transcript,
    status,
  });
}

export async function getLeadCallLogs(leadId: string): Promise<CallLog[]> {
  return invoke("get_lead_call_logs", { leadId });
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  return invoke("get_lead_notes", { leadId });
}

export async function addLeadNote(id: string, leadId: string, content: string): Promise<void> {
  return invoke("add_lead_note", { id, leadId, content });
}

// Re-export
export type { Lead, LeadStatus };
