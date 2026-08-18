from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[2]
ESR_DIR = ROOT / "assets" / "submittal-builder" / "documents" / "esr"


def normalize_pdf(path: Path) -> bool:
    reader = PdfReader(path)
    if not reader.is_encrypted:
        return False
    if reader.decrypt("") == 0:
        raise RuntimeError(f"Unable to open encrypted PDF with its empty user password: {path.name}")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    if reader.metadata:
        metadata = {str(key): str(value) for key, value in reader.metadata.items() if value is not None}
        writer.add_metadata(metadata)

    temporary = path.with_suffix(".normalized.pdf")
    with temporary.open("wb") as stream:
        writer.write(stream)
    verification = PdfReader(temporary)
    if verification.is_encrypted or len(verification.pages) != len(reader.pages):
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Normalized PDF verification failed: {path.name}")
    temporary.replace(path)
    return True


def main() -> int:
    changed = []
    for path in sorted(ESR_DIR.glob("*.pdf")):
        if normalize_pdf(path):
            changed.append(path.name)
    print(f"Normalized {len(changed)} ESR PDFs: {', '.join(changed) if changed else 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
