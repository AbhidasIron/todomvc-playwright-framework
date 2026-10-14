import { test, expect } from '../../src/fixtures/test-fixtures.js';
import { TODO_ITEMS, EDGE_CASE_TITLES, generateTodoTitles } from '../../src/data/todo-data.js';
import { getStoredTodos } from '../../src/utils/storage.js';

test.describe('Add todo', { tag: '@regression' }, () => {
  test('adds a single todo item', { tag: '@smoke' }, async ({ todoPage }) => {
    await todoPage.addTodo(TODO_ITEMS[0]);

    await expect(todoPage.todoTitles).toHaveText([TODO_ITEMS[0]]);
    await expect(todoPage.todoCount).toHaveText('1 item left');
  });

  test(
    'adds multiple todos and preserves insertion order',
    { tag: '@smoke' },
    async ({ todoPage }) => {
      await todoPage.addTodos(TODO_ITEMS);

      await expect(todoPage.todoTitles).toHaveText(TODO_ITEMS);
    },
  );

  test('clears the input after a todo is added', async ({ todoPage }) => {
    await todoPage.addTodo(TODO_ITEMS[0]);

    await expect(todoPage.newTodoInput).toBeEmpty();
    await expect(todoPage.newTodoInput).toBeFocused();
  });

  test('new todos are created as active (not completed)', async ({ todoPage }) => {
    await todoPage.addTodo(TODO_ITEMS[0]);
    const item = todoPage.todo(0);

    await expect(item.checkbox).not.toBeChecked();
    await expect(item.root).not.toHaveClass(/completed/);
  });

  test('appends new todos to the bottom of the list', async ({ seededTodoPage }) => {
    await seededTodoPage.addTodo('Newest item');

    await expect(seededTodoPage.todoTitles.last()).toHaveText('Newest item');
  });

  test('does not add an empty todo', async ({ todoPage }) => {
    await todoPage.addTodo('');

    await expect(todoPage.todoItems).toHaveCount(0);
  });

  test('does not add a whitespace-only todo', async ({ todoPage }) => {
    await todoPage.addTodo('     ');

    await expect(todoPage.todoItems).toHaveCount(0);
  });

  test('trims leading and trailing whitespace', async ({ todoPage }) => {
    await todoPage.addTodo(EDGE_CASE_TITLES.withSurroundingSpaces);

    await expect(todoPage.todoTitles).toHaveText([EDGE_CASE_TITLES.withSurroundingSpaces.trim()]);
  });

  test('allows duplicate todo titles', async ({ todoPage }) => {
    await todoPage.addTodos([TODO_ITEMS[0], TODO_ITEMS[0]]);

    await expect(todoPage.todoTitles).toHaveText([TODO_ITEMS[0], TODO_ITEMS[0]]);
  });

  test('persists a newly added todo to localStorage', async ({ todoPage }) => {
    await todoPage.addTodo(TODO_ITEMS[0]);

    await expect
      .poll(() => getStoredTodos(todoPage.page))
      .toEqual([
        expect.objectContaining({ title: TODO_ITEMS[0], completed: false, id: expect.any(String) }),
      ]);
  });

  test('handles a large number of todos', async ({ todoPage }) => {
    const titles = generateTodoTitles(25);
    await todoPage.addTodos(titles);

    await expect(todoPage.todoItems).toHaveCount(25);
    await expect(todoPage.todoCount).toHaveText('25 items left');
  });
});

test.describe('Add todo - input edge cases', { tag: '@regression' }, () => {
  const cases = [
    ['special characters', EDGE_CASE_TITLES.specialCharacters],
    ['accented unicode', EDGE_CASE_TITLES.unicode],
    ['emoji', EDGE_CASE_TITLES.emoji],
    ['non-latin scripts', EDGE_CASE_TITLES.multiLanguage],
    ['SQL-like text', EDGE_CASE_TITLES.sqlLike],
    ['numbers only', EDGE_CASE_TITLES.numeric],
    ['very long text (500 chars)', EDGE_CASE_TITLES.longText],
  ];

  for (const [name, title] of cases) {
    test(`accepts ${name}`, async ({ todoPage }) => {
      await todoPage.addTodo(title);

      await expect(todoPage.todoTitles).toHaveText([title]);
    });
  }

  test(
    'renders HTML/script input as plain text (no XSS)',
    { tag: '@security' },
    async ({ todoPage }) => {
      let dialogOpened = false;
      todoPage.page.on('dialog', async (dialog) => {
        dialogOpened = true;
        await dialog.dismiss();
      });

      await todoPage.addTodos([EDGE_CASE_TITLES.htmlInjection, EDGE_CASE_TITLES.htmlMarkup]);

      await expect(todoPage.todoTitles).toHaveText([
        EDGE_CASE_TITLES.htmlInjection,
        EDGE_CASE_TITLES.htmlMarkup,
      ]);
      await expect(todoPage.todoItems.locator('b, i, script')).toHaveCount(0);
      expect(dialogOpened).toBe(false);
    },
  );
});
