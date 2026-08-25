'use client';
import { useState } from 'react';
import { useStageStore } from '@/lib/store/stage';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';

export function HandRaiseButton() {
  const enabled = isClassroomShellEnabled();
  const queue = useStageStore(s => s.classroom.handRaiseQueue);
  const dispatch = useStageStore(s => s.dispatchClassroomAction);
  const [showInput, setShowInput] = useState(false);
  const [question, setQuestion] = useState('');

  if (!enabled) return null;

  const submit = () => {
    dispatch({
      type: 'raise_hand', id: `r-${Date.now()}`,
      agent_id: 'user', agent_name: '我',
      raised_at: Date.now(), origin: 'user',
      question: question || undefined,
    });
    setQuestion('');
    setShowInput(false);
  };

  return (
    <div className="hand-raise" data-testid="hand-raise">
      {queue.length > 0 && (
        <span className="hand-raise__badge" data-testid="hand-raise-badge">{queue.length}</span>
      )}
      {!showInput ? (
        <button
          className="hand-raise__btn"
          data-testid="hand-raise-btn"
          onClick={() => setShowInput(true)}
          aria-label="举手"
        >🔔</button>
      ) : (
        <div className="hand-raise__popover">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="你想问什么？"
            data-testid="hand-raise-input"
          />
          <button onClick={submit} data-testid="hand-raise-submit">举手</button>
        </div>
      )}
    </div>
  );
}