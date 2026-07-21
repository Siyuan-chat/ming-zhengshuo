import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion } from "@/app/lib/ai";
import type { ConversionResult } from "@/app/lib/mingZhengshuo";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { result?: ConversionResult };
    if (!body.result?.output) {
      return NextResponse.json(
        { ok: false, error: "错误：缺少可注解的转换结果。" },
        { status: 400 },
      );
    }

    const annotation = await createChatCompletion({
      provider: "deepseek",
      maxTokens: 360,
      messages: [
        {
          role: "system",
          content:
            "你是严谨克制的中文历史工具文案编辑。用简体中文写一段不超过120字的史注。只解释已给出的年号、公元年份和正朔归属；不要编造未给出的事件、帝王、干支或精确日期。遇到简化规则要说明其为第一版按年份处理。",
        },
        {
          role: "user",
          content: `转换结果：${body.result.output}\n来源：${body.result.source.polity}${body.result.source.era}${body.result.source.eraYear}年\n公元：${body.result.westernYear}年\n所归：${body.result.orthodox.text}`,
        },
      ],
    });

    return NextResponse.json({ ok: true, provider: "deepseek", annotation });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "错误：DeepSeek 史注暂时不可用，请稍后再试。",
      },
      { status: 503 },
    );
  }
}
