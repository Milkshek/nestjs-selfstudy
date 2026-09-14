import { expect, test } from "@playwright/test";

test("renders the French and English home pages", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Des articles pour comprendre, construire et partager.");

  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Articles to understand, build, and share.");
});
