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
    <!-- ============ DISCOVERY HEADER ============ -->
    <section class="discovery-head">
      <div class="b360-container">
        <span class="b360-eyebrow">Marketplace</span>
        <h1 class="b360-h1" style="margin-top:.55rem;">Tìm barbershop gần bạn</h1>
        <p class="b360-lead" style="max-width:60ch; margin-top:.65rem;">
          Lọc theo quận, tìm theo tên hoặc dùng định vị GPS. Tất cả các quán đều
          đã được book360 xác minh số điện thoại và đang nhận khách hôm nay.
        </p>

        <div class="b360-row" style="margin-top:1.5rem;">
          <label class="b360-search">
            <span class="b360-sr-only">Tìm quán</span>
            <input
              type="search"
              placeholder="Tìm theo tên quán hoặc địa chỉ..."
              [(ngModel)]="query"
              (input)="applyFilter()" />
          </label>
          <button type="button"
                  class="b360-btn b360-btn--dark"
                  (click)="useNearMe()"
                  [disabled]="locating()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>
            </svg>
            {{ locating() ? 'Đang định vị...' : 'Tìm gần tôi' }}
          </button>
        </div>

        @if (districts().length > 1) {
          <div class="b360-row" role="tablist" aria-label="Lọc theo quận" style="margin-top:1.1rem; gap:.5rem;">
            <button type="button"
                    class="b360-chip"
                    [class.b360-chip--brand-active]="!selectedDistrict()"
                    role="tab"
                    [attr.aria-selected]="!selectedDistrict()"
                    (click)="setDistrict(null)">Tất cả</button>
            @for (d of districts(); track d) {
              <button type="button"
                      class="b360-chip"
                      [class.b360-chip--brand-active]="selectedDistrict() === d"
                      role="tab"
                      [attr.aria-selected]="selectedDistrict() === d"
                      (click)="setDistrict(d)">{{ d }}</button>
            }
          </div>
        }

        <div class="result-count" aria-live="polite">
          @if (!loading()) {
            <strong>{{ filtered().length }}</strong> quán
            @if (selectedDistrict(); as d) { ở quận <strong>{{ d }}</strong> }
            @if (query) { khớp "<em>{{ query }}</em>" }
          }
        </div>
      </div>
    </section>

    <!-- ============ RESULT GRID ============ -->
    <section class="b360-section--tight">
      <div class="b360-container">
        @if (loading()) {
          <div class="b360-shop-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="b360-shop-card" style="cursor:default;">
                <div class="b360-skeleton" style="aspect-ratio:16/10;"></div>
                <div class="body">
                  <div class="b360-skeleton" style="height:18px; width:65%;"></div>
                  <div class="b360-skeleton" style="height:14px; width:90%; margin-top:.45rem;"></div>
                  <div class="b360-skeleton" style="height:14px; width:50%; margin-top:.45rem;"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filtered().length === 0) {
          <div class="b360-empty">
            <div class="icon">🔍</div>
            <h3>Không tìm thấy quán phù hợp</h3>
            <p>Thử bỏ bộ lọc quận, đổi từ khóa, hoặc bấm "Tìm gần tôi".</p>
            @if (selectedDistrict() || query) {
              <button type="button" class="b360-btn b360-btn--ghost" (click)="resetFilters()" style="margin-top:1rem;">Xóa bộ lọc</button>
            }
          </div>
        } @else {
          <div class="b360-shop-grid">
            @for (shop of filtered(); track shop.id) {
              <a class="b360-shop-card" [routerLink]="['/shops', shop.slug]">
                <div class="photo">
                  @if (heroPhoto(shop); as hero) {
                    <img [src]="hero" [alt]="shop.name" loading="lazy"/>
                  } @else {
                    <span aria-hidden="true">{{ shop.name.charAt(0) }}</span>
                  }
                  <div class="corner-badges">
                    @if (shop.priceSegment) { <span class="b360-badge b360-badge--brand">{{ shop.priceSegment }}</span> }
                    @if (shop.distanceKm != null) { <span class="b360-badge b360-badge--ink">{{ shop.distanceKm.toFixed(1) }} km</span> }
                  </div>
                </div>
                <div class="body">
                  <h3 class="title">{{ shop.name }}</h3>
                  <div class="meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11" r="3"/><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/></svg>
                    <span>{{ shop.address }}</span>
                  </div>
                  <div class="meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    <span>{{ shop.openTime }} – {{ shop.closeTime }}</span>
                  </div>
                  @if (shop.district) {
                    <div class="meta"><span class="b360-badge">{{ shop.district }}</span></div>
                  }
                  <div class="footer">
                    @if (shop.happyScore != null && shop.reviewCount > 0) {
                      <span class="rating">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6Z"/></svg>
                        {{ shop.happyScore.toFixed(1) }} <span class="b360-mute2">({{ shop.reviewCount }})</span>
                      </span>
                    } @else {
                      <span class="b360-mute2" style="font-size:.85rem;">Chưa có đánh giá</span>
                    }
                    <span class="b360-badge b360-badge--success b360-badge--dot">Đang mở</span>
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </section>

    <!-- ============ Owner CTA banner ============ -->
    <section class="b360-section--tight">
      <div class="b360-container">
        <div class="cta-banner">
          <div>
            <div class="b360-h3">Bạn là chủ quán?</div>
            <p class="b360-mute2" style="margin:.25rem 0 0; font-size:.92rem;">
              Đăng ký quán miễn phí, bật/tắt nhận khách bằng 1 nút, không thu phí giao dịch.
            </p>
          </div>
          <a routerLink="/shops/register" class="b360-btn b360-btn--primary">Đăng ký miễn phí</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .discovery-head {
      background: linear-gradient(180deg, var(--b360-bg-soft) 0%, transparent 100%);
      padding: clamp(2rem, 5vw, 3.5rem) 0 1rem;
    }
    .result-count { margin-top: 1rem; color: var(--b360-fg-muted); font-size: .92rem; }
    .result-count strong { color: var(--b360-fg); }
    .result-count em { font-style: normal; color: var(--b360-brand); font-weight: 600; }
    .cta-banner {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1.25rem; flex-wrap: wrap;
      padding: 1.5rem 1.75rem;
      background: linear-gradient(120deg, var(--b360-brand-50), var(--b360-bg-soft));
      border: 1px solid var(--b360-brand-100);
      border-radius: var(--b360-r-lg);
    }
  `]
})
export class ShopsListPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly shops = signal<PublicShopListItem[]>([]);
  protected readonly filtered = signal<PublicShopListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly locating = signal(false);
  protected readonly districts = signal<string[]>([]);
  protected readonly selectedDistrict = signal<string | null>(null);
  protected query = '';

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listPublicShops();
      this.shops.set(list);
      this.filtered.set(list);
      const ds = Array.from(new Set(list.map(s => s.district).filter((d): d is string => !!d))).sort();
      this.districts.set(ds);
    } finally {
      this.loading.set(false);
    }
  }

  protected setDistrict(d: string | null): void {
    this.selectedDistrict.set(d);
    this.applyFilter();
  }

  protected resetFilters(): void {
    this.selectedDistrict.set(null);
    this.query = '';
    this.applyFilter();
  }

  protected applyFilter(): void {
    const q = this.query.trim().toLowerCase();
    const d = this.selectedDistrict();
    const result = this.shops().filter(s => {
      if (d && s.district !== d) return false;
      if (!q) return true;
      const hay = (s.name + ' ' + s.address).toLowerCase();
      return hay.includes(q);
    });
    this.filtered.set(result);
  }

  async useNearMe(): Promise<void> {
    if (!('geolocation' in navigator)) return;
    this.locating.set(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      const list = await this.api.listPublicShops({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      this.shops.set(list);
      this.filtered.set(list);
    } catch {
      // user denied or timeout — ignore silently
    } finally {
      this.locating.set(false);
    }
  }

  protected hasPhoto(shop: PublicShopListItem): boolean {
    return !!(shop.galleryPhotos?.length || shop.photoUrl);
  }
  protected heroPhoto(shop: PublicShopListItem): string | null {
    if (shop.galleryPhotos && shop.galleryPhotos.length > 0) return shop.galleryPhotos[0];
    return shop.photoUrl ?? null;
  }
}