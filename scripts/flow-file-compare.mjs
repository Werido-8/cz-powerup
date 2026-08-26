import { chromium } from "playwright";

const BASE = process.env.SHOT_BASE ?? "http://127.0.0.1:8080";
const TASK = "cmp-2026-001";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_BROWSER_PATH ??
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const problems = [];
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("404")) problems.push(message.text());
});
page.on("pageerror", (error) => problems.push(error.message));

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok  ${message}`);
}

await page.goto(`${BASE}/file-compare/${TASK}/overview`, { waitUntil: "networkidle" });
check((await page.getByRole("link", { name: /差异概览|对照阅读|文件信息/ }).count()) === 3, "三个一级 Tab 常驻");

await page.getByRole("button", { name: /修改\s*9/ }).click();
check((await page.locator("[data-summary-item]").count()) === 9, "概览指标筛选生效");
await page.locator("[data-summary-item]").first().click();
await page.waitForURL(/\/reader/);
check(new URL(page.url()).searchParams.has("diff"), "概览差异可定位到阅读页");

check((await page.getByText("自动匹配", { exact: true }).count()) === 0, "已移除自动匹配提示行");
check((await page.getByText("双栏对照", { exact: true }).count()) === 0, "已移除单双栏切换");
check((await page.getByText("单栏阅读", { exact: true }).count()) === 0, "阅读页固定双栏");
check((await page.getByText("100%", { exact: true }).count()) === 0, "已移除缩放控件");
check((await page.getByText("正文滚动时导航会同步定位", { exact: true }).count()) === 0, "已移除阅读提示文案");

const basePane = page.locator('[data-document-scroll="base"]');
const targetPane = page.locator('[data-document-scroll="target"]');
await basePane.evaluate((node) => {
  node.scrollTop = 760;
  node.dispatchEvent(new Event("scroll", { bubbles: true }));
});
await page.waitForTimeout(350);
check((await targetPane.evaluate((node) => node.scrollTop)) > 0, "双栏同步滚动生效");
check((await page.locator('[data-diff-id][aria-current="true"]').count()) === 1, "正文位置同步高亮导航");

await page.getByRole("combobox", { name: "显示差异类型" }).click();
await page.getByRole("option", { name: "新增" }).click();
check((await page.locator("aside [data-diff-id]").count()) === 12, "新增差异筛选生效");

await page.getByRole("link", { name: "文件信息" }).click();
check((await page.getByText("匹配策略", { exact: true }).count()) > 0, "文件信息页展示匹配策略");
check((await page.getByRole("link", { name: /差异概览|对照阅读|文件信息/ }).count()) === 3, "文件信息页保持统一 Tab");

check(problems.length === 0, `无页面运行错误${problems.length ? `：${problems.join("；")}` : ""}`);
await browser.close();
