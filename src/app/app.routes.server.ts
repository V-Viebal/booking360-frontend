import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // All Booking360 Wave 1 + legacy routes are dynamic; SSR everything at
  // request time. Prerender is reserved for fully static pages (none yet).
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];