'use client';

/**
 * Whisper line — SVG overlay that draws a dashed path between two
 * deskmates when an `activeNote` is in flight. The geometry is hard-coded
 * for the 4-column grid (the `M/Q/...` percentages land roughly between
 * the second and third desks in the default layout); B.3 will replace
 * this with seat-id lookups once the path math is verified visually.
 *
 * B.1 renders the SVG element unconditionally with an empty `<path>`
 * list when no activeNote is present — the SVG itself is invisible
 * because no `<path>` child is rendered. This keeps the parent layout
 * stable across active/inactive states (no layout flicker when a note
 * starts or finishes flying).
 */

import { useStageStore } from '@/lib/store/stage';
import styles from './classroom-front.module.css';

export function WhisperLine() {
  const activeNote = useStageStore((s) => s.classroom.activeNote ?? null);
  return (
    <svg
      className={styles.whisperSvg}
      data-testid="whisper-line"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {activeNote && (
        <path
          d="M 18 78 Q 30 65 42 78"
          stroke="#c4b5fd"
          strokeWidth={0.4}
          strokeDasharray="1 1"
          fill="none"
          opacity={0.6}
          data-testid="whisper-line-path"
        />
      )}
    </svg>
  );
}
