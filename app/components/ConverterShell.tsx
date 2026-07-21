"use client";

import { FormEvent, useMemo, useState } from "react";

type ConversionPayload = {
  input: string;
  output: string;
  westernYear: number;
  source: {
    polity: string;
    era: string;
    eraYear: number;
    rest: string;
  };
  orthodox: {
    polity: string;
    era: string;
    eraYear: number;
    mode: string;
    text: string;
  };
};

type ConvertResponse =
  | { ok: true; result: ConversionPayload }
  | { ok: false; error: string };

type AnnotationResponse =
  | { ok: true; annotation: string; provider: string }
  | { ok: false; error: string };

const examples = [
  "同治五年三月初八",
  "日本昭和二十年八月十五",
  "朝鲜光武三年四月十五",
  "令和六年五月一日",
];

const timeline = [
  ["1647", "永历元年；明清鼎革后默认续用南明正朔"],
  ["1912", "民国元年；辛亥以后归民国纪年"],
  ["1950", "第一版按年份简化，自此输出公元纪年"],
];

export function ConverterShell() {
  const [text, setText] = useState("同治五年三月初八");
  const [result, setResult] = useState<ConversionPayload | null>(null);
  const [annotation, setAnnotation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [annotating, setAnnotating] = useState(false);

  const status = useMemo(() => {
    if (loading) return "校年中";
    if (result) return "已归正朔";
    if (error) return "待更正";
    return "待输入";
  }, [error, loading, result]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setAnnotation("");

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as ConvertResponse;
      if (!payload.ok) {
        setResult(null);
        setError(payload.error);
        return;
      }
      setResult(payload.result);
    } catch {
      setResult(null);
      setError("错误：暂时无法完成转换，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function annotate() {
    if (!result) return;
    setAnnotating(true);
    setError("");

    try {
      const response = await fetch("/api/annotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      const payload = (await response.json()) as AnnotationResponse;
      if (!payload.ok) {
        setError(payload.error);
        return;
      }
      setAnnotation(payload.annotation);
    } catch {
      setError("错误：AI 史注暂时不可用。");
    } finally {
      setAnnotating(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <section>
          <header className="masthead">
            <div className="brand-row">
              <div className="seal" aria-hidden="true">
                明<br />朔
              </div>
              <div>
                <p className="eyebrow">东亚年号与正统线转换</p>
                <h1>明正朔</h1>
              </div>
            </div>
            <p className="subtitle">
              辨年号，归正朔。输入清、日本近现代、朝鲜与大韩帝国年号，
              换算公元年份，并依默认正统线归入永历、民国或公元纪年。
            </p>
          </header>

          <form className="tool-panel" onSubmit={submit}>
            <label className="input-label" htmlFor="era-input">
              <span>纪年原文</span>
              <span>{status}</span>
            </label>
            <div className="input-wrap">
              <input
                id="era-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="如：同治五年三月初八"
                autoComplete="off"
              />
              <button className="primary-button" disabled={loading} type="submit">
                {loading ? "校年中" : "归正朔"}
              </button>
            </div>
            <div className="examples" aria-label="示例输入">
              {examples.map((example) => (
                <button
                  className="example-button"
                  key={example}
                  onClick={() => setText(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="tags" aria-label="功能标签">
              <span className="tag">年号溯源</span>
              <span className="tag">正朔对照</span>
              <span className="tag">纪年换算</span>
            </div>
          </form>
        </section>

        <aside className="side">
          <div className="visual-plate" aria-hidden="true">
            <img src="/og.png" alt="" />
            <span>凡纪年，皆有其所归。</span>
          </div>

          <section className="result-panel" aria-live="polite">
            <div className="panel-heading">
              <h2>校年札记</h2>
              <span className="status">{status}</span>
            </div>

            {result ? (
              <>
                <p className="output">{result.output}</p>
                <div className="facts">
                  <div className="fact">
                    <span>来源</span>
                    <strong>
                      {result.source.polity}
                      {result.source.era}
                    </strong>
                  </div>
                  <div className="fact">
                    <span>标准年份</span>
                    <strong>公元{result.westernYear}年</strong>
                  </div>
                  <div className="fact">
                    <span>所归正朔</span>
                    <strong>{result.orthodox.text}</strong>
                  </div>
                </div>
                {annotation && (
                  <div className="annotation">
                    <p>{annotation}</p>
                  </div>
                )}
                <div className="actions">
                  <span className="footer-note">月日暂按原文保留，未作农历/公历换算。</span>
                  <button
                    className="ghost-button"
                    disabled={annotating}
                    onClick={annotate}
                    type="button"
                  >
                    {annotating ? "起草中" : "草拟史注"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="placeholder">
                  显示来源年号、公元年份与默认正统线归属；若年号年份超出范围，
                  或存在同名歧义，将在此处列明。
                </p>
                {error && <p className="placeholder error">{error}</p>}
              </>
            )}
          </section>

          <section className="ledger">
            <h2>默认正统线节略</h2>
            <div className="timeline">
              {timeline.map(([year, note]) => (
                <div className="timeline-row" key={year}>
                  <time>{year}</time>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
