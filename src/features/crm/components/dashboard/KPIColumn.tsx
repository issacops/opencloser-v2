import { Lead } from "../../../../types";
import { Briefcase, ArrowRightLeft, ArrowDownToLine, Wallet } from "lucide-react";

interface KPIColumnProps {
  leads: Lead[];
  outbound: number;
  hotLeads: Lead[];
  onNavigate: (page: string) => void;
  addToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export function KPIColumn({ leads, outbound, hotLeads, onNavigate, addToast }: KPIColumnProps) {
  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
      {/* Pipeline Volume (Matches Total Balance) */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F0F0F0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#6B7280] text-[15px] font-medium">Pipeline Volume</span>
          <div className="flex items-center gap-1.5 bg-[#F4F5F7] px-2.5 py-1 rounded-full text-[12px] font-semibold text-[#171717]">
            <Briefcase className="w-3.5 h-3.5 text-[#3B82F6]" />
            Volume
          </div>
        </div>
        <div className="text-[38px] font-extrabold text-[#171717] tracking-tight mb-2">
          {leads.length}{" "}
          <span className="text-[18px] text-[#A1A1AA] font-medium tracking-normal">leads</span>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <span className="bg-[#ECFDF5] text-[#10B981] px-2 py-0.5 rounded flex items-center text-[12px] font-bold">
            {leads.length} active
          </span>
          <span className="text-[#A1A1AA] text-[13px] font-medium">across pipeline</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("hunter")}
            className="flex-1 bg-[#1A1D20] text-white rounded-full py-3 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#2D3136] transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => {
              const csv = [
                ["Name", "Company", "Phone", "Status", "Score"].join(","),
                ...leads.map((l) => [l.name, l.company, l.phone, l.status, l.score].join(",")),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "opencloser_leads.csv";
              a.click();
              URL.revokeObjectURL(url);
              addToast?.("success", "Leads exported as CSV");
            }}
            className="flex-1 bg-white border border-[#E0E0E0] text-[#171717] rounded-full py-3 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#F4F5F7] transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Funnel Health (Matches Monthly Spending Limit) */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F0F0F0]">
        <div className="text-[#171717] text-[15px] font-bold mb-4">Dialer Capacity</div>

        <div className="w-full h-2.5 bg-[#F4F5F7] rounded-full overflow-hidden mb-3 flex">
          <div className="h-full bg-[#FF5C39]" style={{ width: "25%" }}></div>
          <div
            className="h-full bg-repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,92,57,0.1) 4px, rgba(255,92,57,0.1) 8px)"
            style={{ width: "75%" }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[13px] font-semibold text-[#171717]">
          <span>{outbound} active</span>
          <span className="text-[#A1A1AA]">100 limit</span>
        </div>
      </div>

      {/* Priority Targets (Matches My Cards) */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F0F0F0]">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[#171717] text-[15px] font-bold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#A1A1AA]" />
            Priority Targets
          </div>
          <button
            onClick={() => onNavigate("hunter")}
            className="text-[#6B7280] text-[13px] font-semibold hover:text-[#171717] flex items-center gap-1 bg-[#F4F5F7] px-3 py-1.5 rounded-full"
          >
            + Add new
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar -mx-2 px-2 snap-x">
          {/* Dark Card */}
          <div className="min-w-[220px] h-[140px] bg-[#1A1D20] text-white rounded-[20px] p-4 flex flex-col justify-between relative overflow-hidden shrink-0 snap-start shadow-[0_8px_24px_rgba(26,29,32,0.25)] hover:scale-[1.02] transition-transform cursor-pointer">
            {/* Decorative squares */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-white/[0.03] rounded-lg"></div>
            <div className="absolute top-8 right-12 w-16 h-16 bg-white/[0.02] rounded-lg"></div>

            <div className="flex items-center justify-between">
              <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60"></span>
                Hot Lead
              </span>
              {/* Master card logo mock */}
              <div className="flex relative items-center justify-center opacity-80 mix-blend-screen overflow-hidden w-8 h-5">
                <div className="w-5 h-5 bg-[#FF5C39] rounded-full absolute left-0"></div>
                <div className="w-5 h-5 bg-[#F59E0B] rounded-full absolute right-0 mix-blend-multiply"></div>
              </div>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div>
                <div className="text-[10px] text-white/50 mb-0.5">Target Company</div>
                <div className="font-mono text-[14px] font-bold tracking-wider">
                  {hotLeads[0]?.company || "N/A"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/50 mb-0.5">Score</div>
                <div className="font-mono text-[14px] font-bold">{hotLeads[0]?.score || "0"}</div>
              </div>
            </div>
          </div>

          {/* Coral Card */}
          <div className="min-w-[180px] h-[140px] bg-gradient-to-br from-[#FF6B4A] to-[#FF451A] text-white rounded-[20px] p-4 flex flex-col justify-between relative overflow-hidden shrink-0 snap-start shadow-[0_8px_24px_rgba(255,92,57,0.25)] hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

            <div className="flex items-center justify-between">
              <span className="bg-white/20 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                Warm
              </span>
            </div>

            <div className="flex items-end justify-between mt-auto">
              <div>
                <div className="text-[10px] text-white/60 mb-0.5">Target Company</div>
                <div className="font-mono text-[14px] font-bold tracking-wider">
                  {hotLeads[1]?.company || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
