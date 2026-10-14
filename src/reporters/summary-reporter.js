import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line no-control-regex -- matching the ESC char is the point: strips terminal colours
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDuration = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

/**
 * Custom Playwright reporter that produces a one-page execution summary:
 * totals, pass rate, per-project breakdown, and for each failure the reason + screenshot.
 * Output: <outputDir>/summary.html and <outputDir>/summary.json, plus a console table.
 *
 * @implements {import('@playwright/test/reporter').Reporter}
 */
export default class SummaryReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'reports/summary';
  }

  onBegin(config, suite) {
    this.rootSuite = suite;
    this.startTime = Date.now();
  }

  printsToStdio() {
    return false;
  }

  async onEnd(result) {
    const tests = this.rootSuite.allTests();
    // Nothing executed (e.g. `--list`): keep the previous summary.
    if (!tests.some((test) => test.results.length)) return;
    const records = tests.map((test) => this.toRecord(test));

    const count = (outcome) => records.filter((r) => r.outcome === outcome).length;
    const totals = {
      total: records.length,
      passed: count('passed'),
      failed: count('failed'),
      flaky: count('flaky'),
      skipped: count('skipped'),
    };
    const executed = totals.total - totals.skipped;
    totals.passRate = executed
      ? (((totals.passed + totals.flaky) / executed) * 100).toFixed(1)
      : '0.0';

    const byProject = {};
    for (const r of records) {
      byProject[r.project] ??= { passed: 0, failed: 0, flaky: 0, skipped: 0 };
      byProject[r.project][r.outcome] += 1;
    }

    const summary = {
      status: result.status,
      startedAt: new Date(this.startTime).toISOString(),
      duration: formatDuration(Date.now() - this.startTime),
      totals,
      byProject,
      failures: records.filter((r) => r.outcome === 'failed' || r.outcome === 'flaky'),
    };

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(this.outputDir, 'summary.json'),
      JSON.stringify(
        {
          ...summary,
          failures: summary.failures.map(({ screenshots, ...rest }) => ({
            ...rest,
            screenshots: screenshots.map((s) => s.path),
          })),
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(path.join(this.outputDir, 'summary.html'), this.renderHtml(summary));
    this.printConsole(summary);
  }

  toRecord(test) {
    const outcomeMap = {
      expected: 'passed',
      unexpected: 'failed',
      flaky: 'flaky',
      skipped: 'skipped',
    };
    const lastResult = test.results.at(-1);
    const failedResult = test.results.find((r) => r.status === 'failed' || r.status === 'timedOut');
    const evidence = failedResult || lastResult;

    const screenshots = (evidence?.attachments || [])
      .filter((a) => a.contentType === 'image/png' && a.path && fs.existsSync(a.path))
      .map((a) => ({ path: a.path, base64: fs.readFileSync(a.path).toString('base64') }));

    return {
      title: test.titlePath().slice(3).join(' › '),
      project: test.parent.project()?.name || 'default',
      file: `${path.relative(process.cwd(), test.location.file)}:${test.location.line}`,
      outcome: outcomeMap[test.outcome()],
      retries: Math.max(test.results.length - 1, 0),
      duration: formatDuration(lastResult?.duration || 0),
      error: (evidence?.error?.message || '').replace(ANSI_PATTERN, ''),
      screenshots,
    };
  }

  printConsole({ totals, duration, failures }) {
    const line = '─'.repeat(52);
    const out = [
      '',
      line,
      ' TEST EXECUTION SUMMARY',
      line,
      ` Total: ${totals.total}   Passed: ${totals.passed}   Failed: ${totals.failed}   Flaky: ${totals.flaky}   Skipped: ${totals.skipped}`,
      ` Pass rate: ${totals.passRate}%   Duration: ${duration}`,
    ];
    for (const f of failures.filter((x) => x.outcome === 'failed')) {
      out.push(` ✘ [${f.project}] ${f.title}`, `     ${f.error.split('\n')[0]}`);
    }
    out.push(` Report: ${path.join(this.outputDir, 'summary.html')}`, line, '');
    console.log(out.join('\n'));
  }

  renderHtml({ status, startedAt, duration, totals, byProject, failures }) {
    const projectRows = Object.entries(byProject)
      .map(
        ([name, c]) =>
          `<tr><td>${escapeHtml(name)}</td><td class="pass">${c.passed}</td><td class="fail">${c.failed}</td><td class="flaky">${c.flaky}</td><td>${c.skipped}</td></tr>`,
      )
      .join('');

    const failureCards = failures.length
      ? failures
          .map(
            (f) => `
      <div class="card ${f.outcome}">
        <h3>${f.outcome === 'flaky' ? '⚠ FLAKY' : '✘ FAILED'} — ${escapeHtml(f.title)}</h3>
        <p><b>Project:</b> ${escapeHtml(f.project)} &nbsp; <b>Location:</b> ${escapeHtml(f.file)} &nbsp; <b>Retries:</b> ${f.retries}</p>
        <p><b>Reason:</b></p><pre>${escapeHtml(f.error || 'No error message captured')}</pre>
        ${f.screenshots.map((s) => `<img alt="failure screenshot" src="data:image/png;base64,${s.base64}">`).join('')}
      </div>`,
          )
          .join('')
      : '<p class="pass">No failures 🎉</p>';

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Test Execution Summary</title>
<style>
  body{font-family:system-ui,sans-serif;margin:2rem;color:#222}
  .tiles{display:flex;gap:1rem;flex-wrap:wrap}
  .tile{padding:1rem 1.5rem;border-radius:8px;background:#f3f4f6;min-width:110px;text-align:center}
  .tile b{display:block;font-size:2rem}
  .pass{color:#15803d}.fail{color:#b91c1c}.flaky{color:#b45309}
  table{border-collapse:collapse;margin-top:1rem}td,th{border:1px solid #ddd;padding:.4rem .8rem}
  .card{border-left:6px solid #b91c1c;background:#fef2f2;padding:1rem;margin:1rem 0;border-radius:4px}
  .card.flaky{border-color:#b45309;background:#fffbeb}
  pre{white-space:pre-wrap;background:#fff;padding:.75rem;border:1px solid #eee;overflow:auto}
  img{max-width:640px;border:1px solid #ccc;display:block;margin-top:.5rem}
</style></head><body>
<h1>Test Execution Summary</h1>
<p>Status: <b class="${status === 'passed' ? 'pass' : 'fail'}">${escapeHtml(status.toUpperCase())}</b> · Started: ${escapeHtml(startedAt)} · Duration: ${escapeHtml(duration)}</p>
<div class="tiles">
  <div class="tile">Total<b>${totals.total}</b></div>
  <div class="tile pass">Passed<b>${totals.passed}</b></div>
  <div class="tile fail">Failed<b>${totals.failed}</b></div>
  <div class="tile flaky">Flaky<b>${totals.flaky}</b></div>
  <div class="tile">Skipped<b>${totals.skipped}</b></div>
  <div class="tile">Pass rate<b>${totals.passRate}%</b></div>
</div>
<h2>By project</h2>
<table><tr><th>Project</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th></tr>${projectRows}</table>
<h2>Failures &amp; flaky tests</h2>
${failureCards}
</body></html>`;
  }
}
