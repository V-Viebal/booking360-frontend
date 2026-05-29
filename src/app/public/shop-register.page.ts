import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Booking360ApiService, ShopRegistrationResponse } from '../booking360-api.service';

@Component({
  selector: 'app-shop-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/" class="back-link">← Trang chủ</a>
      <header class="page-head">
        <h1>Đăng ký quán của bạn lên Booking360</h1>
        <p class="muted">Miễn phí, không cần cài app. Chỉ mất 1 phút để có liên kết quản lý lịch đặt.</p>
      </header>

      @if (success(); as result) {
        <div class="card success">
          <h2>🎉 Đăng ký thành công</h2>
          <p>Quán <strong>{{ result.name }}</strong> đã được tạo. Lưu ngay liên kết quản lý dưới đây – chúng tôi không gửi mật khẩu, bạn cần tự lưu liên kết này.</p>

          <div class="link-box">
            <label>Liên kết quản lý (chỉ bạn giữ):</label>
            <input type="text" readonly [value]="manageUrl(result)" #urlInput />
            <button type="button" class="btn btn-light" (click)="copy(urlInput)">Sao chép</button>
          </div>

          <div class="link-box">
            <label>Trang công khai của quán:</label>
            <input type="text" readonly [value]="publicUrl(result)" #pubInput />
            <button type="button" class="btn btn-light" (click)="copy(pubInput)">Sao chép</button>
          </div>

          <div class="cta-row">
            <a [routerLink]="['/m', result.shopAccessToken]" class="btn btn-primary">Vào trang quản lý</a>
            <a [routerLink]="['/shops', result.slug]" class="btn btn-secondary">Xem trang công khai</a>
          </div>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="card">
          <label class="field">
            <span>Tên quán *</span>
            <input type="text" formControlName="name" placeholder="Cà phê Sài Gòn 1975" />
            @if (form.controls.name.touched && form.controls.name.invalid) {
              <small class="err">Tên quán phải có ít nhất 2 ký tự.</small>
            }
          </label>

          <label class="field">
            <span>Số điện thoại liên hệ *</span>
            <input type="tel" formControlName="phone" placeholder="0901 234 567" inputmode="tel" />
            @if (form.controls.phone.touched && form.controls.phone.invalid) {
              <small class="err">Số điện thoại không hợp lệ.</small>
            }
          </label>

          <label class="field">
            <span>Địa chỉ *</span>
            <input type="text" formControlName="address" placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" />
            @if (form.controls.address.touched && form.controls.address.invalid) {
              <small class="err">Vui lòng nhập địa chỉ đầy đủ.</small>
            }
          </label>

          <div class="field-row">
            <label class="field">
              <span>Giờ mở cửa *</span>
              <input type="time" formControlName="openTime" />
            </label>
            <label class="field">
              <span>Giờ đóng cửa *</span>
              <input type="time" formControlName="closeTime" />
            </label>
          </div>

          <label class="field">
            <span>Vị trí (tuỳ chọn)</span>
            <button type="button" class="btn btn-light" (click)="useLocation()" [disabled]="locating()">
              {{ locating() ? 'Đang định vị...' : (form.controls.lat.value ? '✓ Đã lấy vị trí' : 'Lấy vị trí GPS') }}
            </button>
            <small class="muted">Giúp khách tìm quán bằng "Tìm gần tôi".</small>
          </label>

          <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
            {{ submitting() ? 'Đang đăng ký...' : 'Đăng ký quán miễn phí' }}
          </button>
          @if (errorMessage()) {
            <p class="err">{{ errorMessage() }}</p>
          }
        </form>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 2rem 1rem 4rem; max-width: 720px; margin: 0 auto; }
    .back-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .page-head h1 { margin: 0.75rem 0 0.25rem; }
    .muted { color: #6b7280; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
    .card h2 { margin: 0 0 0.5rem; }
    .field { display: block; margin-bottom: 0.85rem; }
    .field span { display: block; font-size: 0.9rem; color: #374151; margin-bottom: 0.25rem; font-weight: 500; }
    .field input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; box-sizing: border-box; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .err { color: #dc2626; font-size: 0.85rem; display: block; margin-top: 0.4rem; }
    .btn { padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 600; border: 0; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #fff; border: 1px solid #2563eb; color: #2563eb; }
    .btn-light { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; }
    .success { border-color: #16a34a; background: #f0fdf4; }
    .link-box { margin: 1rem 0; }
    .link-box label { display: block; font-size: 0.85rem; color: #374151; margin-bottom: 0.25rem; font-weight: 500; }
    .link-box input { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; font-size: 0.85rem; box-sizing: border-box; }
    .link-box button { margin-top: 0.4rem; }
    .cta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.25rem; }
  `]
})
export class ShopRegisterPageComponent {
  private readonly api = inject(Booking360ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly locating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly success = signal<ShopRegistrationResponse | null>(null);

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
    if (!('geolocation' in navigator)) return;
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

  async copy(input: HTMLInputElement): Promise<void> {
    input.select();
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      document.execCommand('copy');
    }
  }
}