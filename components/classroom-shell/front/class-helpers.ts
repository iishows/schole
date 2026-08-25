/**
 * Pure helpers for the B.1 front-view classroom. Kept dependency-free so
 * they can be unit-tested without spinning up React / jsdom.
 *
 *  - `getStudentColor(seatIndex)` — cycles through 4 colours so the desks
 *    grid visually alternates and a user can locate themselves in the
 *    class at a glance. The class names match the CSS module's
 *    `.student1 / .student2 / .student3 / .me` rules, which in turn map
 *    to the `--student-1/2/3/me` tokens defined globally.
 *  - `getAvatarFallback(name, agentId)` — preference order is
 *    `name[0]` first (a real Chinese character carries more
 *    information than a Latin `A`), then the agent id's first character
 *    uppercased, then the universal `🧒` placeholder.
 */

const COLOR_CLASSES = ['student1', 'student2', 'student3', 'me'] as const;
export type StudentColorClass = typeof COLOR_CLASSES[number];

export function getStudentColor(seatIndex: number): StudentColorClass {
  // The modulo handles both positive and negative indices via the JS `%`
  // semantics — a negative seatIndex would normally produce a negative
  // remainder and break the indexed access below. Guard with `+ length`.
  const normalised = ((seatIndex % COLOR_CLASSES.length) + COLOR_CLASSES.length) %
    COLOR_CLASSES.length;
  return COLOR_CLASSES[normalised];
}

export function getAvatarFallback(agentName: string, agentId: string): string {
  if (agentName && agentName.length > 0) return agentName.charAt(0);
  if (agentId && agentId.length > 0) return agentId.charAt(0).toUpperCase();
  return '🧒';
}
