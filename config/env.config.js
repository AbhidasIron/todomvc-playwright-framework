import 'dotenv/config';

// The demo has one public URL; qa/staging entries show how a real project maps environments.
const ENVIRONMENTS = {
  qa: { baseURL: 'https://demo.playwright.dev/todomvc/' },
  staging: { baseURL: 'https://demo.playwright.dev/todomvc/' },
  prod: { baseURL: 'https://demo.playwright.dev/todomvc/' },
};

const testEnv = (process.env.TEST_ENV || 'qa').toLowerCase();

if (!ENVIRONMENTS[testEnv]) {
  throw new Error(
    `Unknown TEST_ENV "${testEnv}". Valid values: ${Object.keys(ENVIRONMENTS).join(', ')}`,
  );
}

export const envConfig = {
  name: testEnv,
  baseURL: process.env.BASE_URL || ENVIRONMENTS[testEnv].baseURL,
  isCI: !!process.env.CI,
  headless: process.env.HEADLESS !== 'false',
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,
};
