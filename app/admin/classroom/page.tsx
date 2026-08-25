'use client';

/**
 * M2 admin route — `/admin/classroom` (plan §Task 5 / global constraint 13).
 *
 * Renders the seat-layout editor when the classroom shell feature flag
 * is on and the current user has the `admin` role (placeholder check —
 * real auth is out of scope for V1.1, so we read `userRole` from
 * localStorage and gate on that). Both gates return `null` / a 403
 * message; this is a UI-only editor so a redirect is not appropriate.
 */

import { useEffect, useState } from 'react';
import { SeatLayoutEditor } from '@/components/admin/seat-layout-editor';
import { isClassroomShellEnabled } from '@/lib/config/feature-flags';
import { useStageStore } from '@/lib/store/stage';

function readAdminRole(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('userRole') === 'admin';
  } catch {
    return false;
  }
}

export default function AdminClassroomPage() {
  // SSR-safe gate: only consult localStorage on the client. The initial
  // render shows a neutral loading hint to avoid hydration flicker; the
  // effect below flips to the editor or the 403 panel. Both `isAdmin`
  // and `resolved` are always declared so the `useStageStore` call below
  // is unconditional (Rules of Hooks).
  const [isAdmin, setIsAdmin] = useState(false);
  const [resolved, setResolved] = useState(false);
  // Pull seatLayout purely for the read-only summary line shown above
  // the editor — the editor itself owns its own subscription via
  // `useStageStore(s => s.classroom.seatLayout)`.
  const layout = useStageStore((s) => s.classroom.seatLayout);

  useEffect(() => {
    setIsAdmin(readAdminRole());
    setResolved(true);
  }, []);

  if (!isClassroomShellEnabled()) return null;

  if (!resolved) {
    return (
      <main className="admin-classroom admin-classroom--loading" data-testid="admin-classroom-loading">
        <p>Loading admin panel…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-classroom admin-classroom--forbidden" data-testid="admin-classroom-forbidden">
        <h1>403 — admin role required</h1>
        <p>Set <code>localStorage.userRole = &quot;admin&quot;</code> to preview the editor.</p>
      </main>
    );
  }

  return (
    <main className="admin-classroom" data-testid="admin-classroom">
      <header className="admin-classroom__header">
        <h1>Seat layout editor</h1>
        <p data-testid="admin-classroom-summary">
          {layout.length} seat{layout.length === 1 ? '' : 's'} configured.
        </p>
      </header>
      <SeatLayoutEditor />
    </main>
  );
}