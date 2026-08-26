'use client';

/**
 * B.1.3 — Right-hand assignment panel.
 *
 * Faithful port of the mockup's `.assignment` row from
 * `mockups/classroom-layout-c3.html` lines 670–714:
 *   - `.section-title` "📝 当前题目"
 *   - `.problem-card` (badge + difficulty + code + problem text + answer row)
 *   - `.help-actions` row (primary "✋ 需要帮助" + secondary buttons)
 *   - `.section-title` "📕 今日错题 (N)"
 *   - `.mistake-list` of `.mistake-item` rows
 *
 * Math-fraction support — `DemoProblem.text` may contain `1/2`-style
 * tokens. We split the string at every `\d+/\d+` token so each one
 * renders as a `.fraction` span with `.num` / `.den` children. Tokens
 * that don't match the fraction pattern fall through as plain text.
 */

import type { DemoMistake, DemoProblem } from '@/lib/classroom/demo-data-generator';
import styles from './demo-shell.module.css';

export interface AssignmentPanelProps {
  problem: DemoProblem;
  mistakes: DemoMistake[];
}

interface TextSegment {
  kind: 'text' | 'fraction';
  value: string;
}

const FRACTION_RE = /(\d+)\s*\/\s*(\d+)/g;

function splitProblemText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(FRACTION_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, start) });
    }
    segments.push({ kind: 'fraction', value: `${match[1]}/${match[2]}` });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }
  if (segments.length === 0) {
    segments.push({ kind: 'text', value: text });
  }
  return segments;
}

function renderProblemText(text: string) {
  return splitProblemText(text).map((seg, idx) => {
    if (seg.kind === 'text') {
      return <span key={`t-${idx}`}>{seg.value}</span>;
    }
    const [num, den] = seg.value.split('/');
    return (
      <span className={styles.fraction} key={`f-${idx}`}>
        <span className={styles.num}>{num}</span>
        <span className={styles.den}>{den}</span>
      </span>
    );
  });
}

export function AssignmentPanel({ problem, mistakes }: AssignmentPanelProps) {
  return (
    <aside className={styles.assignment} data-testid="demo-assignment-panel">
      <div className={styles.sectionTitle}>📝 当前题目</div>
      <div className={styles.problemCard} data-testid="demo-problem-card">
        <div className={styles.problemMeta}>
          <span className={styles.problemBadge} data-testid="demo-problem-badge">
            {problem.badge}
          </span>
          <span data-testid="demo-problem-difficulty">· 难度 {problem.difficulty}</span>
          <span data-testid="demo-problem-code">· {problem.code}</span>
        </div>
        <div className={styles.problemText} data-testid="demo-problem-text">
          {renderProblemText(problem.text)}
        </div>
        <div className={styles.answerRow}>
          <input
            type="text"
            placeholder="输入答案（如 5/6）"
            className={styles.answerInput}
            data-testid="demo-answer-input"
            disabled
          />
          <button type="button" className={styles.submitBtn} disabled>
            提交
          </button>
        </div>
        <div className={styles.helpActions}>
          <button type="button" className={`${styles.helpBtn} ${styles.helpBtnPrimary}`}>
            ✋ 需要帮助
          </button>
          <button type="button" className={styles.helpBtn}>
            💡 要提示
          </button>
          <button type="button" className={styles.helpBtn}>
            📷 拍题
          </button>
        </div>
      </div>
      <div className={styles.sectionTitle} style={{ marginTop: 16 }}>
        📕 今日错题 ({mistakes.length})
      </div>
      <div className={styles.mistakeList} data-testid="demo-mistake-list" data-count={mistakes.length}>
        {mistakes.map((m, idx) => (
          <div className={styles.mistakeItem} key={`${m.q}-${idx}`} data-testid="demo-mistake-item">
            <span className={styles.mistakeCheck}>{m.status}</span>
            <span className={styles.mistakeQ}>{m.q}</span>
            <span className={styles.mistakeReason}>{m.reason}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
