import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, BookingResponse } from './booking360-api.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './bookings.page.html',
  styleUrl: './bookings.page.css'
})
export class BookingsPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly bookings = signal<BookingResponse[]>([]);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.listBookings({ limit: 100 });
      this.bookings.set(data);
    } catch (err) {
      this.error.set('Failed to load bookings');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
