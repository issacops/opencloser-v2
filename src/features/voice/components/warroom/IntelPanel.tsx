import {
  AlertTriangle,
  Brain,
  Lightbulb,
  Mic,
  MicOff,
  PhoneOff,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { TranscriptLine } from "../../lib/caller-engine";
import type { EmotionAxes, EmotionShift } from "../../lib/emotion-engine";
import type { ObjectionMatch } from "../../lib/objection-engine";
import { SENTIMENT_CONFIG, SENTIMENT_ORDER } from "./sentiment";
import type { SentimentLevel, SentimentStyle } from "./sentiment";

interface IntelPanelProps {
  sentiment: SentimentLevel;
  sentimentInfo: SentimentStyle;
  sentimentLabel: string;
  activeObjection: ObjectionMatch | null;
  onDismissObjection: () => void;
  hints: string[];
  currentAxes: EmotionAxes | null;
  recentShifts: EmotionShift[];
  transcript: TranscriptLine[];
  objectionHistory: ObjectionMatch[];
  usePhoneLink: boolean;
  onTogglePhoneLink: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export function IntelPanel({
  sentiment,
  sentimentInfo,
  sentimentLabel,
  activeObjection,
  onDismissObjection,
  hints,
  currentAxes,
  recentShifts,
  transcript,
  objectionHistory,
  usePhoneLink,
  onTogglePhoneLink,
  isMuted,
  onToggleMute,
  onEndCall,
}: IntelPanelProps) {
  return (
    <div className="w-[320px] bg-[#0a0a0a] flex flex-col overflow-y-auto custom-scrollbar">
      {/* Sentiment Arc */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-3.5 font-bold">
          Prospect Sentiment
        </div>
        <div className="flex items-center justify-between gap-1.5">
          {SENTIMENT_ORDER.map((s) => {
            const cfg = SENTIMENT_CONFIG[s];
            const isActive = s === sentiment;
            return (
              <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                <span
                  className={`text-base transition-all duration-700 ${isActive ? "scale-[1.3]" : "opacity-25 scale-90"}`}
                >
                  {cfg.emoji}
                </span>
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-700 ${
                    isActive
                      ? "bg-gradient-to-r from-white/60 to-white shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                      : "bg-white/[0.06]"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <p className={`text-[11px] mt-2.5 font-bold ${sentimentInfo.color}`}>{sentimentLabel}</p>
      </div>

      {/* Objection Alert */}
      {activeObjection && (
        <div className="mx-4 mt-4 p-4 bg-orange-500/8 border border-orange-500/25 rounded-2xl shrink-0 animate-objection-slide">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              {activeObjection.emoji} {activeObjection.label}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 font-mono bg-black/30 rounded-xl p-3 leading-relaxed border border-white/[0.03]">
            "{activeObjection.counterScript.substring(0, 140)}..."
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-orange-400/60 font-mono font-bold">
              {activeObjection.framework}
            </span>
            <button
              onClick={onDismissObjection}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors btn-press"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Live Coaching */}
      <div className="p-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] font-bold">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="w-3 h-3 text-amber-400" />
          </div>
          Live Coaching
        </div>
        <div className="space-y-2">
          {hints.map((hint, i) => (
            <div
              key={i}
              className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl px-3 py-2.5 text-[11px] text-amber-200/90 leading-relaxed transition-all hover:bg-amber-500/[0.08] hover:border-amber-500/20"
            >
              {hint}
            </div>
          ))}
        </div>
      </div>

      {/* Emotion Axes */}
      {currentAxes && (
        <div className="p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] font-bold">
            <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-3 h-3 text-purple-400" />
            </div>
            Emotion Matrix
            {recentShifts.length > 0 && (
              <span className="ml-auto text-purple-400 text-[9px] font-bold animate-pulse">
                ● ADAPTING
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {(
              [
                { key: "empathy", label: "Empathy", gradient: "from-blue-500 to-blue-400" },
                { key: "energy", label: "Energy", gradient: "from-amber-500 to-amber-400" },
                {
                  key: "assertiveness",
                  label: "Assert.",
                  gradient: "from-red-500 to-red-400",
                },
                { key: "humor", label: "Humor", gradient: "from-pink-500 to-pink-400" },
                {
                  key: "formality",
                  label: "Formality",
                  gradient: "from-purple-500 to-purple-400",
                },
              ] as const
            ).map(({ key, label, gradient }) => {
              const val = currentAxes[key as keyof EmotionAxes] as number;
              const shift = recentShifts.find((s) => s.axis === key);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 font-mono font-semibold">
                      {label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {shift && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded ${shift.direction === "up" ? "text-emerald-400 bg-emerald-500/10" : "text-orange-400 bg-orange-500/10"}`}
                        >
                          {shift.direction === "up" ? "↑" : "↓"}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono tabular-nums font-bold">
                        {Math.round(val)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${gradient} rounded-full bar-transition`}
                      style={{ width: `${val}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {recentShifts.length > 0 && (
            <div className="mt-3 text-[10px] text-purple-400/60 font-mono italic">
              {recentShifts[0].reason}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="p-5 shrink-0">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] font-bold">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          Live Stats
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-[#111] rounded-xl p-3 border border-white/[0.05] text-center hover:border-white/[0.1] transition-all">
            <div className="text-xl font-black text-white tabular-nums animate-count-up">
              {transcript.filter((t) => t.role === "model").length}
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-gray-500 font-bold mt-0.5">
              AI Turns
            </div>
          </div>
          <div className="bg-[#111] rounded-xl p-3 border border-white/[0.05] text-center hover:border-white/[0.1] transition-all">
            <div className="text-xl font-black text-white tabular-nums animate-count-up">
              {transcript.filter((t) => t.role === "user").length}
            </div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-gray-500 font-bold mt-0.5">
              Prospect
            </div>
          </div>
        </div>
        {objectionHistory.length > 0 && (
          <div className="text-[10px] text-gray-500 font-mono font-bold flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-orange-400" />
            Objections Handled: {objectionHistory.length}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto p-5 border-t border-white/[0.06] bg-gradient-to-t from-[#111] to-[#0d0d0d] flex flex-col gap-3.5">
        <button
          onClick={onTogglePhoneLink}
          aria-label={usePhoneLink ? "Disable phone link" : "Enable phone link"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all btn-press border ${
            usePhoneLink
              ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
              : "bg-white/[0.04] text-gray-500 border-white/[0.08]"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          {usePhoneLink ? "Phone Link Active" : "Phone Link Off"}
        </button>
        <div className="flex justify-center gap-4">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all btn-press border ${
              isMuted
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_16px_rgba(234,179,8,0.15)]"
                : "bg-white/[0.06] text-white border-white/10 hover:bg-white/[0.1]"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={onEndCall}
            aria-label="End call"
            className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all btn-press shadow-[0_4px_24px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.4)]"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
