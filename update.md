# Update

## 2026-08-17 - Standalone Submittal Builder

### Summary

- Added a public standalone `submittal-builder.html` page and linked to it from the homepage navigation and Product Resources card.
- Removed the Builder interface and runtime from the homepage so it is no longer rendered below the homepage content.
- Added browser-local product search, category filters, selection, quantities, within-category reordering, removal, and direct product-PDF access.
- Added combined PDF generation with an optional fill-in cover, index, grouped product sheets, and deduplicated applicable ICC-ES reports.
- Added 96 Decking products covering the approved profiles, grades, gauges, and G40/G60/G90 coatings; the catalog now contains 444 products. The 9/16-inch Decking profile remains excluded.
- Added source-backed Decking product PDFs and normalized the three ICC-ES PDFs so browser-side PDF merging works consistently.

### Verification

- `npm test`: 14 tests passed.
- Route QA: the homepage contains two standalone-page links and no embedded Builder section; the standalone page contains the complete Builder runtime.
- Browser QA: exact and broad filtering, duplicate prevention, quantities, reordering, removal controls, direct PDFs, combined-PDF assembly, explicit download, and mobile layout.
- Generated-PDF QA: visually inspected six representative Decking cover pages and representative official-catalog excerpt pages; no clipping found.
- Design QA: `docs/qa/design-qa.md` final result passed.

### Notes

- PDF assembly remains entirely in the user's browser; entered project information is not uploaded.
- No production deployment or live-site publication was performed.
