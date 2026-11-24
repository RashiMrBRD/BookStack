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
</style>
<!-- End: IoTLab theme -->
