import {
  CheckCircle2,
  Target,
  Briefcase,
  Users,
  Zap,
  Bot,
  ChevronRight,
  Building2,
  ShieldAlert,
  Swords,
  Activity,
} from "lucide-react";
import { ICP } from "../../../types";

interface ICPDisplayProps {
  icp: ICP;
  onContinue: () => void;
}

export function ICPDisplay({ icp, onContinue }: ICPDisplayProps) {
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col h-full glass-card rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/[0.05] bg-black/40 backdrop-blur-2xl animate-scale-in">
        {/* Header */}
        <div className="px-10 py-8 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-md animate-pulse"></div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30 relative z-10 glow-emerald">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                Strategic Protocol Mapped
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30 uppercase tracking-widest shine">
                  Deployed
                </span>
              </h2>
              <p className="text-gray-400 text-sm mt-2 font-medium max-w-xl">
                The intelligence core has analyzed your vector. Your AI Sales architecture is fully
                calibrated and ready for outbound execution.
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 custom-scrollbar">
          {/* Left Column */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <section className="group">
              <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                <Target className="w-4 h-4 text-blue-400" /> Target Demographic
              </h3>
              <div className="bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 transition-colors duration-300 rounded-2xl p-6 text-sm text-gray-200 leading-relaxed shadow-lg">
                {icp.targetAudience}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-5">
              <section className="bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors duration-300 rounded-2xl p-5 shadow-lg">
                <h4 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" /> Sector
                </h4>
                <p className="text-base text-white font-semibold">{icp.industry || "—"}</p>
              </section>
              <section className="bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors duration-300 rounded-2xl p-5 shadow-lg">
                <h4 className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Scale
                </h4>
                <p className="text-base text-white font-semibold">{icp.companySize || "—"}</p>
              </section>
            </div>

            {icp.decisionMakerTitles && icp.decisionMakerTitles.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                  <Users className="w-4 h-4 text-indigo-400" /> Key Stakeholders
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {icp.decisionMakerTitles.map((title, i) => (
                    <span
                      key={i}
                      className="text-xs bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/20 font-medium shadow-sm"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                <Zap className="w-4 h-4 text-rose-400" /> Friction Points
              </h3>
              <ul className="space-y-3">
                {icp.painPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 bg-white/[0.02] border border-white/[0.05] hover:border-rose-500/20 hover:bg-rose-500/[0.02] transition-colors duration-300 rounded-2xl p-5 shadow-lg group/item"
                  >
                    <span className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 text-xs font-mono border border-rose-500/20 mt-0.5 group-hover/item:bg-rose-500/20 group-hover/item:scale-110 transition-all">
                      0{i + 1}
                    </span>
                    <span className="text-[13px] text-gray-300 leading-relaxed pt-1">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4 relative z-10">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Value Proposition
              </h3>
              <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl p-6 text-[14px] text-emerald-50 leading-relaxed shadow-lg relative z-10">
                {icp.valueProposition}
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                <Activity className="w-4 h-4 text-purple-400" /> Execution Methodology
              </h3>
              <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full"></div>
                <div className="text-xl font-bold text-purple-300 mb-3 leading-tight relative z-10 tracking-tight">
                  {icp.salesMethodology}
                </div>
                <p className="text-[13px] text-purple-200/70 leading-relaxed relative z-10 font-medium">
                  {icp.salesMethodology.includes("SPIN")
                    ? "Prioritizing Situation, Problem, Implication, and Need-Payoff diagnostics to uncover systemic operational pain."
                    : icp.salesMethodology.includes("Challenger")
                      ? "Assume control. Dismantle assumptions. Educate the prospect with commercial insight."
                      : icp.salesMethodology.includes("Sandler")
                        ? "Mutual qualification protocol. Identify pain vectors, budgetary constraints, and decision architecture."
                        : "High-velocity execution. Maintain absolute control. Direct the prospect toward immediate closure via straight-line mechanics."}
                </p>
              </div>
            </section>

            {icp.objections && icp.objections.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Anticipated Resistance
                </h3>
                <ul className="space-y-2.5">
                  {icp.objections.map((obj, i) => (
                    <li
                      key={i}
                      className="text-[13px] text-amber-200/90 bg-amber-500/[0.08] hover:bg-amber-500/[0.12] transition-colors border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 shadow-sm"
                    >
                      <span className="text-amber-500 font-mono text-sm mt-0.5 shrink-0 animate-pulse">
                        !
                      </span>
                      <span className="leading-relaxed">{obj}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {icp.competitorNames && icp.competitorNames.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
                  <Swords className="w-4 h-4 text-red-400" /> Competitive Landscape
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {icp.competitorNames.map((comp, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-500/10 text-red-300 px-4 py-2 rounded-xl border border-red-500/20 font-medium"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Full Width System Prompt */}
          <section
            className="col-span-1 md:col-span-2 mt-4 animate-fade-in"
            style={{ animationDelay: "300ms" }}
          >
            <h3 className="flex items-center gap-2 text-[11px] font-mono text-gray-500 uppercase tracking-[0.15em] mb-4">
              <Bot className="w-4 h-4 text-emerald-500" /> Neural Architecture Prompt (Terminal
              Output)
            </h3>
            <div className="bg-[#050505] border border-white/[0.08] rounded-2xl p-6 font-mono text-[11px] md:text-xs text-emerald-400/80 leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner relative group">
              <div className="absolute top-2 right-4 text-[10px] text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                /sys/core/prompt.sh
              </div>
              {icp.systemPrompt}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-6 border-t border-white/[0.05] bg-white/[0.01] flex justify-end items-center relative z-10">
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500 uppercase tracking-widest mr-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Systems Nominal
          </div>
          <button
            onClick={onContinue}
            className="flex items-center gap-3 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 group"
          >
            Acknowledge & Initialize
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
