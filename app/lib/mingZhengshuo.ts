import erasData from "@/src/ming_zhengshuo/data/eras.json";
import japaneseHistoricalErasData from "@/src/ming_zhengshuo/data/japanese_historical_eras.json";
import profilesData from "@/src/ming_zhengshuo/data/orthodoxy_profiles.json";
import suiTangFiveDynastiesErasData from "@/src/ming_zhengshuo/data/sui_tang_five_dynasties_eras.json";

type Era = {
  id: string;
  name: string;
  polity: string;
  region: string;
  start_year: number;
  end_year?: number;
  max_year: number | null;
  aliases?: string[];
  polity_aliases?: string[];
  calendar?: string;
};

type OrthodoxySegment = {
  id: string;
  start_year: number;
  end_year: number | null;
  target_polity: string;
  mode: "official_era" | "continuous_era" | "minguo" | "gregorian";
  base_era?: string;
  base_year?: number;
};

export type ConversionResult = {
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

export type CalendarContract = {
  mode: "preserve";
  sourceCalendar: string;
  targetCalendars: string[];
  precision: "year";
  dayConversionApplied: false;
  preservedText: string;
  note: string;
};

export type InterchangeMatch = {
  polity: string;
  region?: string;
  era: string;
  eraYear: number;
  text: string;
  calendar?: string;
};

export type InterchangeResult = {
  input: string;
  output: string;
  westernYear: number;
  target: string;
  source: {
    kind: "era" | "gregorian";
    polity: string;
    era: string;
    eraYear: number;
    rest: string;
    text: string;
    calendar: string;
  };
  matches: InterchangeMatch[];
  calendar: CalendarContract;
};

type ParsedInput = {
  polityHint: string | null;
  eraName: string;
  eraYear: number;
  rest: string;
};

type JapaneseHistoricalEraRow = [
  name: string,
  startYear: number,
  maxYear: number,
  aliases: string[],
  court?: "北" | "南" | "共",
];

const japaneseHistoricalEras = (japaneseHistoricalErasData as JapaneseHistoricalEraRow[]).map(
  ([name, startYear, maxYear, aliases, court], index): Era => ({
    id: `japan_historical_${String(index + 1).padStart(3, "0")}`,
    name,
    polity: court && court !== "共" ? `日本${court}朝` : "日本",
    region: "japan",
    start_year: startYear,
    max_year: maxYear,
    aliases,
    polity_aliases:
      court === "共" ? ["日本北朝", "北朝", "日本南朝", "南朝"] : undefined,
    calendar: "japanese_lunisolar",
  }),
);

type ChineseMedievalEraRow = [
  name: string,
  polity: string,
  startYear: number,
  maxYear: number,
  aliases: string[],
];

const chineseMedievalEras = (suiTangFiveDynastiesErasData as ChineseMedievalEraRow[]).map(
  ([name, polity, startYear, maxYear, aliases], index): Era => ({
    id: `china_medieval_${String(index + 1).padStart(3, "0")}`,
    name,
    polity,
    region: "china",
    start_year: startYear,
    max_year: maxYear,
    aliases,
    polity_aliases: [
      `${polity}朝`,
      polity.replace("后", "後"),
      `${polity.replace("后", "後")}朝`,
    ],
    calendar: "chinese_lunisolar",
  }),
);

const eras = [...(erasData as Era[]), ...japaneseHistoricalEras, ...chineseMedievalEras];
const profiles = profilesData as Record<string, OrthodoxySegment[]>;
const commonHints = [
  "日本南朝",
  "日本北朝",
  "大韩帝国",
  "南朝",
  "北朝",
  "清朝",
  "日本",
  "朝鲜",
  "韩国",
  "大韩",
  "中国",
  "清",
  "倭",
];
const digits: Record<string, number> = {
  零: 0,
  "〇": 0,
  一: 1,
  二: 2,
  两: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};
const units: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
  萬: 10000,
};
const intDigits = "零一二三四五六七八九";
const yearPattern = /^(\d+|元|[零〇一二两兩三四五六七八九十百千万萬廿卅]+)年(.*)$/u;

export function convertEra(input: string, profile = "default"): ConversionResult {
  const parsed = parseInput(input);
  const era = resolveEra(parsed.eraName, parsed.eraYear, parsed.polityHint);
  const westernYear = era.start_year + parsed.eraYear - 1;
  const orthodox = westernToOrthodox(westernYear, parsed.rest, profile);
  const sourceText = `${displayPolity(era.polity)}${era.name}${intToCn(parsed.eraYear)}年${parsed.rest}`;
  const output =
    orthodox.mode === "gregorian"
      ? `${sourceText} = ${orthodox.text}`
      : `${sourceText} = 公元${westernYear}年 = ${orthodox.text}`;

  return {
    input,
    output,
    westernYear,
    source: {
      polity: displayPolity(era.polity),
      era: era.name,
      eraYear: parsed.eraYear,
      rest: parsed.rest,
    },
    orthodox,
  };
}

export function interchangeEra(
  input: string,
  target = "orthodox",
  calendarMode = "preserve",
  profile = "default",
): InterchangeResult {
  if (calendarMode !== "preserve") {
    throw new Error(
      `错误：历法模式“${calendarMode}”尚未实现；当前仅支持 preserve（月日原样保留）。`,
    );
  }

  const source = parseInterchangeSource(input);
  let matches: InterchangeMatch[];
  const normalizedTarget = target.trim();

  if (["gregorian", "ce", "公元", "西历", "西曆", "西暦"].includes(normalizedTarget)) {
    matches = [
      {
        polity: "公元",
        era: "公元",
        eraYear: source.westernYear,
        text: `公元${source.westernYear}年${source.rest}`,
        calendar: "gregorian",
      },
    ];
  } else if (["orthodox", "正朔", "default"].includes(normalizedTarget)) {
    const orthodox = westernToOrthodox(source.westernYear, source.rest, profile);
    matches = [
      {
        polity: orthodox.polity,
        era: orthodox.era,
        eraYear: orthodox.eraYear,
        text: orthodox.text,
        calendar: "rule_based_or_gregorian",
      },
    ];
  } else {
    matches = westernToEras(source.westernYear, normalizedTarget).map((item) => ({
      ...item,
      text: `${item.text}${source.rest}`,
    }));
    if (matches.length === 0) {
      throw new Error(
        `错误：公元${source.westernYear}年没有匹配目标“${normalizedTarget}”的年号数据。`,
      );
    }
  }

  const parts = [source.text];
  const gregorianText = `公元${source.westernYear}年${source.rest}`;
  const targetIsGregorian = ["gregorian", "ce", "公元", "西历", "西曆", "西暦"].includes(
    normalizedTarget,
  );
  if (source.kind !== "gregorian" && !targetIsGregorian) parts.push(gregorianText);
  matches.forEach((item) => {
    if (!parts.includes(item.text)) parts.push(item.text);
  });

  return {
    input,
    output: parts.join(" = "),
    westernYear: source.westernYear,
    target: normalizedTarget,
    source,
    matches,
    calendar: {
      mode: "preserve",
      sourceCalendar: source.calendar,
      targetCalendars: Array.from(
        new Set(matches.map((item) => item.calendar ?? "rule_based_or_gregorian")),
      ).sort(),
      precision: "year",
      dayConversionApplied: false,
      preservedText: source.rest,
      note: "月日原样保留，尚未进行阴阳历、儒略历或格里历之间的换算。",
    },
  };
}

function parseInterchangeSource(input: string): InterchangeResult["source"] & {
  westernYear: number;
} {
  const cleaned = input.trim().replace(/\s+/g, "");
  const gregorian = cleaned.match(/^(?:公元|西历|西曆|西暦|CE)?(\d{1,4})年(.*)$/u);
  if (gregorian) {
    const westernYear = Number(gregorian[1]);
    if (westernYear < 1) throw new Error("错误：公元年份必须大于零。");
    return {
      kind: "gregorian",
      polity: "公元",
      era: "公元",
      eraYear: westernYear,
      westernYear,
      rest: gregorian[2],
      text: `公元${westernYear}年${gregorian[2]}`,
      calendar: "gregorian",
    };
  }

  const parsed = parseInput(input);
  const era = resolveEra(parsed.eraName, parsed.eraYear, parsed.polityHint);
  const westernYear = era.start_year + parsed.eraYear - 1;
  return {
    kind: "era",
    polity: displayPolity(era.polity),
    era: era.name,
    eraYear: parsed.eraYear,
    westernYear,
    rest: parsed.rest,
    text: `${displayPolity(era.polity)}${era.name}${intToCn(parsed.eraYear)}年${parsed.rest}`,
    calendar: era.calendar ?? "unknown",
  };
}

function westernToEras(westernYear: number, target: string): InterchangeMatch[] {
  return eras
    .filter((era) => targetMatchesEra(target, era))
    .filter((era) => {
      const endYear = era.end_year ?? (era.max_year === null ? null : era.start_year + era.max_year);
      return westernYear >= era.start_year && (endYear === null || westernYear < endYear);
    })
    .map((era) => {
      const eraYear = westernYear - era.start_year + 1;
      return {
        polity: era.polity,
        region: era.region,
        era: era.name,
        eraYear,
        text: `${displayPolity(era.polity)}${era.name}${intToCn(eraYear)}年`,
        calendar: era.calendar,
      };
    })
    .sort((a, b) => `${a.region}${a.polity}${a.era}`.localeCompare(`${b.region}${b.polity}${b.era}`));
}

function targetMatchesEra(target: string, era: Era) {
  const normalized = target.trim().toLowerCase();
  if (["", "all", "全部", "すべて"].includes(normalized)) return true;
  const regionAliases: Record<string, string[]> = {
    china: ["china", "chinese", "中国", "中國"],
    japan: ["japan", "japanese", "日本"],
    korea: ["korea", "korean", "朝鲜", "朝鮮", "韩国", "韓國"],
  };
  for (const [region, aliases] of Object.entries(regionAliases)) {
    if (aliases.map((alias) => alias.toLowerCase()).includes(normalized)) {
      return era.region === region;
    }
  }
  return [
    era.name,
    era.polity,
    displayPolity(era.polity),
    ...(era.aliases ?? []),
    ...(era.polity_aliases ?? []),
  ]
    .map((label) => label.toLowerCase())
    .includes(normalized);
}

function parseInput(input: string): ParsedInput {
  const cleaned = input.trim().replace(/\s+/g, "");
  if (!cleaned) {
    throw new Error("错误：输入不能为空。");
  }

  const hints = knownHints();
  const matches: Array<{
    length: number;
    polityHint: string | null;
    eraName: string;
    tail: string;
  }> = [];

  for (const era of eras) {
    for (const label of [era.name, ...(era.aliases ?? [])]) {
      if (cleaned.startsWith(label)) {
        matches.push({
          length: label.length,
          polityHint: null,
          eraName: label,
          tail: cleaned.slice(label.length),
        });
      }
      for (const hint of hints) {
        const prefix = `${hint}${label}`;
        if (cleaned.startsWith(prefix)) {
          matches.push({
            length: prefix.length,
            polityHint: hint,
            eraName: label,
            tail: cleaned.slice(prefix.length),
          });
        }
      }
    }
  }

  matches.sort((a, b) => b.length - a.length);
  const match = matches[0];
  if (!match) {
    throw new Error("错误：无法识别输入中的年号。");
  }

  const yearMatch = match.tail.match(yearPattern);
  if (!yearMatch) {
    throw new Error(`错误：无法识别“${match.eraName}”后的年份。`);
  }

  return {
    polityHint: match.polityHint,
    eraName: match.eraName,
    eraYear: cnToInt(yearMatch[1]),
    rest: yearMatch[2],
  };
}

function resolveEra(eraName: string, eraYear: number, polityHint: string | null): Era {
  let candidates = eras.filter(
    (era) => era.name === eraName || (era.aliases ?? []).includes(eraName),
  );
  if (polityHint) {
    candidates = candidates.filter((era) => hintMatchesEra(polityHint, era));
  }

  if (candidates.length === 0) {
    const label = polityHint ? `${polityHint}${eraName}` : eraName;
    throw new Error(`错误：未找到“${label}”对应的年号数据。`);
  }
  if (candidates.length > 1) {
    const lines = ["该年号存在多个候选："];
    candidates.forEach((era, index) => {
      lines.push(`${index + 1}. ${displayPolity(era.polity)}${eraName}${intToCn(eraYear)}年`);
    });
    lines.push(`请指定政权，例如：${displayPolity(candidates[0].polity)}${eraName}${intToCn(eraYear)}年`);
    throw new Error(lines.join("\n"));
  }

  const era = candidates[0];
  if (eraYear < 1) {
    throw new Error(`错误：${era.name}年号年份必须大于零。`);
  }
  if (era.max_year !== null && eraYear > era.max_year) {
    throw new Error(
      `错误：${era.name}年号没有第${intToCn(eraYear)}年。${era.name}年号范围为${era.name}元年至${era.name}${intToCn(era.max_year)}年。`,
    );
  }

  return era;
}

function westernToOrthodox(westernYear: number, rest: string, profile: string) {
  const segment = findSegment(westernYear, profile);

  if (segment.mode === "continuous_era") {
    const eraYear = westernYear - (segment.base_year ?? westernYear) + 1;
    const era = segment.base_era ?? "连续";
    const prefix =
      era === "永历"
        ? "大明"
        : era === "祥兴"
          ? "宋"
          : displayPolity(segment.target_polity);
    return {
      polity: segment.target_polity,
      era,
      eraYear,
      mode: segment.mode,
      text: `${prefix}${era}${intToCn(eraYear)}年${rest}`,
    };
  }

  if (segment.mode === "minguo") {
    const eraYear = westernYear - 1911;
    return {
      polity: segment.target_polity,
      era: "民国",
      eraYear,
      mode: segment.mode,
      text: `民国${intToCn(eraYear)}年${rest}`,
    };
  }

  if (segment.mode === "gregorian") {
    return {
      polity: segment.target_polity,
      era: "公元",
      eraYear: westernYear,
      mode: segment.mode,
      text: `公元${westernYear}年${rest}`,
    };
  }

  if (segment.mode === "official_era") {
    const prefix = officialPrefix(segment.target_polity);
    const official = findOfficialEra(westernYear, segment.target_polity);
    if (official) {
      const eraYear = westernYear - official.start_year + 1;
      return {
        polity: segment.target_polity,
        era: official.name,
        eraYear,
        mode: segment.mode,
        text: `${prefix}${official.name}${intToCn(eraYear)}年${rest}`,
      };
    }
  }

  const fallbackPrefix =
    segment.mode === "official_era" ? officialPrefix(segment.target_polity) : segment.target_polity;
  return {
    polity: segment.target_polity,
    era: "正朔待补",
    eraYear: westernYear,
    mode: segment.mode,
    text: `${fallbackPrefix}正朔待补（公元${westernYear}年${rest}）`,
  };
}

function findSegment(westernYear: number, profile: string): OrthodoxySegment {
  const segments = profiles[profile];
  if (!segments) {
    throw new Error(`错误：未知正统线 profile：${profile}。`);
  }
  const segment = segments.find(
    (item) =>
      westernYear >= item.start_year &&
      (item.end_year === null || westernYear < item.end_year),
  );
  if (!segment) {
    throw new Error(`错误：正统线“${profile}”没有覆盖公元${westernYear}年。`);
  }
  return segment;
}

function findOfficialEra(westernYear: number, targetPolity: string): Era | null {
  for (const era of eras) {
    if (era.polity !== targetPolity) continue;
    const endYear =
      era.end_year ?? (era.max_year === null ? null : era.start_year + era.max_year);
    if (endYear === null) {
      if (westernYear >= era.start_year) return era;
    } else if (westernYear >= era.start_year && westernYear < endYear) {
      return era;
    }
  }
  return null;
}

function officialPrefix(targetPolity: string) {
  if (["明", "南明"].includes(targetPolity)) return "大明";
  if (["北宋", "南宋"].includes(targetPolity)) return "宋";
  return displayPolity(targetPolity);
}

function displayPolity(polity: string) {
  const names: Record<string, string> = {
    西晋: "晋",
    东晋: "晋",
    刘宋: "宋",
    北宋: "宋",
    南宋: "宋",
    南齐: "齐",
    南梁: "梁",
    南陈: "陈",
  };
  return names[polity] ?? polity;
}

function knownHints() {
  const hints = new Set(commonHints);
  eras.forEach((era) => {
    hints.add(era.polity);
    (era.polity_aliases ?? []).forEach((alias) => hints.add(alias));
  });
  return Array.from(hints).sort((a, b) => b.length - a.length);
}

function hintMatchesEra(hint: string, era: Era) {
  if (hint === era.polity) return true;
  if (hint === "南朝") {
    return era.polity === "日本南朝" || (era.polity_aliases ?? []).includes(hint);
  }
  if (hint === "北朝") {
    return era.polity === "日本北朝" || (era.polity_aliases ?? []).includes(hint);
  }
  if (["日本", "倭"].includes(hint)) return era.region === "japan" || era.polity === "日本";
  if (["朝鲜", "韩国", "大韩", "大韩帝国"].includes(hint)) {
    return era.region === "korea" || ["朝鲜", "大韩帝国"].includes(era.polity);
  }
  if (["清", "清朝", "中国"].includes(hint)) return era.polity === "清";
  return (era.polity_aliases ?? []).includes(hint);
}

function cnToInt(text: string): number {
  const value = text.trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "元") return 1;
  if (value.startsWith("廿")) return 20 + (value.length > 1 ? cnToInt(value.slice(1)) : 0);
  if (value.startsWith("卅")) return 30 + (value.length > 1 ? cnToInt(value.slice(1)) : 0);

  let total = 0;
  let section = 0;
  let number = 0;

  for (const char of value) {
    if (char === "零" || char === "〇") {
      number = 0;
      continue;
    }
    if (char in digits) {
      number = digits[char];
      continue;
    }
    if (!(char in units)) {
      throw new Error(`不支持的中文数字：${text}`);
    }
    const unit = units[char];
    if (unit === 10000) {
      section = section + number || 1;
      total += section * unit;
      section = 0;
    } else {
      section += (number || 1) * unit;
    }
    number = 0;
  }

  return total + section + number;
}

function intToCn(num: number): string {
  if (num <= 0) throw new Error("只支持正整数。");
  if (num === 1) return "元";
  return positiveIntToCn(num);
}

function positiveIntToCn(num: number): string {
  if (num < 10) return intDigits[num];
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${tens === 1 ? "" : intDigits[tens]}十${ones ? intDigits[ones] : ""}`;
  }
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const rest = num % 100;
    if (rest === 0) return `${intDigits[hundreds]}百`;
    if (rest < 10) return `${intDigits[hundreds]}百零${intDigits[rest]}`;
    return `${intDigits[hundreds]}百${positiveIntToCn(rest)}`;
  }
  const thousands = Math.floor(num / 1000);
  const rest = num % 1000;
  if (rest === 0) return `${intDigits[thousands]}千`;
  if (rest < 100) return `${intDigits[thousands]}千零${positiveIntToCn(rest)}`;
  return `${intDigits[thousands]}千${positiveIntToCn(rest)}`;
}
