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
        <h1>Tìm barbershop gần bạn</h1>
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

      <!-- W8 REQ-GM-001/GM-008: per-district chips for HCM expansion. -->
      @if (districts().length > 1) {
        <div class="district-chips" role="tablist" aria-label="Lọc theo quận">
          <button type="button" class="chip" [class.chip--active]="!selectedDistrict()" (click)="setDistrict(null)">Tất cả</button>
          @for (d of districts(); track d) {
            <button type="button" class="chip" [class.chip--active]="selectedDistrict() === d" (click)="setDistrict(d)">{{ d }}</button>
          }
        </div>
      }

      @if (loading()) {
        <p class="muted">Đang tải danh sách quán...</p>
      } @else if (filtered().length === 0) {
        <p class="muted">Chưa tìm thấy quán nào phù hợp.</p>
      } @else {
        <div class="shop-grid">
          @for (shop of filtered(); track shop.id) {
            <a class="shop-card" [routerLink]="['/shops', shop.slug]">
              <!-- W8 REQ-EC-018: hero photo (first gallery url, then legacy photoUrl, else initial badge) -->
              <div class="shop-hero">
                @if (heroPhoto(shop); as hero) {
                  <img [src]="hero" [alt]="shop.name" loading="lazy" />
                } @else {
                  <span class="shop-hero-fallback">{{ shop.name.charAt(0) }}</span>
                }
              </div>
              <div class="shop-card-body">
                <div class="shop-card-head">
                  <h3>{{ shop.name }}</h3>
                  @if (shop.distanceKm != null) {
                    <span class="distance">{{ shop.distanceKm.toFixed(1) }} km</span>
                  }
                </div>
                <p class="shop-address">{{ shop.address }}</p>
                <p class="shop-hours">Mở cửa {{ shop.openTime }} – {{ shop.closeTime }}</p>
                <div class="badges">
                  @if (shop.district) {
                    <span class="district-badge">{{ shop.district }}</span>
                  }
                  @if (shop.priceSegment) {
                    <span class="price-badge">{{ shop.priceSegment }}</span>
                  }
                </div>
                @if (shop.happyScore != null && shop.reviewCount > 0) {
                  <p class="shop-rating">⭐ {{ shop.happyScore.toFixed(1) }} ({{ shop.reviewCount }})</p>
                }
              </div>
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
    .shop-hero { aspect-ratio: 16 / 9; border-radius: 12px 12px 0 0; overflow: hidden; background: linear-gradient(135deg, #dbeafe, #fef3c7); display: flex; align-items: center; justify-content: center; margin: -1rem -1rem 0.85rem; }
    .shop-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .shop-hero-fallback { font-size: 2.4rem; font-weight: 700; color: #1d4ed8; }
    .shop-card-body { display: block; }
    .badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .district-badge { background: #e0f2fe; color: #075985; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; }
    .district-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0 0 1rem; }
    .chip { padding: 0.4rem 0.85rem; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font: inherit; color: #4b5563; }
    .chip--active { background: #2563eb; color: #fff; border-color: #2563eb; }
  `]
})
export class ShopsListPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly shops = signal<PublicShopListItem[]>([]);
  protected readonly filtered = signal<PublicShopListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly locating = signal(false);
  /** W8 REQ-GM-001: distinct districts derived from the loaded shops. */
  protected readonly districts = signal<string[]>([]);
  /** W8 REQ-GM-001: currently-selected district chip (null = all). */
  protected readonly selectedDistrict = signal<string | null>(null);
  protected query = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    const district = this.selectedDistrict();
    let rows = this.shops();
    if (district) {
      rows = rows.filter(s => (s.district ?? '').toLowerCase() === district.toLowerCase());
    }
    if (q) {
      rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
    }
    this.filtered.set(rows);
  }

  /** W8 REQ-GM-001: clicking a district chip re-filters in place. */
  setDistrict(district: string | null): void {
    this.selectedDistrict.set(district);
    this.applyFilter();
  }

  /** W8 REQ-EC-018: pick a hero image (gallery first, then legacy photoUrl). */
  heroPhoto(shop: PublicShopListItem): string | null {
    if (shop.photoUrls && shop.photoUrls.length > 0) return shop.photoUrls[0];
    return shop.photoUrl ?? null;
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
      this.refreshDistricts(items);
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
      this.refreshDistricts(items);
      this.filtered.set(items);
    } catch {
      this.shops.set([]);
      this.filtered.set([]);
      this.districts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private refreshDistricts(items: PublicShopListItem[]): void {
    const set = new Set<string>();
    for (const s of items) { if (s.district) set.add(s.district); }
    this.districts.set(Array.from(set).sort((a, b) => a.localeCompare(b, 'vi')));
  }
}