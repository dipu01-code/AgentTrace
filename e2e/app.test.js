const { execFileSync } = require('child_process');
const { seedLoopingRun } = require('./seed');

const stamp = Date.now();
const email = `e2e-${stamp}@example.com`;
const runAName = `E2E A ${stamp}`;
const runBName = `E2E B ${stamp}`;
let runA;
let runB;

const tapText = (text, index = 0) => element(by.text(text)).atIndex(index).tap();
const isIOS = () => device.getPlatform() === 'ios';

// Open screens through real deep links (as if tapped in a browser).
const open = async (path) => {
  const url = `agenttrace://${path}`;
  if (isIOS()) {
    execFileSync('xcrun', ['simctl', 'openurl', device.id, url]);
    // iOS asks "Open in AgentTrace?" only when the app isn't already in front.
    await system.element(by.system.label('Open')).tap().catch(() => undefined);
  } else {
    execFileSync('adb', ['-s', device.id, 'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', url, 'com.agenttrace.app']);
  }
};

describe('AgentTrace', () => {
  beforeAll(async () => {
    runA = await seedLoopingRun(runAName);
    runB = await seedLoopingRun(runBName);
    if (isIOS()) {
      await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    } else {
      // Grant Android 13+ notification permission up front so its dialog doesn't cover the app.
      await device.uninstallApp();
      await device.installApp();
      execFileSync('adb', ['-s', device.id, 'shell', 'pm', 'grant', 'com.agenttrace.app', 'android.permission.POST_NOTIFICATIONS']);
      await device.launchApp({ newInstance: true });
    }
  });

  it('signs up and lands on the timeline', async () => {
    await waitFor(element(by.id('login-submit'))).toBeVisible().withTimeout(30000);
    await tapText('Create an account');
    await waitFor(element(by.id('signup-email'))).toBeVisible().withTimeout(10000);
    // replaceText skips the keyboard, so iOS AutoFill suggestions can't cover the button.
    await element(by.id('signup-email')).replaceText(email);
    await element(by.id('signup-password')).replaceText('secret123');
    await element(by.id('signup-password')).tapReturnKey(); // closes the iOS strong-password panel
    await element(by.id('signup-submit')).tap();
    await waitFor(element(by.id('timeline-list'))).toBeVisible().withTimeout(15000);
  });

  it('opens a seeded run from the timeline and its graph', async () => {
    await waitFor(element(by.id(`run-card-${runAName}`)))
      .toBeVisible()
      .whileElement(by.id('timeline-list'))
      .scroll(300, 'down');
    await element(by.id(`run-card-${runAName}`)).tap();
    await waitFor(element(by.id('tool-GraphView'))).toBeVisible().withTimeout(10000);
    await element(by.id('tool-GraphView')).tap();
    await waitFor(element(by.text('Planner → Searcher'))).toExist().withTimeout(10000);
  });

  it('detects the planner/searcher loop', async () => {
    await open(`run/${runA.id}/loops`);
    await waitFor(element(by.text('1 repeating cycle(s)'))).toBeVisible().withTimeout(10000);
  });

  it('replays the run to the end', async () => {
    await open(`run/${runA.id}/replay`);
    await waitFor(element(by.id('replay-play'))).toBeVisible().withTimeout(10000);
    await element(by.id('replay-play')).tap();
    await waitFor(element(by.text('#8 of 8'))).toBeVisible().withTimeout(20000);
  });

  it('shows state diffs and bloat', async () => {
    await open(`run/${runA.id}/diffs`);
    await waitFor(element(by.text('plan.step'))).toBeVisible().withTimeout(10000);
    await open(`run/${runA.id}/bloat`);
    await waitFor(element(by.text('Minor bloat'))).toExist().withTimeout(10000);
  });

  it('confirms two identical runs are deterministic', async () => {
    await open(`compare/${runA.id}/${runB.id}`);
    await waitFor(element(by.text('✓ Deterministic'))).toBeVisible().withTimeout(10000);
  });

  it('exports a debug session', async () => {
    await open(`run/${runA.id}/export`);
    await waitFor(element(by.text('Export session'))).toBeVisible().withTimeout(10000);
    await tapText('Export session');
    await waitFor(element(by.id('export-result'))).toBeVisible().withTimeout(10000);
  });

  it('runs a regression test that passes', async () => {
    await open('regression');
    await waitFor(element(by.text(`${runAName} · 8`)).atIndex(0)).toExist().withTimeout(10000);
    await tapText(`${runAName} · 8`); // baseline picker
    await tapText(`${runBName} · 8`, 1); // comparison picker (index 0 is in the baseline picker)
    await tapText('Run test');
    // Earlier runs leave other PASS rows, so look for this run's result line.
    await waitFor(element(by.text(`${runAName} → ${runBName}`))).toBeVisible().withTimeout(10000);
    await expect(element(by.text('PASS')).atIndex(0)).toBeVisible();
  });

  it('switches theme and signs out', async () => {
    await open('settings');
    await waitFor(element(by.text('Light'))).toBeVisible().withTimeout(10000);
    await tapText('Light');
    await tapText('Dark');
    await tapText('System');
    await tapText('Sign out');
    await waitFor(element(by.id('login-submit'))).toBeVisible().withTimeout(10000);
  });
});
