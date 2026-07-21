import unittest

import _bootstrap  # noqa: F401
from ming_zhengshuo.numerals import cn_to_int, int_to_cn


class NumeralsTest(unittest.TestCase):
    def test_cn_to_int(self):
        cases = {
            "元": 1,
            "五": 5,
            "十": 10,
            "十一": 11,
            "二十": 20,
            "廿五": 25,
            "卅四": 34,
            "二百二十": 220,
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                self.assertEqual(cn_to_int(text), expected)

    def test_int_to_cn(self):
        cases = {
            1: "元",
            5: "五",
            10: "十",
            11: "十一",
            20: "二十",
            25: "二十五",
            34: "三十四",
            220: "二百二十",
            262: "二百六十二",
        }
        for number, expected in cases.items():
            with self.subTest(number=number):
                self.assertEqual(int_to_cn(number), expected)


if __name__ == "__main__":
    unittest.main()
