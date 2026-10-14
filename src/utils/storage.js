/** The key the React TodoMVC app uses to persist state in localStorage. */
export const STORAGE_KEY = 'react-todos';

/**
 * Reads the persisted todos straight from localStorage.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{ id: string, title: string, completed: boolean }>>}
 */
export async function getStoredTodos(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), STORAGE_KEY);
}

/**
 * Seeds todos directly into localStorage and reloads, skipping slow UI setup.
 * @param {import('@playwright/test').Page} page
 * @param {Array<{ title: string, completed?: boolean }>} todos
 */
export async function seedTodos(page, todos) {
  const payload = todos.map((todo) => ({
    id: crypto.randomUUID(),
    title: todo.title,
    completed: !!todo.completed,
  }));
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [STORAGE_KEY, payload],
  );
  await page.reload();
}

/** @param {import('@playwright/test').Page} page */
export async function clearStoredTodos(page) {
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
}
