import unittest

import _bootstrap  # noqa: F401
from ming_zhengshuo.converter import convert, convert_structured


class ConverterTest(unittest.TestCase):
    def test_qing_to_yongli(self):
        self.assertEqual(
            convert("同治五年三月初八"),
            "清同治五年三月初八 = 公元1866年 = 大明永历二百二十年三月初八",
        )
        self.assertEqual(
            convert("光绪三十四年"),
            "清光绪三十四年 = 公元1908年 = 大明永历二百六十二年",
        )
        self.assertEqual(
            convert("宣统三年"),
            "清宣统三年 = 公元1911年 = 大明永历二百六十五年",
        )

    def test_japanese_to_default_orthodoxy(self):
        self.assertEqual(
            convert("明治元年"),
            "日本明治元年 = 公元1868年 = 大明永历二百二十二年",
        )
        self.assertEqual(
            convert("日本昭和二十年八月十五"),
            "日本昭和二十年八月十五 = 公元1945年 = 民国三十四年八月十五",
        )
        self.assertEqual(
            convert("令和六年五月一日"),
            "日本令和六年五月一日 = 公元2024年五月一日",
        )

    def test_korean_to_default_orthodoxy(self):
        self.assertEqual(
            convert("建阳元年"),
            "朝鲜建阳元年 = 公元1896年 = 大明永历二百五十年",
        )
        self.assertEqual(
            convert("朝鲜光武三年四月十五"),
            "大韩帝国光武三年四月十五 = 公元1899年 = 大明永历二百五十三年四月十五",
        )
        self.assertEqual(
            convert("隆熙四年"),
            "大韩帝国隆熙四年 = 公元1910年 = 大明永历二百六十四年",
        )

    def test_out_of_range(self):
        self.assertEqual(
            convert("同治十四年"),
            "错误：同治年号没有第十四年。同治年号范围为同治元年至同治十三年。",
        )

    def test_structured_result(self):
        result = convert_structured("昭和二十五年")
        self.assertEqual(result["western_year"], 1950)
        self.assertEqual(result["orthodox"]["mode"], "gregorian")
        self.assertEqual(result["output"], "日本昭和二十五年 = 公元1950年")


if __name__ == "__main__":
    unittest.main()
