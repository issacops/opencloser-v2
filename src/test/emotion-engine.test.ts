import { describe, it, expect } from "vitest";
import { analyzeEmotions, buildEmotionSystemPrompt } from "../features/voice/lib/emotion-engine";
import type { EmotionAxes } from "../features/voice/lib/emotion-engine";

const baseAxes: EmotionAxes = {
  empathy: 70,
  energy: 60,
  formality: 55,
  assertiveness: 45,
  humor: 35,
};

describe("emotion-engine", () => {
  describe("analyzeEmotions", () => {
    it("returns neutral for empty transcript", () => {
      const result = analyzeEmotions([], baseAxes);
      expect(result.dominantMood).toBe("Neutral");
      expect(result.shifts).toHaveLength(0);
    });

    it("detects frustration and adjusts empathy up, energy down", () => {
      const transcript = [
        { role: "user", text: "I'm frustrated, you're not listening to what I'm saying" },
        { role: "user", text: "This is a waste of time" },
      ];
      const result = analyzeEmotions(transcript, { ...baseAxes, energy: 70, assertiveness: 60 });
      expect(result.dominantMood).toBe("Frustrated");
      expect(result.axes.empathy).toBeGreaterThan(baseAxes.empathy);
      expect(result.axes.energy).toBeLessThan(70);
      expect(result.shifts.length).toBeGreaterThan(0);
    });

    it("detects excitement and increases energy", () => {
      const transcript = [
        { role: "user", text: "That's great! I love it. Tell me more about this" },
      ];
      const result = analyzeEmotions(transcript, { ...baseAxes, energy: 50, humor: 20 });
      expect(result.dominantMood).toBe("Interested");
      expect(result.axes.energy).toBeGreaterThan(50);
    });

    it("detects buying signals and increases assertiveness", () => {
      const transcript = [
        { role: "user", text: "What are the next steps? How do we get started with the contract?" },
      ];
      const result = analyzeEmotions(transcript, { ...baseAxes, assertiveness: 30 });
      expect(result.dominantMood).toBe("Buying");
      expect(result.axes.assertiveness).toBeGreaterThan(30);
    });

    it("detects stalling signals", () => {
      const transcript = [
        { role: "user", text: "Hmm, maybe. Let me think about it and we'll see" },
      ];
      const result = analyzeEmotions(transcript, { ...baseAxes, assertiveness: 30 });
      expect(result.dominantMood).toBe("Hesitant");
      expect(result.axes.assertiveness).toBeGreaterThan(30);
    });

    it("detects hostile signals and drops assertiveness drastically", () => {
      const transcript = [
        {
          role: "user",
          text: "Stop calling me, I'm not interested. Take me off your list right now.",
        },
      ];
      const result = analyzeEmotions(transcript, { ...baseAxes, assertiveness: 70 });
      expect(result.dominantMood).toBe("Hostile");
      expect(result.axes.assertiveness).toBeLessThan(40);
    });

    it("detects short replies as disengagement", () => {
      const transcript = [
        { role: "user", text: "ok" },
        { role: "user", text: "sure" },
      ];
      const result = analyzeEmotions(transcript, baseAxes);
      expect(result.dominantMood).toBe("Disengaged");
      expect(result.axes.empathy).toBeGreaterThan(baseAxes.empathy);
    });
  });

  describe("buildEmotionSystemPrompt", () => {
    it("builds a valid system prompt", () => {
      const prompt = buildEmotionSystemPrompt(baseAxes, {
        useFillers: true,
        useMirroring: true,
        useStrategicSilence: false,
        nameDropFrequency: "medium",
      });
      expect(prompt).toContain("EMOTIONAL INTELLIGENCE MATRIX");
      expect(prompt).toContain("SPEECH PATTERN RULES");
      expect(prompt).not.toContain("Strategic silence");
    });

    it("includes name drop rules for medium frequency", () => {
      const prompt = buildEmotionSystemPrompt(baseAxes, {
        useFillers: false,
        useMirroring: false,
        useStrategicSilence: false,
        nameDropFrequency: "medium",
      });
      expect(prompt).toContain("Name usage");
    });

    it("excludes name rules for never", () => {
      const prompt = buildEmotionSystemPrompt(baseAxes, {
        useFillers: false,
        useMirroring: false,
        useStrategicSilence: false,
        nameDropFrequency: "never",
      });
      expect(prompt).not.toContain("Name usage");
    });
  });
});
