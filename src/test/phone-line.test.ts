import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  decodePcm16Base64,
  toFloat32,
  resampleLinearFloat32,
  phoneAudioToEngineInput,
} from "../features/voice/lib/phone-audio";
import { usePhoneLine } from "../features/voice/components/warroom/usePhoneLine";
import type { PlacedCall, TwilioAudioIn, TwilioStreamStarted } from "../services/twilio.service";

vi.mock("../services/twilio.service", () => ({
  placeTwilioCall: vi.fn(),
  endTwilioCall: vi.fn().mockResolvedValue(undefined),
  sendTwilioAudio: vi.fn().mockResolvedValue(undefined),
  onTwilioStreamStarted: vi.fn().mockResolvedValue(() => {}),
  onTwilioStreamStopped: vi.fn().mockResolvedValue(() => {}),
  onTwilioAudioIn: vi.fn().mockResolvedValue(() => {}),
}));

import {
  placeTwilioCall,
  endTwilioCall,
  sendTwilioAudio,
  onTwilioStreamStarted,
  onTwilioStreamStopped,
  onTwilioAudioIn,
} from "../services/twilio.service";

const mockedPlace = vi.mocked(placeTwilioCall);
const mockedEnd = vi.mocked(endTwilioCall);
const mockedSend = vi.mocked(sendTwilioAudio);
const mockedStarted = vi.mocked(onTwilioStreamStarted);
const mockedStopped = vi.mocked(onTwilioStreamStopped);
const mockedAudioIn = vi.mocked(onTwilioAudioIn);

function b64FromSamples(samples: number[]): string {
  const bytes = new Uint8Array(samples.length * 2);
  samples.forEach((s, i) => {
    bytes[2 * i] = s & 0xff;
    bytes[2 * i + 1] = (s >> 8) & 0xff;
  });
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

interface Params {
  leadPhone: string;
  leadId: string;
  isCallLive: boolean;
  sendEngineAudio: Mock<(audio: Float32Array) => void>;
  getEngineSampleRate: () => number;
  setMicActive: Mock<(active: boolean) => void>;
}

function makeParams(overrides: Partial<Params> = {}): Params {
  return {
    leadPhone: "+15125550101",
    leadId: "lead_1",
    isCallLive: true,
    sendEngineAudio: vi.fn<(audio: Float32Array) => void>(),
    getEngineSampleRate: () => 48000,
    setMicActive: vi.fn<(active: boolean) => void>(),
    ...overrides,
  };
}

describe("phone-audio helpers", () => {
  it("decodes PCM16 base64 to little-endian samples", () => {
    const decoded = decodePcm16Base64(b64FromSamples([1, -1, 32767]));
    expect(Array.from(decoded)).toEqual([1, -1, 32767]);
  });

  it("converts Int16 to Float32 in [-1, 1]", () => {
    const f = toFloat32(new Int16Array([0, 32767, -32768]));
    expect(f[0]).toBe(0);
    expect(f[1]).toBeCloseTo(1, 3);
    expect(f[2]).toBeCloseTo(-1, 3);
  });

  it("resamples by the rate ratio", () => {
    const input = new Float32Array(80).fill(0.5);
    const out = resampleLinearFloat32(input, 8000, 48000);
    expect(out.length).toBe(480);
    expect(out[0]).toBeCloseTo(0.5, 5);
    expect(resampleLinearFloat32(input, 48000, 48000)).toBe(input);
  });

  it("builds engine input from Twilio wire audio at 8 kHz → 48 kHz", () => {
    const b64 = b64FromSamples([16384, -16384]);
    const out = phoneAudioToEngineInput(b64, 8000, 48000);
    expect(out).toBeInstanceOf(Float32Array);
    expect(out.length).toBe(12);
    expect(out[0]).toBeCloseTo(0.5, 2);
    expect(out[3]).toBeCloseTo(0, 2);
    expect(out[11]).toBeCloseTo(-0.5, 2);
  });
});

describe("usePhoneLine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPlace.mockResolvedValue({ callSid: "SM_mock_1", mock: true });
    mockedEnd.mockResolvedValue(undefined);
    mockedSend.mockResolvedValue(undefined);
    mockedStarted.mockResolvedValue(() => {});
    mockedStopped.mockResolvedValue(() => {});
    mockedAudioIn.mockResolvedValue(() => {});
  });

  it("attaches on toggle when the call is live", async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));

    act(() => result.current.toggle());

    await waitFor(() => expect(result.current.call?.callSid).toBe("SM_mock_1"));
    expect(mockedPlace).toHaveBeenCalledWith("+15125550101", "lead_1");
    expect(params.setMicActive).toHaveBeenCalledWith(true);
    expect(mockedAudioIn).toHaveBeenCalled();
    expect(result.current.enabled).toBe(true);
  });

  it("arms first when the call is not live, then attaches on rerender", async () => {
    const params = makeParams({ isCallLive: false });
    const { result, rerender } = renderHook((p) => usePhoneLine(p), {
      initialProps: params,
    });

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
    expect(mockedPlace).not.toHaveBeenCalled();

    rerender({ ...params, isCallLive: true });
    await waitFor(() => expect(result.current.call?.callSid).toBe("SM_mock_1"));
    expect(params.setMicActive).toHaveBeenCalledWith(true);
  });

  it("detaches on second toggle: ends the line and restores the mic", async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));

    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).not.toBeNull());

    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).toBeNull());

    expect(mockedEnd).toHaveBeenCalledWith("SM_mock_1");
    expect(params.setMicActive).toHaveBeenLastCalledWith(false);
    expect(result.current.enabled).toBe(false);
  });

  it("feeds Twilio audio-in into the engine", async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).not.toBeNull());

    const audioInCb = mockedAudioIn.mock.calls[0][0] as (p: TwilioAudioIn) => void;
    act(() => {
      audioInCb({ pcm16Base64: b64FromSamples([16384, 0]), sampleRate: 8000 });
    });

    expect(params.sendEngineAudio).toHaveBeenCalledTimes(1);
    const audio = params.sendEngineAudio.mock.calls[0][0];
    expect(audio).toBeInstanceOf(Float32Array);
    expect(audio.length).toBe(12);
    expect(audio[0]).toBeCloseTo(0.5, 2);
  });

  it("forwards AI audio to the line only while attached", async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));

    result.current.sendToLine("AAAA", 24000);
    expect(mockedSend).not.toHaveBeenCalled();

    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).not.toBeNull());

    act(() => result.current.sendToLine("AAAA", 24000));
    expect(mockedSend).toHaveBeenCalledWith("AAAA", 24000);
  });

  it("ends a placed line on unmount", async () => {
    const params = makeParams();
    const { result, unmount } = renderHook(() => usePhoneLine(params));
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).not.toBeNull());

    unmount();
    expect(mockedEnd).toHaveBeenCalledWith("SM_mock_1");
  });

  it("surfaces an attach failure and stays detached", async () => {
    mockedPlace.mockRejectedValue(new Error("No public WebSocket URL — set one in Settings"));
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));

    act(() => result.current.toggle());

    await waitFor(() => expect(result.current.error).toContain("No public WebSocket URL"));
    expect(result.current.call).toBeNull();
    expect(result.current.enabled).toBe(false);
    expect(params.setMicActive).not.toHaveBeenCalled();
  });

  it("reports stream lifecycle through the started callback", async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePhoneLine(params));
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.call).not.toBeNull());

    const startedCb = mockedStarted.mock.calls[0][0] as (e: TwilioStreamStarted) => void;
    act(() => startedCb({ streamSid: "MZ_1", callSid: "SM_mock_1", leadId: "lead_1" }));
    expect(result.current.streaming).toBe(true);

    const stoppedCb = mockedStopped.mock.calls[0][0] as () => void;
    act(() => stoppedCb());
    expect(result.current.streaming).toBe(false);
  });
});

describe("mock placement contract", () => {
  it("mock calls resolve instantly without a tunnel", async () => {
    mockedPlace.mockResolvedValue({ callSid: "SM_mock_9", mock: true } as PlacedCall);
    const placed = await placeTwilioCall("+15125550101", "lead_9");
    expect(placed.mock).toBe(true);
    expect(placed.callSid.startsWith("SM_mock_")).toBe(true);
  });
});
