import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Booking360ApiService, PublicShopListItem } from '../booking360-api.service';

@Component({
  selector: 'app-shops-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <h1>Tìm quán cà phê có chỗ trống</h1>
        <p class="muted">Chọn khu vực hoặc nhập tên để lọc các quán đã đăng ký Booking360.</p>
      </header>

      <div class="filters">
        <input
          type="search"
          placeholder="Tìm theo tên quán hoặc địa chỉ..."
          [(ngModel)]="query"
          (input)="applyFilter()"
          class="filter-input" />
        <button type="button" class="btn-light" (click)="useNearMe()" [disabled]="locating()">
          {{ locating() ? 'Đang định vị...' : 'Tìm gần tôi' }}
        </button>
      </div>

      @if (loading()) {
        <p class="muted">Đang tải danh sách quán...</p>
      } @else if (filtered().length === 0) {
        <p class="muted">Chưa tìm thấy quán nào phù hợp.</p>
      } @else {
        <div class="shop-grid">
          @for (shop of filtered(); track shop.id) {
            <a class="shop-card" [routerLink]="['/shops', shop.slug]">
              <div class="shop-card-head">
                <h3>{{ shop.name }}</h3>
                @if (shop.distanceKm != null) {
                  <span class="distance">{{ shop.distanceKm.toFixed(1) }} km</span>
                }
              </div>
              <p class="shop-address">{{ shop.address }}</p>
              <p class="shop-hours">Mở cửa {{ shop.openTime }} – {{ shop.closeTime }}</p>
              @if (shop.priceSegment) {
                <span class="price-badge">{{ shop.priceSegment }}</span>
              }
              @if (shop.happyScore != null) {
                <p class="shop-rating">⭐ {{ shop.happyScore.toFixed(1) }} ({{ shop.reviewCount }})</p>
              }
            </a>
          }
        </div>
      }

      <div class="cta-banner">
        <span>Bạn là chủ quán?</span>
        <a routerLink="/shops/register" class="btn btn-primary">Đăng ký miễn phí</a>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; padding: 2rem 1rem 4rem; max-width: 1100px; margin: 0 auto; }
    .page-head h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .muted { color: #6b7280; }
    .filters { display: flex; gap: 0.75rem; margin: 1.25rem 0; flex-wrap: wrap; }
    .filter-input { flex: 1 1 280px; padding: 0.65rem 0.85rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; }
    .btn-light { padding: 0.6rem 1rem; border: 1px solid #2563eb; color: #2563eb; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 500; }
    .btn-light:disabled { opacity: 0.6; cursor: not-allowed; }
    .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .shop-card { display: block; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; text-decoration: none; color: inherit; transition: box-shadow 0.15s; position: relative; }
    .shop-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .shop-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .shop-card-head h3 { margin: 0; font-size: 1.1rem; }
    .distance { font-size: 0.85rem; color: #2563eb; font-weight: 500; }
    .shop-address, .shop-hours, .shop-rating { margin: 0.35rem 0 0; color: #4b5563; font-size: 0.95rem; }
    .price-badge { display: inline-block; margin-top: 0.5rem; background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.8rem; }
    .cta-banner { margin-top: 2rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: #eef2ff; border-radius: 12px; flex-wrap: wrap; }
    .btn { padding: 0.65rem 1.1rem; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .btn-primary { background: #2563eb; color: #fff; }
  `]
})
export class ShopsListPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly shops = signal<PublicShopListItem[]>([]);
  protected readonly filtered = signal<PublicShopListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly locating = signal(false);
  protected query = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.filtered.set(this.shops());
      return;
    }
    this.filtered.set(this.shops().filter(shop =>
      shop.name.toLowerCase().includes(q) ||
      shop.address.toLowerCase().includes(q)
    ));
  }

  async useNearMe(): Promise<void> {
    if (!('geolocation' in navigator)) {
      return;
    }
    this.locating.set(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      const items = await this.api.listPublicShops({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        radiusKm: 5,
        limit: 50
      });
      this.shops.set(items);
      this.applyFilter();
    } catch {
      // fallback to default load
      await this.load();
    } finally {
      this.locating.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const items = await this.api.listPublicShops({ limit: 50 });
      this.shops.set(items);
      this.filtered.set(items);
    } catch {
      this.shops.set([]);
      this.filtered.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}