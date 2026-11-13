"""Add products supported by ESR-5723 and the supplied RM Smart Clip certificate."""
from __future__ import annotations

import importlib.util
import json
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

import pdfplumber
from PIL import Image
from pypdf import PdfReader, PdfWriter, Transformation
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[1]
CATALOG_PATH = ROOT / "assets/submittal-builder/data/catalog.json"
PRODUCT_DIR = ROOT / "assets/submittal-builder/documents/products"
REPORT = ROOT / "documents/ESR-5723.pdf"
CLIP_CERTIFICATE = ROOT / "documents/UL-R41911-RM-Smart-Clip.pdf"

spec = importlib.util.spec_from_file_location("decking", SCRIPT_DIR / "build-decking.py")
decking = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decking)

# Table 2 uses merged cells and shares the 1.5-inch row between roof and composite decks.
# These logical column boundaries avoid splitting subscripts into separate columns.
TABLE_X = [40, 96, 130, 162, 195, 225, 256.5, 288, 319.5, 351, 391.5, 423, 454.5, 486, 526.5, 568]
FIELDS = ["fy_ksi", "gauge", "design_thickness", "flat_web", "weight_psf", "gross_i", "i_pos", "i_neg", "i_single", "i_multi_neg", "s_pos", "s_neg", "m_pos", "m_neg"]
PROFILES = {
    "916FD": ('9/16" Form Deck', "Form Deck", '9/16"', (45, 132, 565, 195)),
    "078FD": ('7/8" Form Deck', "Form Deck", '7/8"', (45, 55, 565, 132)),
    "1316FD": ('1 5/16" Form Deck', "Form Deck", '1 5/16"', (45, 195, 565, 270)),
    "15RD": ('1.5" Roof Deck (B-Deck)', "Roof Deck", '1.5"', (110, 300, 490, 378)),
    "15CD": ('1.5" Composite Deck', "Composite Deck", '1.5"', (30, 398, 565, 502)),
    "2CD": ('2" Composite Deck', "Composite Deck", '2"', (30, 505, 565, 605)),
    "3CD": ('3" Composite Deck', "Composite Deck", '3"', (30, 608, 565, 708)),
}
PRODUCT_PHOTOS = {
    "916FD": "shallow-form.png", "078FD": "shallow-form.png", "1316FD": "form-1316.png",
    "15RD": "roof-deck.png", "15CD": "composite-15.png", "2CD": "composite-23.png", "3CD": "composite-23.png",
}


def extract_source_rows() -> list[dict]:
    records = []
    with pdfplumber.open(REPORT) as pdf:
        for page_number, table_index in [(4, 2), (5, 0)]:
            table = pdf.pages[page_number - 1].find_tables()[table_index]
            previous = [""] * 15
            for row, values in zip(table.rows[3:], table.extract()[3:]):
                current = [""] * 15
                for cell, value in zip(row.cells, values):
                    if cell and value:
                        column = next(i for i in range(15) if TABLE_X[i] - 0.6 <= cell[0] < TABLE_X[i + 1] - 0.6)
                        current[column] += " " + value
                previous = [value.strip() or old for value, old in zip(current, previous)]
                name = previous[0]
                if "9/16" in name:
                    codes = ["916FD"]
                elif "7/8" in name:
                    codes = ["078FD"]
                elif "15/16" in name:  # PDF text flattens the superscript in 1 5/16.
                    codes = ["1316FD"]
                elif "Roof" in name:
                    codes = ["15RD", "15CD"]
                elif name.startswith('2"'):
                    codes = ["2CD"]
                elif name.startswith('3"'):
                    codes = ["3CD"]
                else:
                    raise ValueError(f"Unexpected ESR-5723 profile: {name}")
                section = dict(zip(FIELDS, previous[1:]))
                if section["gauge"] not in {"16", "18", "20", "22", "24", "26"}:
                    raise ValueError(f"Invalid source row: {previous}")
                for field in FIELDS:
                    float(section[field])
                for code in codes:
                    records.append({"code": code, "section": section.copy(), "source_page": page_number})
    if len(records) != 99:
        raise ValueError(f"Expected 99 ESR-5723 profile/grade/gauge rows, found {len(records)}")
    return records


def new_decking_products(existing: list[dict]) -> list[dict]:
    existing_ids = {p["id"] for p in existing if p.get("source") != "ICC-ES ESR-5723"}
    products = []
    for row in extract_source_rows():
        code, section = row["code"], row["section"]
        family, deck_type, depth, _ = PROFILES[code]
        base_id = f"{code}-FY{section['fy_ksi']}-{section['gauge']}"
        for coating in ["G40", "G60", "G90"]:
            product_id = f"{base_id}-{coating}"
            if product_id in existing_ids:
                continue
            products.append({
                "id": product_id, "base_id": base_id, "base_designation": base_id,
                "designation": f"{family}, Grade {section['fy_ksi']}, {section['gauge']}ga, {coating}",
                "type": family, "category": "decking", "family": family,
                "deck_type": deck_type, "web_depth": depth, "grade": section["fy_ksi"],
                "ksi": section["fy_ksi"], "mil": section["design_thickness"],
                "gauge": section["gauge"], "coating": coating, "design_method": "ASD",
                "esr_id": "ESR-5723", "esr_url": "documents/esr/ESR-5723.pdf",
                "status": "complete", "source": "ICC-ES ESR-5723",
                "source_pages": [row["source_page"], 15], "section": section.copy(),
                "performance_tables": [{"label": "ESR-5723 Table 2: bare steel deck section properties and ASD moments", "pages": [row["source_page"]]}],
                "notes": ["Values are for the bare steel deck, without composite concrete action (ESR-5723 Table 2).",
                          "Coating classifications are individual selections; the report specifies minimum G40.",
                          "Use the full ESR-5723 report for fastening, bearing, span, concrete and other design conditions."],
                "product": "Decking", "member": product_id,
                "pdf_filename": f"{product_id}.pdf", "pdf_url": f"documents/products/{product_id}.pdf",
                "data_gaps": [], "data_completeness": "Published ESR-5723 Table 2 row",
            })
    return products


def clip_product() -> dict:
    return {
        "id": "RM-SMART-CLIP", "designation": "RM Smart Clip", "type": "RM Smart Clip",
        "category": "accessories", "family": "RM Smart Clip",
        "status": "source_limited", "source": "UL Certificate UL-US-2594886-0",
        "section": {}, "product": "RM Smart Clip", "member": "RM Smart Clip",
        "pdf_filename": "RM-SMART-CLIP.pdf", "pdf_url": "documents/products/RM-SMART-CLIP.pdf",
        "data_gaps": ["Dimensions", "Thickness", "Coating", "Load capacity"],
        "data_completeness": "Certificate of Compliance",
        "notes": ["UL 263 Certificate of Compliance for RM Smart Clip."],
    }


def text_lines(pdf, lines: list[str], y: float) -> None:
    style = ParagraphStyle("source", fontName="Helvetica", fontSize=8, leading=12, textColor=decking.MUTED)
    for line in lines:
        paragraph = Paragraph(line, style)
        _, height = paragraph.wrap(516, 200)
        paragraph.drawOn(pdf, 48, y - height)
        y -= height + 7


def generate_deck_pdf(product: dict, drawings: dict, source_reader: PdfReader) -> None:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter, pageCompression=1)
    pdf.setTitle(f"Refined Metal {product['designation']}")
    pdf.setAuthor("Refined Metal")
    code = product["base_id"].split("-FY")[0]
    figure = 1 if code.endswith("FD") else 2 if code == "15RD" else 3
    display_product = {**product, "_photo": f"photos/{PRODUCT_PHOTOS[code]}", "_drawing": drawings[code], "_drawing_caption": f"ESR-5723 Figure {figure}"}
    decking.create_page_one(pdf, display_product, source_lines=[
        f"Source: ICC-ES ESR-5723, Table 2, page {product['source_pages'][0]}; profile drawing, page 15.",
        "ASD section values apply to bare steel deck, without composite concrete action.",
        "Product views are representative catalog photographs; use the profile drawing for dimensions.",
        "Refer to the full report for bearing, fastening, loading and installation requirements.",
    ])
    pdf.showPage()
    decking.draw_header(pdf, "PUBLISHED PERFORMANCE DATA", product["id"])
    pdf.setFillColor(decking.TEXT)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(40, 640, f"ESR-5723 TABLE 2 - SOURCE PAGE {product['source_pages'][0]}")
    decking.draw_footer(pdf, product, 2)
    pdf.save()
    buffer.seek(0)
    writer = PdfWriter()
    writer.append(PdfReader(buffer))
    source_page = source_reader.pages[product["source_pages"][0] - 1]
    writer.pages[1].merge_transformed_page(source_page, Transformation().scale(0.72).translate(86, 51))
    for page in writer.pages:
        page.compress_content_streams(level=9)
    with (PRODUCT_DIR / product["pdf_filename"]).open("wb") as output:
        writer.write(output)


def generate_clip_pdf(product: dict, certificate_image: Path) -> None:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter, pageCompression=1)
    pdf.setTitle("Refined Metal RM Smart Clip Certification Submittal")
    pdf.setAuthor("Refined Metal")
    decking.draw_header(pdf, "PRODUCT SUBMITTAL", product["id"])
    decking.draw_summary(pdf, product, fields=[("PRODUCT", "RM Smart Clip"), ("STANDARD", "UL 263"), ("DOCUMENT", "Certificate")])
    pdf.setFillColor(decking.TEXT)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(40, 586, "PRODUCT INFORMATION")
    pdf.drawString(310, 586, "UL CERTIFICATE")
    pdf.setStrokeColor(decking.MID)
    pdf.rect(40, 358, 242, 215, fill=0, stroke=1)
    pdf.rect(310, 358, 262, 215, fill=0, stroke=1)
    style = ParagraphStyle("product", fontName="Helvetica", fontSize=9, leading=14, textColor=decking.TEXT)
    y = 546
    for label, value in [("Product", "RM Smart Clip"), ("Manufacturer", "Refined Metal LLC"), ("Product category", "CIKV - Framing Members for Fire Resistance")]:
        paragraph = Paragraph(f"<b>{label}</b><br/>{value}", style)
        _, height = paragraph.wrap(218, 100)
        paragraph.drawOn(pdf, 52, y - height)
        y -= height + 22
    decking.draw_fitted_image(pdf, certificate_image, 320, 368, 242, 195)
    pdf.setFillColor(decking.TEXT)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, 330, "CERTIFICATION DETAILS")
    pdf.setFillColor(decking.RED)
    pdf.rect(40, 322, 532, 2, fill=1, stroke=0)
    table = Table([
        ["STANDARD", "CERTIFICATE", "REPORT REFERENCE", "ISSUED"],
        ["UL 263", "UL-US-2594886-0", "R41911-20251209", "December 15, 2025"],
    ], colWidths=[70, 160, 160, 142], rowHeights=[35, 24])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), decking.BLUE), ("TEXTCOLOR", (0, 0), (-1, 0), decking.colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), decking.LIGHT), ("TEXTCOLOR", (0, 1), (-1, 1), decking.TEXT),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 7), ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("GRID", (0, 0), (-1, -1), 0.35, decking.colors.white),
    ]))
    table.wrapOn(pdf, 532, 59)
    table.drawOn(pdf, 40, 248)
    pdf.setFillColor(decking.TEXT)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, 224, "SOURCE AND USE")
    text_lines(pdf, ["1. Source: UL Certificate of Compliance UL-US-2594886-0.", "2. Product designation: RM Smart Clip (see certificate addendum).", "3. The original certificate and addendum are included on the following pages."], 213)
    decking.draw_footer(pdf, product, 1)
    pdf.save()
    buffer.seek(0)
    writer = PdfWriter()
    writer.append(PdfReader(buffer))
    writer.append(CLIP_CERTIFICATE)
    with (PRODUCT_DIR / product["pdf_filename"]).open("wb") as output:
        writer.write(output)


def build() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    generated = new_decking_products(catalog["products"])
    # Rebuild only this source's rows; preserve the existing Steel Catalog products.
    base = [p for p in catalog["products"] if p.get("source") != "ICC-ES ESR-5723" and p["id"] != "RM-SMART-CLIP"]
    source_reader = PdfReader(REPORT)
    clip = clip_product()
    # The shared web logo is much larger than the printed header. Keep its printed
    # resolution at 300 dpi so hundreds of product PDFs stay within site limits.
    with TemporaryDirectory() as temporary:
        drawings = {}
        with pdfplumber.open(REPORT) as pdf:
            for code, profile in PROFILES.items():
                drawing = Path(temporary) / f"{code}.png"
                pdf.pages[14].crop(profile[3]).to_image(resolution=180).save(str(drawing))
                drawings[code] = drawing
        with pdfplumber.open(CLIP_CERTIFICATE) as pdf:
            certificate_image = Path(temporary) / "clip-certificate.png"
            pdf.pages[0].to_image(resolution=100).save(str(certificate_image))
        with Image.open(decking.LOGO_PATH) as logo:
            logo.thumbnail((384, 216), Image.Resampling.LANCZOS)
            logo_path = Path(temporary) / "rm-logo.png"
            logo.save(logo_path)
        decking.LOGO_PATH = logo_path
        for index, product in enumerate(generated, 1):
            generate_deck_pdf(product, drawings, source_reader)
            if index % 50 == 0:
                print(f"Generated {index}/{len(generated)} decking PDFs", flush=True)
        generate_clip_pdf(clip, certificate_image)
    catalog["products"] = base + generated + [clip]
    for order, product in enumerate(catalog["products"], 1):
        product["sort_order"] = order
    catalog["counts"].update({
        "total": len(catalog["products"]), "ESR-5723": len(generated),
        "decking": sum(p["category"] == "decking" for p in catalog["products"]),
        "accessories": 1,
        "source_limited": sum(p.get("status") == "source_limited" for p in catalog["products"]),
    })
    catalog["esrReports"]["ESR-5723"] = {"title": "ICC-ES ESR-5723", "file": "documents/esr/ESR-5723.pdf", "source": "ESR-5723.pdf"}
    catalog["categories"] = [c for c in catalog["categories"] if c["id"] != "accessories"] + [{"id": "accessories", "label": "Accessories"}]
    catalog["generatedAt"] = datetime.now(timezone.utc).isoformat()
    catalog["source"] += ", ICC-ES ESR-5723 and UL R41911" if "UL R41911" not in catalog["source"] else ""
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    print(f"Generated {len(generated)} new decking submittals and 1 clip certification submittal; {len(catalog['products'])} products total")


if __name__ == "__main__":
    build()
