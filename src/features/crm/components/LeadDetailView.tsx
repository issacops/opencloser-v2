import { useState, useCallback } from "react";
import { Lead, LeadStatus, ICP } from "../../../types";
import type { CallLog, LeadNote } from "../../../services/lead.service";
import {
  useLeadCallLogsQuery,
  useLeadNotesQuery,
  useAddLeadNoteMutation,
} from "../../../services/queries";
import {
  ArrowLeft,
  Phone,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Trash2,
  ChevronDown,
  StickyNote,
  Activity,
  PhoneCall,
  Bot,
  Calendar,
  Share2,
  MoreHorizontal,
} from "lucide-react";

interface LeadDetailViewProps {
  lead: Lead;
  icp: ICP | null;
  onBack: () => void;
  onDial: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

const STATUSES: LeadStatus[] = ["Discovery", "Outbound Call", "Audit Requested", "Closed"];

export function LeadDetailView({
  lead,
  icp: _icp,
  onBack,
  onDial,
  onDelete,
  onStatusChange,
}: LeadDetailViewProps) {
  const callLogsQuery = useLeadCallLogsQuery(lead.id);
  const notesQuery = useLeadNotesQuery(lead.id);
  const callLogs = callLogsQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const addNoteMutation = useAddLeadNoteMutation(lead.id);
  const [newNote, setNewNote] = useState("");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const loading = callLogsQuery.isLoading || notesQuery.isLoading;
  const [activeTab, setActiveTab] = useState<"timeline" | "calls" | "notes">("timeline");

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    const noteId = `note_${Date.now()}`;
    try {
      await addNoteMutation.mutateAsync({ id: noteId, content: newNote.trim() });
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  }, [newNote, addNoteMutation]);

  const handleDelete = () => {
    if (!confirm(`Delete ${lead.name} and all associated data? This cannot be undone.`)) return;
    // Parent owns the delete mutation + navigation.
    onDelete(lead.id);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Build unified timeline
  const timelineItems = [
    ...callLogs.map((cl) => ({
      type: "call" as const,
      date: cl.created_at,
      data: cl,
    })),
    ...notes.map((n) => ({
      type: "note" as const,
      date: n.created_at,
      data: n,
    })),
    {
      type: "created" as const,
      date: lead.created_at,
      data: null,
    },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getScoreStyles = (score: number) => {
    if (score >= 90) return "badge-success";
    if (score >= 75) return "badge-progress";
    if (score >= 60) return "badge-pending";
    return "badge-error";
  };

  const statusBadgeColor: Record<string, string> = {
    Discovery: "badge-pending",
    "Outbound Call": "btn-coral opacity-80",
    "Audit Requested": "badge-progress",
    Closed: "badge-success",
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto py-8 lg:py-10 px-6 lg:px-10 custom-scrollbar overflow-y-auto">
      {/* ── Navigation ── */}
      <div className="flex items-center justify-between mb-10 animate-fade-in">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[13px] text-ink-secondary hover:text-coral transition-colors duration-300 font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Pipeline
        </button>
        <div className="flex items-center gap-3">
          <button
            className="p-2.5 rounded-xl border border-surface-border text-ink-muted"
            disabled
            aria-label="Share lead"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-xl border border-surface-border text-red-500 hover:bg-red-50 transition-smooth"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <div className="card p-8 mb-8 animate-fade-in relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
          <div className="flex items-start gap-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[2rem] bg-surface-bg border-4 border-white shadow-card flex items-center justify-center text-4xl font-black text-ink-secondary relative z-10">
                {lead.name.charAt(0)}
              </div>
            </div>
            <div>
              <h1 className="text-[32px] font-bold text-ink tracking-tight leading-none mb-3">
                {lead.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2 text-[13px] font-bold text-ink-secondary uppercase tracking-widest bg-surface-bg px-4 py-2 rounded-xl border border-surface-border">
                  <Building2 className="w-4 h-4 text-ink-muted" /> {lead.company}
                </span>
                <span className="flex items-center gap-2 text-[13px] text-ink-secondary font-mono font-bold bg-surface-bg px-4 py-2 rounded-xl border border-surface-border">
                  <Phone className="w-4 h-4 text-ink-muted" /> {lead.phone}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <span
                  className={`badge px-4 py-2 font-bold uppercase tracking-widest text-[10px] ${statusBadgeColor[lead.status]}`}
                >
                  {lead.status}
                </span>
                <span
                  className={`badge ${getScoreStyles(lead.score)} px-4 py-2 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Score: {lead.score}
                </span>
                <span className="text-[11px] text-ink-muted flex items-center gap-1.5 font-bold uppercase tracking-widest ml-2">
                  <Calendar className="w-3.5 h-3.5" /> Established {formatDate(lead.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={() => onDial(lead)}
              className="btn-coral px-8 py-4 flex items-center gap-3 shadow-coral"
            >
              <PhoneCall className="w-5 h-5" />
              <span className="font-bold flex flex-col items-start leading-none uppercase tracking-widest text-xs">
                <span>Initiate</span>
                <span className="text-[10px] text-white/70 mt-1">Autonomous Execution</span>
              </span>
            </button>
            <div className="relative group/select">
              <select
                value={lead.status}
                onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                className="w-full bg-surface-bg border border-surface-border rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-ink-secondary focus:outline-none focus:border-coral/30 transition-smooth appearance-none cursor-pointer hover:border-ink-secondary/20 uppercase tracking-widest"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Snapshot ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger-children">
        <div className="card p-6 flex flex-col items-center justify-center text-center group hover:border-coral/20 transition-smooth">
          <div className="text-4xl font-black text-ink tracking-tight tabular-nums mb-2">
            {callLogs.length}
          </div>
          <div className="stat-label flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" /> Session Volume
          </div>
        </div>
        <div className="card p-6 flex flex-col items-center justify-center text-center group hover:border-coral/20 transition-smooth">
          <div className="text-4xl font-black text-ink tracking-tight tabular-nums mb-2">
            {callLogs.length > 0
              ? formatDuration(
                  Math.round(
                    callLogs.reduce((s, c) => s + c.duration_seconds, 0) / callLogs.length,
                  ),
                )
              : "0:00"}
          </div>
          <div className="stat-label flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Mean Duration
          </div>
        </div>
        <div className="card p-6 flex flex-col items-center justify-center text-center group hover:border-coral/20 transition-smooth">
          <div className="text-4xl font-black text-ink tracking-tight tabular-nums mb-2">
            {notes.length}
          </div>
          <div className="stat-label flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5" /> Data Logs
          </div>
        </div>
      </div>

      {/* ── Intelligent Navigation ── */}
      <div className="flex gap-2 bg-surface-bg/50 border border-surface-border rounded-2xl p-1.5 mb-10 relative z-10 shadow-sm">
        {(
          [
            { key: "timeline", label: "Operational Timeline", icon: Activity },
            { key: "calls", label: `Session Intel (${callLogs.length})`, icon: Phone },
            { key: "notes", label: `Knowledge Base (${notes.length})`, icon: StickyNote },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-smooth ${
              activeTab === tab.key
                ? "bg-white text-ink shadow-sm border border-surface-border"
                : "text-ink-secondary hover:text-ink hover:bg-white/40"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Adaptive Content Flow ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-surface-border border-t-coral rounded-full animate-spin"></div>
            <div className="mt-4 text-[11px] font-bold text-ink-secondary uppercase tracking-[0.2em]">
              Synchronizing Records
            </div>
          </div>
        ) : activeTab === "timeline" ? (
          /* Timeline Flow */
          <div className="relative pl-12 ml-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-surface-border"></div>

            <div className="space-y-10 animate-fade-in relative z-10">
              {timelineItems.map((item, i) => (
                <div key={i} className="relative group">
                  <div
                    className={`absolute -left-[54px] top-5 w-4 h-4 rounded-md border-2 border-white shadow-sm z-20 transition-all duration-300 group-hover:scale-110 ${
                      item.type === "call"
                        ? "bg-coral"
                        : item.type === "note"
                          ? "bg-ink"
                          : "bg-ink-faint"
                    }`}
                  ></div>

                  <div className="card p-6 transition-smooth hover:shadow-card-hover hover:border-ink-secondary/10 relative overflow-hidden group/item">
                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-ink-secondary">
                        {item.type === "call" && <Phone className="w-3.5 h-3.5 text-coral" />}
                        {item.type === "note" && <StickyNote className="w-3.5 h-3.5 text-ink" />}
                        {item.type === "created" && (
                          <Activity className="w-3.5 h-3.5 text-ink-muted" />
                        )}
                        <span>
                          {item.type === "call"
                            ? "Execution Session"
                            : item.type === "note"
                              ? "Intelligence Entry"
                              : "Creation Event"}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-muted font-bold tracking-widest">
                        {formatDate(item.date)} • {formatTime(item.date)}
                      </span>
                    </div>

                    <div className="relative z-10">
                      {item.type === "call" && item.data && (
                        <div className="flex items-center justify-between bg-surface-bg px-6 py-4 rounded-2xl border border-surface-border group-hover/item:border-coral/20 transition-smooth">
                          <div className="flex items-center gap-6">
                            <span
                              className={`badge px-3 py-1 text-[10px] font-bold uppercase tracking-tighter ${
                                (item.data as CallLog).status === "Success"
                                  ? "badge-success"
                                  : (item.data as CallLog).status === "Voicemail"
                                    ? "badge-pending"
                                    : "badge-error"
                              }`}
                            >
                              {(item.data as CallLog).status}
                            </span>
                            <span className="flex items-center gap-2 text-sm font-bold text-ink-secondary font-mono">
                              <Clock className="w-4 h-4 text-ink-muted" />
                              {formatDuration((item.data as CallLog).duration_seconds)}
                            </span>
                          </div>
                          <button
                            className="text-[10px] font-bold text-ink-muted uppercase tracking-widest opacity-50"
                            disabled
                          >
                            View full logs <ArrowLeft className="w-3 h-3 rotate-180" />
                          </button>
                        </div>
                      )}

                      {item.type === "note" && item.data && (
                        <p className="text-[15px] text-ink-secondary leading-relaxed font-medium bg-surface-bg/40 p-5 rounded-2xl border border-dashed border-surface-border">
                          {(item.data as LeadNote).content}
                        </p>
                      )}

                      {item.type === "created" && (
                        <p className="text-[15px] text-ink-muted font-bold uppercase tracking-widest italic opacity-60">
                          Record officially added to the database.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {timelineItems.length === 0 && (
                <div className="card p-16 flex flex-col items-center justify-center text-center opacity-70">
                  <Activity className="w-12 h-12 mb-4 text-ink-muted opacity-30" />
                  <p className="font-bold text-ink-secondary text-base">
                    No activity recorded yet.
                  </p>
                  <p className="text-ink-muted text-[13px] mt-1">
                    Start a call with this lead to see it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "calls" ? (
          /* Execution History Flow */
          <div className="space-y-4 animate-fade-in">
            {callLogs.length === 0 ? (
              <div className="card p-16 flex flex-col items-center justify-center text-center opacity-70">
                <Phone className="w-12 h-12 mb-4 text-ink-muted opacity-30" />
                <p className="font-bold text-ink-secondary text-base">
                  No calls with this lead yet.
                </p>
              </div>
            ) : (
              callLogs.map((log) => {
                const isExpanded = expandedCallId === log.id;
                let transcriptData: any[] = [];
                try {
                  transcriptData = JSON.parse(log.transcript);
                } catch {}

                return (
                  <div
                    key={log.id}
                    className={`card overflow-hidden transition-smooth ${isExpanded ? "ring-2 ring-coral/10 shadow-xl" : "hover:border-ink-secondary/10 hover:shadow-card-hover"}`}
                  >
                    <div
                      className={`flex items-center justify-between p-6 cursor-pointer bg-white transition-colors duration-200 ${isExpanded ? "bg-surface-hover/30" : ""}`}
                      onClick={() => setExpandedCallId(isExpanded ? null : log.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setExpandedCallId(isExpanded ? null : log.id)
                      }
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-8 relative z-10">
                        <span
                          className={`badge px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
                            log.status === "Success"
                              ? "badge-success"
                              : log.status === "Voicemail"
                                ? "badge-pending"
                                : "badge-error"
                          }`}
                        >
                          {log.status === "Success" ? (
                            <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2 inline" />
                          )}
                          {log.status}
                        </span>
                        <div className="flex items-center gap-6">
                          <span className="text-sm font-bold text-ink-secondary font-mono flex items-center gap-2">
                            <Clock className="w-4 h-4 text-ink-muted" />{" "}
                            {formatDuration(log.duration_seconds)}
                          </span>
                          <span className="hidden md:flex text-[11px] font-bold text-ink-muted uppercase tracking-widest">
                            {formatDate(log.created_at)} • {formatTime(log.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 relative z-10">
                        <div
                          className={`p-2 rounded-lg border border-surface-border transition-smooth shadow-sm ${isExpanded ? "bg-ink text-white rotate-180" : "bg-surface-bg text-ink-secondary hover:text-ink"}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-surface-border bg-surface-bg/30 p-8 animate-fade-in relative">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-coral"></div>
                            <h4 className="text-[12px] font-bold text-ink uppercase tracking-widest italic">
                              Autonomous Intelligence Matrix
                            </h4>
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">
                            {Array.isArray(transcriptData) ? transcriptData.length : 0} Session
                            Nodes
                          </div>
                        </div>

                        {Array.isArray(transcriptData) && transcriptData.length > 0 ? (
                          <div className="space-y-6 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                            {transcriptData.map((entry: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex gap-4 ${entry.role === "user" ? "justify-end" : ""}`}
                              >
                                {entry.role !== "user" && (
                                  <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center shrink-0 mt-1 shadow-coral overflow-hidden">
                                    <div className="text-white text-[11px] font-black uppercase">
                                      AI
                                    </div>
                                  </div>
                                )}
                                <div
                                  className={`max-w-[75%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm transform transition-all hover:scale-[1.01] ${
                                    entry.role === "user"
                                      ? "bg-ink text-white rounded-tr-sm font-medium"
                                      : "bg-white text-ink border border-surface-border rounded-tl-sm font-medium"
                                  }`}
                                >
                                  {entry.text}
                                </div>
                                {entry.role === "user" && (
                                  <div className="w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <div className="text-ink-secondary text-[11px] font-black uppercase tracking-widest">
                                      {lead.name.charAt(0)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="card p-12 flex flex-col items-center justify-center text-center opacity-60">
                            <Bot className="w-10 h-10 mb-4 text-ink-muted opacity-30" />
                            <p className="font-bold text-ink-secondary text-sm italic">
                              Failed to decompose acoustic data.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Intelligence Repository */
          <div className="space-y-6 animate-fade-in">
            {/* Entry Module */}
            <div className="card p-8 border-dashed border-2 hover:border-coral/30 border-surface-border group transition-smooth">
              <div className="flex gap-6 relative z-10">
                <div className="flex-1">
                  <label
                    htmlFor="lead-note-input"
                    className="stat-label mb-3 flex items-center gap-2"
                  >
                    <StickyNote className="w-3.5 h-3.5" /> Intelligence Entry
                  </label>
                  <textarea
                    id="lead-note-input"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
                    }}
                    placeholder="Imprint observations into the database..."
                    className="w-full bg-surface-bg border border-surface-border rounded-2xl px-6 py-5 text-[16px] text-ink font-medium resize-none focus:outline-none focus:border-coral/40 transition-smooth placeholder:text-ink-muted/50"
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-5">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em]">
                      Hotkey: Cmd/Ctrl + Enter
                    </p>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="btn-dark px-10 py-3.5 flex items-center gap-3 shadow-dark-hover"
                    >
                      <span className="font-bold uppercase tracking-widest text-xs">
                        Imprint Knowledge
                      </span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Objects */}
            {notes.length === 0 ? (
              <div className="card p-20 flex flex-col items-center justify-center text-center opacity-70">
                <StickyNote className="w-16 h-16 mb-6 text-ink-muted opacity-20" />
                <p className="font-bold text-ink-secondary text-base italic">
                  Knowledge base is currently empty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="card p-8 group hover:border-ink-secondary/10 transition-smooth relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="badge badge-pending px-4 py-1.5 font-bold uppercase tracking-widest text-[9px] flex items-center gap-2">
                        <StickyNote className="w-3.5 h-3.5" /> Intel Object
                      </span>
                      <span className="text-[11px] font-bold text-ink-muted tracking-widest">
                        {formatDate(note.created_at)} • {formatTime(note.created_at)}
                      </span>
                    </div>
                    <p className="text-[16px] text-ink-secondary leading-relaxed font-medium whitespace-pre-wrap">
                      {note.content}
                    </p>

                    <div className="mt-8 pt-6 border-t border-surface-border flex justify-end opacity-0 group-hover:opacity-100 transition-smooth">
                      <button
                        className="text-[10px] font-bold text-ink-muted uppercase tracking-widest flex items-center gap-1.5 opacity-50"
                        disabled
                      >
                        Modify record <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
