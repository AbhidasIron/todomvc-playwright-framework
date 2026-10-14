import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';

test.describe('Items left counter', { tag: '@regression' }, () => {
  test('uses singular "item" for one active todo', async ({ todoPage }) => {
    await todoPage.addTodo(TODO_ITEMS[0]);

    await expect(todoPage.todoCount).toHaveText('1 item left');
  });

  test(
    'uses plural "items" for multiple active todos',
    { tag: '@smoke' },
    async ({ seededTodoPage }) => {
      await expect(seededTodoPage.todoCount).toHaveText('3 items left');
    },
  );

  test('counts only active todos', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();
    await expect(seededTodoPage.todoCount).toHaveText('2 items left');

    await seededTodoPage.todo(1).complete();
    await expect(seededTodoPage.todoCount).toHaveText('1 item left');
  });

  test('shows "0 items left" when everything is completed', async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();

    await expect(seededTodoPage.todoCount).toHaveText('0 items left');
  });

  test('increments when a todo is re-opened', async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();
    await seededTodoPage.todo(2).reopen();

    await expect(seededTodoPage.todoCount).toHaveText('1 item left');
  });

  test('decrements when an active todo is deleted', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).delete();

    await expect(seededTodoPage.todoCount).toHaveText('2 items left');
  });

  test('count is independent of the selected filter', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).complete();

    for (const filter of /** @type {const} */ (['Active', 'Completed', 'All'])) {
      await seededTodoPage.filterBy(filter);
      await expect(seededTodoPage.todoCount).toHaveText('2 items left');
    }
  });
});
