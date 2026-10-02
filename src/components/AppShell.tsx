import React from "react";
import {
  Phone,
  Search,
  Settings,
  Plus,
  LayoutDashboard,
  Target,
  Bot,
  Home,
  Swords,
  Zap,
  Bell,
  ChevronDown,
} from "lucide-react";
import { APP_TITLE, NAV_ITEMS, SIDEBAR_TOP, SIDEBAR_BOTTOM } from "../constants";
import type { AppPage } from "../stores/navigation.store";

interface AppShellSearch {
  open: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
  onClear: () => void;
}

interface AppShellProps {
  currentPage: AppPage;
  isPowerDialing: boolean;
  isDemoMode: boolean;
  onNavigate: (page: AppPage) => void;
  onPowerDial: () => void;
  onStopPowerDial: () => void;
  search?: AppShellSearch;
  children: React.ReactNode;
}

const SIDEBAR_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Home,
  LayoutDashboard,
  Phone,
  Target,
  Bot,
  Swords,
  Settings,
};

const HIDDEN_FROM_SHELL: AppPage[] = [
  "onboarding",
  "icp_review",
  "audio_setup",
  "persona_setup",
  "welcome",
];

export function AppShell({
  currentPage,
  isPowerDialing,
  isDemoMode,
  onNavigate,
  onPowerDial,
  onStopPowerDial,
  search,
  children,
}: AppShellProps) {
  const showShell = !HIDDEN_FROM_SHELL.includes(currentPage);
  const activeNav = currentPage === "lead_detail" ? "dashboard" : currentPage;

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {showShell && (
        <header
          className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ zIndex: 50, background: "transparent" }}
        >
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: "var(--accent-coral)", boxShadow: "var(--shadow-coral)" }}
            >
              <Phone className="w-5 h-5 fill-current" />
            </div>
            <span
              className="text-[22px] font-extrabold"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
            >
              {APP_TITLE}
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider ml-1">
                Demo Mode
              </span>
            )}
          </div>

          <nav className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.state}
                onClick={() => onNavigate(item.state as AppPage)}
                className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 ${
                  activeNav === item.state
                    ? "bg-[#1A1D20] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            {currentPage === "dashboard" && (
              <button
                onClick={isPowerDialing ? onStopPowerDial : onPowerDial}
                className={
                  isPowerDialing ? "btn-coral rounded-full" : "btn-ghost rounded-full bg-white"
                }
                style={{
                  fontSize: 13,
                  padding: "9px 18px",
                  border: "none",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                }}
              >
                <Zap className="w-4 h-4" /> {isPowerDialing ? "Stop Dialer" : "Power Dial"}
              </button>
            )}

            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={search?.onToggle}
                disabled={!search}
                aria-label="Search leads"
              >
                <Search className="w-5 h-5" />
              </button>
              {search?.open && (
                <input
                  type="text"
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") search.onClear();
                  }}
                  placeholder="Search by name or company..."
                  className="bg-transparent border-none outline-none text-sm font-medium text-gray-900 w-48 placeholder:text-gray-400"
                  autoFocus
                />
              )}
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 opacity-50"
                disabled
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-[1px] h-6 bg-gray-200 mx-1" />

              <div
                className="flex items-center gap-3 pl-2 pr-4 cursor-pointer hover:opacity-80 transition-opacity"
                role="button"
                tabIndex={0}
                aria-label="Profile menu"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
                  <img
                    src="https://ui-avatars.com/api/?name=Sales+Lead&background=FF5C39&color=fff&bold=true"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-900 leading-tight">
                    Sales Lead
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium leading-tight">
                    sales@opencloser.ai
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {showShell && (
          <aside
            className="flex flex-col items-center gap-4 py-8 shrink-0 relative z-40 bg-transparent"
            style={{ width: 80 }}
          >
            <div className="flex flex-col items-center gap-3 flex-1 px-4">
              {SIDEBAR_TOP.map((item) => {
                const Icon = SIDEBAR_ICONS[item.icon];
                return (
                  <button
                    key={item.state}
                    title={item.label}
                    onClick={() => onNavigate(item.state as AppPage)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                      currentPage === item.state ||
                      (item.state === "dashboard" && currentPage === "lead_detail")
                        ? "bg-gray-200 text-gray-900 shadow-sm"
                        : "text-gray-400 hover:bg-gray-200 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.5px]" />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-3 px-4">
              <button
                onClick={() => onNavigate("hunter")}
                className="w-12 h-12 flex items-center justify-center rounded-full cursor-pointer shadow-[0_4px_16px_rgba(255,92,57,0.3)] bg-[var(--accent-coral)] text-white hover:scale-105"
                title="New Campaign"
              >
                <Plus className="w-6 h-6 stroke-[3px]" />
              </button>
              {SIDEBAR_BOTTOM.map((item) => {
                const Icon = SIDEBAR_ICONS[item.icon];
                return (
                  <button
                    key={item.state}
                    title={item.label}
                    onClick={() => onNavigate(item.state as AppPage)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                      currentPage === item.state
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-400 hover:bg-gray-200 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.5px]" />
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            background: "var(--bg-primary)",
            padding: currentPage === "dashboard" ? "24px" : "0",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
