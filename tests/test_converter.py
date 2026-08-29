import unittest

import _bootstrap  # noqa: F401
from ming_zhengshuo.converter import (
    convert,
    convert_structured,
    interchange,
    interchange_structured,
    western_to_orthodox,
)
from ming_zhengshuo.data_loader import load_eras


class ConverterTest(unittest.TestCase):
    def test_complete_japanese_era_count(self):
        japanese_eras = [
            era for era in load_eras() if era.get("region") == "japan"
        ]
        self.assertEqual(len(japanese_eras), 248)

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
            convert("日本大化元年"),
            "日本大化元年 = 公元645年 = 唐贞观十九年",
        )
        self.assertEqual(
            convert("日本天平元年"),
            "日本天平元年 = 公元729年 = 唐开元十七年",
        )
        self.assertEqual(
            convert("日本庆应三年"),
            "日本庆应三年 = 公元1867年 = 大明永历二百二十一年",
        )
        self.assertEqual(
            convert("日本慶応三年"),
            "日本庆应三年 = 公元1867年 = 大明永历二百二十一年",
        )
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

    def test_japanese_north_and_south_courts(self):
        self.assertEqual(
            convert("日本南朝延元元年"),
            "日本南朝延元元年 = 公元1336年 = 宋祥兴五十九年",
        )
        self.assertEqual(
            convert("日本北朝暦応元年"),
            "日本北朝历应元年 = 公元1338年 = 宋祥兴六十一年",
        )

    def test_japanese_dates_use_tang_and_southern_tang_line(self):
        self.assertEqual(
            convert("日本延喜七年"),
            "日本延喜七年 = 公元907年 = 唐天祐四年",
        )
        self.assertEqual(
            convert("日本延长元年"),
            "日本延长元年 = 公元923年 = 后唐同光元年",
        )
        self.assertEqual(
            convert("日本承平七年"),
            "日本承平七年 = 公元937年 = 南唐升元元年",
        )
        self.assertEqual(
            convert("日本天德三年"),
            "日本天德三年 = 公元959年 = 南唐显德二年",
        )

    def test_sui_tang_and_five_dynasties_have_no_orthodoxy_gap(self):
        for western_year in range(589, 960):
            with self.subTest(western_year=western_year):
                self.assertNotIn("正朔待补", western_to_orthodox(western_year))

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

    def test_bidirectional_gregorian_and_japanese(self):
        self.assertEqual(
            interchange("日本大化元年", target="gregorian"),
            "日本大化元年 = 公元645年",
        )
        self.assertEqual(
            interchange("公元645年", target="japan"),
            "公元645年 = 日本大化元年",
        )

    def test_bidirectional_cross_region(self):
        self.assertEqual(
            interchange("唐贞观十九年", target="japan"),
            "唐贞观十九年 = 公元645年 = 日本大化元年",
        )
        result = interchange_structured("日本承平七年", target="南唐")
        self.assertEqual(result["western_year"], 937)
        self.assertEqual(result["matches"][0]["text"], "南唐升元元年")

    def test_all_returns_parallel_eras(self):
        result = interchange_structured("公元1338年", target="all")
        labels = {item["text"] for item in result["matches"]}
        self.assertIn("日本南朝延元三年", labels)
        self.assertIn("日本北朝历应元年", labels)

    def test_calendar_extension_contract_preserves_day_text(self):
        result = interchange_structured(
            "日本昭和二十年八月十五",
            target="gregorian",
            calendar_mode="preserve",
        )
        self.assertEqual(result["calendar"]["precision"], "year")
        self.assertFalse(result["calendar"]["day_conversion_applied"])
        self.assertEqual(result["calendar"]["preserved_text"], "八月十五")


if __name__ == "__main__":
    unittest.main()
