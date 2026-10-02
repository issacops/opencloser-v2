import React from "react";
import { Lead } from "../../../types";
import { Building2, Phone, Activity, ArrowUpRight, User } from "lucide-react";

interface LeadCardProps {
  key?: React.Key;
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onDial?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
}

export function LeadCard({ lead, onDragStart, onDial, onViewDetails }: LeadCardProps) {
  const getScoreStyles = (score: number) => {
    if (score >= 90) return "badge-success";
    if (score >= 75) return "badge-progress";
    if (score >= 60) return "badge-pending";
    return "badge-error";
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="card card-hover p-4 cursor-grab active:cursor-grabbing group animate-fade-in kanban-card"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-surface-bg flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-ink-muted" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[14px] text-ink truncate tracking-tight">{lead.name}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary mt-0.5 font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          </div>
        </div>
        <div
          className={`badge ${getScoreStyles(lead.score)} font-mono text-[11px] font-bold border border-current opacity-90`}
        >
          {lead.score}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-ink-secondary bg-surface-bg px-3 py-1.5 rounded-lg border border-surface-border font-bold">
        <Phone className="w-3.5 h-3.5 text-ink-muted" />
        <span className="font-mono tracking-tight">{lead.phone}</span>
      </div>

      {lead.status === "Outbound Call" && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-coral bg-coral-light px-3 py-2 rounded-lg border border-coral-medium/50 animate-pulse-glow">
          <Activity className="w-3.5 h-3.5" />
          <span className="font-bold uppercase tracking-wider">AI Execution Active</span>
          <div className="ml-auto flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-coral animate-bounce"></div>
            <div
              className="w-1.5 h-1.5 rounded-full bg-coral animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-surface-border flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onViewDetails && onViewDetails(lead)}
          className="flex items-center gap-1 text-[11px] text-ink-secondary hover:text-coral transition-colors font-bold uppercase tracking-widest"
        >
          Details
          <ArrowUpRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDial && onDial(lead)}
          className="btn-coral py-1.5 px-4 text-[11px] font-bold h-auto shadow-sm"
        >
          Dial
        </button>
      </div>
    </div>
  );
}
