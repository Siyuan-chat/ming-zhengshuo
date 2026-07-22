const siteUrl = "https://ming-zhengshuo.yesiyuansysu.chatgpt.site";

export function GET() {
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
