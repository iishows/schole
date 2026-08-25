import type { ClassroomAction } from '@openmaic/dsl';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';
import { ClassroomService } from '@/lib/services/classroom-service';

// Plan §4.1 — state sub-shapes. The DSL only ships the action union
// and the wire-format action interfaces; the reducer-internal views
// (HandRaise / CallOn / SeatConfig / BellEvent) are defined here as
// plain TS interfaces matching the §4.1 shapes used throughout the
// plan.
export interface HandRaise {
  agent_id: string;
  agent_name: string;
  raised_at: number;
  question?: string;
  origin: 'user' | 'agent';
}

export interface CallOn {
  target_agent_id: string;
  prompt: string;
  countdown_ms: number;
  called_at: number;
}

export interface SeatConfig {
  seat_id: string;
  agent_id: string;
  deskmates: string[];
  zone: 'front' | 'middle' | 'back';
}

export interface BellEvent {
  type: 'transition' | 'attention' | 'wrap';
  scheduled_at: number;
}

/**
 * Transient in-flight paper note (Task 10). The reducer keeps `pass_note`
 * as a no-op (semantic guard lives in the service / component), so the
 * component layer is responsible for setting `activeNote` via
 * `useStageStore.setState`. Kept optional + nullable so the slice stays
 * additive for the existing reducer + persistence tests.
 */
export interface ActiveNote {
  from_seat: string;
  to_seat: string;
  content: string;
  animation: 'fly';
}

/**
 * Blackboard chalk stroke buffer (Task 11). Also reducer-inert: the
 * blackboard_annotate reducer case only flips `blackboardMode`, so the
 * component layer is responsible for accumulating strokes here.
 */
export interface ChalkStroke {
  path: Array<{ x: number; y: number }>;
  color?: string;
  width?: number;
}

export type ClassroomPeriod = 'before-class' | 'lesson' | 'break' | 'after-class';

export interface ClassroomState {
  period: ClassroomPeriod;
  periodStartedAt: number | null;
  periodEndsAt: number | null;
  lessonLabel: string;
  handRaiseQueue: HandRaise[];
  activeCallOn: CallOn | null;
  blackboardMode: boolean;
  seatLayout: SeatConfig[];
  bellQueue: BellEvent[];
  lastError: string | null;
  /** Transient in-flight paper note (Task 10). Reducer-inert. */
  activeNote?: ActiveNote | null;
  /** Blackboard stroke buffer (Task 11). Reducer-inert. */
  chalkStrokes?: ChalkStroke[];
}

export function initialClassroomState(): ClassroomState {
  return {
    period: 'before-class',
    periodStartedAt: null,
    periodEndsAt: null,
    lessonLabel: '',
    handRaiseQueue: [],
    activeCallOn: null,
    blackboardMode: false,
    seatLayout: [],
    bellQueue: [],
    lastError: null,
    activeNote: null,
    chalkStrokes: [],
  };
}

export function classroomReducer(state: ClassroomState, action: ClassroomAction): ClassroomState {
  switch (action.type) {
    case 'period_start': {
      if (state.period !== 'before-class' && state.period !== 'break') {
        return { ...state, lastError: `illegal transition: period_start from ${state.period}` };
      }
      // V1.1 L2 (Task 3) — Director 不阻塞 spec §7: schedule the auto
      // period_end timer so the lesson window closes even if no manual
      // period_end ever arrives. Returns a cancel function the manual
      // path can call to cancel a stale timer.
      ClassroomService.scheduleAutoEnd(action.duration * 1000);
      return {
        ...state,
        period: 'lesson',
        periodStartedAt: action.timestamp,
        periodEndsAt: action.timestamp + action.duration * 1000,
        lessonLabel: action.period,
        lastError: null,
      };
    }
    case 'period_end': {
      if (state.period !== 'lesson') {
        return { ...state, lastError: `illegal transition: period_end from ${state.period}` };
      }
      return {
        ...state,
        period: action.is_last_lesson ? 'after-class' : 'break',
        periodStartedAt: null,
        periodEndsAt: null,
        lastError: null,
      };
    }
    case 'period_bell': {
      return {
        ...state,
        bellQueue: [
          ...state.bellQueue,
          { type: action.bell_type, scheduled_at: action.timestamp },
        ].slice(-10),  // keep last 10
      };
    }
    case 'raise_hand': {
      if (state.handRaiseQueue.find(h => h.agent_id === action.agent_id)) return state;
      const next = {
        ...state,
        handRaiseQueue: [
          ...state.handRaiseQueue,
          {
            agent_id: action.agent_id,
            agent_name: action.agent_name,
            raised_at: action.raised_at,
            question: action.question,
            origin: action.origin,
          },
        ],
      };
      // V1.1 L1 — sort by [zone, seatIndex, raised_at] after every append
      // so the queue invariant holds for the next consumer (Director call_on).
      return {
        ...next,
        handRaiseQueue: ClassroomLayoutService.sortHandQueue(
          next.handRaiseQueue,
          state.seatLayout,
        ),
      };
    }
    case 'call_on': {
      return {
        ...state,
        handRaiseQueue: [],
        activeCallOn: {
          target_agent_id: action.target_agent_id,
          prompt: action.prompt,
          countdown_ms: action.countdown_ms ?? 4000,
          called_at: action.timestamp,
        },
      };
    }
    case 'pass_note': {
      // 语义校验在 service 层；reducer 仅记录
      return state;
    }
    case 'blackboard_annotate': {
      return { ...state, blackboardMode: true };
    }
    default:
      return state;
  }
}
