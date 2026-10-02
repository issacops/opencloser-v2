// ============================================================
// Objection Detection + Coaching Engine
// Scans transcript for the 12 sales objection archetypes.
// Outputs: detected archetype + playbook counter-script.
// ============================================================

type ObjectionArchetype =
  | "price"
  | "timing"
  | "trust"
  | "authority"
  | "inertia"
  | "competitor"
  | "technical"
  | "roi"
  | "no_pain"
  | "wrong_fit"
  | "gatekeeper"
  | "voicemail";

export interface ObjectionMatch {
  archetype: ObjectionArchetype;
  label: string;
  emoji: string;
  trigger: string; // the phrase that triggered detection
  counterScript: string;
  framework: string; // e.g. "Feel-Felt-Found"
  urgency: "low" | "medium" | "high";
}

const OBJECTION_MAP: {
  archetype: ObjectionArchetype;
  label: string;
  emoji: string;
  triggers: string[];
  counterScript: string;
  framework: string;
  urgency: "low" | "medium" | "high";
}[] = [
  {
    archetype: "price",
    label: "Price Objection",
    emoji: "💰",
    triggers: [
      "too expensive",
      "can't afford",
      "no budget",
      "budget",
      "costs too much",
      "price",
      "pricey",
      "out of our range",
      "quote",
      "cheaper",
    ],
    counterScript:
      "I totally understand — budget is always a real consideration. A lot of our clients felt the same way at first. What they found was that the cost of NOT solving [pain point] was actually higher. Can I walk you through how our [outcome] typically pays for itself within [timeframe]?",
    framework: "Feel-Felt-Found → ROI Reframe",
    urgency: "high",
  },
  {
    archetype: "timing",
    label: "Timing Objection",
    emoji: "⏰",
    triggers: [
      "not now",
      "not the right time",
      "maybe later",
      "bad time",
      "call me back",
      "next quarter",
      "not ready",
      "too soon",
      "wait",
      "year end",
    ],
    counterScript:
      "Completely fair — timing is everything. Just so I understand, is it more about bandwidth right now, or is there a specific trigger you're waiting for? I ask because a lot of teams push this to 'later' and then find themselves fighting fires 6 months from now without a solution in place.",
    framework: "Future-Pace + Urgency Probe",
    urgency: "high",
  },
  {
    archetype: "trust",
    label: "Trust / Credibility Objection",
    emoji: "🤝",
    triggers: [
      "never heard of you",
      "prove it",
      "who are you",
      "how do I know",
      "don't trust",
      "small company",
      "not sure about you",
      "reputation",
    ],
    counterScript:
      "That's a fair question — you should absolutely vet who you work with. What would help you feel more confident? I can share how we've worked with [similar company type] and what those results looked like. We also offer a risk-free [trial/pilot] so you can see the value firsthand.",
    framework: "Social Proof + Risk Reversal",
    urgency: "medium",
  },
  {
    archetype: "authority",
    label: "Authority / Decision Maker",
    emoji: "👔",
    triggers: [
      "not my decision",
      "need to check",
      "need to ask",
      "have to talk to",
      "my boss",
      "my manager",
      "committee",
      "approval",
      "board",
      "sign off",
    ],
    counterScript:
      "Of course — I'd expect a decision like this to involve the right people. Who would be the key stakeholders? And if what we're discussing makes sense to you, would you be comfortable introducing me so I can answer their specific questions directly?",
    framework: "Champion-Building Question",
    urgency: "medium",
  },
  {
    archetype: "inertia",
    label: "Status Quo Objection",
    emoji: "😴",
    triggers: [
      "we're fine",
      "no problem",
      "doing okay",
      "works for us",
      "happy with what we have",
      "not looking",
      "no need",
      "satisfied",
      "current solution",
    ],
    counterScript:
      "That's great to hear — things working well is the best foundation. I'm curious though: when you look at [target metric] for next year, are you tracking to hit where you want to be? Most teams I talk to that are 'doing fine' are actually leaving significant performance on the table without knowing it.",
    framework: "Gap + Implication Drill-Down",
    urgency: "medium",
  },
  {
    archetype: "competitor",
    label: "Competitor Objection",
    emoji: "⚔️",
    triggers: [
      "already use",
      "we have",
      "using competitor",
      "locked in",
      "contract with",
      "we're with",
      "switched to",
    ],
    counterScript:
      "Got it — so you're already in that space. I'm not here to bad-mouth anyone. What I'd be curious about is: what do you wish [competitor] did better? Because that gap is usually exactly where we come in for teams making a switch.",
    framework: "Curiosity-Led Differentiation",
    urgency: "medium",
  },
  {
    archetype: "technical",
    label: "Technical / How It Works",
    emoji: "🔧",
    triggers: [
      "how does it work",
      "technical details",
      "integration",
      "api",
      "how does this integrate",
      "can it connect",
      "setup",
      "implementation",
      "compatible",
    ],
    counterScript:
      "Great question — and I want to make sure I give you a real answer, not a feature dump. What's the outcome you're trying to achieve? Once I understand that, I can explain exactly which parts of our system solve that specific piece. Our team handles integrations in [timeframe] on average.",
    framework: "Outcome-First Pivot",
    urgency: "low",
  },
  {
    archetype: "roi",
    label: "ROI / Value Objection",
    emoji: "📊",
    triggers: [
      "can't see value",
      "not sure it's worth it",
      "what's the roi",
      "prove the value",
      "show me the numbers",
      "return on investment",
      "hard to justify",
    ],
    counterScript:
      "Totally fair to ask for that. Let me make it concrete: if we could help you [specific outcome], what would that be worth to your business in a year? Because that's the anchor point. Most clients see [X] within [timeframe] — and I can show you exactly how we get there.",
    framework: "Quantified Pain Projection",
    urgency: "high",
  },
  {
    archetype: "no_pain",
    label: "No Perceived Pain",
    emoji: "🛡️",
    triggers: [
      "things are good",
      "no issues",
      "running smoothly",
      "don't have that problem",
      "no challenges",
      "all good",
      "not a priority",
    ],
    counterScript:
      "Great to hear — and I don't want to manufacture a problem that isn't there. Let me ask a different way: if you could improve one thing about [process] in the next 6 months, what would it be? Even teams running well usually have one area they'd love to be 20% better at.",
    framework: "Reframe Current Risk + Vision Question",
    urgency: "low",
  },
  {
    archetype: "wrong_fit",
    label: "Wrong Fit",
    emoji: "🎯",
    triggers: [
      "not relevant",
      "doesn't apply",
      "different industry",
      "different use case",
      "not for us",
      "not applicable",
      "we're not the right",
    ],
    counterScript:
      "I appreciate the directness. Help me understand — what specifically feels like it doesn't map? I want to make sure I'm not forcing a square peg into a round hole. And honestly, if it's truly not a fit, I'd rather know now and respect your time.",
    framework: "Re-Qualify or Graceful Release",
    urgency: "low",
  },
  {
    archetype: "gatekeeper",
    label: "Gatekeeper",
    emoji: "🚪",
    triggers: [
      "pass it along",
      "i'll forward",
      "send an email",
      "send some info",
      "forward your details",
      "leave your number",
      "not the right person",
      "try someone else",
    ],
    counterScript:
      "I appreciate that — and I don't want to make your life harder. Could I ask: if this turned out to be something genuinely valuable for the team, who would be the person most excited to see it? I'd love to make sure the right information gets to the right hands.",
    framework: "Polite Redirect + Calendar Close",
    urgency: "medium",
  },
  {
    archetype: "voicemail",
    label: "Voicemail Detected",
    emoji: "📬",
    triggers: ["leave a message", "not available", "voicemail", "after the tone"],
    counterScript:
      "Hi [Name], this is [Agent] calling about [one specific thing]. Quick 3-minute conversation could be worth [outcome] for [Company]. Call me back at [number], or I'll try you again [tomorrow/specific time]. Looking forward to connecting.",
    framework: "15-Second VM Script",
    urgency: "low",
  },
];

export function detectObjection(text: string): ObjectionMatch | null {
  const lower = text.toLowerCase();
  for (const obj of OBJECTION_MAP) {
    for (const trigger of obj.triggers) {
      if (lower.includes(trigger)) {
        return {
          archetype: obj.archetype,
          label: obj.label,
          emoji: obj.emoji,
          trigger: trigger,
          counterScript: obj.counterScript,
          framework: obj.framework,
          urgency: obj.urgency,
        };
      }
    }
  }
  return null;
}

export function detectObjectionInTranscript(
  entries: { role: string; text: string }[],
): ObjectionMatch | null {
  // Only check prospect/user lines, last 3 entries
  const recentProspect = entries.filter((e) => e.role === "user").slice(-3);

  for (const entry of recentProspect.reverse()) {
    const match = detectObjection(entry.text);
    if (match) return match;
  }
  return null;
}
