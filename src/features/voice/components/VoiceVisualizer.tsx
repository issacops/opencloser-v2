import { useRef, useEffect } from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  role: "agent" | "prospect";
  size?: number;
}

export function VoiceVisualizer({ isActive, analyser, role, size = 80 }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array>(new Uint8Array(64));
  const smoothedRef = useRef<Float32Array>(new Float32Array(48));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, size, size);

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataRef.current);
      } else {
        // Idle — organic pulse
        const t = Date.now() / 1000;
        for (let i = 0; i < dataRef.current.length; i++) {
          dataRef.current[i] = isActive
            ? 20 + Math.sin(t * 2 + i * 0.3) * 15
            : 4 + Math.sin(t * 0.8 + i * 0.5) * 3;
        }
      }

      const cx = size / 2;
      const cy = size / 2;
      const radius = (size / 2) * 0.36;
      const bars = 48;
      const data = dataRef.current;

      // Color definitions
      const isAgent = role === "agent";
      const primaryR = isAgent ? 99 : 16;
      const primaryG = isAgent ? 102 : 185;
      const primaryB = isAgent ? 241 : 129;

      // Smoothing
      for (let i = 0; i < bars; i++) {
        const dataIdx = Math.floor((i / bars) * data.length);
        const target = data[dataIdx] / 255;
        smoothedRef.current[i] += (target - smoothedRef.current[i]) * 0.15;
      }

      // 1. Outer breathing glow ring
      let ampSum = 0;
      for (let j = 0; j < 16; j++) ampSum += data[j];
      const avgAmp = ampSum / 16 / 255;
      const glowRadius = radius + 8 + avgAmp * 14;

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, radius - 2, cx, cy, glowRadius + 6);
      outerGlow.addColorStop(
        0,
        `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.15 : 0.05})`,
      );
      outerGlow.addColorStop(
        0.6,
        `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.06 : 0.02})`,
      );
      outerGlow.addColorStop(1, `rgba(${primaryR}, ${primaryG}, ${primaryB}, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius + 6, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // 2. Frequency bars in a circle with gradient
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const amp = smoothedRef.current[i] * (isActive ? 1 : 0.2);
        const barLen = radius * 0.3 * (0.3 + amp * 0.7) + 2;

        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + barLen);
        const y2 = cy + Math.sin(angle) * (radius + barLen);

        // Gradient per bar
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const alpha = 0.4 + amp * 0.6;
        grad.addColorStop(0, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${alpha * 0.6})`);
        grad.addColorStop(1, `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${alpha})`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = grad;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // 3. Center circle with subtle gradient fill
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      centerGrad.addColorStop(
        0,
        `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.12 : 0.04})`,
      );
      centerGrad.addColorStop(
        1,
        `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.04 : 0.01})`,
      );
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Center ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.35 : 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 4. Center icon dot
      const dotRadius = 3 + avgAmp * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${isActive ? 0.6 : 0.2})`;
      ctx.fill();
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyser, isActive, role, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}
