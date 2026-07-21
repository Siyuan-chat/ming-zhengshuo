import json
import unittest
from pathlib import Path

import _bootstrap  # noqa: F401
from ming_zhengshuo.converter import convert


class HistoricalSamplesTest(unittest.TestCase):
    def test_historical_sample_outputs(self):
        fixture_path = Path(__file__).parent / "fixtures" / "historical_samples.json"
        groups = json.loads(fixture_path.read_text(encoding="utf-8"))

        for group in groups:
            for case in group["cases"]:
                with self.subTest(group=group["group"], text=case["input"]):
                    self.assertEqual(convert(case["input"]), case["expected"])


if __name__ == "__main__":
    unittest.main()
