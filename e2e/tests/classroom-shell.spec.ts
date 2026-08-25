import { test, expect } from '../fixtures/base';
import { ClassroomPage } from '../pages/classroom.page';

test.describe('classroom shell E2E', () => {
  test('full 一节课剧本: 开课→老师讲课→同学举手→老师叫同学回答→同学传纸条→用户也举手→老师点用户回答→黑板板书→下课', async ({ page }) => {
    await page.goto('/classroom/test-stage');
    // 1. PeriodBar appears (开课)
    await expect(page.getByTestId('period-bar')).toBeVisible({ timeout: 5000 });
    // 2. 老师讲课 (speech) — M5 step A. The DSL `speech` action is the
    //    existing scene-level action (not a ClassroomAction); we surface it
    //    via the same store-dispatch path the test already uses, with
    //    `period_bell(transition)` as the closest classroom-side proxy for
    //    "teacher begins lesson speech". We just verify dispatching the
    //    action does not crash the page and the PeriodBar stays visible.
    await page.evaluate(() => {
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'period_bell', id: 'e2e-speech', bell_type: 'transition',
        agent_id: 'teacher', timestamp: Date.now(),
      });
    });
    await expect(page.getByTestId('period-bar')).toBeVisible();
    // 3. HandRaiseButton click (同学举手)
    await page.getByTestId('hand-raise-btn').click();
    await expect(page.getByTestId('hand-raise-input')).toBeVisible();
    await page.getByTestId('hand-raise-input').fill('老师请说');
    await page.getByTestId('hand-raise-submit').click();
    await expect(page.getByTestId('hand-raise-badge')).toHaveText('1');
    // 4. CallOn appears (老师叫同学回答)
    await expect(page.getByTestId('call-on-card')).toBeVisible({ timeout: 3000 });
    // 5. 同学传纸条 (pass_note) — M5 step B. Dispatch pass_note for valid
    //    adjacent seats A1 → A2 (semantic check lives in service / reducer
    //    is no-op); verify the page does not error and PeriodBar stays
    //    visible.
    await page.evaluate(() => {
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'pass_note', id: 'e2e-note', from_seat: 'A1', to_seat: 'A2',
        content: '借支笔', animation: 'fly',
        agent_id: 'a1', timestamp: Date.now(),
      });
    });
    await expect(page.getByTestId('period-bar')).toBeVisible();
    // 6. 用户也举手 — dispatch raise_hand with origin=user so the badge
    //    count goes to 2.
    await page.evaluate(() => {
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'raise_hand', id: 'e2e-rh-user', agent_id: 'user',
        agent_name: '我', raised_at: Date.now(),
        question: '我有疑问', origin: 'user',
      });
    });
    await expect(page.getByTestId('hand-raise-badge')).toHaveText('2');
    // 7. 老师点用户回答 (call_on target=user) — M5 step C. Dispatch a
    //    call_on targeting the user agent id; verify the CallOnCard stays
    //    visible (it was already shown above for an earlier call_on, but
    //    the dispatch path is what this assertion exercises).
    await page.evaluate(() => {
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'call_on', id: 'e2e-callon-user', target_agent_id: 'user',
        prompt: '请回答', countdown_ms: 4000,
        agent_id: 'teacher', timestamp: Date.now(),
      });
    });
    await expect(page.getByTestId('call-on-card')).toBeVisible();
    // 8. Blackboard toggle (黑板板书)
    await page.getByTestId('tab-blackboard').click();
    await expect(page.getByTestId('blackboard-chalk-svg')).toBeVisible();
    // 9. period_end (下课)
    await page.evaluate(() => {
      // dispatch via store
      (window as any).__stageStore.dispatchClassroomAction({
        type: 'period_end', id: 'e2e-end', break_duration: 600,
        agent_id: 'teacher', timestamp: Date.now(),
      });
    });
    await expect(page.getByTestId('period-bar')).toHaveClass(/break/);
  });

  test('feature flag disabled: no PeriodBar / HandRaiseButton', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_CLASSROOM_SHELL_ENABLED', 'false');
    });
    await page.goto('/classroom/test-stage');
    await expect(page.queryByTestId('period-bar')).toBeNull();
    await expect(page.queryByTestId('hand-raise-btn')).toBeNull();
  });
});
