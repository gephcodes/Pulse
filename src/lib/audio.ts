/**
 * Helper to play 24kHz raw PCM or WAV base64 audio returned by Gemini TTS
 */
export async function playBase64PcmAudio(base64Data: string) {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Try playing as standard Audio blob first
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    await audio.play().catch(async () => {
      // Fallback: Web Audio API for PCM 24000Hz
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
    });
  } catch (err) {
    console.error("Audio playback error:", err);
  }
}
