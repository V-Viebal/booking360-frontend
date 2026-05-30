import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Booking360ApiService, ShopRegistrationResponse } from '../booking360-api.service';

@Component({
  selector: 'app-shop-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- ============ HEADER ============ -->
    <section class="b360-hero" style="padding: clamp(2.5rem,6vw,4rem) 0 2rem;">
      <div class="b360-container">
        <a routerLink="/" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m15 18-6-6 6-6"/></svg>
          Trang chủ
        </a>

        <div class="b360-hero-grid">
          <div>
            <span class="b360-eyebrow">Dành cho chủ quán</span>
            <h1 class="b360-display" style="margin-top:.85rem;">
              Đăng ký quán <span class="brand-mark">trong 1 phút</span>
            </h1>
            <p class="b360-lead" style="max-width:54ch; margin-top:1rem;">
              Miễn phí, không thu phí giao dịch. Chỉ điền 4 thông tin và bạn có
              ngay liên kết quản lý lịch + trang công khai để chia sẻ với khách.
            </p>
            <ul class="why-list">
              <li>✓ Không cần cài app, mở web là dùng</li>
              <li>✓ Quản lý lịch đặt qua link riêng (không tài khoản)</li>
              <li>✓ Tự động nhắc khách qua Zalo/SMS</li>
              <li>✓ Bật/tắt nhận khách 1 chạm khi quán đông</li>
            </ul>
          </div>

          <aside class="b360-hero-card" style="background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.1);">
            <div style="font-family:var(--b360-font-display); font-weight:700; color:#fff; font-size:1.05rem;">Thông tin cần chuẩn bị</div>
            <ol class="onboarding-steps">
              <li><strong>Tên quán</strong> · ví dụ "Barber Minh Tuấn"</li>
              <li><strong>Số điện thoại</strong> · Zalo/SMS sẽ gửi vào số này</li>
              <li><strong>Địa chỉ</strong> · để khách tìm thấy quán</li>
              <li><strong>Giờ mở/đóng cửa</strong> · slot 30 phút sẽ được tạo tự động</li>
            </ol>
          </aside>
        </div>
      </div>
    </section>

    <!-- ============ FORM / SUCCESS ============ -->
    <section class="b360-section--tight" style="padding-bottom: clamp(3rem, 6vw, 5rem);">
      <div class="b360-container b360-container--narrow">
        @if (success(); as result) {
          <div class="b360-card success-card">
            <div class="success-head">
              <div class="success-emoji">🎉</div>
              <span class="b360-eyebrow" style="color:var(--b360-success); margin-top:.75rem; display:inline-block;">Đăng ký thành công</span>
              <h2 class="b360-h1" style="margin:.5rem 0 .5rem;">Quán <em>{{ result.name }}</em> đã sẵn sàng</h2>
              <p class="b360-lead" style="margin:0 0 1.25rem;">Lưu ngay liên kết quản lý — book360 không gửi mật khẩu, đây là cách duy nhất để bạn quay lại quản lý quán.</p>
            </div>

            <div class="b360-notice b360-notice--warning" style="margin-bottom:1.25rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <strong>Lưu liên kết quản lý ngay bây giờ</strong>
                <div>Nếu mất, bạn cần dùng <a routerLink="/shop/recover" class="brand-link">Khôi phục liên kết</a> bằng số điện thoại đã đăng ký.</div>
              </div>
            </div>

            <div class="link-block">
              <div class="link-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <strong>Liên kết quản lý</strong>
                <span class="b360-badge b360-badge--brand">Riêng tư</span>
              </div>
              <div class="link-row">
                <input type="text" class="b360-input" readonly [value]="manageUrl(result)" #urlInput aria-label="Liên kết quản lý quán" />
                <button type="button" class="b360-btn b360-btn--dark" (click)="copy(urlInput, 'manage')">
                  @if (copiedKey() === 'manage') { ✓ Đã chép } @else { Sao chép }
                </button>
              </div>
            </div>

            <div class="link-block">
              <div class="link-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z"/></svg>
                <strong>Trang công khai</strong>
                <span class="b360-badge">Chia sẻ với khách</span>
              </div>
              <div class="link-row">
                <input type="text" class="b360-input" readonly [value]="publicUrl(result)" #pubInput aria-label="Trang công khai" />
                <button type="button" class="b360-btn b360-btn--dark" (click)="copy(pubInput, 'public')">
                  @if (copiedKey() === 'public') { ✓ Đã chép } @else { Sao chép }
                </button>
              </div>
            </div>

            <div class="b360-row" style="margin-top:1.5rem; gap:.75rem; flex-wrap:wrap;">
              <a [routerLink]="['/m', result.shopAccessToken]" class="b360-btn b360-btn--primary b360-btn--lg">
                Vào trang quản lý
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m9 18 6-6-6-6"/></svg>
              </a>
              <a [routerLink]="['/shops', result.slug]" class="b360-btn b360-btn--ghost b360-btn--lg">Xem trang công khai</a>
            </div>
          </div>
        } @else {
          <div class="b360-card" style="padding: clamp(1.25rem, 3vw, 2rem);">
            <h2 class="b360-h2" style="margin:0 0 .5rem;">Thông tin quán</h2>
            <p class="b360-mute2" style="margin:0 0 1.5rem;">Chỉ mất 1 phút. Bạn có thể chỉnh sửa sau trong trang quản lý.</p>

            <form [formGroup]="form" (ngSubmit)="submit()" class="b360-stack">
              <label class="b360-field">
                <span class="b360-field-label">Tên quán <span class="req">*</span></span>
                <input type="text" class="b360-input" formControlName="name" placeholder="Barber Minh Tuấn" autocomplete="organization" />
                @if (form.controls.name.touched && form.controls.name.invalid) {
                  <small class="b360-field-error">Tên quán phải có ít nhất 2 ký tự.</small>
                }
              </label>

              <label class="b360-field">
                <span class="b360-field-label">Số điện thoại liên hệ <span class="req">*</span></span>
                <input type="tel" class="b360-input" formControlName="phone" placeholder="0901 234 567" inputmode="tel" autocomplete="tel" />
                <small class="b360-mute2" style="font-size:.78rem;">Khách dùng số này để gọi quán. Zalo/SMS xác nhận lịch cũng gửi vào số này.</small>
                @if (form.controls.phone.touched && form.controls.phone.invalid) {
                  <small class="b360-field-error">Số điện thoại không hợp lệ.</small>
                }
              </label>

              <label class="b360-field">
                <span class="b360-field-label">Địa chỉ <span class="req">*</span></span>
                <input type="text" class="b360-input" formControlName="address" placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" autocomplete="street-address" />
                @if (form.controls.address.touched && form.controls.address.invalid) {
                  <small class="b360-field-error">Vui lòng nhập địa chỉ đầy đủ.</small>
                }
              </label>

              <div class="b360-row b360-row--gap-md" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <label class="b360-field">
                  <span class="b360-field-label">Giờ mở cửa <span class="req">*</span></span>
                  <input type="time" class="b360-input" formControlName="openTime" />
                </label>
                <label class="b360-field">
                  <span class="b360-field-label">Giờ đóng cửa <span class="req">*</span></span>
                  <input type="time" class="b360-input" formControlName="closeTime" />
                </label>
              </div>

              <div class="b360-field">
                <span class="b360-field-label">Vị trí GPS (tuỳ chọn)</span>
                <button type="button" class="b360-btn b360-btn--dark b360-btn--block" (click)="useLocation()" [disabled]="locating()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>
                  </svg>
                  @if (locating()) { Đang định vị... }
                  @else if (form.controls.lat.value !== null) { ✓ Đã lấy vị trí GPS }
                  @else { Lấy vị trí GPS hiện tại }
                </button>
                <small class="b360-mute2" style="font-size:.78rem;">Giúp khách tìm quán bằng "Tìm gần tôi". Có thể bỏ qua, cấu hình sau.</small>
              </div>

              <hr class="b360-divider" />

              <button type="submit"
                      class="b360-btn b360-btn--primary b360-btn--lg b360-btn--block"
                      [disabled]="submitting() || form.invalid">
                @if (submitting()) { Đang đăng ký... }
                @else {
                  Đăng ký quán miễn phí
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                }
              </button>

              @if (errorMessage()) {
                <div class="b360-notice b360-notice--danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <p class="b360-mute2" style="font-size:.78rem; text-align:center; margin:0;">
                Bằng cách đăng ký, bạn đồng ý với điều khoản sử dụng cơ bản của book360. Không có ràng buộc tài chính.
              </p>
            </form>
          </div>
        }

        <p style="text-align:center; margin-top:2rem; color:var(--b360-fg-muted); font-size:.92rem;">
          Đã đăng ký rồi nhưng mất link?
          <a routerLink="/shop/recover" class="brand-link">Khôi phục liên kết quản lý</a>
        </p>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .brand-mark { color: var(--b360-brand); }
    .brand-link { color: var(--b360-brand); font-weight: 600; }
    .req { color: var(--b360-brand); }
    .back-link {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: 0 0 1rem;
      text-decoration: none;
      color: var(--b360-fg-on-dark-muted);
      font-size: .9rem; font-weight: 500;
    }
    .back-link:hover { color: #fff; }
    .why-list {
      list-style: none; padding: 0; margin: 1.5rem 0 0;
      display: grid; gap: .55rem;
      color: var(--b360-fg-on-dark);
    }
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

    .success-card {
      padding: clamp(1.5rem, 3vw, 2.25rem);
      background: linear-gradient(135deg, var(--b360-bg) 0%, var(--b360-success-bg) 100%);
      border: 1px solid rgba(22,163,74,.25);
    }
    .success-head { text-align: center; margin-bottom: 1.25rem; }
    .success-emoji { font-size: 3rem; line-height: 1; }
    .b360-h1 em { font-style: normal; color: var(--b360-brand); }

    .link-block {
      padding: 1rem 1.15rem;
      background: var(--b360-bg);
      border: 1px solid var(--b360-line);
      border-radius: var(--b360-r-md);
      margin-top: 1rem;
    }
    .link-label {
      display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
      margin-bottom: .65rem;
      font-size: .9rem;
    }
    .link-label svg { color: var(--b360-brand); }
    .link-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .link-row .b360-input { flex: 1 1 280px; min-width: 0; font-size: .85rem; font-family: ui-monospace, SFMono-Regular, monospace; }
  `]
})
export class ShopRegisterPageComponent {
  private readonly api = inject(Booking360ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly locating = signal(false);
  protected readonly success = signal<ShopRegistrationResponse | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly copiedKey = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9 \-]{9,15}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    openTime: ['07:00', [Validators.required]],
    closeTime: ['22:00', [Validators.required]],
    lat: [null as number | null],
    lng: [null as number | null]
  });

  async useLocation(): Promise<void> {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    this.locating.set(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
      });
      this.form.patchValue({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      // ignore – field is optional
    } finally {
      this.locating.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const v = this.form.getRawValue();
      const result = await this.api.registerPublicShop({
        name: v.name.trim(),
        phone: v.phone.trim(),
        address: v.address.trim(),
        lat: v.lat,
        lng: v.lng,
        openTime: v.openTime,
        closeTime: v.closeTime
      });
      this.success.set(result);
      // Smooth scroll to top so the user sees the success state
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Không thể đăng ký, vui lòng thử lại.');
    } finally {
      this.submitting.set(false);
    }
  }

  manageUrl(r: ShopRegistrationResponse): string {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/m/${r.shopAccessToken}`
      : `/m/${r.shopAccessToken}`;
  }
  publicUrl(r: ShopRegistrationResponse): string {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/shops/${r.slug}`
      : `/shops/${r.slug}`;
  }
  async copy(input: HTMLInputElement, key: string): Promise<void> {
    try {
      input.select();
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(input.value);
      } else {
        document.execCommand('copy');
      }
      this.copiedKey.set(key);
      setTimeout(() => { if (this.copiedKey() === key) this.copiedKey.set(null); }, 2000);
    } catch {
      // ignore
    }
  }
}