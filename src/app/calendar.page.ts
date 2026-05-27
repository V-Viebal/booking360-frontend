import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, BookingResponse } from './booking360-api.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.css'
})
export class CalendarPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly bookings = signal<BookingResponse[]>([]);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      const data = await this.api.listBookings({ from, to, limit: 200 });
      this.bookings.set(data);
    } catch (err) {
      this.error.set('Failed to load calendar');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
