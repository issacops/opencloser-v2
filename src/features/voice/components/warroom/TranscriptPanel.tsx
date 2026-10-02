import { Activity, AlertTriangle, Bot, User } from "lucide-react";
import type { CallState, TranscriptLine } from "../../lib/caller-engine";
import type { SentimentLevel } from "./sentiment";
import { VoiceVisualizer } from "../VoiceVisualizer";

interface TranscriptPanelProps {
  isCallLive: boolean;
  callState: CallState;
  sentiment: SentimentLevel;
  error: string | null;
  transcript: TranscriptLine[];
  audioContext: AudioContext | null;
  outputAnalyser: AnalyserNode | null;
  prospectAnalyser: AnalyserNode | null;
}

export function TranscriptPanel({
  isCallLive,
  callState,
  sentiment,
  error,
  transcript,
  audioContext,
  outputAnalyser,
  prospectAnalyser,
}: TranscriptPanelProps) {
  return (
    <div className="flex-1 flex flex-col border-r border-white/[0.06] bg-[#070707]">
      {/* Speaker Avatars */}
      <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-around bg-gradient-to-b from-[#0d0d0d] to-[#080808]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative">
            {isCallLive && (
              <div className="absolute -inset-2 bg-indigo-500/20 rounded-full animate-breathe"></div>
            )}
            <VoiceVisualizer
              isActive={isCallLive}
              audioContext={audioContext}
              analyser={outputAnalyser}
              role="agent"
              size={72}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.15em] font-bold">
            AI Agent
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5">
            {isCallLive && (
              <>
                <div
                  className="w-1 h-3 bg-indigo-500/60 rounded-full animate-waveform"
                  style={{ animationDelay: "0s" }}
                ></div>
                <div
                  className="w-1 h-4 bg-white/30 rounded-full animate-waveform"
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className="w-1 h-2 bg-emerald-500/60 rounded-full animate-waveform"
                  style={{ animationDelay: "0.3s" }}
                ></div>
              </>
            )}
          </div>
          <div
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all duration-500 font-bold ${
              sentiment === "buying"
                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                : sentiment === "warming"
                  ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
                  : sentiment === "hostile" || sentiment === "cold"
                    ? "text-red-400 bg-red-500/10 border border-red-500/20"
                    : "text-gray-500 bg-white/[0.04] border border-white/[0.06]"
            }`}
          >
            {sentiment === "buying"
              ? "INTERESTED"
              : sentiment === "warming"
                ? "ENGAGED"
                : sentiment === "hostile"
                  ? "HOSTILE"
                  : "MONITORING"}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative">
            {isCallLive && (
              <div
                className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-breathe"
                style={{ animationDelay: "0.5s" }}
              ></div>
            )}
            <VoiceVisualizer
              isActive={isCallLive}
              audioContext={audioContext}
              analyser={prospectAnalyser}
              role="prospect"
              size={72}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.15em] font-bold">
            Prospect
          </span>
        </div>
      </div>

      {/* Transcript Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar scroll-smooth">
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20 animate-fade-in flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {!error && transcript.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
            <div className="relative">
              <div className="absolute -inset-3 bg-indigo-500/15 rounded-full animate-breathe"></div>
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative z-10">
                <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-gray-400">
                {callState === "connecting"
                  ? "Establishing AI connection..."
                  : "Waiting for audio stream..."}
              </p>
              <p className="text-[11px] text-gray-600 mt-1 font-mono">
                Initializing neural pipeline
              </p>
            </div>
          </div>
        )}
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`flex gap-3 animate-transcript-bubble ${entry.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                entry.role === "user"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
              }`}
            >
              {entry.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                entry.role === "user"
                  ? "bg-emerald-600/12 text-emerald-50 border border-emerald-500/10"
                  : "bg-[#151515] text-gray-200 border border-white/[0.05]"
              }`}
            >
              {entry.text}
            </div>
          </div>
        ))}
      </div>

      {/* Talk ratio bar */}
      {transcript.length > 0 &&
        (() => {
          const ai = transcript.filter((t) => t.role === "model").length;
          const pr = transcript.filter((t) => t.role === "user").length;
          const total = ai + pr;
          const aiPct = total > 0 ? Math.round((ai / total) * 100) : 50;
          return (
            <div className="px-6 py-3.5 border-t border-white/[0.04] bg-[#0a0a0a]">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-[0.15em]">
                <span className="font-bold">Talk Ratio</span>
                <span
                  className={`ml-auto font-semibold ${aiPct > 65 ? "text-orange-400" : "text-gray-500"}`}
                >
                  {aiPct > 65 ? "⚠️ AI over-talking" : "✓ balanced"}
                </span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-indigo-400 bar-transition rounded-l-full"
                    style={{ width: `${aiPct}%` }}
                  />
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 flex-1 rounded-r-full" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1.5 font-mono font-bold">
                <span className="text-indigo-400/70">AI {aiPct}%</span>
                <span className="text-emerald-400/70">Prospect {100 - aiPct}%</span>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
