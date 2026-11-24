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
</style>
<!-- End: IoTLab theme -->
