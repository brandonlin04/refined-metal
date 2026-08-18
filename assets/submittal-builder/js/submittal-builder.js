(function initializeSubmittalBuilder() {
  'use strict';

  const root = document.getElementById('submittal-builder');
  const Core = window.SubmittalBuilderCore;
  if (!root || !Core) {
    return;
  }

  const CATEGORY_LABELS = {
    studs: 'Studs',
    tracks: 'Tracks',
    joists: 'Joists',
    eq_framing: 'EQ Framing',
    decking: 'Decking',
  };
  const FILTER_LABELS = {
    type: 'Type',
    web_depth: 'Depth',
    flange: 'Flange',
    mil: 'Mil / Thickness',
    deck_type: 'Deck Type',
    grade: 'Grade',
    gauge: 'Gauge',
    coating: 'Coating',
  };
  const state = {
    catalog: null,
    products: [],
    productMap: new Map(),
    selected: [],
    category: 'studs',
    search: '',
    filters: {},
    filtered: [],
    loading: true,
    building: false,
    draggedId: null,
    downloadUrl: null,
    downloadReleaseTimer: null,
  };

  const searchInput = root.querySelector('#sb-search');
  const filtersNode = root.querySelector('#sb-filters');
  const productPicker = root.querySelector('#sb-product-picker');
  const productSelect = root.querySelector('#sb-product-select');
  const addButton = root.querySelector('#sb-add');
  const resultsNote = root.querySelector('#sb-results-note');
  const groupsNode = root.querySelector('#sb-groups');
  const totalNode = root.querySelector('#sb-total');
  const buildButton = root.querySelector('#sb-build');
  const downloadLink = root.querySelector('#sb-download');
  const retryButton = root.querySelector('#sb-retry');
  const statusNode = root.querySelector('#sb-status');

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function refreshIcons() {
    if (window.feather) {
      window.feather.replace({ width: 16, height: 16 });
    }
  }

  function setStatus(message, kind = 'info') {
    statusNode.textContent = message;
    statusNode.dataset.kind = kind;
  }

  function renderTabs() {
    root.querySelectorAll('.sb-tab').forEach((button) => {
      const selected = button.dataset.category === state.category;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }

  function renderFilters() {
    const options = Core.getFilterOptions(state.products, state.category, state.filters);
    filtersNode.innerHTML = '';
    for (const [key, values] of Object.entries(options)) {
      const row = document.createElement('div');
      row.className = 'sb-filter-row';
      const label = document.createElement('label');
      label.className = 'sb-filter-label';
      label.htmlFor = `sb-filter-${key}`;
      label.textContent = FILTER_LABELS[key] || key;
      const select = document.createElement('select');
      select.id = `sb-filter-${key}`;
      select.dataset.filter = key;
      const any = document.createElement('option');
      any.value = '';
      any.textContent = `All ${FILTER_LABELS[key] || key}`;
      select.append(any);
      for (const value of values) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = key === 'grade' ? `Grade ${value}` : value;
        select.append(option);
      }
      select.value = state.filters[key] || '';
      row.append(label, select);
      filtersNode.append(row);
    }
  }

  function renderProducts() {
    state.filtered = Core.filterProducts(state.products, {
      category: state.category,
      search: state.search,
      filters: state.filters,
    });
    const previousValue = productSelect.value;
    productSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.filtered.length ? 'Select a matching product' : 'No matching products';
    productSelect.append(placeholder);
    for (const product of state.filtered) {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.id} — ${product.designation}`;
      productSelect.append(option);
    }
    const showPicker = state.filtered.length > 1 && state.filtered.length <= 12;
    if (state.filtered.length === 1) {
      productSelect.value = state.filtered[0].id;
    } else if (showPicker && state.filtered.some((product) => product.id === previousValue)) {
      productSelect.value = previousValue;
    }
    productPicker.hidden = !showPicker;
    productSelect.disabled = state.loading || state.filtered.length === 0 || (!showPicker && state.filtered.length !== 1);
    if (state.filtered.length === 1) {
      resultsNote.textContent = `Ready to add ${state.filtered[0].id}`;
    } else if (showPicker) {
      resultsNote.textContent = `${state.filtered.length} matching products — choose one`;
    } else {
      resultsNote.textContent = state.filtered.length ? `${state.filtered.length} matching products — refine filters or search` : 'No matching products';
    }
    addButton.disabled = !productSelect.value || state.loading;
  }

  function groupRows(category) {
    return state.selected.filter((item) => {
      const product = state.productMap.get(item.productId);
      return product && Core.getUiCategory(product) === category;
    });
  }

  function renderSelected() {
    groupsNode.innerHTML = Core.CATEGORY_ORDER.map((category) => {
      const items = groupRows(category);
      const rows = items.map((item, index) => {
        const product = state.productMap.get(item.productId);
        const canMoveUp = index > 0;
        const canMoveDown = index < items.length - 1;
        const pdfHref = `assets/submittal-builder/${product.pdf_url}`;
        return `
          <tr draggable="true" data-product-id="${escapeHtml(product.id)}">
            <td><strong>${escapeHtml(product.id)}</strong></td>
            <td>${escapeHtml(product.designation)}</td>
            <td>${escapeHtml(product.coating || '—')}</td>
            <td><label class="sr-only" for="qty-${escapeHtml(product.id)}">Quantity for ${escapeHtml(product.id)}</label><input id="qty-${escapeHtml(product.id)}" type="number" min="1" step="1" value="${item.quantity}" data-quantity="${escapeHtml(product.id)}"></td>
            <td>
              <div class="sb-row-actions">
                <a class="sb-icon-button" href="${escapeHtml(pdfHref)}" download title="Download product PDF" aria-label="Download ${escapeHtml(product.id)} PDF"><i data-feather="download"></i></a>
                <button class="sb-icon-button" type="button" data-action="up" data-id="${escapeHtml(product.id)}" title="Move up" aria-label="Move ${escapeHtml(product.id)} up" ${canMoveUp ? '' : 'disabled'}><i data-feather="arrow-up"></i></button>
                <button class="sb-icon-button" type="button" data-action="down" data-id="${escapeHtml(product.id)}" title="Move down" aria-label="Move ${escapeHtml(product.id)} down" ${canMoveDown ? '' : 'disabled'}><i data-feather="arrow-down"></i></button>
                <button class="sb-icon-button" type="button" data-action="remove" data-id="${escapeHtml(product.id)}" title="Remove" aria-label="Remove ${escapeHtml(product.id)}"><i data-feather="trash-2"></i></button>
              </div>
            </td>
          </tr>`;
      }).join('');
      const content = items.length
        ? `<div class="sb-table-wrap"><table class="sb-table"><thead><tr><th>Product ID</th><th>Designation</th><th>Coating</th><th>Qty</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<div class="sb-empty-row">No ${escapeHtml(CATEGORY_LABELS[category])} selected.</div>`;
      return `<details class="sb-group" data-group="${category}" ${items.length ? 'open' : ''}><summary>${escapeHtml(CATEGORY_LABELS[category])} (${items.length})</summary>${content}</details>`;
    }).join('');

    totalNode.textContent = `Total Products: ${state.selected.length}`;
    buildButton.disabled = state.selected.length === 0 || state.building || state.loading;
    refreshIcons();
  }

  function renderAll() {
    renderTabs();
    renderFilters();
    renderProducts();
    renderSelected();
  }

  async function loadCatalog() {
    state.loading = true;
    retryButton.hidden = true;
    setStatus('Loading the Refined Metal product catalog…');
    try {
      const response = await fetch('assets/submittal-builder/data/catalog.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Catalog request returned HTTP ${response.status}`);
      }
      const catalog = await response.json();
      if (!Array.isArray(catalog.products) || catalog.products.length !== 444) {
        throw new Error(`Expected 444 catalog products, received ${catalog.products?.length ?? 0}`);
      }
      state.catalog = catalog;
      state.products = catalog.products;
      state.productMap = new Map(catalog.products.map((product) => [product.id, product]));
      state.loading = false;
      setStatus('Catalog ready. Select products to build a package.', 'success');
      renderAll();
    } catch (error) {
      state.loading = false;
      setStatus(`Unable to load the product catalog: ${error.message}`, 'error');
      retryButton.hidden = false;
      buildButton.disabled = true;
      addButton.disabled = true;
    }
  }

  function assetUrl(relativePath) {
    return new URL(`assets/submittal-builder/${relativePath}`, document.baseURI).href;
  }

  function releaseDownload() {
    if (state.downloadReleaseTimer) {
      window.clearTimeout(state.downloadReleaseTimer);
      state.downloadReleaseTimer = null;
    }
    if (state.downloadUrl) {
      URL.revokeObjectURL(state.downloadUrl);
      state.downloadUrl = null;
    }
    downloadLink.hidden = true;
    downloadLink.removeAttribute('href');
  }

  async function fetchPdf(label, relativePath) {
    const response = await fetch(assetUrl(relativePath), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${label}: PDF request returned HTTP ${response.status}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 5 || new TextDecoder('ascii').decode(bytes.slice(0, 4)) !== '%PDF') {
      throw new Error(`${label}: the downloaded file is not a valid PDF`);
    }
    return bytes;
  }

  function pdfSafe(value) {
    return String(value ?? '').replace(/[^\x20-\x7E]/g, '?');
  }

  function drawField(page, label, value, x, y, width, regular, bold, rgb) {
    page.drawText(label, { x, y, size: 8, font: bold, color: rgb(0.35, 0.4, 0.46) });
    const text = pdfSafe(value).trim();
    if (text) {
      page.drawText(text.slice(0, 70), { x, y: y - 19, size: 12, font: regular, color: rgb(0.08, 0.13, 0.19) });
    } else {
      page.drawLine({ start: { x, y: y - 19 }, end: { x: x + width, y: y - 19 }, thickness: 0.75, color: rgb(0.55, 0.59, 0.64) });
    }
  }

  async function addCover(output, formValues) {
    const { StandardFonts, rgb } = window.PDFLib;
    const page = output.addPage([612, 792]);
    const regular = await output.embedFont(StandardFonts.Helvetica);
    const bold = await output.embedFont(StandardFonts.HelveticaBold);
    page.drawRectangle({ x: 0, y: 650, width: 612, height: 142, color: rgb(0.075, 0.15, 0.23) });
    page.drawRectangle({ x: 0, y: 642, width: 612, height: 8, color: rgb(0.89, 0.1, 0.1) });
    try {
      const logoResponse = await fetch('images/common/rm-logo.png');
      if (logoResponse.ok) {
        const logo = await output.embedPng(await logoResponse.arrayBuffer());
        const scale = Math.min(145 / logo.width, 58 / logo.height);
        page.drawImage(logo, { x: 42, y: 704, width: logo.width * scale, height: logo.height * scale });
      }
    } catch (_error) {
      page.drawText('REFINED METAL', { x: 42, y: 725, size: 17, font: bold, color: rgb(1, 1, 1) });
    }
    page.drawText('SUBMITTAL PACKAGE', { x: 42, y: 674, size: 25, font: bold, color: rgb(1, 1, 1) });
    page.drawText('Product data sheets and applicable ICC-ES reports', { x: 42, y: 657, size: 9, font: regular, color: rgb(0.84, 0.88, 0.92) });

    page.drawText('PROJECT INFORMATION', { x: 42, y: 593, size: 12, font: bold, color: rgb(0.08, 0.15, 0.23) });
    page.drawRectangle({ x: 42, y: 584, width: 528, height: 2, color: rgb(0.89, 0.1, 0.1) });
    drawField(page, 'PROJECT NAME', formValues.project, 42, 548, 528, regular, bold, rgb);
    drawField(page, 'CONTRACTOR', formValues.contractor, 42, 478, 250, regular, bold, rgb);
    drawField(page, 'PREPARED BY', formValues.preparedBy, 320, 478, 250, regular, bold, rgb);
    drawField(page, 'DATE', new Date().toLocaleDateString('en-US'), 42, 408, 250, regular, bold, rgb);
    drawField(page, 'TOTAL PRODUCTS', String(state.selected.length), 320, 408, 250, regular, bold, rgb);

    page.drawRectangle({ x: 42, y: 116, width: 528, height: 178, color: rgb(0.96, 0.97, 0.98), borderColor: rgb(0.83, 0.86, 0.89), borderWidth: 1 });
    page.drawText('PACKAGE CONTENTS', { x: 62, y: 264, size: 10, font: bold, color: rgb(0.08, 0.15, 0.23) });
    page.drawText('1. Submittal Index', { x: 62, y: 236, size: 10, font: regular, color: rgb(0.2, 0.25, 0.31) });
    page.drawText('2. Selected Refined Metal product data sheets', { x: 62, y: 214, size: 10, font: regular, color: rgb(0.2, 0.25, 0.31) });
    page.drawText('3. Deduplicated applicable ICC-ES reports', { x: 62, y: 192, size: 10, font: regular, color: rgb(0.2, 0.25, 0.31) });
    page.drawText('Blank project fields are intentionally left available for completion after download.', { x: 62, y: 149, size: 8, font: regular, color: rgb(0.4, 0.45, 0.51) });
    page.drawText('REFINED METAL', { x: 42, y: 43, size: 8, font: bold, color: rgb(0.35, 0.4, 0.46) });
    page.drawText('Page 1', { x: 530, y: 43, size: 8, font: regular, color: rgb(0.35, 0.4, 0.46) });
  }

  async function addIndexPages(output, entries, indexPageCount) {
    const { StandardFonts, rgb } = window.PDFLib;
    const regular = await output.embedFont(StandardFonts.Helvetica);
    const bold = await output.embedFont(StandardFonts.HelveticaBold);
    const perPage = 24;
    for (let indexPage = 0; indexPage < indexPageCount; indexPage += 1) {
      const page = output.addPage([612, 792]);
      page.drawRectangle({ x: 0, y: 728, width: 612, height: 64, color: rgb(0.075, 0.15, 0.23) });
      page.drawText('SUBMITTAL INDEX', { x: 42, y: 752, size: 19, font: bold, color: rgb(1, 1, 1) });
      page.drawText(`Index ${indexPage + 1} of ${indexPageCount}`, { x: 500, y: 754, size: 8, font: regular, color: rgb(0.84, 0.88, 0.92) });
      const tableTop = 700;
      page.drawRectangle({ x: 42, y: tableTop - 24, width: 528, height: 24, color: rgb(0.03, 0.32, 0.46) });
      const headers = [['PRODUCT ID', 50], ['DESIGNATION', 160], ['QTY', 475], ['PAGE', 520]];
      for (const [label, x] of headers) {
        page.drawText(label, { x, y: tableTop - 16, size: 7, font: bold, color: rgb(1, 1, 1) });
      }
      const pageEntries = entries.slice(indexPage * perPage, (indexPage + 1) * perPage);
      pageEntries.forEach((entry, rowIndex) => {
        const product = state.productMap.get(entry.productId);
        const y = tableTop - 48 - rowIndex * 24;
        if (rowIndex % 2 === 0) {
          page.drawRectangle({ x: 42, y: y - 6, width: 528, height: 24, color: rgb(0.96, 0.97, 0.98) });
        }
        page.drawText(pdfSafe(product.id).slice(0, 23), { x: 50, y, size: 7, font: bold, color: rgb(0.08, 0.13, 0.19) });
        page.drawText(pdfSafe(product.designation).slice(0, 70), { x: 160, y, size: 6.5, font: regular, color: rgb(0.15, 0.2, 0.26) });
        page.drawText(String(entry.quantity), { x: 482, y, size: 7, font: regular, color: rgb(0.15, 0.2, 0.26) });
        page.drawText(String(entry.startPage), { x: 532, y, size: 7, font: bold, color: rgb(0.15, 0.2, 0.26) });
      });
      page.drawText(`Page ${indexPage + 2}`, { x: 530, y: 43, size: 8, font: regular, color: rgb(0.35, 0.4, 0.46) });
    }
  }

  async function buildPackage() {
    if (!state.selected.length || state.building) {
      return;
    }
    if (!window.PDFLib) {
      setStatus('PDF library did not load. Refresh the page and try again.', 'error');
      return;
    }
    state.building = true;
    releaseDownload();
    buildButton.disabled = true;
    buildButton.innerHTML = '<i data-feather="loader"></i> Building…';
    refreshIcons();
    try {
      const ordered = Core.groupSelections(state.selected, state.productMap);
      const loadedProducts = [];
      const pageCounts = new Map();
      for (let index = 0; index < ordered.length; index += 1) {
        const item = ordered[index];
        const product = state.productMap.get(item.productId);
        setStatus(`Loading product ${index + 1} of ${ordered.length}: ${product.id}`);
        const bytes = await fetchPdf(product.id, product.pdf_url);
        const document = await window.PDFLib.PDFDocument.load(bytes);
        pageCounts.set(product.id, document.getPageCount());
        loadedProducts.push({ item, product, document });
      }

      const esrIds = Core.getEsrIds(ordered, state.productMap);
      const loadedReports = [];
      for (const esrId of esrIds) {
        const report = state.catalog.esrReports[esrId];
        if (!report) {
          throw new Error(`${esrId}: report metadata is missing`);
        }
        setStatus(`Loading ${esrId}…`);
        const bytes = await fetchPdf(esrId, report.file);
        loadedReports.push({ id: esrId, document: await window.PDFLib.PDFDocument.load(bytes) });
      }

      const indexPageCount = Math.max(1, Math.ceil(ordered.length / 24));
      const indexEntries = Core.calculateIndex(ordered, state.productMap, pageCounts, 1, indexPageCount);
      const output = await window.PDFLib.PDFDocument.create();
      await addCover(output, {
        project: root.querySelector('#sb-project-name').value,
        contractor: root.querySelector('#sb-contractor').value,
        preparedBy: root.querySelector('#sb-prepared-by').value,
      });
      await addIndexPages(output, indexEntries, indexPageCount);

      for (let index = 0; index < loadedProducts.length; index += 1) {
        const { product, document } = loadedProducts[index];
        setStatus(`Merging product ${index + 1} of ${loadedProducts.length}: ${product.id}`);
        const pages = await output.copyPages(document, document.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      for (const report of loadedReports) {
        setStatus(`Appending ${report.id}…`);
        const pages = await output.copyPages(report.document, report.document.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }

      const bytes = await output.save({ useObjectStreams: true });
      const magic = new TextDecoder('ascii').decode(bytes.slice(0, 4));
      if (magic !== '%PDF') {
        throw new Error('The merged output did not produce a valid PDF file header');
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      state.downloadUrl = URL.createObjectURL(blob);
      downloadLink.href = state.downloadUrl;
      downloadLink.download = Core.makeFilename(root.querySelector('#sb-project-name').value);
      downloadLink.hidden = false;
      const megabytes = (bytes.length / 1024 / 1024).toFixed(1);
      setStatus(`Package ready: ${loadedProducts.length} products, ${loadedReports.length} ESR report${loadedReports.length === 1 ? '' : 's'}, ${output.getPageCount()} pages, ${megabytes} MB. Click Download Package.`, 'success');
    } catch (error) {
      setStatus(`Package not created: ${error.message}`, 'error');
    } finally {
      state.building = false;
      buildButton.innerHTML = '<i data-feather="file-text"></i> Build Combined PDF';
      buildButton.disabled = state.selected.length === 0;
      refreshIcons();
    }
  }

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('.sb-tab');
    if (tab) {
      state.category = tab.dataset.category;
      state.filters = {};
      renderTabs();
      renderFilters();
      renderProducts();
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) {
      const productId = action.dataset.id;
      if (action.dataset.action === 'remove') {
        state.selected = Core.removeSelection(state.selected, productId);
      } else {
        state.selected = Core.reorderWithinCategory(state.selected, state.productMap, productId, action.dataset.action === 'up' ? -1 : 1);
      }
      renderSelected();
    }
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-filter]')) {
      state.filters[event.target.dataset.filter] = event.target.value;
      renderFilters();
      renderProducts();
    } else if (event.target === productSelect) {
      addButton.disabled = !event.target.value;
    } else if (event.target.matches('[data-quantity]')) {
      state.selected = Core.setQuantity(state.selected, event.target.dataset.quantity, event.target.value);
      renderSelected();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-quantity]')) {
      state.selected = Core.setQuantity(state.selected, event.target.dataset.quantity, event.target.value);
    }
  });

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value;
    renderProducts();
  });
  addButton.addEventListener('click', () => {
    if (!productSelect.value) {
      return;
    }
    state.selected = Core.addSelection(state.selected, productSelect.value);
    renderSelected();
    setStatus(`${productSelect.value} added to the package.`, 'success');
  });
  buildButton.addEventListener('click', buildPackage);
  downloadLink.addEventListener('click', () => {
    setStatus('Package download started.', 'success');
    state.downloadReleaseTimer = window.setTimeout(releaseDownload, 10000);
  });
  retryButton.addEventListener('click', loadCatalog);

  groupsNode.addEventListener('dragstart', (event) => {
    const row = event.target.closest('[data-product-id]');
    if (!row) {
      return;
    }
    state.draggedId = row.dataset.productId;
    row.classList.add('sb-row-dragging');
    event.dataTransfer.effectAllowed = 'move';
  });
  groupsNode.addEventListener('dragover', (event) => {
    if (event.target.closest('[data-product-id]')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  });
  groupsNode.addEventListener('drop', (event) => {
    const targetRow = event.target.closest('[data-product-id]');
    const sourceProduct = state.productMap.get(state.draggedId);
    const targetProduct = state.productMap.get(targetRow?.dataset.productId);
    if (!sourceProduct || !targetProduct || Core.getUiCategory(sourceProduct) !== Core.getUiCategory(targetProduct)) {
      return;
    }
    event.preventDefault();
    const sourceIndex = state.selected.findIndex((item) => item.productId === sourceProduct.id);
    const targetIndex = state.selected.findIndex((item) => item.productId === targetProduct.id);
    if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
      const next = state.selected.slice();
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      state.selected = next;
      renderSelected();
    }
  });
  groupsNode.addEventListener('dragend', () => {
    state.draggedId = null;
    groupsNode.querySelectorAll('.sb-row-dragging').forEach((row) => row.classList.remove('sb-row-dragging'));
  });

  window.__refinedMetalSubmittalBuilder = {
    getState: () => ({ ...state, productMap: undefined }),
    buildPackage,
  };
  window.addEventListener('pagehide', releaseDownload, { once: true });
  loadCatalog();
})();
