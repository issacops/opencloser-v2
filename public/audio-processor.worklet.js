/**
 * AudioWorklet Processor — Zero-Latency PCM Capture
 * Runs on a dedicated audio rendering thread (NOT the main JS thread).
 * Captures 128-sample frames and batches them into ~10ms packets.
 * Replaces the deprecated ScriptProcessorNode (~256ms latency).
 */
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Accumulate 2048 samples = ~128ms at 16kHz for efficient streaming
    // (small enough for perception of real-time, large enough to amortize IPC)
    this._buffer = new Float32Array(2048);
    this._bufferIndex = 0;
    this._muted = false;

    this.port.onmessage = (e) => {
      if (e.data.type === "setMuted") {
        this._muted = e.data.muted;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    if (this._muted) {
      // Send silence so VAD on server doesn't time out
      const silence = new Float32Array(channelData.length);
      this.port.postMessage({ type: "audio", buffer: silence }, [silence.buffer]);
      return true;
    }

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bufferIndex++] = channelData[i];

      if (this._bufferIndex >= this._buffer.length) {
        // Post a copy to the main thread (transfer ownership for zero-copy)
        const toSend = this._buffer.slice(0);
        this.port.postMessage({ type: "audio", buffer: toSend }, [toSend.buffer]);
        this._bufferIndex = 0;
      }
    }

    return true; // keep processor alive
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
