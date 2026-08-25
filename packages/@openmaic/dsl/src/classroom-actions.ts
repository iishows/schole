import type { ActionBase } from './action.js';

// 4 KB payload cap (spec §10 风险 mitigation)
export const MAX_CLASSROOM_ACTION_BYTES = 4096;

export type ClassroomAction =
  | PeriodStartAction | PeriodEndAction | PeriodBellAction
  | RaiseHandAction | CallOnAction | PassNoteAction | BlackboardAnnotateAction;

export interface PeriodStartAction extends ActionBase {
  type: 'period_start';
  period: string;            // e.g. "Lesson-1"
  duration: number;          // seconds
  agenda: string[];          // min 1 item
  agent_id: string;
  timestamp: number;
}

export interface PeriodEndAction extends ActionBase {
  type: 'period_end';
  break_duration: number;    // seconds
  is_last_lesson?: boolean;
  agent_id: string;
  timestamp: number;
}

export interface PeriodBellAction extends ActionBase {
  type: 'period_bell';
  bell_type: 'transition' | 'attention' | 'wrap';
  agent_id: string;
  timestamp: number;
}

export interface RaiseHandAction extends ActionBase {
  type: 'raise_hand';
  agent_id: string;
  agent_name: string;
  raised_at: number;
  question?: string;
  origin: 'user' | 'agent';
}

export interface CallOnAction extends ActionBase {
  type: 'call_on';
  target_agent_id: string;
  prompt: string;
  countdown_ms?: number;     // default 4000
  agent_id: string;
  timestamp: number;
}

export interface PassNoteAction extends ActionBase {
  type: 'pass_note';
  from_seat: string;         // e.g. "A1"
  to_seat: string;           // must be adjacent (semantic check in service)
  content: string;
  animation: 'fly';
  agent_id: string;
  timestamp: number;
}

export interface BlackboardAnnotateAction extends ActionBase {
  type: 'blackboard_annotate';
  layer: 'blackboard';
  path: Array<{ x: number; y: number }>;  // cap 500 points
  duration: number;          // ms
  agent_id: string;
  timestamp: number;
}

// Structural validators (no runtime deps; pure JS)
function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function nonEmptyStr(x: unknown): boolean { return typeof x === 'string' && x.length > 0; }
function isNum(x: unknown): boolean { return typeof x === 'number' && Number.isFinite(x); }

export function validateClassroomAction(action: unknown): boolean {
  if (!isObj(action)) return false;
  if (!nonEmptyStr(action.id) || !nonEmptyStr(action.type)) return false;
  if (!nonEmptyStr(action.agent_id)) return false;

  // Payload cap
  try {
    if (JSON.stringify(action).length > MAX_CLASSROOM_ACTION_BYTES) return false;
  } catch { return false; }

  switch (action.type) {
    case 'period_start':
      return (
        nonEmptyStr(action.period) && isNum(action.duration) && isNum(action.timestamp) &&
        Array.isArray(action.agenda) && action.agenda.length > 0 &&
        action.agenda.every(nonEmptyStr)
      );
    case 'period_end':
      return isNum(action.timestamp) && isNum(action.break_duration) &&
        (action.is_last_lesson === undefined || typeof action.is_last_lesson === 'boolean');
    case 'period_bell':
      return isNum(action.timestamp) &&
        (action.bell_type === 'transition' || action.bell_type === 'attention' || action.bell_type === 'wrap');
    case 'raise_hand':
      return nonEmptyStr(action.agent_name) && isNum(action.raised_at) &&
        (action.question === undefined || typeof action.question === 'string') &&
        (action.origin === 'user' || action.origin === 'agent');
    case 'call_on':
      return nonEmptyStr(action.target_agent_id) && nonEmptyStr(action.prompt) && isNum(action.timestamp) &&
        (action.countdown_ms === undefined || isNum(action.countdown_ms));
    case 'pass_note':
      return nonEmptyStr(action.from_seat) && nonEmptyStr(action.to_seat) &&
        nonEmptyStr(action.content) && action.animation === 'fly' && isNum(action.timestamp);
    case 'blackboard_annotate':
      return action.layer === 'blackboard' && isNum(action.timestamp) &&
        Array.isArray(action.path) && action.path.length <= 500 &&
        action.path.every(p => isObj(p) && isNum((p as any).x) && isNum((p as any).y)) &&
        isNum(action.duration);
    default:
      return false;
  }
}

export function isClassroomAction(action: unknown): action is ClassroomAction {
  return validateClassroomAction(action);
}
