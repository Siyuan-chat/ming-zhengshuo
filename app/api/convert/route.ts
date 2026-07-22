import { NextRequest, NextResponse } from "next/server";
import { convertEra } from "@/app/lib/mingZhengshuo";

const MAX_BODY_BYTES = 1024;
const MAX_INPUT_LENGTH = 80;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "错误：请求格式必须为 JSON。" },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "错误：输入过长，请缩短后再试。" },
        { status: 413 },
      );
    }

    const body = (await request.json()) as { text?: string };
    if (typeof body.text !== "string") {
      return NextResponse.json(
        { ok: false, error: "错误：请输入年号原文。" },
        { status: 400 },
      );
    }

    const text = body.text.trim();
    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "错误：输入过长，请控制在 80 字以内。" },
        { status: 413 },
      );
    }

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
