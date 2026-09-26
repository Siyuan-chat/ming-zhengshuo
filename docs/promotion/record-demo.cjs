// Records the real local Pages build in an isolated Chrome window.
// This is a delivery helper only; it is not imported by the product.
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS delivery helper. */
const { chromium } = require("C:/Users/Siyuan Ye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const assets = path.join(__dirname, "assets");
const publicAssets = path.join(root, "public", "promotion");
const ffmpeg = "C:/Program Files (x86)/iMyFone/iMyFone TopClipper/ffmpeg.exe";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = "http://127.0.0.1:4173/ming-zhengshuo/";
const language = process.env.DEMO_LANGUAGE === "ja" ? "ja" : "zh";
const suffix = language === "ja" ? "-ja" : "";
const convertButton = language === "ja" ? "変換する" : "开始互换";

fs.mkdirSync(assets, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: false,
    args: ["--window-position=0,0", "--window-size=1280,720", "--force-device-scale-factor=1", `--lang=${language === "ja" ? "ja-JP" : "zh-CN"}`, "--disable-translate"],
  });
  const context = await browser.newContext({ viewport: { width: 1264, height: 633 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  if (language === "ja") await page.getByRole("button", { name: "日本語" }).click();
  await page.keyboard.press("Control+-");
  await page.keyboard.press("Control+-");
  await wait(500);

  const output = path.join(assets, `demo${suffix}.mp4`);
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), "ming-demo-frames-"));
  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, sessionId }) => {
    frames.push({ data, at: Date.now() });
    await cdp.send("Page.screencastFrameAck", { sessionId });
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
  const recordingStarted = Date.now();
  await wait(3000);

  await page.locator("#target-select").selectOption("japan");
  await page.locator("#era-input").fill("");
  await page.locator("#era-input").pressSequentially("唐贞观十九年", { delay: 95 });
  await page.getByRole("button", { name: convertButton }).click();
  await page.locator(".output").waitFor();
  await page.screenshot({ path: path.join(assets, `demo-first${suffix}.png`) });
  await wait(5000);

  await page.locator("#era-input").fill("");
  await page.locator("#era-input").pressSequentially("公元1338年", { delay: 120 });
  await page.getByRole("button", { name: convertButton }).click();
  await page.locator(".output").filter({ hasText: "日本北朝历应元年" }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(publicAssets, `demo-poster${suffix}.png`) });
  await wait(10000);

  const recordingEnded = Date.now();
  await cdp.send("Page.stopScreencast");
  await wait(250);
  if (frames.length < 2) throw new Error(`Only ${frames.length} screencast frame(s) captured`);
  const manifest = [];
  frames.forEach((frame, index) => {
    const filename = `frame-${String(index).padStart(4, "0")}.jpg`;
    fs.writeFileSync(path.join(frameDir, filename), Buffer.from(frame.data, "base64"));
    const nextAt = frames[index + 1]?.at ?? recordingEnded;
    const from = Math.max(frame.at, recordingStarted);
    const duration = Math.max(0.04, (nextAt - from) / 1000);
    manifest.push(`file '${filename}'`, `duration ${duration.toFixed(3)}`);
  });
  manifest.push(`file 'frame-${String(frames.length - 1).padStart(4, "0")}.jpg'`);
  fs.writeFileSync(path.join(frameDir, "frames.txt"), manifest.join("\n"));
  const encoded = spawnSync(ffmpeg, [
    "-y", "-hide_banner", "-loglevel", "warning", "-f", "concat", "-safe", "0", "-i", "frames.txt",
    "-vf", "fps=30,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
  ], { cwd: frameDir, encoding: "utf8" });
  fs.rmSync(frameDir, { recursive: true, force: true });
  await browser.close();
  if (encoded.status !== 0) throw new Error(`ffmpeg exited ${encoded.status}: ${encoded.stderr}`);

  const mobileBrowser = await chromium.launch({ executablePath: chrome, headless: true });
  const mobilePage = await mobileBrowser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(url, { waitUntil: "networkidle" });
  if (language === "ja") await mobilePage.getByRole("button", { name: "日本語" }).click();
  await mobilePage.locator("#target-select").selectOption("japan");
  await mobilePage.locator("#era-input").fill("公元1338年");
  await mobilePage.getByRole("button", { name: convertButton }).click();
  await mobilePage.screenshot({ path: path.join(assets, `demo-mobile${suffix}.png`), fullPage: true });
  await mobileBrowser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
