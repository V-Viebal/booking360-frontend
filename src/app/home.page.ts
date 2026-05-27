import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { Booking360ApiService, FoundationResponse } from './booking360-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css'
})
export class HomePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(Booking360ApiService);

  protected readonly authenticated = this.auth.authenticated;
  protected readonly user = this.auth.user;
  protected readonly loading = signal(true);
  protected readonly apiStatus = signal<string>('checking...');
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const health = await this.api.loadHealth();
      this.apiStatus.set(health.status === 'ok' ? 'Online' : 'Degraded');
    } catch {
      this.apiStatus.set('Offline');
      this.error.set('Could not reach the Booking360 API.');
    } finally {
      this.loading.set(false);
    }
  }

  login(): void {
    this.auth.login('/workspace');
  }
}
