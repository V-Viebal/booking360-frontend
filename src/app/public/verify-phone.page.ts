import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Booking360ApiService, VerifyConsumeResponse } from '../booking360-api.service';

/**
 * W7: 1-click phone verification (REQ-EC-013).
 * Customer lands here from the verify link sent via SMS/Zalo by the W3 dispatcher.
 * Token is consumed once; the BE replies with the phone (and optional bookingId)
 * and stamps phone_verified_at on the booking row.
 */
@Component({
  selector: 'app-verify-phone',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <h1>Xác minh số điện thoại</h1>
        <p class="muted">Nhấn 1 lần để xác nhận số của bạn với Booking360.</p>
      </header>

      @if (loading()) {
        <p class="muted">Đang xác minh, vui lòng đợi...</p>
      } @else if (success() !== null) {
        @let ok = success()!;
        <div class="card success">
          <h2>Đã xác minh ✓</h2>
          <p>Số điện thoại <strong>{{ ok.phone }}</strong> đã được xác nhận.</p>
          @if (ok.bookingId) {
            <p class="muted">Liên kết với lịch đặt: <code>{{ ok.bookingId }}</code></p>
          }
          <p>
            <a routerLink="/shops" class="btn btn-primary">Quay lại tìm quán</a>
          </p>
        </div>
      } @else if (error()) {
        <div class="card error">
          <h2>Không thể xác minh</h2>
          <p>{{ error() }}</p>
          <p class="muted small">
            Liên kết xác minh có hiệu lực 25 phút và chỉ dùng được 1 lần.
            Hãy yêu cầu một liên kết mới khi đặt lịch lại.
          </p>
          <p>
            <a routerLink="/shops" class="btn btn-light">Tìm quán khác</a>
          </p>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; padding: 2rem 1rem 4rem; max-width: 640px; margin: 0 auto; }
    .page-head h1 { margin: 0 0 0.25rem; font-size: 1.6rem; }
    .muted { color: #6b7280; }
    .small { font-size: 0.85rem; }
    .card { padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
    .card.success { border-color: #bbf7d0; background: #f0fdf4; }
    .card.error { border-color: #fecaca; background: #fef2f2; }
    code { background: #f3f4f6; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }
    .btn { display: inline-block; padding: 0.65rem 1.1rem; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-light { border: 1px solid #2563eb; color: #2563eb; background: #fff; }
  `]
})
export class VerifyPhonePageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly success = signal<VerifyConsumeResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token) {
      this.error.set('Liên kết xác minh không hợp lệ.');
      this.loading.set(false);
      return;
    }
    try {
      const result = await this.api.consumePhoneVerification(token);
      this.success.set(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.';
      this.error.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}