'use client';

/**
 * B.1.3 — Bottom input bar (mockup-faithful, 64px tall).
 *
 * Faithful port of the mockup's `.input-bar` row from
 * `mockups/classroom-layout-c3.html` lines 717–724:
 *   📷 · text input · 🎤 · 😊 · ✋ 举手
 *
 * Visual only — handlers are optional no-ops. Buttons are disabled by
 * default (the demo route is read-only; no LLM calls).
 */

import styles from './demo-shell.module.css';

export interface InputBarProps {
  placeholder?: string;
  disabled?: boolean;
}

export function InputBar({
  placeholder = '跟小诺姐姐或同学说话...  ✋ 举手后被叫到才能发言',
  disabled = true,
}: InputBarProps) {
  return (
    <div className={styles.inputBar} data-testid="demo-input-bar" data-disabled={disabled ? 'true' : 'false'}>
      <button
        type="button"
        className={styles.iconBtn}
        title="拍题"
        data-testid="demo-input-camera"
        disabled={disabled}
        aria-label="拍题"
      >
        📷
      </button>
      <input
        type="text"
        className={styles.inputBarInput}
        placeholder={placeholder}
        disabled={disabled}
        data-testid="demo-input-text"
      />
      <button
        type="button"
        className={styles.iconBtn}
        title="语音"
        data-testid="demo-input-mic"
        disabled={disabled}
        aria-label="语音"
      >
        🎤
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        title="表情"
        data-testid="demo-input-emoji"
        disabled={disabled}
        aria-label="表情"
      >
        😊
      </button>
      <button
        type="button"
        className={styles.handBtn}
        data-testid="demo-input-hand"
        disabled={disabled}
      >
        ✋ 举手
      </button>
    </div>
  );
}
