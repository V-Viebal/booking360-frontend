import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Booking360ApiService, PublicBookingResponse } from '../booking360-api.service';

@Component({
  selector: 'app-booking-by-token',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/" class="back-link">← Trang chủ</a>

      @if (loading()) {
        <p class="muted">Đang tải thông tin đặt chỗ...</p>
      } @else if (notFound()) {
        <div class="card warn">
          <h1>Không tìm thấy lịch đặt</h1>
          <p>Mã đặt chỗ không hợp lệ hoặc đã bị xoá. Vui lòng kiểm tra lại liên kết.</p>
          <a routerLink="/shops" class="btn btn-primary">Xem các quán</a>
        </div>
      } @else if (booking(); as b) {
        <div class="card" [class.cancelled]="b.status === 'cancelled'">
          <header>
            <span class="kicker">Đặt chỗ tại {{ b.shopName }}</span>
            <h1>{{ b.slotTime | date:'HH:mm · EEEE, dd/MM/yyyy' }}</h1>
            <p class="muted">{{ b.shopAddress }}</p>
          </header>

          <dl class="details">
            <div><dt>Khách hàng</dt><dd>{{ b.customerName }}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{{ b.customerPhone }}</dd></div>
            @if (b.note) {
              <div><dt>Ghi chú</dt><dd>{{ b.note }}</dd></div>
            }
            <div><dt>Trạng thái</dt><dd>
              <span class="badge badge--{{ b.status }}">{{ statusLabel(b.status) }}</span>
              @if (b.status === 'cancelled') {
                @if (b.cancelledBy === 'shop') {
                  <small> (quán huỷ)</small>
                } @else if (b.cancelledBy === 'customer') {
                  <small> (bạn đã huỷ)</small>
                }
                @if (b.cancelReason) {
                  <small> – {{ b.cancelReason }}</small>
                }
              }
            </dd></div>
          </dl>

          @if (b.status === 'pending' || b.status === 'confirmed') {
            <div class="actions">
              <h2>Cần huỷ lịch?</h2>
              <p class="muted">Vui lòng huỷ trước giờ hẹn ít nhất 1 tiếng để quán có thể giải phóng chỗ.</p>
              <textarea
                [value]="cancelReason()"
                (input)="cancelReason.set($any($event.target).value)"
                placeholder="Lý do huỷ (tuỳ chọn)"
                rows="2"></textarea>
              <button type="button" class="btn btn-danger" [disabled]="cancelling()" (click)="cancel(b.bookingToken)">
                {{ cancelling() ? 'Đang huỷ...' : 'Xác nhận huỷ lịch' }}
              </button>
              @if (errorMessage()) { <p class="err">{{ errorMessage() }}</p> }
            </div>
          }

          <div class="share">
            <p class="muted">Lưu liên kết này để xem hoặc huỷ lịch sau:</p>
            <input type="text" readonly [value]="shareUrl(b)" #shareInput />
            <button type="button" class="btn-light" (click)="copy(shareInput)">Sao chép</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 2rem 1rem 4rem; max-width: 720px; margin: 0 auto; }
    .back-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .muted { color: #6b7280; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
    .card.cancelled { background: #fef2f2; border-color: #fecaca; }
    .card.warn { border-color: #f59e0b; background: #fffbeb; }
    .kicker { color: #2563eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; }
    h1 { margin: 0.4rem 0 0.25rem; font-size: 1.5rem; }
    .details { display: grid; gap: 0.75rem; margin: 1.25rem 0; }
    .details > div { display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; }
    .details dt { color: #6b7280; margin: 0; }
    .details dd { margin: 0; color: #1f2937; font-weight: 500; }
    .badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.85rem; font-weight: 500; }
    .badge--pending { background: #fef3c7; color: #92400e; }
    .badge--confirmed { background: #dcfce7; color: #166534; }
    .badge--cancelled { background: #fee2e2; color: #991b1b; }
    .badge--completed { background: #e0e7ff; color: #3730a3; }
    .actions { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e5e7eb; }
    .actions h2 { margin: 0 0 0.25rem; font-size: 1.05rem; }
    .actions textarea { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; box-sizing: border-box; margin: 0.5rem 0; }
    .btn { padding: 0.6rem 1.1rem; border-radius: 8px; font-weight: 600; border: 0; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-light { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 0.45rem 0.85rem; border-radius: 8px; cursor: pointer; }
    .err { color: #dc2626; font-size: 0.9rem; margin-top: 0.5rem; }
    .share { margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e5e7eb; }
    .share input { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; font-size: 0.85rem; box-sizing: border-box; margin: 0.4rem 0; }
  `]
})
export class BookingByTokenPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly booking = signal<PublicBookingResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly cancelReason = signal('');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    try {
      const b = await this.api.getPublicBookingByToken(token);
      this.booking.set(b);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async cancel(token: string): Promise<void> {
    if (!confirm('Bạn chắc chắn muốn huỷ lịch này?')) return;
    this.cancelling.set(true);
    this.errorMessage.set(null);
    try {
      const updated = await this.api.cancelPublicBookingByToken(token, this.cancelReason() || undefined);
      this.booking.set(updated);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Không thể huỷ lịch.');
    } finally {
      this.cancelling.set(false);
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã huỷ';
      case 'completed': return 'Đã hoàn thành';
      default: return status;
    }
  }

  shareUrl(b: PublicBookingResponse): string {
    if (typeof window === 'undefined') return `/b/${b.bookingToken}`;
    return `${window.location.origin}/b/${b.bookingToken}`;
  }

  async copy(input: HTMLInputElement): Promise<void> {
    input.select();
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      document.execCommand('copy');
    }
  }
}