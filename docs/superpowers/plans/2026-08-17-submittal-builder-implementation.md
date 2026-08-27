# Refined Metal Homepage Submittal Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 96 source-backed decking submittals and a complete client-side Submittal Builder to the Refined Metal homepage.

**Architecture:** Preserve the existing static Express-hosted site. Generate static product PDFs offline, expose one merged 444-product catalog, and keep filtering, selection, ordering, cover/index creation, and PDF merging in isolated browser modules.

**Tech Stack:** HTML, scoped CSS, vanilla JavaScript, Node test runner, pdf-lib, Python, ReportLab, Pillow, Poppler.

---

### Task 1: Lock decking scope with failing tests

**Files:**
- Create: `tests/decking-catalog.test.js`
- Create: `scripts/submittal-builder/decking-products.json`

- [ ] Write a Node test that loads `assets/submittal-builder/data/catalog.json` and asserts `products.length === 444`, 96 `category === "decking"` rows, zero `9/16` rows, unique IDs/PDF URLs, 32 base IDs, and coating sets equal to `G40,G60,G90`.
- [ ] Run `npm test -- --test-name-pattern="decking catalog"`; expect failure because the website has no submittal catalog.
- [ ] Add the 32 base manifest records and generation script in Task 2.

### Task 2: Generate decking PDFs and merged catalog

**Files:**
- Create: `scripts/submittal-builder/build-decking.py`
- Create: `scripts/submittal-builder/decking-products.json`
- Create: `scripts/submittal-builder/source/`
- Create: `assets/submittal-builder/data/catalog.json`
- Create: `assets/submittal-builder/documents/products/*.pdf`
- Create: `assets/submittal-builder/documents/esr/*.pdf`

- [ ] Copy the existing 348 generated product PDFs, three ESR documents, and catalog into the website asset tree.
- [ ] Add source profile drawings and photos for the six approved profiles.
- [ ] Implement manifest validation before output: required keys, 32 unique base rows, approved gauge/grade combinations, source files present, and no 9/16 profile.
- [ ] Expand each base row with:

```python
for coating in ("G40", "G60", "G90"):
    product = dict(base)
    product["coating"] = coating
    product["id"] = f'{base["base_id"]}-{coating}'
```

- [ ] Generate branded PDFs, merge 96 rows into the existing catalog, set category order to include decking, and write counts `{total: 444, decking: 96}`.
- [ ] Run `npm test -- --test-name-pattern="decking catalog"`; expect all decking assertions to pass.

### Task 3: Implement deterministic Builder core

**Files:**
- Create: `assets/submittal-builder/js/submittal-builder-core.js`
- Create: `tests/submittal-builder-core.test.js`

- [ ] Write failing tests for category/search filters, option derivation, duplicate selection prevention, positive integer quantity normalization, within-category reorder, deduplicated ESR order, page-start calculations, and filename sanitization.
- [ ] Run `node --test tests/submittal-builder-core.test.js`; expect module-not-found failure.
- [ ] Implement a UMD module exporting `filterProducts`, `getFilterOptions`, `addSelection`, `setQuantity`, `removeSelection`, `reorderWithinCategory`, `getEsrIds`, `calculateIndex`, and `makeFilename`.
- [ ] Run `node --test tests/submittal-builder-core.test.js`; expect all tests to pass.

### Task 4: Embed the functional homepage section

**Files:**
- Modify: `index.html`
- Create: `assets/submittal-builder/css/submittal-builder.css`
- Create: `assets/submittal-builder/js/submittal-builder.js`
- Create: `assets/submittal-builder/vendor/pdf-lib.min.js`

- [ ] Add the `#submittal-builder` navigation link and Builder section immediately after Product Resources.
- [ ] Add accessible search, category tabs, dynamic filters, selected category groups, quantities, remove/reorder controls, optional cover fields, status region, and build button.
- [ ] Implement catalog loading and state rendering with the tested core functions.
- [ ] Fetch every selected PDF, stop on any failed response, build cover/index pages, merge product PDFs and deduplicated ESR reports with pdf-lib, download one file, then release object URLs.
- [ ] Keep all new selectors under `.submittal-builder` and collapse the two-column layout below 900px.

### Task 5: Asset, browser, and visual verification

**Files:**
- Create: `tests/submittal-assets.test.js`
- Create: `design-qa.md`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Add `npm test` using `node --test`, add pdf-lib, and vendor its browser bundle.
- [ ] Assert every catalog PDF/ESR URL resolves to a non-empty PDF and catalog IDs/URLs are unique.
- [ ] Run `npm test`; expect zero failures.
- [ ] Start `npm start`, open `http://127.0.0.1:3000/#submittal-builder`, and test search, category filters, duplicate prevention, quantities, ordering, one generated download, mobile layout, navigation, and console errors.
- [ ] Capture the approved reference and implementation at the same viewport, write `design-qa.md`, fix all P0/P1/P2 findings, and require `final result: passed`.

### Task 6: Documentation and scoped commit

**Files:**
- Create: `update.md`
- Create: `function_update.md`

- [ ] Record the 96 decking products, 444-product catalog, homepage Builder, browser-local privacy boundary, verification commands, and unverified live-deployment boundary.
- [ ] Run `git diff --check`, `npm test`, the PDF integrity script, and the browser smoke flow again.
- [ ] Stage only task files and commit them on `codex/submittal-builder`; do not push or deploy without explicit authorization.
