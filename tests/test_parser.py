import unittest

import _bootstrap  # noqa: F401
from ming_zhengshuo.parser import parse


class ParserTest(unittest.TestCase):
    def test_parse_without_polity_hint(self):
        self.assertEqual(
            parse("同治五年三月初八"),
            {
                "polity_hint": None,
                "era_name": "同治",
                "era_year": 5,
                "rest": "三月初八",
            },
        )

    def test_parse_with_polity_hint(self):
        self.assertEqual(
            parse("日本昭和二十年八月十五"),
            {
                "polity_hint": "日本",
                "era_name": "昭和",
                "era_year": 20,
                "rest": "八月十五",
            },
        )

    def test_parse_korean_alias_hint(self):
        self.assertEqual(
            parse("朝鲜光武三年四月十五"),
            {
                "polity_hint": "朝鲜",
                "era_name": "光武",
                "era_year": 3,
                "rest": "四月十五",
            },
        )


if __name__ == "__main__":
    unittest.main()
