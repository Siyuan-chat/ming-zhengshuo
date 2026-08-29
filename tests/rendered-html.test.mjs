import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function fetchWorker(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function render() {
  return fetchWorker("/");
}

test("server-renders the MingZhengshuo tool shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>明正朔｜东亚历史年号双向互换工具<\/title>/);
  assert.match(response.headers.get("x-content-type-options") ?? "", /nosniff/i);
  assert.match(response.headers.get("x-frame-options") ?? "", /DENY/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(html, /东亚年号双向互换与正统线转换/);
  assert.match(html, /历法：保留原月日（接口已预留）/);
  assert.match(html, /辨年号，归正朔/);
  assert.match(html, /同治五年三月初八/);
  assert.match(html, /校年札记/);
  assert.match(html, /我们的原则/);
  assert.match(html, /规则边界/);
  assert.match(html, /不宣称排除其他史观/);
  assert.match(html, /五胡十六国/);
  assert.match(html, /五代正朔取后唐/);
  assert.match(html, /后唐之后取南唐/);
  assert.match(html, /日本大化元年/);
  assert.match(html, /SoftwareApplication/);
  assert.match(html, /seal-zhuanshu\.png/);
  assert.match(html, /favicon\.png/);
  assert.match(html, /apple-touch-icon\.png/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /同名年号不抢答/);
  assert.doesNotMatch(html, /明<br\s*\/?>朔/);
  assert.doesNotMatch(html, /favicon\.svg/);
  assert.doesNotMatch(html, /plate-seal/);
  assert.doesNotMatch(html, /草拟史注|起草中/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton|codex-preview/i);
});

test("removes starter preview code and exposes project assets", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<ConverterShell \/>/);
  assert.match(layout, /东亚历史年号双向互换工具/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /canonical/);
  assert.match(layout, /SoftwareApplication/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /\/favicon\.png/);
  assert.match(layout, /\/apple-touch-icon\.png/);
  assert.match(layout, /\/manifest\.webmanifest/);
  assert.doesNotMatch(layout, /\/favicon\.svg/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("public/og.png", templateRoot));
  await access(new URL("public/seal-zhuanshu.png", templateRoot));
  await access(new URL("public/favicon.png", templateRoot));
  await access(new URL("public/apple-touch-icon.png", templateRoot));
  await access(new URL("public/manifest.webmanifest", templateRoot));
  await assert.rejects(access(new URL("public/favicon.svg", templateRoot)));
});

test("exposes public indexing files and rejects oversized conversion input", async () => {
  const robots = await fetchWorker("/robots.txt", {
    headers: { accept: "text/plain" },
  });
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/ming-zhengshuo\.yesiyuansysu\.chatgpt\.site\/sitemap\.xml/);

  const sitemap = await fetchWorker("/sitemap.xml", {
    headers: { accept: "application/xml" },
  });
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /<loc>https:\/\/ming-zhengshuo\.yesiyuansysu\.chatgpt\.site\/<\/loc>/);

  const rejected = await fetchWorker("/api/convert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "同治".repeat(60) }),
  });
  assert.equal(rejected.status, 413);
  assert.match(await rejected.text(), /输入过长/);
});

test("converts ancient Japanese eras through the Tang and Southern Tang line", async () => {
  const cases = [
    ["日本大化元年", "日本大化元年 = 公元645年 = 唐贞观十九年"],
    ["日本慶応三年", "日本庆应三年 = 公元1867年 = 大明永历二百二十一年"],
    ["日本延长元年", "日本延长元年 = 公元923年 = 后唐同光元年"],
    ["日本承平七年", "日本承平七年 = 公元937年 = 南唐升元元年"],
  ];

  for (const [text, output] of cases) {
    const response = await fetchWorker("/api/convert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).result.output, output);
  }
});

test("interchanges Gregorian and era years with an explicit calendar contract", async () => {
  const response = await fetchWorker("/api/convert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: "公元645年",
      target: "japan",
      calendarMode: "preserve",
    }),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.result.output, "公元645年 = 日本大化元年");
  assert.equal(payload.result.calendar.precision, "year");
  assert.equal(payload.result.calendar.dayConversionApplied, false);
});
