// B.1.5 — Chrome CDP verification.
//
// Goals:
//   1. Navigate to /classroom-demo.
//   2. Resize the viewport to 1920x1080.
//   3. Take a fullscreen-confirmation screenshot (initial dashboard view).
//   4. Click each of the 3 view-tabs (📝 whiteboard / 🏫 classroom /
//      📊 dashboard) and take a screenshot per tab.
//   5. Save all 4 screenshots to .verify/classroom-demo-b15/.
//
// CDP endpoint: 127.0.0.1:9222 (user's real Chrome, see
// `chrome --remote-debugging-port=9222`).

const path = require('path');
const fs = require('fs');
const CDP = require('C:/Users/Administrator/AppData/Local/Temp/node_modules/chrome-remote-interface');

const OUT_DIR = path.resolve('./.verify/classroom-demo-b15');
const URL = 'http://localhost:3000/classroom-demo';
const TARGET_W = 1920;
const TARGET_H = 1080;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let client;
  try {
    client = await CDP({ host: '127.0.0.1', port: 9222 });
  } catch (err) {
    console.error('CDP connect failed:', err.message);
    process.exit(1);
  }
  const { Page, Runtime, Emulation } = client;
  await Page.enable();
  await Runtime.enable();
  await Emulation.setDeviceMetricsOverride({
    width: TARGET_W,
    height: TARGET_H,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await Page.navigate({ url: URL });
  await Page.loadEventFired();
  await new Promise((r) => setTimeout(r, 1800));

  const dump = async (label) => {
    const r = await Runtime.evaluate({
      expression: `(() => {
        const shell = document.querySelector('[data-testid="demo-shell"]');
        const view = shell ? shell.getAttribute('data-view') : null;
        const whiteboardView = document.querySelector('[data-testid="whiteboard-fullscreen-view"]');
        const classroomFront = document.querySelector('[data-testid="classroom-front"]');
        const rightCol = document.querySelector('[data-testid="demo-right-column"]');
        const chat = document.querySelector('[data-testid="demo-chat-history"]');
        const desks = document.querySelector('[data-testid="front-desks"]');
        const teacherStage = document.querySelector('[data-testid="teacher-stage"]');
        const blackboard = document.querySelector('[data-testid="front-blackboard"]');
        const demoRoot = document.querySelector('[data-testid="classroom-demo"]');
        const rootRect = demoRoot ? demoRoot.getBoundingClientRect() : null;
        const innerW = window.innerWidth;
        const innerH = window.innerHeight;
        return JSON.stringify({
          label: ${JSON.stringify(label)},
          shellView: view,
          hasWhiteboardView: !!whiteboardView,
          hasClassroomFront: !!classroomFront,
          hasRightCol: !!rightCol,
          hasChat: !!chat,
          hasDesks: !!desks,
          hasTeacher: !!teacherStage,
          hasBlackboard: !!blackboard,
          rootRect: rootRect
            ? { w: Math.round(rootRect.width), h: Math.round(rootRect.height) }
            : null,
          viewport: { w: innerW, h: innerH },
        });
      })()`,
      returnByValue: true,
    });
    return r.result.value;
  };

  const snap = async (name) => {
    const s = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, name), Buffer.from(s.data, 'base64'));
    console.log('  saved', name);
  };

  const clickTab = async (id) => {
    await Runtime.evaluate({
      expression: `document.querySelector('[data-testid="demo-view-tab-${id}"]').click()`,
    });
    await new Promise((r) => setTimeout(r, 500));
  };

  // 1) Fullscreen confirmation: page fills the viewport, default = dashboard.
  console.log('[1] fullscreen confirmation (dashboard view)');
  console.log('  state:', await dump('fullscreen'));
  await snap('resize-1920x1080.png');

  // 2) Whiteboard view
  console.log('[2] clicking 📝 whiteboard tab');
  await clickTab('whiteboard');
  console.log('  state:', await dump('whiteboard'));
  await snap('view-whiteboard.png');

  // 3) Classroom view
  console.log('[3] clicking 🏫 classroom tab');
  await clickTab('classroom');
  console.log('  state:', await dump('classroom'));
  await snap('view-classroom.png');

  // 4) Dashboard view
  console.log('[4] clicking 📊 dashboard tab');
  await clickTab('dashboard');
  console.log('  state:', await dump('dashboard'));
  await snap('view-dashboard.png');

  console.log('done — 4 screenshots written to', OUT_DIR);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
