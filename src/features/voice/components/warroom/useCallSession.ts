import { useState, useEffect, useRef, useCallback } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { useAddCallLogMutation } from "../../../../services/queries";
import { Lead, ICP } from "../../../../types";
import { AIPersona, DEFAULT_PERSONA } from "../../../../types/persona";
import {
  createCallerEngine,
  CallerEngine,
  CallState,
  TranscriptLine,
} from "../../lib/caller-engine";
import {
  analyzeEmotions,
  EmotionAxes,
  EmotionShift,
  buildEmotionSystemPrompt,
} from "../../lib/emotion-engine";
import { detectObjectionInTranscript, ObjectionMatch } from "../../lib/objection-engine";
import { getSentimentFromMood, type SentimentLevel } from "./sentiment";
import { usePhoneLine } from "./usePhoneLine";

export function useCallSession(
  lead: Lead,
  icp: ICP | null,
  onClose: (transcript?: TranscriptLine[], durationSeconds?: number) => void,
) {
  const [callState, setCallState] = useState<CallState>("idle");
  const addCallLogMutation = useAddCallLogMutation();
  const [isMuted, setIsMuted] = useState(false);
  const [usePhoneLink, setUsePhoneLink] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Emotion & Sentiment
  const [currentAxes, setCurrentAxes] = useState<EmotionAxes | null>(null);
  const [recentShifts, setRecentShifts] = useState<EmotionShift[]>([]);
  const [sentiment, setSentiment] = useState<SentimentLevel>("cold");
  const [sentimentLabel, setSentimentLabel] = useState("Neutral");

  // Objection coaching
  const [activeObjection, setActiveObjection] = useState<ObjectionMatch | null>(null);
  const [objectionHistory, setObjectionHistory] = useState<ObjectionMatch[]>([]);

  // Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  // Playback
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const nextPlayTimeRef = useRef(0);

  // Engine
  const engineRef = useRef<CallerEngine | null>(null);
  const isMutedRef = useRef(false);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const startTimeRef = useRef(Date.now());
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const endedRef = useRef(false);
  const tornDownRef = useRef(false);
  const finalizeCallRef = useRef<(notify: boolean) => void>(() => {});
  const phoneLineResetRef = useRef<() => void>(() => {});

  // Twilio phone line (bridges this call into a real phone line)
  const phoneLine = usePhoneLine({
    leadPhone: lead.phone,
    leadId: lead.id,
    isCallLive: callState === "active" || callState === "objection_mode" || callState === "closing",
    sendEngineAudio: (audio) => engineRef.current?.sendAudio(audio),
    getEngineSampleRate: () => audioContextRef.current?.sampleRate ?? 48000,
    setMicActive: (active) => {
      const muted = !active || isMutedRef.current;
      workletNodeRef.current?.port.postMessage({ type: "setMuted", muted });
    },
  });
  phoneLineResetRef.current = phoneLine.reset;

  const safeSetTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
    return id;
  };

  // Single idempotent teardown for audio graph + pending timeouts.
  const teardownAudio = () => {
    if (tornDownRef.current) return;
    tornDownRef.current = true;
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    workletNodeRef.current?.disconnect();
    scriptProcessorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current?.state !== "closed") audioContextRef.current?.close();
    engineRef.current?.disconnect();
  };

  // Persona
  const persona: AIPersona = (() => {
    try {
      const s = localStorage.getItem("ai_persona");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_PERSONA;
  })();

  // Audio graph + engine lifecycle: starts the call once on mount, tears down on unmount.
  useEffect(() => {
    // Init emotion axes from persona
    setCurrentAxes({
      empathy: persona.emotionalModulation.empathy,
      energy: persona.emotionalModulation.energy,
      formality: persona.emotionalModulation.formality,
      assertiveness: persona.emotionalModulation.assertiveness ?? 45,
      humor: persona.emotionalModulation.humor ?? 30,
    });
    startCall();
    return () => {
      // Persist a mid-call unmount (StrictMode's synthetic remount has an
      // empty transcript, so it never triggers a phantom log).
      if (!endedRef.current && transcriptRef.current.length > 0) {
        finalizeCallRef.current(true);
      } else {
        teardownAudio();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once on mount

  // Timer
  useEffect(() => {
    if (callState !== "active" && callState !== "objection_mode" && callState !== "closing") return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Latest-value refs: the analysis effect below runs only when the transcript
  // changes, but needs current persona/axes/objection without stale closures.
  const personaRef = useRef(persona);
  personaRef.current = persona;
  const currentAxesRef = useRef(currentAxes);
  currentAxesRef.current = currentAxes;
  const activeObjectionRef = useRef(activeObjection);
  activeObjectionRef.current = activeObjection;

  // Real-time emotion + objection analysis every 2 transcript entries
  useEffect(() => {
    if (transcript.length === 0 || transcript.length % 2 !== 0) return;

    const personaNow = personaRef.current;
    // Emotion analysis
    const baseAxes: EmotionAxes = currentAxesRef.current || {
      empathy: personaNow.emotionalModulation.empathy,
      energy: personaNow.emotionalModulation.energy,
      formality: personaNow.emotionalModulation.formality,
      assertiveness: personaNow.emotionalModulation.assertiveness ?? 45,
      humor: personaNow.emotionalModulation.humor ?? 30,
    };

    const analysis = analyzeEmotions(transcript, baseAxes);
    if (personaNow.emotionalModulation.dynamicToneShift) {
      setCurrentAxes(analysis.axes);
      if (analysis.shifts.length > 0) {
        setRecentShifts(analysis.shifts.slice(-3));
      }
    }
    setSentiment(getSentimentFromMood(analysis.dominantMood));
    setSentimentLabel(analysis.dominantMood);

    // Objection detection
    const objection = detectObjectionInTranscript(transcript);
    if (objection && objection.archetype !== activeObjectionRef.current?.archetype) {
      setActiveObjection(objection);
      setObjectionHistory((prev) => [objection, ...prev.slice(0, 4)]);
      setCallState("objection_mode");
      // Auto-clear after 20s
      safeSetTimeout(() => {
        setActiveObjection(null);
        setCallState((prev) => (prev === "objection_mode" ? "active" : prev));
      }, 20000);
    }
  }, [transcript]);

  const buildSystemPrompt = (): string => {
    const personaData: AIPersona = (() => {
      try {
        const s = localStorage.getItem("ai_persona");
        if (s) return JSON.parse(s);
      } catch {}
      return DEFAULT_PERSONA;
    })();

    const axes: EmotionAxes = currentAxes || {
      empathy: personaData.emotionalModulation.empathy,
      energy: personaData.emotionalModulation.energy,
      formality: personaData.emotionalModulation.formality,
      assertiveness: personaData.emotionalModulation.assertiveness ?? 45,
      humor: personaData.emotionalModulation.humor ?? 30,
    };

    const baseInstruction = icp?.systemPrompt
      ? `You are calling ${lead.name} at ${lead.company}. ${icp.systemPrompt}`
      : `You are an elite AI Sales Development Representative calling ${lead.name} at ${lead.company}. Your goal is to qualify them and book a meeting.`;

    const frameworkPrompt = `SALES FRAMEWORK (${personaData.framework}): ${
      personaData.framework === "SPIN Selling"
        ? "Use Situation → Problem → Implication → Need-Payoff questions in sequence. Uncover the pain deeply before you mention your solution."
        : personaData.framework === "Challenger Sale"
          ? "Teach them something counterintuitive about their industry first. Challenge their assumptions. Reframe the problem before presenting your solution."
          : personaData.framework === "Sandler System"
            ? "Establish an upfront contract. Qualify pain, budget, and decision process BEFORE presenting anything. Be willing to walk away."
            : "Maintain momentum. Maintain certainty in yourself, your product, and the process. Move in a straight line toward yes or no. Never loop."
    }`;

    const emotionPrompt = buildEmotionSystemPrompt(axes, personaData.speechPatterns);

    const icpContext = icp
      ? `
=== ICP INTELLIGENCE (USE ONLY THIS — DO NOT FABRICATE) ===
Industry: ${icp.industry || "Not specified"}
Company Size Target: ${icp.companySize || "Not specified"}
Decision Maker Titles: ${icp.decisionMakerTitles?.join(", ") || "Not specified"}
Pain Points: ${icp.painPoints?.join(" | ") || "Not specified"}
Known Objections: ${icp.objections?.join(" | ") || "Not specified"}
Competitors: ${icp.competitorNames?.join(", ") || "Not specified"}
Value Proposition: ${icp.valueProposition || "Not specified"}`
      : "";

    const antiHallucination = `
=== ABSOLUTE RULES (ZERO TOLERANCE) ===
1. NEVER fabricate statistics, percentages, ROI figures, case studies, or customer names.
2. NEVER claim the product does something not stated in your ICP intelligence above.
3. If asked something you don't know: "Great question — I want to get you the exact answer. Let me have our team follow up with specifics."
4. NEVER make up competitor comparisons.
5. Sound HUMAN. Not robotic. Not scripted. Natural.`;

    return `${baseInstruction}\n\n${frameworkPrompt}\n\n${emotionPrompt}\n\n${icpContext}\n\n${antiHallucination}`;
  };

  const startCall = async () => {
    try {
      endedRef.current = false;
      tornDownRef.current = false;
      const preferredMicId = localStorage.getItem("preferredMicId");
      const preferredSpeakerId = localStorage.getItem("preferredSpeakerId");
      const personaData: AIPersona = (() => {
        try {
          const s = localStorage.getItem("ai_persona");
          if (s) return JSON.parse(s);
        } catch {}
        return DEFAULT_PERSONA;
      })();

      // ── Audio Context ──────────────────────────────────────
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ac = new AudioContextClass({ sampleRate: 16000 });
      if (preferredSpeakerId && typeof (ac as any).setSinkId === "function") {
        try {
          await (ac as any).setSinkId(preferredSpeakerId);
        } catch {}
      }
      audioContextRef.current = ac;

      // ── Output Analyser (for AI Agent visualization) ────────
      const outAnalyser = ac.createAnalyser();
      outAnalyser.fftSize = 128;
      outAnalyser.connect(ac.destination);
      outputAnalyserRef.current = outAnalyser;

      // ── AudioWorklet ───────────────────────────────────────
      try {
        await ac.audioWorklet.addModule("/audio-processor.worklet.js");
      } catch (e) {
        console.warn("AudioWorklet load failed, falling back:", e);
      }

      // ── Microphone ─────────────────────────────────────────
      try {
        const baseAudio: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        };
        const audioConstraints: MediaTrackConstraints = preferredMicId
          ? { ...baseAudio, deviceId: { exact: preferredMicId } }
          : baseAudio;
        try {
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });
        } catch (micErr) {
          if (!preferredMicId) throw micErr;
          // Preferred device missing or unplugged — fall back to system default.
          console.warn("Preferred mic unavailable, using system default:", micErr);
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: baseAudio,
          });
        }
        sourceRef.current = ac.createMediaStreamSource(mediaStreamRef.current);

        // ── Analyser for visualizer ────────────────────────────
        const analyser = ac.createAnalyser();
        analyser.fftSize = 128;
        sourceRef.current.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        console.warn("No active microphone found, proceeding in text-only/simulation mode.");
      }

      const hasAnyKey =
        localStorage.getItem("gemini_api_key") ||
        localStorage.getItem("openai_api_key") ||
        localStorage.getItem("elevenlabs_api_key");

      if (!hasAnyKey || hasAnyKey === "MY_GEMINI_API_KEY") {
        // ── DEMO/NATIVE SIMULATION ─────────────────────────────
        setCallState("connecting");

        safeSetTimeout(() => {
          setCallState("active");
          startTimeRef.current = Date.now();

          const industry = icp?.industry?.toLowerCase() || "";
          const isInsurance =
            industry.includes("insurance") ||
            industry.includes("construction") ||
            industry.includes("engineering");
          const isTech =
            industry.includes("software") ||
            industry.includes("saas") ||
            industry.includes("tech") ||
            industry.includes("cloud");
          const competitor = icp?.competitorNames?.[0] || "your current provider";
          const valueProp = icp?.valueProposition || "scale your operations efficiently";

          const script = isInsurance
            ? [
                { text: `Hello? Who is this?`, role: "user", delay: 2000 },
                {
                  text: `Hi ${lead.name}, this is the OpenCloser AI calling. I noticed ${lead.company} handles heavy industrial projects — quick question: if one of your key assets went down and your current policy denied the claim, what would that cost you?`,
                  role: "model",
                  delay: 5500,
                },
                {
                  text: `We already have coverage through ${competitor}. Been with them for years. Why would we switch?`,
                  role: "user",
                  delay: 13000,
                },
                {
                  text: `That's exactly what most of our clients said. What they found was ${competitor}'s standard policies have specific gaps that leave $100k+ exposures on equipment during transit and complex projects. We close those gaps.`,
                  role: "model",
                  delay: 19000,
                },
                {
                  text: `Hmm. What kind of gaps are we talking about?`,
                  role: "user",
                  delay: 27000,
                },
                {
                  text: `${lead.name}, the most common one is equipment in transit between job sites — most policies drop coverage the moment it leaves your yard. Our contractor-specific policy guarantees coverage end-to-end. ${valueProp}. Would Tuesday at 2pm work for a 15-minute walkthrough?`,
                  role: "model",
                  delay: 33000,
                },
                {
                  text: `I hadn't considered the transit gap. Yeah, send me a calendar invite — let's talk Tuesday.`,
                  role: "user",
                  delay: 42000,
                },
                {
                  text: `Excellent. I'll send that right now. Looking forward to showing you exactly how we protect your operations. Have a great day, ${lead.name}.`,
                  role: "model",
                  delay: 48000,
                },
              ]
            : isTech
              ? [
                  { text: `Hello? Who is this?`, role: "user", delay: 2000 },
                  {
                    text: `Hi ${lead.name}, this is the OpenCloser AI calling. I noticed ${lead.company} is in the tech space — quick question: what's your current cost per qualified lead?`,
                    role: "model",
                    delay: 5000,
                  },
                  {
                    text: `Honestly, it's getting out of control. We're spending about $200 per MQL and the quality is dropping.`,
                    role: "user",
                    delay: 12000,
                  },
                  {
                    text: `That's exactly the problem we solve. Most tech companies are in the same spot — paying more for fewer meetings. Our AI handles the first 1,000 outbound touches and only hands over qualified conversations. Clients typically see a 3x improvement in meeting quality within 30 days.`,
                    role: "model",
                    delay: 18000,
                  },
                  {
                    text: `We tried an outbound AI tool last year and it was terrible. Sounded completely robotic.`,
                    role: "user",
                    delay: 27000,
                  },
                  {
                    text: `I completely understand the skepticism — honestly, you're talking to our AI right now. If I could show you the WarRoom dashboard where you can see exactly how my brain processes buyer signals in real time, would 15 minutes next Tuesday work?`,
                    role: "model",
                    delay: 33000,
                  },
                  {
                    text: `Wait — you're an AI? That's impressive. Okay, send me the invite. I want to see this.`,
                    role: "user",
                    delay: 42000,
                  },
                  {
                    text: `Sent! Thanks for the great conversation, ${lead.name}. Looking forward to showing you what's possible.`,
                    role: "model",
                    delay: 48000,
                  },
                ]
              : [
                  { text: `Hello? Who is this?`, role: "user", delay: 2000 },
                  {
                    text: `Hi ${lead.name}, this is OpenCloser AI calling. I'm reaching out because we help companies like ${lead.company} improve their outbound efficiency. How are things going on the sales front?`,
                    role: "model",
                    delay: 5500,
                  },
                  {
                    text: `We're doing okay but honestly, our team is stretched thin. Too many dials, not enough qualified meetings.`,
                    role: "user",
                    delay: 12000,
                  },
                  {
                    text: `That's exactly the pattern we see. ${lead.name}, if I could show you how to triple your qualified meetings without adding a single SDR, would that be worth 15 minutes next Tuesday?`,
                    role: "model",
                    delay: 19000,
                  },
                  {
                    text: `I don't know — we already use ${competitor} for some of our automation. How are you different?`,
                    role: "user",
                    delay: 27000,
                  },
                  {
                    text: `Great question. ${competitor} is solid, but they focus on workflow — we focus on conversation quality. Our AI handles the actual phone dialogue, handles objections in real time, and only hands over meetings that are truly ready. ${valueProp}.`,
                    role: "model",
                    delay: 34000,
                  },
                  {
                    text: `Alright, I'm curious. Send me a calendar invite and I'll take a look.`,
                    role: "user",
                    delay: 43000,
                  },
                  {
                    text: `Perfect. Invite sent. Thanks for your time, ${lead.name} — really looking forward to showing you what this can do.`,
                    role: "model",
                    delay: 49000,
                  },
                ];

          script.forEach((line) => {
            safeSetTimeout(() => {
              const newLine: TranscriptLine = {
                id: `msg_${Date.now()}_${Math.random()}`,
                role: line.role as any,
                text: line.text,
                timestamp: Date.now(),
              };
              setTranscript((prev) => {
                const next = [...prev, newLine];
                transcriptRef.current = next;
                return next;
              });

              // End call 3 seconds after the last message
              if (line === script[script.length - 1]) {
                safeSetTimeout(() => endCall(), 3000);
              }
            }, line.delay);
          });
        }, 1500);

        return; // Bail out from real engine connection
      }

      // ── CallerEngine ───────────────────────────────────────
      const provider = personaData.provider || "gemini";
      const engine = createCallerEngine(provider, {
        onState: (state) => {
          setCallState(state);
          if (state === "active") {
            startTimeRef.current = Date.now();
            if (usePhoneLink) {
              const phone = lead.phone.replace(/[^0-9+]/g, "");
              open(`tel:${phone}`).catch(() => {});
            }
          }
        },
        onAudio: (b64, sampleRate) => {
          phoneLine.sendToLine(b64, sampleRate);
          playAudio(b64, sampleRate);
        },
        onTranscript: (line) => {
          setTranscript((prev) => {
            const next = [...prev, line];
            transcriptRef.current = next;
            return next;
          });
        },
        onInterrupted: () => {
          playbackQueueRef.current = [];
        },
        onError: (err) => setError(err.message),
      });

      engineRef.current = engine;
      const systemPrompt = buildSystemPrompt();
      await engine.connect(systemPrompt, personaData.voiceId, personaData.language);

      // ── Wire AudioWorklet → Engine ─────────────────────────
      try {
        const worklet = new AudioWorkletNode(ac, "pcm-capture-processor");
        worklet.port.onmessage = (e) => {
          if (e.data.type === "audio" && !isMutedRef.current) {
            engine.sendAudio(e.data.buffer);
          }
        };
        sourceRef.current?.connect(worklet);
        workletNodeRef.current = worklet;
        localStorage.setItem("audio_capture_engine", "worklet");
      } catch (e) {
        // Fallback: ScriptProcessorNode if AudioWorklet not supported
        console.warn("Falling back to ScriptProcessorNode:", e);
        localStorage.setItem("audio_capture_engine", "scriptprocessor");
        const processor = ac.createScriptProcessor(2048, 1, 1);
        scriptProcessorRef.current = processor;
        processor.onaudioprocess = (ev) => {
          if (isMutedRef.current) return;
          engine.sendAudio(ev.inputBuffer.getChannelData(0).slice());
        };
        sourceRef.current?.connect(processor);
        processor.connect(ac.destination);
      }
    } catch (err: any) {
      console.error("Failed to start call:", err);
      audioContextRef.current?.close();
      setError(err.message || "Failed to access microphone or connect to AI.");
    }
  };

  const playAudio = (b64: string, sampleRate: number = 24000) => {
    if (!audioContextRef.current) return;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
    }
    playbackQueueRef.current.push(float32);
    scheduleBuffer(sampleRate);
  };

  const scheduleBuffer = (sampleRate = 24000) => {
    const ac = audioContextRef.current;
    if (!ac || playbackQueueRef.current.length === 0) return;
    const outAnalyser = outputAnalyserRef.current;
    const now = ac.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
    while (playbackQueueRef.current.length > 0) {
      const data = playbackQueueRef.current.shift()!;
      const buf = ac.createBuffer(1, data.length, sampleRate);
      buf.getChannelData(0).set(data);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(outAnalyser || ac.destination);
      src.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buf.duration;
    }
  };

  const finalizeCall = useCallback(
    (notify: boolean) => {
      if (endedRef.current) return;
      endedRef.current = true;
      teardownAudio();
      phoneLineResetRef.current();

      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const t = transcriptRef.current;
      const userMessages = t.filter((e) => e.role === "user").length;

      let status = "Rejected";
      if (userMessages >= 3) status = "Success";
      else if (durationSeconds < 15) status = "Voicemail";

      // Only persist calls that actually captured dialogue.
      if (t.length > 0) {
        const callLogId = `call_${Date.now()}`;
        addCallLogMutation.mutate(
          {
            id: callLogId,
            leadId: lead.id,
            durationSeconds,
            transcript: JSON.stringify(t),
            status,
          },
          { onError: (err) => console.error("Failed to save call log:", err) },
        );
      }

      if (notify) onClose(t, durationSeconds);
    },
    [lead.id, onClose, addCallLogMutation],
  );
  finalizeCallRef.current = finalizeCall;

  const endCall = () => finalizeCallRef.current(true);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    const lineAttached = phoneLine.lineRef.current !== null;
    workletNodeRef.current?.port.postMessage({
      type: "setMuted",
      muted: next || lineAttached,
    });
  };

  return {
    callState,
    isMuted,
    usePhoneLink,
    setUsePhoneLink,
    transcript,
    error,
    elapsedSeconds,
    currentAxes,
    recentShifts,
    sentiment,
    sentimentLabel,
    activeObjection,
    setActiveObjection,
    objectionHistory,
    audioContextRef,
    outputAnalyserRef,
    analyserRef,
    endCall,
    toggleMute,
    phoneLine,
  };
}
