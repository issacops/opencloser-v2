import { create } from "zustand";
import type { ToastMessage, ToastType } from "../ui/components/Toast";

let toastCounter = 0;

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: `${Date.now()}_${++toastCounter}`, type, message }],
    })),

  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));
