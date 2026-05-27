#!/bin/bash

# calendar.page.ts
cat > calendar.page.ts << 'EOF'
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
EOF

# calendar.page.html
cat > calendar.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Schedule</p>
    <h1 class="page__title">Calendar</h1>
    <p class="page__description">Daily, weekly, and monthly booking calendar views.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading calendar...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else {
      <div class="calendar-view">
        <h2 class="calendar-view__title">This month's bookings</h2>
        @if (bookings().length === 0) {
          <p>No bookings this month.</p>
        } @else {
          <div class="booking-list">
            @for (booking of bookings(); track booking.id) {
              <a [routerLink]="['/bookings', booking.id]" class="booking-card">
                <h3 class="booking-card__title">{{ booking.title }}</h3>
                <p class="booking-card__resource">{{ booking.resourceName }}</p>
                <div class="booking-card__time">
                  <span>{{ booking.startAt | date:'short' }}</span>
                  <span>→</span>
                  <span>{{ booking.endAt | date:'short' }}</span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    }
  </div>
</section>
EOF

# reports.page.ts
cat > reports.page.ts << 'EOF'
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
EOF

# reports.page.html
cat > reports.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Reporting</p>
    <h1 class="page__title">Reports</h1>
    <p class="page__description">Booking metrics and revenue summaries.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading reports...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else {
      <div class="metrics-grid">
        <div class="metric-card">
          <h3 class="metric-card__label">Total bookings</h3>
          <p class="metric-card__value">{{ totalBookings() }}</p>
        </div>
        <div class="metric-card">
          <h3 class="metric-card__label">Active bookings</h3>
          <p class="metric-card__value">{{ activeBookings() }}</p>
        </div>
      </div>

      <div class="recent-bookings">
        <h2 class="recent-bookings__title">Recent bookings</h2>
        @if (bookings().length === 0) {
          <p>No bookings to display.</p>
        } @else {
          <div class="booking-list">
            @for (booking of bookings().slice(0, 20); track booking.id) {
              <a [routerLink]="['/bookings', booking.id]" class="booking-card">
                <h3 class="booking-card__title">{{ booking.title }}</h3>
                <p class="booking-card__resource">{{ booking.resourceName }}</p>
                <div class="booking-card__time">
                  <span>{{ booking.startAt | date:'short' }}</span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    }
  </div>
</section>
EOF

# admin.page.ts
cat > admin.page.ts << 'EOF'
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
EOF

# admin.page.html
cat > admin.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Overview</p>
    <h1 class="page__title">Admin</h1>
    <p class="page__description">Workspace activity and sync status.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading admin overview...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else if (overview()) {
      <div class="admin-overview">
        <div class="metrics-grid">
          <div class="metric-card">
            <h3 class="metric-card__label">Users</h3>
            <p class="metric-card__value">{{ overview()!.counts.users }}</p>
          </div>
          <div class="metric-card">
            <h3 class="metric-card__label">Resources</h3>
            <p class="metric-card__value">{{ overview()!.counts.resources }}</p>
          </div>
          <div class="metric-card">
            <h3 class="metric-card__label">Bookings</h3>
            <p class="metric-card__value">{{ overview()!.counts.bookings }}</p>
          </div>
          <div class="metric-card">
            <h3 class="metric-card__label">Assets</h3>
            <p class="metric-card__value">{{ overview()!.counts.assets }}</p>
          </div>
        </div>

        <div class="admin-section">
          <h2 class="admin-section__title">Latest users</h2>
          @if (overview()!.latestUsers.length === 0) {
            <p>No users yet.</p>
          } @else {
            <div class="user-list">
              @for (user of overview()!.latestUsers; track user.subject) {
                <div class="user-item">
                  <p class="user-item__name">{{ user.displayName }}</p>
                  <p class="user-item__email">{{ user.email }}</p>
                  <p class="user-item__roles">{{ user.roles.join(', ') || 'No roles' }}</p>
                </div>
              }
            </div>
          }
        </div>

        <div class="admin-section">
          <h2 class="admin-section__title">Latest bookings</h2>
          @if (overview()!.latestBookings.length === 0) {
            <p>No bookings yet.</p>
          } @else {
            <div class="booking-list">
              @for (booking of overview()!.latestBookings; track booking.id) {
                <a [routerLink]="['/bookings', booking.id]" class="booking-card">
                  <h3 class="booking-card__title">{{ booking.title }}</h3>
                  <p class="booking-card__resource">{{ booking.resourceName }}</p>
                  <p class="booking-card__owner">{{ booking.ownerDisplayName }}</p>
                  <div class="booking-card__time">
                    <span>{{ booking.startAt | date:'short' }}</span>
                  </div>
                </a>
              }
            </div>
          }
        </div>

        <nav class="admin-nav">
          <h2 class="admin-nav__title">Admin sections</h2>
          <div class="admin-nav__grid">
            <a routerLink="/admin/resources" class="nav-card">
              <span class="nav-card__label">Manage resources</span>
            </a>
            <a routerLink="/admin/users" class="nav-card">
              <span class="nav-card__label">Manage users</span>
            </a>
            <a routerLink="/admin/settings" class="nav-card">
              <span class="nav-card__label">Platform settings</span>
            </a>
          </div>
        </nav>
      </div>
    }
  </div>
</section>
EOF

# admin-resources.page.ts
cat > admin-resources.page.ts << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, ResourceResponse } from './booking360-api.service';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-resources.page.html',
  styleUrl: './admin-resources.page.css'
})
export class AdminResourcesPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly resources = signal<ResourceResponse[]>([]);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.api.listResources(true);
      this.resources.set(data);
    } catch (err) {
      this.error.set('Failed to load resources');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
EOF

# admin-resources.page.html
cat > admin-resources.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Resources</p>
    <h1 class="page__title">Resource management</h1>
    <p class="page__description">Manage bookable resources.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading resources...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else {
      <p>Total resources: {{ resources().length }}</p>
      <div class="resource-grid">
        @for (resource of resources(); track resource.id) {
          <div class="resource-card">
            <h3 class="resource-card__name">{{ resource.name }}</h3>
            <p class="resource-card__location">{{ resource.location || 'No location' }}</p>
            <div class="resource-card__meta">
              <span class="resource-card__capacity">Capacity: {{ resource.capacity }}</span>
              <span class="resource-card__rate">${{ resource.hourlyRate }}/hr</span>
              <span class="resource-card__status" [class.status--active]="resource.isActive" [class.status--inactive]="!resource.isActive">
                {{ resource.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        }
      </div>
      <p><a routerLink="/admin">Back to admin</a></p>
    }
  </div>
</section>
EOF

# admin-users.page.html
cat > admin-users.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Users</p>
    <h1 class="page__title">User management</h1>
    <p class="page__description">Manage users and roles.</p>
  </header>

  <div class="page__body">
    <p>User management interface. This feature requires additional backend endpoints for listing and managing users.</p>
    <p><a routerLink="/admin">Back to admin</a></p>
  </div>
</section>
EOF

# admin-settings.page.html
cat > admin-settings.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Settings</p>
    <h1 class="page__title">Platform settings</h1>
    <p class="page__description">Configure platform settings.</p>
  </header>

  <div class="page__body">
    <p>Platform settings interface. Configure system-wide options here.</p>
    <p><a routerLink="/admin">Back to admin</a></p>
  </div>
</section>
EOF

# callback.page.html (fix placeholder)
cat > callback.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Auth callback</p>
    <h1 class="page__title">Signing you in</h1>
    <p class="page__description">Completing authentication...</p>
  </header>
  <div class="page__body">
    <p>Please wait while we complete your sign-in.</p>
  </div>
</section>
EOF

echo "All pages written"
