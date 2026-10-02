import { useState, useMemo } from "react";
import {
  Bot,
  Mic2,
  BookOpen,
  Save,
  Volume2,
  Play,
  Activity,
  Zap,
  ChevronDown,
  Brain,
  MessageSquare,
  Eye,
  Check,
} from "lucide-react";
import {
  AIPersona,
  DEFAULT_PERSONA,
  SalesFramework,
  VoicePreset,
  VOICE_PRESETS,
} from "../../../types/persona";
import { PROVIDERS, getProvider } from "../../voice/lib/providers";
import { buildEmotionSystemPrompt } from "../../voice/lib/emotion-engine";

interface AIPersonaBuilderProps {
  initialPersona?: AIPersona;
  onSave: (persona: AIPersona) => void;
}

const FRAMEWORKS: { id: SalesFramework; name: string; desc: string }[] = [
  {
    id: "SPIN Selling",
    name: "SPIN Selling",
    desc: "Situation → Problem → Implication → Need-Payoff. Uncover pain before pitching.",
  },
  {
    id: "Challenger Sale",
    name: "Challenger Sale",
    desc: "Challenge assumptions, teach something new, reframe the problem.",
  },
  {
    id: "Sandler System",
    name: "Sandler System",
    desc: "Mutual qualification — pain, budget, decision process before presenting.",
  },
  {
    id: "Straight Line Persuasion",
    name: "Straight Line",
    desc: "High-energy, direct path to yes or no. Maintain momentum.",
  },
];

const LANGUAGES = [
  "English (US) - Conversational",
  "English (British) - RP Accent",
  "Spanish (Latin America)",
  "Spanish (Spain)",
  "French (Standard)",
  "German (Standard)",
];

const PRESET_OPTIONS: VoicePreset[] = [
  "Friendly Professional",
  "Assertive Closer",
  "Empathetic Consultant",
  "High-Energy Pitch",
  "Custom",
];

export function AIPersonaBuilder({ initialPersona, onSave }: AIPersonaBuilderProps) {
  const [persona, setPersona] = useState<AIPersona>({
    ...DEFAULT_PERSONA,
    ...initialPersona,
    speechPatterns: {
      useFillers: true,
      useMirroring: true,
      useStrategicSilence: true,
      nameDropFrequency: "medium",
      ...initialPersona?.speechPatterns,
    },
  });
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const updateEmotion = (key: keyof AIPersona["emotionalModulation"], value: number | boolean) => {
    setPersona((prev) => ({
      ...prev,
      voicePreset: "Custom",
      emotionalModulation: { ...prev.emotionalModulation, [key]: value },
    }));
  };

  const updateSpeech = (key: keyof AIPersona["speechPatterns"], value: any) => {
    setPersona((prev) => ({
      ...prev,
      speechPatterns: { ...prev.speechPatterns, [key]: value },
    }));
  };

  const applyPreset = (preset: VoicePreset) => {
    if (preset === "Custom") return;
    const overrides = VOICE_PRESETS[preset];
    setPersona((prev) => ({
      ...prev,
      voicePreset: preset,
      emotionalModulation: { ...prev.emotionalModulation, ...overrides },
    }));
  };

  const providerConfig = getProvider(persona.provider || "gemini");
  const voices = providerConfig.voices;

  const promptPreview = useMemo(
    () =>
      buildEmotionSystemPrompt(
        {
          empathy: persona.emotionalModulation.empathy,
          energy: persona.emotionalModulation.energy,
          formality: persona.emotionalModulation.formality,
          assertiveness: persona.emotionalModulation.assertiveness ?? 45,
          humor: persona.emotionalModulation.humor ?? 30,
        },
        persona.speechPatterns || DEFAULT_PERSONA.speechPatterns,
      ),
    [persona.emotionalModulation, persona.speechPatterns],
  );

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-6 lg:px-10 h-full overflow-y-auto custom-scrollbar animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10 p-7 card bg-white relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-surface-bg flex items-center justify-center border border-surface-border shrink-0">
          <Brain className="w-7 h-7 text-coral" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-3">
            Voice Engine Architect
            <span className="badge-pending px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Enterprise
            </span>
          </h2>
          <p className="text-ink-secondary text-sm mt-1 font-medium">
            Configure your AI caller's voice, emotions, speech patterns, and sales framework.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ── Left Column ── */}
        <div className="xl:col-span-5 space-y-6">
          {/* Provider Selection */}
          <section className="card p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-coral" /> AI Voice Provider
            </h3>
            <div className="space-y-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersona((prev) => ({
                      ...prev,
                      provider: p.id,
                      voiceId: p.voices[0].id,
                    }));
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-smooth ${
                    persona.provider === p.id
                      ? "bg-white border-coral/30 shadow-sm ring-1 ring-coral/10"
                      : "bg-surface-bg/50 border-surface-border hover:bg-white hover:border-ink-secondary/20"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${persona.provider === p.id ? "bg-coral/10" : "bg-surface-bg"}`}
                  >
                    {p.id === "gemini" ? "🧠" : p.id === "openai" ? "⚡" : "🎤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold ${persona.provider === p.id ? "text-ink" : "text-ink-secondary"}`}
                    >
                      {p.label}
                    </div>
                    <div className="text-[11px] text-ink-muted truncate">
                      {p.description.split(".")[0]}
                    </div>
                  </div>
                  {persona.provider === p.id && <Check className="w-4 h-4 text-coral shrink-0" />}
                </button>
              ))}
            </div>
            {providerConfig.requiresRelay && (
              <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-medium">
                ⚠️ Requires your API key in Settings → Voice Engine
              </p>
            )}
          </section>

          {/* Voice Selection */}
          <section className="card p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-5">
              <Mic2 className="w-4 h-4 text-coral" /> Voice Identity
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setPersona((prev) => ({ ...prev, voiceId: v.id }))}
                  className={`p-4 rounded-xl border text-left transition-smooth ${
                    persona.voiceId === v.id
                      ? "bg-white border-coral/30 shadow-sm ring-1 ring-coral/10"
                      : "bg-surface-bg/50 border-surface-border hover:bg-white"
                  }`}
                >
                  <div
                    className={`text-sm font-bold mb-0.5 ${persona.voiceId === v.id ? "text-coral" : "text-ink"}`}
                  >
                    {v.label}
                  </div>
                  <div className="text-[10px] text-ink-muted">{v.tone}</div>
                  <div className="text-[10px] text-ink-muted capitalize mt-0.5">{v.gender}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-2 block">
                Language / Dialect
              </label>
              <div className="relative">
                <select
                  value={persona.language}
                  onChange={(e) => setPersona((p) => ({ ...p, language: e.target.value }))}
                  className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-xs font-bold text-ink-secondary appearance-none focus:outline-none focus:border-coral/30"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted w-4 h-4" />
              </div>
            </div>
          </section>

          {/* Framework */}
          <section className="card p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-5">
              <BookOpen className="w-4 h-4 text-coral" /> Sales Framework
            </h3>
            <div className="space-y-2">
              {FRAMEWORKS.map((f) => (
                <label
                  key={f.id}
                  className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-smooth ${
                    persona.framework === f.id
                      ? "bg-white border-coral/30 shadow-sm ring-1 ring-coral/10"
                      : "bg-surface-bg/50 border-surface-border hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={persona.framework === f.id}
                    onChange={() => setPersona((p) => ({ ...p, framework: f.id }))}
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-smooth ${persona.framework === f.id ? "border-coral bg-coral" : "border-ink-muted/30"}`}
                  >
                    {persona.framework === f.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-bold ${persona.framework === f.id ? "text-ink" : "text-ink-secondary"}`}
                    >
                      {f.name}
                    </div>
                    <div className="text-[11px] text-ink-muted leading-relaxed mt-0.5">
                      {f.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column ── */}
        <div className="xl:col-span-7 space-y-6">
          {/* Voice Presets */}
          <section className="card p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-4">
              <Volume2 className="w-4 h-4 text-coral" /> Personality Presets
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-smooth ${
                    persona.voicePreset === p
                      ? "bg-coral/10 border-coral/30 text-coral"
                      : "bg-surface-bg border-surface-border text-ink-muted hover:border-ink-secondary/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* 5-Axis Emotion Sliders */}
          <section className="card p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2">
                <Activity className="w-4 h-4 text-coral" /> Emotion Matrix (5-Axis)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
                  Dynamic Shift
                </span>
                <button
                  onClick={() =>
                    updateEmotion("dynamicToneShift", !persona.emotionalModulation.dynamicToneShift)
                  }
                  className={`w-10 h-5 rounded-full p-0.5 transition-smooth ${persona.emotionalModulation.dynamicToneShift ? "bg-coral" : "bg-surface-bg border border-surface-border"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-smooth ${persona.emotionalModulation.dynamicToneShift ? "translate-x-5 bg-white" : "translate-x-0 bg-ink-muted/30"}`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-7">
              {[
                {
                  key: "empathy",
                  label: "Empathy",
                  left: "Assertive",
                  right: "Empathetic",
                  color: "bg-blue-500",
                  val: persona.emotionalModulation.empathy,
                },
                {
                  key: "energy",
                  label: "Energy",
                  left: "Calm",
                  right: "High-Octane",
                  color: "bg-coral",
                  val: persona.emotionalModulation.energy,
                },
                {
                  key: "formality",
                  label: "Formality",
                  left: "Casual",
                  right: "Corporate",
                  color: "bg-ink",
                  val: persona.emotionalModulation.formality,
                },
                {
                  key: "assertiveness",
                  label: "Assertiveness",
                  left: "Collaborative",
                  right: "Direct Close",
                  color: "bg-red-500",
                  val: persona.emotionalModulation.assertiveness ?? 45,
                },
                {
                  key: "humor",
                  label: "Humor",
                  left: "Serious",
                  right: "Light Banter",
                  color: "bg-pink-500",
                  val: persona.emotionalModulation.humor ?? 30,
                },
                {
                  key: "pacing",
                  label: "Pacing",
                  left: "Deliberate",
                  right: "Rapid-fire",
                  color: "bg-purple-500",
                  val: persona.emotionalModulation.pacing,
                },
                {
                  key: "interruptionHandling",
                  label: "Interrupt. Tolerance",
                  left: "Strict",
                  right: "Adaptive",
                  color: "bg-amber-500",
                  val: persona.emotionalModulation.interruptionHandling,
                },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-ink-secondary">
                      {s.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-ink bg-surface-bg px-2.5 py-1 rounded-lg border border-surface-border">
                      {Math.round(s.val as number)}
                    </span>
                  </div>
                  <div className="relative group/slider h-5 flex items-center">
                    <div className="absolute w-full h-1.5 bg-surface-bg rounded-full border border-surface-border overflow-hidden">
                      <div
                        className={`h-full ${s.color} opacity-60 transition-smooth`}
                        style={{ width: `${s.val}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={s.val as number}
                      onChange={(e) => updateEmotion(s.key as any, parseInt(e.target.value))}
                      className="absolute w-full h-5 opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className="absolute w-4 h-4 rounded-full bg-white border-2 border-ink shadow-sm pointer-events-none transition-all group-hover/slider:scale-110"
                      style={{ left: `calc(${s.val}% - 8px)` }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${s.color} m-auto absolute inset-0`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-muted font-bold uppercase tracking-tight mt-1">
                    <span>{s.left}</span>
                    <span>{s.right}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Speech Patterns */}
          <section className="card p-7">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-5">
              <MessageSquare className="w-4 h-4 text-coral" /> Speech Pattern Controls
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: "useFillers",
                  label: "Natural Fillers",
                  desc: '"um", "you know", "right" — sounds human',
                },
                {
                  key: "useMirroring",
                  label: "Active Mirroring",
                  desc: "Echo last 2-3 words of prospect before responding",
                },
                {
                  key: "useStrategicSilence",
                  label: "Strategic Silence",
                  desc: "Pause after objections instead of rushing to respond",
                },
              ].map((toggle) => {
                const val =
                  (persona.speechPatterns?.[
                    toggle.key as keyof typeof persona.speechPatterns
                  ] as boolean) ?? true;
                return (
                  <div
                    key={toggle.key}
                    className="flex items-center justify-between py-3 border-b border-surface-border last:border-0"
                  >
                    <div>
                      <div className="text-sm font-bold text-ink">{toggle.label}</div>
                      <div className="text-[11px] text-ink-muted">{toggle.desc}</div>
                    </div>
                    <button
                      onClick={() => updateSpeech(toggle.key as any, !val)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-smooth shrink-0 ml-4 ${val ? "bg-coral" : "bg-surface-bg border border-surface-border"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full transition-smooth ${val ? "translate-x-5 bg-white" : "translate-x-0 bg-ink-muted/30"}`}
                      />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-sm font-bold text-ink">Name Drop Frequency</div>
                  <div className="text-[11px] text-ink-muted">
                    How often to use the prospect's first name
                  </div>
                </div>
                <select
                  value={persona.speechPatterns?.nameDropFrequency ?? "medium"}
                  onChange={(e) => updateSpeech("nameDropFrequency", e.target.value as any)}
                  className="text-xs font-bold bg-surface-bg border border-surface-border rounded-lg px-3 py-1.5 appearance-none focus:outline-none ml-4"
                >
                  <option value="never">Never</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </section>

          {/* System Prompt Preview */}
          <section className="card overflow-hidden">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-bg/50 transition-smooth"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2">
                <Eye className="w-4 h-4 text-coral" /> System Prompt Preview
              </span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted transition-transform ${showPromptPreview ? "rotate-180" : ""}`}
              />
            </button>
            {showPromptPreview && (
              <div className="px-5 pb-5">
                <pre className="text-[10px] font-mono text-ink-muted bg-surface-bg rounded-xl p-4 overflow-y-auto h-48 leading-relaxed border border-surface-border whitespace-pre-wrap">
                  {promptPreview}
                </pre>
              </div>
            )}
          </section>

          {/* Voice Preview */}
          <section className="card overflow-hidden">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-bg/50 transition-smooth"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2">
                <Play className="w-4 h-4 text-coral" /> Voice Preview
              </span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted transition-transform ${showPromptPreview ? "rotate-180" : ""}`}
              />
            </button>
            {showPromptPreview && (
              <div className="px-5 pb-5">
                <div className="bg-surface-bg rounded-xl p-4 border border-surface-border space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-coral flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-[13px] text-ink-secondary leading-relaxed">
                      "Hi there! I'm calling from OpenCloser. I noticed your team might benefit from
                      what we're doing — would you have 2 minutes to hear how we're helping
                      companies like yours?"
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-muted text-center font-mono">
                    {persona.emotionalModulation.energy} energy ·{" "}
                    {persona.emotionalModulation.empathy} empathy ·{" "}
                    {persona.emotionalModulation.formality} formality · {persona.framework}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Save Button */}
          <button
            onClick={() => onSave(persona)}
            className="btn-coral w-full py-4 text-sm uppercase tracking-[0.2em] shadow-coral-hover flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Activate Persona
          </button>
        </div>
      </div>
    </div>
  );
}
