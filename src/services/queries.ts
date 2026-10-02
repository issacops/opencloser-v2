// TanStack Query hooks — single source of truth for server state.
// All invoke() reads/mutations for leads, call logs, and notes go through here
// so caching, invalidation, and optimistic updates stay consistent.
import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
  getLeads,
  getCallLogs,
  getLeadCallLogs,
  getLeadNotes,
  updateLeadStatus,
  addLeads,
  addLeadNote,
  deleteLead,
  addCallLog,
  type CallLog,
  type LeadNote,
} from "./lead.service";
import type { Lead, LeadStatus } from "../types";

const queryKeys = {
  leads: ["leads"] as const,
  callLogs: ["call_logs"] as const,
  leadCallLogs: (leadId: string) => ["lead_call_logs", leadId] as const,
  leadNotes: (leadId: string) => ["lead_notes", leadId] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useLeadsQuery(): UseQueryResult<Lead[]> {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: getLeads,
  });
}

export function useCallLogsQuery(): UseQueryResult<CallLog[]> {
  return useQuery({
    queryKey: queryKeys.callLogs,
    queryFn: getCallLogs,
  });
}

export function useLeadCallLogsQuery(leadId: string): UseQueryResult<CallLog[]> {
  return useQuery({
    queryKey: queryKeys.leadCallLogs(leadId),
    queryFn: () => getLeadCallLogs(leadId),
    enabled: !!leadId,
  });
}

export function useLeadNotesQuery(leadId: string): UseQueryResult<LeadNote[]> {
  return useQuery({
    queryKey: queryKeys.leadNotes(leadId),
    queryFn: () => getLeadNotes(leadId),
    enabled: !!leadId,
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useUpdateLeadStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    // Optimistic move with rollback.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.leads });
      const previous = qc.getQueryData<Lead[]>(queryKeys.leads);
      qc.setQueryData<Lead[]>(queryKeys.leads, (old) =>
        old?.map((l) => (l.id === id ? { ...l, status } : l)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.leads, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads });
    },
  });
}

export function useAddLeadsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addLeads,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads });
    },
  });
}

export function useDeleteLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leads });
      qc.invalidateQueries({ queryKey: queryKeys.callLogs });
    },
  });
}

export function useAddLeadNoteMutation(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      addLeadNote(id, leadId, content),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadNotes(leadId) });
    },
  });
}

export function useAddCallLogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      leadId,
      durationSeconds,
      transcript,
      status,
    }: {
      id: string;
      leadId: string;
      durationSeconds: number;
      transcript: string;
      status: string;
    }) => addCallLog(id, leadId, durationSeconds, transcript, status),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.callLogs });
      qc.invalidateQueries({ queryKey: ["lead_call_logs"] });
    },
  });
}
