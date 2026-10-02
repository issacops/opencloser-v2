// ============================================================
// Emotion Engine — Real-Time 5-Axis Emotional Intelligence
// Analyzes prospect transcript patterns and recommends
// dynamic adjustments to the AI's emotional modulation axes.
// ============================================================

export interface EmotionAxes {
  empathy: number; // 0–100: 0=Assertive, 100=Highly Empathetic
  energy: number; // 0–100: 0=Calm/Slow, 100=High-Octane/Urgent
  formality: number; // 0–100: 0=Super Casual, 100=Strictly Professional
  assertiveness: number; // 0–100: 0=Collaborative/Soft, 100=Pushing/Closing
  humor: number; // 0–100: 0=None, 100=Light banter/rapport
}

export interface EmotionShift {
  axis: keyof EmotionAxes;
  direction: "up" | "down";
  reason: string;
  delta: number;
}

export interface EmotionAnalysis {
  axes: EmotionAxes;
  shifts: EmotionShift[];
  dominantMood: string;
  recommendation: string;
}

// Prospect sentiment signals
const FRUSTRATION_SIGNALS = [
  "frustrated",
  "annoying",
  "waste of time",
  "already told you",
  "not listening",
  "confused",
  "don't understand",
  "why would i",
  "just stop",
  "no thanks",
  "hang on",
];
const EXCITEMENT_SIGNALS = [
  "that's great",
  "love it",
  "sounds good",
  "interested",
  "tell me more",
  "how soon",
  "when can we",
  "perfect",
  "exactly what",
  "makes sense",
];
const STALLING_SIGNALS = [
  "maybe",
  "think about it",
  "let me think",
  "not sure",
  "we'll see",
  "possibly",
  "could be",
  "perhaps",
  "down the road",
  "eventually",
];
const BUYING_SIGNALS = [
  "next steps",
  "how do we get started",
  "sign up",
  "pricing",
  "contract",
  "how soon",
  "implementation",
  "onboard",
  "start date",
  "move forward",
];
const HOSTILE_SIGNALS = [
  "not interested",
  "remove me",
  "don't call again",
  "stop calling",
  "soliciting",
  "take me off",
  "hang up",
];
const SHORT_REPLY_THRESHOLD = 6; // words — indicates disengagement

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function detectSignals(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

export function analyzeEmotions(
  transcript: { role: string; text: string }[],
  baseAxes: EmotionAxes,
): EmotionAnalysis {
  const axes: EmotionAxes = { ...baseAxes };
  const shifts: EmotionShift[] = [];

  const prospectEntries = transcript.filter((e) => e.role === "user").slice(-5); // last 5 prospect messages

  if (prospectEntries.length === 0) {
    return {
      axes,
      shifts: [],
      dominantMood: "Neutral",
      recommendation:
        "Establish rapport. Use the prospect's name and ask an open-ended situation question.",
    };
  }

  const combinedText = prospectEntries.map((e) => e.text).join(" ");
  const avgWords =
    prospectEntries.reduce((s, e) => s + countWords(e.text), 0) / prospectEntries.length;

  // ── Frustration Detection ──────────────────────────────
  if (detectSignals(combinedText, FRUSTRATION_SIGNALS)) {
    if (axes.empathy < 90) {
      const delta = Math.min(20, 90 - axes.empathy);
      axes.empathy += delta;
      shifts.push({
        axis: "empathy",
        direction: "up",
        reason: "Frustration signal detected",
        delta,
      });
    }
    if (axes.energy > 40) {
      const delta = Math.min(25, axes.energy - 40);
      axes.energy -= delta;
      shifts.push({
        axis: "energy",
        direction: "down",
        reason: "Cooling energy to reduce pressure",
        delta,
      });
    }
    if (axes.assertiveness > 30) {
      const delta = Math.min(20, axes.assertiveness - 30);
      axes.assertiveness -= delta;
      shifts.push({
        axis: "assertiveness",
        direction: "down",
        reason: "Backing off to rebuild trust",
        delta,
      });
    }
  }

  // ── Excitement Detection ───────────────────────────────
  if (detectSignals(combinedText, EXCITEMENT_SIGNALS)) {
    if (axes.energy < 85) {
      const delta = Math.min(20, 85 - axes.energy);
      axes.energy += delta;
      shifts.push({
        axis: "energy",
        direction: "up",
        reason: "Prospect excitement — matching energy",
        delta,
      });
    }
    if (axes.humor < 50) {
      const delta = Math.min(15, 50 - axes.humor);
      axes.humor += delta;
      shifts.push({
        axis: "humor",
        direction: "up",
        reason: "Good rapport moment — light humor unlocked",
        delta,
      });
    }
  }

  // ── Buying Signals ─────────────────────────────────────
  if (detectSignals(combinedText, BUYING_SIGNALS)) {
    if (axes.assertiveness < 75) {
      const delta = Math.min(20, 75 - axes.assertiveness);
      axes.assertiveness += delta;
      shifts.push({
        axis: "assertiveness",
        direction: "up",
        reason: "Buying signal — moving toward close",
        delta,
      });
    }
    if (axes.energy < 75) {
      const delta = Math.min(15, 75 - axes.energy);
      axes.energy += delta;
      shifts.push({
        axis: "energy",
        direction: "up",
        reason: "Prospect interest — increase urgency gently",
        delta,
      });
    }
  }

  // ── Stalling / Hesitation ─────────────────────────────
  if (detectSignals(combinedText, STALLING_SIGNALS)) {
    if (axes.assertiveness < 65) {
      const delta = Math.min(15, 65 - axes.assertiveness);
      axes.assertiveness += delta;
      shifts.push({
        axis: "assertiveness",
        direction: "up",
        reason: "Stalling detected — nudge toward commitment",
        delta,
      });
    }
  }

  // ── Short / Disengaged Replies ────────────────────────
  if (avgWords < SHORT_REPLY_THRESHOLD && prospectEntries.length >= 2) {
    if (axes.empathy < 80) {
      const delta = Math.min(10, 80 - axes.empathy);
      axes.empathy += delta;
      shifts.push({
        axis: "empathy",
        direction: "up",
        reason: "Short replies — re-engage with empathy",
        delta,
      });
    }
    if (axes.energy > 50) {
      const delta = Math.min(20, axes.energy - 50);
      axes.energy -= delta;
      shifts.push({
        axis: "energy",
        direction: "down",
        reason: "Short replies — slow down and listen more",
        delta,
      });
    }
  }

  // ── Hostile ───────────────────────────────────────────
  if (detectSignals(combinedText, HOSTILE_SIGNALS)) {
    axes.assertiveness = Math.max(10, axes.assertiveness - 40);
    shifts.push({
      axis: "assertiveness",
      direction: "down",
      reason: "Hostile — de-escalate immediately",
      delta: 40,
    });
  }

  // ── Determine dominant mood ────────────────────────────
  let dominantMood = "Neutral";
  let recommendation = "Continue discovery. Ask one probing question at a time.";

  if (detectSignals(combinedText, HOSTILE_SIGNALS)) {
    dominantMood = "Hostile";
    recommendation =
      "Acknowledge their discomfort. Offer to end the call respectfully. Do NOT push.";
  } else if (detectSignals(combinedText, FRUSTRATION_SIGNALS)) {
    dominantMood = "Frustrated";
    recommendation = "Slow down. Acknowledge their frustration before anything else. Validate.";
  } else if (detectSignals(combinedText, BUYING_SIGNALS)) {
    dominantMood = "Buying";
    recommendation = "CLOSE NOW. Summarize value, ask for commitment. Don't over-explain.";
  } else if (detectSignals(combinedText, EXCITEMENT_SIGNALS)) {
    dominantMood = "Interested";
    recommendation = "Keep momentum. Anchor a specific next step while interest is high.";
  } else if (detectSignals(combinedText, STALLING_SIGNALS)) {
    dominantMood = "Hesitant";
    recommendation =
      "Uncover the real hesitation. Ask: 'What would need to be true for this to make sense?'";
  } else if (avgWords < SHORT_REPLY_THRESHOLD) {
    dominantMood = "Disengaged";
    recommendation =
      "Re-engage. Ask a yes/no question first, then open-ended to get them talking again.";
  }

  return { axes, shifts, dominantMood, recommendation };
}

export function buildEmotionSystemPrompt(
  axes: EmotionAxes,
  speechPatterns: {
    useFillers: boolean;
    useMirroring: boolean;
    useStrategicSilence: boolean;
    nameDropFrequency: "never" | "low" | "medium" | "high";
  },
): string {
  const lines: string[] = [];

  lines.push("=== EMOTIONAL INTELLIGENCE MATRIX ===");
  lines.push(
    `Empathy Level (${axes.empathy}/100): ${
      axes.empathy > 75
        ? "Listen with extreme depth. Validate feelings before responding. Say 'I hear you' and 'that makes total sense'."
        : axes.empathy > 40
          ? "Balance understanding with momentum. Acknowledge briefly, then move forward."
          : "Keep emotional distance. Be direct and solution-focused. Don't dwell on feelings."
    }`,
  );

  lines.push(
    `Energy Level (${axes.energy}/100): ${
      axes.energy > 75
        ? "Speak with high enthusiasm and urgency. Use words like 'exciting', 'massive', 'game-changer'. Keep pace fast."
        : axes.energy > 40
          ? "Moderate energy. Confident and warm. Avoid sounding flat."
          : "Slow, calm, deliberate pace. Methodical. Let silence breathe between points."
    }`,
  );

  lines.push(
    `Formality (${axes.formality}/100): ${
      axes.formality > 75
        ? "Use highly professional vocabulary. No contractions. No slang. CEO energy."
        : axes.formality > 40
          ? "Conversational but professional. Feel like a trusted advisor."
          : "Casual and relatable. Use contractions, colloquialisms. Sound like a knowledgeable friend."
    }`,
  );

  lines.push(
    `Assertiveness (${axes.assertiveness}/100): ${
      axes.assertiveness > 75
        ? "Be direct. Push past vague answers. Don't accept 'maybe'. Drive toward a clear yes or no."
        : axes.assertiveness > 40
          ? "Collaborative but purposeful. Guide the conversation toward a decision point."
          : "Soft and exploratory. Leave space. Never pressure. Let them lead."
    }`,
  );

  lines.push(
    `Humor (${axes.humor}/100): ${
      axes.humor > 60
        ? "Use light wit to build rapport. A brief laugh or self-aware comment is encouraged when appropriate."
        : "Keep it professional. Avoid humor unless they initiate it."
    }`,
  );

  lines.push("\n=== SPEECH PATTERN RULES ===");

  if (speechPatterns.useFillers) {
    lines.push(
      "• Natural disfluencies: Occasionally use 'you know', 'right', 'I mean', 'totally', 'honestly'. Do NOT overuse — once every 4–5 sentences max.",
    );
  }
  if (speechPatterns.useMirroring) {
    lines.push(
      "• Active mirroring: Repeat the last 2–3 key words the prospect says before responding. E.g., Prospect: 'We care a lot about speed.' → You: 'Speed — absolutely. That's exactly what...'",
    );
  }
  if (speechPatterns.useStrategicSilence) {
    lines.push(
      "• Strategic silence: After the prospect raises an objection, do NOT respond immediately. Pause (~2s of silence), then respond. Never rush to fill silence.",
    );
  }

  const nameRules = {
    never: "",
    low: "• Name usage: Use the prospect's first name once at the start and once near the close.",
    medium:
      "• Name usage: Use the prospect's first name naturally every 4–5 turns to personalize the conversation.",
    high: "• Name usage: Use the prospect's first name frequently — approximately every 2–3 turns. Creates strong personal connection.",
  };
  if (nameRules[speechPatterns.nameDropFrequency]) {
    lines.push(nameRules[speechPatterns.nameDropFrequency]);
  }

  lines.push(
    "• Thinking pauses: Occasionally say 'That's a good point — give me a sec to think about that.' This sounds genuinely human.",
  );
  lines.push(
    "• NEVER sound like you're reading a script. Vary your sentence structure. Start some sentences with 'Look,' or 'Here's the thing —' or 'Honestly,'.",
  );
  lines.push(
    "• NEVER fabricate statistics, case studies, percentages, or competitor claims not provided in your briefing data.",
  );

  return lines.join("\n");
}
