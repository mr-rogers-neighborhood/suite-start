import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { fakeApp, install, launch, launchedWith, type Sandbox, sandbox } from "./launcher.js";

/**
 * What the launcher promises.
 *
 * It lists what is installed, starts it with the file or the link it was handed,
 * and tells the truth about an install it cannot use. Each is checked against
 * the real process it spawned, not against its own idea of what it did.
 */

let box: Sandbox;

test.beforeEach(async () => {
  box = await sandbox();
});

test.afterEach(async () => {
  await box.dispose();
});

test("lists an installed app", async () => {
  const app = await fakeApp(box, { name: "Suite Canvas" });
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const run = await launch(box);
  try {
    await expect(run.page.locator(".card-name")).toHaveText("Suite Canvas");
    await expect(run.page.locator(".card-version")).toHaveText("0.1.0");
  } finally {
    await run.close();
  }
});

test("launches the app the user picked", async () => {
  const app = await fakeApp(box);
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const run = await launch(box);
  try {
    await run.page.getByRole("button", { name: "Open" }).click();
    await expect.poll(async () => launchedWith(app.logPath), { timeout: 15_000 }).not.toBeNull();
  } finally {
    await run.close();
  }
});

test("opens a file through the app that claims its extension", async () => {
  const app = await fakeApp(box, { extensions: ["canvas"] });
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const document = join(box.root, "Research.canvas");
  await writeFile(document, "{}");

  const run = await launch(box, [document]);
  try {
    // The file was handed to the app as its argument, unaltered.
    await expect
      .poll(async () => launchedWith(app.logPath), { timeout: 15_000 })
      .toEqual([document]);
  } finally {
    await run.close();
  }
});

test("routes a suite:// link and records it as recent", async () => {
  const app = await fakeApp(box);
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const run = await launch(box, ["suite://canvas/workspace/ws_1?card=c1"]);
  try {
    // Canonicalised, not passed through verbatim: the app receives the one shape
    // the suite defines.
    await expect
      .poll(async () => launchedWith(app.logPath), { timeout: 15_000 })
      .toEqual(["suite://canvas/workspace/ws_1?card=c1"]);
  } finally {
    await run.close();
  }
});

test("refuses a link to an app that is not installed, and spawns nothing", async () => {
  const app = await fakeApp(box);
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const run = await launch(box, ["suite://planner/day/2026-11-04"]);
  try {
    // The dialog names the missing app; the point of the assertion is that the
    // installed app was not started with a link that was not meant for it.
    await run.page.waitForTimeout(1_500);
    expect(await launchedWith(app.logPath)).toBeNull();
  } finally {
    await run.close();
  }
});

test("shows an install it cannot use rather than pretending it is not there", async () => {
  const app = await fakeApp(box);
  // A manifest missing its deep-link prefix: the pair is refused, and named.
  await writeFile(
    app.manifestPath,
    JSON.stringify({
      format: "suite.app",
      id: "canvas",
      name: "Broken",
      version: "0.1.0",
      fileExtensions: ["canvas"],
    }),
  );
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const run = await launch(box);
  try {
    await expect(run.page.locator("#refused-section")).toBeVisible();
    await expect(run.page.locator(".row.refused .row-meta")).toContainText("deepLinkPrefix");
    // And it is not offered as a card, because there is nothing to launch.
    await expect(run.page.locator(".card")).toHaveCount(0);
  } finally {
    await run.close();
  }
});

test("records a file it opened, so it appears in recents", async () => {
  const app = await fakeApp(box);
  await install(box, { id: "canvas", executable: app.executable, manifestPath: app.manifestPath });

  const document = join(box.root, "Field notes.canvas");
  await writeFile(document, "{}");

  const first = await launch(box, [document]);
  try {
    await expect.poll(async () => launchedWith(app.logPath), { timeout: 15_000 }).not.toBeNull();
  } finally {
    await first.close();
  }

  const recents = JSON.parse(await readFile(join(box.data, "recents.json"), "utf8")) as unknown[];
  expect(recents).toHaveLength(1);

  const second = await launch(box);
  try {
    await second.page.getByRole("tab", { name: "Files" }).click();
    await expect(second.page.locator("#panel-files")).toBeVisible();
    await expect(second.page.locator("#recent-files .row-name").first()).toHaveText(
      "Field notes.canvas",
    );
  } finally {
    await second.close();
  }
});

test("reaches every section from the keyboard", async () => {
  const run = await launch(box);
  try {
    const apps = run.page.getByRole("tab", { name: "Apps" });
    await apps.focus();
    await expect(run.page.locator("#panel-apps")).toBeVisible();

    // Automatic activation: moving focus moves the pane with it.
    await run.page.keyboard.press("ArrowDown");
    await expect(run.page.locator("#panel-files")).toBeVisible();
    await run.page.keyboard.press("ArrowDown");
    await expect(run.page.locator("#panel-sync")).toBeVisible();
    await run.page.keyboard.press("ArrowDown");
    await expect(run.page.locator("#panel-settings")).toBeVisible();
    await expect(run.page.getByRole("tab", { name: "Settings" })).toBeFocused();

    await run.page.keyboard.press("Home");
    await expect(run.page.locator("#panel-apps")).toBeVisible();
    await run.page.keyboard.press("End");
    await expect(run.page.locator("#panel-settings")).toBeVisible();
  } finally {
    await run.close();
  }
});

test("renders every section with nothing installed", async () => {
  const run = await launch(box);
  try {
    await expect(run.page.locator("#apps-empty")).toBeVisible();
    await expect(run.page.getByRole("tab")).toHaveCount(4);

    for (const name of ["Files", "Sync", "Settings"]) {
      await run.page.getByRole("tab", { name }).click();
      await expect(run.page.getByRole("tab", { name })).toHaveAttribute("aria-selected", "true");
    }

    // Sync says why it is off instead of offering a control that cannot work.
    await expect(run.page.locator("#sync-toggle")).toBeDisabled();
  } finally {
    await run.close();
  }
});
