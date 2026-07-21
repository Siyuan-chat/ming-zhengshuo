import { NextRequest, NextResponse } from "next/server";
import { convertEra } from "@/app/lib/mingZhengshuo";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim() ?? "";
    const result = convertEra(text);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "错误：转换失败。",
      },
      { status: 400 },
    );
  }
}
