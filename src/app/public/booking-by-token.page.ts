import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Booking360ApiService, PublicBookingResponse } from '../booking360-api.service';

@Component({
  selector: 'app-booking-by-token',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="b360-hero" style="padding: clamp(2rem,5vw,3rem) 0 0; background: var(--b360-bg-darker);">
      <div class="b360-container b360-container--narrow">
        <a routerLink="/" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m15 18-6-6 6-6"/></svg>
          Trang chủ
        </a>
        <span class="b360-eyebrow" style="margin-top:.75rem; display:inline-block;">Lịch đặt</span>
        <h1 class="b360-display" style="font-size: clamp(1.75rem,3.5vw,2.4rem); margin-top:.65rem; color:#fff;">Chi tiết đặt chỗ</h1>
      </div>
    </section>

    <section class="b360-section--tight" style="padding-bottom: clamp(3rem, 6vw, 5rem);">
      <div class="b360-container b360-container--narrow">
        @if (loading()) {
          <div class="b360-skeleton" style="height: 380px; border-radius: var(--b360-r-lg);"></div>
        } @else if (notFound()) {
          <div class="b360-empty">
            <div class="icon">🔎</div>
            <h3>Không tìm thấy lịch đặt</h3>
            <p>Mã đặt chỗ không hợp lệ hoặc đã bị xoá. Vui lòng kiểm tra lại liên kết bạn nhận được qua Zalo/SMS.</p>
            <a routerLink="/shops" class="b360-btn b360-btn--primary" style="margin-top:1rem;">Xem các quán</a>
          </div>
        } @else if (booking(); as b) {
          <article class="receipt b360-card" [attr.data-status]="b.status">
            <div class="receipt-band" [attr.data-status]="b.status">
              <span class="band-dot"></span>
              <span>{{ statusLabel(b.status) }}</span>
              @if (b.status === 'cancelled') {
                @if (b.cancelledBy === 'shop') { <span class="band-sub">— quán huỷ</span> }
                @else if (b.cancelledBy === 'customer') { <span class="band-sub">— bạn đã huỷ</span> }
              }
            </div>

            <div class="receipt-head">
              <span class="b360-eyebrow">Booking360</span>
              <h2 class="b360-h1" style="margin:.4rem 0 0;">{{ b.shopName }}</h2>
              <p class="b360-mute" style="margin:.5rem 0 0;">{{ b.shopAddress }}</p>
            </div>

            <div class="receipt-time">
              <div class="time-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-lg"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </div>
              <div>
                <div class="time-big">{{ b.slotTime | date:'HH:mm' }}</div>
                <div class="time-sub">{{ b.slotTime | date:'EEEE, dd/MM/yyyy':'+0700':'vi' }}</div>
              </div>
            </div>

            <dl class="receipt-grid">
              <div>
                <dt>Khách hàng</dt>
                <dd>{{ b.customerName }}</dd>
              </div>
              <div>
                <dt>Số điện thoại</dt>
                <dd><a [href]="'tel:' + b.customerPhone" class="brand-link">{{ b.customerPhone }}</a></dd>
              </div>
              @if (b.note) {
                <div class="full">
                  <dt>Ghi chú</dt>
                  <dd>{{ b.note }}</dd>
                </div>
              }
              @if (b.status === 'cancelled' && b.cancelReason) {
                <div class="full">
                  <dt>Lý do huỷ</dt>
                  <dd>{{ b.cancelReason }}</dd>
                </div>
              }
            </dl>

            @if (b.status === 'pending' || b.status === 'confirmed') {
              <hr class="b360-divider" />

              <section class="cancel-block">
                <div class="b360-spread" style="align-items:flex-start; gap:1rem;">
                  <div>
                    <h3 class="b360-h3" style="margin:0;">Cần huỷ lịch?</h3>
                    <p class="b360-mute2" style="font-size:.85rem; margin:.25rem 0 0;">
                      Hủy miễn phí. Vui lòng huỷ trước giờ hẹn ít nhất 1 tiếng để quán giải phóng chỗ.
                    </p>
                  </div>
                </div>
                <textarea
                  class="b360-textarea"
                  [value]="cancelReason()"
                  (input)="cancelReason.set($any($event.target).value)"
                  placeholder="Lý do huỷ (tuỳ chọn) — quán có thể đọc để hỗ trợ tốt hơn"
                  rows="2"
                  style="margin-top:.75rem;"></textarea>
                <button type="button"
                        class="b360-btn b360-btn--danger b360-btn--lg"
                        style="margin-top:.75rem;"
                        [disabled]="cancelling()"
                        (click)="cancel(b.bookingToken)">
                  {{ cancelling() ? 'Đang huỷ...' : 'Xác nhận huỷ lịch' }}
                </button>
                @if (errorMessage()) {
                  <div class="b360-notice b360-notice--danger" style="margin-top:.75rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    <span>{{ errorMessage() }}</span>
                  </div>
                }
              </section>
            }

            @if (b.status === 'completed') {
              <hr class="b360-divider" />
              <div class="b360-notice b360-notice--success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M20 6 9 17l-5-5"/></svg>
                <div>
                  <strong>Lịch đã hoàn thành</strong>
                  <div>Cảm ơn bạn đã sử dụng book360. Hãy chia sẻ trải nghiệm với khách khác qua liên kết đánh giá đã gửi qua Zalo/SMS.</div>
                </div>
              </div>
            }

            <hr class="b360-divider" />

            <section class="share-block">
              <div class="b360-spread" style="align-items:flex-start; gap:1rem; margin-bottom:.75rem;">
                <div>
                  <h3 class="b360-h3" style="margin:0;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md" style="vertical-align:-3px; margin-right:.35rem; color: var(--b360-brand);">
                      <path d="m4 12 8 8 8-8"/><path d="M12 4v16"/>
                    </svg>
                    Lưu liên kết này
                  </h3>
                  <p class="b360-mute2" style="font-size:.85rem; margin:.25rem 0 0;">
                    Đây là link duy nhất để bạn xem lại / huỷ lịch. Lưu vào ghi chú điện thoại hoặc gửi cho người đi cùng.
                  </p>
                </div>
              </div>
              <div class="link-row">
                <input type="text" class="b360-input" readonly [value]="shareUrl(b)" #shareInput aria-label="Liên kết lịch đặt"/>
                <button type="button" class="b360-btn b360-btn--dark" (click)="copy(shareInput)">
                  @if (copied()) { ✓ Đã chép } @else { Sao chép }
                </button>
              </div>
            </section>

            <p class="b360-mute2" style="text-align:center; font-size:.78rem; margin: 1.5rem 0 0;">
              Mã đặt chỗ · <code>{{ b.bookingToken.substring(0, 12) }}…</code>
            </p>
          </article>

          <div class="b360-row" style="justify-content:center; margin-top:1.5rem; gap:.75rem; flex-wrap:wrap;">
            <a routerLink="/shops" class="b360-btn b360-btn--ghost">Xem các quán khác</a>
            @if (b.status === 'cancelled') {
              <a routerLink="/shops" class="b360-btn b360-btn--primary">Đặt lịch mới</a>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .back-link {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: 1rem 0 .5rem;
      text-decoration: none;
      color: var(--b360-fg-on-dark-muted);
      font-size: .9rem; font-weight: 500;
    }
    .back-link:hover { color: #fff; }
    .brand-link { color: var(--b360-brand); font-weight: 600; }
    code {
      background: var(--b360-bg-soft);
      padding: .12rem .45rem;
      border-radius: 4px;
      font-size: .82rem;
      color: var(--b360-fg-muted);
    }

    .receipt {
      padding: 0;
      overflow: hidden;
      box-shadow: var(--b360-shadow-md);
    }

    .receipt-band {
      padding: .75rem 1.5rem;
      display: flex; align-items: center; gap: .55rem;
      font-family: var(--b360-font-display);
      font-weight: 600; font-size: .95rem;
      letter-spacing: .01em;
    }
    .band-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .band-sub { font-weight: 400; opacity: .85; }
    .receipt-band[data-status="pending"]   { background: rgba(217,119,6,.12); color: #92400e; }
    .receipt-band[data-status="pending"] .band-dot { background: #f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,.18); animation: pulse 1.6s ease-in-out infinite; }
    .receipt-band[data-status="confirmed"] { background: rgba(22,163,74,.12); color: #166534; }
    .receipt-band[data-status="confirmed"] .band-dot { background: var(--b360-success); }
    .receipt-band[data-status="cancelled"] { background: rgba(220,38,38,.12); color: #991b1b; }
    .receipt-band[data-status="cancelled"] .band-dot { background: var(--b360-danger); }
    .receipt-band[data-status="completed"] { background: rgba(37,99,235,.12); color: #1e3a8a; }
    .receipt-band[data-status="completed"] .band-dot { background: #2563eb; }
    @keyframes pulse {
      0%,100% { box-shadow: 0 0 0 4px rgba(245,158,11,.18); }
      50%     { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
    }

    .receipt-head { padding: 1.5rem 1.5rem 0; }
    .receipt-time {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.5rem;
      margin: 1.25rem 1.5rem 0;
      background: linear-gradient(120deg, var(--b360-bg-soft), var(--b360-brand-50));
      border: 1px solid var(--b360-brand-100);
      border-radius: var(--b360-r-md);
    }
    .time-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px;
      background: var(--b360-ink); color: var(--b360-brand);
      border-radius: 14px;
      flex-shrink: 0;
    }
    .time-big {
      font-family: var(--b360-font-display);
      font-weight: 800; font-size: clamp(2rem, 5vw, 2.5rem);
      letter-spacing: -.02em; color: var(--b360-fg);
      line-height: 1;
    }
    .time-sub {
      margin-top: .35rem;
      color: var(--b360-fg-muted); font-size: .92rem;
      text-transform: capitalize;
    }

    .receipt-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem;
      padding: 1.5rem;
      margin: 0;
    }
    @media (max-width: 560px) { .receipt-grid { grid-template-columns: 1fr; } }
    .receipt-grid .full { grid-column: 1 / -1; }
    .receipt-grid dt {
      font-size: .78rem; text-transform: uppercase; letter-spacing: .04em;
      color: var(--b360-fg-mute2); font-weight: 600;
      margin-bottom: .2rem;
    }
    .receipt-grid dd { margin: 0; color: var(--b360-fg); font-weight: 500; }

    .cancel-block, .share-block { padding: 0 1.5rem 1.5rem; }
    .link-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .link-row .b360-input { flex: 1 1 240px; min-width: 0; font-size: .8rem; font-family: ui-monospace, SFMono-Regular, monospace; }

    .receipt[data-status="cancelled"] { background: var(--b360-danger-bg); border-color: var(--b360-danger-border); }
    .receipt[data-status="cancelled"] .receipt-time { opacity: .65; }
  `]
})
export class BookingByTokenPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly booking = signal<PublicBookingResponse | null>(null);
  protected readonly cancelReason = signal('');
  protected readonly cancelling = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly copied = signal(false);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token) { this.notFound.set(true); this.loading.set(false); return; }
    try {
      const b = await this.api.getPublicBooking(token);
      this.booking.set(b);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(token: string): Promise<void> {
    this.cancelling.set(true);
    this.errorMessage.set(null);
    try {
      const b = await this.api.cancelPublicBooking(token, { reason: this.cancelReason().trim() || null });
      this.booking.set(b);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Không thể huỷ, vui lòng thử lại.');
    } finally {
      this.cancelling.set(false);
    }
  }

  shareUrl(b: PublicBookingResponse): string {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/b/${b.bookingToken}`
      : `/b/${b.bookingToken}`;
  }

  async copy(input: HTMLInputElement): Promise<void> {
    try {
      input.select();
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(input.value);
      } else {
        document.execCommand('copy');
      }
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // ignore
    }
  }

  statusLabel(s: string): string {
    switch (s) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã huỷ';
      case 'completed': return 'Đã hoàn thành';
      default: return s;
    }
  }
}