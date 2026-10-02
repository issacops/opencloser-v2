import React, { useState, useEffect, Suspense } from "react";
import { Lead, LeadStatus, ICP } from "../../../types";
import {
  useLeadsQuery,
  useCallLogsQuery,
  useUpdateLeadStatusMutation,
  useDeleteLeadMutation,
} from "../../../services/queries";
import { useToastStore } from "../../../stores/toast.store";
import { useCallStore } from "../../../stores/call.store";
import { useNavigationStore } from "../../../stores/navigation.store";
import { usePersonaStore } from "../../../stores/persona.store";
import type { TranscriptLine } from "../../voice/lib/caller-engine";
import { KanbanColumn } from "./KanbanColumn";
import { Onboarding } from "../../onboarding/components/Onboarding";
import { ICPDisplay } from "../../onboarding/components/ICPDisplay";
import { AudioSetupWizard } from "../../onboarding/components/AudioSetupWizard";
import { LeadHunter } from "../../hunter/components/LeadHunter";
import { CallLogsView } from "./CallLogsView";
import { SettingsView } from "./SettingsView";
import { DashboardHome } from "./DashboardHome";
import { Toast } from "../../../ui/components/Toast";
import { AppShell } from "../../../components/AppShell";
import { isDemoMode } from "../../../services/apiKey";
import { Search } from "lucide-react";

const WarRoom = React.lazy(() =>
  import("../../voice/components/WarRoom").then((m) => ({ default: m.WarRoom })),
);
const PostCallDebrief = React.lazy(() =>
  import("../../voice/components/PostCallDebrief").then((m) => ({ default: m.PostCallDebrief })),
);
const AIPersonaBuilder = React.lazy(() =>
  import("./AIPersonaBuilder").then((m) => ({ default: m.AIPersonaBuilder })),
);
const LeadDetailView = React.lazy(() =>
  import("./LeadDetailView").then((m) => ({ default: m.LeadDetailView })),
);
const ObjectionTrainer = React.lazy(() =>
  import("../../voice/components/ObjectionTrainer").then((m) => ({ default: m.ObjectionTrainer })),
);

const LazyFallback = () => (
  <div
    className="flex items-center justify-center h-full"
    style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}
  >
    Loading...
  </div>
);

const COLUMNS: LeadStatus[] = ["Discovery", "Outbound Call", "Audit Requested", "Closed"];

export function KanbanBoard() {
  const leadsQuery = useLeadsQuery();
  const leads = leadsQuery.data ?? [];
  const loading = leadsQuery.isLoading;
  const updateStatusMutation = useUpdateLeadStatusMutation();
  const deleteLeadMutation = useDeleteLeadMutation();

  // Navigation (global store)
  const appState = useNavigationStore((s) => s.currentPage);
  const setAppState = useNavigationStore((s) => s.navigate);

  const callLogsQuery = useCallLogsQuery();
  const allCallLogs = callLogsQuery.data ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState(0);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [icpData, setIcpData] = useState<ICP | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Persona (global store — loads from localStorage on creation)
  const persona = usePersonaStore((s) => s.persona);
  const setPersona = usePersonaStore((s) => s.setPersona);

  // Call State (global store)
  const activeCallLead = useCallStore((s) => s.activeLead);
  const setActiveCallLead = useCallStore((s) => s.setActiveLead);
  const isPowerDialing = useCallStore((s) => s.isPowerDialing);
  const setIsPowerDialing = useCallStore((s) => s.setIsPowerDialing);
  const debriefData = useCallStore((s) => s.debriefData);
  const setDebriefData = useCallStore((s) => s.setDebriefData);

  // Toast State (global store)
  const toasts = useToastStore((s) => s.toasts);
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);

  // One-time bootstrap: restore session, load data, load persona.
  useEffect(() => {
    const completed = localStorage.getItem("hasCompletedOnboarding");
    if (completed) {
      try {
        const savedIcp = localStorage.getItem("icp_data");
        if (savedIcp) setIcpData(JSON.parse(savedIcp));
      } catch {
        localStorage.removeItem("icp_data");
      }
      // Resume mid-flow if audio setup never finished, otherwise go home.
      if (!localStorage.getItem("hasCompletedAudioSetup")) {
        setAppState("audio_setup");
      } else {
        setAppState("home");
      }
    } else {
      setAppState("onboarding");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once on mount

  // Surface lead-loading failures once.
  useEffect(() => {
    if (leadsQuery.isError) addToast("error", "Failed to load pipeline data.");
  }, [leadsQuery.isError]); // eslint-disable-line react-hooks/exhaustive-deps -- addToast is stable enough

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    const leadToMove = leads.find((l) => l.id === leadId);
    if (!leadToMove || leadToMove.status === status) return;

    if (status === "Outbound Call") {
      setActiveCallLead({ ...leadToMove, status });
    }

    updateStatusMutation.mutate(
      { id: leadId, status },
      {
        onSuccess: () => {
          addToast("success", `Moved to ${status}`);
          if (status === "Closed") {
            addToast("success", `🎉 Deal closed with ${leadToMove.company}!`);
          }
        },
        onError: () => {
          addToast("error", `Failed to move lead — reverted to ${leadToMove.status}.`);
        },
      },
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleOnboardingComplete = (icp: ICP) => {
    setIcpData(icp);
    try {
      localStorage.setItem("hasCompletedOnboarding", "true");
    } catch {}
    try {
      localStorage.setItem("icp_data", JSON.stringify(icp));
    } catch {}
    // Always review the generated ICP first; welcome routes to audio setup if needed.
    setAppState("icp_review");
    addToast("success", "AI Sales Strategy generated successfully.");
  };

  const handleWelcomeContinue = (destination: "home" | "dashboard") => {
    if (!localStorage.getItem("hasCompletedAudioSetup")) {
      sessionStorage.setItem("post_audio_destination", destination);
      setAppState("audio_setup");
    } else {
      setAppState(destination);
    }
  };

  const consumePostAudioDestination = (): "home" | "dashboard" => {
    const dest = sessionStorage.getItem("post_audio_destination");
    sessionStorage.removeItem("post_audio_destination");
    return dest === "dashboard" ? "dashboard" : "home";
  };

  const handleDial = (lead: Lead) => {
    setActiveCallLead(lead);
  };

  const startPowerDialing = () => {
    const outboundLeads = leads.filter((l) => l.status === "Outbound Call");
    if (outboundLeads.length === 0) {
      addToast("info", "No leads in the Outbound Call column to dial.");
      return;
    }
    setIsPowerDialing(true);
    setActiveCallLead(outboundLeads[0]);
    addToast("info", `Starting Power Dial session with ${outboundLeads.length} leads.`);
  };

  const handleWarRoomClose = (callTranscript?: TranscriptLine[], callDuration?: number) => {
    const closedLead = activeCallLead;
    if (isPowerDialing && activeCallLead) {
      const outboundLeads = leads.filter((l) => l.status === "Outbound Call");
      const currentIndex = outboundLeads.findIndex((l) => l.id === activeCallLead.id);
      if (currentIndex !== -1 && currentIndex + 1 < outboundLeads.length) {
        setActiveCallLead(outboundLeads[currentIndex + 1]);
      } else {
        setIsPowerDialing(false);
        setActiveCallLead(null);
        addToast("success", "Power Dialing session complete.");
      }
    } else {
      setActiveCallLead(null);
    }
    if (closedLead && callTranscript && callTranscript.length > 0) {
      setDebriefData({ lead: closedLead, transcript: callTranscript, duration: callDuration || 0 });
    }
  };

  return (
    <>
      <AppShell
        currentPage={appState}
        isPowerDialing={isPowerDialing}
        isDemoMode={isDemoMode()}
        onNavigate={setAppState}
        onPowerDial={startPowerDialing}
        onStopPowerDial={() => setIsPowerDialing(false)}
        search={{
          open: globalSearchOpen,
          value: globalSearch,
          onToggle: () => setGlobalSearchOpen(!globalSearchOpen),
          onChange: (v) => {
            setGlobalSearch(v);
            setSearchQuery(v);
          },
          onClear: () => {
            setGlobalSearchOpen(false);
            setGlobalSearch("");
            setSearchQuery("");
          },
        }}
      >
        {appState === "onboarding" && <Onboarding onComplete={handleOnboardingComplete} />}

        {appState === "icp_review" && icpData && (
          <ICPDisplay icp={icpData} onContinue={() => setAppState("welcome")} />
        )}

        {appState === "welcome" && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center max-w-lg px-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-8 animate-breathe">
                <span className="text-5xl">🚀</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                Your AI Sales Engine is Ready
              </h1>
              <p className="text-lg text-gray-400 mb-3 leading-relaxed">
                We've analyzed your market, built your ICP, and deployed your AI sales persona.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-bold">
                  ✅ ICP Generated
                </span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 font-bold">
                  🎯 Pipeline Seeded
                </span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-xl border border-purple-500/20 font-bold">
                  🤖 AI Caller Ready
                </span>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleWelcomeContinue("home")}
                  className="px-10 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => handleWelcomeContinue("dashboard")}
                  className="px-10 py-4 bg-white/10 text-white hover:bg-white/20 rounded-2xl font-bold text-lg transition-all border border-white/20"
                >
                  Go to Pipeline
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === "audio_setup" && (
          <AudioSetupWizard
            onComplete={() => {
              if (!localStorage.getItem("ai_persona")) {
                setAppState("persona_setup");
              } else {
                setAppState(consumePostAudioDestination());
              }
            }}
          />
        )}

        {(appState === "persona" || appState === "persona_setup") && (
          <Suspense fallback={<LazyFallback />}>
            <AIPersonaBuilder
              initialPersona={persona}
              onSave={(p) => {
                setPersona(p);
                addToast("success", "AI Persona successfully re-programmed.");
                if (appState === "persona_setup") setAppState(consumePostAudioDestination());
              }}
            />
          </Suspense>
        )}

        {appState === "hunter" && (
          <LeadHunter
            icp={icpData}
            onLeadsAdded={() => {
              leadsQuery.refetch();
              setTimeout(() => setAppState("dashboard"), 2000);
            }}
            addToast={addToast}
          />
        )}

        {appState === "call_logs" && <CallLogsView />}

        {appState === "settings" && <SettingsView />}

        {appState === "home" && (
          <DashboardHome
            leads={leads}
            callLogs={allCallLogs}
            onViewLead={(lead) => {
              setSelectedLead(lead);
              setAppState("lead_detail");
            }}
            onDial={(lead) => setActiveCallLead(lead)}
            onNavigate={(page) => setAppState(page as any)}
            addToast={addToast}
          />
        )}

        {appState === "dashboard" &&
          (loading ? (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}
            >
              Loading pipeline…
            </div>
          ) : (
            <div className="flex gap-5 h-full items-start flex-col">
              {/* Search & Filter Bar */}
              <div className="flex items-center gap-3 w-full shrink-0">
                <div className="relative flex-1 max-w-xs">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <label htmlFor="pipeline-search" className="sr-only">
                    Search leads
                  </label>
                  <input
                    id="pipeline-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads…"
                    className="input-field"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {[0, 70, 80, 90].map((score) => (
                    <button
                      key={score}
                      onClick={() => setScoreFilter(scoreFilter === score ? 0 : score)}
                      className="btn-ghost"
                      style={{
                        fontSize: 12,
                        padding: "6px 12px",
                        fontFamily: "var(--font-mono)",
                        background:
                          scoreFilter === score && score > 0
                            ? "var(--accent-coral-light)"
                            : undefined,
                        borderColor:
                          scoreFilter === score && score > 0
                            ? "var(--accent-coral-medium)"
                            : undefined,
                        color:
                          scoreFilter === score && score > 0 ? "var(--accent-coral)" : undefined,
                      }}
                    >
                      {score === 0 ? "All" : `${score}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-5 flex-1 items-start w-full overflow-x-auto pb-2">
                {COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    leads={leads.filter((l) => {
                      const matchesSearch =
                        !searchQuery ||
                        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.company.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesScore = l.score >= scoreFilter;
                      return l.status === status && matchesSearch && matchesScore;
                    })}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDial={handleDial}
                    onViewDetails={(lead) => {
                      setSelectedLead(lead);
                      setAppState("lead_detail");
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

        {appState === "trainer" && (
          <Suspense fallback={<LazyFallback />}>
            <ObjectionTrainer icp={icpData} />
          </Suspense>
        )}

        {appState === "lead_detail" && selectedLead && (
          <Suspense fallback={<LazyFallback />}>
            <LeadDetailView
              lead={selectedLead}
              icp={icpData}
              onBack={() => {
                setSelectedLead(null);
                setAppState("dashboard");
              }}
              onDial={(lead) => setActiveCallLead(lead)}
              onDelete={(leadId) => {
                deleteLeadMutation.mutate(leadId, {
                  onSuccess: () => {
                    setSelectedLead(null);
                    setAppState("dashboard");
                    addToast("success", "Lead deleted successfully.");
                  },
                  onError: () => addToast("error", "Failed to delete lead."),
                });
              }}
              onStatusChange={(leadId, newStatus) => {
                updateStatusMutation.mutate(
                  { id: leadId, status: newStatus },
                  {
                    onSuccess: () => {
                      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
                      addToast("success", `Lead moved to ${newStatus}.`);
                    },
                    onError: () => addToast("error", "Failed to update lead status."),
                  },
                );
              }}
            />
          </Suspense>
        )}
      </AppShell>

      {/* War Room Modal */}
      {activeCallLead && (
        <Suspense fallback={<LazyFallback />}>
          <WarRoom lead={activeCallLead} icp={icpData} onClose={handleWarRoomClose} />
        </Suspense>
      )}

      {/* Post-Call Debrief */}
      {debriefData && (
        <Suspense fallback={<LazyFallback />}>
          <PostCallDebrief
            lead={debriefData.lead}
            icp={icpData}
            transcript={debriefData.transcript}
            durationSeconds={debriefData.duration}
            onClose={() => setDebriefData(null)}
          />
        </Suspense>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </>
  );
}
