import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from './core/auth/auth.service';
import { FoundationResponse, Booking360ApiService } from './booking360-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly api = inject(Booking360ApiService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly foundationStatus = signal<'checking' | 'online' | 'offline'>('checking');
  protected readonly foundation = signal<FoundationResponse | null>(null);
  protected readonly foundationMessage = signal('Checking backend foundation.');

  /** Current calendar year (for footer copyright). Stable across SSR + hydrate. */
  protected readonly year = new Date().getFullYear();

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly userInitials = computed(() => {
    const name = this.auth.user()?.displayName;
    if (!name) return 'B3';
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  });

  protected readonly userName = computed(() =>
    this.auth.user()?.displayName || 'Operator'
  );

  private routePath(): string {
    const raw = this.currentUrl() || '/';
    const noHash = raw.split('#')[0];
    const noQuery = noHash.split('?')[0];
    return noQuery || '/';
  }

  protected readonly isPublicRoute = computed<boolean>(() => {
    const url = this.routePath();
    if (url === '/' || url === '') return true;
    if (url === '/shops' || url.startsWith('/shops/')) return true;
    if (url === '/shops/register') return true;
    if (url.startsWith('/b/')) return true;
    if (url.startsWith('/m/')) return true;
    if (url.startsWith('/shop/recover')) return true;
    if (url.startsWith('/verify/')) return true;
    return false;
  });

  protected readonly currentBreadcrumb = computed<{ prefix: string; current: string }>(() => {
    const url = this.currentUrl();
    if (url === '/') return { prefix: '', current: 'Dashboard' };
    if (url.startsWith('/calendar')) return { prefix: 'Operations / ', current: 'Calendar' };
    if (url.startsWith('/bookings/')) return { prefix: 'Operations / Bookings / ', current: 'Booking detail' };
    if (url.startsWith('/bookings')) return { prefix: 'Operations / ', current: 'Bookings' };
    if (url.startsWith('/resources/')) return { prefix: 'Inventory / Resources / ', current: 'Resource detail' };
    if (url.startsWith('/resources')) return { prefix: 'Inventory / ', current: 'Resources' };
    if (url.startsWith('/reports')) return { prefix: 'Operations / ', current: 'Reports' };
    if (url.startsWith('/workspace')) return { prefix: '', current: 'Workspace' };
    if (url.startsWith('/admin')) return { prefix: '', current: 'Admin' };
    return { prefix: '', current: 'Booking360' };
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.loadFoundation();

      afterNextRender(() => this.initLucide());

      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => setTimeout(() => this.initLucide(), 50));
    }
  }

  protected login(): void {
    void this.auth.login('/workspace');
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected isRouteActive(route: string): boolean {
    const currentUrl = this.routePath();
    if (route === '/') return currentUrl === '/';
    return currentUrl === route || currentUrl.startsWith(route + "/");
  }

  private initLucide(): void {
    const w = window as unknown as { lucide?: { createIcons: () => void } };
    if (w.lucide) w.lucide.createIcons();
  }

  private async loadFoundation(): Promise<void> {
    try {
      const health = await this.api.loadHealth();
      this.foundation.set(health);
      this.foundationStatus.set('online');
      this.foundationMessage.set('Backend is online');
    } catch (error) {
      this.foundationStatus.set('offline');
      this.foundationMessage.set(error instanceof Error ? error.message : 'Unable to reach backend foundation.');
    }
  }
}