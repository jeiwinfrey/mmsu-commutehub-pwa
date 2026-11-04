import { test, expect, type Page } from "@playwright/test";
import {
  commuteRoutes,
  matchingRoutes,
  estimateFare,
  vehiclesFor,
  type Coordinate,
} from "../../src/lib/commute-catalog";
import { cumulativeDistances } from "../../src/components/maps/road-path";
import { advanceMotion } from "../../src/features/tracking/components/simulation";

const transparent =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2XcAAAAASUVORK5CYII=";
test.beforeEach(async ({ page }) => {
  // No tile crawling or public-service traffic during automated UI checks.
  await page.route("https://tile.openstreetmap.org/**", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(transparent, "base64"),
    }),
  );
  await page.route("https://router.project-osrm.org/**", (r) => {
    const coords = r
      .request()
      .url()
      .split("/driving/")[1]
      .split("?")[0]
      .split(";")
      .map((p) => p.split(",").map(Number));
    return r.fulfill({
      json: {
        code: "Ok",
        routes: [{ geometry: { type: "LineString", coordinates: coords } }],
      },
    });
  });
});
async function choose(page: Page, label: string, value: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function selectVehicle(page: Page) {
  await page.goto("/commute");
  await page
    .getByRole("button", { name: "See available vehicles", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Choose your ride", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose vehicle", exact: true })
    .first()
    .click();
}
async function startWatch(page: Page) {
  await selectVehicle(page);
  await expect(
    page.getByRole("heading", { name: /Where will you/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use this pickup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm pickup and radius", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Watch this vehicle · demo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play simulation", exact: true }),
  ).toBeVisible();
}

test("onboarding validates, saves in memory, allows back and skip without permissions", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Get started", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a display name");
  await page.getByLabel("Display name", { exact: true }).fill("Aira");
  await choose(page, "Preferred transportation", "Modern jeepney");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Choose pickup manually", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "candidate boarding stop",
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "Aira",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Find my commute", exact: true })
    .click();
  await expect(page).toHaveURL("/commute");
  await expect(page.getByText(/Hi Aira/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Hi Aira/)).toHaveCount(0);
});
test("route direction, stops and unsupported journeys", async ({ page }) => {
  await page.goto("/commute");
  await page
    .getByRole("button", { name: "View ordered stops", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Laoag candidate boarding area",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Swap direction", exact: true })
    .click();
  await expect(page.getByText(/MMSU Batac → Laoag/)).toBeVisible();
  await choose(page, "To", "MMSU Dingras · outside demo coverage");
  await expect(
    page.getByText("No supported journey", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Try Laoag to MMSU Batac", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "See available vehicles", exact: true }),
  ).toBeVisible();
});
test("bus modes, occupancy, fare details, and empty filter recover", async ({
  page,
}) => {
  await page.goto("/commute");
  await choose(page, "To", "Badoc");
  await page
    .getByRole("button", { name: "See available vehicles", exact: true })
    .first()
    .click();
  await page.getByRole("radio", { name: "Bus", exact: true }).click();
  await page
    .getByRole("button", { name: "View details", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Student discount (20%)",
  );
  await expect(page.getByRole("dialog")).toContainText("Laoag → Badoc");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Choose vehicle", exact: true }).nth(2),
  ).toBeDisabled();
  await page.getByRole("radio", { name: "Modern", exact: true }).click();
  await expect(
    page.getByText("No vehicles available", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all modes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View details", exact: true }).first(),
  ).toBeVisible();
});
test("pickup filters, radius and fare propagate through review and tracking", async ({
  page,
}) => {
  await selectVehicle(page);
  await page
    .getByLabel("Search candidate stops", { exact: true })
    .fill("San Nicolas");
  await page
    .getByRole("button", { name: /San Nicolas candidate stop/ })
    .click();
  await page
    .getByRole("button", { name: "Use this pickup", exact: true })
    .click();
  await page.getByRole("radio", { name: "1 km", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm pickup and radius", exact: true })
    .click();
  await expect(
    page.getByText("1,000 m around pickup", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Watch this vehicle · demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Arrives in about/ }),
  ).toBeVisible();
  await expect(page.getByText("1,000 m", { exact: true })).toBeVisible();
  await expect(
    page.getByText("San Nicolas candidate stop", { exact: true }),
  ).toBeVisible();
});
test("simulation moves, pauses, alerts once, handles stale, missed and cancel", async ({
  page,
}) => {
  await startWatch(page);
  await page
    .getByRole("button", { name: "Play simulation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause simulation", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await page.getByText("UI preview states", { exact: true }).click();
  await choose(page, "Preview state", "Vehicle enters area");
  await expect(page.getByRole("status")).toContainText(
    "entered the pickup area",
  );
  await expect(
    page.getByText(/Nearby alert events in this playback: 1/),
  ).toBeVisible();
  await choose(page, "Preview state", "Arriving at pickup");
  await expect(
    page.getByText(/Nearby alert events in this playback: 1/),
  ).toBeVisible();
  await choose(page, "Preview state", "Stale updates");
  await expect(
    page.getByRole("heading", { name: "Estimate unavailable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play simulation", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry updates", exact: true })
    .click();
  await choose(page, "Preview state", "Vehicle passed / missed");
  await expect(
    page.getByRole("heading", { name: "Missed this vehicle?", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel this demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Stop demo", exact: true }).click();
  await expect(page.getByText("No active demo", { exact: true })).toBeVisible();
});
test("routing and tile failure keep manual pickup usable", async ({ page }) => {
  await page.unroute("https://router.project-osrm.org/**");
  await page.route("https://router.project-osrm.org/**", (r) => r.abort());
  await page.unroute("https://tile.openstreetmap.org/**");
  await page.route("https://tile.openstreetmap.org/**", (r) => r.abort());
  await selectVehicle(page);
  await expect(page.getByText(/Road routing is unavailable/)).toBeVisible();
  await page
    .getByRole("button", { name: "Use stop list instead", exact: true })
    .click();
  await page
    .getByLabel("Search candidate stops", { exact: true })
    .fill("nonexistent");
  await expect(
    page.getByText("No matching pickup stops", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear stop search", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use this pickup", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /How early/ })).toBeVisible();
});
test("direct links explain missing demo selections", async ({ page }) => {
  for (const [url, text] of [
    ["/commute/pickup", "No vehicle selected"],
    ["/commute/tracking", "No active demo"],
  ]) {
    await page.goto(url);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }
});
test("phone screens fit at supported sizes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 360, 390, 430, 844]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    for (const route of ["/onboarding", "/commute", "/commute/vehicles"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});
test("catalog direction, fare math and proximity event invariants", () => {
  expect(commuteRoutes).toHaveLength(8);
  expect(
    matchingRoutes("laoag", "mmsu").every((r) => r.mode !== "bus"),
  ).toBeTruthy();
  expect(
    matchingRoutes("paoay", "laoag").every((r) => r.direction === "inbound"),
  ).toBeTruthy();
  expect(matchingRoutes("mmsu", "mmsu")).toHaveLength(0);
  const route = commuteRoutes[0];
  const f = estimateFare(route, "laoag", "paoay")!;
  expect(f.studentCentavos).toBe(Math.round(f.regularCentavos * 0.8));
  expect(estimateFare(route, "paoay", "laoag")).toBeNull();
  expect(vehiclesFor(route, "paoay", "laoag")).toHaveLength(0);
  const points: Coordinate[] = [
    [120.59, 18.21],
    [120.59, 18.2],
    [120.59, 18.19],
  ];
  const distances = cumulativeDistances(points);
  const pickup = points[1];
  let state = { meters: 0, seconds: 0, notified: false, notificationCount: 0 };
  state = advanceMotion(
    state,
    distances[1] - 80,
    1,
    points,
    distances,
    pickup,
    distances[1],
    100,
  );
  expect(state.notificationCount).toBe(1);
  state = advanceMotion(
    state,
    distances[1] - 20,
    1,
    points,
    distances,
    pickup,
    distances[1],
    100,
  );
  expect(state.notificationCount).toBe(1);
});
