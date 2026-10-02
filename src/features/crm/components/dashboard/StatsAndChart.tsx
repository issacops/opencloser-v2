import { TrendingUp, Phone, Clock, Target, MoreHorizontal } from "lucide-react";
import { BarDatum, formatDuration } from "./utils";

interface StatsAndChartProps {
  successRate: number;
  totalCalls: number;
  avgDuration: number;
  closed: number;
  barData: BarDatum[];
  barMax: number;
}

export function StatsAndChart({
  successRate,
  totalCalls,
  avgDuration,
  closed,
  barData,
  barMax,
}: StatsAndChartProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* 2x2 Stats Grid taking 3 cols */}
      <div className="xl:col-span-3 grid grid-cols-2 gap-4 md:gap-6">
        {/* Card 1: Success Rate (Orange Solid) */}
        <div className="bg-gradient-to-br from-[#FF6B4A] to-[#FF451A] rounded-[24px] p-5 shadow-[0_8px_24px_rgba(255,92,57,0.25)] flex flex-col justify-between aspect-[1.4/1] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative">
            <span className="text-white/90 text-[14px] font-semibold">Success Rate</span>
            <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="relative">
            <div className="text-[36px] font-extrabold text-white mb-2 leading-none">
              {successRate}%
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-white/20 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                {totalCalls} calls
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Outbound Calls (White) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#F0F0F0] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between aspect-[1.4/1] hover:border-[#E0E0E0] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#6B7280] text-[14px] font-semibold">Outbound Calls</span>
            <div className="p-2 bg-[#F4F5F7] rounded-xl group-hover:bg-[#E9ECEF] transition-colors">
              <Phone className="w-4 h-4 text-[#171717]" />
            </div>
          </div>
          <div>
            <div className="text-[36px] font-extrabold text-[#171717] mb-2 leading-none">
              {totalCalls}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#F4F5F7] text-[#171717] text-[11px] font-bold px-1.5 py-0.5 rounded">
                {totalCalls} calls
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Duration (White) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#F0F0F0] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between aspect-[1.4/1] hover:border-[#E0E0E0] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#6B7280] text-[14px] font-semibold">Call Duration</span>
            <div className="p-2 bg-[#F4F5F7] rounded-xl group-hover:bg-[#E9ECEF] transition-colors">
              <Clock className="w-4 h-4 text-[#171717]" />
            </div>
          </div>
          <div>
            <div className="text-[36px] font-extrabold text-[#171717] mb-2 leading-none">
              {formatDuration(avgDuration)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#F4F5F7] text-[#171717] text-[11px] font-bold px-1.5 py-0.5 rounded">
                {totalCalls} sessions
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Closed Won (White) */}
        <div className="bg-white rounded-[24px] p-5 border border-[#F0F0F0] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between aspect-[1.4/1] hover:border-[#E0E0E0] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#6B7280] text-[14px] font-semibold">Deals Closed</span>
            <div className="p-2 bg-[#F4F5F7] rounded-xl group-hover:bg-[#E9ECEF] transition-colors">
              <Target className="w-4 h-4 text-[#171717]" />
            </div>
          </div>
          <div>
            <div className="text-[36px] font-extrabold text-[#171717] mb-2 leading-none">
              {closed}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#F4F5F7] text-[#171717] text-[11px] font-bold px-1.5 py-0.5 rounded">
                {closed} won
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart taking 2 cols */}
      <div className="xl:col-span-2 bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#F0F0F0] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[#171717] text-[16px] font-bold">Pipeline Status</h3>
          <button className="text-[#A1A1AA] opacity-50" disabled>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[#A1A1AA] text-[13px] font-medium mb-6">
          Distribution across pipeline stages
        </p>

        <div className="flex items-center justify-end gap-4 mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C39]"></div>
            <span className="text-[12px] font-bold text-[#6B7280]">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
            <span className="text-[12px] font-bold text-[#6B7280]">Won</span>
          </div>
        </div>

        {/* Chart Grid Area */}
        <div className="relative flex-1 flex items-end justify-between px-2 min-h-[140px]">
          {/* Horizontal grid lines */}
          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none">
            {[
              barMax,
              Math.ceil(barMax * 0.75),
              Math.ceil(barMax * 0.5),
              Math.ceil(barMax * 0.25),
              0,
            ].map((val, idx) => (
              <div
                key={idx}
                className="w-full border-b border-dashed border-[#E9ECEF] flex items-end"
              >
                <span className="absolute -left-4 text-[10px] font-bold text-[#A1A1AA] transform -translate-y-1.5">
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Bars */}
          {barData.map((data, i) => (
            <div
              key={i}
              className="relative z-10 w-[45px] flex flex-col justify-end items-center gap-1 group cursor-pointer h-full"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 bg-[#1A1D20] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {data.active + data.closed} leads
              </div>
              <div
                className="w-full flex flex-col justify-end items-center gap-1"
                style={{ height: "100%" }}
              >
                {data.closed > 0 && (
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 bg-[#10B981]"
                    style={{ height: `${(data.closed / barMax) * 100}%` }}
                  ></div>
                )}
                {data.active > 0 && (
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 bg-[#FF5C39]"
                    style={{ height: `${(data.active / barMax) * 100}%` }}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* X Axis labels */}
        <div className="flex justify-between px-2 mt-4 text-[#A1A1AA] text-[11px] font-bold">
          {barData.map((d) => (
            <div key={d.label}>{d.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
