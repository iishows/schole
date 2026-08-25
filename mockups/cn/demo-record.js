// Playwright 多角色录制：依次录家长 / 孩子 / 管理员 / 客服 4 个 SOP 视频
// 用法：node demo-record.js
// 输出：
//   videos/demo-parent.mp4 + demo-parent.gif
//   videos/demo-child.mp4 + demo-child.gif
//   videos/demo-admin.mp4 + demo-admin.gif
//   videos/demo-support.mp4 + demo-support.gif
//   videos/demo-flow.mp4 (回退: 30 步完整版)

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const MOCKUPS_DIR = path.resolve(__dirname);
const VIDEOS_DIR = path.join(MOCKUPS_DIR, 'videos');
const VIEWPORT = { width: 1280, height: 800 };

// 4 个角色配置 + 1 classroom mode
const roles = [
  {
    name: 'parent',
    cn: '家长',
    flowFile: 'demo-flow-parent.html',
    outputMp4: 'demo-parent.mp4',
    outputGif: 'demo-parent.gif',
    introText: '家长端 SOP 流程',
    durations: { default: 5000 }, // 14 步 × 5s ≈ 70s
  },
  {
    name: 'child',
    cn: '孩子',
    flowFile: 'demo-flow-child.html',
    outputMp4: 'demo-child.mp4',
    outputGif: 'demo-child.gif',
    introText: '孩子端 K12 SOP 流程',
    durations: { default: 6000 }, // 6 步 × 6s ≈ 36s (错题讲解需要看久一些)
  },
  {
    name: 'admin',
    cn: '管理员',
    flowFile: 'demo-flow-admin.html',
    outputMp4: 'demo-admin.mp4',
    outputGif: 'demo-admin.gif',
    introText: '管理员 SOP 流程',
    durations: { default: 5000 }, // 7 步 × 5s ≈ 35s
  },
  {
    name: 'support',
    cn: '客服',
    flowFile: 'demo-flow-support.html',
    outputMp4: 'demo-support.mp4',
    outputGif: 'demo-support.gif',
    introText: '客服 SOP 流程',
    durations: { default: 5000 }, // 3 步 × 5s ≈ 15s
  },
  {
    name: 'classroom',
    cn: 'Classroom',
    flowFile: 'demo-flow-classroom.html',
    outputMp4: 'demo-classroom.mp4',
    outputGif: 'demo-classroom.gif',
    introText: 'Classroom Mode V1 (CW1-CW5 + Master)',
    durations: { default: 6000 }, // 6 步（5 个 CW + master）≈ 38s
  },
];

async function recordRole(browser, role) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎬 录制：${role.cn}（${role.name}）`);
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: VIDEOS_DIR,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();

  // 打开对应角色的 demo-flow
  const flowUrl = `file:///${path.join(MOCKUPS_DIR, role.flowFile).replace(/\\/g, '/')}`;
  console.log(`📺 打开：${flowUrl}`);
  await page.goto(flowUrl);
  await page.waitForTimeout(2000); // 等待加载

  // 监听步骤切换
  let currentStep = 1;
  let totalSteps = await page.evaluate(() => {
    const el = document.querySelector('.ctrl-progress-text');
    if (el) {
      const m = el.textContent.match(/\d+\s*\/\s*(\d+)/);
      return m ? parseInt(m[1]) : 0;
    }
    return 0;
  });

  console.log(`📊 总步骤：${totalSteps}`);

  // 监听 iframe src 变化来跟踪步骤进度
  let lastSrc = '';
  const startTime = Date.now();
  let stepsDone = 0;

  while (Date.now() - startTime < 180000) { // 180 秒硬上限
    const frameSrc = await page.evaluate(() => {
      const f = document.querySelector('iframe');
      return f ? f.src : '';
    });

    if (frameSrc !== lastSrc && frameSrc !== '') {
      lastSrc = frameSrc;
      stepsDone++;
      const stepName = frameSrc.split('/').pop().replace('.html', '');
      console.log(`  ✅ 步骤 ${stepsDone}/${totalSteps}：${stepName}`);
    }

    // 检查播放完成（按钮变为"播放"）
    const playing = await page.evaluate(() => {
      const btn = document.getElementById('playBtn');
      return btn && btn.textContent.includes('播放');
    });

    if (playing && stepsDone > 0) {
      console.log('🎬 播放完成');
      break;
    }

    await page.waitForTimeout(500);
  }

  // 额外 2 秒停留
  await page.waitForTimeout(2000);

  await context.close(); // 触发视频保存

  // 找出最新生成的 webm
  const videoFiles = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    console.error(`❌ [${role.name}] 未生成视频`);
    return null;
  }

  const latestWebm = videoFiles
    .map(f => ({ name: f, time: fs.statSync(path.join(VIDEOS_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time)[0].name;

  const webmPath = path.join(VIDEOS_DIR, latestWebm);
  const mp4Path = path.join(VIDEOS_DIR, role.outputMp4);

  console.log(`🔄 转换 WebM → MP4 (${role.outputMp4})...`);
  try {
    execSync(
      `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`,
      { stdio: 'inherit' }
    );
    fs.unlinkSync(webmPath);
    console.log(`✅ MP4 完成：${mp4Path}`);
  } catch (e) {
    console.error(`❌ [${role.name}] ffmpeg 转 MP4 失败：`, e.message);
    console.log(`💡 WebM 保留在：${webmPath}`);
    return null;
  }

  // 生成 GIF 预览
  const gifPath = path.join(VIDEOS_DIR, role.outputGif);
  console.log(`🖼️ 生成 GIF 预览...`);
  try {
    // 用 ffmpeg 生成 10fps 缩放 GIF
    execSync(
      `ffmpeg -y -i "${mp4Path}" -vf "fps=10,scale=640:-1:flags=lanczos" -t 60 "${gifPath}"`,
      { stdio: 'pipe' }
    );
    console.log(`✅ GIF 完成：${gifPath}`);
  } catch (e) {
    console.warn(`⚠️ [${role.name}] GIF 生成失败（可忽略）：`, e.message);
  }

  return mp4Path;
}

(async () => {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  console.log(`📁 输出目录：${VIDEOS_DIR}`);
  console.log(`🌐 视窗：${VIEWPORT.width}×${VIEWPORT.height}`);

  console.log('\n🚀 启动 Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];
  for (const role of roles) {
    const mp4 = await recordRole(browser, role);
    results.push({ name: role.name, mp4, success: !!mp4 });
  }

  await browser.close();

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 录制汇总');
  console.log(`${'='.repeat(60)}`);
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const size = r.mp4 && fs.existsSync(r.mp4)
      ? `${(fs.statSync(r.mp4).size / 1024 / 1024).toFixed(2)} MB`
      : '—';
    console.log(`  ${status} ${r.name.padEnd(10)} ${size}`);
  });

  console.log('\n🎉 全部完成！');
  console.log('\n📂 视频位置：');
  results.forEach(r => {
    if (r.mp4) console.log(`  - ${r.mp4}`);
  });
})();
