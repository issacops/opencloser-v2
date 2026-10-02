import { useCallback, useEffect, useRef, useState } from "react";
import {
  placeTwilioCall,
  endTwilioCall,
  sendTwilioAudio,
  onTwilioStreamStarted,
  onTwilioStreamStopped,
  onTwilioAudioIn,
  type PlacedCall,
  type TwilioAudioIn,
  type TwilioStreamStarted,
} from "../../../../services/twilio.service";
import { phoneAudioToEngineInput } from "../../lib/phone-audio";

interface UsePhoneLineParams {
  leadPhone: string;
  leadId: string;
  isCallLive: boolean;
  sendEngineAudio: (audio: Float32Array) => void;
  getEngineSampleRate: () => number;
  setMicActive: (active: boolean) => void;
}

export interface PhoneLineApi {
  enabled: boolean;
  call: PlacedCall | null;
  streaming: boolean;
  error: string | null;
  lineRef: { current: PlacedCall | null };
  toggle: () => void;
  sendToLine: (pcm16Base64: string, sampleRate: number) => void;
  reset: () => void;
}

/**
 * Attaches the live AI call to a Twilio phone line: places the call (mock or
 * real), bridges AI audio out, feeds phone audio into the engine and silences
 * the local mic while attached.
 */
export function usePhoneLine(params: UsePhoneLineParams): PhoneLineApi {
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [enabled, setEnabled] = useState(false);
  const [call, setCall] = useState<PlacedCall | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabledRef = useRef(false);
  const lineRef = useRef<PlacedCall | null>(null);
  const busyRef = useRef(false);
  const unlistenersRef = useRef<Array<() => void>>([]);

  const unsubscribe = useCallback(() => {
    unlistenersRef.current.forEach((unlisten) => {
      try {
        unlisten();
      } catch {
        // listener already gone
      }
    });
    unlistenersRef.current = [];
    setStreaming(false);
  }, []);

  const subscribe = useCallback(async () => {
    const un1 = await onTwilioStreamStarted((_event: TwilioStreamStarted) => setStreaming(true));
    const un2 = await onTwilioStreamStopped(() => setStreaming(false));
    const un3 = await onTwilioAudioIn((payload: TwilioAudioIn) => {
      if (!lineRef.current) return;
      try {
        const audio = phoneAudioToEngineInput(
          payload.pcm16Base64,
          payload.sampleRate,
          paramsRef.current.getEngineSampleRate(),
        );
        paramsRef.current.sendEngineAudio(audio);
      } catch {
        // drop malformed frame
      }
    });
    unlistenersRef.current.push(un1, un2, un3);
  }, []);

  const detach = useCallback(() => {
    const line = lineRef.current;
    lineRef.current = null;
    enabledRef.current = false;
    setCall(null);
    setEnabled(false);
    setError(null);
    unsubscribe();
    paramsRef.current.setMicActive(false);
    if (line) {
      void endTwilioCall(line.callSid).catch(() => {});
    }
  }, [unsubscribe]);

  const attach = useCallback(async () => {
    if (lineRef.current || busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      const placed = await placeTwilioCall(paramsRef.current.leadPhone, paramsRef.current.leadId);
      lineRef.current = placed;
      setCall(placed);
      paramsRef.current.setMicActive(true);
      await subscribe();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      enabledRef.current = false;
      setEnabled(false);
    } finally {
      busyRef.current = false;
    }
  }, [subscribe]);

  // Arm/disarm: attach immediately on a live call, otherwise wait for one.
  const toggle = useCallback(() => {
    if (lineRef.current) {
      detach();
      return;
    }
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      return;
    }
    enabledRef.current = true;
    setEnabled(true);
    setError(null);
    if (paramsRef.current.isCallLive) void attach();
  }, [attach, detach]);

  // Follow call lifecycle: attach when armed call goes live, detach at end.
  useEffect(() => {
    if (params.isCallLive && enabledRef.current && !lineRef.current) {
      void attach();
    }
    if (!params.isCallLive && lineRef.current) {
      detach();
    }
  }, [params.isCallLive, attach, detach]);

  // Unmount: release listeners and end any placed line.
  useEffect(() => {
    return () => {
      unsubscribe();
      const line = lineRef.current;
      if (line) void endTwilioCall(line.callSid).catch(() => {});
    };
  }, [unsubscribe]);

  const sendToLine = useCallback((pcm16Base64: string, sampleRate: number) => {
    if (!lineRef.current) return;
    void sendTwilioAudio(pcm16Base64, sampleRate).catch(() => {});
  }, []);

  return {
    enabled,
    call,
    streaming,
    error,
    lineRef,
    toggle,
    sendToLine,
    reset: detach,
  };
}
