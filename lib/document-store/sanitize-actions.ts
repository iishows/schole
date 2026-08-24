/**
 * Storage-boundary action sanitizer (defensive repair for upstream free-form
 * agent output).
 *
 * The DSL `Action` union lives in `@openmaic/dsl/src/action.ts` and is enforced
 * by `validateScene` at the storage write boundary. Some upstream producers
 * (chat-agent streams, ad-hoc regeneration tools) emit a chat-shaped JSON array
 * where speech appears as `{"type":"text","content":"..."}` and concrete
 * actions as `{"type":"action","name":"spotlight","params":{...}}` — a shape
 * that does NOT match the dsl `Action` discriminator and is rejected by
 * `validateScene` with "unknown action type: 'text'".
 *
 * The right place to bridge those two shapes is the storage boundary, not every
 * producer. We unwrap the chat-shape here, drop clearly-malformed entries, and
 * fall back to a `speech` action (with the raw payload as the spoken text) when
 * the type is unrecognizable. The dsl validateScene then passes and the user
 * sees a recoverable result instead of "Failed to flush pending stage changes".
 *
 * Pure: never mutates the input. Returns a fresh actions array.
 */
import { ACTION_TYPES } from '@openmaic/dsl';

const VALID_ACTION_TYPES: ReadonlySet<string> = new Set(ACTION_TYPES);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

/**
 * Best-effort salvage of a single action-shaped object. Returns a sanitized
 * action, or `null` if the entry is unrecognizable as any action (caller drops).
 */
function sanitizeOne(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null;
  const out: Record<string, unknown> = { ...raw };
  const t = out.type;

  // Chat-shape `text` item → dsl `speech` action (content moves to `text`).
  if (t === 'text') {
    const text = nonEmptyString(out.content);
    if (!text) return null;
    out.type = 'speech';
    out.text = text;
    delete out.content;
    return out;
  }

  // Chat-shape `action` item → dsl action (params are spread onto the action).
  if (t === 'action') {
    const name = nonEmptyString(out.name);
    if (!name) return null;
    const params = isObject(out.params) ? out.params : {};
    delete out.type;
    delete out.name;
    delete out.params;
    delete out.tool_name;
    delete out.parameters;
    return { id: typeof out.id === 'string' ? out.id : `action_sanitized`, type: name, ...params };
  }

  // Already a dsl-shape action whose type we recognize: pass through, but
  // strip chat-only leftovers so the validator doesn't trip on stray fields.
  if (typeof t === 'string' && VALID_ACTION_TYPES.has(t)) {
    delete out.tool_name;
    delete out.tool_id;
    delete out.parameters;
    if (t === 'widget_setState' && out.state == null) out.state = {};
    return out;
  }

  // Unknown type — degrade to speech rather than reject the whole scene. The
  // user keeps their work and the failure is observable in the console via the
  // plain-json-store warning that wraps every sanitized fallback.
  const fallback = nonEmptyString(out.text)
    ?? nonEmptyString(out.content)
    ?? (() => {
      try {
        return JSON.stringify(raw);
      } catch {
        return undefined;
      }
    })();
  if (!fallback) return null;
  out.type = 'speech';
  out.text = fallback;
  delete out.content;
  delete out.name;
  delete out.params;
  delete out.tool_name;
  delete out.tool_id;
  delete out.parameters;
  return out;
}

/**
 * Sanitize an actions array. Drops unrecognizable entries and remaps
 * chat-shape items to dsl-shape so the storage validator passes. Returns a
 * fresh array; the input is not mutated.
 */
export function sanitizeActions(actions: unknown): unknown[] {
  if (!Array.isArray(actions)) return [];
  const out: unknown[] = [];
  for (const item of actions) {
    const sanitized = sanitizeOne(item);
    if (sanitized !== null) out.push(sanitized);
  }
  return out;
}

/**
 * Walk an arbitrary scene-like object and sanitize its `actions` array in
 * place structurally (returning a fresh scene when `actions` was present).
 * Returns the input untouched when there is no `actions` field.
 */
export function sanitizeSceneActions<T extends Record<string, unknown>>(scene: T): T {
  if (!('actions' in scene)) return scene;
  const next = { ...scene, actions: sanitizeActions(scene.actions) };
  return next as T;
}
