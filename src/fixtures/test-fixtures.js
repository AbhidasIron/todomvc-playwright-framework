import { test as base, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage.js';
import { TODO_ITEMS } from '../data/todo-data.js';

/** Fixture definitions are exported so the BDD layer can extend playwright-bdd's `test` with them. */
export const fixtures = {
  /** A TodoPage already opened on the app with an empty list. */
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },

  /** A TodoPage pre-populated with the standard TODO_ITEMS through the UI. */
  seededTodoPage: async ({ todoPage }, use) => {
    await todoPage.addTodos(TODO_ITEMS);
    await expect(todoPage.todoItems).toHaveCount(TODO_ITEMS.length);
    await use(todoPage);
  },

  /** Auto fixture: attaches browser console errors / page crashes to the report for debugging. */
  browserErrors: [
    async ({ page }, use, testInfo) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
      });
      await use(errors);
      if (errors.length) {
        await testInfo.attach('browser-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
};

export const test = base.extend(fixtures);

export { expect };
