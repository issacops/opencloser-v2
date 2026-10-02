// Audio helpers for the Twilio phone-line bridge (PCM16 base64 ↔ Float32).

export function decodePcm16Base64(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
}

export function toFloat32(int16: Int16Array): Float32Array {
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    out[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return out;
}

/** Linear-interpolation resampler for mono Float32 audio. */
export function resampleLinearFloat32(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = input[Math.min(idx, input.length - 1)];
    const s1 = input[Math.min(idx + 1, input.length - 1)];
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

/** Twilio wire audio (PCM16 base64 @ fromRate) → engine input Float32 @ toRate. */
export function phoneAudioToEngineInput(
  pcm16Base64: string,
  fromRate: number,
  toRate: number,
): Float32Array {
  const int16 = decodePcm16Base64(pcm16Base64);
  const float32 = toFloat32(int16);
  return resampleLinearFloat32(float32, fromRate, toRate);
}
