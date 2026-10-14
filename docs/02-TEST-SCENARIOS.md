# Test Scenario Catalogue

Legend: **S** = `@smoke` (also runs on mobile), all E2E tests are `@regression`. Every E2E scenario runs on Chromium, Firefox and WebKit.

## 1. Page layout & initial state: `tests/e2e/layout.spec.js`

| #   | Scenario                                                       | Tag |
| --- | -------------------------------------------------------------- | --- |
| L1  | Page title is `React • TodoMVC`, `todos` header visible        | S   |
| L2  | Input visible, empty, auto-focused, correct placeholder        |     |
| L3  | List, toggle-all and footer hidden when there are no todos     |     |
| L4  | List, footer and all three filters appear after the first todo |     |
| L5  | Info footer shows hint text and correct credit links           |     |
| L6  | Demo disclaimer banner and link                                |     |

## 2. Add todo: `tests/e2e/add-todo.spec.js`

| #       | Scenario                                                                                        | Tag         |
| ------- | ----------------------------------------------------------------------------------------------- | ----------- |
| A1      | Add a single todo, counter shows `1 item left`                                                  | S           |
| A2      | Add multiple todos, insertion order preserved                                                   | S           |
| A3      | Input cleared and still focused after adding                                                    |             |
| A4      | New todo is active (unchecked, no `completed` class)                                            |             |
| A5      | New todo appended at the bottom                                                                 |             |
| A6      | Empty input is ignored                                                                          |             |
| A7      | Whitespace-only input is ignored                                                                |             |
| A8      | Leading/trailing whitespace trimmed                                                             |             |
| A9      | Duplicate titles allowed                                                                        |             |
| A10     | New todo persisted in localStorage with `id/title/completed`                                    |             |
| A11     | 25 Faker-generated todos, counter `25 items left`                                               |             |
| A12–A18 | Special chars, accented unicode, emoji, CJK/Hindi/Arabic, SQL-like text, numeric, 500-char text |             |
| A19     | `<script>` / HTML rendered as plain text, no dialog, no injected elements (XSS)                 | `@security` |

## 3. Complete & toggle-all: `tests/e2e/complete-todo.spec.js`

| #   | Scenario                                                 | Tag |
| --- | -------------------------------------------------------- | --- |
| C1  | Mark todo completed (checked + `completed` class)        | S   |
| C2  | Un-mark a completed todo                                 |     |
| C3  | Completed todo has `line-through` styling                |     |
| C4  | Completing one todo does not affect others               |     |
| C5  | Completed state saved to localStorage                    |     |
| C6  | Mark all complete, counter `0 items left`                | S   |
| C7  | Toggle-all twice re-opens all                            |     |
| C8  | Toggle-all checkbox state follows individual changes     |     |
| C9  | Toggle-all completes the rest when some are already done |     |

## 4. Edit: `tests/e2e/edit-todo.spec.js`

| #   | Scenario                                             | Tag |
| --- | ---------------------------------------------------- | --- |
| E1  | Double-click opens edit mode, pre-filled and focused |     |
| E2  | Checkbox, label and delete hidden while editing      |     |
| E3  | Enter saves                                          | S   |
| E4  | Blur saves                                           |     |
| E5  | Escape cancels                                       |     |
| E6  | Edited text trimmed                                  |     |
| E7  | Empty edit deletes the todo                          |     |
| E8  | Whitespace-only edit deletes the todo                |     |
| E9  | Editing a completed todo keeps it completed          |     |
| E10 | Edit persisted in localStorage                       |     |

## 5. Delete: `tests/e2e/delete-todo.spec.js`

| #   | Scenario                                                | Tag |
| --- | ------------------------------------------------------- | --- |
| D1  | Delete button hidden until hover                        |     |
| D2  | Delete a todo, counter updates                          | S   |
| D3  | Delete first and last todos                             |     |
| D4  | Delete a completed todo (Clear completed disappears)    |     |
| D5  | Deleting all hides main section and footer              |     |
| D6  | With duplicate titles, only the targeted row is deleted |     |

## 6. Counter: `tests/e2e/counter.spec.js`

| #   | Scenario                                  | Tag |
| --- | ----------------------------------------- | --- |
| N1  | Singular `1 item left`                    |     |
| N2  | Plural `3 items left`                     | S   |
| N3  | Counts only active todos                  |     |
| N4  | `0 items left` when all completed         |     |
| N5  | Increments when a todo is re-opened       |     |
| N6  | Decrements when an active todo is deleted |     |
| N7  | Same count regardless of filter           |     |

## 7. Clear completed: `tests/e2e/clear-completed.spec.js`

| #   | Scenario                                                  | Tag |
| --- | --------------------------------------------------------- | --- |
| CC1 | Hidden when nothing is completed                          |     |
| CC2 | Appears after completing a todo                           |     |
| CC3 | Removes completed, keeps active                           | S   |
| CC4 | Hides itself after clearing                               |     |
| CC5 | Clearing everything empties the list and hides the footer |     |
| CC6 | Works from the Completed filter                           |     |

## 8. Filters & routing: `tests/e2e/filters.spec.js`

| #   | Scenario                                                         | Tag |
| --- | ---------------------------------------------------------------- | --- |
| F1  | `All` selected by default, shows everything                      |     |
| F2  | `Active` shows active only, URL `#/active`                       | S   |
| F3  | `Completed` shows completed only, URL `#/completed`              | S   |
| F4  | `All` restores the full list, URL `#/`                           |     |
| F5  | Only the current filter is highlighted (data-driven)             |     |
| F6  | Browser Back/Forward navigates between filters                   |     |
| F7  | Deep link `#/completed` opens that filter                        |     |
| F8  | Completing a todo in Active removes it from view                 |     |
| F9  | Re-opening a todo in Completed removes it from view              |     |
| F10 | Todo added while on Completed is hidden there, visible in Active |     |

## 9. Persistence: `tests/e2e/persistence.spec.js`

| #   | Scenario                                               | Tag |
| --- | ------------------------------------------------------ | --- |
| P1  | Todos survive reload                                   | S   |
| P2  | Completed state survives reload                        |     |
| P3  | Deletions survive reload                               |     |
| P4  | Filter kept after reload (URL hash)                    |     |
| P5  | Storage schema: `{ id, title, completed }`, unique ids |     |
| P6  | Todos seeded directly into localStorage are rendered   |     |
| P7  | State shared between tabs of the same context          |     |
| P8  | State isolated between browser contexts                |     |
| P9  | App recovers when localStorage is cleared              |     |

## 10. Accessibility & keyboard: `tests/a11y/`

| #   | Scenario                                                                     |
| --- | ---------------------------------------------------------------------------- |
| X1  | axe WCAG 2.1 AA scan: empty state                                            |
| X2  | axe scan: list with active + completed                                       |
| X3  | axe scan: edit mode                                                          |
| X4  | Controls expose accessible names (Toggle Todo, Delete, Mark all as complete) |
| X5  | Colour contrast: **known defect**, `test.fail()`                             |
| K1  | Add todos using only the keyboard                                            |
| K2  | Tab moves focus from input to toggle-all                                     |
| K3  | Space toggles a todo                                                         |
| K4  | Edit with keyboard: Enter saves, Escape cancels                              |

## 11. Visual regression: `tests/visual/visual.spec.js`

| #   | Baseline                           |
| --- | ---------------------------------- |
| V1  | Empty state (full page)            |
| V2  | List with active + completed items |
| V3  | All items completed                |
| V4  | Todo in edit mode                  |
| V5  | Hovered todo shows delete button   |

## 12. BDD: `tests/bdd/features/`

**add-todo.feature**: add single (S), add several (data table), blank input ignored (Scenario Outline: 0, 1, 10 spaces), input trimmed.

**manage-todos.feature** (Background seeds 3 todos): complete (S), edit, cancel edit with Escape, delete, clear completed, persist after reload, filter by All/Active/Completed (Scenario Outline with URL check).

---

## Bugs / observations found by the suite

| ID    | Area          | Finding                                                                                          | Severity      | Handling                                   |
| ----- | ------------- | ------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------ |
| BUG-1 | Accessibility | Text colour contrast below WCAG AA: `todos` header (1.26:1), filter links, footer text and links | Serious (axe) | `test.fail()` known-defect test            |
| OBS-1 | Accessibility | Toggle-all accessible name includes the CSS glyph: `❯Mark all as complete`                       | Minor         | Assertion tolerates the prefix, documented |
| OBS-2 | UX            | Delete button is hover-only, so it can't be discovered on touch devices without a tap            | Minor         | Covered by D1                              |

## Out of scope (and why)

- **API tests**: the app has no backend. State lives in localStorage, which is covered by persistence tests and used for fast seeding.
- **Performance/load**: a static demo site. A lightweight check would be Lighthouse CI or `performance.timing` assertions.
- **Security beyond XSS**: no auth, server or inputs that reach a server.
