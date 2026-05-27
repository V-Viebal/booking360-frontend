import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, AdminOverviewResponse } from './booking360-api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css'
})
export class AdminPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly overview = signal<AdminOverviewResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.loadAdminOverview();
      this.overview.set(data);
    } catch (err) {
      this.error.set('Failed to load admin overview');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
