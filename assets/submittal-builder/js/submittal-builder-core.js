(function attachSubmittalBuilderCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SubmittalBuilderCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSubmittalBuilderCore() {
  'use strict';

  const CATEGORY_ORDER = ['studs', 'tracks', 'joists', 'eq_framing', 'decking'];
  const FILTER_KEYS = {
    studs: ['type', 'web_depth', 'flange', 'mil', 'coating'],
    tracks: ['type', 'web_depth', 'flange', 'mil', 'coating'],
    joists: ['type', 'web_depth', 'flange', 'mil', 'coating'],
    eq_framing: ['type', 'web_depth', 'flange', 'mil', 'coating'],
    decking: ['deck_type', 'web_depth', 'grade', 'gauge', 'coating'],
  };

  function getUiCategory(product) {
    if (product.category !== 'studs_tracks') {
      return product.category;
    }
    const member = `${product.type || ''} ${product.designation || ''}`.toLowerCase();
    return member.includes('track') ? 'tracks' : 'studs';
  }

  function compareValues(left, right) {
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
  }

  function filterProducts(products, state) {
    const category = state.category || CATEGORY_ORDER[0];
    const search = String(state.search || '').trim().toLowerCase();
    const filters = state.filters || {};
    return products.filter((product) => {
      if (getUiCategory(product) !== category) {
        return false;
      }
      if (search) {
        const haystack = `${product.id || ''} ${product.designation || ''} ${product.family || ''}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return Object.entries(filters).every(([key, value]) => !value || String(product[key] || '') === String(value));
    });
  }

  function getFilterOptions(products, category, activeFilters = {}) {
    const options = {};
    for (const key of FILTER_KEYS[category] || []) {
      const otherFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([filterKey, value]) => filterKey !== key && value),
      );
      const matchingProducts = filterProducts(products, { category, filters: otherFilters });
      options[key] = [...new Set(matchingProducts.map((product) => product[key]).filter(Boolean))].sort(compareValues);
    }
    return options;
  }

  function addSelection(selected, productId) {
    if (selected.some((item) => item.productId === productId)) {
      return selected.slice();
    }
    return [...selected, { productId, quantity: 1 }];
  }

  function normalizeQuantity(value) {
    const quantity = Math.floor(Number(value));
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  }

  function setQuantity(selected, productId, value) {
    const quantity = normalizeQuantity(value);
    return selected.map((item) => (item.productId === productId ? { ...item, quantity } : item));
  }

  function removeSelection(selected, productId) {
    return selected.filter((item) => item.productId !== productId);
  }

  function reorderWithinCategory(selected, productMap, productId, direction) {
    const next = selected.slice();
    const currentIndex = next.findIndex((item) => item.productId === productId);
    if (currentIndex < 0) {
      return next;
    }
    const product = productMap.get(productId);
    if (!product) {
      return next;
    }
    const category = getUiCategory(product);
    const matchingIndexes = next
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const candidate = productMap.get(item.productId);
        return candidate && getUiCategory(candidate) === category;
      })
      .map(({ index }) => index);
    const groupIndex = matchingIndexes.indexOf(currentIndex);
    const targetGroupIndex = groupIndex + Math.sign(direction);
    if (groupIndex < 0 || targetGroupIndex < 0 || targetGroupIndex >= matchingIndexes.length) {
      return next;
    }
    const targetIndex = matchingIndexes[targetGroupIndex];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    return next;
  }

  function groupSelections(selected, productMap) {
    return selected
      .map((item, index) => ({ item, index, product: productMap.get(item.productId) }))
      .filter(({ product }) => Boolean(product))
      .sort((left, right) => {
        const categoryDifference = CATEGORY_ORDER.indexOf(getUiCategory(left.product)) - CATEGORY_ORDER.indexOf(getUiCategory(right.product));
        return categoryDifference || left.index - right.index;
      })
      .map(({ item }) => item);
  }

  function calculateIndex(selected, productMap, pageCounts, coverPages = 1, indexPages = 1) {
    let startPage = coverPages + indexPages + 1;
    return groupSelections(selected, productMap).map((item) => {
      const pageCount = pageCounts.get(item.productId);
      if (!Number.isInteger(pageCount) || pageCount < 1) {
        throw new Error(`Missing PDF page count for ${item.productId}`);
      }
      const entry = { ...item, startPage, pageCount };
      startPage += pageCount;
      return entry;
    });
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function makeFilename(projectName, date = new Date()) {
    const cleaned = String(projectName || '')
      .normalize('NFKC')
      .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
      .replace(/[^\p{L}\p{N}._-]+/gu, '-')
      .replace(/[-_.]{2,}/g, '-')
      .replace(/^[-_.]+|[-_.]+$/g, '')
      .slice(0, 80);
    return cleaned ? `${cleaned}-Submittal.pdf` : `Refined-Metal-Submittal-${formatDate(date)}.pdf`;
  }

  return {
    CATEGORY_ORDER,
    FILTER_KEYS,
    getUiCategory,
    filterProducts,
    getFilterOptions,
    addSelection,
    setQuantity,
    removeSelection,
    reorderWithinCategory,
    groupSelections,
    calculateIndex,
    makeFilename,
  };
});
