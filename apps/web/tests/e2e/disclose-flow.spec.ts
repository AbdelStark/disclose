import { expect, test } from "@playwright/test";
import path from "path";

test("web wizard end-to-end flow", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());

  await page.goto("/new?template=code");
  await expect(page.getByText("Technical Project (Code / Repo)")).toBeVisible();
  await page.getByText("Technical Project (Code / Repo)").click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByPlaceholder("Project title").fill("Web E2E Disclosure");
  await page.getByPlaceholder("Your name or handle").fill("Playwright");
  await page.getByRole("button", { name: "Add link" }).click();
  await page.getByPlaceholder("https://example.com").fill("https://example.com/disclose");
  await page.getByRole("button", { name: "Next" }).click();

  const fixtures = path.join(__dirname, "fixtures");
  await page.setInputFiles("#proof-upload", [
    path.join(fixtures, "proof-a.txt"),
    path.join(fixtures, "proof-b.md")
  ]);
  await expect(page.getByText("Hashed")).toHaveCount(2);
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Add tool" }).click();
  await page.getByPlaceholder("ChatGPT").fill("ChatGPT");
  await page.getByPlaceholder("OpenAI").fill("OpenAI");
  await page.getByPlaceholder("GPT-4.1").fill("GPT-4.1");
  await page.getByPlaceholder("Idea generation").fill("Editing assistance");
  await page
    .getByPlaceholder("Describe what AI did and where you double-checked.")
    .fill("Assisted with outline and revisions.");

  await page.locator('input[type="range"]').evaluate((el) => {
    (el as HTMLInputElement).value = "25";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.getByRole("button", { name: "Advanced: per-stage breakdown" }).click();
  await page.getByRole("button", { name: "Light" }).first().click();
  await page.getByRole("button", { name: "Moderate" }).nth(1).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("OpenTimestamps")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Web E2E Disclosure")).toBeVisible();
  await expect(page.locator("p.font-mono").filter({ hasText: /[a-f0-9]{64}/ })).toHaveCount(1);
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByRole("button", { name: "Publish disclosure" }).click();
  await expect(page.getByText("Published:")).toBeVisible();
  const publicUrl = await page.getByRole("link").first().getAttribute("href");
  expect(publicUrl).toBeTruthy();

  await page.goto(publicUrl as string);
  await expect(page.getByText("Proof Hash Ledger")).toBeVisible();
  await expect(page.getByText("Verify with CLI")).toBeVisible();
  await expect(page.getByText("Web E2E Disclosure")).toBeVisible();
});
