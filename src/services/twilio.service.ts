import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Twilio telephony: local credentials, quick tunnel, outbound calls and the
// Media Streams audio bridge. Without credentials everything runs in mock mode.

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  wssUrl: string;
  autoTunnel: boolean;
}

export interface PlacedCall {
  callSid: string;
  mock: boolean;
}

export interface TwilioStreamInfo {
  port: number;
  connected: boolean;
  streamSid: string | null;
  callSid: string | null;
  leadId: string | null;
}

export interface TwilioAudioIn {
  pcm16Base64: string;
  sampleRate: number;
}

const KEYS = {
  accountSid: "twilio_account_sid",
  authToken: "twilio_auth_token",
  phoneNumber: "twilio_phone_number",
  wssUrl: "twilio_wss_url",
  autoTunnel: "twilio_auto_tunnel",
} as const;

export function getTwilioConfig(): TwilioConfig {
  return {
    accountSid: localStorage.getItem(KEYS.accountSid) || "",
    authToken: localStorage.getItem(KEYS.authToken) || "",
    phoneNumber: localStorage.getItem(KEYS.phoneNumber) || "",
    wssUrl: localStorage.getItem(KEYS.wssUrl) || "",
    autoTunnel: localStorage.getItem(KEYS.autoTunnel) !== "false",
  };
}

export function saveTwilioConfig(partial: Partial<TwilioConfig>): TwilioConfig {
  if (partial.accountSid !== undefined) localStorage.setItem(KEYS.accountSid, partial.accountSid);
  if (partial.authToken !== undefined) localStorage.setItem(KEYS.authToken, partial.authToken);
  if (partial.phoneNumber !== undefined)
    localStorage.setItem(KEYS.phoneNumber, partial.phoneNumber);
  if (partial.wssUrl !== undefined) localStorage.setItem(KEYS.wssUrl, partial.wssUrl);
  if (partial.autoTunnel !== undefined)
    localStorage.setItem(KEYS.autoTunnel, String(partial.autoTunnel));
  return getTwilioConfig();
}

export function isTwilioConfigured(config: TwilioConfig = getTwilioConfig()): boolean {
  return !!(config.accountSid.trim() && config.authToken.trim() && config.phoneNumber.trim());
}

/** https:// tunnel URL → wss:// endpoint for the TwiML <Stream> tag. */
export function toWssUrl(url: string): string {
  return url
    .trim()
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
}

export async function startTwilioTunnel(): Promise<string> {
  const url = await invoke<string>("start_twilio_tunnel");
  return toWssUrl(url);
}

export async function stopTwilioTunnel(): Promise<void> {
  await invoke("stop_twilio_tunnel");
}

export async function getTwilioTunnelInfo(): Promise<{
  running: boolean;
  url: string | null;
}> {
  return invoke("get_twilio_tunnel_info");
}

export async function getTwilioStreamInfo(): Promise<TwilioStreamInfo> {
  return invoke("get_twilio_stream_info");
}

/** Resolves the WSS endpoint: manual URL wins, then auto-tunnel, else error. */
async function resolveWsUrl(config: TwilioConfig): Promise<string> {
  const manual = config.wssUrl.trim();
  if (manual) return toWssUrl(manual);
  if (config.autoTunnel) return startTwilioTunnel();
  throw new Error("No public WebSocket URL — set one in Settings → Phone or enable auto-tunnel");
}

export async function placeTwilioCall(to: string, leadId: string): Promise<PlacedCall> {
  const config = getTwilioConfig();
  const wsUrl = isTwilioConfigured(config) ? await resolveWsUrl(config) : "";
  return invoke<PlacedCall>("place_twilio_call", {
    accountSid: config.accountSid.trim(),
    authToken: config.authToken.trim(),
    phoneNumber: config.phoneNumber.trim(),
    to,
    leadId,
    wsUrl,
  });
}

export async function endTwilioCall(callSid: string): Promise<void> {
  const config = getTwilioConfig();
  await invoke("end_twilio_call", {
    accountSid: config.accountSid.trim(),
    authToken: config.authToken.trim(),
    callSid,
  });
}

export async function testTwilioConnection(): Promise<void> {
  const config = getTwilioConfig();
  await invoke("test_twilio_connection", {
    accountSid: config.accountSid.trim(),
    authToken: config.authToken.trim(),
  });
}

/** Forwards AI speech (PCM16 at `sampleRate`) to the phone line as µ-law 8 kHz. */
export async function sendTwilioAudio(pcm16Base64: string, sampleRate: number): Promise<void> {
  await invoke("send_twilio_audio", { pcm16Base64, sampleRate });
}

export interface TwilioStreamStarted {
  streamSid: string;
  callSid: string;
  leadId: string;
}

export function onTwilioStreamStarted(
  cb: (payload: TwilioStreamStarted) => void,
): Promise<() => void> {
  return listen<TwilioStreamStarted>("twilio_stream_started", (e) => cb(e.payload));
}

export function onTwilioStreamStopped(cb: () => void): Promise<() => void> {
  return listen("twilio_stream_stopped", () => cb());
}

/** Phone-line speech arriving from Twilio (PCM16, usually 8000 Hz). */
export function onTwilioAudioIn(cb: (payload: TwilioAudioIn) => void): Promise<() => void> {
  return listen<TwilioAudioIn>("twilio_audio_in", (e) => cb(e.payload));
}
