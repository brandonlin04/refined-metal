from __future__ import annotations

import json
from datetime import datetime
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
SOURCE_DIR = SCRIPT_DIR / "source"
CATALOG_PATH = ROOT / "assets" / "submittal-builder" / "data" / "catalog.json"
PRODUCT_DIR = ROOT / "assets" / "submittal-builder" / "documents" / "products"
LOGO_PATH = ROOT / "images" / "common" / "rm-logo.png"
MANIFEST_PATH = SCRIPT_DIR / "decking-products.json"

NAVY = colors.HexColor("#13263A")
BLUE = colors.HexColor("#075276")
RED = colors.HexColor("#DC2626")
LIGHT = colors.HexColor("#F3F5F7")
MID = colors.HexColor("#D8E0E7")
TEXT = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#5B6775")

REQUIRED_PROFILE_KEYS = {
    "code",
    "family",
    "deck_type",
    "depth",
    "grade",
    "photo",
    "drawing",
    "source_pages",
    "performance_pages",
    "rows",
}
REQUIRED_ROW_KEYS = {
    "gauge",
    "design_thickness",
    "weight_psf",
    "fy_ksi",
    "s_pos",
    "s_neg",
    "m_pos",
    "m_neg",
    "i_pos",
    "i_neg",
}


def load_manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def validate_manifest(manifest: dict) -> None:
    if manifest.get("coatings") != ["G40", "G60", "G90"]:
        raise ValueError("Decking coatings must be exactly G40, G60 and G90")
    if "9/16 Deck" not in manifest.get("excluded_profiles", []):
        raise ValueError("The first release must explicitly exclude 9/16 Deck")

    base_ids: set[str] = set()
    row_count = 0
    for profile in manifest.get("profiles", []):
        missing = REQUIRED_PROFILE_KEYS - profile.keys()
        if missing:
            raise ValueError(f"{profile.get('code', 'profile')} missing keys: {sorted(missing)}")
        if "9/16" in f"{profile['family']} {profile['depth']}":
            raise ValueError(f"Excluded profile found: {profile['family']}")

        for relative_path in (profile["photo"], profile["drawing"]):
            source = SOURCE_DIR / relative_path
            if not source.is_file() or source.stat().st_size == 0:
                raise FileNotFoundError(f"Missing decking source asset: {source}")
        for page_name in profile["performance_pages"]:
            source = SOURCE_DIR / "catalog-pages" / page_name
            if not source.is_file() or source.stat().st_size == 0:
                raise FileNotFoundError(f"Missing Steel Catalog page image: {source}")

        for row in profile["rows"]:
            missing = REQUIRED_ROW_KEYS - row.keys()
            if missing:
                raise ValueError(f"{profile['code']} {row.get('gauge', '?')}ga missing keys: {sorted(missing)}")
            base_id = f"{profile['code']}-FY{profile['grade']}-{row['gauge']}"
            if base_id in base_ids:
                raise ValueError(f"Duplicate decking base ID: {base_id}")
            base_ids.add(base_id)
            row_count += 1

    if row_count != 32:
        raise ValueError(f"Expected 32 decking source rows, found {row_count}")


def expand_products(manifest: dict) -> list[dict]:
    products: list[dict] = []
    sort_order = 349
    for profile in manifest["profiles"]:
        for row in profile["rows"]:
            base_id = f"{profile['code']}-FY{profile['grade']}-{row['gauge']}"
            performance_tables = [
                {
                    "label": "Published Steel Catalog performance tables",
                    "pages": list(profile["source_pages"]),
                }
            ]
            for coating in manifest["coatings"]:
                product_id = f"{base_id}-{coating}"
                filename = f"{product_id}.pdf"
                products.append(
                    {
                        "id": product_id,
                        "base_id": base_id,
                        "designation": (
                            f"{profile['family']}, Grade {profile['grade']}, "
                            f"{row['gauge']}ga, {coating}"
                        ),
                        "base_designation": base_id,
                        "type": profile["family"],
                        "category": "decking",
                        "family": profile["family"],
                        "deck_type": profile["deck_type"],
                        "web_depth": profile["depth"],
                        "grade": profile["grade"],
                        "ksi": profile["grade"],
                        "mil": row["design_thickness"],
                        "gauge": row["gauge"],
                        "coating": coating,
                        "design_method": "ASD",
                        "esr_id": None,
                        "esr_url": None,
                        "status": "complete",
                        "source": manifest["catalog_source"],
                        "source_pages": list(profile["source_pages"]),
                        "section": dict(row),
                        "performance_tables": performance_tables,
                        "notes": [
                            "Section properties and performance tables are sourced from the Refined Metal Steel Catalog 2025.",
                            "Published structural performance is independent of the selected coating classification.",
                        ],
                        "product": "Decking",
                        "member": product_id,
                        "sort_order": sort_order,
                        "pdf_filename": filename,
                        "pdf_url": f"documents/products/{filename}",
                        "data_gaps": [],
                        "data_completeness": "Complete source row",
                        "_photo": profile["photo"],
                        "_drawing": profile["drawing"],
                        "_performance_pages": list(profile["performance_pages"]),
                    }
                )
                sort_order += 1
    return products


def draw_fitted_image(pdf: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float) -> None:
    with Image.open(path) as image:
        source_width, source_height = image.size
    scale = min(width / source_width, height / source_height)
    draw_width = source_width * scale
    draw_height = source_height * scale
    pdf.drawImage(
        str(path),
        x + (width - draw_width) / 2,
        y + (height - draw_height) / 2,
        width=draw_width,
        height=draw_height,
        preserveAspectRatio=True,
        mask="auto",
    )


def draw_header(pdf: canvas.Canvas, title: str, subtitle: str) -> None:
    width, height = letter
    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    if LOGO_PATH.is_file():
        pdf.drawImage(str(LOGO_PATH), 40, height - 72, width=92, height=42, preserveAspectRatio=True, mask="auto")
    pdf.setFillColor(NAVY)
    pdf.rect(0, height - 126, width, 46, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(40, height - 103, title)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawRightString(width - 40, height - 101, subtitle)
    pdf.setFillColor(RED)
    pdf.rect(0, height - 130, width, 4, fill=1, stroke=0)


def draw_footer(pdf: canvas.Canvas, product: dict, page_number: int) -> None:
    width, _ = letter
    pdf.setStrokeColor(MID)
    pdf.line(40, 34, width - 40, 34)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(40, 22, "REFINED METAL · SUBMITTAL PRODUCT DATA")
    pdf.drawRightString(width - 40, 22, f"{product['id']}  |  Page {page_number}")


def draw_summary(pdf: canvas.Canvas, product: dict) -> None:
    labels = ["PRODUCT", "GRADE", "GAUGE", "COATING"]
    values = [product["family"], f"Grade {product['grade']}", f"{product['gauge']} ga", product["coating"]]
    widths = [252, 105, 95, 80]
    x = 40
    y = 614
    for label, value, width in zip(labels, values, widths):
        pdf.setFillColor(LIGHT)
        pdf.rect(x, y, width, 43, fill=1, stroke=0)
        pdf.setFillColor(MUTED)
        pdf.setFont("Helvetica-Bold", 6.5)
        pdf.drawString(x + 8, y + 28, label)
        pdf.setFillColor(TEXT)
        font_size = 10
        while stringWidth(value, "Helvetica-Bold", font_size) > width - 16 and font_size > 7:
            font_size -= 0.5
        pdf.setFont("Helvetica-Bold", font_size)
        pdf.drawString(x + 8, y + 10, value)
        x += width + 1


def draw_section_table(pdf: canvas.Canvas, product: dict, y: float) -> None:
    section = product["section"]
    headers = ["Thickness\n(in.)", "Weight\n(psf)", "Fy\n(ksi)", "S+\n(in³/ft)", "S-\n(in³/ft)", "M+\n(in-lb/ft)", "M-\n(in-lb/ft)", "I+\n(in⁴/ft)", "I-\n(in⁴/ft)"]
    values = [
        section["design_thickness"],
        section["weight_psf"],
        section["fy_ksi"],
        section["s_pos"],
        section["s_neg"],
        section["m_pos"],
        section["m_neg"],
        section["i_pos"],
        section["i_neg"],
    ]
    data = [headers, values]
    table = Table(data, colWidths=[58, 52, 42, 55, 55, 65, 65, 55, 55], rowHeights=[35, 24])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
                ("TEXTCOLOR", (0, 1), (-1, 1), TEXT),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.white),
            ]
        )
    )
    table.wrapOn(pdf, 532, 59)
    table.drawOn(pdf, 40, y)


def create_page_one(pdf: canvas.Canvas, product: dict) -> None:
    draw_header(pdf, "DECKING PRODUCT SUBMITTAL", product["id"])
    draw_summary(pdf, product)

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(40, 586, "PRODUCT VIEW")
    pdf.drawString(310, 586, "PROFILE DRAWING")
    pdf.setStrokeColor(MID)
    pdf.rect(40, 358, 242, 215, fill=0, stroke=1)
    pdf.rect(310, 358, 262, 215, fill=0, stroke=1)
    draw_fitted_image(pdf, SOURCE_DIR / product["_photo"], 50, 368, 222, 195)
    draw_fitted_image(pdf, SOURCE_DIR / product["_drawing"], 320, 368, 242, 195)

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, 330, f"SECTION PROPERTIES · {product['gauge']} GAUGE")
    pdf.setFillColor(RED)
    pdf.rect(40, 322, 532, 2, fill=1, stroke=0)
    draw_section_table(pdf, product, 248)

    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, 224, "SOURCE AND USE")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 8)
    lines = [
        "Source: Refined Metal Steel Catalog 2025, published pages " + ", ".join(map(str, product["source_pages"])),
        "ASD section values above are the exact published row for this grade and gauge.",
        "Coating selection does not change the published structural performance values.",
        "Verify project-specific loading, fastening, span, concrete, and code requirements with the design professional.",
    ]
    for index, line in enumerate(lines):
        pdf.drawString(48, 207 - index * 15, f"{index + 1}. {line}")
    draw_footer(pdf, product, 1)


def cropped_reader(path: Path) -> tuple[ImageReader, int, int]:
    with Image.open(path) as image:
        width, height = image.size
        crop = image.crop((int(width * 0.105), int(height * 0.07), int(width * 0.90), int(height * 0.90)))
        buffer = BytesIO()
        crop.save(buffer, format="PNG", optimize=True)
        crop_width, crop_height = crop.size
    buffer.seek(0)
    return ImageReader(buffer), crop_width, crop_height


def draw_source_panel(pdf: canvas.Canvas, page_path: Path, label: str, x: float, y: float, width: float, height: float) -> None:
    reader, source_width, source_height = cropped_reader(page_path)
    scale = min(width / source_width, height / source_height)
    draw_width = source_width * scale
    draw_height = source_height * scale
    pdf.setStrokeColor(MID)
    pdf.rect(x, y, width, height, fill=0, stroke=1)
    pdf.drawImage(
        reader,
        x + (width - draw_width) / 2,
        y + (height - draw_height) / 2,
        width=draw_width,
        height=draw_height,
        preserveAspectRatio=True,
    )
    pdf.setFillColor(NAVY)
    pdf.rect(x, y + height - 18, width, 18, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawString(x + 7, y + height - 12, label)


def create_source_page(pdf: canvas.Canvas, product: dict, page_number: int, page_names: list[str]) -> None:
    draw_header(pdf, "PUBLISHED PERFORMANCE DATA", f"{product['id']} · {product['gauge']} GAUGE")
    pdf.setFillColor(TEXT)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, 640, "OFFICIAL STEEL CATALOG EXCERPTS")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(40, 625, "Selected product row is reproduced on Page 1; excerpts retain published table context and notes.")

    if len(page_names) == 1:
        panels = [(40, 62, 532, 545)]
    else:
        panels = [(40, 342, 532, 265), (40, 62, 532, 265)]
    for index, (page_name, panel) in enumerate(zip(page_names, panels)):
        printed_page = int(Path(page_name).stem.split("-")[-1]) - 2
        draw_source_panel(
            pdf,
            SOURCE_DIR / "catalog-pages" / page_name,
            f"STEEL CATALOG PAGE {printed_page}",
            *panel,
        )
    draw_footer(pdf, product, page_number)


def generate_pdf(product: dict) -> None:
    output = PRODUCT_DIR / product["pdf_filename"]
    pdf = canvas.Canvas(str(output), pagesize=letter, pageCompression=1)
    pdf.setTitle(f"Refined Metal {product['designation']}")
    pdf.setAuthor("Refined Metal")
    create_page_one(pdf, product)
    pdf.showPage()

    performance_pages = product["_performance_pages"]
    if product["deck_type"] == "Composite Deck":
        create_source_page(pdf, product, 2, performance_pages[:2])
        pdf.showPage()
        create_source_page(pdf, product, 3, performance_pages[2:4])
    else:
        create_source_page(pdf, product, 2, performance_pages[:2])
    pdf.save()


def merge_catalog(products: list[dict]) -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    base_products = [product for product in catalog["products"] if product.get("category") != "decking"]
    public_products = []
    for product in products:
        public_products.append({key: value for key, value in product.items() if not key.startswith("_")})
    catalog["products"] = base_products + public_products
    catalog["generatedAt"] = datetime.now(ZoneInfo("America/New_York")).isoformat()
    catalog["source"] = "ICC-ES ESR-5724, ESR-5724-Plans, ESR-5837 and Refined Metal Steel Catalog 2025"
    catalog["counts"] = {
        "total": len(catalog["products"]),
        "ESR-5724": sum(1 for product in catalog["products"] if product.get("esr_id") == "ESR-5724"),
        "ESR-5837": sum(1 for product in catalog["products"] if product.get("esr_id") == "ESR-5837"),
        "source_limited": sum(1 for product in catalog["products"] if product.get("status") == "source_limited"),
        "decking": len(public_products),
    }
    if not any(category.get("id") == "decking" for category in catalog["categories"]):
        catalog["categories"].append({"id": "decking", "label": "Decking"})
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2), encoding="utf-8")


def main() -> int:
    manifest = load_manifest()
    validate_manifest(manifest)
    products = expand_products(manifest)
    if len(products) != 96:
        raise ValueError(f"Expected 96 decking products, found {len(products)}")
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
    for product in products:
        generate_pdf(product)
    merge_catalog(products)
    print(f"Generated {len(products)} decking PDFs and merged catalog total 444")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
