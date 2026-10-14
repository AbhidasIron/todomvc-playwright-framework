import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../src/fixtures/test-fixtures.js';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
// Known product defect (TodoMVC theme colours); tracked separately below so it doesn't mask new issues.
const KNOWN_ISSUE_RULES = ['color-contrast'];

/**
 * Runs an axe scan, attaches the full result to the report and returns the violations.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {{ includeKnownIssues?: boolean }} [options]
 */
async function scan(page, testInfo, { includeKnownIssues = false } = {}) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (!includeKnownIssues) builder.disableRules(KNOWN_ISSUE_RULES);
  const results = await builder.analyze();
  await testInfo.attach('axe-results', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  return results.violations;
}

test.describe('Accessibility (WCAG 2.1 AA)', { tag: ['@a11y', '@regression'] }, () => {
  test('empty state has no violations', async ({ todoPage }, testInfo) => {
    expect(await scan(todoPage.page, testInfo)).toEqual([]);
  });

  test('list with active and completed todos has no violations', async ({
    seededTodoPage,
  }, testInfo) => {
    await seededTodoPage.todo(0).complete();

    expect(await scan(seededTodoPage.page, testInfo)).toEqual([]);
  });

  test('edit mode has no violations', async ({ seededTodoPage }, testInfo) => {
    await seededTodoPage.todo(0).startEditing();

    expect(await scan(seededTodoPage.page, testInfo)).toEqual([]);
  });

  test('interactive controls expose accessible names', async ({ seededTodoPage }) => {
    const item = seededTodoPage.todo(0);

    await expect(item.checkbox).toHaveAccessibleName('Toggle Todo');
    await item.root.hover();
    await expect(item.deleteButton).toHaveAccessibleName('Delete');
    // The label's CSS ::before glyph "❯" is included in the computed name by browsers.
    await expect(seededTodoPage.toggleAllCheckbox).toHaveAccessibleName(/Mark all as complete$/);
  });

  test('text meets WCAG AA colour contrast', async ({ todoPage }, testInfo) => {
    test.fail(true, 'Known defect: header, filters and footer text use low-contrast colours');

    expect(await scan(todoPage.page, testInfo, { includeKnownIssues: true })).toEqual([]);
  });
});
