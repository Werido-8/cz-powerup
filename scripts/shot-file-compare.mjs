import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.SHOT_BASE ?? "http://localhost:8080";
const OUT = process.env.SHOT_OUT ?? "screenshots";
const SIZES = (process.env.SHOT_SIZES ?? "1920x1080")
  .split(",")
  .map((size) => size.trim().split("x").map(Number));

const PAGES = [
  { name: "overview", path: "/file-compare/cmp-2026-001/overview" },
  { name: "reader", path: "/file-compare/cmp-2026-001/reader" },
  { name: "changes", path: "/file-compare/cmp-2026-001/changes" },
  { name: "info", path: "/file-compare/cmp-2026-001/info" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ??
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});

for (const [width, height] of SIZES) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") console.log(`[console:${width}] ${message.text()}`);
  });
  page.on("pageerror", (error) => console.log(`[pageerror:${width}] ${error.message}`));

  for (const target of PAGES) {
    await page.goto(`${BASE}${target.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      // 被 overflow:hidden 裁掉的内容：说明该区域没有正确进入内部滚动
      const clipped = [];
      for (const el of document.querySelectorAll("*")) {
        const style = getComputedStyle(el);
        if (style.overflowY !== "hidden") continue;
        if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
          clipped.push(
            `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 60)} ${el.scrollHeight}/${el.clientHeight}`,
          );
        }
      }
      return {
        docScrollHeight: doc.scrollHeight,
        docClientHeight: doc.clientHeight,
        hasVerticalScroll: doc.scrollHeight > doc.clientHeight + 1,
        clipped: clipped.slice(0, 6),
      };
    });

    console.log(
      `${width}x${height} ${target.name}: outerScroll=${metrics.hasVerticalScroll} doc=${metrics.docScrollHeight}/${metrics.docClientHeight}`,
    );
    for (const item of metrics.clipped) console.log(`   clipped: ${item}`);

    await page.screenshot({ path: `${OUT}/${target.name}-${width}x${height}.png` });
  }

  await context.close();
}

await browser.close();
console.log("done");
