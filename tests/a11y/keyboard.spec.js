import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';

test.describe('Keyboard-only usage', { tag: ['@a11y', '@regression'] }, () => {
  test('can add todos using only the keyboard', async ({ todoPage }) => {
    const { keyboard } = todoPage.page;
    await expect(todoPage.newTodoInput).toBeFocused();

    await keyboard.type('Typed with keyboard');
    await keyboard.press('Enter');

    await expect(todoPage.todoTitles).toHaveText(['Typed with keyboard']);
  });

  test('Tab moves focus from the input to the toggle-all control', async ({ seededTodoPage }) => {
    await seededTodoPage.newTodoInput.focus();
    await seededTodoPage.page.keyboard.press('Tab');

    await expect(seededTodoPage.toggleAllCheckbox).toBeFocused();
  });

  test('can toggle a todo with the Space key', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(0);
    await item.checkbox.focus();
    await seededTodoPage.page.keyboard.press('Space');

    await expect(item.checkbox).toBeChecked();
  });

  test('can finish editing with Enter and cancel with Escape', async ({ seededTodoPage }) => {
    const { keyboard } = seededTodoPage.page;
    const item = seededTodoPage.todo(0);

    await item.startEditing();
    await keyboard.press('ControlOrMeta+A');
    await keyboard.type('Saved via keyboard');
    await keyboard.press('Enter');
    await expect(seededTodoPage.todoTitles.first()).toHaveText('Saved via keyboard');

    await item.startEditing();
    await keyboard.type(' (discard me)');
    await keyboard.press('Escape');
    await expect(seededTodoPage.todoTitles.first()).toHaveText('Saved via keyboard');
    await expect(seededTodoPage.todoTitles).toHaveCount(TODO_ITEMS.length);
  });
});
