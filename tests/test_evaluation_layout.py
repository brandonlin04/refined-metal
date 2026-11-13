from pathlib import Path
import unittest

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "assets/submittal-builder/documents/products"


class EvaluationLayoutTests(unittest.TestCase):
    def test_new_decking_uses_original_two_panel_layout(self):
        for member in ["916FD-FY50-24-G60", "078FD-FY33-26-G90", "1316FD-FY80-16-G60", "15RD-FY33-22-G90", "15CD-FY33-22-G40", "2CD-FY80-16-G60", "3CD-FY33-22-G40"]:
            with self.subTest(member=member), pdfplumber.open(PRODUCTS / f"{member}.pdf") as pdf:
                page = pdf.pages[0]
                text = page.extract_text()
                self.assertIn("PRODUCT VIEW", text)
                self.assertIn("PROFILE DRAWING", text)
                self.assertTrue(any(40 <= image["x0"] < 100 and 350 < image["y0"] < 540 for image in page.images))
                self.assertTrue(any(310 <= image["x0"] < 400 and 350 < image["y0"] < 540 for image in page.images))
                self.assertIn("SECTION PROPERTIES", text)
                self.assertNotIn("Not provided", text)

    def test_roof_caption_is_complete_and_inside_drawing_panel(self):
        with pdfplumber.open(PRODUCTS / "15RD-FY33-22-G90.pdf") as pdf:
            matches = pdf.pages[0].search("ESR-5723 Figure 2")
            self.assertEqual(len(matches), 1)
            caption = matches[0]
            self.assertGreaterEqual(caption["x0"], 310)
            self.assertLessEqual(caption["x1"], 572)
            self.assertLess(caption["bottom"], 434)
            self.assertGreater(caption["top"], 400)

    def test_clip_publishes_known_data_with_shared_summary_and_table_styles(self):
        with pdfplumber.open(PRODUCTS / "RM-SMART-CLIP.pdf") as pdf:
            page = pdf.pages[0]
            text = page.extract_text()
            for label in ["PRODUCT", "STANDARD", "DOCUMENT", "PRODUCT INFORMATION", "UL CERTIFICATE", "CERTIFICATION DETAILS", "SOURCE AND USE", "UL-US-2594886-0"]:
                self.assertIn(label, text)
            for missing in ["Not provided", "PRODUCT SPECIFICATIONS", "Dimensions:", "Thickness / gauge:", "Coating:", "Load capacity:"]:
                self.assertNotIn(missing, text)
            self.assertEqual(len(pdf.pages), 3)
            self.assertIn("RM Smart Clip", pdf.pages[2].extract_text())


if __name__ == "__main__":
    unittest.main()
