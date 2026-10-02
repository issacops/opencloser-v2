import { Activity, Phone, Timer, X } from "lucide-react";
import { Lead } from "../../../../types";
import type { CallState } from "../../lib/caller-engine";
import type { SentimentStyle } from "./sentiment";
import { formatTimer } from "./metrics";
import type { PhoneLineApi } from "./usePhoneLine";

interface WarRoomHeaderProps {
  lead: Lead;
  callState: CallState;
  isCallLive: boolean;
  sentimentInfo: SentimentStyle;
  elapsedSeconds: number;
  phase: { label: string; color: string };
  phoneLine: PhoneLineApi;
  onEndCall: () => void;
}

export function WarRoomHeader({
  lead,
  callState,
  isCallLive,
  sentimentInfo,
  elapsedSeconds,
  phase,
  phoneLine,
  onEndCall,
}: WarRoomHeaderProps) {
  const line = phoneLine.call;
  const lineLabel = line
    ? line.mock
      ? "MOCK LINE"
      : phoneLine.streaming
        ? "LINE LIVE"
        : "DIALING"
    : phoneLine.enabled
      ? "LINE ARMED"
      : "PHONE LINE";

  return (
    <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[#111] to-[#0d0d0d] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
              isCallLive
                ? "bg-red-500/15 border-red-500/30 animate-pulse-glow"
                : "bg-white/5 border-white/10"
            }`}
          >
            <Activity className="w-5 h-5 text-red-400" />
          </div>
          {isCallLive && (
            <>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </>
          )}
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
            War Room
            <span className="text-[9px] font-mono bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-md border border-white/[0.05] uppercase tracking-widest">
              AI Caller
            </span>
          </h2>
          <p className="text-gray-500 text-[12px] mt-0.5 font-medium">
            {callState === "connecting"
              ? "Establishing secure connection..."
              : callState === "active"
                ? `Live · ${lead.name} at ${lead.company}`
                : callState === "objection_mode"
                  ? `⚡ Objection Active — ${lead.name}`
                  : callState === "ended"
                    ? "Call ended"
                    : `Dialing ${lead.name}...`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Sentiment Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all duration-500 ${sentimentInfo.bg} ${sentimentInfo.color}`}
        >
          <span className="text-sm">{sentimentInfo.emoji}</span>
          <span>{sentimentInfo.label}</span>
        </div>
        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
            isCallLive ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
          }`}
        >
          <Timer className={`w-3.5 h-3.5 ${isCallLive ? "text-red-400" : "text-gray-500"}`} />
          <span
            className={`font-mono text-[12px] font-bold tabular-nums ${isCallLive ? "text-red-400" : "text-gray-500"}`}
          >
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
        {/* Phase */}
        <div
          className={`text-[10px] font-mono uppercase tracking-wider px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] font-bold ${phase.color}`}
        >
          {phase.label}
        </div>
        <button
          onClick={phoneLine.toggle}
          title={
            phoneLine.error ??
            (line
              ? "Phone line attached — click to detach"
              : "Route this call through a real phone line (Twilio)")
          }
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all btn-press ${
            line
              ? line.mock
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : phoneLine.streaming
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-white/5 border-white/10 text-gray-400"
              : phoneLine.enabled
                ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{lineLabel}</span>
        </button>
        <button
          onClick={onEndCall}
          className="p-2 hover:bg-white/[0.06] rounded-xl transition-all btn-press"
          aria-label="Close War Room"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
