import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SettingsView } from "../features/crm/components/SettingsView";
import {
  placeTwilioCall,
  sendTwilioAudio,
  isTwilioConfigured,
  toWssUrl,
} from "../services/twilio.service";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

import { invoke } from "@tauri-apps/api/core";

const mockedInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

function stubMediaDevices() {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
    configurable: true,
  });
}

function setLiveCredentials() {
  localStorage.setItem("twilio_account_sid", "AC00000000000000000000000000000000");
  localStorage.setItem("twilio_auth_token", "secret-token");
  localStorage.setItem("twilio_phone_number", "+15125550000");
}

describe("Twilio phone line settings", () => {
  beforeEach(() => {
    localStorage.clear();
    stubMediaDevices();
    mockedInvoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("persists credentials on blur and flips the badge to Live", async () => {
    render(<SettingsView />);

    const sid = screen.getByPlaceholderText(/^ACx+/);
    fireEvent.change(sid, { target: { value: "AC123" } });
    fireEvent.blur(sid);

    const token = screen.getByPlaceholderText("your auth token");
    fireEvent.change(token, { target: { value: "secret" } });
    fireEvent.blur(token);

    expect(localStorage.getItem("twilio_account_sid")).toBe("AC123");
    expect(localStorage.getItem("twilio_auth_token")).toBe("secret");
    expect(screen.getByText("Live")).toBeTruthy();
  });

  it("masks the auth token by default and toggles visibility", () => {
    render(<SettingsView />);
    const token = screen.getByPlaceholderText("your auth token");
    expect(token.getAttribute("type")).toBe("password");

    const toggle = token.parentElement!.querySelector("button")!;
    fireEvent.click(toggle);
    expect(screen.getByPlaceholderText("your auth token").getAttribute("type")).toBe("text");
  });

  it("shows mock-mode hint while credentials are missing", () => {
    render(<SettingsView />);
    expect(screen.getByText("Mock")).toBeTruthy();
    expect(screen.getByText(/phone-line calls will run in mock mode/i)).toBeTruthy();
  });

  it("defaults auto-tunnel to on and persists toggling", () => {
    render(<SettingsView />);
    const checkbox = screen.getByRole("checkbox");
    expect((checkbox as HTMLInputElement).checked).toBe(true);

    fireEvent.click(checkbox);
    expect(localStorage.getItem("twilio_auto_tunnel")).toBe("false");

    fireEvent.click(checkbox);
    expect(localStorage.getItem("twilio_auto_tunnel")).toBe("true");
  });
});

describe("twilio.service call placement", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedInvoke.mockReset();
  });

  it("mock mode: no credentials means no tunnel and an empty wsUrl", async () => {
    mockedInvoke.mockResolvedValue({ callSid: "SM_mock_1", mock: true });
    const res = await placeTwilioCall("+15125550101", "lead_1");
    expect(mockedInvoke).toHaveBeenCalledWith("place_twilio_call", {
      accountSid: "",
      authToken: "",
      phoneNumber: "",
      to: "+15125550101",
      leadId: "lead_1",
      wsUrl: "",
    });
    expect(res.mock).toBe(true);
    expect(mockedInvoke.mock.calls.some(([cmd]) => cmd === "start_twilio_tunnel")).toBe(false);
  });

  it("configured with auto-tunnel resolves the WSS url from the tunnel", async () => {
    setLiveCredentials();
    mockedInvoke.mockImplementation((cmd: string) => {
      if (cmd === "start_twilio_tunnel")
        return Promise.resolve("https://tasty-fox-9x.trycloudflare.com");
      if (cmd === "place_twilio_call") return Promise.resolve({ callSid: "SM_real", mock: false });
      return Promise.resolve(undefined);
    });

    const res = await placeTwilioCall("+15125550101", "lead_2");

    const call = mockedInvoke.mock.calls.find(([cmd]) => cmd === "place_twilio_call");
    expect(call?.[1]).toMatchObject({
      wsUrl: "wss://tasty-fox-9x.trycloudflare.com",
      to: "+15125550101",
      leadId: "lead_2",
    });
    expect(res.mock).toBe(false);
  });

  it("a manual WSS URL wins over the tunnel", async () => {
    setLiveCredentials();
    localStorage.setItem("twilio_wss_url", "wss://custom.example.com/ws");
    mockedInvoke.mockResolvedValue({ callSid: "SM_2", mock: false });

    await placeTwilioCall("+15125550101", "lead_3");

    expect(mockedInvoke.mock.calls.some(([cmd]) => cmd === "start_twilio_tunnel")).toBe(false);
    const call = mockedInvoke.mock.calls.find(([cmd]) => cmd === "place_twilio_call");
    expect(call?.[1]).toMatchObject({ wsUrl: "wss://custom.example.com/ws" });
  });

  it("configured with auto-tunnel off and no manual URL fails fast", async () => {
    setLiveCredentials();
    localStorage.setItem("twilio_auto_tunnel", "false");
    mockedInvoke.mockResolvedValue(undefined);

    await expect(placeTwilioCall("+15125550101", "lead_4")).rejects.toThrow(/WebSocket URL/);
    expect(mockedInvoke.mock.calls.some(([cmd]) => cmd === "place_twilio_call")).toBe(false);
  });

  it("forwards AI speech to send_twilio_audio with its sample rate", async () => {
    mockedInvoke.mockResolvedValue(undefined);
    await sendTwilioAudio("AAAA", 24000);
    expect(mockedInvoke).toHaveBeenCalledWith("send_twilio_audio", {
      pcm16Base64: "AAAA",
      sampleRate: 24000,
    });
  });

  it("configuration detection requires SID, token and number", () => {
    expect(isTwilioConfigured()).toBe(false);
    localStorage.setItem("twilio_account_sid", "AC1");
    expect(isTwilioConfigured()).toBe(false);
    localStorage.setItem("twilio_auth_token", "t");
    expect(isTwilioConfigured()).toBe(false);
    localStorage.setItem("twilio_phone_number", "+15125550000");
    expect(isTwilioConfigured()).toBe(true);
  });

  it("normalizes tunnel URLs to wss", () => {
    expect(toWssUrl("https://a.trycloudflare.com")).toBe("wss://a.trycloudflare.com");
    expect(toWssUrl("http://localhost:8080")).toBe("ws://localhost:8080");
    expect(toWssUrl(" wss://already.good ")).toBe("wss://already.good");
  });
});
