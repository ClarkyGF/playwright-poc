import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const username = "username";
  const password = "password";
  await page.goto("/#/login");

  await page.fill("#username", username);
  expect(await page.locator("#username").inputValue()).toBe(username);

  await page.fill("#password", password);
  expect(await page.locator("#password").inputValue()).toBe(password);

  await page.click("#submit");
  expect(await page.locator("#submit")).toBeDisabled();

  await page.locator(".navbar").waitFor();
});

test.describe("Playwright demo scenario", () => {
  let originTotal;

  test.beforeEach(async ({ page }) => {
    await page.goto("/#/catalog/all");

    try {
      const confirmElement = await page.waitForSelector(
        "[data-testid='Modal-confirm']",
        { state: "visible" }
      );
      await confirmElement.click();
      await confirmElement.isHidden();
    } catch (error) {}

    await waitForLoaderToDisappear(page);

    originTotal = await page
      .locator(".ListPaginationInfo__total")
      .textContent();
  });

  test("Interact with products", async ({ page }) => {
    await expect(page.locator(".ListTableRow")).toHaveCount(20);

    await page.click("#list-actions-select-all");

    await expect(page.locator(".ListTableRow--selected")).toHaveCount(20);

    await expect(page.locator(".ListPaginationInfo__total")).toHaveText(
      originTotal
    );

    await page.click("#list-actions-select-all");

    await expect(page.locator(".ListTableRow--selected")).toHaveCount(0);

    await page.click(".CatalogCellActionWrapper--link");

    await waitForLoaderToDisappear(page);

    expect(await page.locator(".ProductFooter")).toBeVisible();
  });

  test("Interact with filters", async ({ page }) => {
    let filter1Total;

    await page.click(".SourceProductStatusFilter--DRAFT");
    await waitForLoaderToDisappear(page);

    filter1Total = await page
      .locator(".ListPaginationInfo__total")
      .textContent();
    await expect(filter1Total).not.toBe(originTotal);

    const collapsedFilter = await page.locator(
      "#list-filter-packshot .ListCollapsibleFilter--collapsed"
    );
    if (collapsedFilter) {
      await page.click("#list-filter-packshot button");
    }

    await page
      .locator("#list-filter-packshot .ListSimpleFilterItem")
      .first()
      .click();

    await waitForLoaderToDisappear(page);

    await expect(page.locator(".ListPaginationInfo__total")).not.toHaveText(
      originTotal
    );
    await expect(page.locator(".ListPaginationInfo__total")).not.toHaveText(
      filter1Total
    );

    await page.click(".ListSelectedFilters_remove");

    await expect(page.locator(".ListPaginationInfo__total")).toHaveText(
      originTotal
    );
  });

  test("Search in catalog", async ({ page }) => {
    const GTIN =
      (await page
        .locator("[data-testid='ProductReference__copyWrapper']")
        .first()
        .textContent()) || "Default Value";

    await page.locator(".Search .Search__input").fill(GTIN);

    await waitForLoaderToDisappear(page);

    await expect(page.locator("[data-code='GTIN']")).toContainText(GTIN);

    const text = "KAT";

    await page.locator(".Search .Search__input").fill(text);

    await waitForLoaderToDisappear(page);

    const nameMatches = page.locator("[data-code='NAME']").allTextContents();
    for (const nameMatch in nameMatches) {
      await expect(nameMatch).toContain(text);
    }
  });

  test("Export product", async ({ page }) => {
    await page.locator("[id^='catalog-row-checkbox-']").first().click();

    const exportButton = await page.locator(".Dropdown__button").first();

    expect(await exportButton.textContent()).toContain("Exporter 1");

    await exportButton.click();

    await page.getByText("Export fiche produit").click();

    expect(
      await page.locator("#SimpleSelect-catalog-export-modal-format-selector")
    ).toBeVisible();

    const closeButton = await page.locator(".Modal__footerCloseButton");

    expect(closeButton).toBeVisible();

    await closeButton.click();

    await expect(closeButton).toBeHidden();
  });
});

async function waitForLoaderToDisappear(page: Page) {
  await page.locator(".Loader")?.waitFor();

  await page.locator(".Loader").waitFor({ state: "hidden" });
}
