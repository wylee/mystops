export {};

declare global {
  const DJANGO_DEBUG: boolean;
  const DJANGO_MAPBOX_ACCESS_TOKEN: string;
  const useCsrfContext: () => string;
  const useCurrentUserContext: () => any;
}
