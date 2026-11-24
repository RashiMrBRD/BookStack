<a href="{{ url('/') }}" data-shortcut="home_view" class="logo">
    @if(setting('app-logo', '') !== 'none')
        <img class="logo-image logo-variant-light"
             src="{{ setting('app-logo', '') === '' ? url('/logo.png') : url(setting('app-logo', '')) }}"
             alt="{{ setting('app-name-header') ? '' : setting('app-name') }}">
        <img class="logo-image logo-variant-dark"
             src="{{ url('/logo-dark.png') }}?v={{ @filemtime(public_path('logo-dark.png')) ?: '1' }}"
             alt="" aria-hidden="true">
    @endif
    @if (setting('app-name-header'))
        <span class="logo-text">{{ setting('app-name') }}</span>
    @endif
</a>
