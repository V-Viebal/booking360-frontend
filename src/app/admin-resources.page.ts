import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Booking360ApiService, ResourceResponse } from './booking360-api.service';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [RouterLink],
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
