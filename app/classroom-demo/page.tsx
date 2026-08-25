'use client';

/**
 * B.1.2 — `/classroom-demo` route.
 *
 * Mirrors the B.1 `/classroom-front-snapshot-fixture` route in shape
 * but flips the data source: every page load generates a NEW random
 * classroom (5–8 students, random lesson, random teacher speech,
 * random desk bubbles, random chalk strokes, random hand-raise
 * queue, etc.).
 *
 * Two facts to keep in mind:
 *
 *   1. The fixture route is FROZEN — it stays hand-picked so the
 *      Playwright snapshot baselines stay reproducible. This route is
 *      the opposite: every refresh is fresh.
 *   2. The store-driven `classroom` slice keeps its B.1 shape; the
 *      per-desk dynamic data (bubble content / hand-raise flag /
 *      display name) is forwarded into `<ClassroomFront />` via props
 *      so we don't have to extend `ClassroomState`.
 */

import { useEffect, useState } from 'react';
import { ClassroomFront } from '@/components/classroom-shell/front';
import { isClassroomFrontEnabled } from '@/lib/config/feature-flags';
import { useStageStore } from '@/lib/store/stage';
import {
  generateDemoClassroomState,
  type DemoDynamicContent,
} from '@/lib/classroom/demo-data-generator';

export default function ClassroomDemoPage() {
  const enabled = isClassroomFrontEnabled();

  // Bump a render key on every mount to guarantee a fresh seed even
  // when StrictMode double-invokes effects.
  const [renderKey, setRenderKey] = useState(0);
  const [seed, setSeed] = useState<number | null>(null);
  const [dynamic, setDynamic] = useState<DemoDynamicContent | null>(null);

  useEffect(() => {
    // Generate fresh data on every mount.
    const gen = generateDemoClassroomState();
    setSeed(gen.seed);
    setDynamic(gen.dynamic);

    if (!enabled) return;

    // Seed the store. We intentionally bypass the persistence-marking
    // path here because this is a transient visual demo — we don't
    // want every refresh to schedule an IndexedDB write. The same
    // pattern is used by the snapshot fixture route.
    useStageStore.setState({
      classroom: gen.classroom,
    });
  }, [renderKey, enabled]);

  // Re-generate on demand (manual refresh button).
  const handleRefresh = () => {
    setRenderKey((k) => k + 1);
  };

  if (!enabled) {
    return (
      <div
        data-testid="classroom-demo"
        data-front-disabled="true"
        style={{
          width: 1280,
          minHeight: 800,
          padding: 24,
          color: '#999',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        front-view flag is OFF — start dev server with NEXT_PUBLIC_CLASSROOM_FRONT_ENABLED=true.
      </div>
    );
  }

  return (
    <div
      data-testid="classroom-demo"
      data-demo-seed={seed ?? 'pending'}
      style={{
        position: 'relative',
        width: 1280,
        minHeight: 800,
        background: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <ClassroomFront
        teacherBubbleContent={dynamic?.teacherBubble}
        deskBubbleContents={dynamic?.deskByAgentId
          ? Object.fromEntries(
              Object.entries(dynamic.deskByAgentId).map(([agentId, v]) => [
                agentId,
                v.bubbleContent ?? '',
              ]),
            )
          : undefined}
        deskHandRaised={dynamic?.deskByAgentId
          ? Object.fromEntries(
              Object.entries(dynamic.deskByAgentId).map(([agentId, v]) => [
                agentId,
                v.handRaised,
              ]),
            )
          : undefined}
        activeCallOnAgentId={dynamic?.activeCallOnAgentId ?? null}
      />
      <button
        type="button"
        onClick={handleRefresh}
        data-testid="classroom-demo-refresh"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          padding: '6px 14px',
          borderRadius: 6,
          border: '1px solid #5d3a1f',
          background: '#fffbeb',
          color: '#1f1d2e',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        换一换 🎲
      </button>
    </div>
  );
}
