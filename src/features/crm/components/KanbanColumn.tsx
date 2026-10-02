import React from "react";
import { Lead, LeadStatus } from "../../../types";
import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  key?: React.Key;
  status: LeadStatus;
  leads: Lead[];
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onDrop: (e: React.DragEvent, status: LeadStatus) => void | Promise<void>;
  onDragOver: (e: React.DragEvent) => void;
  onDial?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
}

const STATUS_STYLE: Record<string, { dot: string; text: string; bg: string }> = {
  Discovery: { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50/50" },
  "Outbound Call": { dot: "bg-coral", text: "text-coral", bg: "bg-coral-light/50" },
  "Audit Requested": { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/50" },
  Closed: { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50/50" },
};

export function KanbanColumn({
  status,
  leads,
  onDragStart,
  onDrop,
  onDragOver,
  onDial,
  onViewDetails,
}: KanbanColumnProps) {
  const style = STATUS_STYLE[status] || {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-surface-bg/50",
  };
  const [isOver, setIsOver] = React.useState(false);

  return (
    <div
      className="flex flex-col w-80 shrink-0 h-full"
      onDrop={(e) => {
        setIsOver(false);
        onDrop(e, status);
      }}
      onDragOver={onDragOver}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h2
          className={`text-[12px] font-bold uppercase tracking-[0.12em] ${style.text} flex items-center gap-2.5`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm`}></span>
          {status}
        </h2>
        <span className="text-[11px] font-bold text-ink-secondary bg-white px-2.5 py-1 rounded-lg border border-surface-border shadow-sm">
          {leads.length}
        </span>
      </div>

      <div
        className={`flex-1 overflow-y-auto pb-6 flex flex-col gap-3.5 min-h-[200px] rounded-2xl border ${isOver ? "border-coral/50 shadow-[inset_0_0_0_2px_rgba(255,92,57,0.1)]" : "border-transparent hover:border-surface-border"} transition-all duration-200 p-2 stagger-children custom-scrollbar ${style.bg}`}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDragStart={onDragStart}
            onDial={onDial}
            onViewDetails={onViewDetails}
          />
        ))}

        {leads.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-muted opacity-30 italic text-xs py-10">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}
