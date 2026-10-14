import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';

test.describe('Clear completed', { tag: '@regression' }, () => {
  test('is hidden when no todo is completed', async ({ seededTodoPage }) => {
    await expect(seededTodoPage.clearCompletedButton).toBeHidden();
  });

  test('appears once a todo is completed', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();

    await expect(seededTodoPage.clearCompletedButton).toBeVisible();
  });

  test(
    'removes completed todos and keeps active ones',
    { tag: '@smoke' },
    async ({ seededTodoPage }) => {
      await seededTodoPage.todo(TODO_ITEMS[0]).complete();
      await seededTodoPage.todo(TODO_ITEMS[2]).complete();
      await seededTodoPage.clearCompleted();

      await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1]]);
      await expect(seededTodoPage.todoCount).toHaveText('1 item left');
    },
  );

  test('hides itself after clearing', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).complete();
    await seededTodoPage.clearCompleted();

    await expect(seededTodoPage.clearCompletedButton).toBeHidden();
  });

  test('clearing all completed todos empties the list', async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();
    await seededTodoPage.clearCompleted();

    await expect(seededTodoPage.todoItems).toHaveCount(0);
    await expect(seededTodoPage.footer).toBeHidden();
  });

  test('works from the Completed filter view', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();
    await seededTodoPage.filterBy('Completed');
    await seededTodoPage.clearCompleted();

    await expect(seededTodoPage.todoItems).toHaveCount(0);
    await seededTodoPage.filterBy('All');
    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1], TODO_ITEMS[2]]);
  });
});
