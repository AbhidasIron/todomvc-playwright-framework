# TodoMVC – Playwright Test Automation Framework

An end-to-end test automation framework for the [TodoMVC demo app](https://demo.playwright.dev/todomvc/), built with **Playwright + JavaScript**. It includes BDD (Gherkin), accessibility, visual regression, cross-browser and mobile testing, Allure and custom summary reports, Docker, and CI on GitHub Actions and Jenkins.

| Metric                   | Value                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| Unique scenarios         | 82 E2E + 9 a11y/keyboard + 5 visual + 15 BDD                        |
| Executions per full run  | ~294 (82 × 3 desktop browsers, smoke × 2 mobile devices, a11y, BDD) |
| Browsers                 | Chromium, Firefox, WebKit, Pixel 7 (Chrome), iPhone 15 (Safari)     |
| Run time (local, 5 CPUs) | ~40 s                                                               |

## Documentation

| Doc                                           | What's inside                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| [Framework Guide](docs/01-FRAMEWORK-GUIDE.md) | Architecture, every tool (what and why), design decisions, how to extend it |
| [Test Scenarios](docs/02-TEST-SCENARIOS.md)   | Full catalogue of covered scenarios and bugs found                          |
| [Interview Guide](docs/03-INTERVIEW-GUIDE.md) | 80+ interview questions with answers, based on this framework               |

## Quick start

```bash
# 1. Install dependencies and browsers
npm ci
npx playwright install --with-deps

# 2. (optional) configure environment
cp .env.example .env

# 3. Run the default suite (all browsers + mobile + a11y + BDD)
npm test

# 4. Open reports
npm run report:html         # Playwright HTML report
npm run report:allure       # Allure report
open reports/summary/summary.html   # One-page pass/fail summary with failure screenshots
```

## Common commands

| Command                        | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `npm test`                     | Default suite (everything except visual)                  |
| `npm run test:all`             | Every project including visual                            |
| `npm run test:smoke`           | `@smoke` tests on Chromium (fast PR check)                |
| `npm run test:regression`      | `@regression` tests                                       |
| `npm run test:chromium`        | Single browser (`test:firefox`, `test:webkit` also exist) |
| `npm run test:mobile`          | Smoke tests on mobile emulation                           |
| `npm run test:a11y`            | Accessibility (axe-core) + keyboard tests                 |
| `npm run test:visual`          | Visual regression                                         |
| `npm run test:visual:update`   | Re-generate visual baselines                              |
| `npm run test:bdd`             | Gherkin feature files                                     |
| `npm run test:headed`          | Watch the browser                                         |
| `npm run test:debug`           | Step through with Playwright Inspector                    |
| `npm run test:ui`              | Playwright UI mode (time-travel debugging)                |
| `npm run test:staging`         | Run against another environment (`TEST_ENV`)              |
| `npm run lint` / `format`      | ESLint / Prettier                                         |
| `npm run docker:test`          | Run the suite inside Docker                               |
| `npm run docker:visual:update` | Generate Linux visual baselines inside Docker             |
| `npm run clean`                | Remove all generated output                               |

## Project structure

```
.
├── config/env.config.js          # Environment selection (TEST_ENV / BASE_URL / .env)
├── src/
│   ├── pages/                    # Page Object Model
│   │   ├── BasePage.js
│   │   └── TodoPage.js
│   ├── components/TodoItem.js    # Component object for one todo row
│   ├── fixtures/test-fixtures.js # Custom Playwright fixtures (todoPage, seededTodoPage, …)
│   ├── data/todo-data.js         # Static + Faker-generated test data, edge cases
│   ├── utils/storage.js          # localStorage helpers (seed/read state, skip the UI)
│   └── reporters/summary-reporter.js # Custom pass/fail summary with failure screenshots
├── tests/
│   ├── e2e/                      # Functional specs, one file per feature
│   ├── a11y/                     # axe-core scans + keyboard-only tests
│   ├── visual/                   # Screenshot comparison + baselines (__screenshots__)
│   └── bdd/
│       ├── features/*.feature    # Gherkin scenarios
│       └── steps/                # Step definitions + BDD fixtures
├── playwright.config.js          # Projects, reporters, retries, artifacts
├── Dockerfile / docker-compose.yml
├── .github/workflows/playwright.yml
├── Jenkinsfile
├── eslint.config.js / .prettierrc.json / .husky/pre-commit
└── docs/
```

## Reports produced on every run

| Report            | Location                                     | Best for                                                            |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Console summary   | terminal                                     | Quick pass/fail count and failure reasons                           |
| Execution summary | `reports/summary/summary.html`               | Sharing with managers: totals, pass rate, failures with screenshots |
| Playwright HTML   | `reports/html-report/`                       | Debugging: steps, trace viewer, video, screenshots                  |
| Allure            | `allure-results/` → `reports/allure-report/` | Trends, history, categories, rich dashboards                        |
| JUnit XML         | `reports/junit/results.xml`                  | CI test tabs (Jenkins, GitHub, Azure)                               |
| JSON              | `reports/json/results.json`                  | Custom dashboards / Slack bots                                      |
