import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';
import { getStoredTodos } from '../../src/utils/storage.js';

test.describe('Complete todo', { tag: '@regression' }, () => {
  test('marks a todo as completed', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(TODO_ITEMS[0]);
    await item.complete();

    await expect(item.checkbox).toBeChecked();
    await expect(item.root).toHaveClass(/completed/);
  });

  test('un-marks a completed todo', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(TODO_ITEMS[0]);
    await item.complete();
    await item.reopen();

    await expect(item.checkbox).not.toBeChecked();
    await expect(item.root).not.toHaveClass(/completed/);
  });

  test('completed todo is shown with strike-through styling', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(0);
    await item.complete();

    await expect(item.label).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('completing one todo does not affect the others', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).complete();

    await expect(seededTodoPage.todo(0).checkbox).not.toBeChecked();
    await expect(seededTodoPage.todo(1).checkbox).toBeChecked();
    await expect(seededTodoPage.todo(2).checkbox).not.toBeChecked();
  });

  test('saves completed state to localStorage', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(TODO_ITEMS[1]).complete();

    await expect
      .poll(async () => (await getStoredTodos(seededTodoPage.page)).map((t) => t.completed))
      .toEqual([false, true, false]);
  });
});

test.describe('Mark all as complete', { tag: '@regression' }, () => {
  test('marks every todo as completed', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();

    await expect(seededTodoPage.todoItems).toHaveClass(Array(TODO_ITEMS.length).fill(/completed/));
    await expect(seededTodoPage.todoCount).toHaveText('0 items left');
  });

  test('clicking toggle-all again un-marks every todo', async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();
    await seededTodoPage.toggleAll();

    await expect(seededTodoPage.todoItems).toHaveClass(Array(TODO_ITEMS.length).fill(''));
    await expect(seededTodoPage.todoCount).toHaveText('3 items left');
  });

  test('toggle-all checkbox reflects state when items change individually', async ({
    seededTodoPage,
  }) => {
    await seededTodoPage.toggleAll();
    await expect(seededTodoPage.toggleAllCheckbox).toBeChecked();

    await seededTodoPage.todo(0).reopen();
    await expect(seededTodoPage.toggleAllCheckbox).not.toBeChecked();

    await seededTodoPage.todo(0).complete();
    await expect(seededTodoPage.toggleAllCheckbox).toBeChecked();
  });

  test('toggle-all completes the remaining items when some are already done', async ({
    seededTodoPage,
  }) => {
    await seededTodoPage.todo(0).complete();
    await seededTodoPage.toggleAll();

    for (let i = 0; i < TODO_ITEMS.length; i++) {
      await expect(seededTodoPage.todo(i).checkbox).toBeChecked();
    }
  });
});
