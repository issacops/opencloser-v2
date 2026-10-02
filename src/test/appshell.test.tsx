import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KanbanBoard } from "../features/crm/components/KanbanBoard";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (cmd: string) => {
    if (cmd === "get_leads" || cmd === "get_call_logs") return [];
    return null;
  }),
}));

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <KanbanBoard />
    </QueryClientProvider>,
  );
}

describe("AppShell (KanbanBoard shell extraction)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("hasCompletedOnboarding", "true");
    localStorage.setItem("hasCompletedAudioSetup", "true");
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders header, sidebar, and demo badge after session restore", async () => {
    renderApp();
    expect(await screen.findByText("OpenCloser")).toBeInTheDocument();
    expect(screen.getByText("Demo Mode")).toBeInTheDocument();
    expect(screen.getByTitle("New Campaign")).toBeInTheDocument();
    expect(screen.getByTitle("Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Search leads")).toBeInTheDocument();
  });

  it("navigates to the pipeline via header nav", async () => {
    renderApp();
    await screen.findByText("OpenCloser");
    const pipelineButtons = screen.getAllByRole("button", { name: "Pipeline" });
    fireEvent.click(pipelineButtons[0]);
    expect(await screen.findByPlaceholderText("Search leads…")).toBeInTheDocument();
  });

  it("opens the global search and closes it on Escape", async () => {
    renderApp();
    await screen.findByText("OpenCloser");
    fireEvent.click(screen.getByLabelText("Search leads"));
    const input = await screen.findByPlaceholderText("Search by name or company...");
    fireEvent.change(input, { target: { value: "Acme" } });
    expect(input).toHaveValue("Acme");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Search by name or company...")).not.toBeInTheDocument();
  });
});
