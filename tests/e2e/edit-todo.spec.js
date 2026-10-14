import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';
import { getStoredTodos } from '../../src/utils/storage.js';

test.describe('Edit todo', { tag: '@regression' }, () => {
  test('double-click opens edit mode pre-filled with the title', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(1);
    await item.startEditing();

    await expect(item.root).toHaveClass(/editing/);
    await expect(item.editInput).toBeVisible();
    await expect(item.editInput).toHaveValue(TODO_ITEMS[1]);
    await expect(item.editInput).toBeFocused();
  });

  test('hides the checkbox and delete button while editing', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(1);
    await item.startEditing();

    await expect(item.checkbox).toBeHidden();
    await expect(item.label).toBeHidden();
    await expect(item.deleteButton).toBeHidden();
  });

  test('saves the edit when Enter is pressed', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).edit('Book dentist appointment', 'Enter');

    await expect(seededTodoPage.todoTitles).toHaveText([
      TODO_ITEMS[0],
      'Book dentist appointment',
      TODO_ITEMS[2],
    ]);
  });

  test('saves the edit when the input loses focus (blur)', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).edit('Edited on blur', 'blur');

    await expect(seededTodoPage.todoTitles.nth(1)).toHaveText('Edited on blur');
  });

  test('cancels the edit when Escape is pressed', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(1);
    await item.edit('This should be discarded', 'Escape');

    await expect(item.root).not.toHaveClass(/editing/);
    await expect(seededTodoPage.todoTitles).toHaveText(TODO_ITEMS);
  });

  test('trims whitespace from the edited title', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).edit('    Trimmed title    ');

    await expect(seededTodoPage.todoTitles.nth(1)).toHaveText('Trimmed title');
  });

  test('removes the todo when the edited title is empty', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).edit('');

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test('removes the todo when the edited title is whitespace only', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).edit('     ');

    await expect(seededTodoPage.todoItems).toHaveCount(TODO_ITEMS.length - 1);
  });

  test('editing a completed todo keeps it completed', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(0);
    await item.complete();
    await item.edit('Completed and renamed');

    const renamed = seededTodoPage.todo('Completed and renamed');
    await expect(renamed.checkbox).toBeChecked();
    await expect(renamed.root).toHaveClass(/completed/);
  });

  test('persists the edited title to localStorage', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(2).edit('Pay water bill');

    await expect
      .poll(async () => (await getStoredTodos(seededTodoPage.page)).map((t) => t.title))
      .toEqual([TODO_ITEMS[0], TODO_ITEMS[1], 'Pay water bill']);
  });
});
