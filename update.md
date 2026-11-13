# Update

## 2026-11-13 - Consistent Site Navigation and UL Footer Badge

### Summary

- Unified the navigation on all 12 public HTML pages, including the Evaluation Report and Submittal Builder pages, with the same destinations, labels, spacing, and current-page indicators.
- Added an accessible mobile menu containing all navigation destinations. Below 360px, the duplicate quote button is hidden while Contact remains available in the menu.
- Added the supplied transparent UL logo beside the RM and ICC-ES footer logos on every page, linking to the existing UL certificates section.

### Verification

- Page regression tests: 6 passed, including navigation consistency and UL badge coverage across every public page.
- Targeted Evaluation Report regression: 1 passed.
- Playwright: all 12 pages passed at 1440px and 390px; the Evaluation Report also passed at 320, 768, 1024, 1280, 1536, and 1920px, with no navigation overlap or clipping.
- Verified product dropdown navigation, desktop/mobile Submittal Builder navigation, and the footer link to the UL certificates.
- Verified 48px badge rendering, byte-for-byte preservation of the uploaded image, and no page-content changes outside navigation and the footer badge.

### Notes

- Browser validation found three pre-existing missing images: `images/studs/drywall-studs.png`, `images/tracks/smart-tracks.png`, and `images/tracks/drywall-tracks.png`. These unrelated assets remain outside this change; no new browser errors were found.
- Uses the existing Azure deployment workflows without pipeline or version changes.

## 2026-08-27 - Homepage Navigation Spacing

### Summary

- Expanded the homepage navigation container and reduced menu spacing at desktop breakpoints after adding the Submittal Builder link.
- Kept Contact and Get a Quote separately visible from 1280px upward without overlap.
- At 1024–1279px, kept the Contact destination visible and temporarily hid the duplicate quote CTA; below 1024px, kept the quote CTA while the full menu remains collapsed.

### Verification

- Regression test completed a red-to-green cycle for the responsive navigation class contract.
- Browser geometry checks at 1689, 1536, and 1280px measured 0px overlap; the smallest Contact-to-CTA gap was 29.08px at 1280px.
- Browser checks at 1024 and 900px confirmed the responsive visibility handoff, with 0px overlap.
- Visual homepage QA confirmed both desktop controls are fully readable and separated.

### Notes

- No navigation labels, destinations, hero content, or non-homepage headers were changed.

## 2026-08-27 - Azure Production Deployment Reliability

### Summary

- Replaced the Decking regression test's unsupported `Map.groupBy` call with a Node 20-compatible `Map` loop.
- Changed the Azure Static Web Apps workflow to upload only the runtime website: root HTML pages plus `assets`, `catalogs`, `documents`, and `images`.
- Preserved the complete 444-product catalog and every customer-downloadable product PDF while excluding repository and development files from the deployment package.

### Verification

- `npm test`: 17/17 tests passed.
- Static deployment inventory: 515 files, 347,707,063 bytes (331.6 MiB), below the 500 MiB Azure Static Web Apps limit.
- Catalog inventory: 444 products (348 core and 96 Decking), with 0 missing product PDFs.

### Notes

- Production publication still requires both Azure workflows to pass after this change is pushed to `main`.

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
