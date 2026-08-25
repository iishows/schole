// @vitest-environment jsdom
// Test environment note (mirrors Task 6 deviation in classroom-shell tests):
//   `@testing-library/react` is not a project dependency and the V1.1 plan
//   "DO NOT" list prohibits adding new deps, so we drive the component via
//   `react-dom/client.createRoot` + `act()` (already in `react-dom`) instead
//   of `render()` + `screen.getBy*`. Data-testid queries are written against
//   `container.querySelector(...)` directly.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { SeatLayoutEditor } from '../seat-layout-editor';
import { useStageStore } from '@/lib/store/stage';
import type { SeatConfig } from '@/lib/store/classroom-state';

// React's `act()` helper needs this global flag to silence the
// "not configured to support act(...)" warning under vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SEED_LAYOUT: SeatConfig[] = [
  { seat_id: 'A1', agent_id: 'a1', deskmates: ['a2'], zone: 'front' },
  { seat_id: 'A2', agent_id: 'a2', deskmates: ['a1', 'a3'], zone: 'front' },
  { seat_id: 'B1', agent_id: 'a3', deskmates: ['a2'], zone: 'middle' },
  { seat_id: 'C1', agent_id: 'a4', deskmates: [], zone: 'back' },
];

function setLayout(layout: SeatConfig[]): void {
  useStageStore.setState((s) => ({
    classroom: { ...s.classroom, seatLayout: layout },
  }) as any);
}

function fireChange(target: EventTarget | null, value: string): void {
  const el = target as HTMLSelectElement | null;
  if (!el) throw new Error('select element missing');
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    'value',
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function fireCheck(target: EventTarget | null, checked: boolean): void {
  const el = target as HTMLInputElement | null;
  if (!el) throw new Error('checkbox element missing');
  // Set the property via the native descriptor so React's onChange
  // handler (bound to the input value tracker) observes the mutation,
  // then dispatch a click event — React 18's checkbox change handler
  // runs off the bubbling click on the input element.
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'checked',
  )?.set;
  setter?.call(el, checked);
  el.dispatchEvent(new Event('click', { bubbles: true }));
}

describe('SeatLayoutEditor (M2 admin)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useStageStore.getState().resetClassroom?.();
    setLayout(SEED_LAYOUT);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders one row per seat with seat_id, zone, and deskmate controls', async () => {
    await act(async () => {
      root.render(<SeatLayoutEditor />);
    });
    // Use the explicit Apply-button testid list to derive the row count
    // — every row has exactly one `-apply` button so we get an exact
    // list of row keys without the prefix-match ambiguity of
    // `[data-testid^="seat-row-"]`.
    const applyButtons = container.querySelectorAll<HTMLButtonElement>(
      '[data-testid$="-apply"]',
    );
    const rowKeys = Array.from(applyButtons).map((btn) =>
      btn.dataset.testid?.replace(/-apply$/, ''),
    );
    expect(rowKeys.sort()).toEqual([
      'seat-row-A1',
      'seat-row-A2',
      'seat-row-B1',
      'seat-row-C1',
    ]);
    // Apply buttons start disabled (no draft → nothing dirty).
    applyButtons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });

  it('changing the zone dropdown enables Apply; clicking Apply writes through ClassroomLayoutService.overrideSeat', async () => {
    await act(async () => {
      root.render(<SeatLayoutEditor />);
    });

    const zoneSelect = container.querySelector<HTMLSelectElement>(
      '[data-testid="seat-row-A1-zone"]',
    );
    expect(zoneSelect).not.toBeNull();
    expect(zoneSelect?.value).toBe('front');

    // Flip A1 from 'front' to 'back'. Apply button must become enabled.
    await act(async () => {
      fireChange(zoneSelect, 'back');
    });

    const applyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="seat-row-A1-apply"]',
    );
    expect(applyBtn?.disabled).toBe(false);

    // Click Apply — ClassroomLayoutService.overrideSeat runs and the
    // store picks up the new zone.
    await act(async () => {
      applyBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const updated = useStageStore.getState().classroom.seatLayout;
    const a1 = updated.find((s) => s.seat_id === 'A1');
    expect(a1?.zone).toBe('back');
    // Other seats untouched.
    const a2 = updated.find((s) => s.seat_id === 'A2');
    expect(a2?.zone).toBe('front');
    const b1 = updated.find((s) => s.seat_id === 'B1');
    expect(b1?.zone).toBe('middle');

    // Apply button returns to disabled — draft cleared after commit.
    const applyAfter = container.querySelector<HTMLButtonElement>(
      '[data-testid="seat-row-A1-apply"]',
    );
    expect(applyAfter?.disabled).toBe(true);
  });

  it('toggling a deskmate checkbox then Apply updates that seat only', async () => {
    await act(async () => {
      root.render(<SeatLayoutEditor />);
    });

    // C1 starts with empty deskmates — add 'a1' as a new deskmate.
    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="seat-row-C1-deskmate-a1"]',
    );
    expect(checkbox).not.toBeNull();
    expect(checkbox?.checked).toBe(false);

    await act(async () => {
      fireCheck(checkbox, true);
    });

    const applyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="seat-row-C1-apply"]',
    );
    expect(applyBtn?.disabled).toBe(false);

    await act(async () => {
      applyBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const updated = useStageStore.getState().classroom.seatLayout;
    const c1 = updated.find((s) => s.seat_id === 'C1');
    expect(c1?.deskmates).toEqual(['a1']);

    // C1 was the only seat with empty deskmates — confirm neighbours are
    // untouched (overrideSeat is per-row, not layout-wide).
    const a1 = updated.find((s) => s.seat_id === 'A1');
    expect(a1?.deskmates).toEqual(['a2']);
    const a2 = updated.find((s) => s.seat_id === 'A2');
    expect(a2?.deskmates.sort()).toEqual(['a1', 'a3']);
    const b1 = updated.find((s) => s.seat_id === 'B1');
    expect(b1?.deskmates).toEqual(['a2']);
  });

  it('Regenerate from defaults button rewrites the layout via ClassroomLayoutService.autoGenerate', async () => {
    await act(async () => {
      root.render(<SeatLayoutEditor />);
    });

    const regenerateBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="seat-layout-editor-regenerate"]',
    );
    expect(regenerateBtn).not.toBeNull();

    await act(async () => {
      regenerateBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const updated = useStageStore.getState().classroom.seatLayout;
    expect(updated.map((s) => s.seat_id).sort()).toEqual(
      SEED_LAYOUT.map((s) => s.seat_id).sort(),
    );
    // autoGenerate assigns agents in input order against sorted seats;
    // verify the seed-seat ids get the first 4 default agent ids.
    expect(updated.find((s) => s.seat_id === 'A1')?.agent_id).toBe('a1');
    expect(updated.find((s) => s.seat_id === 'A2')?.agent_id).toBe('a2');
    expect(updated.find((s) => s.seat_id === 'B1')?.agent_id).toBe('a3');
    expect(updated.find((s) => s.seat_id === 'C1')?.agent_id).toBe('a4');
  });
});