# Submittal Product Image Replacement Design

## Objective

Replace the generated `PHOTO-STYLE PRODUCT VIEW` illustrations in all 348 non-Decking product PDFs with the approved source PNGs while preserving product IDs, PDF filenames, catalog paths, engineering drawings, specifications, and performance data. The 96 Decking PDFs already use approved source images and remain unchanged.

## Approved Image Mapping

Source directory: `E:\Refined-Metal\RM-Submittal_builder\assets\submittal-builder\pics`

| Product family | Source image |
| --- | --- |
| Structural, Nonstructural, and EQ Studs | `357103ab-c498-4e9d-8a25-ad75b7e231b3.png` |
| Structural, Nonstructural, and EQ Tracks | `5b9229a1-f7ce-4680-a084-37f31388efd4.png` |
| Joists | `0fdf9579-4915-45a1-8a88-8c320b81f8e1.png` |
| 1.5-inch Composite Deck | `730f38f3-b865-4081-a6bf-e0331931d9b0.png` |
| 7/8-inch Form Deck and 7/8-inch S Deck | `923bffc4-9e1a-4adb-b5be-af83aec5b96e.png` |
| 1 5/16-inch Form Deck | `b78f8a77-3f42-43af-b20b-efdb9abc6c27.png` |
| 2-inch and 3-inch Composite Deck | `dce1c43e-0395-47c9-9818-63a15610689a.png` |

The Decking mapping documents the existing website generator configuration; those 96 PDFs are not regenerated in this change.

## Generation Design

- Update `scripts/build_catalog.py` in the source project so Stud, Track, and EQ products resolve to the approved family image instead of generating a synthetic illustration.
- Update `scripts/generate_rich_custom_joist_submittals.py` so all Joist products use the approved Joist image.
- Draw source images with aspect-ratio-preserving contain behavior, centered on a white panel without cropping or stretching.
- Rename the panel heading to `PRODUCT VIEW` and remove the `Illustrative view - not a manufacturer photograph` disclaimer.
- Regenerate the 348 non-Decking product PDFs in the source project, then synchronize only those catalog-referenced PDFs into the website product directory. Preserve all 96 existing Decking PDFs.
- Do not alter `catalog.json`, product identifiers, filters, quantities, coating data, engineering drawings, or Builder behavior.

## Failure Handling

- Validate every mapped source image before generation and stop immediately if a file is missing, empty, or unreadable.
- Require each non-Decking catalog product to resolve to exactly one family image.
- Do not synchronize generated PDFs to the website until generation and automated validation succeed.

## Verification

- Add regression tests for the family-to-image mapping, source-image existence, aspect-ratio-preserving drawing, `PRODUCT VIEW` heading, and removed disclaimer.
- Confirm the source generation produces 348 non-Decking PDFs.
- Confirm the website still contains 444 catalog products and every catalog PDF path exists as a non-empty readable PDF.
- Scan regenerated PDF text to confirm the old heading and disclaimer are absent.
- Render and visually inspect representative Structural Stud, Nonstructural Stud, EQ Stud, Structural Track, EQ Track, and Joist PDFs.
- Exercise the standalone Builder with representative regenerated products and confirm individual and combined PDF downloads remain functional.
