import { useState, useEffect, useCallback } from "react";
import {
  X,
  FileText,
  Brain,
  ShieldAlert,
  Lightbulb,
  Mail,
  Copy,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Lead, ICP } from "../../../types";
import { analyzeCallTranscript, type CallAnalysis } from "../../../services/ai.service";

interface TranscriptEntry {
  id: string;
  role: "user" | "model";
  text: string;
}

interface PostCallDebriefProps {
  lead: Lead;
  icp: ICP | null;
  transcript: TranscriptEntry[];
  durationSeconds: number;
  onClose: () => void;
}

function SkeletonCard({ className = "", lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div
      className={`rounded-3xl p-6 animate-pulse ${className}`}
      style={{ background: "var(--wr-surface)" }}
    >
      <div
        className="h-3 w-32 rounded-full mb-5"
        style={{ background: "rgba(255,255,255,0.06)" }}
      ></div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.04)", width: `${85 - i * 15}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function PostCallDebrief({
  lead,
  icp,
  transcript,
  durationSeconds,
  onClose,
}: PostCallDebriefProps) {
  const [analysis, setAnalysis] = useState<CallAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const analyzeCall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCallTranscript(
        JSON.stringify(transcript),
        lead.name,
        lead.company,
        icp ? JSON.stringify(icp) : null,
      );
      setAnalysis(result);
    } catch (err) {
      console.error("Failed to analyze call:", err);
      setAnalysis(null);
      setError(typeof err === "string" ? err : "Analysis request failed.");
    } finally {
      setLoading(false);
    }
  }, [transcript, lead, icp]);

  useEffect(() => {
    analyzeCall();
  }, [analyzeCall]);

  const copyEmail = () => {
    if (!analysis) return;
    const fullEmail = `Subject: ${analysis.emailSubject}\n\n${analysis.followUpEmail}`;
    navigator.clipboard.writeText(fullEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const sentimentConfig = {
    Positive: {
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    },
    Neutral: {
      icon: Minus,
      color: "text-gray-400",
      bg: "bg-white/[0.04]",
      border: "border-white/10",
      glow: "",
    },
    Negative: {
      icon: TrendingDown,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/25",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    },
    Mixed: {
      icon: Minus,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    },
  };

  return (
    <div className="warroom-dark fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-fade-in">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/8 blur-[180px] rounded-full pointer-events-none"></div>

      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[20px] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] relative z-10 animate-scale-in">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/[0.06] bg-gradient-to-r from-[#111] to-[#0d0d0d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-2 bg-purple-500/15 rounded-full animate-breathe"></div>
              <div
                className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/25 relative z-10 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                style={{ width: 52, height: 52 }}
              >
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                Neural Diagnostics
                <span className="text-[9px] font-mono bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20 uppercase tracking-widest">
                  Auto-Generated
                </span>
              </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-gray-400 text-sm font-medium">
                  {lead.name} at {lead.company}
                </span>
                <span className="text-gray-600">&#x2022;</span>
                <span className="text-purple-400 text-sm font-mono tracking-wider font-bold">
                  {formatDuration(durationSeconds)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/[0.06] rounded-xl transition-all btn-press"
            aria-label="Close debrief"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar scroll-smooth">
          {loading ? (
            /* Skeleton loading state */
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SkeletonCard className="lg:col-span-2" lines={4} />
                <SkeletonCard lines={1} />
              </div>
              <SkeletonCard lines={3} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </div>
              <SkeletonCard lines={5} />
              {/* Loading text */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="flex gap-1.5">
                  <span className="dot-bounce-1 w-2 h-2 bg-purple-400 rounded-full inline-block"></span>
                  <span className="dot-bounce-2 w-2 h-2 bg-purple-400 rounded-full inline-block"></span>
                  <span className="dot-bounce-3 w-2 h-2 bg-purple-400 rounded-full inline-block"></span>
                </div>
                <span className="text-[12px] font-mono text-purple-400 tracking-wider uppercase font-bold">
                  Synthesizing Telemetry
                </span>
              </div>
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-10 flex flex-col items-center text-center gap-4"
              role="alert"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Analysis Unavailable</h3>
                <p className="text-[13px] text-gray-400 max-w-md leading-relaxed">
                  The AI call analysis request failed. Nothing was generated. Check your Gemini key
                  in Settings, or retry.
                </p>
                <p className="text-[11px] text-gray-600 font-mono mt-2 break-all max-w-lg">
                  {error}
                </p>
              </div>
              <button
                onClick={analyzeCall}
                className="flex items-center gap-2 text-[12px] font-bold px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1] transition-all btn-press"
              >
                <RefreshCw className="w-4 h-4" /> Retry Analysis
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-6 stagger-children">
              {/* Summary + Sentiment Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--wr-surface)] border border-[var(--wr-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--wr-border-hover)] transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700"></div>
                  <h3 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4 relative z-10 font-bold">
                    <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-blue-400" />
                    </div>
                    Executive Brief
                  </h3>
                  <p className="text-[14px] text-gray-300 leading-relaxed relative z-10">
                    {analysis.summary}
                  </p>
                </div>

                {(() => {
                  const sc = sentimentConfig[analysis.sentiment] || sentimentConfig.Neutral;
                  const Icon = sc.icon;
                  return (
                    <div
                      className={`${sc.bg} border ${sc.border} rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-all ${sc.glow}`}
                    >
                      <div
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 ${sc.bg} blur-2xl rounded-full animate-breathe`}
                      ></div>
                      <div
                        className={`w-14 h-14 rounded-2xl ${sc.bg} border ${sc.border} flex items-center justify-center mb-4 relative z-10`}
                      >
                        <Icon className={`w-7 h-7 ${sc.color}`} />
                      </div>
                      <div
                        className={`text-2xl font-black tracking-tight ${sc.color} relative z-10`}
                      >
                        {analysis.sentiment}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-[0.15em] relative z-10 font-bold">
                        Computed Score
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Key Insights */}
              <div className="bg-[var(--wr-surface)] border border-[var(--wr-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--wr-border-hover)] transition-all">
                <h3 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-5 relative z-10 font-bold">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                  </div>
                  Extracted Intelligence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  {analysis.keyInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/25 transition-all rounded-xl px-5 py-4 text-[13px] text-gray-300 leading-relaxed flex items-start gap-4"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/15 mt-0.5">
                        <span className="text-amber-500 text-[10px] font-bold">{i + 1}</span>
                      </div>
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              {/* Objections + Next Steps Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objections */}
                <div className="bg-[var(--wr-surface)] border border-[var(--wr-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--wr-border-hover)] transition-all">
                  <h3 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-5 relative z-10 font-bold">
                    <div className="w-5 h-5 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <ShieldAlert className="w-3 h-3 text-red-400" />
                    </div>
                    Detected Friction
                  </h3>
                  {analysis.objectionsRaised.length > 0 ? (
                    <ul className="space-y-2.5 relative z-10">
                      {analysis.objectionsRaised.map((obj, i) => (
                        <li
                          key={i}
                          className="text-[13px] text-gray-300 bg-white/[0.02] border border-white/[0.05] hover:border-red-500/25 transition-all rounded-xl px-5 py-3.5 flex items-start gap-3"
                        >
                          <span className="text-red-500 text-xs mt-1 shrink-0 w-5 h-5 rounded bg-red-500/10 flex items-center justify-center font-bold">
                            !
                          </span>
                          <span className="leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 text-center text-sm text-gray-500 italic">
                      No significant objections detected.
                    </div>
                  )}
                </div>

                {/* Next Steps */}
                <div className="bg-[var(--wr-surface)] border border-[var(--wr-border)] rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--wr-border-hover)] transition-all">
                  <h3 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-5 relative z-10 font-bold">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                    </div>
                    Execution Directives
                  </h3>
                  <ul className="space-y-2.5 relative z-10">
                    {analysis.nextSteps.map((step, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-gray-300 bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/25 transition-all rounded-xl px-5 py-3.5 flex items-start gap-4"
                      >
                        <span className="text-emerald-500 text-[10px] font-mono font-bold mt-1 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Follow-Up Email */}
              <div className="bg-[#050505] border border-purple-500/20 rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute -inset-1 bg-gradient-to-b from-purple-500/5 to-transparent blur-2xl pointer-events-none opacity-50"></div>
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <h3 className="flex items-center gap-2 text-[10px] font-mono text-purple-400 uppercase tracking-[0.15em] font-bold">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                      <Mail className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                    Generated Comms Asset
                  </h3>
                  <button
                    onClick={copyEmail}
                    className={`flex items-center gap-2 text-[11px] font-bold px-4 py-2.5 rounded-xl border transition-all btn-press ${
                      copiedEmail
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.1]"
                    }`}
                  >
                    {copiedEmail ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedEmail ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-3.5 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-black/30 px-2 py-1 rounded border border-white/[0.04] font-bold">
                      Subject
                    </span>
                    <span className="text-[14px] text-white font-semibold">
                      {analysis.emailSubject}
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-xl px-6 py-5 text-[13px] text-gray-400 leading-loose whitespace-pre-wrap border border-white/[0.04]">
                    {analysis.followUpEmail}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/[0.06] bg-gradient-to-t from-[#111] to-[#0d0d0d] flex justify-end shrink-0 relative z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-3 bg-white text-black hover:bg-gray-100 px-8 py-3.5 rounded-xl font-bold transition-all btn-press shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] group"
          >
            Archive & Return
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
