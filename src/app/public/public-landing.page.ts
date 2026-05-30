import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Booking360ApiService, PublicShopListItem } from '../booking360-api.service';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- ============ HERO ============ -->
    <section class="b360-hero">
      <div class="b360-container">
        <div class="b360-hero-grid">
          <div>
            <span class="b360-eyebrow">Marketplace barbershop · Made in Vietnam</span>
            <h1 class="b360-display" style="margin-top:.85rem;">
              Đặt lịch cắt tóc <span class="brand-mark">trong 30 giây</span>
            </h1>
            <p class="b360-lead" style="margin-top:1rem; max-width:52ch;">
              Tìm barbershop gần bạn, xem chỗ trống theo thời gian thực, đặt giữ chỗ —
              không cần app, không cần trả trước, không cần đăng ký tài khoản.
            </p>
            <div class="b360-row" style="margin-top:1.75rem; gap:.85rem;">
              <a routerLink="/shops" class="b360-btn b360-btn--primary b360-btn--lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md">
                  <circle cx="12" cy="11" r="3"/><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/>
                </svg>
                Tìm quán có chỗ trống
              </a>
              <a routerLink="/shops/register" class="b360-btn b360-btn--ghost b360-btn--lg" style="--bg:transparent; --fg:#fff; --bd:rgba(255,255,255,.22);">
                Đăng ký quán của tôi
              </a>
            </div>
            <div class="b360-row" style="margin-top:1.5rem; gap:1.25rem; font-size:.9rem; color:var(--b360-fg-on-dark-muted);">
              <span class="b360-status" [class.b360-status--online]="apiOnline()" [class.b360-status--offline]="!apiOnline()">
                {{ apiOnline() ? 'Hệ thống đang hoạt động' : 'Đang kết nối lại' }}
              </span>
              <span aria-hidden="true">·</span>
              <span>Không trả trước</span>
              <span aria-hidden="true">·</span>
              <span>Hủy miễn phí</span>
            </div>
          </div>

          <!-- Right card: live "today's" preview -->
          <aside class="b360-hero-card" aria-label="Quán nổi bật trong ngày">
            <div class="b360-spread" style="margin-bottom:.75rem;">
              <div>
                <div style="font-family:var(--b360-font-display); font-weight:700; color:#fff; font-size:1.05rem;">Hôm nay đang mở</div>
                <div style="color:var(--b360-fg-on-dark-muted); font-size:.85rem;">{{ shopsCount() }} quán sẵn sàng phục vụ</div>
              </div>
              <a routerLink="/shops" class="b360-btn b360-btn--brand-soft b360-btn--sm">Xem tất cả</a>
            </div>

            @if (loading()) {
              <div class="b360-stack-sm">
                <div class="b360-skeleton" style="height:60px"></div>
                <div class="b360-skeleton" style="height:60px"></div>
                <div class="b360-skeleton" style="height:60px"></div>
              </div>
            } @else if (shops().length === 0) {
              <p style="color:var(--b360-fg-on-dark-muted); margin:0;">Chưa có quán đăng ký. Hãy là quán đầu tiên!</p>
            } @else {
              <ul class="hero-shops">
                @for (shop of shops().slice(0, 3); track shop.id) {
                  <li>
                    <a [routerLink]="['/shops', shop.slug]">
                      <div class="hero-shop-thumb" [style.background-image]="thumbUrl(shop)">
                        @if (!hasPhoto(shop)) { <span>{{ shop.name.charAt(0) }}</span> }
                      </div>
                      <div class="hero-shop-body">
                        <div class="hero-shop-name">{{ shop.name }}</div>
                        <div class="hero-shop-meta">
                          {{ shop.openTime }}–{{ shop.closeTime }}
                          @if (shop.happyScore != null && shop.reviewCount > 0) {
                            <span aria-hidden="true">·</span>
                            <span>★ {{ shop.happyScore.toFixed(1) }}</span>
                          }
                        </div>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md hero-shop-go">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </a>
                  </li>
                }
              </ul>
            }
          </aside>
        </div>

        <!-- Trust strip -->
        <div class="b360-trust">
          <div class="b360-trust-item"><div class="num">&lt;30s</div><div class="lbl">Thời gian đặt lịch</div></div>
          <div class="b360-trust-item"><div class="num">0đ</div><div class="lbl">Phí đặt giữ chỗ</div></div>
          <div class="b360-trust-item"><div class="num">{{ shopsCount() || '—' }}</div><div class="lbl">Quán đang hoạt động</div></div>
          <div class="b360-trust-item"><div class="num">5★</div><div class="lbl">Happy Score quality</div></div>
        </div>
      </div>
    </section>

    <!-- ============ SERVICES ============ -->
    <section class="b360-section">
      <div class="b360-container">
        <div class="b360-section-head">
          <div>
            <span class="b360-eyebrow">Dịch vụ</span>
            <h2 class="b360-h1">Mọi nhu cầu cắt tóc nam, ở 1 nơi</h2>
            <p class="b360-lead">book360 chỉ giữ những gì khách hàng nam thật sự dùng — gọn, nhanh, không lằng nhằng.</p>
          </div>
        </div>
        <div class="b360-services">
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v18"/><path d="M18 3v18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg></div>
            <div class="lbl">Cắt tóc nam</div>
            <div class="sub">Combo gội + cắt + tạo kiểu</div>
          </article>
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
            <div class="lbl">Đặt theo giờ</div>
            <div class="sub">Khung 30 phút, hủy miễn phí</div>
          </article>
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
            <div class="lbl">Không trả trước</div>
            <div class="sub">Trả tiền ở quán, không ràng buộc</div>
          </article>
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6Z"/></svg></div>
            <div class="lbl">Happy Score</div>
            <div class="sub">Đánh giá thật, không spam</div>
          </article>
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92V20a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h3.09a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg></div>
            <div class="lbl">Nhắc lịch</div>
            <div class="sub">Zalo / SMS T-30 phút</div>
          </article>
          <article class="b360-service">
            <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg></div>
            <div class="lbl">Same-day</div>
            <div class="sub">Đặt cho hôm nay, không lo quên</div>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ HOW IT WORKS ============ -->
    <section class="b360-section" id="how-it-works" style="background:var(--b360-bg-soft);">
      <div class="b360-container">
        <div class="b360-section-head">
          <div>
            <span class="b360-eyebrow">3 bước đơn giản</span>
            <h2 class="b360-h1">Cắt tóc không phải chờ</h2>
          </div>
          <a routerLink="/shops" class="b360-btn b360-btn--dark">Bắt đầu đặt lịch</a>
        </div>
        <div class="b360-steps">
          <article class="b360-step">
            <h3>Tìm quán gần bạn</h3>
            <p>Chọn quận/khu vực hoặc bấm "Tìm gần tôi" để xem các quán đã đăng ký book360, kèm khoảng cách và đánh giá.</p>
          </article>
          <article class="b360-step">
            <h3>Chọn khung giờ</h3>
            <p>Lưới 30 phút, chỗ trống màu cam, chỗ đầy gạch ngang. Bấm chọn — không cần đăng nhập.</p>
          </article>
          <article class="b360-step">
            <h3>Xác nhận tức thì</h3>
            <p>Nhập tên + SĐT + ghi chú (tùy chọn). Quán nhận thông báo qua Zalo/SMS dưới 5 giây.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ FEATURED SHOPS ============ -->
    <section class="b360-section">
      <div class="b360-container">
        <div class="b360-section-head">
          <div>
            <span class="b360-eyebrow">Quán nổi bật</span>
            <h2 class="b360-h1">Mới đăng ký, đang nhận khách</h2>
          </div>
          <a routerLink="/shops" class="b360-btn b360-btn--ghost">Xem tất cả →</a>
        </div>

        @if (loading()) {
          <div class="b360-shop-grid">
            @for (i of [1,2,3,4]; track i) {
              <div class="b360-shop-card" style="cursor:default;">
                <div class="b360-skeleton" style="aspect-ratio:16/10;"></div>
                <div class="body">
                  <div class="b360-skeleton" style="height:18px; width:70%;"></div>
                  <div class="b360-skeleton" style="height:14px; width:90%; margin-top:.4rem;"></div>
                  <div class="b360-skeleton" style="height:14px; width:50%; margin-top:.4rem;"></div>
                </div>
              </div>
            }
          </div>
        } @else if (shops().length === 0) {
          <div class="b360-empty">
            <div class="icon">✂️</div>
            <h3>Chưa có quán nào đăng ký</h3>
            <p>Bạn là chủ barbershop? Đăng ký miễn phí trong 5 phút.</p>
            <a routerLink="/shops/register" class="b360-btn b360-btn--primary" style="margin-top:1rem;">Đăng ký quán của tôi</a>
          </div>
        } @else {
          <div class="b360-shop-grid">
            @for (shop of shops().slice(0, 8); track shop.id) {
              <a class="b360-shop-card" [routerLink]="['/shops', shop.slug]">
                <div class="photo">
                  @if (hasPhoto(shop)) {
                    <img [src]="heroPhoto(shop)" [alt]="shop.name" loading="lazy"/>
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

    <!-- ============ FOR SHOPS CTA ============ -->
    <section class="b360-section" style="background:var(--b360-bg-darker); color:var(--b360-fg-on-dark);">
      <div class="b360-container">
        <div class="b360-hero-grid">
          <div>
            <span class="b360-eyebrow" style="color:var(--b360-brand);">Dành cho chủ quán</span>
            <h2 class="b360-h1" style="color:#fff; margin-top:.75rem;">Đăng ký 5 phút. Nhận đặt lịch ngay tối nay.</h2>
            <p class="b360-lead" style="color:var(--b360-fg-on-dark-muted); max-width:54ch; margin-top:1rem;">
              book360 không thu phí giao dịch trong giai đoạn đầu. Bạn chỉ cần điền tên quán,
              địa chỉ và giờ mở/đóng — chúng tôi tạo sẵn lịch 30 phút và link Zalo/SMS để bạn chia sẻ.
            </p>
            <ul class="benefits">
              <li>✓ Quản lý chỗ trống chỉ trong vài giây trên điện thoại</li>
              <li>✓ Tự động nhắc khách T-30 phút giảm no-show</li>
              <li>✓ Bật/tắt nhận khách bằng 1 nút khi quán đông</li>
              <li>✓ Xem điểm Happy Score + đánh giá khách thật</li>
            </ul>
            <a routerLink="/shops/register" class="b360-btn b360-btn--primary b360-btn--lg" style="margin-top:1.5rem;">
              Đăng ký quán miễn phí
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
          <aside class="b360-hero-card" style="background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.1);">
            <div style="font-family:var(--b360-font-display); font-weight:700; color:#fff; font-size:1.05rem;">Quy trình bật quán</div>
            <ol class="onboarding-steps">
              <li><strong>Đăng ký</strong> · điền 4 thông tin, 1 phút</li>
              <li><strong>Cấu hình ca</strong> · giờ mở/đóng + slot mặc định</li>
              <li><strong>Chia sẻ link</strong> · QR + URL ngắn cho khách</li>
              <li><strong>Sẵn sàng</strong> · khách đặt, bạn nhận Zalo/SMS</li>
            </ol>
          </aside>
        </div>
      </div>
    </section>

    <!-- ============ FAQ ============ -->
    <section class="b360-section">
      <div class="b360-container b360-container--narrow">
        <div class="b360-section-head" style="text-align:center; flex-direction:column;">
          <div style="text-align:center;">
            <span class="b360-eyebrow" style="margin-inline:auto;">Câu hỏi thường gặp</span>
            <h2 class="b360-h1" style="margin-top:.5rem;">Bạn đang phân vân?</h2>
          </div>
        </div>
        <div class="b360-stack">
          <details class="faq" name="faq">
            <summary>Đặt lịch trên book360 có mất phí không?</summary>
            <p>Không. Khách hàng đặt giữ chỗ hoàn toàn miễn phí, không trả trước. Bạn chỉ thanh toán dịch vụ trực tiếp tại quán.</p>
          </details>
          <details class="faq" name="faq">
            <summary>Có cần tải app không?</summary>
            <p>Không. book360 là web mobile-first — mở trình duyệt là đặt được. Hỗ trợ tốt trên iOS/Android, không tốn dung lượng.</p>
          </details>
          <details class="faq" name="faq">
            <summary>Tôi có thể hủy lịch không?</summary>
            <p>Có, miễn phí. Mỗi xác nhận đặt lịch đều có liên kết hủy gửi qua Zalo/SMS, không cần đăng nhập.</p>
          </details>
          <details class="faq" name="faq">
            <summary>Tôi quên link quản lý quán?</summary>
            <p>Vào trang <a routerLink="/shop/recover" class="recovery-link">Khôi phục liên kết</a>. Nhập số điện thoại quán, nhận mã 6 số trên Zalo/SMS, lấy lại link mới.</p>
          </details>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .brand-mark { color: var(--b360-brand); }

    .hero-shops { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .55rem; }
    .hero-shops a {
      display: flex; align-items: center; gap: .85rem;
      padding: .65rem;
      border-radius: var(--b360-r-sm);
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(255,255,255,.06);
      text-decoration: none; color: #fff;
      transition: background .15s var(--b360-ease), border-color .15s var(--b360-ease);
    }
    .hero-shops a:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.18); }
    .hero-shop-thumb {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--b360-brand), var(--b360-ink));
      background-size: cover; background-position: center;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: var(--b360-font-display); font-weight: 800;
    }
    .hero-shop-body { flex: 1; min-width: 0; }
    .hero-shop-name { font-weight: 600; font-size: .95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hero-shop-meta { font-size: .8rem; color: var(--b360-fg-on-dark-muted); display: flex; gap: .35rem; }
    .hero-shop-go { color: var(--b360-fg-on-dark-muted); flex-shrink: 0; }

    .benefits { list-style: none; padding: 0; margin: 1.25rem 0 0; display: grid; gap: .55rem; color: var(--b360-fg-on-dark-muted); }
    .benefits li { color: var(--b360-fg-on-dark); }

    .onboarding-steps { list-style: none; padding: 0; margin: .85rem 0 0; counter-reset: ostep; }
    .onboarding-steps li {
      counter-increment: ostep;
      position: relative;
      padding: .55rem 0 .55rem 2.25rem;
      color: var(--b360-fg-on-dark-muted);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .onboarding-steps li:last-child { border-bottom: 0; }
    .onboarding-steps li::before {
      content: counter(ostep);
      position: absolute; left: 0; top: 50%;
      width: 28px; height: 28px; border-radius: 50%;
      transform: translateY(-50%);
      background: rgba(255,90,31,.16); color: var(--b360-brand);
      font-family: var(--b360-font-display); font-weight: 800;
      display: flex; align-items: center; justify-content: center; font-size: .82rem;
    }
    .onboarding-steps li strong { color: #fff; font-weight: 600; }

    .faq {
      background: var(--b360-bg);
      border: 1px solid var(--b360-line);
      border-radius: var(--b360-r-md);
      padding: 0 1.25rem;
      transition: border-color .15s var(--b360-ease);
    }
    .faq[open] { border-color: var(--b360-brand-100); }
    .faq summary {
      list-style: none;
      cursor: pointer; user-select: none;
      padding: 1rem 0;
      font-family: var(--b360-font-display); font-weight: 700; font-size: 1.02rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .faq summary::-webkit-details-marker { display: none; }
    .faq summary::after {
      content: '＋';
      color: var(--b360-brand);
      font-family: var(--b360-font-display); font-weight: 800; font-size: 1.4rem; line-height: 1;
      transition: transform .2s var(--b360-ease);
    }
    .faq[open] summary::after { content: '−'; }
    .faq p { padding-bottom: 1rem; margin: 0; color: var(--b360-fg-soft); line-height: 1.6; }
    .recovery-link { color: var(--b360-brand); text-decoration: underline; text-underline-offset: 3px; }
  `]
})
export class PublicLandingPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly shops = signal<PublicShopListItem[]>([]);
  protected readonly apiOnline = signal(true);
  protected readonly shopsCount = signal<number>(0);

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listPublicShops();
      this.shops.set(list);
      this.shopsCount.set(list.length);
      this.apiOnline.set(true);
    } catch {
      this.apiOnline.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  protected hasPhoto(shop: PublicShopListItem): boolean {
    if (shop.galleryPhotos && shop.galleryPhotos.length > 0) return true;
    if (shop.photoUrl) return true;
    return false;
  }
  protected heroPhoto(shop: PublicShopListItem): string | null {
    if (shop.galleryPhotos && shop.galleryPhotos.length > 0) return shop.galleryPhotos[0];
    if (shop.photoUrl) return shop.photoUrl;
    return null;
  }
  protected thumbUrl(shop: PublicShopListItem): string | null {
    const url = this.heroPhoto(shop);
    return url ? `url("${url}")` : null;
  }
}