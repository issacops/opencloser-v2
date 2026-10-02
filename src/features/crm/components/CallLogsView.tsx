import { useState } from "react";
import {
  Phone,
  Clock,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Timer,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useCallLogsQuery } from "../../../services/queries";

export function CallLogsView() {
  const callLogsQuery = useCallLogsQuery();
  const logs = callLogsQuery.data ?? [];
  const loading = callLogsQuery.isLoading;
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Analytics Computations
  const totalCalls = logs.length;
  const successCalls = logs.filter((l) => l.status === "Success").length;
  const voicemailCalls = logs.filter((l) => l.status === "Voicemail").length;
  const rejectedCalls = logs.filter((l) => l.status === "Rejected").length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
  const avgDuration =
    totalCalls > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.duration_seconds, 0) / totalCalls)
      : 0;

  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto py-10 px-6 lg:px-10 custom-scrollbar h-full overflow-y-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-6 mb-10 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-bg flex items-center justify-center border border-surface-border shadow-sm">
          <BarChart3 className="w-8 h-8 text-ink-secondary" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-ink tracking-tight">
            Call Intelligence Center
          </h2>
          <p className="text-ink-secondary text-sm mt-1 font-medium italic">
            Telemetry data from autonomous sales execution sessions.
          </p>
        </div>
      </div>

      {/* ── Performance Grid ── */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 stagger-children">
          <div className="card-coral p-6 h-[160px] flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <div className="stat-label text-white/80">Success Rate</div>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-white leading-none">
                {successRate}%
              </div>
              <div className="text-[11px] text-white/70 font-bold uppercase tracking-wider mt-2">
                Conversion Vector
              </div>
            </div>
          </div>

          <div className="card p-6 h-[160px] flex flex-col justify-between group hover:border-ink-secondary/20 transition-smooth">
            <div className="flex items-center justify-between">
              <div className="stat-label">Total Calls</div>
              <Phone className="w-5 h-5 text-ink-secondary" />
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-ink leading-none">{totalCalls}</div>
              <div className="text-[11px] text-ink-secondary font-bold uppercase tracking-wider mt-2">
                Dials Executed
              </div>
            </div>
          </div>

          <div className="card p-6 h-[160px] flex flex-col justify-between group hover:border-ink-secondary/20 transition-smooth">
            <div className="flex items-center justify-between">
              <div className="stat-label">Avg Duration</div>
              <Timer className="w-5 h-5 text-ink-secondary" />
            </div>
            <div>
              <div className="text-[42px] font-extrabold text-ink leading-none">
                {formatDuration(avgDuration)}
              </div>
              <div className="text-[11px] text-ink-secondary font-bold uppercase tracking-wider mt-2">
                Acoustic Connection
              </div>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between group">
            <div className="stat-label mb-4">Outcome Spread</div>
            <div className="flex gap-1.5 h-3 rounded-full overflow-hidden mb-5 bg-surface-bg border border-surface-border p-0.5">
              {successCalls > 0 && (
                <div className="bg-coral rounded-full" style={{ flex: successCalls }}></div>
              )}
              {voicemailCalls > 0 && (
                <div className="bg-ink rounded-full" style={{ flex: voicemailCalls }}></div>
              )}
              {rejectedCalls > 0 && (
                <div className="bg-ink-faint rounded-full" style={{ flex: rejectedCalls }}></div>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-coral"></div> {successCalls} Success
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-ink"></div> {voicemailCalls} VM
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Historical Logs ── */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-ink tracking-tight transition-smooth">
          Chronological Record
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Filter logs…"
              className="bg-white border border-surface-border rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 focus:ring-coral/20 w-48 font-bold opacity-50"
              disabled
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-surface-border border-t-coral rounded-full animate-spin"></div>
          <div className="mt-4 text-[13px] font-bold text-ink-secondary uppercase tracking-[0.2em]">
            Synchronizing Archives
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center opacity-70">
          <div className="w-16 h-16 rounded-2xl bg-surface-bg flex items-center justify-center mb-6">
            <Phone className="w-8 h-8 text-ink-muted" />
          </div>
          <p className="font-bold text-ink-secondary text-base">No calls recorded yet</p>
          <p className="text-ink-muted text-[13px] mt-1 font-medium max-w-xs mx-auto">
            Drag a lead to "Outbound Call" in the Pipeline to start calling.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-12">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            let transcriptData: any[] = [];
            try {
              transcriptData = JSON.parse(log.transcript);
            } catch {}

            return (
              <div
                key={log.id}
                className={`card overflow-hidden transition-smooth ${isExpanded ? "ring-2 ring-coral/10 shadow-xl" : "hover:border-ink-secondary/20 hover:shadow-card-hover"}`}
              >
                <div
                  className={`flex flex-wrap md:flex-nowrap items-center justify-between p-6 cursor-pointer bg-white transition-colors duration-200 ${isExpanded ? "bg-surface-hover/30" : ""}`}
                  onClick={() => toggleExpand(log.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleExpand(log.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Call with ${log.lead_name || "Unknown"} on ${new Date(log.created_at).toLocaleDateString()}`}
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[17px] font-bold text-ink tracking-tight truncate">
                        {log.lead_name || "Unknown Identity"}
                      </span>
                      <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-[0.15em] mt-1 truncate">
                        {log.lead_company || "External Entity"}
                      </span>
                    </div>

                    <div className="hidden md:flex items-center gap-6 ml-6 border-l border-surface-border pl-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-0.5">
                          Duration
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-ink-secondary font-mono">
                          <Timer className="w-4 h-4" />
                          {formatDuration(log.duration_seconds)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-0.5">
                          Recorded At
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-ink-secondary">
                          <Clock className="w-4 h-4" />
                          {new Date(log.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 mt-4 md:mt-0">
                    <span
                      className={`badge px-4 py-2 font-bold uppercase tracking-widest text-[11px] ${
                        log.status === "Success"
                          ? "badge-success"
                          : log.status === "Voicemail"
                            ? "badge-pending"
                            : "badge-error"
                      }`}
                    >
                      {log.status}
                    </span>
                    <div
                      className={`p-2 rounded-lg border border-surface-border transition-smooth shadow-sm ${isExpanded ? "bg-ink text-white rotate-180" : "bg-surface-bg text-ink-secondary hover:text-ink"}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-border bg-surface-bg/20 p-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-coral shadow-[0_0_8px_rgba(232,75,26,0.3)]"></div>
                        <h4 className="text-[12px] font-bold text-ink uppercase tracking-[0.15em]">
                          Execution Transcript
                        </h4>
                      </div>
                      <button
                        className="text-[11px] font-bold text-ink-muted hover:text-coral transition-colors flex items-center gap-1.5 opacity-50"
                        disabled
                      >
                        Download Intelligence
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {Array.isArray(transcriptData) && transcriptData.length > 0 ? (
                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {transcriptData.map((entry, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-4 ${entry.role === "user" ? "justify-end" : ""}`}
                          >
                            {entry.role === "model" && (
                              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center shrink-0 mt-1 shadow-coral overflow-hidden">
                                <div className="text-white text-[11px] font-black uppercase">
                                  AI
                                </div>
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] lg:max-w-[70%] px-5 py-4 text-[15px] leading-relaxed shadow-sm transform transition-all hover:scale-[1.01] ${
                                entry.role === "user"
                                  ? "bg-ink text-white rounded-2xl rounded-tr-sm font-medium"
                                  : "bg-white text-ink border border-surface-border rounded-2xl rounded-tl-sm font-medium"
                              }`}
                            >
                              {entry.text}
                            </div>
                            {entry.role === "user" && (
                              <div className="w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                <div className="text-ink-secondary text-[11px] font-black uppercase tracking-widest">
                                  {log.lead_name?.charAt(0) || "U"}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[14px] text-ink-muted italic bg-white border border-surface-border rounded-2xl p-10 text-center font-medium shadow-sm">
                        No audible telemetry detected for this session.
                      </div>
                    )}

                    <div className="mt-8 flex items-center gap-4 justify-center">
                      <button
                        className="btn-dark py-2.5 px-8 font-bold text-[13px] opacity-50"
                        disabled
                      >
                        Review session
                      </button>
                      <button
                        className="btn-ghost py-2.5 px-8 font-bold text-[13px] opacity-50"
                        disabled
                      >
                        Flag for training
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
