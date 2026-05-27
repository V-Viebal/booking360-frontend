#!/bin/bash

# resource-detail.page.ts
cat > resource-detail.page.ts << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, ResourceResponse } from './booking360-api.service';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './resource-detail.page.html',
  styleUrl: './resource-detail.page.css'
})
export class ResourceDetailPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly resource = signal<ResourceResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Resource ID is missing');
      this.loading.set(false);
      return;
    }

    try {
      const data = await this.api.getResource(id);
      this.resource.set(data);
    } catch (err) {
      this.error.set('Failed to load resource');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
EOF

# resource-detail.page.html
cat > resource-detail.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Resource detail</p>
    <h1 class="page__title">{{ resource()?.name || 'Resource' }}</h1>
    <p class="page__description">View resource details, availability, and booking history.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading resource...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
      <p><a routerLink="/resources">Back to resources</a></p>
    } @else if (resource()) {
      <div class="detail-card">
        <h2 class="detail-card__title">{{ resource()!.name }}</h2>
        <dl class="detail-card__details">
          <dt>Location</dt>
          <dd>{{ resource()!.location || 'Not specified' }}</dd>
          <dt>Description</dt>
          <dd>{{ resource()!.description || 'No description' }}</dd>
          <dt>Capacity</dt>
          <dd>{{ resource()!.capacity }} people</dd>
          <dt>Hourly rate</dt>
          <dd>${{ resource()!.hourlyRate }}</dd>
          <dt>Status</dt>
          <dd>{{ resource()!.isActive ? 'Active' : 'Inactive' }}</dd>
          <dt>Created</dt>
          <dd>{{ resource()!.createdAt | date:'medium' }}</dd>
        </dl>
        <a routerLink="/resources" class="btn btn--secondary">Back to resources</a>
      </div>
    }
  </div>
</section>
EOF

# bookings.page.ts
cat > bookings.page.ts << 'EOF'
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
EOF

# bookings.page.html
cat > bookings.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Booking ops</p>
    <h1 class="page__title">Bookings</h1>
    <p class="page__description">View and manage bookings.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading bookings...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else if (bookings().length === 0) {
      <p>No bookings found.</p>
    } @else {
      <div class="booking-list">
        @for (booking of bookings(); track booking.id) {
          <a [routerLink]="['/bookings', booking.id]" class="booking-card">
            <h3 class="booking-card__title">{{ booking.title }}</h3>
            <p class="booking-card__resource">{{ booking.resourceName }}</p>
            <p class="booking-card__owner">{{ booking.ownerDisplayName }}</p>
            <div class="booking-card__time">
              <span>{{ booking.startAt | date:'short' }}</span>
              <span>→</span>
              <span>{{ booking.endAt | date:'short' }}</span>
            </div>
            <span class="booking-card__status">{{ booking.status }}</span>
          </a>
        }
      </div>
    }
  </div>
</section>
EOF

# booking-detail.page.ts
cat > booking-detail.page.ts << 'EOF'
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
EOF

# booking-detail.page.html
cat > booking-detail.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Booking detail</p>
    <h1 class="page__title">{{ booking()?.title || 'Booking' }}</h1>
    <p class="page__description">View booking details, customer info, and resource assignment.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading booking...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
      <p><a routerLink="/bookings">Back to bookings</a></p>
    } @else if (booking()) {
      <div class="detail-card">
        <h2 class="detail-card__title">{{ booking()!.title }}</h2>
        <dl class="detail-card__details">
          <dt>Resource</dt>
          <dd>{{ booking()!.resourceName }}</dd>
          <dt>Owner</dt>
          <dd>{{ booking()!.ownerDisplayName }}</dd>
          <dt>Start time</dt>
          <dd>{{ booking()!.startAt | date:'medium' }}</dd>
          <dt>End time</dt>
          <dd>{{ booking()!.endAt | date:'medium' }}</dd>
          <dt>Status</dt>
          <dd>{{ booking()!.status }}</dd>
          <dt>Notes</dt>
          <dd>{{ booking()!.notes || 'No notes' }}</dd>
          <dt>Created</dt>
          <dd>{{ booking()!.createdAt | date:'medium' }}</dd>
        </dl>
        <div class="detail-card__actions">
          @if (booking()!.status !== 'Cancelled') {
            <button class="btn btn--danger" (click)="cancelBooking()" [disabled]="cancelling()">
              {{ cancelling() ? 'Cancelling...' : 'Cancel booking' }}
            </button>
          }
          <a routerLink="/bookings" class="btn btn--secondary">Back to bookings</a>
        </div>
      </div>
    }
  </div>
</section>
EOF

echo "More pages written"
