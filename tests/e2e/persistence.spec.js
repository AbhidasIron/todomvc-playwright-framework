import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TodoPage } from '../../src/pages/TodoPage.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';
import { seedTodos, getStoredTodos, STORAGE_KEY } from '../../src/utils/storage.js';

test.describe('Persistence (localStorage)', { tag: '@regression' }, () => {
  test('todos survive a page reload', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.reload();

    await expect(seededTodoPage.todoTitles).toHaveText(TODO_ITEMS);
  });

  test('completed state survives a page reload', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();
    await seededTodoPage.reload();

    await expect(seededTodoPage.todo(0).checkbox).toBeChecked();
    await expect(seededTodoPage.todo(1).checkbox).not.toBeChecked();
  });

  test('deleted todos stay deleted after reload', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(TODO_ITEMS[0]).delete();
    await seededTodoPage.reload();

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1], TODO_ITEMS[2]]);
  });

  test('active filter is kept after reload (from URL hash)', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();
    await seededTodoPage.filterBy('Active');
    await seededTodoPage.reload();

    await expect(seededTodoPage.filterLink('Active')).toHaveClass('selected');
    await expect(seededTodoPage.todoItems).toHaveCount(2);
  });

  test('stores todos with id, title and completed fields', async ({ seededTodoPage }) => {
    const stored = await getStoredTodos(seededTodoPage.page);

    expect(stored).toHaveLength(TODO_ITEMS.length);
    for (const [i, todo] of stored.entries()) {
      expect(todo).toEqual({ id: expect.any(String), title: TODO_ITEMS[i], completed: false });
    }
    expect(new Set(stored.map((t) => t.id)).size).toBe(stored.length);
  });

  test('renders todos seeded directly into localStorage', async ({ todoPage }) => {
    await seedTodos(todoPage.page, [
      { title: 'Seeded active' },
      { title: 'Seeded done', completed: true },
    ]);

    await expect(todoPage.todoTitles).toHaveText(['Seeded active', 'Seeded done']);
    await expect(todoPage.todo('Seeded done').checkbox).toBeChecked();
    await expect(todoPage.todoCount).toHaveText('1 item left');
  });

  test('state is shared between tabs of the same browser context', async ({
    seededTodoPage,
    context,
  }) => {
    await expect(seededTodoPage.todoItems).toHaveCount(TODO_ITEMS.length);
    const secondTab = new TodoPage(await context.newPage());
    await secondTab.goto();

    await expect(secondTab.todoTitles).toHaveText(TODO_ITEMS);
  });

  test('state is isolated between browser contexts', async ({ seededTodoPage, browser }) => {
    await expect(seededTodoPage.todoItems).toHaveCount(TODO_ITEMS.length);

    const otherContext = await browser.newContext();
    const otherPage = new TodoPage(await otherContext.newPage());
    await otherPage.goto();

    await expect(otherPage.todoItems).toHaveCount(0);
    await otherContext.close();
  });

  test('recovers when localStorage is cleared', async ({ seededTodoPage }) => {
    await seededTodoPage.page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await seededTodoPage.reload();

    await expect(seededTodoPage.todoItems).toHaveCount(0);
    await seededTodoPage.addTodo('Fresh start');
    await expect(seededTodoPage.todoTitles).toHaveText(['Fresh start']);
  });
});
