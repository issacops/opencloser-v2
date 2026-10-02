import { create } from "zustand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface OnboardingState {
  messages: Message[];
  isLoading: boolean;

  addMessage: (msg: Message) => void;
  setIsLoading: (v: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  messages: [
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to OpenCloser. I'm your AI Sales Architect. To engineer your bespoke Ideal Customer Profile (ICP) and prime your dialing agent with the SPIN/Challenger methodology, I need to understand your ecosystem. What exactly does your company do, and who is your most lucrative customer?",
    },
  ],
  isLoading: false,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
