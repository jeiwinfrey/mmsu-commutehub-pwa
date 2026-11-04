import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { test, expect } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
async function cleanTestAccount(page: import("@playwright/test").Page) {
  if (page.isClosed()) return;
  const identity = await page.evaluate(async () => {
    const clerk = (
      window as unknown as {
        Clerk?: {
          user?: { primaryEmailAddress?: { emailAddress: string } };
          session?: {
            getToken: (options: { template: string }) => Promise<string | null>;
          };
        };
      }
    ).Clerk;
    const email = clerk?.user?.primaryEmailAddress?.emailAddress;
    if (
      !email ||
      ![
        "commutehub-qa+clerk_test@example.com",
        "commutehub-observer+clerk_test@example.com",
      ].includes(email)
    )
      return null;
    return { token: await clerk?.session?.getToken({ template: "convex" }) };
  });
  if (!identity) return;
  if (!identity.token)
    throw new Error(
      "Could not clean up the dedicated development test account.",
    );
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  client.setAuth(identity.token);
  await client.mutation(api.accountDeletion.removeMyData, {});
}
test.afterEach(async ({ browser }) => {
  for (const context of browser.contexts())
    for (const page of context.pages()) await cleanTestAccount(page);
});
const main = (page: import("@playwright/test").Page) =>
  page.getByRole("main").filter({ visible: true });
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.route("https://*.tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGrsAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
});
test("Google sign-in is available and private pages ask for an account", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: /Google/ })).toBeVisible({
    timeout: 30000,
  });
  await page.goto("/profile");
  await expect(
    page.getByRole("link", { name: "Sign in or create an account" }),
  ).toBeVisible();
});
test("public routes and phone navigation stay within the viewport", async ({
  page,
}) => {
  for (const width of [320, 360, 390, 430, 844]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/commute",
      "/onboarding",
      "/community",
      "/planner",
      "/trips",
      "/profile",
      "/alerts",
    ]) {
      await page.goto(path);
      await expect(main(page)).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow, `${path} at ${width}`).toBe(false);
    }
  }
});
test("signed-in preferences, trip lifecycle, and planner persist in the real database", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/commute");
  await clerk.signIn({
    page,
    emailAddress: "commutehub-qa+clerk_test@example.com",
  });
  await page.goto("/profile");
  await expect(page.getByLabel("Display name")).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Display name").fill("QA Commuter");
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(
    page.getByText("Preferences saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("QA Commuter");
  await page.goto("/trips");
  await expect(page.getByRole("heading", { name: /Every ride/ })).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  const cancel = page.getByRole("button", { name: "Cancel trip", exact: true });
  if (await cancel.isVisible()) {
    await cancel.click();
    await expect(
      page.getByText("Trip cancelled", { exact: true }),
    ).toBeVisible();
  }
  await page.goto("/commute");
  await page.getByRole("button", { name: "See available vehicles" }).click();
  await expect(
    page
      .getByRole("button", { name: "Choose vehicle" })
      .and(page.locator("button:enabled"))
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose vehicle" })
    .and(page.locator("button:enabled"))
    .first()
    .click();
  await page.getByRole("button", { name: "Use this pickup" }).click();
  await page.getByRole("button", { name: "Confirm pickup and radius" }).click();
  await page
    .getByRole("button", { name: "Start tracking this vehicle" })
    .click();
  await expect(
    page.getByRole("button", { name: "I have boarded" }),
  ).toBeVisible({ timeout: 30000 });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "I have boarded" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "I have boarded" }).click();
  await expect(
    page.getByRole("button", { name: "I’ve arrived · complete trip" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "I’ve arrived · complete trip" })
    .click();
  await expect(page.getByText("Trip completed", { exact: true })).toBeVisible();
  await page.goto("/trips");
  await expect(
    page.getByText("completed", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ride again", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/commute\/vehicles/);
  await page.goto("/trips");
  await page
    .getByRole("button", { name: "Trip details", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Delete trip from history", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete trip", exact: true })
    .click();
  await expect(
    page.getByText("Trip removed from history", { exact: true }),
  ).toBeVisible();
  await page.goto("/planner");
  const tomorrow = new Date(Date.now() + 86400000);
  const date = tomorrow.toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  await page.getByLabel("Class starts · Philippine time").fill(`${date}T10:00`);
  await page
    .getByRole("button", { name: "Suggest and save departure" })
    .click();
  await expect(
    page.getByText("Departure plan saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("SUGGESTED DEPARTURE").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Edit plan", exact: true })
    .first()
    .click();
  await page.getByLabel("Class starts · Philippine time").fill(`${date}T11:00`);
  await page
    .getByRole("button", { name: "Update departure plan", exact: true })
    .click();
  await expect(
    page.getByText("Departure plan updated", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Use this route", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/commute\/vehicles/);
  await expect(
    page.getByRole("radio", { name: "Modern", exact: true }),
  ).toBeChecked();
  await page.goto("/planner");
  await page.screenshot({
    path: "/tmp/commutehub-planner.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Remove plan", exact: true })
    .first()
    .click();
  await expect(page.getByText("Plan removed", { exact: true })).toBeVisible();
});
test("manifest, service worker, and offline navigation work", async ({
  page,
  context,
  request,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  await page.goto("/commute");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto("/planner");
  await expect(
    page.getByRole("heading", { name: /A little pause/ }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("community changes and saved-route alerts synchronize between accounts", async ({
  page,
  browser,
}) => {
  const observerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const observer = await observerContext.newPage();
  await observer.goto("/commute");
  await clerk.signIn({
    page: observer,
    emailAddress: "commutehub-observer+clerk_test@example.com",
  });
  await observer.goto("/profile");
  await expect(observer.getByLabel("Display name")).toBeVisible({
    timeout: 30000,
  });
  await observer
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(
    observer.getByText("Preferences saved", { exact: true }),
  ).toBeVisible();
  const route = observer.getByRole("button", {
    name: /Laoag → Paoay, Traditional jeepney\. (Save route|Saved)/,
  });
  if ((await route.getAttribute("aria-pressed")) !== "true")
    await route.click();
  await expect(route).toHaveAttribute("aria-pressed", "true");
  await page.goto("/commute");
  await clerk.signIn({
    page,
    emailAddress: "commutehub-qa+clerk_test@example.com",
  });
  await page.goto("/community");
  await page.getByRole("button", { name: "Share a commute report" }).click();
  const area = `Laoag QA ${Date.now()}`;
  await page.getByLabel("Area or stop").fill(area);
  await page
    .getByLabel("What did you observe?")
    .fill(
      "Dedicated development test: traffic moving slowly near the candidate stop.",
    );
  await page.getByRole("button", { name: "Publish report" }).click();
  await expect(
    page.getByText("Report shared with the community", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(area, { exact: true })).toBeVisible();
  await observer.goto("/alerts");
  await expect(
    observer.getByText(`traffic report · ${area}`, { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await observer.getByRole("link", { name: "View report" }).first().click();
  const report = observer
    .locator('[data-slot="card"]')
    .filter({ hasText: area });
  await report.getByRole("button", { name: "I saw this too" }).click();
  await expect(
    report.getByText("1 student confirmation · not official verification", {
      exact: true,
    }),
  ).toBeVisible();
  const own = page.locator('[data-slot="card"]').filter({ hasText: area });
  await expect(
    own.getByText("1 student confirmation · not official verification", {
      exact: true,
    }),
  ).toBeVisible();
  await own.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("What did you observe?")
    .fill(
      "Updated dedicated development test: the queue has started moving again.",
    );
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    report.getByText(
      "Updated dedicated development test: the queue has started moving again.",
      { exact: true },
    ),
  ).toBeVisible();
  await own.getByRole("button", { name: "Mark resolved" }).click();
  await expect(report.getByText("Resolved", { exact: true })).toBeVisible();
  await observer.goto("/alerts");
  const alert = observer
    .locator('[data-slot="card"]')
    .filter({ hasText: area });
  await expect(
    alert.getByText(
      "Updated dedicated development test: the queue has started moving again.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(alert.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(
    observer.getByRole("link", { name: "Open alerts", exact: true }),
  ).toBeVisible();
  await cleanTestAccount(observer);
  await observerContext.close();
});

test("dedicated disposable account deletion clears app data and authentication", async ({
  page,
}) => {
  await page.goto("/commute");
  await clerk.signIn({
    page,
    emailAddress: "commutehub-delete-qa+clerk_test@example.com",
  });
  await page.goto("/profile");
  await expect(page.getByLabel("Display name")).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await expect(
    page.getByText("Preferences saved", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete my account", exact: true })
    .click();
  await page.getByLabel("Type DELETE").fill("DELETE");
  await page
    .getByRole("button", { name: "Delete permanently", exact: true })
    .click();
  await expect(page).toHaveURL(/sign-in/, { timeout: 20000 });
  await page.goto("/profile");
  await expect(
    page.getByRole("link", { name: "Sign in or create an account" }),
  ).toBeVisible({ timeout: 20000 });
});
