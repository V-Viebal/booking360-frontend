import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { Booking360ApiService, AdminOverviewResponse, AdminMetricsResponse, AdminDistrictDensityRow } from './booking360-api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css'
})
export class AdminPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly overview = signal<AdminOverviewResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  // W8 REQ-GM-011/GM-012 daily ops dashboard.
  protected readonly metrics = signal<AdminMetricsResponse | null>(null);
  // W8 REQ-GM-001/GM-008 per-district density.
  protected readonly density = signal<AdminDistrictDensityRow[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const [data, metrics, density] = await Promise.all([
        this.api.loadAdminOverview(),
        this.api.loadAdminMetrics().catch(() => null),
        this.api.loadAdminDistrictDensity().catch(() => [])
      ]);
      this.overview.set(data);
      this.metrics.set(metrics);
      this.density.set(density ?? []);
    } catch (err) {
      this.error.set('Failed to load admin overview');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  /** W8 REQ-SS-010: open print-ready vi-VN onboarding HTML in a new tab. */
  openOnboardingChecklist(shopId: string): void {
    const url = this.api.buildAdminOnboardingChecklistUrl(shopId);
    if (typeof window !== 'undefined') { window.open(url, '_blank', 'noopener'); }
  }

  /** Format a delta vs yesterday for display. */
  delta(today: number, yesterday: number): string {
    const d = today - yesterday;
    if (d === 0) return '±0';
    return d > 0 ? '+' + d : String(d);
  }
}
