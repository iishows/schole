'use client';

/**
 * DeskBubble — placeholder for B.1; returns `null` when no `content` is
 * supplied. B.3 will thread `activeNote` from the store and pass the
 * note's text as `content` (with a `thinking` flag for the
 * composing-animation variant). The shape is already in place so the
 * component never needs to change — only its parent wiring.
 */

import styles from './classroom-front.module.css';

export interface DeskBubbleProps {
  name: string;
  colorClass: string;
  content?: string;
  thinking?: boolean;
}

export function DeskBubble({ name, colorClass, content, thinking }: DeskBubbleProps) {
  if (!content) return null;
  const classes = [styles.deskBubble, styles[colorClass], thinking ? styles.thinking : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-name={name} data-testid={`desk-bubble-${name}`}>
      {content}
    </div>
  );
}
