# Submittal Builder Design QA

Date: 2026-08-17

## Evidence

- Reference: `docs/qa/source-submittal-builder-reference.png` (1204 x 848 raster)
- Implementation: `docs/qa/implementation-submittal-builder-1204x854.png` (standalone page at the matching desktop viewport)
- Side-by-side comparison: `docs/qa/submittal-builder-comparison.html`
- State: two selected products, Studs and Tracks groups expanded
- Focused PDF renders: six Decking profile cover pages plus representative performance-data pages

## Review history

### Pass 1

- P2: the matching-product control and primary action could fall below the first viewport when a broad result set was shown.
- Resolution: auto-select an exact match, show the product picker only for 2-12 results, and require refinement for larger result sets.

### Pass 2

- P2: the hero height and left/right panel proportions did not align closely enough with the supplied reference.
- Resolution: reduced hero padding and adjusted the desktop column ratio.

### Final comparison

- Page structure: the site navigation, active Builder tab, dark hero, two-column Builder, and footer now live on a dedicated page and follow the supplied reference composition.
- Typography: heading scale, strong panel labels, and compact table text follow the supplied hierarchy.
- Spacing: hero, panels, filter rows, group rows, and footer note are evenly spaced with no clipping.
- Color: dark navy grouping, light neutral surfaces, and red primary action match the supplied design direction and the existing site brand.
- Controls: search, category tabs, filters, quantity fields, reorder controls, removal, direct PDFs, and combined-PDF action are visible and usable.
- Responsive layout: the 390 x 844 review collapses the builder to one column without horizontal overflow.
- Intentional differences: the optional cover-information strip and Decking category are approved requirements.
- Residual P0/P1/P2 issues: none.

Final result: passed
