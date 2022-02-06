import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
});

const TODO_ITEMS = [
  'buy some cheese',
  'feed the cat',
  'book a doctors appointment'
];

test.describe.parallel('Persistence', () => {
  test('should persist its data', async ({ page }) => {
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await page.locator('.new-todo').fill(item);
      await page.locator('.new-todo').press('Enter');
    }

    const todoItems = page.locator('.todo-list li');
    await todoItems.nth(0).locator('.toggle').check();
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await expect(todoItems).toHaveClass(['completed', '']);

    // Ensure there is 1 completed item.
    checkNumberOfCompletedTodosInLocalStorage(page, 1);

    // Now reload.
    await page.reload();
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await expect(todoItems).toHaveClass(['completed', '']);
  });
});

test.describe.parallel('Routing main', () => {
  test.beforeEach(async ({ page }) => {
    await createDefaultTodos(page);
    // make sure the app had a chance to save updated todos in storage
    // before navigating to a new view, otherwise the items can get lost :(
    // in some frameworks like Durandal
    await checkTodosInLocalStorage(page, TODO_ITEMS[0]);
  });

  test('should allow me to display active items', async ({ page }) => {
    await page.locator('.todo-list li .toggle').nth(1).check();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);
    await page.locator('.filters >> text=Active').click();
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    await expect(page.locator('.todo-list li')).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  test('should respect the back button', async ({ page }) => {
    await page.locator('.todo-list li .toggle').nth(1).check();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    await test.step('Showing all items', async () => {
      await page.locator('.filters >> text=All').click();
      await expect(page.locator('.todo-list li')).toHaveCount(3);
    });

    await test.step('Showing active items', async () => {
      await page.locator('.filters >> text=Active').click();
    });

    await test.step('Showing completed items', async () => {
      await page.locator('.filters >> text=Completed').click();
    });

    await expect(page.locator('.todo-list li')).toHaveCount(1);
    await page.goBack();
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    await page.goBack();
    await expect(page.locator('.todo-list li')).toHaveCount(3);
  });

  test('should allow me to display completed items', async ({ page }) => {
    await page.locator('.todo-list li .toggle').nth(1).check();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);
    await page.locator('.filters >> text=Completed').click();
    await expect(page.locator('.todo-list li')).toHaveCount(1);
  });

  test('should allow me to display all items', async ({ page }) => {
    await page.locator('.todo-list li .toggle').nth(1).check();
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);
    await page.locator('.filters >> text=Active').click();
    await page.locator('.filters >> text=Completed').click();
    await page.locator('.filters >> text=All').click();
    await expect(page.locator('.todo-list li')).toHaveCount(3);
  });

  test('should highlight the currently applied filter', async ({ page }) => {
    await expect(page.locator('.filters >> text=All')).toHaveClass('selected');
    await page.locator('.filters >> text=Active').click();
    // Page change - active items.
    await expect(page.locator('.filters >> text=Active')).toHaveClass('selected');
    await page.locator('.filters >> text=Completed').click();
    // Page change - completed items.
    await expect(page.locator('.filters >> text=Completed')).toHaveClass('selected');
  });
});

async function createDefaultTodos(page: Page) {
  for (const item of TODO_ITEMS) {
    await page.locator('.new-todo').fill(item);
    await page.locator('.new-todo').press('Enter');
  }
}

async function checkNumberOfCompletedTodosInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction(e => {
    return JSON.parse(localStorage['react-todos']).filter(i => i.completed).length === e;
  }, expected);
}

async function checkTodosInLocalStorage(page: Page, title: string) {
  return await page.waitForFunction(t => {
    return JSON.parse(localStorage['react-todos']).map(i => i.title).includes(t);
  }, title);
}
