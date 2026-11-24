@inject('headContent', 'BookStack\Theming\CustomHtmlHeadContentProvider')

@if(!request()->routeIs('settings.category'))
<!-- Start: custom user content -->
{!! $headContent->forWeb() !!}
<!-- End: custom user content -->
@endif

<!-- Start: IoTLab theme (themes/iotlab) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
    :root {
        --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, sans-serif;
        --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, sans-serif;
    }

    /* Brand logo: transparent tile, part of the header itself. The dark
       wordmark rides the light header; the light wordmark rides the
       dark-mode header. */
    header .logo .logo-image {
        height: 44px;
        width: auto;
        display: block;
    }
    header .logo .logo-variant-dark {
        display: none;
    }
    html.dark-mode header .logo .logo-variant-light {
        display: none;
    }
    html.dark-mode header .logo .logo-variant-dark {
        display: block;
    }
    header .logo .logo-text {
        color: #fff;
        font-weight: 700;
    }

    /* Light theme: light header surface so the dark wordmark sits directly
       on it; all header chrome flips to maroon. */
    html:not(.dark-mode) header {
        background-color: #fafaf5 !important;
        color: #333;
        border-bottom-color: rgba(128, 0, 0, 0.18);
    }
    html:not(.dark-mode) header .links a,
    html:not(.dark-mode) header .user-name,
    html:not(.dark-mode) header .mobile-menu-toggle {
        color: #800000;
        fill: #800000;
    }
    html:not(.dark-mode) header .links a:hover,
    html:not(.dark-mode) header .user-name:hover {
        background-color: rgba(128, 0, 0, 0.08);
    }
    html:not(.dark-mode) header .mobile-menu-toggle {
        border-color: rgba(128, 0, 0, 0.45);
    }
    html:not(.dark-mode) header .search-box input {
        background-color: #fff;
        border-color: rgba(0, 0, 0, 0.18);
        color: #333;
    }
    html:not(.dark-mode) header .search-box input::placeholder {
        color: #666;
        opacity: 0.85;
    }
    html:not(.dark-mode) header #header-search-box-button {
        color: #800000;
    }
    html:not(.dark-mode) header * {
        outline-color: #800000;
    }

    /* Dark theme: pure black header (the dark brand color #b33939 reads as
       washed-out red here); header chrome stays light for contrast. */
    html.dark-mode header {
        background-color: #000 !important;
        color: #eee;
        border-bottom-color: rgba(255, 255, 255, 0.15);
    }
    html.dark-mode header .search-box input {
        background-color: #151515;
        border-color: rgba(255, 255, 255, 0.25);
        color: #eee;
    }
    html.dark-mode header .search-box input::placeholder {
        color: #999;
        opacity: 1;
    }

    /* Sidebar nav legibility in dark mode: item text is dim grey by default —
       raise it to near-white and keep the selected page clearly marked. */
    html.dark-mode .tri-layout-left .entity-list-item {
        color: #f0f0f0;
    }
    html.dark-mode .tri-layout-left .entity-list-item .entity-list-item-name {
        color: inherit;
    }
    html.dark-mode .tri-layout-left .entity-list-item.selected {
        background-color: rgba(255, 255, 255, 0.14);
    }
    html.dark-mode .tri-layout-left .entity-list-item .icon {
        opacity: 1;
    }
    html.dark-mode .tri-layout-left .chapter-expansion,
    html.dark-mode .tri-layout-left .chapter-contents-toggle {
        color: #d0d0d0;
    }
    html.dark-mode .tri-layout-left .sidebar-page-list {
        color: #f0f0f0;
    }

    /* Search sits next to the logo: logo and search get max-content columns,
       the nav keeps the remaining 1fr and stays right-aligned. */
    @media (min-width: 1001px) {
        header.grid {
            grid-template-columns: max-content max-content 1fr;
        }
        header > .flex-container-column {
            align-items: flex-start;
            padding-inline-start: 24px;
        }
    }

    /* Breadcrumbs: BookStack drops the labels below 1000px and renders at 70%
       opacity — keep names visible and readable at every viewport width. */
    .breadcrumbs {
        opacity: 1;
    }
    @media (max-width: 1000px) {
        .breadcrumbs .icon-list-item > span + span {
            display: inline;
        }
    }

    /* Prev/Next pager: portfolio-style one-direction flow. Two card links —
       previous on the left, next pushed right. */
    .iotlab-pager {
        display: flex;
        gap: 16px;
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid rgba(128, 128, 128, 0.25);
    }
    .iotlab-pager-link {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 16px;
        border: 1px solid rgba(128, 128, 128, 0.3);
        border-radius: 8px;
        text-decoration: none;
        transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .iotlab-pager-link:hover {
        border-color: var(--color-primary);
        background-color: rgba(128, 128, 128, 0.08);
        text-decoration: none;
    }
    .iotlab-pager-link.next {
        margin-left: auto;
        text-align: right;
    }
    .iotlab-pager-dir {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: inherit;
        opacity: 0.6;
    }
    .iotlab-pager-title {
        font-weight: 600;
        color: var(--color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    @media (max-width: 640px) {
        .iotlab-pager {
            flex-direction: column;
        }
        .iotlab-pager-link.next {
            text-align: left;
        }
    }
</style>

@if(user()->isGuest())
<style>
    /* Guest = reader: Medium-style article layout.
       Left rail shows only the in-page TOC (like Medium's left action rail),
       the article column takes the full width between the rails, and the
       right rail keeps Details + Actions. Panels stay in the DOM — the
       prev/next pager and in-page JS read the hidden book tree. */
    .tri-layout-left-contents > *:not(#page-navigation) {
        display: none !important;
    }
    .breadcrumbs {
        display: none;
    }
    .tri-layout-mobile-tabs {
        display: none;
    }

    /* Header blends into the page — same surface as the body, no border or
       shadow separating chrome from content. */
    html:not(.dark-mode) header,
    html.dark-mode header {
        background-color: transparent !important;
        box-shadow: none !important;
        border-bottom: none !important;
    }

    /* Card chrome off — the article sits directly on the page surface. */
    main.content-wrap.card,
    .content-wrap.card {
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
    }

    /* Article measure: Medium-scale body text. */
    .page-content {
        font-size: 1.08rem;
        line-height: 1.7;
    }

    @media (min-width: 1000px) {
        /* In-page TOC styled as a slim rail — quiet links, thin border.
           Grid columns are left to BookStack's own breakpoints: at >=1400px
           it is a real side column; at 1000-1400px the side panels stack
           natively in the left column (TOC, then Details/Actions below). */
        .tri-layout-left #page-navigation {
            border-left: 1px solid rgba(128, 128, 128, 0.25);
            padding-left: 14px;
            position: sticky;
            top: 20px;
        }
        .tri-layout-left #page-navigation .sidebar-page-nav a {
            font-size: 0.82rem;
        }
    }
    @media (max-width: 999px) {
        /* Single column: the side panels' contents are already off-canvas
           in this range — hide the empty wrappers and center the article. */
        .tri-layout-sides {
            display: none !important;
        }
        .tri-layout-middle {
            width: 100%;
            max-width: 860px;
            margin-inline: auto;
        }
    }
</style>
@endif
<script>
    // Prev/Next pager — the docs are one book read in order, so each page
    // gets a footer link to the previous/next page in the book tree.
    document.addEventListener('DOMContentLoaded', () => {
        const pageContent = document.querySelector('.page-content');
        const pageLinks = [...document.querySelectorAll(
            '.sidebar-page-list a.entity-list-item[data-entity-type="page"]'
        )];
        if (!pageContent || pageLinks.length < 2) return;

        let idx = pageLinks.findIndex((a) => a.classList.contains('selected'));
        if (idx === -1) idx = pageLinks.findIndex((a) => a.pathname === location.pathname);
        if (idx === -1) return;

        const link = (cls, dir, a) => {
            const el = document.createElement('a');
            el.className = 'iotlab-pager-link ' + cls;
            el.href = a.href;
            const title = a.querySelector('.entity-list-item-name')?.textContent?.trim() || a.textContent.trim();
            el.innerHTML =
                '<span class="iotlab-pager-dir">' + dir + '</span>' +
                '<span class="iotlab-pager-title"></span>';
            el.querySelector('.iotlab-pager-title').textContent = title;
            return el;
        };

        const nav = document.createElement('nav');
        nav.className = 'iotlab-pager';
        nav.setAttribute('aria-label', 'Page');
        if (idx > 0) nav.appendChild(link('prev', '← Previous', pageLinks[idx - 1]));
        if (idx < pageLinks.length - 1) nav.appendChild(link('next', 'Next →', pageLinks[idx + 1]));
        if (nav.childElementCount) {
            pageContent.after(nav);
            // Replace the stock sibling nav: it hops to chapter index views
            // between sections instead of continuing into the next page.
            // Retarget its anchors so keyboard shortcuts follow the same
            // page-to-page path before hiding it.
            const stock = document.getElementById('sibling-navigation');
            if (stock) {
                const stockPrev = stock.querySelector('a[data-shortcut="previous"]');
                const stockNext = stock.querySelector('a[data-shortcut="next"]');
                if (stockPrev && idx > 0) stockPrev.href = pageLinks[idx - 1].href;
                if (stockNext && idx < pageLinks.length - 1) stockNext.href = pageLinks[idx + 1].href;
                stock.style.display = 'none';
            }
        }
    });
</script>
<!-- End: IoTLab theme -->
