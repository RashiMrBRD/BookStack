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

    /* Brand logo: the IoTLab wordmark is dark-on-transparent, so it sits on a
       light pill to stay readable against the maroon header (and in dark mode). */
    header .logo {
        background-color: #fff;
        border-radius: 10px;
        padding: 6px 18px;
        margin-inline-start: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
    }
    header .logo:hover {
        text-decoration: none;
    }
    header .logo .logo-image {
        height: 40px;
        width: auto;
        display: block;
    }
    header .logo .logo-text {
        color: #800000;
        font-weight: 700;
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
