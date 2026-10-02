export const NAV_ITEMS = [
  { label: "Overview", state: "home" },
  { label: "Pipeline", state: "dashboard" },
  { label: "Call Intelligence", state: "call_logs" },
  { label: "AI Team", state: "persona" },
] as const;

export const SIDEBAR_TOP = [
  { icon: "Home", state: "home", label: "Overview" },
  { icon: "LayoutDashboard", state: "dashboard", label: "Pipeline" },
  { icon: "Phone", state: "call_logs", label: "Call Intelligence" },
  { icon: "Target", state: "hunter", label: "Lead Researcher" },
  { icon: "Bot", state: "persona", label: "AI Caller" },
  { icon: "Swords", state: "trainer", label: "Sales Coach" },
] as const;

export const SIDEBAR_BOTTOM = [{ icon: "Settings", state: "settings", label: "Settings" }] as const;

export const APP_TITLE = "OpenCloser";
