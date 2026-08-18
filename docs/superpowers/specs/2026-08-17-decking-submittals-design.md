# Decking Submittals Design

## Scope

Add six source-backed decking profiles to the existing Refined Metal submittal catalog. The first release excludes 9/16 inch deck.

| Profile | Grade | Gauges | Coatings | Products |
| --- | --- | --- | --- | ---: |
| 1.5 inch Composite Deck | 40, 50, 80 | 22, 20, 18, 16 | G40, G60, G90 | 36 |
| 2 inch Composite Deck | 50 | 22, 20, 18, 16 | G40, G60, G90 | 12 |
| 3 inch Composite Deck | 50 | 22, 20, 18, 16 | G40, G60, G90 | 12 |
| 7/8 inch S Deck | 50 | 28, 26, 24, 22 | G40, G60, G90 | 12 |
| 7/8 inch Form Deck | 50 | 26, 24, 22, 20 | G40, G60, G90 | 12 |
| 1 5/16 inch Form Deck | 50 | 22, 20, 18, 16 | G40, G60, G90 | 12 |

The generated catalog must contain 96 decking products and 444 products total.

## Data and identifiers

The source manifest is `scripts/submittal-builder/decking-products.json`. A base row represents one profile, grade, and gauge. The generator expands every base row into G40, G60, and G90 variants. Performance data is coating-independent; coating changes only the public coating field and identifier.

Identifiers use compact, searchable codes such as `15CD-FY50-22-G60`, `2CD-FY50-20-G90`, `3CD-FY50-18-G40`, `078SD-FY50-24-G60`, `078FD-FY50-26-G60`, and `1316FD-FY50-22-G60`.

Every record retains its Steel Catalog page references internally. Public product rows show source data consistently with other products and do not add a special provenance badge.

## PDF output

Each variant produces a branded PDF in `assets/submittal-builder/documents/products/`.

- Page 1: product identifier, profile, grade, gauge, coating, product photo, and supplied profile drawing.
- Page 2: section properties and the relevant source-backed shear, web crippling, allowable load, deflection, or construction-span tables.
- Composite profiles may use Page 3 for slab and cantilever information when the source contains those tables.

The PDF generator uses only values and table regions mapped to the official Steel Catalog. It must fail before writing incomplete output when a required source image, drawing, catalog page, or manifest field is missing.

## Verification

- Exactly 32 base rows expand to exactly 96 products.
- Each base identifier has exactly three coating variants.
- No 9/16 profile or file appears in the catalog.
- Product identifiers and PDF URLs are unique, and every referenced PDF exists.
- Representative products from all six profiles are rendered and visually inspected.
- Performance metadata is identical across the three coating variants of a base row.

