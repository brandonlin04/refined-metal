# Homepage Submittal Builder Design

## User outcome

A visitor can build and download one project submittal package directly from the Refined Metal homepage without uploading project information or product files to a server.

## Placement and visual structure

The functional section is embedded in `index.html` and is addressable at `#submittal-builder`. It follows the approved reference: existing Refined Metal navigation, dark Builder hero, left product search/filter controls, and right grouped selected-products panel.

The section supports desktop and mobile layouts. It reuses the existing Inter and Space Grotesk fonts, red action color, navy section headers, logo, Feather icons, and current page spacing.

## Behavior

- Load the local 444-product catalog.
- Search by identifier or designation.
- Filter by category and catalog fields, including Deck Type, Depth, Grade, Gauge, and Coating for decking.
- Add products once, group selected products by category, remove them, change optional quantity, and reorder products within a category.
- Allow optional project name, contractor, and prepared-by values. Blank fields remain fill-in lines in the generated cover.
- Build one PDF in the browser: cover, Submittal Index, selected product PDFs in chosen order, then deduplicated applicable ESR reports.
- Use the project name for the filename when present; otherwise use `Refined-Metal-Submittal-YYYY-MM-DD.pdf`.

Generation is disabled while no products are selected. A missing catalog or product PDF produces a visible error naming the affected item; no partial package is downloaded. Progress and success states are visible. Object URLs and large byte arrays are released after download.

## Architecture

The implementation is static and browser-local:

- `submittal-builder-core.js` contains deterministic catalog, selection, ordering, index, ESR, and filename functions usable from Node tests.
- `submittal-builder.js` owns DOM state, fetches local assets, and uses the locally hosted pdf-lib browser bundle.
- `submittal-builder.css` scopes all Builder styling under `.submittal-builder`.
- `index.html` contains only the section markup and script/style includes.

No API endpoint, database, account, or server-side PDF service is added.

## Verification

Node tests cover filtering, deduplication, quantity, ordering, ESR rules, page-index calculation, and filename sanitization. Asset tests require 444 unique products and readable referenced files. Browser checks cover add/remove/filter/build/error states, mobile layout, navigation regression, and console errors. Visual QA compares a browser screenshot against the approved reference image.

