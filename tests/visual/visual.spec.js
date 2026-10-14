import { test, expect } from '../../src/fixtures/test-fixtures.js';

test.describe('Visual regression', { tag: ['@visual'] }, () => {
  test('empty state', async ({ todoPage }) => {
    await expect(todoPage.page).toHaveScreenshot('empty-state.png', { fullPage: true });
  });

  test('list with active and completed items', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(1).complete();
    // Remove hover and focus ring/caret so the baseline is deterministic.
    await seededTodoPage.newTodoInput.blur();
    await seededTodoPage.page.mouse.move(0, 0);

    await expect(seededTodoPage.page.locator('.todoapp')).toHaveScreenshot('todo-list-mixed.png');
  });

  test('all items completed', async ({ seededTodoPage }) => {
    await seededTodoPage.toggleAll();
    await seededTodoPage.newTodoInput.blur();
    await seededTodoPage.page.mouse.move(0, 0);

    await expect(seededTodoPage.page.locator('.todoapp')).toHaveScreenshot(
      'todo-list-all-completed.png',
    );
  });

  test('todo in edit mode', async ({ seededTodoPage }) => {
    await seededTodoPage.todo(0).startEditing();

    await expect(seededTodoPage.todo(0).root).toHaveScreenshot('todo-item-editing.png', {
      caret: 'hide',
    });
  });

  test('hovered todo shows delete button', async ({ seededTodoPage }) => {
    await seededTodoPage.newTodoInput.blur();
    await seededTodoPage.todo(0).root.hover();

    await expect(seededTodoPage.todo(0).root).toHaveScreenshot('todo-item-hover.png');
  });
});
