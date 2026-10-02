import { useState, useEffect } from "react";
import {
  Headphones,
  Download,
  ArrowRight,
  Mic,
  CheckCircle2,
  Volume2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

interface AudioSetupWizardProps {
  onComplete: () => void;
}

export function AudioSetupWizard({ onComplete }: AudioSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (step === 3) {
      requestPermissionsAndEnumerate();
    }
  }, [step]);

  const requestPermissionsAndEnumerate = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setPermissionGranted(true);
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          setMics(devices.filter((d) => d.kind === "audioinput"));
          setSpeakers(devices.filter((d) => d.kind === "audiooutput"));
          stream.getTracks().forEach((t) => t.stop());
        });
      })
      .catch((e) => {
        console.error("Could not get media permissions", e);
      });
  };

  const openDownloadLink = (os: "win" | "mac") => {
    const url =
      os === "win" ? "https://vb-audio.com/Cable/" : "https://existential.audio/blackhole/";
    open(url).catch(console.error);
  };

  const handleFinish = () => {
    if (selectedMic) localStorage.setItem("preferredMicId", selectedMic);
    if (selectedSpeaker) localStorage.setItem("preferredSpeakerId", selectedSpeaker);
    localStorage.setItem("hasCompletedAudioSetup", "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasCompletedAudioSetup", "true");
    onComplete();
  };

  const stepLabels = ["Purpose", "Install Driver", "Configure"];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 font-sans animate-fade-in">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[200px] rounded-full pointer-events-none"></div>

      <div className="glass-card rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col relative z-10 border border-white/[0.08] animate-scale-in">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-10 pt-8 pb-4 relative z-10">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      : isActive
                        ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        : "bg-white/5 border-white/10 text-gray-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                </div>
                <span
                  className={`text-xs font-mono uppercase tracking-[0.15em] hidden sm:block ${
                    isActive ? "text-blue-400" : isCompleted ? "text-emerald-400" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full mx-2 ${
                      isCompleted ? "bg-emerald-500/50" : "bg-white/5"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mx-10 h-1 bg-white/5 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-10 flex flex-col flex-1">
          {/* Step 1: Explanation */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="relative mb-8">
                <div className="absolute -inset-3 bg-blue-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-[1.5rem] flex items-center justify-center border border-blue-500/30 glow-blue relative z-10 shadow-2xl">
                  <Headphones className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                AI Phone Bridging Setup
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl">
                To allow the OpenCloser AI to speak directly into your physical smartphone via{" "}
                <strong className="text-white">Phone Link</strong> or{" "}
                <strong className="text-white">Mac Continuity</strong>, we must construct a{" "}
                <strong className="text-blue-400">Virtual Audio Bridge</strong>.
              </p>

              <div className="bg-[#050505] p-7 rounded-[1.5rem] border border-amber-500/20 mb-10 relative overflow-hidden group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 blur-xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="flex gap-5 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <ShieldAlert className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base mb-2">
                      Why can't this be automatic?
                    </h4>
                    <p className="text-[14px] text-gray-400 leading-relaxed">
                      Virtual audio cables are{" "}
                      <strong className="text-amber-300">kernel-level hardware drivers</strong>.
                      Modern operating systems require manual installation of kernel drivers for
                      security reasons. You install the trusted driver once, and the bridge is
                      permanent.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-auto justify-end">
                <button
                  onClick={handleSkip}
                  className="px-8 py-4 bg-white/10 text-white hover:bg-white/20 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border border-white/20"
                >
                  Skip — Use VoIP Only <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                >
                  Continue Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Download */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
                Download Official Virtual Cable
              </h2>
              <p className="text-gray-400 text-base mb-10 max-w-xl">
                Install one of the industry-standard, officially signed audio drivers below for your
                OS.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-[#050505] p-8 rounded-[1.5rem] border border-white/[0.05] flex flex-col items-center text-center group hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/5 to-transparent blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 relative z-10 shadow-lg">
                    <span className="text-3xl">🪟</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 relative z-10">Windows PC</h3>
                  <p className="text-sm text-gray-500 mb-6 relative z-10 leading-relaxed">
                    Download the official VB-Cable setup. Extract and run as Administrator.
                  </p>
                  <button
                    onClick={() => openDownloadLink("win")}
                    className="w-full py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 relative z-10"
                  >
                    <Download className="w-4 h-4" /> Get VB-Cable
                  </button>
                </div>

                <div className="bg-[#050505] p-8 rounded-[1.5rem] border border-white/[0.05] flex flex-col items-center text-center group hover:border-gray-400/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -inset-1 bg-gradient-to-b from-white/5 to-transparent blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 relative z-10 shadow-lg">
                    <span className="text-3xl">🍎</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 relative z-10">macOS</h3>
                  <p className="text-sm text-gray-500 mb-6 relative z-10 leading-relaxed">
                    Download the official BlackHole 2ch installer. Follow the macOS prompt.
                  </p>
                  <button
                    onClick={() => openDownloadLink("mac")}
                    className="w-full py-3 bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 relative z-10"
                  >
                    <Download className="w-4 h-4" /> Get BlackHole
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-auto justify-end">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-xl text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5"
                >
                  Skip this step
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl text-gray-500 hover:text-white transition-colors text-sm font-medium hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                >
                  I've Installed It <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Hardware Verification */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
                Connect the Bridge
              </h2>
              <p className="text-gray-400 text-base mb-8 max-w-xl">
                Configure OpenCloser to route audio through your newly installed Virtual Cable.
              </p>

              {!permissionGranted ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-8 rounded-[1.5rem] flex flex-col items-center text-center mb-8 relative overflow-hidden group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl pointer-events-none opacity-50"></div>
                  <div className="relative mb-5 z-10">
                    <div className="absolute -inset-3 bg-emerald-500/20 rounded-full blur-md animate-pulse"></div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative z-10 glow-emerald">
                      <Mic className="w-8 h-8" />
                    </div>
                  </div>
                  <h4 className="font-bold text-lg mb-2 relative z-10">
                    Microphone Access Required
                  </h4>
                  <p className="text-sm opacity-80 mb-5 relative z-10 max-w-sm">
                    We need temporary microphone access to read the names of your installed Virtual
                    Cables.
                  </p>
                  <button
                    onClick={requestPermissionsAndEnumerate}
                    className="px-8 py-3 bg-emerald-500 text-emerald-950 font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 relative z-10"
                  >
                    Grant Access
                  </button>
                </div>
              ) : (
                <div className="space-y-6 mb-8">
                  <div className="bg-[#050505] p-6 rounded-[1.5rem] border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-colors duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <label className="flex items-center gap-3 text-sm font-bold text-emerald-400 mb-3 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      AI Voice Output (Speaker)
                    </label>
                    <p className="text-xs text-gray-500 mb-4 relative z-10">
                      Select "CABLE Input" or "BlackHole 2ch". The AI will play its voice into this
                      cable.
                    </p>
                    <div className="relative z-10">
                      <select
                        value={selectedSpeaker}
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 transition-premium appearance-none"
                      >
                        <option value="">Select Virtual Output...</option>
                        {speakers.map((s) => (
                          <option key={s.deviceId} value={s.deviceId}>
                            {s.label || `Speaker ${s.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#050505] p-6 rounded-[1.5rem] border border-blue-500/20 relative overflow-hidden group hover:border-blue-500/40 transition-colors duration-300">
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <label className="flex items-center gap-3 text-sm font-bold text-blue-400 mb-3 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      AI Ear Input (Microphone)
                    </label>
                    <p className="text-xs text-gray-500 mb-4 relative z-10">
                      Select "CABLE Output" or "BlackHole 2ch". The AI will listen to the prospect
                      here.
                    </p>
                    <div className="relative z-10">
                      <select
                        value={selectedMic}
                        onChange={(e) => setSelectedMic(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 transition-premium appearance-none"
                      >
                        <option value="">Select Virtual Input...</option>
                        {mics.map((m) => (
                          <option key={m.deviceId} value={m.deviceId}>
                            {m.label || `Mic ${m.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[13px] text-gray-300 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.05]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span>
                      Finally, set your Phone Link app to use these exact same cables as its
                      Microphone and Speaker.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-auto justify-end">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-xl text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl text-gray-500 hover:text-white transition-colors text-sm font-medium hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" /> Finalize Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
