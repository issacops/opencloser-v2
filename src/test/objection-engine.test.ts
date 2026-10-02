import { describe, it, expect } from "vitest";
import {
  detectObjection,
  detectObjectionInTranscript,
} from "../features/voice/lib/objection-engine";

describe("objection-engine", () => {
  describe("detectObjection", () => {
    it("detects price objection", () => {
      const result = detectObjection("This is way too expensive for our budget");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("price");
      expect(result!.label).toBe("Price Objection");
      expect(result!.urgency).toBe("high");
    });

    it("detects timing objection", () => {
      const result = detectObjection("This is not the right time for us to switch");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("timing");
    });

    it("detects trust objection", () => {
      const result = detectObjection("I've never heard of you. Who are you exactly?");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("trust");
    });

    it("detects authority objection", () => {
      const result = detectObjection("I need to check with my boss before making any decisions");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("authority");
    });

    it("detects status quo objection", () => {
      const result = detectObjection("We're fine, happy with what we have now");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("inertia");
    });

    it("detects competitor objection", () => {
      const result = detectObjection("We already use a competitor for this");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("competitor");
    });

    it("detects technical objection", () => {
      const result = detectObjection("How does this integrate with our existing API?");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("technical");
    });

    it("detects ROI objection", () => {
      const result = detectObjection("I can't see the value. What's the ROI?");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("roi");
    });

    it("detects no-pain objection", () => {
      const result = detectObjection("Things are good, don't have that problem");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("no_pain");
    });

    it("detects wrong-fit objection", () => {
      const result = detectObjection("This doesn't apply to our industry");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("wrong_fit");
    });

    it("detects gatekeeper objection", () => {
      const result = detectObjection("I'll forward your details to the right person");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("gatekeeper");
    });

    it("detects voicemail", () => {
      const result = detectObjection("Please leave a message after the tone");
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("voicemail");
    });

    it("returns null for normal conversation", () => {
      const result = detectObjection("That sounds really interesting, tell me more");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = detectObjection("");
      expect(result).toBeNull();
    });
  });

  describe("detectObjectionInTranscript", () => {
    it("detects objection in recent prospect messages", () => {
      const entries = [
        { role: "model", text: "Hello, how are you?" },
        { role: "user", text: "This is too expensive for us" },
      ];
      const result = detectObjectionInTranscript(entries);
      expect(result).not.toBeNull();
      expect(result!.archetype).toBe("price");
    });

    it("only checks user/prospect lines", () => {
      const entries = [{ role: "model", text: "This is way too expensive" }];
      const result = detectObjectionInTranscript(entries);
      expect(result).toBeNull();
    });

    it("returns null when no objection found", () => {
      const entries = [
        { role: "user", text: "That sounds good" },
        { role: "user", text: "Tell me more" },
      ];
      const result = detectObjectionInTranscript(entries);
      expect(result).toBeNull();
    });
  });
});
