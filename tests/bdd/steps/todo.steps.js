import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures.js';

const { Given, When, Then } = createBdd(test);

/** @param {import('playwright-bdd').DataTable} table */
const titlesFrom = (table) => table.raw().map(([title]) => title);

Given('I am on the TodoMVC app', async ({ todoPage }) => {
  await expect(todoPage.newTodoInput).toBeVisible();
});

Given('I have the todos:', async ({ todoPage }, table) => {
  await todoPage.addTodos(titlesFrom(table));
});

When('I add a todo {string}', async ({ todoPage }, title) => {
  await todoPage.addTodo(title);
});

When('I add the todos:', async ({ todoPage }, table) => {
  await todoPage.addTodos(titlesFrom(table));
});

When('I submit a todo made of {int} spaces', async ({ todoPage }, spaces) => {
  await todoPage.addTodo(' '.repeat(spaces));
});

When('I complete the todo {string}', async ({ todoPage }, title) => {
  await todoPage.todo(title).complete();
});

When('I rename the todo {string} to {string}', async ({ todoPage }, oldTitle, newTitle) => {
  await todoPage.todo(oldTitle).edit(newTitle, 'Enter');
});

When(
  'I start renaming {string} to {string} and press Escape',
  async ({ todoPage }, oldTitle, newTitle) => {
    await todoPage.todo(oldTitle).edit(newTitle, 'Escape');
  },
);

When('I delete the todo {string}', async ({ todoPage }, title) => {
  await todoPage.todo(title).delete();
});

When('I clear completed todos', async ({ todoPage }) => {
  await todoPage.clearCompleted();
});

When('I reload the page', async ({ todoPage }) => {
  await todoPage.reload();
});

When('I select the {string} filter', async ({ todoPage }, filter) => {
  await todoPage.filterBy(filter);
});

Then('I should see the todos:', async ({ todoPage }, table) => {
  await expect(todoPage.todoTitles).toHaveText(titlesFrom(table));
});

Then('I should see {int} todos', async ({ todoPage }, count) => {
  await expect(todoPage.todoItems).toHaveCount(count);
});

Then('the counter should show {string}', async ({ todoPage }, text) => {
  await expect(todoPage.todoCount).toHaveText(text);
});

Then('the todo {string} should be completed', async ({ todoPage }, title) => {
  await expect(todoPage.todo(title).checkbox).toBeChecked();
});

Then('the URL should end with {string}', async ({ page }, route) => {
  await expect(page).toHaveURL((url) => url.href.endsWith(route));
});
