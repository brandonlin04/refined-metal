# Images Directory

This directory contains all image assets for the Refined Metal website. Images are organized into subfolders corresponding to the pages where they are used.

## How to Add New Pictures

### Step 1: Determine the Correct Folder
- Identify which HTML page will use the image
- Place the image in the corresponding folder (see folder structure below)
- For images used on multiple pages (like logos), use the `common/` folder

### Step 2: Follow the Exact Naming Convention
**CRITICAL**: Image filenames must match **exactly** (case-sensitive) what the HTML files are looking for. See the complete list below for all expected image names.

**Naming Rules:**
- All images must be in **PNG format** (`.png` extension)
- Filenames are **case-sensitive** (e.g., `Royal Flow.png` is different from `royal flow.png`)
- Use lowercase with hyphens for most images (e.g., `smart-studs.png`)
- Some door images use capital letters (e.g., `Royal Flow.png`, `Vinegate.png`)
- No spaces in filenames (use hyphens instead, except for door names which may have spaces)

### Step 3: Place the Image
- Save the image file with the exact name listed below
- Place it in the correct folder
- Ensure the file extension is `.png`

### Step 4: Verify
- Check that the filename matches exactly (including case)
- Verify the file is in the correct folder
- Confirm the file has a `.png` extension

### Step 5: Update This README
**IMPORTANT**: After adding a new image, update this README file:
- Move the image name from the "Photos to be added:" section to the main list
- This helps keep track of which images are still missing
- If adding a completely new image type, add it to the appropriate section

## Image Fallback

If an image file is missing or fails to load, a placeholder image will automatically be displayed. **Always use the exact filename** listed below to ensure your images display correctly.

---

## Complete List of Expected Images by Page

### Common Images (Used on All Pages)
**Folder**: `images/common/`

- `rm-logo.png` - Refined Metal logo (used in header and footer)
- `icces-logo.png` - ICC-ES certification logo (used in footer)

---

### Home Page (`index.html`)
**Folder**: `images/index/`

- `home-page.png` - Main hero image for "About Refined Metal" section
- `studs.png` - Product category image for Studs
- `tracks.png` - Product category image for Tracks
- `joists.png` - Product category image for Joists
- `decking.png` - Product category image for Decking
- `doors.png` - Product category image for Doors
- `railings.png` - Product category image for Railings

**To add a new product category image**: Name it exactly as the product name in lowercase (e.g., `newproduct.png`)

---

### Studs Page (`studs.html`)
**Folder**: `images/studs/`

**Existing Photos:**
- `stud-diagram.png` - Technical diagram showing stud specifications
- `smart-studs-punchout-options.png` - Punchout options diagram for Smart Studs
- `drywall-studs-punchout-options.png` - Punchout options diagram for Drywall Studs

**Photos to be added:**
- `smart-studs.png` - Product image for Smart Studs
- `drywall-studs.png` - Product image for Drywall Studs
- `eq-smart-studs.png` - Product image for EQ Smart Studs

**To add a new stud image**: 
- For a new product type: `[product-type]-studs.png` (e.g., `premium-studs.png`)
- For punchout options: `[product-type]-studs-punchout-options.png` (e.g., `premium-studs-punchout-options.png`)

---

### Tracks Page (`tracks.html`)
**Folder**: `images/tracks/`

**Existing Photos:**
- `track-diagram.png` - Technical diagram showing track specifications
- `eq-smart-tracks.png` - Product image for EQ Smart Tracks

**Photos to be added:**
- `smart-tracks.png` - Product image for Smart Tracks
- `drywall-tracks.png` - Product image for Drywall Tracks

**To add a new track image**: 
- For a new product type: `[product-type]-tracks.png` (e.g., `premium-tracks.png`)

---

### Joists Page (`joists.html`)
**Folder**: `images/joists/`

**Existing Photos:**
- `joist-diagram.png` - Technical diagram showing joist specifications
- `smart-joists-punchout-options.png` - Punchout options diagram for Smart Joists

**Photos to be added:**
- `smart-joists.png` - Product image for Smart Joists

**To add a new joist image**: 
- For a new product type: `[product-type]-joists.png` (e.g., `premium-joists.png`)
- For punchout options: `[product-type]-joists-punchout-options.png` (e.g., `premium-joists-punchout-options.png`)

---

### About Page (`about.html`)
**Folder**: `images/about/`

**Existing Photos:**
- `manufacturing-facility.png` - Image of the manufacturing facility

**To add a new about page image**: Name it descriptively (e.g., `team-photo.png`, `factory-exterior.png`)

---

### Decking Page (`decking.html`)
**Folder**: `images/decking/`

**Photos to be added:**
- `smart-decking.png` - Product overview image for Smart Decking

**To add a new decking image**: 
- For a new product type: `[product-type]-decking.png` (e.g., `premium-decking.png`)

---

### Doors Page (`doors.html`)
**Folder**: `images/doors/`

**Existing Photos:**

**Main Images:**
- None currently

**Door Product Images** (Note: These use capital letters):
- `Royal Flow.png` - Royal Flow door design
- `Vinegate.png` - Vinegate door design
- `Gridline.png` - Gridline door design
- `Clearview.png` - Clearview door design

**Door Example Images** (in `images/doors/examples/` subfolder):
- `example1.png` through `example10.png` - Example installation photos

**Photos to be added:**
- `doors-overview.png` - Main product overview image

**To add a new door image**: 
- For a new door design: Use the exact product name with capital letters (e.g., `New Design.png`)
- For new examples: Continue the sequence (e.g., `example11.png`, `example12.png`)

---

### Railings Page (`railings.html`)
**Folder**: `images/railings/`

**Existing Photos:**
- `urban-classic.png` - Urban Classic railing design
- `oval-harmony.png` - Oval Harmony railing design
- `scroll-crest.png` - Scroll Crest railing design
- `fleur-regency.png` - Fleur Regency railing design
- `s-curve-elegance.png` - S-Curve Elegance railing design
- `royal-heritage.png` - Royal Heritage railing design

**To add a new railing image**: 
- Use lowercase with hyphens: `[design-name].png` (e.g., `modern-minimalist.png`)

---

### Contact Page (`contact.html`)
**Folder**: `images/contact/` (if needed in the future)

Currently uses only common images (logos).

---

### Privacy Policy Page (`privacy-policy.html`)
**Folder**: `images/privacy-policy/` (if needed in the future)

Currently uses only common images (logos).

---

### ICCES Report Page (`icces-report.html`)
**Folder**: `images/icces-report/` (if needed in the future)

Currently uses only common images (logos).

---

## Quick Reference: Naming Patterns

| Image Type | Naming Pattern | Example |
|------------|---------------|---------|
| Product category (home page) | `[product-name].png` | `studs.png` |
| Product image | `[product-type]-[product-name].png` | `smart-studs.png` |
| Punchout options | `[product-type]-[product-name]-punchout-options.png` | `smart-studs-punchout-options.png` |
| Diagram | `[product-name]-diagram.png` | `stud-diagram.png` |
| EQ products | `eq-[product-type]-[product-name].png` | `eq-smart-tracks.png` |
| Door designs | `[Product Name].png` (capital letters) | `Royal Flow.png` |
| Railing designs | `[design-name].png` (lowercase, hyphens) | `urban-classic.png` |

---

## Troubleshooting

### Image Not Displaying?

1. **Check filename**: Must match exactly (case-sensitive)
   - ✅ Correct: `smart-studs.png`
   - ❌ Wrong: `Smart-Studs.png`, `smart_studs.png`, `smartstuds.png`

2. **Check folder**: Image must be in the correct folder
   - ✅ Correct: `images/studs/smart-studs.png`
   - ❌ Wrong: `images/index/smart-studs.png`

3. **Check extension**: Must be `.png` (lowercase)
   - ✅ Correct: `smart-studs.png`
   - ❌ Wrong: `smart-studs.PNG`, `smart-studs.jpg`

4. **Clear browser cache**: Hard refresh with `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

5. **Check file exists**: Verify the file is actually in the folder

### Adding a Completely New Image Type

If you're adding a new image that doesn't match any existing pattern:

1. **Check the HTML file** to see what filename it's looking for
2. **Use that exact filename** (case-sensitive)
3. **Place it in the correct folder** based on which page uses it
4. **Update this README** with the new image name (move it from "Photos to be added:" to the main list, or add it to the appropriate section)

---

## File Format Requirements

- **Format**: PNG only (`.png` extension)
- **Case sensitivity**: Filenames are case-sensitive
- **Spaces**: Avoid spaces; use hyphens instead (except for door names)
- **Special characters**: Avoid special characters; use only letters, numbers, and hyphens

---

## Notes

- Logos in `common/` are used across all pages
- Door images use capital letters in their names (e.g., `Royal Flow.png`)
- Example images for doors are numbered sequentially (`example1.png`, `example2.png`, etc.)
- **Remember to update this README** when you add new images!
