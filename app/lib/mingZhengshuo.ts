import erasData from "@/src/ming_zhengshuo/data/eras.json";
import profilesData from "@/src/ming_zhengshuo/data/orthodoxy_profiles.json";

type Era = {
  id: string;
  name: string;
  polity: string;
  region: string;
  start_year: number;
  max_year: number | null;
  aliases?: string[];
  polity_aliases?: string[];
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

type ParsedInput = {
  polityHint: string | null;
  eraName: string;
  eraYear: number;
  rest: string;
};

const eras = erasData as Era[];
const profiles = profilesData as Record<string, OrthodoxySegment[]>;
const commonHints = ["大韩帝国", "清朝", "日本", "朝鲜", "韩国", "大韩", "中国", "清", "倭"];
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
  const sourceText = `${era.polity}${era.name}${intToCn(parsed.eraYear)}年${parsed.rest}`;
  const output =
    orthodox.mode === "gregorian"
      ? `${sourceText} = ${orthodox.text}`
      : `${sourceText} = 公元${westernYear}年 = ${orthodox.text}`;

  return {
    input,
    output,
    westernYear,
    source: {
      polity: era.polity,
      era: era.name,
      eraYear: parsed.eraYear,
      rest: parsed.rest,
    },
    orthodox,
  };
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
      lines.push(`${index + 1}. ${era.polity}${eraName}${intToCn(eraYear)}年`);
    });
    lines.push(`请指定政权，例如：${candidates[0].polity}${eraName}${intToCn(eraYear)}年`);
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
    const prefix = era === "永历" ? "大明" : era === "祥兴" ? "大宋" : segment.target_polity;
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

  return {
    polity: segment.target_polity,
    era: "正朔待补",
    eraYear: westernYear,
    mode: segment.mode,
    text: `${segment.target_polity}正朔待补（公元${westernYear}年${rest}）`,
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
