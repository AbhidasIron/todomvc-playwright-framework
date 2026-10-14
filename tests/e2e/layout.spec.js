import { test, expect } from '../../src/fixtures/test-fixtures.js';

test.describe('Page layout & initial state', { tag: '@regression' }, () => {
  test('shows the correct page title and header', { tag: '@smoke' }, async ({ todoPage }) => {
    await expect(todoPage.page).toHaveTitle('React • TodoMVC');
    await expect(todoPage.heading).toBeVisible();
  });

  test('new todo input is visible, empty and auto-focused', async ({ todoPage }) => {
    await expect(todoPage.newTodoInput).toBeVisible();
    await expect(todoPage.newTodoInput).toBeEmpty();
    await expect(todoPage.newTodoInput).toBeFocused();
    await expect(todoPage.newTodoInput).toHaveAttribute('placeholder', 'What needs to be done?');
  });

  test('hides list, toggle-all and footer when there are no todos', async ({ todoPage }) => {
    await expect(todoPage.todoItems).toHaveCount(0);
    await expect(todoPage.mainSection).toBeHidden();
    await expect(todoPage.toggleAllCheckbox).toBeHidden();
    await expect(todoPage.footer).toBeHidden();
  });

  test('shows list and footer once a todo exists', async ({ todoPage }) => {
    await todoPage.addTodo('First task');
    await expect(todoPage.mainSection).toBeVisible();
    await expect(todoPage.footer).toBeVisible();
    await expect(todoPage.filterLink('All')).toBeVisible();
    await expect(todoPage.filterLink('Active')).toBeVisible();
    await expect(todoPage.filterLink('Completed')).toBeVisible();
  });

  test('shows the info footer with hint and credit links', async ({ todoPage }) => {
    await expect(todoPage.infoFooter).toContainText('Double-click to edit a todo');
    await expect(todoPage.infoFooter.getByRole('link', { name: 'Remo H. Jansen' })).toHaveAttribute(
      'href',
      'http://github.com/remojansen/',
    );
    await expect(todoPage.infoFooter.getByRole('link', { name: 'TodoMVC' })).toHaveAttribute(
      'href',
      'http://todomvc.com',
    );
  });

  test('shows the demo disclaimer banner', async ({ todoPage }) => {
    await expect(todoPage.demoBanner).toBeVisible();
    await expect(todoPage.page.getByRole('link', { name: 'real TodoMVC app.' })).toHaveAttribute(
      'href',
      'https://todomvc.com/',
    );
  });
});
