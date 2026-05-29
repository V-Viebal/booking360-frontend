import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Booking360ApiService,
  PublicShopDetail,
  SlotListResponse,
  SlotResponse
} from '../booking360-api.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page" *ngIf="shop() as s">
      <a routerLink="/shops" class="back-link">← Tất cả quán</a>
      <header class="page-head">
        <h1>{{ s.name }}</h1>
        <p class="muted">{{ s.address }}</p>
        <p class="muted">📞 {{ s.phone }} · ⏰ {{ s.openTime }} – {{ s.closeTime }}</p>
        @if (s.status !== 'active') {
          <p class="banner banner-warn">Quán đang tạm dừng nhận lịch.</p>
        } @else if (s.pausedUntil) {
          <p class="banner banner-warn">Quán tạm nghỉ tới {{ s.pausedUntil | date:'HH:mm dd/MM/yyyy' }}.</p>
        }
      </header>

      <div class="grid">
        <div class="card">
          <h2>Chọn khung giờ</h2>
          <label class="field">
            <span>Ngày</span>
            <input type="date" [value]="selectedDate()" (change)="onDateChange($any($event.target).value)" />
          </label>
          @if (slotsLoading()) {
            <p class="muted">Đang tải khung giờ...</p>
          } @else if (slotList()?.slots?.length === 0) {
            <p class="muted">Hôm nay chưa có khung giờ nào khả dụng.</p>
          } @else {
            <div class="slots">
              @for (slot of slotList()?.slots ?? []; track slot.slotTime) {
                <button
                  type="button"
                  class="slot-chip"
                  [class.slot-chip--selected]="isSelected(slot)"
                  [class.slot-chip--full]="!slot.available"
                  [disabled]="!slot.available"
                  (click)="selectSlot(slot)">
                  {{ slot.slotTime | date:'HH:mm' }}
                  <small>{{ slot.onlineCount }}/{{ slot.capacity }}</small>
                </button>
              }
            </div>
          }
        </div>

        <div class="card">
          <h2>Thông tin của bạn</h2>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label class="field">
              <span>Họ tên *</span>
              <input type="text" formControlName="customerName" placeholder="Nguyễn Văn A" />
              @if (form.controls.customerName.touched && form.controls.customerName.invalid) {
                <small class="err">Vui lòng nhập họ tên (ít nhất 2 ký tự).</small>
              }
            </label>
            <label class="field">
              <span>Số điện thoại *</span>
              <input type="tel" formControlName="customerPhone" placeholder="0901 234 567" inputmode="tel" />
              @if (form.controls.customerPhone.touched && form.controls.customerPhone.invalid) {
                <small class="err">Số điện thoại không hợp lệ.</small>
              }
            </label>
            <label class="field">
              <span>Ghi chú (tuỳ chọn)</span>
              <textarea formControlName="note" rows="2" placeholder="Bàn 2 người, gần cửa sổ..."></textarea>
            </label>

            @if (selectedSlot()) {
              <p class="summary">
                Bạn đang đặt: <strong>{{ selectedSlot()!.slotTime | date:'HH:mm dd/MM/yyyy' }}</strong>
              </p>
            }

            <button type="submit" class="btn btn-primary" [disabled]="submitting() || !selectedSlot() || form.invalid">
              {{ submitting() ? 'Đang đặt...' : 'Xác nhận đặt chỗ' }}
            </button>
            @if (errorMessage()) {
              <p class="err">{{ errorMessage() }}</p>
            }
          </form>
        </div>
      </div>
    </section>

    @if (loading()) {
      <p class="muted page">Đang tải thông tin quán...</p>
    } @else if (notFound()) {
      <p class="muted page">Không tìm thấy quán này. <a routerLink="/shops">Quay lại danh sách</a></p>
    }
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 2rem 1rem 4rem; max-width: 1100px; margin: 0 auto; }
    .back-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .page-head h1 { margin: 0.75rem 0 0.25rem; }
    .muted { color: #6b7280; }
    .banner { padding: 0.6rem 0.85rem; border-radius: 8px; margin-top: 0.75rem; }
    .banner-warn { background: #fef3c7; color: #92400e; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1.5rem; }
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; }
    .card h2 { margin: 0 0 0.75rem; font-size: 1.15rem; }
    .field { display: block; margin-bottom: 0.85rem; }
    .field span { display: block; font-size: 0.9rem; color: #374151; margin-bottom: 0.25rem; }
    .field input, .field textarea { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; box-sizing: border-box; }
    .err { color: #dc2626; font-size: 0.85rem; display: block; margin-top: 0.4rem; }
    .slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 0.5rem; }
    .slot-chip { padding: 0.55rem 0.6rem; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; font: inherit; line-height: 1.2; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .slot-chip small { color: #6b7280; font-size: 0.75rem; }
    .slot-chip--selected { background: #2563eb; color: #fff; border-color: #2563eb; }
    .slot-chip--selected small { color: #dbeafe; }
    .slot-chip--full { opacity: 0.45; cursor: not-allowed; text-decoration: line-through; }
    .summary { margin: 0.75rem 0; color: #1f2937; }
    .btn { padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 600; border: 0; cursor: pointer; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ShopDetailPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly shop = signal<PublicShopDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly slotList = signal<SlotListResponse | null>(null);
  protected readonly slotsLoading = signal(false);
  protected readonly selectedSlot = signal<SlotResponse | null>(null);
  protected readonly selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^[+0-9 \-]{9,15}$/)]],
    note: ['']
  });

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!slug) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    try {
      const detail = await this.api.getPublicShop(slug);
      this.shop.set(detail);
      await this.loadSlots(detail.slug, this.selectedDate());
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async onDateChange(value: string): Promise<void> {
    this.selectedDate.set(value);
    this.selectedSlot.set(null);
    const shop = this.shop();
    if (shop) {
      await this.loadSlots(shop.slug, value);
    }
  }

  private async loadSlots(slug: string, date: string): Promise<void> {
    this.slotsLoading.set(true);
    try {
      const list = await this.api.listPublicShopSlots(slug, date);
      this.slotList.set(list);
    } catch {
      this.slotList.set(null);
    } finally {
      this.slotsLoading.set(false);
    }
  }

  isSelected(slot: SlotResponse): boolean {
    return this.selectedSlot()?.slotTime === slot.slotTime;
  }

  selectSlot(slot: SlotResponse): void {
    if (!slot.available) return;
    this.selectedSlot.set(slot);
  }

  async submit(): Promise<void> {
    const shop = this.shop();
    const slot = this.selectedSlot();
    if (!shop || !slot) {
      this.errorMessage.set('Vui lòng chọn khung giờ.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const booking = await this.api.createPublicBooking({
        shopId: shop.id,
        customerName: this.form.controls.customerName.value.trim(),
        customerPhone: this.form.controls.customerPhone.value.trim(),
        slotTime: slot.slotTime,
        note: this.form.controls.note.value?.trim() || null
      });
      await this.router.navigate(['/b', booking.bookingToken]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đặt chỗ, vui lòng thử lại.';
      this.errorMessage.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}