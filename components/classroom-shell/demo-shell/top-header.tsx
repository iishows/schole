'use client';

/**
 * B.1.3 — Top header bar (mockup-faithful, 56px tall).
 *
 * Renders the mockup's `.header` row from `mockups/classroom-layout-c3.html`:
 *   hamburger · teacher pill · [mode tabs ·] pomodoro · chat-toggle (with badge)
 * plus the B.1.5 view tabs (📝 白板 / 🏫 教室 / 📊 作业).
 *
 * All data is optional — the demo page passes the header payload from
 * `generateDemoClassroomState().header`. Handlers default to no-ops so the
 * component stays purely presentational when no callbacks are supplied.
 *
 * B.1.5 — added view-level tabs (📝 白板 / 🏫 教室 / 📊 作业). The
 * three tabs share the parent's `view` state and switch the
 * `<DemoShell />` render output between the whiteboard-only,
 * classroom-only, and full dashboard layouts. The view-tabs are
 * visually distinct from the existing mode-tabs (icon-heavy +
 * bordered) so the user can tell the two tab systems apart at a
 * glance.
 *
 * B.1.7 — mode tabs are now clickable: clicking fires
 * `onModeChange(idx)` and the visual highlight follows
 * `activeMode`. The mode-tabs container is hidden entirely when
 * `modeTabs` is `undefined` (the demo route relies on this — its
 * view-tabs already include "作业", so a second "✏️ 作业" button
 * was duplicative).
 */

import styles from './demo-shell.module.css';

/** B.1.5 — the three view-level tabs. Public so the page / tests
 *  can map them onto the same string IDs without copy-pasting. */
export type DemoViewId = 'whiteboard' | 'classroom' | 'dashboard';

export interface DemoViewTab {
  id: DemoViewId;
  icon: string;
  label: string;
}

/** Default ordering + labels. Exported so unit tests can pin the
 *  active-tab mapping without re-declaring the literal strings. */
export const DEMO_VIEW_TABS: readonly DemoViewTab[] = [
  { id: 'whiteboard', icon: '📝', label: '白板' },
  { id: 'classroom', icon: '🏫', label: '教室' },
  { id: 'dashboard', icon: '📊', label: '作业' },
] as const;

export interface TopHeaderProps {
  /**
   * B.1.7 — when `undefined` (default), the mode-tabs container is NOT
   * rendered at all. The demo route relies on this to avoid the
   * duplicate "作业" entry (the view-tabs already include a "作业"
   * tab). Pass `modeTabs={['...']}` explicitly to render the container
   * (used by tests / back-compat consumers).
   */
  modeTabs?: string[];
  /** B.1.7 — currently active mode-tab index. Defaults to 0. */
  activeMode?: number;
  /** B.1.7 — fired when the user clicks a mode tab. The parent
   *  (typically the demo page) updates its `activeMode` state in
   *  response. Optional — when omitted the click is a no-op aside
   *  from the visual highlight shift, since the tabs default to
   *  uncontrolled internal state. */
  onModeChange?(idx: number): void;
  pomodoroSeconds?: number;
  teacherName?: string;
  chatBadgeCount?: number;
  /** Refresh-button handler — the demo page hooks this to the
   *  `换一换 🎲` button. Optional. */
  onRefresh?(): void;
  /** B.1.5 — currently active view tab. Defaults to 'dashboard'. */
  view?: DemoViewId;
  /** B.1.5 — fired when the user clicks a view tab. The parent
   *  (`<DemoShell />`) updates its `view` state in response. */
  onViewChange?(next: DemoViewId): void;
  /** B.1.5 — overrides the default tab list. Tests use this to
   *  inject shorter labels; the default is the mockup-faithful
   *  full Chinese label set. */
  viewTabs?: readonly DemoViewTab[];
}

function formatPomodoro(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function TopHeader({
  modeTabs,
  activeMode = 0,
  onModeChange,
  pomodoroSeconds = 25 * 60,
  teacherName = '小诺姐姐',
  chatBadgeCount = 0,
  onRefresh,
  view = 'dashboard',
  onViewChange,
  viewTabs = DEMO_VIEW_TABS,
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
      {/*
        B.1.7 — the mode-tabs container is only rendered when an
        explicit `modeTabs` array is passed. The demo route leaves
        `modeTabs` undefined so the duplicate "作业" entry goes away
        (the view-tabs already include one). Tests that need the
        container can opt in by passing `modeTabs={['...']}`.
      */}
      {modeTabs ? (
        <div className={styles.modeTabs} role="tablist" aria-label="mode tabs">
          {modeTabs.map((tab, idx) => {
            const isActive = idx === activeMode;
            return (
              <button
                type="button"
                key={`${tab}-${idx}`}
                className={`${styles.modeTab} ${isActive ? styles.modeTabActive : ''}`}
                data-testid={`demo-mode-tab-${idx}`}
                data-active={isActive ? 'true' : 'false'}
                aria-selected={isActive ? 'true' : 'false'}
                role="tab"
                onClick={() => {
                  if (onModeChange) onModeChange(idx);
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      ) : null}
      <div
        className={styles.viewTabs}
        role="tablist"
        aria-label="view tabs"
        data-testid="demo-view-tabs"
      >
        {viewTabs.map((tab) => {
          const isActive = tab.id === view;
          return (
            <button
              type="button"
              key={tab.id}
              className={`${styles.viewTab} ${isActive ? styles.viewTabActive : ''}`}
              data-testid={`demo-view-tab-${tab.id}`}
              data-active={isActive ? 'true' : 'false'}
              aria-selected={isActive ? 'true' : 'false'}
              role="tab"
              onClick={() => {
                if (onViewChange) onViewChange(tab.id);
              }}
              title={tab.label}
            >
              <span className={styles.viewTabIcon} aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
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
