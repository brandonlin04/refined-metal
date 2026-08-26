# Update

## 2026-08-26 - Approved Product Images in Core Submittals

### Summary

- Rebuilt all 348 non-Decking product submittals with the approved uploaded series image: Stud, Track, or Joist.
- Renamed the image panel to `PRODUCT VIEW`, removed the synthetic-image disclaimer, and kept each source image centered at its original aspect ratio without cropping or stretching.
- Preserved all catalog product data and paths, plus the existing 96 Decking submittals; the public Builder still contains 444 products.
- Added SHA-256 regression checks for the three approved core product images.

### Verification

- Source generator tests: 8 passed, covering series mapping, missing/unreadable assets, contained drawing geometry, both PDF panel implementations, and preflight validation before output replacement.
- Source PDF validation: 348/348 files were non-empty two-page PDFs; all contained `PRODUCT VIEW`, and none contained the old `PHOTO-STYLE PRODUCT VIEW` heading or synthetic-image disclaimer.
- Website tests: `npm test` passed 17/17 tests; all 444 product PDFs and ICC-ES assets remained readable.
- Visual PDF QA: inspected Structural Stud, EQ Stud, Structural Track, EQ Track, and Joist page-one renders; images were correctly mapped, centered, and unclipped.
- Browser QA: selected one Stud, Track, Joist, and EQ product; the Builder created a 10-page, 0.8 MB Submittal-only package and exposed the dated download filename. Individual product download also triggered successfully.

### Notes

- The 96 Decking PDF hashes were checked before and after synchronization and did not change.
- The source catalog was restored byte-for-byte after generation so this image-only update did not alter product metadata or ordering.
- No production deployment or live-site publication was performed.

## 2026-08-18 - Submittal-only Combined PDF

### Summary

- Removed automatic ICC-ES report loading and appending from the combined package.
- Combined downloads now contain only the optional cover, generated index, and selected product submittals.
- Updated the page description, generated cover contents, and completion status to match the package contents.

### Verification

- `npm test`: 16 tests passed, including a regression contract that rejects ICC-ES loading or appending in the Submittal Builder runtime.
- Browser QA: generated a package for ESR-mapped product `162S125-18`; the output contained four pages (cover, index, and two product pages), while the five-page ESR-5724 report was excluded. No console errors occurred.
- The standalone ICCES Report page and navigation link remain unchanged.

## 2026-08-18 - Valid Product Filter Combinations

### Summary

- Changed product filters to faceted, dependent options so every displayed value remains compatible with the customer's other selections.
- Prevented unavailable combinations such as Structural Tracks / 2.5 / 1.5 / 27 mil from being selectable; 27 mil is removed as soon as the preceding selections make it invalid.
- Preserved the current selections while the remaining dropdown options update.

### Verification

- `npm test`: 15 tests passed, including a regression proving empty-result facet values are excluded.
- Browser QA: reproduced the reported Tracks path and confirmed Mil / Thickness offers only 33, 43, 54, 68, and 97; Coating offers only G60 and G60/G90, with five matching products and no console errors.

### Notes

- Search text may still intentionally show no results when the customer enters an unknown product ID or designation.

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
