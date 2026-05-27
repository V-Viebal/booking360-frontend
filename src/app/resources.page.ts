import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Booking360ApiService, ResourceResponse } from './booking360-api.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [RouterLink],
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
