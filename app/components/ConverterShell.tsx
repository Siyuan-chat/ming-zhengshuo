"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { interchangeEra, type InterchangeResult } from "@/app/lib/mingZhengshuo";

type Language = "zh" | "en" | "ja";
type PrincipleId = "source" | "orthodoxy" | "boundary";

const examples = ["清顺治二年", "日本大化元年", "日本庆应三年", "公元645年", "北魏太和十年"];

const copy = {
  zh: {
    htmlLabel: "中文",
    eyebrow: "东亚年号双向互换与正统线转换",
    subtitle:
      "辨年号，归正朔。可由年号换算公元，也可由公元反查日本、中国、朝鲜及并行年号；亦可依默认正统线归年。",
    inputLabel: "纪年原文",
    placeholder: "如：同治五年三月初八",
    convert: "开始互换",
    converting: "校年中",
    target: "转换目标",
    calendar: "历法：保留原月日（接口已预留）",
    statusIdle: "待输入",
    statusDone: "互换完成",
    statusError: "待更正",
    githubHeader: "GitHub · 源码",
    githubPrompt: "以后还要查年号？可在 GitHub 收藏明正朔。",
    githubResult: "在 GitHub 收藏",
    principlesLabel: "我们的原则",
    resultTitle: "校年札记",
    source: "来源",
    gregorian: "标准年份",
    targetResult: "转换目标",
    gregorianSource: "公元纪年",
    calendarPrefix: "精度：年份。",
    calendarDetail: "月日原样保留，尚未进行阴阳历、儒略历或格里历之间的换算。",
    calendarSuffix: "API 已预留 calendarMode，未来可接入精确历法换算。",
    empty:
      "支持年号与公元双向互换，并显示默认正统线或指定地区的并行年号；若年份超出范围或存在同名歧义，将在此处列明。",
    timelineTitle: "默认正统线节略",
    boundaryTitle: "规则边界",
    boundary:
      "本站是服务历史研究的便利工具，不代替原始史料或专业历谱。争议处按页面明示的默认正统线输出，不宣称排除其他史观。",
    defense:
      "公开版不开放评论、上传或外部脚本输入；转换请求只接收短文本。转换结果中的年号采用数据集规范汉字主名。",
    inputTooLong: "错误：输入过长，请控制在 80 字以内。",
    failed: "错误：转换失败。",
    targets: {
      orthodox: "默认正朔",
      gregorian: "公元年份",
      japan: "日本年号",
      china: "中国年号",
      korea: "朝鲜／韩国年号",
      all: "全部并行年号",
    },
    principles: [
      ["source", "年号溯源", "原则一：先辨其号所出。", "同名年号不抢答；能由国号判定就直断，不能判定就提示补上政权名。"],
      ["orthodoxy", "正朔对照", "原则二：明示所用正统线。", "默认线取晋、隋唐、后唐、南唐、宋明等规则；需要中立比较时可选择地区或全部并行年号。"],
      ["boundary", "纪年换算", "原则三：边界年从严，月日不擅改。", "公元年份只作桥梁；输入月日原文保留，并明确标记尚未执行历法换算。"],
    ],
    timeline: [
      ["907", "唐亡后续用天祐纪年，维持唐统"],
      ["923", "后唐同光元年；五代正朔取后唐"],
      ["937", "南唐升元元年；后唐之后取南唐"],
      ["1647", "永历元年；明清鼎革后默认续用南明正朔"],
      ["1912", "民国元年；辛亥以后归民国纪年"],
      ["1950", "第一版按年份简化，自此输出公元纪年"],
    ],
    features: ["年号互换", "历史研究", "日本古代年号", "隋唐五代", "并行纪年", "年份级精度"],
  },
  en: {
    htmlLabel: "English",
    eyebrow: "Bidirectional East Asian era interchange",
    subtitle:
      "Convert era years to CE, reverse-search Japanese, Chinese, Korean, or concurrent eras from a CE year, and optionally apply the documented orthodoxy profile.",
    inputLabel: "Date expression",
    placeholder: "Example: 日本大化元年 or 公元645年",
    convert: "Interchange",
    converting: "Converting",
    target: "Target",
    calendar: "Calendar: preserve month/day text (extension point reserved)",
    statusIdle: "Ready",
    statusDone: "Complete",
    statusError: "Needs correction",
    githubHeader: "GitHub · Source",
    githubPrompt: "Need it again? Star Ming Zhengshuo on GitHub.",
    githubResult: "Star on GitHub",
    principlesLabel: "Research principles",
    resultTitle: "Conversion record",
    source: "Source",
    gregorian: "Bridge year",
    targetResult: "Target result",
    gregorianSource: "Gregorian / CE",
    calendarPrefix: "Precision: year. ",
    calendarDetail: "Month/day text is preserved; no lunisolar, Julian, or Gregorian day conversion has been applied. ",
    calendarSuffix: "The calendarMode API is reserved for future exact calendar conversion.",
    empty:
      "Interchange era and CE years, show the documented orthodoxy result, or list regional and concurrent eras. Ambiguities and out-of-range values are reported here.",
    timelineTitle: "Default orthodoxy profile",
    boundaryTitle: "Research scope",
    boundary:
      "This is a convenience tool for historical research, not a substitute for primary sources or specialist chronological tables. The displayed orthodoxy profile is explicit and does not claim universal consensus.",
    defense:
      "The public app accepts short text only and has no comments, uploads, or external script input. Era results use the dataset’s canonical Han-character names.",
    inputTooLong: "Error: keep the input within 80 characters.",
    failed: "Error: conversion failed.",
    targets: {
      orthodox: "Default orthodoxy",
      gregorian: "Gregorian / CE",
      japan: "Japanese eras",
      china: "Chinese eras",
      korea: "Korean eras",
      all: "All concurrent eras",
    },
    principles: [
      ["source", "Identify source", "Principle 1: identify the era’s polity.", "Do not silently choose among duplicate era names. Use the polity when known; otherwise request or report disambiguation."],
      ["orthodoxy", "Compare systems", "Principle 2: disclose the selected profile.", "The default line follows documented Jin, Sui–Tang, Later Tang, Southern Tang, Song–Ming, and later rules. Use a region or all results for neutral comparison."],
      ["boundary", "Respect boundaries", "Principle 3: do not invent day-level precision.", "The CE year is a bridge. Month/day text is preserved and explicitly marked as not calendar-converted."],
    ],
    timeline: [
      ["907", "Continue Tang Tianyou after the fall of Tang"],
      ["923", "Later Tang Tongguang 1; Later Tang selected for the Five Dynasties"],
      ["937", "Southern Tang Shengyuan 1; Southern Tang follows Later Tang"],
      ["1647", "Yongli 1; the default profile continues Southern Ming dating"],
      ["1912", "Republic year 1 after the 1911 Revolution"],
      ["1950", "Version-one simplification: output Gregorian years from here"],
    ],
    features: ["Era interchange", "Historical research", "Japanese eras", "Sui–Tang and Five Dynasties", "Concurrent dating", "Year precision"],
  },
  ja: {
    htmlLabel: "日本語",
    eyebrow: "東アジア元号の双方向変換と正朔対照",
    subtitle:
      "元号年から西暦へ、西暦から日本・中国・朝鮮および並行元号へ逆引きできます。明示された既定の正朔プロファイルによる対照も可能です。",
    inputLabel: "紀年表記",
    placeholder: "例：日本大化元年／公元645年",
    convert: "変換する",
    converting: "変換中",
    target: "変換先",
    calendar: "暦法：月日原文を保持（拡張インターフェース予約済み）",
    statusIdle: "入力待ち",
    statusDone: "変換完了",
    statusError: "要修正",
    githubHeader: "GitHub · ソース",
    githubPrompt: "また年号を調べるなら、GitHubで明正朔をStar。",
    githubResult: "GitHubでStar",
    principlesLabel: "研究上の原則",
    resultTitle: "変換記録",
    source: "入力元",
    gregorian: "基準年",
    targetResult: "変換結果",
    gregorianSource: "西暦紀年",
    calendarPrefix: "精度：年。",
    calendarDetail: "月日は原文のまま保持され、太陰太陽暦・ユリウス暦・グレゴリオ暦の実日付変換は未実施です。",
    calendarSuffix: "将来の厳密な暦法変換に備え calendarMode API を予約しています。",
    empty:
      "元号と西暦を双方向変換し、既定の正朔、地域別元号、同時代の並行元号を表示します。曖昧な元号や範囲外の年はここに示します。",
    timelineTitle: "既定の正朔プロファイル（略）",
    boundaryTitle: "研究上の範囲",
    boundary:
      "本サイトは歴史研究の便宜を図る補助ツールであり、一次史料や専門的な暦譜に代わるものではありません。表示する正朔は明示された規則であり、唯一の歴史観を主張しません。",
    defense:
      "公開版は短いテキストのみを受け付け、コメント・アップロード・外部スクリプト入力はありません。結果の元号名はデータセットの漢字標準名で表示します。",
    inputTooLong: "エラー：入力は80文字以内にしてください。",
    failed: "エラー：変換できませんでした。",
    targets: {
      orthodox: "既定の正朔",
      gregorian: "西暦",
      japan: "日本の元号",
      china: "中国の元号",
      korea: "朝鮮・韓国の元号",
      all: "すべての並行元号",
    },
    principles: [
      ["source", "元号の出典", "原則一：元号の政権を先に確認する。", "同名元号を黙って一つに決めません。国号で判定できる場合は特定し、できない場合は曖昧性を示します。"],
      ["orthodoxy", "正朔の対照", "原則二：採用するプロファイルを明示する。", "既定線は晋・隋唐・後唐・南唐・宋明などの公開規則に従います。中立比較には地域指定または全候補を使います。"],
      ["boundary", "境界を厳守", "原則三：日単位の精度を仮定しない。", "西暦年は橋渡しにのみ用います。月日は原文を保持し、暦法変換未実施と明示します。"],
    ],
    timeline: [
      ["907", "唐滅亡後も天祐紀年を継続"],
      ["923", "後唐同光元年；五代の正朔には後唐を採用"],
      ["937", "南唐昇元元年；後唐の後は南唐を採用"],
      ["1647", "永暦元年；既定線では南明紀年を継続"],
      ["1912", "民国元年；辛亥革命以後は民国紀年"],
      ["1950", "初版の年単位簡略化により以後は西暦表示"],
    ],
    features: ["元号双方向変換", "歴史研究", "日本古代元号", "隋唐五代", "並行紀年", "年単位精度"],
  },
} as const;

export function ConverterShell() {
  const [language, setLanguage] = useState<Language>("zh");
  const [text, setText] = useState("同治五年三月初八");
  const [target, setTarget] = useState("orthodox");
  const [result, setResult] = useState<InterchangeResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePrinciple, setActivePrinciple] = useState<PrincipleId>("source");
  const t = copy[language];

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language === "ja" ? "ja" : "en";
  }, [language]);

  const selectedPrinciple =
    t.principles.find((item) => item[0] === activePrinciple) ?? t.principles[0];
  const status = useMemo(() => {
    if (loading) return t.converting;
    if (result) return t.statusDone;
    if (error) return t.statusError;
    return t.statusIdle;
  }, [error, loading, result, t]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const input = text.trim();
      if (input.length > 80) throw new Error(t.inputTooLong);
      setResult(interchangeEra(input, target, "preserve"));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <section>
          <header className="masthead">
            <div className="masthead-tools">
              <div className="language-switch" aria-label="Language / 语言 / 言語">
                {(["zh", "en", "ja"] as const).map((value) => (
                  <button
                    aria-pressed={language === value}
                    key={value}
                    onClick={() => setLanguage(value)}
                    type="button"
                  >
                    {copy[value].htmlLabel}
                  </button>
                ))}
              </div>
              <a className="github-link github-link-header" href="https://github.com/Siyuan-chat/ming-zhengshuo" rel="noreferrer" target="_blank">{t.githubHeader}</a>
            </div>
            <div className="brand-row">
              <div className="seal" aria-hidden="true"><img src="seal-zhuanshu.png" alt="" /></div>
              <div><p className="eyebrow">{t.eyebrow}</p><h1>明正朔</h1></div>
            </div>
            <p className="subtitle">{t.subtitle}</p>
          </header>

          <form className="tool-panel" onSubmit={submit}>
            <label className="input-label" htmlFor="era-input"><span>{t.inputLabel}</span><span>{status}</span></label>
            <div className="input-wrap">
              <input id="era-input" value={text} onChange={(event) => setText(event.target.value)} placeholder={t.placeholder} autoComplete="off" />
              <button className="primary-button" disabled={loading} type="submit">{loading ? t.converting : t.convert}</button>
            </div>
            <div className="target-row">
              <label htmlFor="target-select">{t.target}</label>
              <select id="target-select" value={target} onChange={(event) => setTarget(event.target.value)}>
                {Object.entries(t.targets).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <span>{t.calendar}</span>
            </div>
            <div className="examples" aria-label="Examples">
              {examples.map((example) => <button className="example-button" key={example} onClick={() => setText(example)} type="button">{example}</button>)}
            </div>
            <div className="tags" aria-label="Principles">
              {t.principles.map((item) => (
                <button aria-pressed={activePrinciple === item[0]} className="tag" key={item[0]} onClick={() => setActivePrinciple(item[0])} type="button">{item[1]}</button>
              ))}
            </div>
            <output className="principle-output" aria-live="polite"><span>{t.principlesLabel}</span><strong>{selectedPrinciple[2]}</strong><p>{selectedPrinciple[3]}</p></output>
          </form>
        </section>

        <aside className="side">
          <div className="visual-plate" aria-hidden="true"><img className="visual-image" src="og.png" alt="" /></div>
          <section className="result-panel" aria-live="polite">
            <div className="panel-heading"><h2>{t.resultTitle}</h2><span className="status">{status}</span></div>
            {result ? (
              <>
                <p className="output">{result.output}</p>
                <div className="facts">
                  <div className="fact"><span>{t.source}</span><strong>{result.source.kind === "gregorian" ? t.gregorianSource : `${result.source.polity}${result.source.era}`}</strong></div>
                  <div className="fact"><span>{t.gregorian}</span><strong>CE / 公元 {result.westernYear}</strong></div>
                  <div className="fact"><span>{t.targetResult}</span><strong>{result.matches.map((item) => item.text).join("、")}</strong></div>
                </div>
                <p className="footer-note">{t.calendarPrefix}{t.calendarDetail} {t.calendarSuffix}</p>
                <p className="result-github-cta"><span>{t.githubPrompt}</span><a className="github-link" href="https://github.com/Siyuan-chat/ming-zhengshuo" rel="noreferrer" target="_blank">{t.githubResult}</a></p>
              </>
            ) : (
              <><p className="placeholder">{t.empty}</p>{error && <p className="placeholder error">{error}</p>}</>
            )}
          </section>

          <section className="ledger"><h2>{t.timelineTitle}</h2><div className="timeline">{t.timeline.map(([year, note]) => <div className="timeline-row" key={year}><time>{year}</time><span>{note}</span></div>)}</div></section>
          <section className="public-note" aria-label={t.boundaryTitle}>
            <h2>{t.boundaryTitle}</h2><p>{t.boundary}</p>
            <div className="feature-list">{t.features.map((feature) => <span key={feature}>{feature}</span>)}</div>
            <p className="defense-note">{t.defense}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
