'use client';

/**
 * B.1.3 — Chat history strip rendered above the blackboard.
 *
 * Vertical list of `.bubble` rows matching the mockup's right-side chat
 * panel (`mockups/cn/classroom-overview.html` `.bubble.teacher/.agent/.user`
 * styling). Each row renders the role-tinted background, the
 * `小诺姐姐` / `displayName` / anonymous prefix, the message body, and
 * a small epoch-relative timestamp.
 *
 * The component is purely presentational — no internal state, no
 * timers, no handlers. The page generates `DemoChatMessage[]` once per
 * (re)mount and passes it in.
 */

import type { DemoChatMessage } from '@/lib/classroom/demo-data-generator';
import styles from './demo-shell.module.css';

export interface ChatHistoryProps {
  messages: DemoChatMessage[];
}

function formatRelativeTime(epochMs: number, nowMs: number): string {
  const diff = Math.max(0, Math.floor((nowMs - epochMs) / 1000));
  if (diff < 60) return `${diff}s 前`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min}m 前`;
  const hr = Math.floor(min / 60);
  return `${hr}h 前`;
}

function bubbleClass(role: DemoChatMessage['role']): string {
  if (role === 'teacher') return styles.bubbleTeacher;
  if (role === 'user') return styles.bubbleUser;
  return styles.bubbleStudent;
}

function bubbleName(msg: DemoChatMessage): string | null {
  if (msg.role === 'teacher') return '👩‍🏫 小诺姐姐';
  if (msg.role === 'student') return `🧒 ${msg.displayName ?? '同学'}`;
  return null;
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const nowMs = messages[messages.length - 1]?.timestamp ?? Date.now();
  return (
    <div className={styles.chatHistory} data-testid="demo-chat-history" data-count={messages.length}>
      <div className={styles.chatHeading}>💬 实时讨论 · {messages.length} 条</div>
      {messages.map((msg) => {
        const role = msg.role;
        const name = bubbleName(msg);
        const cls = `${styles.bubble} ${bubbleClass(role)}`;
        return (
          <div
            key={msg.id}
            className={cls}
            data-testid={`demo-chat-bubble`}
            data-role={role}
          >
            {name ? <span className={styles.bubbleName}>{name}</span> : null}
            <span className={styles.bubbleContent}>{msg.content}</span>
            <span className={styles.bubbleTime}>{formatRelativeTime(msg.timestamp, nowMs)}</span>
          </div>
        );
      })}
    </div>
  );
}
