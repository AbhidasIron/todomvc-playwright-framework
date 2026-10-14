import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { envConfig } from './config/env.config.js';

const bddTestDir = defineBddConfig({
  features: 'tests/bdd/features/**/*.feature',
  steps: 'tests/bdd/steps/**/*.js',
});

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  // Keep baselines per project and OS: fonts render differently on macOS vs Linux (Docker/CI).
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{projectName}/{platform}/{testFilePath}/{arg}{ext}',

  fullyParallel: true,
  forbidOnly: envConfig.isCI,
  retries: envConfig.isCI ? 2 : 0,
  workers: envConfig.workers ?? (envConfig.isCI ? 2 : undefined),
  timeout: 30_000,

  expect: {
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },

  reporter: [
    [envConfig.isCI ? 'github' : 'list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          Environment: envConfig.name,
          BaseURL: envConfig.baseURL,
          Node: process.version,
          OS: process.platform,
        },
      },
    ],
    ['./src/reporters/summary-reporter.js', { outputDir: 'reports/summary' }],
  ],

  use: {
    baseURL: envConfig.baseURL,
    headless: envConfig.headless,
    testIdAttribute: 'data-testid',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: envConfig.isCI ? 'on-first-retry' : 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      testDir: './tests/e2e',
      grep: /@smoke/,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      testDir: './tests/e2e',
      grep: /@smoke/,
      use: { ...devices['iPhone 15'] },
    },
    {
      name: 'a11y',
      testDir: './tests/a11y',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
