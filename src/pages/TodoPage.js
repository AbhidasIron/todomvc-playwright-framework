import { BasePage } from './BasePage.js';
import { TodoItem } from '../components/TodoItem.js';

/** @typedef {'All' | 'Active' | 'Completed'} Filter */

const FILTER_ROUTES = { All: '#/', Active: '#/active', Completed: '#/completed' };

export class TodoPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'todos', level: 1 });
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.toggleAllCheckbox = page.getByLabel('Mark all as complete');
    this.todoItems = page.getByTestId('todo-item');
    this.todoTitles = page.getByTestId('todo-title');
    this.todoCount = page.getByTestId('todo-count');
    this.mainSection = page.locator('section.main');
    this.footer = page.locator('footer.footer');
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
    this.infoFooter = page.locator('footer.info');
    this.demoBanner = page.getByText('This is just a demo of TodoMVC for testing');
  }

  /** @param {Filter} filter */
  async goto(filter = 'All') {
    await this.open(`./${FILTER_ROUTES[filter]}`);
  }

  /** @param {Filter} name */
  filterLink(name) {
    return this.footer.getByRole('link', { name, exact: true });
  }

  /** @param {Filter} name */
  async filterBy(name) {
    await this.filterLink(name).click();
  }

  /** @param {string} title */
  async addTodo(title) {
    await this.newTodoInput.fill(title);
    await this.newTodoInput.press('Enter');
  }

  /** @param {string[]} titles */
  async addTodos(titles) {
    for (const title of titles) {
      await this.addTodo(title);
    }
  }

  /**
   * Returns a component for a todo row, located by visible title or zero-based index.
   * @param {string | number} titleOrIndex
   */
  todo(titleOrIndex) {
    const root =
      typeof titleOrIndex === 'number'
        ? this.todoItems.nth(titleOrIndex)
        : this.todoItems.filter({
            has: this.page
              .getByTestId('todo-title')
              .and(this.page.getByText(titleOrIndex, { exact: true })),
          });
    return new TodoItem(root);
  }

  async toggleAll() {
    await this.toggleAllCheckbox.click();
  }

  async clearCompleted() {
    await this.clearCompletedButton.click();
  }

  async getTodoTitles() {
    return this.todoTitles.allTextContents();
  }
}
