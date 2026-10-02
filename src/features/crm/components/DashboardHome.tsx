import { Lead } from "../../../types";
import { CallLog } from "../../../services/lead.service";
import { KPIColumn } from "./dashboard/KPIColumn";
import { StatsAndChart } from "./dashboard/StatsAndChart";
import { RecentCallsTable } from "./dashboard/RecentCallsTable";

interface DashboardHomeProps {
  leads: Lead[];
  callLogs: CallLog[];
  onViewLead: (lead: Lead) => void;
  onDial: (lead: Lead) => void;
  onNavigate: (page: string) => void;
  addToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export function DashboardHome({
  leads,
  callLogs,
  onViewLead: _onViewLead,
  onDial: _onDial,
  onNavigate,
  addToast,
}: DashboardHomeProps) {
  // Stats
  const outbound = leads.filter((l) => l.status === "Outbound Call").length;
  const closed = leads.filter((l) => l.status === "Closed").length;

  const totalCalls = callLogs.length;
  const successCalls = callLogs.filter((c) => c.status === "Success").length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
  const totalTalkSecs = callLogs.reduce((s, c) => s + c.duration_seconds, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalTalkSecs / totalCalls) : 0;
  const hotLeads = [...leads]
    .filter((l) => l.status !== "Closed")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Get top 2 for the "Cards" view

  const recentCalls = callLogs.slice(0, 6);

  // Bar chart reflecting actual pipeline distribution
  const statusCounts: Record<string, number> = {};
  leads.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  });
  const barData = [
    { label: "Discovery", active: statusCounts["Discovery"] || 0, closed: 0 },
    { label: "Outbound", active: statusCounts["Outbound Call"] || 0, closed: 0 },
    { label: "Audit", active: statusCounts["Audit Requested"] || 0, closed: 0 },
    { label: "Closed", active: 0, closed: statusCounts["Closed"] || 0 },
  ];
  const barMax = Math.max(1, ...barData.map((d) => d.active + d.closed));

  return (
    <div className="flex flex-col w-full max-w-[1500px] mx-auto py-8 transition-all duration-300 px-4 md:px-8">
      {/* ── Welcome Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#171717] flex items-center gap-2">
            Good morning, Sales Lead
          </h1>
          <p className="text-[#6B7280] mt-1 text-[14px]">
            Stay on top of your tasks, monitor progress, and track status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <KPIColumn
          leads={leads}
          outbound={outbound}
          hotLeads={hotLeads}
          onNavigate={onNavigate}
          addToast={addToast}
        />

        {/* ── MIDDLE & RIGHT COLUMNS (Approx 8.5/12) ── */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {/* Top Row: 2x2 Stats Grid + Bar Chart */}
          <StatsAndChart
            successRate={successRate}
            totalCalls={totalCalls}
            avgDuration={avgDuration}
            closed={closed}
            barData={barData}
            barMax={barMax}
          />

          {/* ── Recent Activities Table ── */}
          <RecentCallsTable recentCalls={recentCalls} />
        </div>
      </div>
    </div>
  );
}
