// ============================================================
// CallerEngine — Multi-Provider AI Call Abstraction
// Supports: Gemini Live, OpenAI Realtime, ElevenLabs ConvAI
// ============================================================

import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

export type CallState = "idle" | "connecting" | "active" | "objection_mode" | "closing" | "ended";

export interface TranscriptLine {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface EngineCallbacks {
  onState: (state: CallState) => void;
  onAudio: (pcm16Base64: string, sampleRate: number) => void;
  onTranscript: (line: TranscriptLine) => void;
  onInterrupted: () => void;
  onError: (err: Error) => void;
}

// ── BASE CLASS ──────────────────────────────────────────────
export abstract class CallerEngine {
  protected callbacks: EngineCallbacks;
  protected state: CallState = "idle";

  constructor(callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
  }

  abstract connect(systemPrompt: string, voiceId: string, language: string): Promise<void>;
  abstract sendAudio(float32: Float32Array): void;
  abstract disconnect(): void;

  protected setState(s: CallState) {
    this.state = s;
    this.callbacks.onState(s);
  }

  protected makeTranscriptLine(role: "user" | "model", text: string): TranscriptLine {
    return { id: `${Date.now()}-${Math.random()}`, role, text, timestamp: Date.now() };
  }
}

// ── GEMINI LIVE ENGINE ──────────────────────────────────────
class GeminiCallerEngine extends CallerEngine {
  private session: any = null;
  private sessionPromise: Promise<any> | null = null;

  async connect(systemPrompt: string, voiceId: string, _language: string): Promise<void> {
    this.setState("connecting");

    const apiKey =
      localStorage.getItem("gemini_api_key") ||
      (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
      "";

    if (!apiKey) throw new Error("Gemini API key not configured. Go to Settings → Voice Engine.");

    const ai = new GoogleGenAI({ apiKey });

    this.sessionPromise = ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } },
        },
        systemInstruction: systemPrompt,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          this.setState("active");
        },
        onmessage: (message: LiveServerMessage) => {
          // Handle audio
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            this.callbacks.onAudio(base64Audio, 24000);
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            this.callbacks.onInterrupted();
          }

          // Handle transcript — model output
          const outputTranscript = (message as any).serverContent?.outputTranscription?.text;
          if (outputTranscript) {
            this.callbacks.onTranscript(this.makeTranscriptLine("model", outputTranscript));
          }

          // Handle transcript — user input
          const inputTranscript = (message as any).serverContent?.inputTranscription?.text;
          if (inputTranscript) {
            this.callbacks.onTranscript(this.makeTranscriptLine("user", inputTranscript));
          }

          // Fallback: model turn text parts
          const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
          if (textPart && !outputTranscript) {
            this.callbacks.onTranscript(this.makeTranscriptLine("model", textPart));
          }
        },
        onclose: () => {
          this.setState("ended");
        },
        onerror: (err: any) => {
          this.callbacks.onError(new Error(err?.message || "Gemini connection error"));
          this.setState("ended");
        },
      },
    });

    this.session = await this.sessionPromise;
  }

  sendAudio(float32: Float32Array): void {
    if (!this.session) return;

    // Convert Float32 → Int16 → Base64
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);

    this.session.sendRealtimeInput({
      media: { data: b64, mimeType: "audio/pcm;rate=16000" },
    });
  }

  disconnect(): void {
    try {
      if (this.session && typeof this.session.close === "function") {
        this.session.close();
      }
    } catch {
      // ignore
    }
    this.setState("ended");
  }
}

// ── OPENAI REALTIME ENGINE ──────────────────────────────────
// Routes through local Tauri WebSocket relay on 127.0.0.1
class OpenAICallerEngine extends CallerEngine {
  private ws: WebSocket | null = null;

  async connect(systemPrompt: string, voiceId: string, _language: string): Promise<void> {
    this.setState("connecting");

    const apiKey = localStorage.getItem("openai_api_key") || "";
    if (!apiKey) throw new Error("OpenAI API key not configured. Go to Settings → Voice Engine.");

    const { invoke } = await import("@tauri-apps/api/core");
    const port: number = await invoke("get_relay_port");
    const wsUrl = `ws://127.0.0.1:${port}?provider=openai`;
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws!.binaryType = "arraybuffer";

      this.ws!.onopen = () => {
        this.ws!.send(
          JSON.stringify({
            provider: "openai",
            apiKey,
            model: "gpt-4o-realtime-preview",
            voice: voiceId,
            systemPrompt,
          }),
        );
      };

      this.ws!.onmessage = (e) => {
        if (typeof e.data === "string") {
          const msg = JSON.parse(e.data);
          if (msg.type === "ready") {
            this.setState("active");
            resolve();
          } else if (msg.type === "transcript.model") {
            this.callbacks.onTranscript(this.makeTranscriptLine("model", msg.text));
          } else if (msg.type === "transcript.user") {
            this.callbacks.onTranscript(this.makeTranscriptLine("user", msg.text));
          } else if (msg.type === "interrupted") {
            this.callbacks.onInterrupted();
          } else if (msg.type === "error") {
            this.callbacks.onError(new Error(msg.message));
            reject(new Error(msg.message));
          }
        } else if (e.data instanceof ArrayBuffer) {
          // Raw PCM16 audio from relay
          const int16 = new Int16Array(e.data);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
          }
          // Convert to base64 for unified audio callback
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          this.callbacks.onAudio(btoa(binary), 24000);
        }
      };

      this.ws!.onclose = () => this.setState("ended");
      this.ws!.onerror = () => {
        const err = new Error("OpenAI relay connection failed");
        this.callbacks.onError(err);
        reject(err);
      };
    });
  }

  sendAudio(float32: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.ws.send(pcm16.buffer);
  }

  disconnect(): void {
    this.ws?.close();
    this.setState("ended");
  }
}

// ── ELEVENLABS ENGINE ───────────────────────────────────────
class ElevenLabsCallerEngine extends CallerEngine {
  private ws: WebSocket | null = null;

  async connect(systemPrompt: string, _voiceId: string, _language: string): Promise<void> {
    this.setState("connecting");

    const apiKey = localStorage.getItem("elevenlabs_api_key") || "";
    const agentId = localStorage.getItem("elevenlabs_agent_id") || "";
    if (!apiKey || !agentId)
      throw new Error("ElevenLabs API key and Agent ID required. Go to Settings → Voice Engine.");

    const { invoke } = await import("@tauri-apps/api/core");
    const port: number = await invoke("get_relay_port");
    const wsUrl = `ws://127.0.0.1:${port}?provider=elevenlabs`;
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws!.binaryType = "arraybuffer";

      this.ws!.onopen = () => {
        this.ws!.send(
          JSON.stringify({
            provider: "elevenlabs",
            apiKey,
            agentId,
            systemPrompt,
          }),
        );
      };

      this.ws!.onmessage = (e) => {
        if (typeof e.data === "string") {
          const msg = JSON.parse(e.data);
          if (msg.type === "ready") {
            this.setState("active");
            resolve();
          } else if (msg.type === "transcript.model")
            this.callbacks.onTranscript(this.makeTranscriptLine("model", msg.text));
          else if (msg.type === "transcript.user")
            this.callbacks.onTranscript(this.makeTranscriptLine("user", msg.text));
          else if (msg.type === "interrupted") this.callbacks.onInterrupted();
          else if (msg.type === "error") {
            this.callbacks.onError(new Error(msg.message));
            reject(new Error(msg.message));
          }
        } else if (e.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(e.data);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          this.callbacks.onAudio(btoa(binary), 24000);
        }
      };

      this.ws!.onclose = () => this.setState("ended");
      this.ws!.onerror = () => {
        const err = new Error("ElevenLabs relay connection failed");
        this.callbacks.onError(err);
        reject(err);
      };
    });
  }

  sendAudio(float32: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.ws.send(pcm16.buffer);
  }

  disconnect(): void {
    this.ws?.close();
    this.setState("ended");
  }
}

// ── FACTORY & DEMO ENGINE ───────────────────────────────────

class DemoCallerEngine extends CallerEngine {
  private interval: any = null;
  private lines = [
    {
      role: "model" as const,
      text: "Hi there! This is Alex from OpenCloser. Am I speaking with the business owner?",
    },
    { role: "user" as const, text: "Yeah, this is him. What's this about?" },
    {
      role: "model" as const,
      text: "Great to connect! I'm calling because we help agencies automate their outbound calling and handle objections seamlessly. How are you currently handling lead generation?",
    },
    {
      role: "user" as const,
      text: "We mostly use cold email and a bit of manual calling, but it's getting really expensive and time-consuming.",
    },
    {
      role: "model" as const,
      text: "Spot on. Email deliverability is brutal right now, and manual dialing burns out SDRs. If we could deploy an AI agent that sounds exactly like a top-performing human rep and books meetings 24/7, would you be open to exploring how it works?",
    },
    {
      role: "user" as const,
      text: "I don't know, man. Every AI I've heard usually sounds super robotic or has a weird delay. Do you have a demo?",
    },
    {
      role: "model" as const,
      text: "I completely understand the hesitation. Actually... you're talking to an AI right now. I'd love to show you the WarRoom dashboard where you can see exactly how my brain processes responses. Do you have 15 minutes tomorrow?",
    },
    {
      role: "user" as const,
      text: "Haha no way, really? That's crazy. Okay yeah, send me a calendar invite.",
    },
    {
      role: "model" as const,
      text: "Awesome. I'll get that sent right over to your email. Thanks for your time, have a great day!",
    },
  ];
  private currentIndex = 0;

  async connect(_systemPrompt: string, _voiceId: string, _language: string): Promise<void> {
    this.setState("connecting");

    // Simulate connection delay
    setTimeout(() => {
      this.setState("active");

      this.interval = setInterval(() => {
        if (this.currentIndex < this.lines.length) {
          const line = this.lines[this.currentIndex++];
          this.callbacks.onTranscript(this.makeTranscriptLine(line.role, line.text));
        } else {
          this.disconnect();
        }
      }, 4000); // Send a script line every 4 seconds
    }, 1500);
  }

  sendAudio(_float32: Float32Array): void {
    // Ignore input audio during demo mode
  }

  disconnect(): void {
    if (this.interval) clearInterval(this.interval);
    this.setState("ended");
  }
}

export function createCallerEngine(
  provider: "gemini" | "openai" | "elevenlabs",
  callbacks: EngineCallbacks,
): CallerEngine {
  // Check if API key exists. If not, fallback to Demo Engine
  const getAPIKey = (p: string) => {
    switch (p) {
      case "gemini":
        return localStorage.getItem("gemini_api_key") || "";
      case "openai":
        return localStorage.getItem("openai_api_key") || "";
      case "elevenlabs":
        return localStorage.getItem("elevenlabs_api_key") || "";
      default:
        return "";
    }
  };

  if (!getAPIKey(provider)) {
    console.warn(`No API key found for ${provider}. Falling back to Demo Mode.`);
    return new DemoCallerEngine(callbacks);
  }

  switch (provider) {
    case "gemini":
      return new GeminiCallerEngine(callbacks);
    case "openai":
      return new OpenAICallerEngine(callbacks);
    case "elevenlabs":
      return new ElevenLabsCallerEngine(callbacks);
    default:
      return new GeminiCallerEngine(callbacks);
  }
}
