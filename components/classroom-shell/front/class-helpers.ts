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
 *  - `getEmojiForAgent(agentName, agentId)` — B.1.1 emoji lookup: maps the
 *    mock agent ids from the fixture route to the 👧/👦/🧒 glyphs the
 *    mockup HTML uses. Lookup is case-insensitive on the agent id and
 *    falls back to `getAvatarFallback` for unknown names/ids so existing
 *    tests keep passing.
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

/**
 * B.1.1 — emoji lookup table keyed by the agent id (lower-cased). The
 * mapping mirrors the mockup's `👧/👦/🧒` glyphs and is intentionally
 * tiny: the fixture route seeds alice/bob/carol/dave/eve, and these are
 * the ids the snapshot baselines will exercise. Unknown ids fall back to
 * `getAvatarFallback` so the rest of the avatar pipeline (single-char
 * initials) still produces a usable glyph.
 */
const EMOJI_BY_AGENT_ID: Record<string, string> = {
  alice: '👧',
  bob: '👦',
  carol: '👧',
  dave: '👦',
  eve: '🧒',
  frank: '👦',
  grace: '👧',
  me: '🧒',
};

export function getEmojiForAgent(agentName: string, agentId: string): string {
  if (agentId) {
    const glyph = EMOJI_BY_AGENT_ID[agentId.toLowerCase()];
    if (glyph) return glyph;
  }
  return getAvatarFallback(agentName, agentId);
}

/**
 * B.1.1 — translate the seat colour class (student1 / student2 / student3 /
 * me) into the bubble colour variant the mockup uses (pink / green / amber /
 * blue). The seat avatar keeps its seat-coloured background; the bubble
 * uses a softer matching tint so it does not clash with the avatar fill.
 */
const BUBBLE_COLOR_BY_SEAT: Record<StudentColorClass, string> = {
  student1: 'pink',
  student2: 'green',
  student3: 'amber',
  me: 'blue',
};

export function getBubbleColorForSeat(colorClass: StudentColorClass | string): string {
  return BUBBLE_COLOR_BY_SEAT[colorClass as StudentColorClass] ?? 'pink';
}
