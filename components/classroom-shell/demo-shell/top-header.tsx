'use client';

/**
 * B.1.3 — Top header bar (mockup-faithful, 56px tall).
 *
 * Renders the mockup's `.header` row from `mockups/classroom-layout-c3.html`:
 *   hamburger · teacher pill · mode tabs · pomodoro · chat-toggle (with badge)
 *
 * All data is optional — the demo page passes the header payload from
 * `generateDemoClassroomState().header`. Handlers default to no-ops so the
 * component stays purely presentational when no callbacks are supplied.
 */

import styles from './demo-shell.module.css';

export interface TopHeaderProps {
  modeTabs?: string[];
  pomodoroSeconds?: number;
  teacherName?: string;
  chatBadgeCount?: number;
  /** Refresh-button handler — the demo page hooks this to the
   *  `换一换 🎲` button. Optional. */
  onRefresh?(): void;
}

function formatPomodoro(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function TopHeader({
  modeTabs = ['✏️ 作业', '📖 复习', '💬 自由'],
  pomodoroSeconds = 25 * 60,
  teacherName = '小诺姐姐',
  chatBadgeCount = 0,
  onRefresh,
}: TopHeaderProps) {
  const safeBadge = Math.max(0, Math.floor(chatBadgeCount));
  const totalSeconds = 25 * 60;
  const displayPomodoro = formatPomodoro(pomodoroSeconds);
  const totalDisplay = formatPomodoro(totalSeconds);

  return (
    <header className={styles.topHeader} data-testid="demo-top-header">
      <span className={styles.hamburger} aria-hidden="true">
        ☰
      </span>
      <div className={styles.teacherPill}>
        <span className={styles.teacherPillAvatar} aria-hidden="true">
          👩‍🏫
        </span>
        <span>{teacherName}</span>
      </div>
      <div className={styles.modeTabs} role="tablist" aria-label="mode tabs">
        {modeTabs.map((tab, idx) => (
          <button
            type="button"
            key={`${tab}-${idx}`}
            className={`${styles.modeTab} ${idx === 0 ? styles.modeTabActive : ''}`}
            data-testid={`demo-mode-tab-${idx}`}
            data-active={idx === 0 ? 'true' : 'false'}
            aria-selected={idx === 0 ? 'true' : 'false'}
            role="tab"
            disabled
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.pomodoro} data-testid="demo-pomodoro" data-seconds={pomodoroSeconds}>
        <span className={styles.pomodoroDot} aria-hidden="true" />
        <span>🍅 {displayPomodoro} / {totalDisplay}</span>
      </div>
      {onRefresh ? (
        <button
          type="button"
          className={styles.refreshBtn}
          data-testid="demo-top-header-refresh"
          onClick={onRefresh}
        >
          换一换 🎲
        </button>
      ) : null}
      <button
        type="button"
        className={styles.chatToggle}
        data-testid="demo-chat-toggle"
        aria-label="完整聊天"
      >
        💬
        {safeBadge > 0 ? (
          <span className={styles.chatBadge} data-testid="demo-chat-badge" data-count={safeBadge}>
            {safeBadge > 99 ? '99+' : safeBadge}
          </span>
        ) : null}
      </button>
    </header>
  );
}
