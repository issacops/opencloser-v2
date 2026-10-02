import { create } from "zustand";
import { Lead } from "../types";
import type { TranscriptLine } from "../features/voice/lib/caller-engine";

interface CallStateStore {
  activeLead: Lead | null;
  isPowerDialing: boolean;
  debriefData: { lead: Lead; transcript: TranscriptLine[]; duration: number } | null;

  setActiveLead: (lead: Lead | null) => void;
  setIsPowerDialing: (v: boolean) => void;
  setDebriefData: (
    data: { lead: Lead; transcript: TranscriptLine[]; duration: number } | null,
  ) => void;
}

export const useCallStore = create<CallStateStore>((set) => ({
  activeLead: null,
  isPowerDialing: false,
  debriefData: null,

  setActiveLead: (activeLead) => set({ activeLead }),
  setIsPowerDialing: (isPowerDialing) => set({ isPowerDialing }),
  setDebriefData: (debriefData) => set({ debriefData }),
}));
