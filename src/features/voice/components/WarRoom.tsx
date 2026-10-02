import { Lead, ICP } from "../../../types";
import type { TranscriptLine } from "../lib/caller-engine";
import { SENTIMENT_CONFIG } from "./warroom/sentiment";
import { getCallPhase, getCoachingHints } from "./warroom/metrics";
import { WarRoomHeader } from "./warroom/WarRoomHeader";
import { TranscriptPanel } from "./warroom/TranscriptPanel";
import { IntelPanel } from "./warroom/IntelPanel";
import { useCallSession } from "./warroom/useCallSession";

interface WarRoomProps {
  lead: Lead;
  icp: ICP | null;
  onClose: (transcript?: TranscriptLine[], durationSeconds?: number) => void;
}

export function WarRoom({ lead, icp, onClose }: WarRoomProps) {
  const {
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
  } = useCallSession(lead, icp, onClose);

  const sentimentInfo = SENTIMENT_CONFIG[sentiment];
  const isCallLive =
    callState === "active" || callState === "objection_mode" || callState === "closing";

  const phase = getCallPhase(callState, transcript.length);
  const hints = getCoachingHints(transcript, elapsedSeconds);

  return (
    <div className="warroom-dark fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Ambient glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] pointer-events-none transition-colors duration-3000 ${
          isCallLive ? "bg-red-500/8" : "bg-indigo-500/5"
        }`}
      ></div>

      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[20px] w-full max-w-[1100px] h-[90vh] flex flex-col overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] relative z-10 animate-scale-in">
        <WarRoomHeader
          lead={lead}
          callState={callState}
          isCallLive={isCallLive}
          sentimentInfo={sentimentInfo}
          elapsedSeconds={elapsedSeconds}
          phase={phase}
          phoneLine={phoneLine}
          onEndCall={endCall}
        />

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          <TranscriptPanel
            isCallLive={isCallLive}
            callState={callState}
            sentiment={sentiment}
            error={error}
            transcript={transcript}
            audioContext={audioContextRef.current}
            outputAnalyser={outputAnalyserRef.current}
            prospectAnalyser={analyserRef.current}
          />
          <IntelPanel
            sentiment={sentiment}
            sentimentInfo={sentimentInfo}
            sentimentLabel={sentimentLabel}
            activeObjection={activeObjection}
            onDismissObjection={() => setActiveObjection(null)}
            hints={hints}
            currentAxes={currentAxes}
            recentShifts={recentShifts}
            transcript={transcript}
            objectionHistory={objectionHistory}
            usePhoneLink={usePhoneLink}
            onTogglePhoneLink={() => setUsePhoneLink((v) => !v)}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={endCall}
          />
        </div>
      </div>
    </div>
  );
}
