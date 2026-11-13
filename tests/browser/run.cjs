const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const base = process.env.BROWSER_TEST_URL || "http://127.0.0.1:4175";
const out =
  process.env.BROWSER_OUTPUT || path.join(root, "test-results/browser");
const report = {
  base,
  browser: "Chromium / software WebGL",
  campaign: [],
  views: [],
  errors: [],
  httpFailures: [],
};
let server, browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function watch(page) {
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") {
      if (
        report.injectingContextLoss &&
        m.text().includes("CONTEXT_LOST_WEBGL")
      ) {
        report.expectedContextLoss = true;
        return;
      }
      if (m.location().url.endsWith("/favicon.ico"))
        report.knownMissingFavicon = true;
      else report.errors.push(m.text());
    }
  });
  page.on("response", (r) => {
    if (r.status() >= 400) {
      if (r.url().endsWith("/favicon.ico")) report.knownMissingFavicon = true;
      else report.httpFailures.push({ status: r.status(), url: r.url() });
    }
  });
}
async function campaign() {
  const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    }),
    p = await context.newPage();
  await watch(p);
  await p.clock.install({ time: new Date("2026-11-13T00:00:00Z") });
  await p.clock.pauseAt(new Date("2026-11-13T00:00:01Z"));
  await p.goto(base, { waitUntil: "networkidle" });
  for (let i = 0; i < 5; i++) {
    await p
      .getByRole("button", { name: "Nhận quyền chỉ huy", exact: true })
      .click();
    await p.getByRole("button", { name: "4×", exact: true }).click();
    for (let n = 0; n < 4; n++) await p.locator(".scan-button").click();
    await p.getByRole("button", { name: "Tình báo", exact: true }).click();
    while (
      await p
        .getByRole("button", { name: "Xác minh nguồn tin", exact: true })
        .count()
    )
      await p
        .getByRole("button", { name: "Xác minh nguồn tin", exact: true })
        .first()
        .click();
    await p.getByRole("button", { name: "Chỉ huy", exact: true }).click();
    await p.getByRole("button", { name: "Đến mục tiêu", exact: false }).click();
    if (i === 4) {
      for (const id of ["C-01", "C-03"]) {
        if (process.env.BROWSER_BASELINE_KEYS) {
          await p.getByRole("button", { name: id, exact: true }).focus();
          await p.keyboard.press("Enter");
        } else await p.getByRole("button", { name: id, exact: true }).click();
        await p
          .getByRole("button", { name: "Lệnh mô phỏng", exact: false })
          .click();
      }
    }
    for (let n = 0; n < 20; n++) {
      await p.clock.runFor(10000);
      if (await p.locator(".debrief-dialog").count()) break;
      if (await p.locator(".incident-link").count()) {
        await p.getByRole("button", { name: "Kỹ thuật", exact: true }).click();
        await p.getByRole("button", { name: /Xử lý tiêu chuẩn/ }).click();
        await p.getByRole("button", { name: "Chỉ huy", exact: true }).click();
      }
      if (i === 2)
        await p
          .getByRole("button", { name: "Điều phối cứu hộ", exact: true })
          .click();
      await p.locator(".scan-button").click();
    }
    const dialog = p.locator(".debrief-dialog");
    await dialog.waitFor();
    const grade = await dialog.locator(".grade").innerText();
    assert.notEqual(grade, "Failed", `Mission ${i + 1} failed`);
    report.campaign.push({ mission: i + 1, grade });
    console.log("BROWSER campaign", i + 1, grade);
    if (i < 4)
      await dialog
        .getByRole("button", { name: "Nhiệm vụ tiếp theo", exact: true })
        .click();
    else
      await dialog
        .getByRole("button", { name: "Lưu & về bộ chỉ huy", exact: true })
        .click();
  }
  assert.equal(
    await p.getByRole("button", { name: "Chơi lại", exact: true }).count(),
    5,
  );
  const save = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("deep-command-save-v1")),
  );
  assert.equal(save.state.completed.length, 5);
  assert.equal(save.state.career.best.length, 5);
  await p.reload({ waitUntil: "networkidle" });
  await p
    .getByRole("button", { name: "Tiếp tục bản lưu", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Lưu & về bộ chỉ huy", exact: true })
    .click();
  assert.equal(
    await p.getByRole("button", { name: "Chơi lại", exact: true }).count(),
    5,
  );
  report.reload = "final campaign persisted and restored";
  await context.close();
}
async function visuals(viewport, low = false) {
  const context = await browser.newContext({ viewport }),
    p = await context.newPage();
  await watch(p);
  await p.goto(base, { waitUntil: "networkidle" });
  await p
    .getByRole("button", { name: "Nhận quyền chỉ huy", exact: true })
    .click();
  await p.locator(".pause-control").click();
  if (low) {
    await p.getByRole("button", { name: "Cài đặt", exact: true }).click();
    await p.getByRole("button", { name: /Chất lượng 3D/ }).click();
    await p.getByRole("button", { name: "Đóng", exact: true }).click();
  }
  await p
    .getByRole("button", { name: "Quan sát Aurora 3D", exact: true })
    .click();
  await p.locator(".scene-canvas canvas").waitFor();
  if (
    await p.getByRole("button", { name: "Tiếp tục game", exact: true }).count()
  ) {
    await p.getByRole("button", { name: "Tiếp tục game", exact: true }).click();
    await p.getByRole("button", { name: "Tạm dừng game", exact: true }).click();
  }
  if (await p.getByRole("button", { name: "Phóng to 3D", exact: true }).count())
    await p.getByRole("button", { name: "Phóng to 3D", exact: true }).click();
  await p.waitForTimeout(1500);
  for (const scene of ["deck", "ocean"]) {
    if (scene === "ocean") {
      await p.getByRole("button", { name: "Đại dương", exact: true }).click();
      await p.waitForTimeout(1500);
    }
    const state = await p.locator(".scene-canvas canvas").evaluate((c) => {
      const gl = c.getContext("webgl2");
      return {
        width: c.width,
        height: c.height,
        webgl: !!gl,
        error: gl?.getError(),
      };
    });
    assert.equal(state.webgl, true);
    assert.equal(state.error, 0);
    assert.ok(state.width > 0 && state.height > 0);
    const filename = `${scene}-${viewport.width}x${viewport.height}-${low ? "low" : "high"}.png`;
    await p.screenshot({ path: path.join(out, filename) });
    report.views.push({
      ...viewport,
      quality: low ? "low" : "high",
      scene,
      ...state,
      screenshot: filename,
    });
  }
  if (viewport.width === 1366) {
    report.injectingContextLoss = true;
    const injected = await p.locator(".scene-canvas canvas").evaluate((c) => {
      const ext = c.getContext("webgl2").getExtension("WEBGL_lose_context");
      if (!ext) return false;
      ext.loseContext();
      return true;
    });
    if (injected) {
      await p.getByRole("button", { name: "Nạp lại 3D", exact: true }).click();
      await p.locator(".scene-canvas canvas").waitFor();
      await p.waitForTimeout(1000);
      assert.equal(
        await p
          .locator(".scene-canvas canvas")
          .evaluate((c) => c.getContext("webgl2").getError()),
        0,
      );
      report.contextRecovery = "loss injected; new renderer restored";
    }
    report.injectingContextLoss = false;
  }
  await p.getByRole("button", { name: "Boong chỉ huy", exact: true }).click();
  await p
    .getByRole("button", { name: "Navigation", exact: true })
    .first()
    .click();
  await p.waitForTimeout(2000);
  await p.locator(".scene-canvas canvas").click();
  await p.getByRole("heading", { name: "Hải trình", exact: true }).waitFor();
  assert.equal(
    await p
      .getByRole("button", { name: "Quan sát Aurora 3D", exact: true })
      .count(),
    1,
  );
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert.equal(overflow, false, "Horizontal overflow");
  await context.close();
  console.log(
    "BROWSER graphics",
    viewport.width,
    viewport.height,
    low ? "low" : "high",
  );
}
(async () => {
  await fs.mkdir(out, { recursive: true });
  if (!process.env.BROWSER_TEST_URL) {
    server = spawn(
      process.execPath,
      [
        path.join(root, "node_modules/vite/bin/vite.js"),
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "4175",
        "--strictPort",
      ],
      { cwd: root, stdio: "ignore" },
    );
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        const r = await fetch(base);
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await sleep(100);
    }
    assert.ok(ready, "Preview server did not start");
  }
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    proxy: proxy
      ? {
          server: proxy,
          bypass: [process.env.NO_PROXY, "127.0.0.1", "localhost"]
            .filter(Boolean)
            .join(","),
        }
      : undefined,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  if (!process.env.BROWSER_VISUALS_ONLY) await campaign();
  if (!process.env.BROWSER_CAMPAIGN_ONLY)
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
      { width: 390, height: 844 },
    ])
      await visuals(viewport, viewport.width === 390);
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  assert.equal(
    report.httpFailures.length,
    0,
    JSON.stringify(report.httpFailures),
  );
  console.log("BROWSER PASS");
})()
  .catch((e) => {
    report.failure = e.stack;
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(
      path.join(out, "report.json"),
      JSON.stringify(report, null, 2),
    );
    await browser?.close();
    server?.kill();
  });
