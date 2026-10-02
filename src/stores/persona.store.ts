import { create } from "zustand";
import { AIPersona, DEFAULT_PERSONA } from "../types/persona";

interface PersonaState {
  persona: AIPersona;
  setPersona: (persona: AIPersona) => void;
}

function loadPersona(): AIPersona {
  try {
    const s = localStorage.getItem("ai_persona");
    if (s) return { ...DEFAULT_PERSONA, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_PERSONA;
}

export const usePersonaStore = create<PersonaState>((set) => ({
  persona: loadPersona(),

  setPersona: (persona) => {
    set({ persona });
    try {
      localStorage.setItem("ai_persona", JSON.stringify(persona));
    } catch {}
  },
}));
