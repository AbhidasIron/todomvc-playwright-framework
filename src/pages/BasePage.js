/** Shared behaviour for every page object. */
export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** Navigates relative to `baseURL` from the config. */
  async open(path = './') {
    await this.page.goto(path);
  }

  async reload() {
    await this.page.reload();
  }

  async title() {
    return this.page.title();
  }

  url() {
    return this.page.url();
  }
}
