import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SettingsView } from "../features/crm/components/SettingsView";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const mockedInvoke = vi.mocked(invoke);

describe("SettingsView API key persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves the Gemini API key to localStorage on blur", async () => {
    render(<SettingsView />);
    const input = screen.getByPlaceholderText("AIza...");
    fireEvent.change(input, { target: { value: "AIzaTESTKEY123" } });
    fireEvent.blur(input);
    expect(localStorage.getItem("gemini_api_key")).toBe("AIzaTESTKEY123");
    expect(await screen.findByText("API key saved")).toBeInTheDocument();
  });

  it("updates the configured badge after saving a key", async () => {
    render(<SettingsView />);
    expect(screen.getAllByText("Not Set").length).toBeGreaterThan(0);
    const input = screen.getByPlaceholderText("AIza...");
    fireEvent.change(input, { target: { value: "AIzaANOTHER" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getAllByText("Configured").length).toBeGreaterThan(0);
    });
  });

  it("persists extra settings (ElevenLabs Agent ID) on blur", () => {
    render(<SettingsView />);
    const input = screen.getByPlaceholderText("agent_xxxxxxxxxxxx");
    fireEvent.change(input, { target: { value: "agent_abc123" } });
    fireEvent.blur(input);
    expect(localStorage.getItem("elevenlabs_agent_id")).toBe("agent_abc123");
  });

  it("tests the correct provider endpoint with the configured key", async () => {
    render(<SettingsView />);
    const input = screen.getByPlaceholderText("sk-...");
    fireEvent.change(input, { target: { value: "sk-test-123" } });
    fireEvent.blur(input);

    const testButtons = screen.getAllByRole("button", { name: /Test Connection/ });
    // OpenAI is the second provider card
    fireEvent.click(testButtons[1]);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("test_provider_connection", {
        provider: "openai",
        apiKey: "sk-test-123",
      });
    });
    expect(mockedInvoke).not.toHaveBeenCalledWith("simulate_lead_scraping", expect.anything());
  });

  it("does not call test_provider_connection when no key is set", async () => {
    render(<SettingsView />);
    const testButtons = screen.getAllByRole("button", { name: /Test Connection/ });
    expect(testButtons[0]).toBeDisabled();
    fireEvent.click(testButtons[0]);
    expect(mockedInvoke).not.toHaveBeenCalledWith("test_provider_connection", expect.anything());
  });
});

describe("offline Ollama mode", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("leaves demo mode when an Ollama base URL is configured", async () => {
    const { isDemoMode, isOllamaConfigured, getLocalAIConfig } = await import("../services/apiKey");
    expect(isDemoMode()).toBe(true);
    expect(isOllamaConfigured()).toBe(false);
    localStorage.setItem("ollama_base_url", "http://127.0.0.1:11434");
    localStorage.setItem("ollama_model", "qwen2.5");
    expect(isOllamaConfigured()).toBe(true);
    expect(isDemoMode()).toBe(false);
    expect(getLocalAIConfig()).toEqual({
      ollamaBaseUrl: "http://127.0.0.1:11434",
      ollamaModel: "qwen2.5",
    });
  });

  it("saves the Ollama base URL and model on blur", () => {
    render(<SettingsView />);
    const urlInput = screen.getByPlaceholderText("http://127.0.0.1:11434");
    fireEvent.change(urlInput, { target: { value: "http://localhost:11434" } });
    fireEvent.blur(urlInput);
    expect(localStorage.getItem("ollama_base_url")).toBe("http://localhost:11434");

    const modelInput = screen.getByPlaceholderText("llama3.2");
    fireEvent.change(modelInput, { target: { value: "qwen2.5" } });
    fireEvent.blur(modelInput);
    expect(localStorage.getItem("ollama_model")).toBe("qwen2.5");
  });

  it("tests the Ollama connection through the backend", async () => {
    render(<SettingsView />);
    const urlInput = screen.getByPlaceholderText("http://127.0.0.1:11434");
    fireEvent.change(urlInput, { target: { value: "http://127.0.0.1:11434" } });
    fireEvent.blur(urlInput);

    const testButtons = screen.getAllByRole("button", { name: /Test Connection/ });
    const ollamaButton = testButtons.find((b) => !b.hasAttribute("disabled"));
    expect(ollamaButton).toBeDefined();
    fireEvent.click(ollamaButton!);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("test_ollama_connection", {
        baseUrl: "http://127.0.0.1:11434",
      });
    });
  });
});
