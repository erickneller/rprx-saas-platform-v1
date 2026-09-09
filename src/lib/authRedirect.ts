const FALLBACK_AUTH_DESTINATION = '/';

export function getSafeAuthDestination(value: string | null | undefined, fallback = FALLBACK_AUTH_DESTINATION) {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  return fallback;
}

export function getCurrentPathWithSearch() {
  if (typeof window === 'undefined') return FALLBACK_AUTH_DESTINATION;
  return `${window.location.pathname}${window.location.search}`;
}

export function getAuthPathForCurrentRoute() {
  return `/auth?next=${encodeURIComponent(getCurrentPathWithSearch())}`;
}

export function getAuthPageDestination(fallback = FALLBACK_AUTH_DESTINATION) {
  if (typeof window === 'undefined') return fallback;
  const params = new URLSearchParams(window.location.search);
  return getSafeAuthDestination(params.get('next'), fallback);
}

export function getAuthCallbackUrl() {
  if (typeof window === 'undefined') return '/auth/callback';
  const destination = getAuthPageDestination('/');
  const callback = new URL('/auth/callback', window.location.origin);
  if (destination !== '/') {
    callback.searchParams.set('next', destination);
  }
  return callback.toString();
}
