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
