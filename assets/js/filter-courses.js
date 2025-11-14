// Client-side course filtering by category checkboxes.
//
// How it works:
// - Each checkbox has class "category-checkbox" and a data-filter attribute
//   (normalized text to match against the visible category label inside each course card).
// - Each course card has a visible element .courses-img .category (existing in your markup).
// - When checkboxes change the script shows only the cards whose category text includes
//   any of the selected filters. If no filters are selected, all cards are shown.
//
// Place this file at assets/js/filter-courses.js and include it before index.js in the HTML.

document.addEventListener('DOMContentLoaded', function () {
  const checkboxes = Array.from(document.querySelectorAll('.category-checkbox'));
  const courseCards = Array.from(document.querySelectorAll('.courses-cards-content'));

  // Helper: normalize strings for comparison
  const normalize = str => (str || '').toString().trim().toLowerCase();

  function filterCourses() {
    // collect checked filters (normalized)
    const checkedFilters = checkboxes
      .filter(cb => cb.checked)
      .map(cb => normalize(cb.getAttribute('data-filter')));

    // If none selected, show all
    if (checkedFilters.length === 0) {
      courseCards.forEach(card => {
        const wrapperCol = card.closest('[class*="col-"]');
        if (wrapperCol) wrapperCol.style.display = '';
        else card.style.display = '';
      });
      return;
    }

    // For each course card check its category label(s)
    courseCards.forEach(card => {
      const catEl = card.querySelector('.courses-img .category');
      const cardCategory = normalize(catEl ? catEl.textContent : '');

      // include card if any checked filter matches the cardCategory substring
      const matches = checkedFilters.some(filter => {
        // If filter includes '&' or '/', it might be written slightly differently, so
        // we check by inclusion. You can customize to exact match if needed.
        return cardCategory.includes(filter) || filter.includes(cardCategory);
      });

      const wrapperCol = card.closest('[class*="col-"]');
      if (wrapperCol) wrapperCol.style.display = matches ? '' : 'none';
      else card.style.display = matches ? '' : 'none';
    });
  }

  // attach listeners
  checkboxes.forEach(cb => cb.addEventListener('change', filterCourses));

  // optional: if you want live-search to interact with checkboxes, add hook here
  // e.g. document.querySelector('.courses-search-option form').addEventListener('submit', ...)

  // run once at start (in case page loads with some checked)
  filterCourses();
});