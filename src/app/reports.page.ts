import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, BookingResponse } from './booking360-api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css'
})
export class ReportsPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly bookings = signal<BookingResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly totalBookings = signal(0);
  protected readonly activeBookings = signal(0);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.listBookings({ limit: 500 });
      this.bookings.set(data);
      this.totalBookings.set(data.length);
      this.activeBookings.set(data.filter(b => b.status === 'Confirmed').length);
    } catch (err) {
      this.error.set('Failed to load reports');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
