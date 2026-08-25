'use client';
import { useCallback, useRef } from 'react';

/**
 * Web Audio API 铃响 (绕过静音护栏, spec §10 风险 mitigation)
 */
function tone(freq: number, durationMs: number): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, durationMs);
  } catch {
    /* ignore */
  }
}

/**
 * usePeriodBarBell — Three-tier bell tones for the classroom shell.
 *
 *  - `playBell` / `playTransition` : 880Hz → 660Hz chirp (period boundaries)
 *  - `playAttention`               : 1320Hz ping (call-on / attention)
 *  - `playWrap`                    : 660Hz → 880Hz → 1320Hz flourish (lesson end)
 *
 * Implementation note: tone() is wrapped in try/catch so the hook never throws
 * — browser autoplay policies may silently reject `new AudioContext()` until
 * the first user gesture, and a classroom shell must remain visually quiet
 * (no console errors) when audio is unavailable.
 */
export function usePeriodBarBell() {
  const playedRef = useRef<Set<string>>(new Set());
  const playTransition = useCallback(() => {
    tone(880, 300);
    setTimeout(() => tone(660, 300), 350);
  }, []);
  const playAttention = useCallback(() => tone(1320, 200), []);
  const playWrap = useCallback(() => {
    tone(660, 200);
    setTimeout(() => tone(880, 200), 250);
    setTimeout(() => tone(1320, 400), 500);
  }, []);
  return {
    playBell: playTransition,
    playTransition,
    playAttention,
    playWrap,
  };
}