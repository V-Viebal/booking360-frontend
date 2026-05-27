import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { AuthService } from './core/auth/auth.service';
import { Booking360ApiService, CurrentUserResponse } from './booking360-api.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './workspace.page.html',
  styleUrl: './workspace.page.css'
})
export class WorkspacePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(Booking360ApiService);

  protected readonly user = this.auth.user;
  protected readonly loading = signal(true);
  protected readonly currentUser = signal<CurrentUserResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const userData = await this.api.loadCurrentUser();
      this.currentUser.set(userData);
    } catch (err) {
      this.error.set('Failed to load user data');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
