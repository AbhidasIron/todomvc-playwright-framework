# Interview Guide: Playwright Automation Framework

Questions are grouped by topic and point back to the code in this repo, so you can say "in my framework I did X because Y." Answers are written to be **spoken**: short, concrete, with a reason.

---

## 0. The 2-minute pitch ("Tell me about your framework")

> "I built an end-to-end framework for a React TodoMVC app using **Playwright with JavaScript**. It follows a layered design: **config**, a **framework layer** with Page Objects, Component Objects, custom fixtures, test data and utilities, and a thin **test layer** that only has scenarios and assertions.
>
> It covers about **80 functional scenarios**: add, edit, complete, delete, filters with hash routing, counter, clear completed, localStorage persistence, and edge cases like unicode, 500-char input and XSS. They run on **Chromium, Firefox and WebKit**, with smoke tests on **mobile emulation**. On top of that there's an **accessibility** suite with axe-core and keyboard-only tests, **visual regression** with Playwright screenshots, and a **BDD** layer using playwright-bdd so business people can read the Gherkin while we keep Playwright's runner.
>
> For reporting I use the Playwright HTML report, **Allure**, JUnit for CI, and a **custom reporter** I wrote that produces a single HTML summary: pass/fail counts, pass rate, and for every failure the reason plus an embedded screenshot.
>
> Quality is enforced with **ESLint** (including the Playwright plugin that bans hard waits), **Prettier**, and **Husky** pre-commit hooks. Everything runs in the official Playwright **Docker** image, in **GitHub Actions** with a per-browser matrix and Allure published to Pages, and in **Jenkins** with parameterised suites and a nightly schedule.
>
> The suite also found real issues: WCAG colour-contrast failures, which I track as a known defect with `test.fail()` so we're alerted when it's fixed."

---

## 1. Playwright fundamentals

**Q1. What is Playwright and why choose it over Selenium?**
A. Playwright is Microsoft's open-source browser automation library and test runner. It drives Chromium, Firefox and WebKit through one API. Advantages over Selenium: **auto-waiting** (no explicit waits), **web-first assertions** that retry, a built-in runner with **parallelism, fixtures, retries, reporters**, **tracing**, **network interception**, multiple tabs/contexts/origins, and it's faster because it talks to browsers over a persistent WebSocket (CDP for Chromium, patched protocols for Firefox and WebKit) instead of HTTP WebDriver calls. Selenium still wins on exotic real-browser coverage and language ecosystem maturity.

**Q2. Playwright vs Cypress?**
A. Cypress runs inside the browser and is great DX for single-origin apps, but historically has limits: one tab, cross-origin restrictions, experimental WebKit, and parallelism only via its paid dashboard. Playwright runs out-of-process, handles multiple tabs/origins/contexts natively, supports WebKit properly and parallelises for free.

**Q3. Explain Browser, BrowserContext and Page.**
A. **Browser** is a launched browser process (expensive). **BrowserContext** is an isolated incognito-like session with its own cookies/localStorage (cheap, milliseconds). **Page** is a tab within a context. Playwright Test gives every test a fresh context, so tests are isolated. In `persistence.spec.js` I prove it: two tabs in the **same** context share todos, and a **new** context sees none.

**Q4. What is auto-waiting?**
A. Before an action, Playwright waits for the element to be **attached, visible, stable (not animating), enabled, and receiving events** (not covered by another element), and editable for fills. That removes most `sleep` calls and flakiness.

**Q5. What are web-first assertions?**
A. Assertions like `await expect(locator).toHaveText('…')` **retry** until they pass or time out (5s in my config). Compare that with `expect(await locator.textContent()).toBe('…')`, which reads once and is flaky. My ESLint config enforces `prefer-web-first-assertions`.

**Q6. Locator vs ElementHandle?**
A. A **Locator** is a lazy description that is re-resolved on every use, so it is resilient to re-renders (important in React). An **ElementHandle** points to one specific DOM node and goes stale. Locators are the recommended API.

**Q7. Your locator strategy?**
A. Role + accessible name first (`getByRole`), then label/placeholder, then `data-testid`, and CSS only for structural containers. Never positional XPath. User-facing locators also act as a light a11y check: if `getByRole('button', {name: 'Delete'})` works, screen readers can find it too.

**Q8. How do you handle elements that only appear on hover?**
A. Hover first, like a user. `TodoItem.delete()` calls `root.hover()` then clicks. I found that `getByRole` **excludes hidden elements**, so the delete button isn't even found until hovered. `force: true` would hide real UX bugs.

**Q9. Difference between `click()` and `check()`?**
A. `check()` clicks **and then verifies** the checkbox ended up checked. I hit this: in the _Active_ filter, completing an item removes its row, so `check()` couldn't verify and timed out. A plain `click()` was correct there. It shows you need to understand what an action asserts implicitly.

**Q10. How do you handle dialogs (alert/confirm)?**
A. `page.on('dialog', d => d.accept()/dismiss())`. By default Playwright auto-dismisses. In my XSS test I listen for any dialog and assert none opened, which proves `<script>` wasn't executed.

**Q11. How do you wait for non-UI state, like localStorage or an API?**
A. `expect.poll(() => getStoredTodos(page)).toEqual([...])` retries a function until it matches. For network: `page.waitForResponse(...)` or `expect(response).toBeOK()`.

**Q12. How would you mock or intercept network calls?**
A. `page.route('**/api/todos', route => route.fulfill({ json: [...] }))` to stub, `route.abort()` to simulate failures, or `route.continue({ headers })` to modify. You can also record/replay with HAR (`routeFromHAR`). This app has no API, so I used localStorage seeding instead.

**Q13. What's a trace and how do you use it?**
A. A zip with a DOM snapshot before and after every action, network, console, and source. Open it with `npx playwright show-trace` or trace.playwright.dev. I set `trace: 'on-first-retry'` on CI, so I always have a trace for flaky/failed tests without the overhead of tracing every test.

**Q14. Headed, debug, UI mode, codegen?**
A. `--headed` shows the browser. `--debug` opens the Inspector to step through and pick locators. `--ui` is a watch-mode GUI with time travel. `codegen` records clicks into code, which I use to discover locators but not as final code.

**Q15. How do you handle multiple tabs/windows?**
A. `const [newPage] = await Promise.all([context.waitForEvent('page'), link.click()])`, or `context.newPage()`. Example: the tab-sharing test in `persistence.spec.js`.

**Q16. How do you handle iframes and shadow DOM?**
A. iframes: `page.frameLocator('#id').getByRole(...)`. Open shadow DOM is pierced automatically by Playwright locators. Closed shadow roots are not reachable by design.

**Q17. File upload/download?**
A. Upload: `locator.setInputFiles(path)`. Download: `const download = await Promise.all([page.waitForEvent('download'), btn.click()])` then `download.saveAs()`.

**Q18. How do you handle authentication efficiently?**
A. Log in once in a **setup project**, save `storageState` (cookies + localStorage) to a JSON file, and set `use: { storageState }` in dependent projects via `dependencies: ['setup']`. Every test starts logged in without repeating the UI login.

---

## 2. Framework design

**Q19. Explain your folder structure.**
A. `config/` for environments, `src/` for reusable framework code (pages, components, fixtures, data, utils, reporters), `tests/` split by type (e2e, a11y, visual, bdd), and infra files (Docker, CI, lint) at the root. Tests contain no locators, and page objects contain no assertions.

**Q20. What is the Page Object Model and its benefits?**
A. A class per page that encapsulates locators and actions. Benefits: one place to update locators, readable tests (`todoPage.addTodo('x')`), reuse. Downside: can become "god objects". I mitigate that with **Component Objects** (`TodoItem`) for repeating fragments.

**Q21. Should page objects contain assertions?**
A. Generally no. I keep assertions in tests so page objects stay reusable for positive and negative checks and failures point at the test line. An exception people accept is a small "is loaded" check. Either way, be consistent.

**Q22. What are Playwright fixtures and why use them over beforeEach?**
A. Fixtures are dependency-injected setup/teardown declared with `test.extend`. They're **lazy** (only created if a test asks for them), **composable** (`seededTodoPage` builds on `todoPage`), **encapsulated** (setup and teardown together around `await use()`), and can be **test- or worker-scoped**. `beforeEach` runs for every test in the file whether needed or not, and its state lives in shared `let` variables.

**Q23. What's an auto fixture? Give an example.**
A. `{ auto: true }` runs for every test without being requested. My `browserErrors` fixture captures console errors and page crashes and attaches them to the report, so every failure comes with browser-side context.

**Q24. Worker-scoped vs test-scoped fixtures?**
A. Test-scoped (default) is created per test. Worker-scoped (`{ scope: 'worker' }`) is created once per worker process, for expensive things like a DB connection, a test account, or a server.

**Q25. How do you manage test data?**
A. Three kinds: **static** constants where exact values matter (ordering, visual baselines), **edge-case catalogues** (unicode, XSS, long strings), and **dynamic** Faker data so each run uses unique values and tests can't depend on each other's leftovers. In real projects I seed via API/DB and clean up in fixture teardown.

**Q26. How do you make setup fast?**
A. Bypass the UI for preconditions. `seedTodos()` writes localStorage directly and reloads. In real apps the equivalent is an API call or `storageState`. UI steps are reserved for the behaviour under test.

**Q27. How do you handle multiple environments?**
A. `config/env.config.js` maps `TEST_ENV` (qa/staging/prod) to URLs, `BASE_URL` can override, and `.env` (via dotenv, git-ignored) handles local values. Tests use relative URLs (`page.goto('./#/active')`), so the same test runs anywhere. Secrets come from CI secret stores, never the repo.

**Q28. Why exact-pin the Playwright version?**
A. The Docker image `playwright:v1.64.0-noble` ships browsers built for that exact version. A caret range could resolve to 1.65 and then fail with "browser executable not found." Renovate/Dependabot bump both together.

**Q29. Why JavaScript ESM (`"type": "module"`)?**
A. Modern standard syntax, and some libraries (Faker v10) are ESM-only. Playwright supports ESM natively. Moving to TypeScript would be easy, and I used JSDoc types for editor IntelliSense meanwhile.

**Q30. How would you migrate this to TypeScript?**
A. Rename files to `.ts`, add `tsconfig.json`, type the fixtures with `test.extend<{ todoPage: TodoPage }>()`, and add `tsc --noEmit` to CI. Playwright compiles TS itself, so no build step is needed.

---

## 3. Test design & coverage

**Q31. How did you decide what to test on TodoMVC?**
A. I explored the app, listed features (add, edit, complete, delete, filter, counter, clear, persistence, layout), then applied techniques per feature: **equivalence partitioning** (valid/blank/whitespace), **boundary values** (0/1/many items, singular vs plural counter, 500 chars), **state transitions** (active ↔ completed, view ↔ edit), **error guessing** (XSS, duplicates, unicode), and **non-functional** (a11y, visual, cross-browser, mobile). See `docs/02-TEST-SCENARIOS.md`.

**Q32. Give examples of negative tests.**
A. Empty and whitespace-only input are ignored, an empty edit deletes the item, Escape discards changes, `<script>` input renders as text without executing, and Clear completed is hidden when nothing is completed.

**Q33. What's in your smoke suite vs regression?**
A. Smoke covers critical happy paths (add, complete, edit, delete, filter, persistence, about 12 tests). It runs on every PR and on mobile in under 10 seconds. Regression is everything (about 80 functional) and runs nightly and before release.

**Q34. How do you tag tests?**
A. Playwright native tags: `{ tag: '@smoke' }` on tests and `{ tag: '@regression' }` on describes, then `--grep @smoke` or `--grep-invert @visual`. Projects can also filter with `grep` (my mobile projects only run `@smoke`).

**Q35. How do you write data-driven tests?**
A. Loop over a table and generate tests: `for (const [name, title] of cases) test(\`accepts ${name}\`, ...)`. Each case is a separate test with its own report entry and parallel slot. In BDD, `Scenario Outline`+`Examples`.

**Q36. How do you test a known bug without breaking the build?**
A. `test.fail(true, 'reason')`. The test is expected to fail, so it passes while the bug exists and **fails when the bug gets fixed**, which reminds you to remove the marker. Better than `skip`, which silently rots. I did this for the colour-contrast defect.

**Q37. `test.skip` vs `test.fixme` vs `test.fail` vs `test.slow`?**
A. `skip`: don't run (e.g. not applicable to WebKit). `fixme`: don't run, the test itself is broken. `fail`: run and expect failure (known product bug). `slow`: triple the timeout.

---

## 4. Flakiness, waits, parallelism

**Q38. What causes flaky tests and how do you prevent them?**
A. Causes: hard-coded sleeps, race conditions, shared state between tests, unstable test data, animations, network dependency, order dependence. Prevention: auto-waiting + web-first assertions, `expect.poll`, fresh context per test, unique data, disabling animations in visual tests, mocking unstable third parties, and lint rules banning `waitForTimeout`.

**Q39. How do you find and fix a flaky test?**
A. Reproduce with `--repeat-each=20` (I used `--repeat-each=3` to confirm visual baselines were stable), open the trace from the failed retry, find the race (usually an assertion on stale state or a missing wait for a response), and fix the root cause. Retries are a safety net, not a fix. Reports flag tests that passed on retry as **flaky** so they don't hide.

**Q40. Why retries only on CI?**
A. Locally you want immediate, honest feedback. On CI, retries absorb infrastructure noise (slow runners), while the flaky status keeps the problem visible.

**Q41. How does Playwright parallelise?**
A. It runs multiple **worker processes**, each with its own browser. By default files run in parallel and tests within a file run in order. `fullyParallel: true` (which I use) parallelises individual tests. `workers` controls the count (2 on CI here). Tests must be independent, which fresh contexts guarantee.

**Q42. What is sharding?**
A. Splitting the suite across machines: `npx playwright test --shard=1/4`. Each CI job writes a `blob` report and `npx playwright merge-reports` combines them. My GitHub workflow splits by **browser** with a matrix instead, which is simpler to read. For a 1000-test suite I'd shard within each browser too.

**Q43. `test.describe.serial` / `configure({ mode: 'serial' })`?**
A. Forces tests in a file to run in order, and if one fails the rest are skipped. Use it rarely, for genuinely dependent flows. Prefer independent tests with fixtures.

**Q44. Timeouts in your config?**
A. Test 30s, expect 5s, action 10s, navigation 30s. Short assertion timeouts catch real slowness while auto-wait handles normal rendering.

---

## 5. BDD

**Q45. Why BDD and why playwright-bdd instead of Cucumber.js?**
A. Gherkin makes acceptance criteria readable and reviewable by POs/BAs. `@cucumber/cucumber` uses its own runner, so you lose Playwright fixtures, parallelism, projects, trace and the HTML report. **playwright-bdd** compiles `.feature` files into Playwright tests (`npx bddgen` → `.features-gen/`), so you keep everything.

**Q46. Background vs Scenario Outline?**
A. **Background** holds shared Given steps for every scenario in the feature (I seed three todos). **Scenario Outline + Examples** runs the same steps with different data (filters All/Active/Completed with expected count and URL).

**Q47. How do steps get the page object?**
A. Steps are defined with `createBdd(test)`, where `test` is playwright-bdd's base extended with **the same fixtures** as my specs. So a step is just `When('I complete the todo {string}', async ({ todoPage }, title) => ...)`. No global "World" object.

**Q48. Cucumber expressions?**
A. `{string}`, `{int}`, `{float}`, `{word}` in step text become typed parameters. Data tables arrive as a `DataTable` (`table.raw()`, `table.hashes()`).

**Q49. Disadvantages of BDD?**
A. Extra layer to maintain, step-definition sprawl, and it's pointless if business people never read the features. I keep BDD for acceptance-level flows and write detailed edge cases as plain specs.

---

## 6. Accessibility, visual, cross-browser

**Q50. How do you automate accessibility testing?**
A. `@axe-core/playwright`: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` and assert no violations, attaching the JSON to the report. I scan multiple **states** (empty, populated, editing), because axe only checks what's rendered. I also add keyboard-only tests and accessible-name assertions, since axe catches only ~30–40% of issues. Manual screen-reader testing is still needed.

**Q51. What did your a11y tests find?**
A. Colour contrast failures (the big pink `todos` header at 1.26:1 vs the required 3:1, filter links, footer text), and the toggle-all accessible name contains a CSS glyph (`❯Mark all as complete`).

**Q52. How does visual testing work in Playwright?**
A. `await expect(page).toHaveScreenshot('name.png')`. The first run writes a baseline (and fails, by design). Later runs pixel-diff against it with a tolerance (`maxDiffPixelRatio: 0.01`). `--update-snapshots` accepts intentional changes. The diff image appears in the HTML report.

**Q53. How do you make visual tests stable?**
A. Fixed viewport, disabled animations, hidden caret, blurred inputs, mouse moved away (I caught a baseline with a hover effect), masking dynamic regions (`mask: [locator]`), component-level screenshots instead of full page, and **running in the same OS/container** that made the baseline.

**Q54. Why are baselines per OS?**
A. Font rasterisation and anti-aliasing differ between macOS, Windows and Linux. My `snapshotPathTemplate` includes `{platform}`. CI compares against Linux baselines generated in the same Docker image.

**Q55. How do you do cross-browser and mobile testing?**
A. **Projects** in `playwright.config.js`: Desktop Chrome/Firefox/Safari plus `devices['Pixel 7']` and `devices['iPhone 15']` (viewport, user agent, touch, device scale factor). Note that mobile is emulation, not a real device. For real devices you'd use BrowserStack or Sauce Labs.

---

## 7. Reporting

**Q56. Which reports do you generate and why several?**
A. Different audiences. The **console** gives devs live feedback. **HTML** is for debugging (trace, video, steps). **Allure** gives managers dashboards, history and trends. **JUnit** feeds CI test tabs. **JSON** feeds custom tooling. My **custom summary** is a single shareable file with pass/fail counts and failure screenshots.

**Q57. How did you build the custom reporter?**
A. A class implementing Playwright's `Reporter` interface. `onBegin` stores the root suite, and `onEnd` iterates `suite.allTests()`, using `test.outcome()` (expected/unexpected/flaky/skipped, already retry-aware), the first failed result's `error.message` (ANSI stripped) and PNG attachments embedded as base64. It writes `summary.html` + `summary.json` and prints a console box. I HTML-escape every value, because test titles and errors can contain `<script>` from my own XSS tests.

**Q58. How do failure screenshots and videos get captured?**
A. Config: `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'on-first-retry'`. They're attached to the result and appear in the HTML, Allure and summary reports, and are uploaded as CI artifacts on failure.

**Q59. Allure 2 vs Allure 3?**
A. Allure 2's CLI needs Java. Allure 3 (npm `allure`) is pure Node, so it fits a Node-only Docker/CI image. Commands: `allure generate allure-results -o allure-report`, `allure open`.

**Q60. How do you add custom info to reports?**
A. `testInfo.attach(name, { body, contentType })` (I attach axe results and browser errors), `test.step()` for named steps, annotations (`test.info().annotations.push(...)`), and Allure environment info via reporter options.

---

## 8. Docker

**Q61. Why Docker for tests?**
A. A reproducible environment: same OS, browser builds, fonts and dependencies on every laptop and CI agent. That matters most for visual tests. No "works on my machine."

**Q62. Walk me through your Dockerfile.**
A. Base `mcr.microsoft.com/playwright:v1.64.0-noble` (browsers + OS deps preinstalled, version matched to `package.json`). Copy `package*.json` first and `npm ci` (layer cache, so code changes don't reinstall). Copy the source, switch to the non-root `pwuser`, and the default command is `npm test`. `.dockerignore` excludes `node_modules`, reports and `.git`.

**Q63. Why `ipc: host` / `--ipc=host`?**
A. Chromium uses `/dev/shm` shared memory. Docker's default 64 MB can make Chromium crash. Host IPC (or `--shm-size=1gb`) fixes it. `init: true` reaps orphaned browser processes.

**Q64. How do you get reports out of the container?**
A. Bind-mount volumes (`./reports:/app/reports`, etc.) in `docker-compose.yml`. In CI, upload them as artifacts.

**Q65. `npm ci` vs `npm install`?**
A. `npm ci` installs exactly what's in `package-lock.json`, deletes `node_modules` first, and fails if the lock and `package.json` disagree. It's deterministic and meant for CI/Docker. `npm install` may update the lock.

**Q66. Docker vs Selenium Grid / Playwright remote browsers?**
A. Docker here packages the whole runner. To scale, run more containers or shards. Playwright can also connect to remote browsers (`browserType.connect(wsEndpoint)`), or you can use cloud grids.

---

## 9. CI/CD

**Q67. Describe your GitHub Actions pipeline.**
A. Triggers: PR/push to main, nightly cron and manual dispatch with environment choice. A `lint` job gates everything. Then a **matrix** job per browser/suite runs inside the Playwright container with `fail-fast: false`. A separate visual job runs, the last job merges Allure results and publishes to GitHub Pages, and reports/traces are uploaded as artifacts. `concurrency` cancels superseded runs.

**Q68. Describe your Jenkins pipeline.**
A. Declarative `Jenkinsfile` with a Docker agent (same image), parameters for `TEST_ENV` and `SUITE`, a nightly cron, and stages Install → Lint → Test. Post `always` publishes JUnit, two HTML reports (Playwright and summary), Allure, and archives artifacts.

**Q69. How do you keep CI fast?**
A. Lint first (fail fast), smoke on PRs and full regression nightly, parallel matrix/shards, dependency caching (`setup-node` cache, Docker layers), container images with browsers preinstalled, and `trace/video` only on failure.

**Q70. How do you notify the team?**
A. Slack/Teams step on failure (`slackapi/slack-github-action`, Jenkins `slackSend`), with the pass/fail numbers from `reports/summary/summary.json` and a link to the Allure report.

**Q71. How do you handle secrets?**
A. GitHub Secrets or Jenkins Credentials injected as env vars. Never commit `.env` (it's in `.gitignore`), mask them in logs, and use separate test accounts per environment.

**Q72. What runs where in your quality gates?**
A. Editor (ESLint/Prettier extensions) → **pre-commit** (Husky + lint-staged, staged files only) → **CI** lint job → tests. Each layer is faster and cheaper than the next.

---

## 10. Code quality

**Q73. Which ESLint rules matter most for test code?**
A. `playwright/no-wait-for-timeout` (no sleeps), `no-focused-test` (no accidental `test.only` in CI, backed by `forbidOnly` in the config), `missing-playwright-await`, `prefer-web-first-assertions`, `no-conditional-in-test` (tests should be deterministic, so I refactored a filter test to a data table because of it), and `no-page-pause`.

**Q74. Why lint-staged instead of linting everything in the hook?**
A. Speed. Only staged files are checked, so commits stay fast and developers don't bypass the hook.

**Q75. What's `forbidOnly`?**
A. Config option that fails the run on CI if a `test.only` was committed. Otherwise CI would silently run one test and go green.

---

## 11. JavaScript questions that come up in automation interviews

**Q76. Why `await` every Playwright call?**
A. They return Promises. A missing `await` means the next line runs before the action finishes, which causes flaky races. The ESLint rule catches it.

**Q77. `for...of` vs `forEach` with async?**
A. `forEach` doesn't await callbacks. They fire concurrently and the test continues immediately. Use `for...of` for sequential async steps (`addTodos()`), or `Promise.all` for intentional concurrency.

**Q78. `==` vs `===`?**
A. `===` compares without type coercion. My ESLint config enforces `eqeqeq`.

**Q79. ESM vs CommonJS?**
A. ESM: `import/export`, static and async loading, top-level await, and `"type": "module"`. CommonJS: `require/module.exports`, synchronous. Node supports both, and modern libraries increasingly ship ESM only.

**Q80. What's a closure, and where do you use one in tests?**
A. A function remembering variables from its outer scope. Example: the `dialogOpened` flag set inside the `page.on('dialog')` callback and checked afterwards.

**Q81. Destructuring in fixtures?**
A. `async ({ todoPage }) =>` destructures the fixtures object. Playwright actually **parses** the parameter names to decide which fixtures to create, which is why they must be destructured in the signature.

---

## 12. Scenario / behavioural questions

**Q82. A test passes locally but fails on CI. What do you do?**
A. Download the trace/video from artifacts, then compare environment differences: headless vs headed, viewport, CPU speed (timing races), OS fonts (visual), timezone/locale, env vars/URLs, parallel data collisions. Reproduce in the same Docker image locally (`npm run docker:test`). Fix the root cause rather than adding retries.

**Q83. The UI changed and 50 tests broke. How do you avoid that?**
A. That's what POM and user-facing locators prevent. A changed locator is one fix in the page object. Role/text locators also survive CSS/class refactors. I'd also ask devs to keep `data-testid`s stable for test hooks.

**Q84. How do you decide what NOT to automate?**
A. One-off checks, highly volatile UI, things needing human judgement (look-and-feel beyond visual diff), and tests whose maintenance cost exceeds their value. Prefer pushing logic checks down to unit/API level (test pyramid) and keep E2E for critical user journeys.

**Q85. How do you measure framework success?**
A. Execution time, flaky rate (trend from Allure / summary "flaky" count), defects caught before production, coverage of critical journeys, and time from failure to diagnosis (traces + summary make that short).

**Q86. What would you add next?**
A. TypeScript, API-level seeding on a real backend, sharding with merged blob reports, Lighthouse performance budgets, Slack notifications from `summary.json`, test-impact analysis (`--only-changed`), and real-device cloud runs.

**Q87. What was the hardest problem you hit building it?**
A. Two good stories. (1) `check()` timing out in filtered views. The root cause was understanding that `check()` re-verifies state while the row legitimately disappears. (2) Making visual tests deterministic across OSes: per-platform baselines, Docker as the source of truth for CI, removing hover and caret state, and verifying with `--repeat-each`.

---

## 13. Rapid-fire

| Q                                | A                                                                      |
| -------------------------------- | ---------------------------------------------------------------------- |
| Default expect timeout?          | 5 s                                                                    |
| Default test timeout?            | 30 s                                                                   |
| Run one file?                    | `npx playwright test tests/e2e/add-todo.spec.js`                       |
| Run by title?                    | `-g "deletes a todo"`                                                  |
| Run last failed?                 | `--last-failed`                                                        |
| Update snapshots?                | `--update-snapshots`                                                   |
| List tests without running?      | `--list`                                                               |
| Show report?                     | `npx playwright show-report <dir>`                                     |
| Install browsers + OS deps?      | `npx playwright install --with-deps`                                   |
| Emulate device?                  | `use: { ...devices['iPhone 15'] }`                                     |
| Set geolocation/locale/timezone? | `use: { geolocation, locale, timezoneId, permissions }`                |
| Soft assertion?                  | `expect.soft(...)`, continues after failure                            |
| Custom matcher?                  | `expect.extend({ ... })`                                               |
| Global setup?                    | `globalSetup` file, or better, a setup **project** with `dependencies` |
| Run headed in config?            | `use: { headless: false }` (here: `HEADLESS=false`)                    |
