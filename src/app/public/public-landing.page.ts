import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Booking360ApiService, PublicShopListItem } from '../booking360-api.service';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-inner">
        <span class="kicker">Booking360 cho barbershop</span>
        <h1>Đặt chỗ trước, không còn cảnh chờ đợi</h1>
        <p class="lead">
          Booking360 giúp bạn xem nhanh các quán có chỗ trống và đặt giữ chỗ trong vài giây.
          Chủ quán quản lý lượt đặt online ngay trên điện thoại, không cần app riêng.
        </p>
        <div class="cta-row">
          <a routerLink="/shops" class="btn btn-primary">Tìm quán có chỗ trống</a>
          <a routerLink="/shops/register" class="btn btn-secondary">Đăng ký quán của tôi</a>
        </div>
        <p class="status">
          Trạng thái nền tảng: <strong [class.online]="apiOnline()" [class.offline]="!apiOnline()">{{ apiOnline() ? 'Đang hoạt động' : 'Đang kết nối lại...' }}</strong>
        </p>
      </div>
    </section>

    <section class="featured">
      <div class="section-head">
        <h2>Quán mới có chỗ trống</h2>
        <a routerLink="/shops" class="link">Xem tất cả →</a>
      </div>
      @if (loading()) {
        <p class="muted">Đang tải danh sách quán...</p>
      } @else if (shops().length === 0) {
        <p class="muted">Chưa có quán nào đăng ký. Hãy là quán đầu tiên!</p>
      } @else {
        <div class="shop-grid">
          @for (shop of shops(); track shop.id) {
            <a class="shop-card" [routerLink]="['/shops', shop.slug]">
              <div class="shop-card-head">
                <h3>{{ shop.name }}</h3>
                @if (shop.priceSegment) {
                  <span class="price-badge">{{ shop.priceSegment }}</span>
                }
              </div>
              <p class="shop-address">{{ shop.address }}</p>
              <p class="shop-hours">Mở cửa {{ shop.openTime }} – {{ shop.closeTime }}</p>
              @if (shop.happyScore != null) {
                <p class="shop-rating">⭐ {{ shop.happyScore.toFixed(1) }} ({{ shop.reviewCount }} đánh giá)</p>
              }
            </a>
          }
        </div>
      }
    </section>

    <section class="how-it-works">
      <h2>3 bước đơn giản</h2>
      <ol>
        <li><strong>Tìm quán</strong> – chọn quận/khu vực bạn đang ở</li>
        <li><strong>Chọn khung giờ</strong> – xem chỗ trống theo thời gian thực</li>
        <li><strong>Xác nhận</strong> – nhập tên + SĐT, không cần đăng ký</li>
      </ol>
    </section>
  `,
  styles: [`
    :host { display: block; padding: 2rem 1rem 4rem; max-width: 1100px; margin: 0 auto; }
    .hero { padding: 3rem 0 2rem; }
    .hero-inner { max-width: 720px; }
    .kicker { color: #2563eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.85rem; }
    h1 { font-size: clamp(2rem, 5vw, 3rem); margin: 0.75rem 0 1rem; line-height: 1.15; }
    .lead { font-size: 1.1rem; color: #4b5563; margin: 0 0 1.5rem; }
    .cta-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .btn { display: inline-block; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #fff; color: #2563eb; border: 1px solid #2563eb; }
    .status { margin-top: 1.5rem; font-size: 0.95rem; color: #6b7280; }
    .status .online { color: #16a34a; }
    .status .offline { color: #dc2626; }
    .featured { margin-top: 2.5rem; }
    .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; }
    .section-head h2 { margin: 0; font-size: 1.5rem; }
    .link { color: #2563eb; text-decoration: none; font-weight: 500; }
    .muted { color: #6b7280; }
    .shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .shop-card { display: block; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; text-decoration: none; color: inherit; transition: box-shadow 0.15s; }
    .shop-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .shop-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .shop-card-head h3 { margin: 0; font-size: 1.1rem; }
    .price-badge { background: #f3f4f6; color: #374151; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.8rem; }
    .shop-address, .shop-hours, .shop-rating { margin: 0.35rem 0 0; color: #4b5563; font-size: 0.95rem; }
    .how-it-works { margin-top: 3rem; padding: 1.5rem; background: #f9fafb; border-radius: 12px; }
    .how-it-works h2 { margin: 0 0 0.75rem; font-size: 1.25rem; }
    .how-it-works ol { margin: 0; padding-left: 1.25rem; line-height: 1.9; color: #374151; }
  `]
})
export class PublicLandingPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);

  protected readonly loading = signal(true);
  protected readonly apiOnline = signal(false);
  protected readonly shops = signal<PublicShopListItem[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      await this.api.loadHealth();
      this.apiOnline.set(true);
    } catch {
      this.apiOnline.set(false);
    }

    try {
      const shops = await this.api.listPublicShops({ limit: 6 });
      this.shops.set(shops);
    } catch {
      this.shops.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}