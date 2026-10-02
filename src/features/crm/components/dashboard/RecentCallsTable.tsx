import { Search, Filter, Activity, MoreHorizontal } from "lucide-react";
import { CallLog } from "../../../../services/lead.service";
import { formatDuration } from "./utils";

interface RecentCallsTableProps {
  recentCalls: CallLog[];
}

export function RecentCallsTable({ recentCalls }: RecentCallsTableProps) {
  return (
    <div className="bg-white rounded-[24px] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F0F0F0] overflow-hidden flex-1 flex flex-col mt-2">
      {/* Table Header Controls */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#F0F0F0]">
        <h3 className="text-[#171717] text-[16px] font-bold">Recent Activities</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search"
              className="bg-[#F4F5F7] border border-transparent rounded-full pl-9 pr-4 py-2 text-[13px] font-medium outline-none focus:border-[#E0E0E0] focus:bg-white transition-colors w-[180px] opacity-50"
              disabled
            />
          </div>
          <button
            className="flex items-center gap-2 bg-[#F4F5F7] px-4 py-2 rounded-full text-[13px] font-bold text-[#A1A1AA] opacity-50"
            disabled
          >
            Filter <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[#A1A1AA] text-[12px] font-semibold border-b border-[#F0F0F0] bg-white">
              <th className="px-4 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-[#E0E0E0] text-[#FF5C39] focus:ring-[#FF5C39]"
                />
              </th>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]/50">
            {recentCalls.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-[#A1A1AA] font-medium text-[14px]"
                >
                  No activities yet
                </td>
              </tr>
            ) : (
              recentCalls.map((call, i) => (
                <tr key={call.id} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      defaultChecked={i === 3}
                      className={`rounded border-[#E0E0E0] ${i === 3 ? "text-[#1A1D20]" : "text-[#FF5C39]"} focus:ring-0 cursor-pointer`}
                    />
                  </td>
                  <td className="px-4 py-4 text-[#A1A1AA] font-mono text-[13px]">
                    {call.lead_name || "Unknown Lead"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded shrink-0 bg-[#E0F2FE] flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
                      </div>
                      <span className="font-bold text-[#171717] text-[13px]">
                        {call.lead_company || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#171717] font-bold text-[13px] font-mono">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${call.status === "Success" ? "bg-[#10B981]" : call.status === "Voicemail" ? "bg-[#F59E0B]" : "bg-[#EF4444]"}`}
                      ></div>
                      <span className="text-[12px] font-bold text-[#171717]">{call.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#A1A1AA] font-semibold text-[13px]">
                    {new Date(call.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(call.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-4 text-center text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="opacity-50" disabled>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
