'use client';

/**
 * M2 admin seat-layout editor (plan §Task 5).
 *
 * Lets admin override individual `SeatConfig` entries from the classroom
 * shell slice: zone dropdown (front/middle/back), deskmates checkboxes
 * (one per other agent), and an agent_id dropdown. Each row's "Apply"
 * button funnels the change through `ClassroomLayoutService.overrideSeat()`
 * (the V1 admin escape hatch) and writes the new layout back to the
 * stage store via the additive `useStageStore.setState` write path
 * described in the V1.1 plan. The "Regenerate from defaults" button at
 * the top reruns `ClassroomLayoutService.autoGenerate()` against the
 * current seat IDs and the 5 default agent ids `a1`..`a5`.
 *
 * Per the plan §"DO NOT" list this component:
 *  - does not modify `ClassroomLayoutService` (V1 already shipped it),
 *  - does not introduce new dependencies (vanilla React + zustand only),
 *  - does not implement real auth — the admin gate is a placeholder
 *    localStorage check (see `app/admin/classroom/page.tsx`).
 */

import { useCallback, useMemo, useState } from 'react';
import { ClassroomLayoutService } from '@/lib/services/classroom-layout-service';
import { useStageStore } from '@/lib/store/stage';
import type { SeatConfig } from '@/lib/store/classroom-state';

const ZONES: Array<SeatConfig['zone']> = ['front', 'middle', 'back'];
const DEFAULT_AGENT_IDS = ['a1', 'a2', 'a3', 'a4', 'a5'];

type DraftSeat = {
  zone: SeatConfig['zone'];
  agent_id: string;
  deskmates: string[];
};

function sameSeat(a: SeatConfig, b: SeatConfig): boolean {
  return (
    a.seat_id === b.seat_id &&
    a.agent_id === b.agent_id &&
    a.zone === b.zone &&
    a.deskmates.length === b.deskmates.length &&
    a.deskmates.every((d) => b.deskmates.includes(d))
  );
}

export function SeatLayoutEditor() {
  // `useStageStore(s => s.classroom.seatLayout)` keeps the editor in sync
  // with reducer / persistence writes that update the classroom slice.
  const layout = useStageStore((s) => s.classroom.seatLayout);

  // Local draft state: holds the uncommitted row edits so we don't write
  // to the store on every checkbox tick (cheap re-renders only). The
  // store stays the source of truth — drafts are reset on each render
  // via the `key` derivation below.
  const [drafts, setDrafts] = useState<Record<string, DraftSeat>>({});

  const agentsInLayout = useMemo(() => {
    const ids = layout.map((s) => s.agent_id).filter(Boolean);
    return Array.from(new Set([...ids, ...DEFAULT_AGENT_IDS]));
  }, [layout]);

  // All seat_ids in layout order — used by both the per-row Apply button
  // and the regenerate-from-defaults entry point.
  const seatIds = useMemo(() => layout.map((s) => s.seat_id), [layout]);

  const getDraft = useCallback(
    (seatId: string): DraftSeat | null => {
      if (drafts[seatId]) return drafts[seatId];
      const seat = layout.find((s) => s.seat_id === seatId);
      if (!seat) return null;
      return {
        zone: seat.zone,
        agent_id: seat.agent_id,
        deskmates: [...seat.deskmates],
      };
    },
    [drafts, layout],
  );

  const setDraftField = useCallback(
    (seatId: string, patch: Partial<DraftSeat>) => {
      setDrafts((prev) => {
        const current = prev[seatId] ?? (() => {
          const seat = layout.find((s) => s.seat_id === seatId);
          if (!seat) return null;
          return {
            zone: seat.zone,
            agent_id: seat.agent_id,
            deskmates: [...seat.deskmates],
          } as DraftSeat;
        })();
        if (!current) return prev;
        return { ...prev, [seatId]: { ...current, ...patch } };
      });
    },
    [layout],
  );

  const toggleDeskmate = useCallback(
    (seatId: string, otherAgentId: string, checked: boolean) => {
      setDrafts((prev) => {
        const seat = layout.find((s) => s.seat_id === seatId);
        if (!seat) return prev;
        const current = prev[seatId] ?? {
          zone: seat.zone,
          agent_id: seat.agent_id,
          deskmates: [...seat.deskmates],
        };
        const without = current.deskmates.filter((id) => id !== otherAgentId);
        const nextDeskmates = checked
          ? [...without, otherAgentId].sort()
          : without;
        return {
          ...prev,
          [seatId]: { ...current, deskmates: nextDeskmates },
        };
      });
    },
    [layout],
  );

  // Apply a row's draft to the store via the V1 admin escape hatch +
  // the additive write path described in the V1.1 plan.
  const applyRow = useCallback(
    (seatId: string) => {
      const seat = layout.find((s) => s.seat_id === seatId);
      const draft = drafts[seatId] ?? {
        zone: seat?.zone ?? 'middle',
        agent_id: seat?.agent_id ?? '',
        deskmates: seat ? [...seat.deskmates] : [],
      };
      const replacement: SeatConfig = {
        seat_id: seatId,
        agent_id: draft.agent_id,
        deskmates: draft.deskmates,
        zone: draft.zone,
      };
      const newLayout = ClassroomLayoutService.overrideSeat(layout, seatId, replacement);
      useStageStore.setState((s) => ({
        classroom: { ...s.classroom, seatLayout: newLayout },
      }));
      // Clear the draft for this row so the next render shows the
      // committed values as the baseline.
      setDrafts((prev) => {
        if (!(seatId in prev)) return prev;
        const { [seatId]: _drop, ...rest } = prev;
        return rest;
      });
    },
    [drafts, layout],
  );

  const regenerate = useCallback(() => {
    if (seatIds.length === 0) return;
    const agentIds = DEFAULT_AGENT_IDS.slice(0, seatIds.length);
    const newLayout = ClassroomLayoutService.autoGenerate(seatIds, agentIds);
    useStageStore.setState((s) => ({
      classroom: { ...s.classroom, seatLayout: newLayout },
    }));
    setDrafts({});
  }, [seatIds]);

  if (layout.length === 0) {
    return (
      <div data-testid="seat-layout-editor-empty" className="seat-layout-editor__empty">
        <p>No seats configured. Use "Regenerate from defaults" to bootstrap a layout.</p>
        <button
          type="button"
          onClick={regenerate}
          data-testid="seat-layout-editor-regenerate-empty"
        >
          Regenerate from defaults
        </button>
      </div>
    );
  }

  return (
    <div data-testid="seat-layout-editor" className="seat-layout-editor">
      <div className="seat-layout-editor__toolbar">
        <button
          type="button"
          onClick={regenerate}
          data-testid="seat-layout-editor-regenerate"
        >
          Regenerate from defaults
        </button>
      </div>
      <table className="seat-layout-editor__table" data-testid="seat-layout-editor-table">
        <thead>
          <tr>
            <th>seat_id</th>
            <th>agent_id</th>
            <th>zone</th>
            <th>deskmates</th>
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {layout.map((seat) => {
            const draft = getDraft(seat.seat_id) ?? {
              zone: seat.zone,
              agent_id: seat.agent_id,
              deskmates: [...seat.deskmates],
            };
            const dirty = !sameSeat(seat, {
              seat_id: seat.seat_id,
              agent_id: draft.agent_id,
              deskmates: draft.deskmates,
              zone: draft.zone,
            });
            const rowKey = `seat-row-${seat.seat_id}`;
            return (
              <tr key={seat.seat_id} data-testid={rowKey}>
                <td data-testid={`${rowKey}-seat-id`}>{seat.seat_id}</td>
                <td>
                  <select
                    data-testid={`${rowKey}-agent`}
                    value={draft.agent_id}
                    onChange={(e) =>
                      setDraftField(seat.seat_id, { agent_id: e.target.value })
                    }
                  >
                    {agentsInLayout.map((agentId) => (
                      <option key={agentId} value={agentId}>
                        {agentId}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    data-testid={`${rowKey}-zone`}
                    value={draft.zone}
                    onChange={(e) =>
                      setDraftField(seat.seat_id, {
                        zone: e.target.value as SeatConfig['zone'],
                      })
                    }
                  >
                    {ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="seat-layout-editor__deskmates">
                    {agentsInLayout
                      .filter((a) => a !== draft.agent_id)
                      .map((otherAgentId) => {
                        const checkboxKey = `${rowKey}-deskmate-${otherAgentId}`;
                        return (
                          <label key={otherAgentId} className="seat-layout-editor__deskmate">
                            <input
                              type="checkbox"
                              data-testid={checkboxKey}
                              checked={draft.deskmates.includes(otherAgentId)}
                              onChange={(e) =>
                                toggleDeskmate(
                                  seat.seat_id,
                                  otherAgentId,
                                  e.target.checked,
                                )
                              }
                            />
                            {otherAgentId}
                          </label>
                        );
                      })}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    data-testid={`${rowKey}-apply`}
                    onClick={() => applyRow(seat.seat_id)}
                    disabled={!dirty}
                  >
                    Apply
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default SeatLayoutEditor;