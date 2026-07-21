import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion } from "@/app/lib/ai";
import type { ConversionResult } from "@/app/lib/mingZhengshuo";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { result?: ConversionResult };
    const result = body.result;
    if (!result?.output) {
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
            "你是严谨克制的中文历史工具文案编辑。用简体中文写一段不超过120字的纯文本史注，不要 Markdown。只解释已给出的原文年号、公元年份和正朔归属；不要编造未给出的事件、帝王、干支或精确日期。必须尊重原文意义：原文年号是来源纪年，所归正朔是本工具依正统线给出的归属，不是别名。禁用“亦称”“又称”“也称”“即”等会把二者混同的说法。推荐句式为“原文……换算为公元……年；依照正朔为……”。输入中的月日是原文保留，不得改写成公历日期，不得说“即公元某年某月某日”。遇到月日时只说明第一版暂未做农历/公历换算。",
        },
        {
          role: "user",
          content: `转换结果：${result.output}\n来源：${result.source.polity}${result.source.era}${result.source.eraYear}年\n公元：${result.westernYear}年\n所归：${result.orthodox.text}`,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      provider: "deepseek",
      annotation: needsFallback(annotation)
        ? deterministicAnnotation(result)
        : annotation,
    });
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

function needsFallback(annotation: string) {
  return /亦称|又称|也称|即公元|即为|即是/.test(annotation);
}

function deterministicAnnotation(result: ConversionResult) {
  const sourceText = result.output.split(" = ")[0] ?? "原文纪年";
  const monthDayNote = result.source.rest
    ? "；月日按原文保留，第一版暂未做农历/公历换算"
    : "";
  return `${sourceText}换算为公元${result.westernYear}年；依照正朔为${result.orthodox.text}${monthDayNote}。`;
}
