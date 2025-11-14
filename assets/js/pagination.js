// assets/js/pagination.js
// Client-side pagination for the courses grid (no full-page refresh).
// - Shows `perPage` cards per page.
// - Works with existing .pagination-button ul if present (uses its links).
// - If links aren't present, it will build pagination UI.
// - Prevents default navigation, updates active state, and smoothly scrolls the grid into view.
//
// Install: save to assets/js/pagination.js and include before index.js:
// <script src="assets/js/pagination.js"></script>

document.addEventListener('DOMContentLoaded', function () {
  const perPage = 6;
  const gridPane = document.querySelector('#nav-all'); // the grid container tab-pane
  if (!gridPane) return;

  const row = gridPane.querySelector('.row');
  if (!row) return;

  // selector for the direct column wrappers containing cards; adjust if your markup differs
  const cardSelector = ':scope > .col-lg-6';
  let cardCols = Array.from(row.querySelectorAll(cardSelector));
  const totalCards = cardCols.length;
  if (totalCards === 0) return;

  const paginationUl = document.querySelector('.pagination-button ul');

  const pages = Math.max(1, Math.ceil(totalCards / perPage));

  // Helper: show page (1-based)
  function showPage(page) {
    const p = Math.min(Math.max(1, page), pages);
    const start = (p - 1) * perPage;
    const end = start + perPage;

    cardCols.forEach((col, idx) => {
      col.style.display = (idx >= start && idx < end) ? '' : 'none';
    });

    // Update active class on pagination links (if present)
    if (paginationUl) {
      // mark numeric page links active; preserve arrow links
      Array.from(paginationUl.querySelectorAll('a')).forEach(a => {
        const dp = a.dataset.page ? Number(a.dataset.page) : null;
        // if link is numeric page
        if (dp && dp >= 1 && dp <= pages) {
          if (dp === p) a.classList.add('active');
          else a.classList.remove('active');
        } else {
          // update arrow's target page dataset if present (right/next)
          if (a.classList.contains('next-page')) {
            a.dataset.page = String(Math.min(p + 1, pages));
          } else if (a.classList.contains('prev-page')) {
            a.dataset.page = String(Math.max(p - 1, 1));
          }
        }
      });
    }

    // After switching page, scroll the grid into view smoothly so user stays oriented:
    // (scroll just the grid area; change behavior/block if you prefer different alignment)
    gridPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Build pagination UI if none present or if user wants a new one.
  function buildPagination() {
    if (!paginationUl) return;

    // If paginationUl already contains numeric links, we will reuse them but ensure dataset.page exists.
    const existingLinks = Array.from(paginationUl.querySelectorAll('a'));
    if (existingLinks.length >= pages) {
      existingLinks.forEach(a => {
        // try to infer page number from text if dataset not set
        if (!a.dataset.page) {
          const txt = (a.textContent || '').trim();
          const n = parseInt(txt, 10);
          if (!Number.isNaN(n)) a.dataset.page = String(n);
        }
      });
      // ensure prev/next have classes if present by markup
      paginationUl.querySelectorAll('a').forEach(a => {
        if ((a.textContent || '').includes('→') || a.querySelector('.fa-arrow-right')) {
          a.classList.add('next-page');
        } else if ((a.textContent || '').includes('←') || a.querySelector('.fa-arrow-left')) {
          a.classList.add('prev-page');
        }
      });
      return;
    }

    // Clear and create proper pagination (keeps simple structure)
    paginationUl.innerHTML = '';
    // previous
    const liPrev = document.createElement('li');
    const aPrev = document.createElement('a');
    aPrev.href = '#';
    aPrev.className = 'prev-page';
    aPrev.dataset.page = '1';
    aPrev.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    liPrev.appendChild(aPrev);
    paginationUl.appendChild(liPrev);

    for (let i = 1; i <= pages; i++) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.page = String(i);
      a.textContent = i.toString().padStart(2, '0');
      if (i === 1) a.classList.add('active');
      li.appendChild(a);
      paginationUl.appendChild(li);
    }

    // next
    const liNext = document.createElement('li');
    const aNext = document.createElement('a');
    aNext.href = '#';
    aNext.className = 'next-page';
    aNext.dataset.page = '2';
    aNext.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
    liNext.appendChild(aNext);
    paginationUl.appendChild(liNext);
  }

  // Universal click handler (delegation) for pagination links
  function onPaginationClick(e) {
    const a = e.target.closest('a');
    if (!a || !paginationUl.contains(a)) return;
    // Prevent full navigation
    e.preventDefault();

    // Determine page to show: prefer data-page, fallback to numeric content
    let targetPage = null;
    if (a.dataset && a.dataset.page) {
      targetPage = Number(a.dataset.page);
    } else {
      const txt = (a.textContent || '').trim();
      const n = parseInt(txt, 10);
      if (!Number.isNaN(n)) targetPage = n;
    }

    if (!targetPage) return;
    showPage(targetPage);
  }

  // Initialize
  buildPagination();

  // hide all initially then show first page
  cardCols.forEach(col => col.style.display = 'none');
  showPage(1);

  // attach delegated listener
  if (paginationUl) {
    paginationUl.addEventListener('click', onPaginationClick);
    // ensure that keyboard activation also works (enter) by listening to keydown on anchors
    paginationUl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onPaginationClick(e);
    });
  }

  // expose refresh function if cards change dynamically (optional)
  window._coursesPaginationRefresh = function () {
    // recompute cards and pages; simple approach: reload page to rebuild cleanly
    // If you prefer a full reinit without reload, we can implement it.
    location.reload();
  };
});