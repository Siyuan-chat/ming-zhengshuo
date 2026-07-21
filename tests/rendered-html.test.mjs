import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
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

test("server-renders the MingZhengshuo tool shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>明正朔<\/title>/);
  assert.match(html, /东亚年号与正统线转换/);
  assert.match(html, /辨年号，归正朔/);
  assert.match(html, /同治五年三月初八/);
  assert.match(html, /校年札记/);
  assert.match(html, /我们的原则/);
  assert.match(html, /seal-zhuanshu\.png/);
  assert.match(html, /同名年号不抢答/);
  assert.doesNotMatch(html, /明<br\s*\/?>朔/);
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
  assert.match(layout, /title:\s*"明正朔"/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("public/og.png", templateRoot));
  await access(new URL("public/seal-zhuanshu.png", templateRoot));
});
