import type { CallState, TranscriptLine } from "../../lib/caller-engine";
import { AIPersona, DEFAULT_PERSONA } from "../../../../types/persona";

export function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60),
    s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getCallPhase(
  callState: CallState,
  transcriptLength: number,
): { label: string; color: string } {
  if (callState === "objection_mode") return { label: "⚡ Objection", color: "text-orange-400" };
  if (callState === "closing") return { label: "🏁 Closing", color: "text-amber-400" };
  const n = transcriptLength;
  if (n === 0) return { label: "Connecting", color: "text-yellow-400" };
  if (n < 4) return { label: "Opening", color: "text-blue-400" };
  if (n < 8) return { label: "Discovery", color: "text-purple-400" };
  if (n < 12) return { label: "Pitch", color: "text-emerald-400" };
  return { label: "🏁 Close", color: "text-amber-400" };
}

export function getCoachingHints(transcript: TranscriptLine[], elapsedSeconds: number): string[] {
  const hints: string[] = [];
  const n = transcript.length;
  const userMsgs = transcript.filter((t) => t.role === "user").length;
  const aiMsgs = transcript.filter((t) => t.role === "model").length;
  const personaLocal: AIPersona = (() => {
    try {
      const s = localStorage.getItem("ai_persona");
      if (s) return JSON.parse(s);
    } catch {}
    return DEFAULT_PERSONA;
  })();

  if (n === 0) {
    hints.push("🎯 Opening: Build rapport fast. Mirror their energy.");
    return hints;
  }

  const fw = personaLocal.framework;
  if (n < 4) {
    if (fw === "SPIN Selling")
      hints.push(
        "📋 SPIN Situation: Ask about their current process. 'Walk me through how you currently handle X?'",
      );
    else if (fw === "Challenger Sale")
      hints.push(
        "💡 Challenger: Lead with an insight. Teach them something they don't know about their industry.",
      );
    else if (fw === "Sandler System")
      hints.push(
        "🤝 Sandler: Set an upfront contract. Agree on what happens at the end of this call.",
      );
    else
      hints.push(
        "⚡ Straight Line: Build certainty in yourself. Be warm, bold, and confident from the first line.",
      );
  } else if (n < 8) {
    if (fw === "SPIN Selling")
      hints.push(
        "🔍 SPIN Problem: Probe for pain. 'What's the biggest challenge you have with X right now?'",
      );
    else if (fw === "Challenger Sale")
      hints.push("🎯 Challenger: Reframe. Connect your insight to their specific pain.");
    else if (fw === "Sandler System")
      hints.push(
        "💰 Sandler: Qualify budget. 'If we solved this, do you have budget set aside to move on this?'",
      );
    else
      hints.push(
        "🚀 Straight Line: Build certainty in the product. Use vivid, outcome-focused language.",
      );
  } else if (n < 12) {
    if (fw === "SPIN Selling")
      hints.push(
        "📈 SPIN Implication: Amplify the pain. 'If this doesn't change, what does that mean for the business in 12 months?'",
      );
    else
      hints.push(
        "🎁 Present the solution. Tie every feature back to the pain they told you about.",
      );
  } else {
    hints.push(
      "🏁 Close Time: Ask for the meeting. 'Does what we've covered make sense to take to the next step?'",
    );
  }

  if (aiMsgs > userMsgs * 2 && n > 3)
    hints.push("⚠️ AI is talking too much. Ask a question and actually listen.");
  if (elapsedSeconds > 300) hints.push("⏱️ 5+ min call. Pivot to the close. Don't let it drift.");

  return hints;
}
