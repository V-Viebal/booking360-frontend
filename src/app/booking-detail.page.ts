import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, BookingResponse } from './booking360-api.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './booking-detail.page.html',
  styleUrl: './booking-detail.page.css'
})
export class BookingDetailPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly booking = signal<BookingResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cancelling = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Booking ID is missing');
      this.loading.set(false);
      return;
    }

    try {
      const data = await this.api.getBooking(id);
      this.booking.set(data);
    } catch (err) {
      this.error.set('Failed to load booking');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  async cancelBooking(): Promise<void> {
    const booking = this.booking();
    if (!booking || this.cancelling()) return;

    this.cancelling.set(true);
    try {
      const updated = await this.api.cancelBooking(booking.id);
      this.booking.set(updated);
    } catch (err) {
      this.error.set('Failed to cancel booking');
      console.error(err);
    } finally {
      this.cancelling.set(false);
    }
  }
}
