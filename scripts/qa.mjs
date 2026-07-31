import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = normalize(join(process.cwd(), "dist"));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const file = pathname === "/" ? "index.html" : pathname.slice(1);
    const absolute = normalize(join(root, file));
    if (!absolute.startsWith(root)) throw new Error("Invalid path");
    const body = await readFile(absolute);
    response.writeHead(200, { "Content-Type": types[extname(absolute)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
await mkdir("qa", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
});
const results = [];
for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4174", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  for (const reveal of await page.locator("#homeView .reveal").all()) {
    await reveal.scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(950);
  await page.screenshot({ path: `qa/${viewport.name}-home.png`, fullPage: true });
  const assetStatus = await page.evaluate(() => fetch("./assets/about-galaxy.jpg").then((response) => response.status));
  const integrationAssetStatuses = await page.evaluate(() => Promise.all([
    "./assets/logo-lanshan-wide.png",
    "./assets/logo-lanshan.png",
    "./assets/qr-wechat.svg",
    "./assets/qr-xiaohongshu.svg",
    "./assets/qr-bilibili.svg",
    "./color-tokens.html",
    "./index-tdesign.html",
    "./prototype-blueprint.html"
  ].map((path) => fetch(path).then((response) => response.status))));
  const fontStatus = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Lanshan Sans"'),
      document.fonts.load('16px "Lanshan Serif"'),
      document.fonts.load('16px "ZXF XuanYa Trial"')
    ]);
    return {
      sans: document.fonts.check('16px "Lanshan Sans"'),
      serif: document.fonts.check('16px "Lanshan Serif"'),
      xuanya: document.fonts.check('16px "ZXF XuanYa Trial"')
    };
  });
  const annualSectionCount = await page.locator(".annuals, #annualTrack").count();
  let magnifierVisible = false;
  if (viewport.name === "desktop") {
    await page.locator("#themeToggle").click();
    await page.waitForTimeout(250);
    await page.locator("#hero").screenshot({ path: "qa/desktop-hero-dark.png" });
    await page.locator("#themeToggle").click();
    await page.waitForTimeout(250);
    const canvasBox = await page.locator("#particleCanvas").boundingBox();
    await page.mouse.click(canvasBox.x + canvasBox.width * .78, canvasBox.y + canvasBox.height * .52);
    await page.waitForTimeout(420);
    await page.locator("#hero").screenshot({ path: "qa/desktop-hero-burst.png" });
    for (const id of ["achievements", "departments"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.locator(`#${id}`).screenshot({ path: `qa/desktop-${id}.png` });
    }
    await page.locator('#clueBoardScene .department-node[data-department="research"]').click({ force: true });
    await page.waitForTimeout(200);
    await page.locator('#clueBoardScene .subteam-node[data-subteam="backend-python"]').click({ force: true });
    await page.waitForTimeout(200);
    await page.locator("#departments").screenshot({ path: "qa/desktop-departments-research.png" });
    const boardBox = await page.locator("#networkPanel").boundingBox();
    await page.mouse.move(boardBox.x + boardBox.width * .58, boardBox.y + boardBox.height * .52);
    await page.waitForTimeout(180);
    magnifierVisible = await page.locator("#clueMagnifier").evaluate((lens) => lens.classList.contains("is-visible"));
    await page.locator("#networkPanel").screenshot({ path: "qa/desktop-departments-magnifier.png" });
  } else {
    await page.locator("#menuButton").click();
    const mobileMenuLocked = await page.locator("body").evaluate((body) => body.classList.contains("scroll-locked"));
    if (!mobileMenuLocked) errors.push("Mobile menu did not lock background scrolling");
    await page.locator("#menuButton").click();
    await page.locator("#hero").screenshot({ path: "qa/mobile-hero.png" });
    await page.locator("#departments").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.locator('.tree-department-button[data-department="research"]').click();
    await page.locator('.tree-subteams [data-subteam="frontend"]').click();
    await page.waitForTimeout(200);
    await page.locator("#departments").screenshot({ path: "qa/mobile-departments-tree.png" });
  }
  const visibleReveals = await page.locator(".reveal.is-visible").count();
  await page.evaluate(() => { location.hash = "#about"; });
  await page.waitForTimeout(400);
  const aboutVisible = await page.locator("#aboutView").evaluate((view) => view.classList.contains("is-active"));
  await page.screenshot({ path: `qa/${viewport.name}-about.png`, fullPage: true });
  if (viewport.name === "desktop") {
    await page.locator("#themeToggle").click();
    await page.waitForTimeout(250);
    await page.locator("#aboutView").screenshot({ path: "qa/desktop-about-dark.png" });
    await page.locator("#themeToggle").click();
  }
  await page.evaluate(() => { location.hash = "#projects"; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `qa/${viewport.name}-project-sphere.png`, fullPage: true });
  if (viewport.name === "desktop") {
    const projectCoreBox = await page.locator("#projectCore").boundingBox();
    await page.mouse.move(projectCoreBox.x + projectCoreBox.width * .68, projectCoreBox.y + projectCoreBox.height * .42);
    await page.waitForTimeout(320);
    await page.locator("#projectExplorer").screenshot({ path: "qa/desktop-project-sphere-hover.png" });
  }
  await page.locator("#projectCore").click({ force: true });
  if (viewport.name === "desktop") {
    await page.waitForTimeout(120);
    await page.locator("#projectExplorer").screenshot({ path: "qa/desktop-project-ignition.png" });
    await page.waitForTimeout(6280);
  } else {
    await page.waitForTimeout(6400);
  }
  const coordinateCount = await page.locator("[data-project-coordinate]").count();
  await page.screenshot({ path: `qa/${viewport.name}-project-ripple.png`, fullPage: true });
  await page.locator("[data-project-coordinate]").first().click();
  await page.waitForTimeout(350);
  const projectFloatVisible = await page.locator("#projectFloatCard").evaluate((card) => card.classList.contains("is-visible"));
  await page.screenshot({ path: `qa/${viewport.name}-project-detail.png`, fullPage: true });
  if (viewport.name === "desktop") {
    await page.locator("#themeToggle").click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: "qa/desktop-project-ripple-dark.png", fullPage: true });
    await page.locator("#themeToggle").click();
  }
  await page.locator(".float-card-close").click();
  const departmentNames = await page.locator("#clueBoardScene .department-node").allTextContents();
  const projectNames = await page.locator(".project-coordinate span").allTextContents();
  await page.evaluate(() => {
    location.hash = "#alumni";
  });
  await page.waitForTimeout(750);
  const alumniTitleFont = await page.locator("#alumniView .inner-hero h1").evaluate((title) => getComputedStyle(title).fontFamily);
  await page.screenshot({ path: `qa/${viewport.name}-alumni.png`, fullPage: true });
  await page.locator(".city-marker").first().click({ force: true });
  await page.waitForTimeout(250);
  const mapOutlineLength = await page.locator(".map-outline").getAttribute("d").then((value) => value?.length ?? 0);
  if (viewport.name === "desktop") {
    await page.locator(".map-layout").screenshot({ path: "qa/desktop-alumni-map.png" });
  }
  await page.evaluate(() => {
    location.hash = "#join";
  });
  await page.waitForTimeout(500);
  const joinVisible = await page.locator("#joinView").evaluate((view) => view.classList.contains("is-active"));
  await page.screenshot({ path: `qa/${viewport.name}-join.png`, fullPage: true });
  const socialEntryCount = await page.locator(".social-btn").count();
  if (viewport.name === "desktop") {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await page.locator(".social-item").first().hover();
    await page.waitForTimeout(220);
    await footer.screenshot({ path: "qa/desktop-footer-light.png" });
    await page.locator("#themeToggle").click();
    await page.waitForTimeout(250);
    await page.locator(".social-item").first().hover();
    await footer.screenshot({ path: "qa/desktop-footer-dark.png" });
    await page.locator("#themeToggle").click();
  }
  results.push({ viewport: viewport.name, errors, assetStatus, integrationAssetStatuses, fontStatus, annualSectionCount, alumniTitleFont, aboutVisible, magnifierVisible, coordinateCount, projectFloatVisible, mapOutlineLength, socialEntryCount, joinVisible, visibleReveals, departmentNames, projectNames });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(results, null, 2));
