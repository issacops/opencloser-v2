import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles = {
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    error: "bg-red-500/10 border-red-500/20 text-red-400",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <CheckCircle className="w-5 h-5" />,
    warning: <XCircle className="w-5 h-5" />,
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
  );
}
