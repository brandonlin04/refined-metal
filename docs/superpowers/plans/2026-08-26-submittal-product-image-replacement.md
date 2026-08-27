# Submittal Product Image Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generated illustration in every non-Decking product submittal with the approved uploaded Stud, Track, or Joist product image, while preserving the existing 96 Decking submittals and all catalog/product data.

**Architecture:** Put the approved three-image mapping and aspect-ratio-safe drawing logic in one small Python module shared by both PDF generators. Rebuild the 348 non-Decking PDFs in the source project, then copy only those catalog-addressed files into the website worktree so the 96 Decking PDFs cannot be overwritten.

**Tech Stack:** Python 3, Pillow, ReportLab, pypdf, Node.js test runner, Git

---

## Assumptions and success criteria

- The approved mapping is series-level reuse:
  - every Stud product, including Structural, Nonstructural, and EQ Smart Stud, uses `357103ab-c498-4e9d-8a25-ad75b7e231b3.png`;
  - every Track product, including Structural, Nonstructural, and EQ Smart Track, uses `5b9229a1-f7ce-4680-a084-37f31388efd4.png`;
  - every Joist product uses `0fdf9579-4915-45a1-8a88-8c320b81f8e1.png`.
- The panel heading is `PRODUCT VIEW`; the synthetic-image disclaimer is removed.
- Images are centered and contained without stretching or cropping.
- Missing, empty, unreadable, or unmapped images stop the build.
- Exactly 348 non-Decking PDFs are regenerated and synced; the website retains 96 existing Decking PDFs, for 444 total.
- Product IDs, designations, filter data, drawings, technical values, filenames, and catalog paths do not change.

### Task 1: Lock the approved mapping with failing tests

**Files:**
- Create: `E:\Refined-Metal\RM-Submittal_builder\tests\test_product_images.py`
- Create: `E:\Refined-Metal\RM-Submittal_builder\scripts\product_images.py`

- [ ] Write `unittest` cases for Stud, Track, EQ Stud, EQ Track, and Joist product types.
- [ ] Assert the three exact approved source filenames are returned.
- [ ] Assert an unknown product type raises an explicit error.
- [ ] Assert a missing or unreadable mapped image stops validation.
- [ ] Use a recording canvas to assert the image draw call preserves aspect ratio and is centered inside the requested bounds.
- [ ] Run the test before implementation and confirm it fails because the helper module does not exist.
- [ ] Implement only the mapping, validation, and contained-image drawing needed by the tests.
- [ ] Run:

  `C:\Users\ZDD\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m unittest discover -s E:\Refined-Metal\RM-Submittal_builder\tests -v`

  Expected: all tests pass.

### Task 2: Replace the main catalog generator's synthetic panel

**Files:**
- Modify: `E:\Refined-Metal\RM-Submittal_builder\scripts\build_catalog.py`
- Test: `E:\Refined-Metal\RM-Submittal_builder\tests\test_product_images.py`

- [ ] Import the shared product-image helper.
- [ ] Change the panel heading from `PHOTO-STYLE PRODUCT VIEW` to `PRODUCT VIEW`.
- [ ] Remove the disclaimer and synthetic photo generation call.
- [ ] Draw the mapped uploaded image in the existing panel with contained, centered geometry.
- [ ] Remove only imports/functions made unused by this change.
- [ ] Run the source test suite and a Python syntax compile of the modified scripts.

### Task 3: Apply the same mapping to custom Joist generation

**Files:**
- Modify: `E:\Refined-Metal\RM-Submittal_builder\scripts\generate_rich_custom_joist_submittals.py`
- Test: `E:\Refined-Metal\RM-Submittal_builder\tests\test_product_images.py`

- [ ] Replace its separate synthetic panel with the shared approved-image helper.
- [ ] Use the same `PRODUCT VIEW` heading and contained layout.
- [ ] Remove only the now-unused local synthetic-image implementation/imports.
- [ ] Run all source tests and compile both generators.

### Task 4: Regenerate and validate the 348 source PDFs

**Files:**
- Regenerate: `E:\Refined-Metal\RM-Submittal_builder\assets\submittal-builder\products\*.pdf`
- Preserve: `E:\Refined-Metal\RM-Submittal_builder\assets\submittal-builder\catalog.json`

- [ ] Record the catalog's product IDs, non-PDF fields, and PDF paths before generation.
- [ ] Validate all 348 products resolve to one of the three approved readable images before deleting/replacing outputs.
- [ ] Run the main catalog generator with the bundled Python runtime.
- [ ] Run the custom Joist generator to replace its four catalog-specific outputs.
- [ ] Assert there are exactly 348 non-empty source PDFs and every catalog PDF path exists.
- [ ] Compare the post-build catalog contract against the recorded pre-build contract and fail on unintended changes.
- [ ] Use `pypdf` to confirm representative Stud, Track, EQ, and Joist PDFs contain `PRODUCT VIEW` and do not contain `PHOTO-STYLE PRODUCT VIEW` or the old disclaimer.

### Task 5: Sync only the rebuilt non-Decking PDFs into the website

**Files:**
- Modify: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\assets\submittal-builder\products\*.pdf` (non-Decking catalog entries only)
- Add: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\scripts\submittal-builder\source\photos\stud.png`
- Add: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\scripts\submittal-builder\source\photos\track.png`
- Add: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\scripts\submittal-builder\source\photos\joist.png`
- Modify: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\tests\submittal-assets.test.js`

- [ ] Copy the three approved input images into the website's generator-source photo directory using semantic filenames.
- [ ] Add SHA-256 assertions so later image replacement is deliberate and auditable.
- [ ] Read the website catalog and identify exactly 348 entries whose family is not Decking.
- [ ] Verify every corresponding rebuilt source PDF exists before copying any file.
- [ ] Copy exactly those 348 files; do not touch the 96 Decking paths.
- [ ] Assert the website has exactly 444 non-empty PDFs and every catalog path exists.
- [ ] Run `npm test` and require all tests to pass.

### Task 6: Render and browser-verify representative output

**Files:**
- Inspect generated PDFs and the local page; no product-code changes expected.

- [ ] Render at least one Structural Stud, EQ Stud, Structural Track, EQ Track, and Joist PDF page containing the product-view panel.
- [ ] Inspect the rendered images for correct family mapping, centering, readable title, no disclaimer, no stretching, and no clipping.
- [ ] Start or reuse the local website server and open `/submittal-builder.html`.
- [ ] Add representative products from multiple families and download individual and combined submittal PDFs.
- [ ] Verify downloads contain only Submittals, use the new product views, and show no missing-asset errors.

### Task 7: Record and commit the implementation

**Files:**
- Modify: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\update.md`
- Modify or create: `E:\Refined-Metal\.codex-inspect-refined-metal-1787015576607\function_update.md`

- [ ] Add a concise summary, verification evidence, and any remaining live-deployment note to `update.md`.
- [ ] Add the change to `function_update.md` in date order without changing a product version.
- [ ] Review `git diff --check`, scoped status, and the final changed-file list.
- [ ] Commit only files related to this implementation.
