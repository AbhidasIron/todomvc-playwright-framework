import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS } from '../../src/data/todo-data.js';

test.describe('Filters & routing', { tag: '@regression' }, () => {
  test.beforeEach(async ({ seededTodoPage }) => {
    await seededTodoPage.todo(TODO_ITEMS[1]).complete();
  });

  test('"All" is selected by default and shows every todo', async ({ seededTodoPage }) => {
    await expect(seededTodoPage.filterLink('All')).toHaveClass('selected');
    await expect(seededTodoPage.todoTitles).toHaveText(TODO_ITEMS);
  });

  test('"Active" shows only active todos', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.filterBy('Active');

    await expect(seededTodoPage.page).toHaveURL(/#\/active$/);
    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test('"Completed" shows only completed todos', { tag: '@smoke' }, async ({ seededTodoPage }) => {
    await seededTodoPage.filterBy('Completed');

    await expect(seededTodoPage.page).toHaveURL(/#\/completed$/);
    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1]]);
  });

  test('"All" restores the full list after filtering', async ({ seededTodoPage }) => {
    await seededTodoPage.filterBy('Completed');
    await seededTodoPage.filterBy('All');

    await expect(seededTodoPage.page).toHaveURL(/#\/$/);
    await expect(seededTodoPage.todoTitles).toHaveText(TODO_ITEMS);
  });

  const selectionTable = [
    { filter: 'Active', classes: ['', 'selected', ''] },
    { filter: 'Completed', classes: ['', '', 'selected'] },
    { filter: 'All', classes: ['selected', '', ''] },
  ];

  test('highlights only the currently selected filter', async ({ seededTodoPage }) => {
    const filterLinks = seededTodoPage.footer.getByRole('link');

    for (const { filter, classes } of selectionTable) {
      await seededTodoPage.filterBy(/** @type {any} */ (filter));
      await expect(filterLinks).toHaveClass(classes);
    }
  });

  test('browser back/forward buttons navigate between filters', async ({ seededTodoPage }) => {
    const { page } = seededTodoPage;
    await seededTodoPage.filterBy('Active');
    await seededTodoPage.filterBy('Completed');

    await page.goBack();
    await expect(seededTodoPage.filterLink('Active')).toHaveClass('selected');
    await expect(seededTodoPage.todoItems).toHaveCount(2);

    await page.goBack();
    await expect(seededTodoPage.filterLink('All')).toHaveClass('selected');
    await expect(seededTodoPage.todoItems).toHaveCount(3);

    await page.goForward();
    await expect(seededTodoPage.filterLink('Active')).toHaveClass('selected');
  });

  test('deep-linking to a filter URL opens that filter', async ({ seededTodoPage }) => {
    await seededTodoPage.goto('Completed');

    await expect(seededTodoPage.filterLink('Completed')).toHaveClass('selected');
    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1]]);
  });

  test('completing a todo in "Active" view removes it from that view', async ({
    seededTodoPage,
  }) => {
    await seededTodoPage.filterBy('Active');
    // toggle() not complete(): check() re-verifies the state, but the row leaves this view.
    await seededTodoPage.todo(TODO_ITEMS[0]).toggle();

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[2]]);
  });

  test('re-opening a todo in "Completed" view removes it from that view', async ({
    seededTodoPage,
  }) => {
    await seededTodoPage.filterBy('Completed');
    await seededTodoPage.todo(TODO_ITEMS[1]).toggle();

    await expect(seededTodoPage.todoItems).toHaveCount(0);
  });

  test('a todo added in "Completed" view is hidden there but shown in "Active"', async ({
    seededTodoPage,
  }) => {
    await seededTodoPage.filterBy('Completed');
    await seededTodoPage.addTodo('Added while on Completed');

    await expect(seededTodoPage.todoTitles).toHaveText([TODO_ITEMS[1]]);
    await seededTodoPage.filterBy('Active');
    await expect(seededTodoPage.todoTitles).toContainText(['Added while on Completed']);
  });
});
