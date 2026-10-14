import { faker } from '@faker-js/faker';

/** Stable data: use where exact values matter (visual baselines, ordering checks). */
export const TODO_ITEMS = ['Buy groceries', 'Book doctor appointment', 'Pay electricity bill'];

export const EDGE_CASE_TITLES = {
  withSurroundingSpaces: '   Walk the dog   ',
  specialCharacters: `!@#$%^&*()_+-=[]{}|;':",./<>?~\``,
  unicode: 'Café résumé – naïve façade',
  emoji: 'Ship release 🚀✅🎉',
  multiLanguage: 'こんにちは 你好 नमस्ते مرحبا',
  htmlInjection: '<script>alert("xss")</script>',
  htmlMarkup: '<b>bold</b> <i>italic</i>',
  sqlLike: "'; DROP TABLE todos; --",
  numeric: '1234567890',
  longText: 'L'.repeat(500),
};

/**
 * Dynamic data: unique per run, so tests never depend on leftovers from other tests.
 * @param {number} count
 */
export function generateTodoTitles(count) {
  return Array.from(
    { length: count },
    (_, i) => `${faker.hacker.verb()} ${faker.hacker.noun()} #${i + 1}`,
  );
}
