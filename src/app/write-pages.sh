#!/bin/bash

# workspace.page.html
cat > workspace.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Control hub</p>
    <h1 class="page__title">Workspace</h1>
    <p class="page__description">Your session state and quick actions.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading workspace...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else if (currentUser()) {
      <div class="user-card">
        <h2 class="user-card__title">Session</h2>
        <dl class="user-card__details">
          <dt>Display name</dt>
          <dd>{{ currentUser()!.displayName }}</dd>
          <dt>Email</dt>
          <dd>{{ currentUser()!.email }}</dd>
          <dt>Username</dt>
          <dd>{{ currentUser()!.username }}</dd>
          <dt>Roles</dt>
          <dd>{{ currentUser()!.roles.join(', ') || 'None' }}</dd>
          <dt>Member since</dt>
          <dd>{{ currentUser()!.createdAt | date:'medium' }}</dd>
          <dt>Last seen</dt>
          <dd>{{ currentUser()!.lastSeenAt | date:'medium' }}</dd>
        </dl>
        <button class="btn btn--secondary" (click)="logout()">Sign out</button>
      </div>

      <nav class="quick-actions">
        <h2 class="quick-actions__title">Quick actions</h2>
        <div class="quick-actions__grid">
          <a routerLink="/resources" class="action-card">
            <span class="action-card__label">Browse resources</span>
          </a>
          <a routerLink="/bookings" class="action-card">
            <span class="action-card__label">View bookings</span>
          </a>
          <a routerLink="/calendar" class="action-card">
            <span class="action-card__label">Open calendar</span>
          </a>
        </div>
      </nav>
    }
  </div>
</section>
EOF

# resources.page.ts
cat > resources.page.ts << 'EOF'
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Booking360ApiService, ResourceResponse } from './booking360-api.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './resources.page.html',
  styleUrl: './resources.page.css'
})
export class ResourcesPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly resources = signal<ResourceResponse[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly isAdmin = signal(false);

  async ngOnInit(): Promise<void> {
    const user = this.auth.user();
    this.isAdmin.set(user?.roles?.includes('Admin') ?? false);

    try {
      const data = await this.api.listResources(this.isAdmin());
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

# resources.page.html
cat > resources.page.html << 'EOF'
<section class="page">
  <header class="page__header">
    <p class="page__kicker">Inventory</p>
    <h1 class="page__title">Resources</h1>
    <p class="page__description">Browse bookable resources, filter by type and availability.</p>
  </header>

  <div class="page__body">
    @if (loading()) {
      <p>Loading resources...</p>
    } @else if (error()) {
      <p class="error-message">{{ error() }}</p>
    } @else if (resources().length === 0) {
      <p>No resources available.</p>
    } @else {
      <div class="resource-grid">
        @for (resource of resources(); track resource.id) {
          <a [routerLink]="['/resources', resource.id]" class="resource-card">
            <h3 class="resource-card__name">{{ resource.name }}</h3>
            <p class="resource-card__location">{{ resource.location || 'No location' }}</p>
            <p class="resource-card__description">{{ resource.description || 'No description' }}</p>
            <div class="resource-card__meta">
              <span class="resource-card__capacity">Capacity: {{ resource.capacity }}</span>
              <span class="resource-card__rate">${{ resource.hourlyRate }}/hr</span>
              <span class="resource-card__status" [class.status--active]="resource.isActive" [class.status--inactive]="!resource.isActive">
                {{ resource.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </a>
        }
      </div>
    }
  </div>
</section>
EOF

echo "Pages written successfully"
