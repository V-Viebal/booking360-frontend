import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Booking360ApiService,
  ShopRecoveryClaimResponse,
} from '../booking360-api.service';

/**
 * W12 — REQ-TC-014: Shop owner self-service recovery.
 *
 * Two-step UI:
 *   1) Owner enters shop phone → BE sends a 6-digit code via the configured
 *      notification channel (zns/sms/email/log). For privacy, BE returns the
 *      same "ok" message regardless of whether the phone is registered.
 *   2) Owner enters phone + code → BE rotates shop_access_token and returns a
 *      fresh /m/{token} manage URL. Any leaked old link is invalidated.
 *
 * UX intent: keep this dead-simple for low-tech shop owners. No extra fields,
 * no jargon, vi-VN throughout. Mirror the verify-phone page's calm tone.
 */
@Component({
  selector: 'app-shop-recover',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-head">
        <h1>Khôi phục liên kết quản lý quán</h1>
        <p class="muted">
          Mất liên kết <code>/m/...</code>? Nhập số điện thoại đã đăng ký để nhận
          mã 6 số, sau đó dùng mã để lấy liên kết mới.
        </p>
      </header>

      @if (claimed()) {
        @let r = claimed()!;
        <div class="card success">
          <h2>Đã khôi phục ✓</h2>
          <p>Đây là liên kết quản lý mới của quán bạn. Hãy lưu lại ngay.</p>
          <p class="manage-url">
            <a [href]="r.manageUrl" target="_blank" rel="noopener">{{ r.manageUrl }}</a>
          </p>
          <p class="muted small">
            Liên kết cũ đã bị thay thế. Chỉ liên kết mới mới hoạt động.
          </p>
          <p>
            <a [href]="r.manageUrl" class="btn btn-primary">Mở trang quản lý</a>
            <a routerLink="/shops" class="btn btn-light">Về danh sách quán</a>
          </p>
        </div>
      } @else {
        <form class="card" (ngSubmit)="onSubmit()" #form="ngForm">
          <label class="field">
            <span>Số điện thoại quán</span>
            <input
              type="tel"
              name="phone"
              [(ngModel)]="phone"
              required
              autocomplete="tel"
              placeholder="VD: 0912345678"
              [disabled]="busy()"
            />
          </label>

          @if (codeSent()) {
            <label class="field">
              <span>Mã 6 số (đã gửi qua kênh thông báo)</span>
              <input
                type="text"
                name="code"
                [(ngModel)]="code"
                required
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="\\d{6}"
                maxlength="6"
                placeholder="123456"
                [disabled]="busy()"
              />
              <small class="muted">
                Mã có hiệu lực 10 phút. Không nhận được mã?
                <button type="button" class="link-btn" (click)="onResend()" [disabled]="busy()">
                  Gửi lại
                </button>
              </small>
            </label>
          }

          @if (errorMsg()) {
            <p class="error-msg">{{ errorMsg() }}</p>
          }
          @if (infoMsg()) {
            <p class="info-msg">{{ infoMsg() }}</p>
          }

          <div class="actions">
            @if (!codeSent()) {
              <button type="submit" class="btn btn-primary" [disabled]="busy() || !phone">
                {{ busy() ? 'Đang gửi...' : 'Gửi mã 6 số' }}
              </button>
            } @else {
              <button type="submit" class="btn btn-primary" [disabled]="busy() || !code">
                {{ busy() ? 'Đang xác thực...' : 'Khôi phục liên kết' }}
              </button>
              <button type="button" class="btn btn-light" (click)="onChangePhone()" [disabled]="busy()">
                Đổi số điện thoại
              </button>
            }
          </div>

          <p class="muted small footer-note">
            Vì lý do bảo mật, hệ thống không tiết lộ số điện thoại có đăng ký hay không.
            Giới hạn 3 lần gửi mã trong 15 phút cho mỗi số.
          </p>
        </form>
      }
    </section>
  `,
  styles: [`
    :host { display: block; padding: 2rem 1rem 4rem; max-width: 560px; margin: 0 auto; }
    .page-head h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .muted { color: #6b7280; }
    .small { font-size: 0.85rem; }
    code { background: #f3f4f6; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }

    .card { padding: 1.25rem; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
    .card.success { border-color: #bbf7d0; background: #f0fdf4; }

    .field { display: block; margin-bottom: 1rem; }
    .field span { display: block; font-weight: 600; margin-bottom: 0.35rem; }
    .field input {
      width: 100%; box-sizing: border-box;
      padding: 0.7rem 0.85rem; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 1rem;
    }
    .field input:focus { outline: 2px solid #2563eb; border-color: #2563eb; }
    .field small { display: block; margin-top: 0.4rem; }

    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .btn {
      display: inline-block; padding: 0.65rem 1.1rem; border-radius: 8px;
      font-weight: 600; text-decoration: none; cursor: pointer; border: 0;
      font-size: 0.95rem;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
    .btn-light { border: 1px solid #2563eb; color: #2563eb; background: #fff; }
    .btn-light:disabled { opacity: 0.6; cursor: not-allowed; }

    .link-btn {
      background: none; border: 0; color: #2563eb; cursor: pointer;
      padding: 0; font: inherit; text-decoration: underline;
    }
    .link-btn:disabled { color: #9ca3af; cursor: not-allowed; text-decoration: none; }

    .error-msg { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca;
                  padding: 0.6rem 0.85rem; border-radius: 8px; margin: 0 0 0.75rem; }
    .info-msg  { color: #065f46; background: #ecfdf5; border: 1px solid #a7f3d0;
                  padding: 0.6rem 0.85rem; border-radius: 8px; margin: 0 0 0.75rem; }

    .manage-url { word-break: break-all; }
    .footer-note { margin-top: 1rem; }
  `]
})
export class ShopRecoverPageComponent {
  private readonly api = inject(Booking360ApiService);

  protected phone = '';
  protected code = '';

  protected readonly busy = signal(false);
  protected readonly codeSent = signal(false);
  protected readonly claimed = signal<ShopRecoveryClaimResponse | null>(null);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly infoMsg = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (!this.codeSent()) {
      await this.requestCode();
    } else {
      await this.claimCode();
    }
  }

  async onResend(): Promise<void> {
    await this.requestCode(true);
  }

  onChangePhone(): void {
    this.codeSent.set(false);
    this.code = '';
    this.errorMsg.set(null);
    this.infoMsg.set(null);
  }

  private async requestCode(isResend = false): Promise<void> {
    const phone = this.phone?.trim() ?? '';
    if (!phone) {
      this.errorMsg.set('Vui lòng nhập số điện thoại quán.');
      return;
    }
    this.busy.set(true);
    this.errorMsg.set(null);
    this.infoMsg.set(null);
    try {
      const r = await this.api.requestShopRecovery({ phone });
      this.codeSent.set(true);
      this.infoMsg.set(isResend ? 'Đã gửi lại mã. Vui lòng kiểm tra Zalo/SMS/email.' : r.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi mã. Vui lòng thử lại sau.';
      this.errorMsg.set(message);
    } finally {
      this.busy.set(false);
    }
  }

  private async claimCode(): Promise<void> {
    const phone = this.phone?.trim() ?? '';
    const code = this.code?.trim() ?? '';
    if (!phone || !code) {
      this.errorMsg.set('Thiếu số điện thoại hoặc mã.');
      return;
    }
    this.busy.set(true);
    this.errorMsg.set(null);
    this.infoMsg.set(null);
    try {
      const r = await this.api.claimShopRecovery({ phone, code });
      this.claimed.set(r);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mã không hợp lệ hoặc đã hết hạn.';
      this.errorMsg.set(message);
    } finally {
      this.busy.set(false);
    }
  }
}