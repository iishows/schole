import { test, expect } from '../fixtures/base';
import { ClassroomPage } from '../pages/classroom.page';

test.describe('classroom shell E2E', () => {
  test('full 一节课剧本: 开课→举手→叫答→传纸条→白板→下课', async ({ page }) => {
    await page.goto('/classroom/test-stage');
    // 1. PeriodBar appears
    await expect(page.getByTestId('period-bar')).toBeVisible({ timeout: 5000 });
    // 2. HandRaiseButton click
    await page.getByTestId('hand-raise-btn').click();
    await expect(page.getByTestId('hand-raise-input')).toBeVisible();
    await page.getByTestId('hand-raise-input').fill('老师请说');
    await page.getByTestId('hand-raise-submit').click();
    await expect(page.getByTestId('hand-raise-badge')).toHaveText('1');
    // 3. CallOn appears
    await expect(page.getByTestId('call-on-card')).toBeVisible({ timeout: 3000 });
    // 4. Blackboard toggle
    await page.getByTestId('tab-blackboard').click();
    await expect(page.getByTestId('blackboard-chalk-svg')).toBeVisible();
    // 5. period_end
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
