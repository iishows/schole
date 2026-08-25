import type { HandRaise, SeatConfig } from '@/lib/store/classroom-state';

function parseRow(seatId: string): string {
  return seatId.match(/^[A-Z]+/)?.[0] ?? '';
}
function parseCol(seatId: string): number {
  return parseInt(seatId.match(/\d+$/)?.[0] ?? '0', 10);
}

// V1.1 plan §15 (global constraint 15) — L1 sort key is a pure function
// exported independently for testability + future i18n re-ordering.
const ZONE_PRIORITY: Record<SeatConfig['zone'], number> = {
  front: 0,
  middle: 1,
  back: 2,
};

/**
 * Default layout generator: 邻座=同桌 (D-2 decision).
 * - Sort seatIds by row letter then column number
 * - Assign agents in input order to seats
 * - Compute deskmates: same row, column diff = 1
 * - Zone: first 1/3 of unique rows = front, last 1/3 = back, middle = middle
 */
export const ClassroomLayoutService = {
  autoGenerate(seatIds: string[], agentIds: string[]): SeatConfig[] {
    if (seatIds.length !== agentIds.length) {
      throw new Error(`seat count (${seatIds.length}) != agent count (${agentIds.length})`);
    }
    const sortedSeats = [...seatIds].sort((a, b) => {
      const r = parseRow(a).localeCompare(parseRow(b));
      return r !== 0 ? r : parseCol(a) - parseCol(b);
    });
    const rows = Array.from(new Set(sortedSeats.map(parseRow))).sort();
    const rowToZone = new Map<string, 'front' | 'middle' | 'back'>();
    const n = rows.length;
    rows.forEach((r, i) => {
      const ratio = n === 1 ? 0.5 : i / (n - 1);
      rowToZone.set(r, ratio < 0.34 ? 'front' : ratio > 0.67 ? 'back' : 'middle');
    });
    const seatByCol = new Map<string, Map<number, string>>();
    sortedSeats.forEach(sid => {
      const r = parseRow(sid);
      if (!seatByCol.has(r)) seatByCol.set(r, new Map());
      seatByCol.get(r)!.set(parseCol(sid), sid);
    });

    const configBySeat = new Map<string, SeatConfig>();
    sortedSeats.forEach((seatId, idx) => {
      const agentId = agentIds[idx];
      const row = parseRow(seatId);
      const col = parseCol(seatId);
      const deskmates: string[] = [];
      const rowMap = seatByCol.get(row)!;
      for (const [c, sid] of rowMap.entries()) {
        if (Math.abs(c - col) === 1) {
          const otherIdx = sortedSeats.indexOf(sid);
          deskmates.push(agentIds[otherIdx]);
        }
      }
      configBySeat.set(seatId, {
        seat_id: seatId,
        agent_id: agentId,
        deskmates,
        zone: rowToZone.get(row)!,
      });
    });
    return sortedSeats.map(s => configBySeat.get(s)!);
  },

  /**
   * Admin override (D-2): replace single seat config.
   */
  overrideSeat(layout: SeatConfig[], seatId: string, replacement: SeatConfig): SeatConfig[] {
    return layout.map(s => (s.seat_id === seatId ? replacement : s));
  },

  resolveSeat(layout: SeatConfig[], seatId: string): SeatConfig | null {
    return layout.find(s => s.seat_id === seatId) ?? null;
  },

  /**
   * V1.1 L1 — composite sort key [zone, seatIndex, raised_at].
   * Returns a single numeric score so callers can use Array#sort directly.
   * Unknown agent → Infinity (defensive: pushed to end of queue).
   * Pure function: no side effects, depends only on inputs.
   */
  resolveSortKey(layout: SeatConfig[], agentId: string): number {
    const seat = layout.find(s => s.agent_id === agentId);
    if (!seat) return Infinity;
    // Column dominant within zone; row letter breaks column ties
    // (parseRow letter codes are stable because layout seats are pre-sorted).
    const zoneScore = ZONE_PRIORITY[seat.zone] * 10_000;
    const colScore = parseCol(seat.seat_id) * 100;
    const rowScore = parseRow(seat.seat_id).charCodeAt(0) * 10;
    return zoneScore + colScore + rowScore;
  },

  /**
   * V1.1 L1 — sort hand-raise queue by [zone, seatIndex, raised_at].
   * Always re-sorts (per plan §"raise_hand" note: even for single-append
   * queue) so the queue invariant holds across re-orderings.
   */
  sortHandQueue(raises: HandRaise[], layout: SeatConfig[]): HandRaise[] {
    return [...raises].sort((a, b) => {
      const ka = this.resolveSortKey(layout, a.agent_id);
      const kb = this.resolveSortKey(layout, b.agent_id);
      if (ka !== kb) return ka - kb;
      return a.raised_at - b.raised_at;
    });
  },
};
