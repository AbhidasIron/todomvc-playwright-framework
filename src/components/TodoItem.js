/** Component object for a single `<li>` row in the todo list. */
export class TodoItem {
  /** @param {import('@playwright/test').Locator} root */
  constructor(root) {
    this.root = root;
    this.checkbox = root.getByRole('checkbox', { name: 'Toggle Todo' });
    this.label = root.getByTestId('todo-title');
    this.deleteButton = root.getByRole('button', { name: 'Delete' });
    this.editInput = root.getByRole('textbox', { name: 'Edit' });
  }

  async toggle() {
    await this.checkbox.click();
  }

  async complete() {
    await this.checkbox.check();
  }

  async reopen() {
    await this.checkbox.uncheck();
  }

  /** The delete button is only rendered visible on hover, like a real user would see it. */
  async delete() {
    await this.root.hover();
    await this.deleteButton.click();
  }

  async startEditing() {
    await this.label.dblclick();
  }

  /**
   * @param {string} newTitle
   * @param {'Enter' | 'Escape' | 'blur'} commitWith
   */
  async edit(newTitle, commitWith = 'Enter') {
    await this.startEditing();
    await this.editInput.fill(newTitle);
    if (commitWith === 'blur') {
      await this.editInput.blur();
    } else {
      await this.editInput.press(commitWith);
    }
  }
}
