import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';

test.describe('Delete todo', { tag: '@regression' }, () => {
  test('delete button only appears on hover', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(0);
    await expect(item.deleteButton).toBeHidden();

    await item.root.hover();
    await expect(item.deleteButton).toBeVisible();
  });

  test('deletes a todo', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.todo(TODO_ITEMS[1]).delete();

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
    await expect(seededTodoPage.todoCount).toHaveText('2 items left');
  });

  test('deletes the first and last todos', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(TODO_ITEMS[0]).delete();
    await seededTodoPage.todo(TODO_ITEMS[2]).delete();

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1]]);
  });

  test('deletes a completed todo', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(TODO_ITEMS[0]);
    await item.complete();
    await item.delete();

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1], TODO_ITEMS[2]]);
    await expect(seededTodoPage.clearCompletedButton).toBeHidden();
  });

  test('deleting all todos hides the main section and footer', async ({ seededTodoPage }) => {
    for (const title of TODO_ITEMS) {
      await seededTodoPage.todo(title).delete();
    }

    await expect(seededTodoPage.todoItems).toHaveCount(0);
    await expect(seededTodoPage.mainSection).toBeHidden();
    await expect(seededTodoPage.footer).toBeHidden();
  });

  test('deletes only the targeted item when titles are duplicated', async ({ todoPage }) => {
    await todoPage.addTodos(['Same', 'Same', 'Different']);
    await todoPage.todo(0).delete();

    await expect(todoPage.todoTitles).toHaveText(['Same', 'Different']);
  });
});
