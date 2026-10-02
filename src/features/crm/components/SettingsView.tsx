import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Mic,
  Volume2,
  Info,
  CheckCircle2,
  ChevronDown,
  Sliders,
  Key,
  Eye,
  EyeOff,
  CheckCheck,
  AlertTriangle,
  Zap,
  Cpu,
  Phone,
} from "lucide-react";
import { PROVIDERS } from "../../voice/lib/providers";
import {
  testTwilioConnection,
  getTwilioConfig,
  saveTwilioConfig,
  getTwilioStreamInfo,
  getTwilioTunnelInfo,
  startTwilioTunnel,
  stopTwilioTunnel,
  type TwilioStreamInfo,
} from "../../../services/twilio.service";

export function SettingsView() {
  // Audio devices
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // API Keys
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string | null>>({});
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [captureEngine, setCaptureEngine] = useState<string | null>(null);
  const [autoTunnel, setAutoTunnel] = useState(() => getTwilioConfig().autoTunnel);
  const [streamInfo, setStreamInfo] = useState<TwilioStreamInfo | null>(null);
  const [tunnelInfo, setTunnelInfo] = useState<{ running: boolean; url: string | null } | null>(
    null,
  );

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const testConnection = async (providerId: string, storageKey: string) => {
    setTesting((prev) => ({ ...prev, [providerId]: true }));
    setTestResults((prev) => ({ ...prev, [providerId]: null }));
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("test_provider_connection", {
        provider: providerId,
        apiKey: apiKeys[storageKey] || "",
      });
      setTestResults((prev) => ({ ...prev, [providerId]: "connected" }));
    } catch (err) {
      console.error(`Connection test failed for ${providerId}:`, err);
      setTestResults((prev) => ({ ...prev, [providerId]: "failed" }));
    } finally {
      setTesting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const testOllama = async () => {
    setTesting((prev) => ({ ...prev, ollama: true }));
    setTestResults((prev) => ({ ...prev, ollama: null }));
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("test_ollama_connection", { baseUrl: apiKeys["ollama_base_url"] || "" });
      setTestResults((prev) => ({ ...prev, ollama: "connected" }));
    } catch (err) {
      console.error("Ollama connection test failed:", err);
      setTestResults((prev) => ({ ...prev, ollama: "failed" }));
    } finally {
      setTesting((prev) => ({ ...prev, ollama: false }));
    }
  };

  const testTwilio = async () => {
    setTesting((prev) => ({ ...prev, twilio: true }));
    setTestResults((prev) => ({ ...prev, twilio: null }));
    try {
      await testTwilioConnection();
      setTestResults((prev) => ({ ...prev, twilio: "connected" }));
    } catch (err) {
      console.error("Twilio connection test failed:", err);
      setTestResults((prev) => ({ ...prev, twilio: "failed" }));
    } finally {
      setTesting((prev) => ({ ...prev, twilio: false }));
    }
  };

  const refreshPhoneStatus = () => {
    getTwilioStreamInfo()
      .then((info) => setStreamInfo(info ?? null))
      .catch(() => setStreamInfo(null));
    getTwilioTunnelInfo()
      .then((info) => setTunnelInfo(info ?? null))
      .catch(() => setTunnelInfo(null));
  };

  const startTunnel = async () => {
    try {
      await startTwilioTunnel();
      showSaved("Tunnel started");
    } catch (err) {
      console.error("Failed to start tunnel:", err);
      showSaved(err instanceof Error ? err.message : "Tunnel failed to start");
    }
    refreshPhoneStatus();
  };

  const stopTunnel = async () => {
    try {
      await stopTwilioTunnel();
    } catch (err) {
      console.error("Failed to stop tunnel:", err);
    }
    refreshPhoneStatus();
  };

  useEffect(() => {
    refreshPhoneStatus();
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setPermissionGranted(true);
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          setMics(devices.filter((d) => d.kind === "audioinput"));
          setSpeakers(devices.filter((d) => d.kind === "audiooutput"));
          const savedMic = localStorage.getItem("preferredMicId");
          const savedSpeaker = localStorage.getItem("preferredSpeakerId");
          if (savedMic) setSelectedMic(savedMic);
          if (savedSpeaker) setSelectedSpeaker(savedSpeaker);
          stream.getTracks().forEach((t) => t.stop());
        });
      })
      .catch(console.error);

    // Load stored API keys
    const stored: Record<string, string> = {};
    PROVIDERS.forEach((p) => {
      stored[p.apiKeySettingKey] = localStorage.getItem(p.apiKeySettingKey) || "";
      p.extraSettings?.forEach((s) => {
        stored[s.key] = localStorage.getItem(s.key) || "";
      });
    });
    [
      "ollama_base_url",
      "ollama_model",
      "twilio_account_sid",
      "twilio_auth_token",
      "twilio_phone_number",
      "twilio_wss_url",
    ].forEach((key) => {
      stored[key] = localStorage.getItem(key) || "";
    });
    setApiKeys(stored);
    setCaptureEngine(localStorage.getItem("audio_capture_engine"));
  }, []);

  const showSaved = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const saveMic = (id: string) => {
    setSelectedMic(id);
    localStorage.setItem("preferredMicId", id);
    showSaved("Mic updated");
  };
  const saveSpeaker = (id: string) => {
    setSelectedSpeaker(id);
    localStorage.setItem("preferredSpeakerId", id);
    showSaved("Speaker updated");
  };

  const saveApiKey = (storageKey: string, value: string, savedLabel = "API key saved") => {
    setApiKeys((prev) => ({ ...prev, [storageKey]: value }));
    localStorage.setItem(storageKey, value);
    showSaved(savedLabel);
  };

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasKey = (storageKey: string) => !!apiKeys[storageKey]?.trim();

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto py-10 px-6 lg:px-10 h-full overflow-y-auto custom-scrollbar animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-surface-bg flex items-center justify-center border border-surface-border shadow-sm">
            <SettingsIcon className="w-7 h-7 text-coral" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink">System Configuration</h2>
            <p className="text-ink-secondary text-sm mt-1 font-medium">
              Voice engine API keys, hardware routing, and audio settings.
            </p>
          </div>
        </div>
        {savedMessage && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> {savedMessage}
          </div>
        )}
      </div>

      <div className="space-y-8 pb-16">
        {/* ── Appearance ── */}
        <section className="card p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-coral" /> Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">Dark Mode</div>
              <div className="text-[11px] text-ink-muted">Switch between light and dark theme</div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full p-0.5 transition-smooth ${darkMode ? "bg-coral" : "bg-surface-bg border border-surface-border"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>
        </section>

        {/* ── Voice Engine API Keys ── */}
        <section className="card p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-coral" /> Voice Engine API Keys
          </h3>
          <p className="text-ink-muted text-sm mb-6 font-medium">
            Keys are stored on this device only and sent directly to the provider you configured —
            never to any other server.
          </p>

          <div className="space-y-6">
            {PROVIDERS.map((provider) => (
              <div
                key={provider.id}
                className="rounded-2xl border border-surface-border overflow-hidden"
              >
                {/* Provider Header */}
                <div className="flex items-center gap-3 bg-surface-bg px-6 py-4 border-b border-surface-border">
                  <span className="text-xl">
                    {provider.id === "gemini" ? "🧠" : provider.id === "openai" ? "⚡" : "🎤"}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-ink">{provider.label}</span>
                    <span className="text-[11px] text-ink-muted ml-2">{provider.model}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      hasKey(provider.apiKeySettingKey)
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-surface-bg border-surface-border text-ink-muted"
                    }`}
                  >
                    {hasKey(provider.apiKeySettingKey) ? (
                      <>
                        <CheckCheck className="w-3 h-3" /> Configured
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Not Set
                      </>
                    )}
                  </div>
                </div>

                {/* Key Inputs */}
                <div className="p-6 space-y-4">
                  {/* Primary API Key */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                      {provider.apiKeyLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys[provider.apiKeySettingKey] ? "text" : "password"}
                        value={apiKeys[provider.apiKeySettingKey] || ""}
                        onChange={(e) =>
                          setApiKeys((prev) => ({
                            ...prev,
                            [provider.apiKeySettingKey]: e.target.value,
                          }))
                        }
                        onBlur={(e) => saveApiKey(provider.apiKeySettingKey, e.target.value)}
                        placeholder={`${provider.id === "gemini" ? "AIza..." : provider.id === "openai" ? "sk-..." : "xi_..."}`}
                        className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30 pr-10"
                      />
                      <button
                        onClick={() => toggleShowKey(provider.apiKeySettingKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-smooth"
                      >
                        {showKeys[provider.apiKeySettingKey] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Extra Settings (e.g. ElevenLabs Agent ID) */}
                  {provider.extraSettings?.map((extra) => (
                    <div key={extra.key}>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                        {extra.label}
                      </label>
                      <div className="relative">
                        <input
                          type={showKeys[extra.key] ? "text" : "password"}
                          value={apiKeys[extra.key] || ""}
                          onChange={(e) =>
                            setApiKeys((prev) => ({ ...prev, [extra.key]: e.target.value }))
                          }
                          onBlur={(e) => saveApiKey(extra.key, e.target.value)}
                          placeholder={extra.placeholder}
                          className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30 pr-10"
                        />
                        <button
                          onClick={() => toggleShowKey(extra.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                        >
                          {showKeys[extra.key] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Test Connection */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => testConnection(provider.id, provider.apiKeySettingKey)}
                      disabled={!hasKey(provider.apiKeySettingKey) || testing[provider.id]}
                      className="text-[11px] font-bold px-4 py-2 rounded-xl border border-surface-border bg-white hover:bg-surface-bg transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {testing[provider.id] ? "Testing..." : "Test Connection"}
                    </button>
                    {testResults[provider.id] === "connected" && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Connected
                      </span>
                    )}
                    {testResults[provider.id] === "failed" && (
                      <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed — check key
                      </span>
                    )}
                  </div>

                  {!provider.requiresRelay && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Direct browser connection — no server relay
                      needed.
                    </p>
                  )}
                  {provider.requiresRelay && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Voice routes through a relay on this machine. Key
                      stays on your machine.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Offline AI (Ollama) ── */}
        <section className="card p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-coral" /> Offline AI — Ollama
          </h3>
          <p className="text-ink-muted text-sm mb-6 font-medium">
            Connect a local Ollama server to run ICP interviews, lead research, call analysis, and
            objection training fully offline. When configured, local mode takes priority over cloud
            AI — no data leaves this machine.
          </p>

          <div className="rounded-2xl border border-surface-border overflow-hidden">
            <div className="flex items-center gap-3 bg-surface-bg px-6 py-4 border-b border-surface-border">
              <span className="text-xl">🏠</span>
              <div className="flex-1">
                <span className="text-sm font-bold text-ink">Local Ollama</span>
                <span className="text-[11px] text-ink-muted ml-2">
                  {apiKeys["ollama_model"]?.trim() || "default: llama3.2"}
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  hasKey("ollama_base_url")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-surface-bg border-surface-border text-ink-muted"
                }`}
              >
                {hasKey("ollama_base_url") ? (
                  <>
                    <CheckCheck className="w-3 h-3" /> Configured
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Not Set
                  </>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={apiKeys["ollama_base_url"] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, ollama_base_url: e.target.value }))
                    }
                    onBlur={(e) =>
                      saveApiKey("ollama_base_url", e.target.value, "Ollama URL saved")
                    }
                    placeholder="http://127.0.0.1:11434"
                    className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={apiKeys["ollama_model"] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, ollama_model: e.target.value }))
                    }
                    onBlur={(e) => saveApiKey("ollama_model", e.target.value, "Model saved")}
                    placeholder="llama3.2"
                    className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={testOllama}
                  disabled={!hasKey("ollama_base_url") || testing["ollama"]}
                  className="text-[11px] font-bold px-4 py-2 rounded-xl border border-surface-border bg-white hover:bg-surface-bg transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testing["ollama"] ? "Testing..." : "Test Connection"}
                </button>
                {testResults["ollama"] === "connected" && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                )}
                {testResults["ollama"] === "failed" && (
                  <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Failed — is{" "}
                    <code className="font-mono">ollama serve</code> running?
                  </span>
                )}
              </div>

              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Runs through the local backend — voice calls still use
                your configured voice engine.
              </p>
            </div>
          </div>
        </section>

        {/* ── Phone Line (Twilio) ── */}
        <section className="card p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-coral" /> Phone Line — Twilio
          </h3>
          <p className="text-ink-muted text-sm mb-6 font-medium">
            Place real outbound calls over Twilio Media Streams: the AI speaks directly into a live
            phone line. Credentials are optional — without them calls run in mock mode so you can
            try the full flow before connecting an account.
          </p>

          <div className="rounded-2xl border border-surface-border overflow-hidden">
            <div className="flex items-center gap-3 bg-surface-bg px-6 py-4 border-b border-surface-border">
              <span className="text-xl">📞</span>
              <div className="flex-1">
                <span className="text-sm font-bold text-ink">Twilio Account</span>
                <span className="text-[11px] text-ink-muted ml-2">
                  {hasKey("twilio_account_sid") && hasKey("twilio_auth_token")
                    ? apiKeys["twilio_phone_number"]?.trim() || "configured"
                    : "mock mode"}
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  hasKey("twilio_account_sid") && hasKey("twilio_auth_token")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-surface-bg border-surface-border text-ink-muted"
                }`}
              >
                {hasKey("twilio_account_sid") && hasKey("twilio_auth_token") ? (
                  <>
                    <CheckCheck className="w-3 h-3" /> Live
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Mock
                  </>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    Account SID
                  </label>
                  <input
                    type="text"
                    value={apiKeys["twilio_account_sid"] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, twilio_account_sid: e.target.value }))
                    }
                    onBlur={(e) =>
                      saveApiKey("twilio_account_sid", e.target.value, "Account SID saved")
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    Auth Token
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys["twilio_auth_token"] ? "text" : "password"}
                      value={apiKeys["twilio_auth_token"] || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({ ...prev, twilio_auth_token: e.target.value }))
                      }
                      onBlur={(e) =>
                        saveApiKey("twilio_auth_token", e.target.value, "Auth token saved")
                      }
                      placeholder="your auth token"
                      className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30 pr-10"
                    />
                    <button
                      onClick={() => toggleShowKey("twilio_auth_token")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-smooth"
                    >
                      {showKeys["twilio_auth_token"] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    Twilio Phone Number
                  </label>
                  <input
                    type="text"
                    value={apiKeys["twilio_phone_number"] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, twilio_phone_number: e.target.value }))
                    }
                    onBlur={(e) =>
                      saveApiKey("twilio_phone_number", e.target.value, "Phone number saved")
                    }
                    placeholder="+15125550100"
                    className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-ink-muted block mb-2">
                    WSS URL Override
                  </label>
                  <input
                    type="text"
                    value={apiKeys["twilio_wss_url"] || ""}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, twilio_wss_url: e.target.value }))
                    }
                    onBlur={(e) => saveApiKey("twilio_wss_url", e.target.value, "WSS URL saved")}
                    placeholder="wss://your-tunnel.example.com"
                    className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-mono text-ink focus:outline-none focus:border-coral/30"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoTunnel}
                  onChange={(e) => {
                    setAutoTunnel(e.target.checked);
                    saveTwilioConfig({ autoTunnel: e.target.checked });
                    showSaved("Tunnel setting saved");
                  }}
                  className="w-4 h-4 accent-coral"
                />
                <span className="text-sm font-bold text-ink">
                  Auto-tunnel with bundled{" "}
                  <code className="font-mono text-[12px]">cloudflared</code>
                </span>
                <span className="text-[11px] text-ink-muted">
                  — exposes the media stream over a temporary public URL when you place a call
                </span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={testTwilio}
                  disabled={
                    !hasKey("twilio_account_sid") ||
                    !hasKey("twilio_auth_token") ||
                    testing["twilio"]
                  }
                  className="text-[11px] font-bold px-4 py-2 rounded-xl border border-surface-border bg-white hover:bg-surface-bg transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testing["twilio"] ? "Testing..." : "Test Connection"}
                </button>
                {testResults["twilio"] === "connected" && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                )}
                {testResults["twilio"] === "failed" && (
                  <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Failed — check SID, token and network
                  </span>
                )}
              </div>

              {!hasKey("twilio_account_sid") && (
                <p className="text-[11px] text-ink-muted font-medium flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> No credentials yet — phone-line calls will run in
                  mock mode (no real dialing, everything else works).
                </p>
              )}

              {streamInfo && streamInfo.port > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-surface-border">
                  <span className="text-[11px] font-mono text-ink-muted">
                    Media stream: 127.0.0.1:{streamInfo.port}
                    {streamInfo.connected ? " · connected" : " · idle"}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">
                    Tunnel:{" "}
                    {tunnelInfo?.running && tunnelInfo.url
                      ? tunnelInfo.url.replace("https://", "").replace("http://", "")
                      : "not running"}
                  </span>
                  {tunnelInfo?.running ? (
                    <button
                      onClick={stopTunnel}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg border border-surface-border bg-white hover:bg-surface-bg transition-smooth"
                    >
                      Stop Tunnel
                    </button>
                  ) : (
                    <button
                      onClick={startTunnel}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg border border-surface-border bg-white hover:bg-surface-bg transition-smooth"
                    >
                      Start Tunnel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Audio Hardware ── */}
        <section className="card p-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-5">
            <Sliders className="w-4 h-4 text-coral" /> Hardware Architecture
          </h3>

          {/* Virtual Cable Info */}
          <div className="mb-7 p-5 rounded-xl bg-coral-light border border-coral/10">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-coral/20 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-coral" />
              </div>
              <div>
                <h4 className="font-bold text-ink mb-1">Virtual Audio Routing</h4>
                <p className="text-ink-secondary text-sm leading-relaxed font-medium">
                  For AI audio injection into Phone Link or FaceTime, use a virtual audio cable. Set{" "}
                  <span className="font-bold text-ink">Output</span>: CABLE Input ·{" "}
                  <span className="font-bold text-ink">Input</span>: CABLE Output
                </p>
              </div>
            </div>
          </div>

          {!permissionGranted && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm font-bold">
                Grant microphone permission to configure audio devices.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-ink-muted uppercase tracking-widest">
                <Mic className="w-4 h-4 text-coral" /> Microphone Input
              </label>
              <div className="relative">
                <select
                  value={selectedMic}
                  onChange={(e) => saveMic(e.target.value)}
                  className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-ink appearance-none hover:border-coral/20 focus:outline-none focus:border-coral/30"
                >
                  <option value="">System Default</option>
                  {mics.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label || `Input (${m.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-ink-muted uppercase tracking-widest">
                <Volume2 className="w-4 h-4 text-coral" /> Speaker / Output
              </label>
              <div className="relative">
                <select
                  value={selectedSpeaker}
                  onChange={(e) => saveSpeaker(e.target.value)}
                  className="w-full bg-surface-bg border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-ink appearance-none hover:border-coral/20 focus:outline-none focus:border-coral/30"
                >
                  <option value="">System Default</option>
                  {speakers.map((s) => (
                    <option key={s.deviceId} value={s.deviceId}>
                      {s.label || `Output (${s.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Audio Engine Info */}
        <section className="card p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-coral" /> Audio Engine
          </h3>
          {captureEngine === "worklet" ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-800">AudioWorklet Engine Active</div>
                <div className="text-xs text-emerald-600">
                  Last call used dedicated audio-thread PCM capture (~10ms latency).
                </div>
              </div>
            </div>
          ) : captureEngine === "scriptprocessor" ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-800">
                  Legacy ScriptProcessor Fallback Used
                </div>
                <div className="text-xs text-amber-600">
                  AudioWorklet failed to load on the last call. Higher latency, less stable.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-surface-bg border border-surface-border rounded-xl px-5 py-3.5">
              <Info className="w-5 h-5 text-ink-muted shrink-0" />
              <div>
                <div className="text-sm font-bold text-ink">Not yet measured</div>
                <div className="text-xs text-ink-muted">
                  Start a call in War Room to see which capture engine was used.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
