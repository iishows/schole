import type { SeatConfig } from '@/lib/store/classroom-state';

function parseRow(seatId: string): string {
  return seatId.match(/^[A-Z]+/)?.[0] ?? '';
}
function parseCol(seatId: string): number {
  return parseInt(seatId.match(/\d+$/)?.[0] ?? '0', 10);
}

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
};
