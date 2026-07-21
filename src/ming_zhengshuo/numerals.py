from __future__ import annotations


CN_DIGITS = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}

CN_UNITS = {
    "十": 10,
    "百": 100,
    "千": 1000,
    "万": 10000,
    "萬": 10000,
}

INT_DIGITS = "零一二三四五六七八九"


def cn_to_int(text: str) -> int:
    value = text.strip()
    if not value:
        raise ValueError("中文数字不能为空。")
    if value.isdigit():
        return int(value)
    if value == "元":
        return 1
    if value.startswith("廿"):
        return 20 + (cn_to_int(value[1:]) if len(value) > 1 else 0)
    if value.startswith("卅"):
        return 30 + (cn_to_int(value[1:]) if len(value) > 1 else 0)

    total = 0
    section = 0
    number = 0

    for char in value:
        if char in {"零", "〇"}:
            number = 0
            continue
        if char in CN_DIGITS:
            number = CN_DIGITS[char]
            continue
        if char not in CN_UNITS:
            raise ValueError(f"不支持的中文数字：{text}")

        unit = CN_UNITS[char]
        if unit == 10000:
            section = (section + number) or 1
            total += section * unit
            section = 0
        else:
            section += (number or 1) * unit
        number = 0

    return total + section + number


def int_to_cn(num: int) -> str:
    if num <= 0:
        raise ValueError("只支持正整数。")
    if num == 1:
        return "元"
    return _positive_int_to_cn(num)


def _positive_int_to_cn(num: int) -> str:
    if num < 10:
        return INT_DIGITS[num]
    if num < 100:
        tens, ones = divmod(num, 10)
        prefix = "" if tens == 1 else INT_DIGITS[tens]
        return f"{prefix}十{INT_DIGITS[ones] if ones else ''}"
    if num < 1000:
        hundreds, rest = divmod(num, 100)
        if rest == 0:
            return f"{INT_DIGITS[hundreds]}百"
        if rest < 10:
            return f"{INT_DIGITS[hundreds]}百零{INT_DIGITS[rest]}"
        return f"{INT_DIGITS[hundreds]}百{_positive_int_to_cn(rest)}"
    if num < 10000:
        thousands, rest = divmod(num, 1000)
        if rest == 0:
            return f"{INT_DIGITS[thousands]}千"
        if rest < 100:
            return f"{INT_DIGITS[thousands]}千零{_positive_int_to_cn(rest)}"
        return f"{INT_DIGITS[thousands]}千{_positive_int_to_cn(rest)}"
    high, rest = divmod(num, 10000)
    if rest == 0:
        return f"{_positive_int_to_cn(high)}万"
    if rest < 1000:
        return f"{_positive_int_to_cn(high)}万零{_positive_int_to_cn(rest)}"
    return f"{_positive_int_to_cn(high)}万{_positive_int_to_cn(rest)}"
