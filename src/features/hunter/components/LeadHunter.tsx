import React, { useState } from "react";
import { Search, MapPin, Filter, Play, Loader2, Database } from "lucide-react";
import { ICP } from "../../../types";
import { ToastType } from "../../../ui/components/Toast";
import { simulateLeadScraping, type LeadResult } from "../../../services/ai.service";
import { useAddLeadsMutation } from "../../../services/queries";
import { isDemoMode } from "../../../services/apiKey";

interface LeadHunterProps {
  icp: ICP | null;
  onLeadsAdded: () => void;
  addToast: (type: ToastType, message: string) => void;
}

export function LeadHunter({ icp, onLeadsAdded, addToast }: LeadHunterProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const addLeadsMutation = useAddLeadsMutation();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location.trim() || isScraping) return;

    setIsScraping(true);
    setResults([]);

    try {
      const leads = await simulateLeadScraping(query, location, icp);

      const formattedLeads = leads.map((lead) => ({
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        score: lead.score,
      }));

      const addedCount = await addLeadsMutation.mutateAsync(formattedLeads);

      setResults(leads);
      if (addedCount > 0) {
        addToast(
          "success",
          `Generated and saved ${addedCount} new lead${addedCount !== 1 ? "s" : ""}.`,
        );
      }

      const skippedCount = leads.length - addedCount;
      if (skippedCount > 0) {
        addToast(
          "warning",
          `Skipped ${skippedCount} duplicate lead${skippedCount !== 1 ? "s" : ""} that already existed in your CRM.`,
        );
      }
      onLeadsAdded(); // Trigger a refresh of the Kanban board
    } catch (error) {
      console.error("Failed to generate leads:", error);
      addToast(
        "error",
        `Lead generation failed: ${typeof error === "string" ? error : "unknown error. Check your Gemini key in Settings."}`,
      );
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-8 py-8 transition-all">
      <div className="flex flex-col h-full w-full bg-white rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#F0F0F0] relative z-10 transition-all">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#F0F0F0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1EE] flex items-center justify-center border border-[#FFD4CC] shadow-[0_4px_12px_rgba(255,92,57,0.1)]">
              <Search className="w-6 h-6 text-[#FF5C39]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#171717] tracking-tight">Lead Hunter</h2>
              <p className="text-[13px] text-[#A1A1AA] font-semibold mt-0.5">
                AI Lead Generation Engine
              </p>
            </div>
          </div>

          {icp && (
            <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#10B981]/20 px-4 py-2 rounded-full">
              <Filter className="w-4 h-4 text-[#10B981]" />
              <span className="text-[12px] text-[#10B981] font-bold tracking-wide uppercase">
                ICP Filters Active
              </span>
            </div>
          )}
        </div>

        {/* Search Controls */}
        <div className="p-8 border-b border-[#F0F0F0] bg-white">
          <form onSubmit={handleScrape} className="flex gap-4">
            <div className="flex-1 relative group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#FF5C39] transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Plumbers, SaaS Founders, Dentists..."
                className="w-full bg-[#F4F5F7] border border-transparent rounded-2xl pl-12 pr-4 py-[18px] text-[14px] text-[#171717] font-medium focus:outline-none focus:bg-white focus:border-[#FF5C39] transition-all duration-200 placeholder:text-[#A1A1AA] shadow-inner hover:border-[#E0E0E0]"
                required
              />
            </div>
            <div className="w-72 relative group">
              <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] group-focus-within:text-[#FF5C39] transition-colors" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Austin, TX)"
                className="w-full bg-[#F4F5F7] border border-transparent rounded-2xl pl-12 pr-4 py-[18px] text-[14px] text-[#171717] font-medium focus:outline-none focus:bg-white focus:border-[#FF5C39] transition-all duration-200 placeholder:text-[#A1A1AA] shadow-inner hover:border-[#E0E0E0]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isScraping || !query.trim() || !location.trim()}
              className="flex items-center gap-2 bg-[#FF5C39] hover:bg-[#E84B1A] disabled:bg-[#E9ECEF] disabled:text-[#A1A1AA] text-white px-8 py-[18px] rounded-2xl font-bold transition-all duration-200 disabled:shadow-none shadow-[0_4px_16px_rgba(255,92,57,0.25)] text-[14px]"
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start Campaign
                </>
              )}
            </button>
          </form>

          {/* ICP Context Display */}
          {icp && (
            <div className="mt-6 p-5 bg-[#F4F5F7]/50 border border-[#F0F0F0] rounded-[20px] flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0F0F0] flex items-center justify-center shrink-0 shadow-sm">
                <Database className="w-5 h-5 text-[#A1A1AA]" />
              </div>
              <div className="flex flex-col justify-center h-10">
                <div className="text-[13px] font-bold text-[#171717] mb-0.5">Targeting Context</div>
                <div className="text-[12px] text-[#6B7280] font-medium leading-relaxed">
                  The extraction engine prioritizes leads matching:{" "}
                  <span className="text-[#FF5C39] font-bold">{icp.targetAudience}</span>. Results
                  will be auto-scored based on relevance.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7]/40">
          {isScraping ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6B7280] space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-[3px] border-[#FFD4CC] rounded-full"></div>
                <div className="absolute inset-0 border-[3px] border-[#FF5C39] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="font-mono text-[13px] font-bold animate-pulse text-[#1A1D20]">
                {isDemoMode() ? "Generating demo leads..." : "Asking Gemini for matching leads..."}
              </div>
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
                {isDemoMode()
                  ? "No API key configured — results are sample data"
                  : "AI-generated leads scored against your ICP"}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-[#171717]">Generation Complete</h3>
                <span className="text-[12px] font-bold text-[#10B981] bg-[#ECFDF5] px-3 py-1.5 rounded-full border border-[#10B981]/20">
                  {results.length} Leads Added to CRM
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {results.map((lead, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#F0F0F0] shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-[20px] p-5 flex flex-col gap-4 hover:border-[#E0E0E0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[#171717] text-[15px] group-hover:text-[#FF5C39] transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-[13px] text-[#A1A1AA] font-semibold mt-0.5">
                          {lead.company}
                        </div>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#10B981]/20">
                        Score: {lead.score}
                      </div>
                    </div>
                    <div className="text-[13px] font-mono font-bold text-[#6B7280] bg-[#F4F5F7] px-3 py-2 rounded-xl border border-[#F0F0F0] inline-block self-start">
                      {lead.phone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#A1A1AA]">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-semibold text-[14px]">
                Enter a query and location to generate leads.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
