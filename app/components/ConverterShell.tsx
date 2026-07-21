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

const examples = [
  "清顺治二年",
  "前赵嘉平元年",
  "北魏太和十年",
  "元至元十六年",
];

const principleBookmarks = [
  {
    id: "source",
    title: "年号溯源",
    principle: "原则一：先辨其号所出。",
    detail: "同名年号不抢答，不把政权偷换成默认候选；能由国号判定就直断，不能判定就提示补上政权名。",
  },
  {
    id: "orthodoxy",
    title: "正朔对照",
    principle: "原则二：以默认正统线归正朔。",
    detail: "五胡十六国归晋，北朝归南朝，辽金元归宋明，南明续明统；晋不分东西，宋不分南北，南朝输出宋、齐、梁、陈。",
  },
  {
    id: "boundary",
    title: "纪年换算",
    principle: "原则三：边界年从严，月日不擅改。",
    detail: "公元年份只作桥梁；输入中的月日原文保留。1644 归崇祯十七年，1645 归弘光，1646 归隆武，1647 起归永历。",
  },
] as const;

const timeline = [
  ["1647", "永历元年；明清鼎革后默认续用南明正朔"],
  ["1912", "民国元年；辛亥以后归民国纪年"],
  ["1950", "第一版按年份简化，自此输出公元纪年"],
];

export function ConverterShell() {
  const [text, setText] = useState("同治五年三月初八");
  const [result, setResult] = useState<ConversionPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePrinciple, setActivePrinciple] =
    useState<(typeof principleBookmarks)[number]["id"]>("source");

  const selectedPrinciple =
    principleBookmarks.find((item) => item.id === activePrinciple) ?? principleBookmarks[0];

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
            <div className="tags" aria-label="原则书签">
              {principleBookmarks.map((bookmark) => (
                <button
                  aria-pressed={activePrinciple === bookmark.id}
                  className="tag"
                  key={bookmark.id}
                  onClick={() => setActivePrinciple(bookmark.id)}
                  type="button"
                >
                  {bookmark.title}
                </button>
              ))}
            </div>
            <output className="principle-output" aria-live="polite">
              <span>我们的原则</span>
              <strong>{selectedPrinciple.principle}</strong>
              <p>{selectedPrinciple.detail}</p>
            </output>
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
                <p className="footer-note">月日暂按原文保留，未作农历/公历换算。</p>
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
