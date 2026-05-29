import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Booking360 Wave 1 public routes - dynamic SSR (no prerender)
  {
    path: 'shops/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'b/:token',
    renderMode: RenderMode.Server
  },
  {
    path: 'm/:token',
    renderMode: RenderMode.Server
  },

  // Legacy operator routes
  {
    path: 'resources/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'bookings/:id',
    renderMode: RenderMode.Server
  },

  // Everything else can be prerendered
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];