import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Booking360ApiService,
  ShopBookingRow,
  ShopOwnerView,
  ShopTodayResponse,
  SlotResponse
} from '../booking360-api.service';

@Component({
  selector: 'app-shop-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      @if (loading()) {
        <p class="muted">Đang tải trang quản lý...</p>
      } @else if (notFound()) {
        <div class="card warn">
          <h1>Liên kết quản lý không hợp lệ</h1>
          <p>Vui lòng kiểm tra lại liên kết quản lý hoặc liên hệ Booking360.</p>
          <a routerLink="/" class="btn btn-primary">Về trang chủ</a>
        </div>
      } @else if (today(); as t) {
        <header class="page-head">
          <span class="kicker">Trang quản lý của quán</span>
          <h1>{{ t.shop.name }}</h1>
          <p class="muted">{{ t.shop.address }} · 📞 {{ t.shop.phone }}</p>
          <div class="quick-stats">
            <span class="stat">Hôm nay: <strong>{{ totalToday(t) }} lượt</strong></span>
            <span class="stat">Đang chờ: <strong>{{ countByStatus(t, 'pending') + countByStatus(t, 'confirmed') }}</strong></span>
            <span class="stat">Đã huỷ: <strong>{{ countByStatus(t, 'cancelled') }}</strong></span>
            <span class="stat">Trạng thái:
              <strong [class.online]="t.shop.status === 'active'" [class.offline]="t.shop.status !== 'active'">
                {{ t.shop.status === 'active' ? 'Mở nhận lịch' : 'Đang tạm dừng' }}
              </strong>
            </span>
          </div>
        </header>

        <nav class="tabs">
          <button type="button" [class.active]="tab() === 'today'" (click)="tab.set('today')">Lịch hôm nay</button>
          <button type="button" [class.active]="tab() === 'config'" (click)="tab.set('config')">Cấu hình quán</button>
          <button type="button" [class.active]="tab() === 'share'" (click)="tab.set('share')">Chia sẻ liên kết</button>
        </nav>

        @if (tab() === 'today') {
          <div class="card">
            <div class="head-row">
              <h2>Lịch ngày {{ t.date }}</h2>
              <input type="date" [value]="selectedDate()" (change)="onDateChange($any($event.target).value)" />
            </div>
            @if (t.bookings.length === 0) {
              <p class="muted">Chưa có lượt đặt nào trong ngày này.</p>
            } @else {
              <table class="bookings">
                <thead>
                  <tr>
                    <th>Giờ</th>
                    <th>Khách</th>
                    <th>SĐT</th>
                    <th>Ghi chú</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of t.bookings; track b.bookingToken) {
                    <tr [class.cancelled]="b.status === 'cancelled'">
                      <td>{{ b.slotTime | date:'HH:mm' }}</td>
                      <td>{{ b.customerName }}</td>
                      <td>{{ b.customerPhone }}</td>
                      <td>{{ b.note || '–' }}</td>
                      <td><span class="badge badge--{{ b.status }}">{{ statusLabel(b.status) }}</span></td>
                      <td>
                        @if (b.status === 'pending' || b.status === 'confirmed') {
                          <button type="button" class="btn-link" (click)="cancelBooking(b)">Huỷ</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <div class="card">
            <h2>Khung giờ {{ t.date }}</h2>
            @if (t.slots.length === 0) {
              <p class="muted">Hôm nay không có khung giờ nào.</p>
            } @else {
              <div class="slots">
                @for (slot of t.slots; track slot.slotTime) {
                  <div class="slot-pill" [class.full]="!slot.available">
                    {{ slot.slotTime | date:'HH:mm' }}
                    <small>{{ slot.onlineCount }}/{{ slot.capacity }}</small>
                  </div>
                }
              </div>
            }
          </div>
        }

        @if (tab() === 'config') {
          <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="card">
            <h2>Cấu hình quán</h2>
            <div class="grid-2">
              <label class="field">
                <span>Giờ mở cửa</span>
                <input type="time" formControlName="openTime" />
              </label>
              <label class="field">
                <span>Giờ đóng cửa</span>
                <input type="time" formControlName="closeTime" />
              </label>
              <label class="field">
                <span>Thời lượng mỗi slot (phút)</span>
                <input type="number" min="5" max="240" formControlName="slotDurationMinutes" />
              </label>
              <label class="field">
                <span>Khách online tối đa / slot</span>
                <input type="number" min="1" max="50" formControlName="maxOnlinePerSlot" />
              </label>
              <label class="field">
                <span>Đóng cửa sớm hôm nay (tuỳ chọn)</span>
                <input type="time" formControlName="earlyCloseToday" />
              </label>
              <label class="field">
                <span>Tạm nghỉ tới (tuỳ chọn)</span>
                <input type="datetime-local" formControlName="pausedUntil" />
              </label>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="savingConfig()">
              {{ savingConfig() ? 'Đang lưu...' : 'Lưu cấu hình' }}
            </button>
            @if (configMessage()) {
              <p class="ok">{{ configMessage() }}</p>
            }
            @if (configError()) {
              <p class="err">{{ configError() }}</p>
            }
          </form>
        }

        @if (tab() === 'share') {
          <div class="card">
            <h2>Chia sẻ liên kết quán</h2>
            <p class="muted">Gửi liên kết này cho khách để họ đặt lịch trực tiếp.</p>
            <input type="text" readonly [value]="publicShopUrl(t.shop)" #pubInput />
            <button type="button" class="btn btn-light" (click)="copy(pubInput)">Sao chép liên kết công khai</button>

            <h2 style="margin-top:1.25rem">Liên kết quản lý của bạn</h2>
            <p class="muted">Lưu liên kết này, không chia sẻ cho khách. Đây là cách bạn vào trang quản lý.</p>
            <input type="text" readonly [value]="manageUrl()" #mngInput />
            <button type="button" class="btn btn-light" (click)="copy(mngInput)">Sao chép liên kết quản lý</button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 2rem 1rem 4rem; max-width: 980px; margin: 0 auto; }
    .muted { color: #6b7280; }
    .kicker { color: #2563eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; }
    h1 { margin: 0.4rem 0 0.25rem; font-size: 1.6rem; }
    .quick-stats { display: flex; gap: 1.25rem; flex-wrap: wrap; margin-top: 0.85rem; color: #374151; }
    .stat .online { color: #16a34a; }
    .stat .offline { color: #b45309; }
    .tabs { display: flex; gap: 0.25rem; margin: 1.25rem 0 1rem; border-bottom: 1px solid #e5e7eb; }
    .tabs button { padding: 0.6rem 1rem; border: 0; background: transparent; cursor: pointer; font: inherit; color: #4b5563; border-bottom: 2px solid transparent; }
    .tabs button.active { color: #2563eb; border-color: #2563eb; font-weight: 600; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
    .card.warn { border-color: #f59e0b; background: #fffbeb; }
    .head-row { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .head-row h2 { margin: 0; font-size: 1.15rem; }
    .head-row input { padding: 0.4rem 0.6rem; border: 1px solid #d1d5db; border-radius: 8px; }
    .bookings { width: 100%; border-collapse: collapse; }
    .bookings th, .bookings td { padding: 0.55rem 0.6rem; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 0.95rem; }
    .bookings th { color: #6b7280; font-weight: 500; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .bookings tr.cancelled { color: #9ca3af; text-decoration: line-through; }
    .badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.8rem; font-weight: 500; }
    .badge--pending { background: #fef3c7; color: #92400e; }
    .badge--confirmed { background: #dcfce7; color: #166534; }
    .badge--cancelled { background: #fee2e2; color: #991b1b; }
    .badge--completed { background: #e0e7ff; color: #3730a3; }
    .btn-link { background: transparent; border: 0; color: #dc2626; cursor: pointer; font-weight: 500; padding: 0; }
    .slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 0.5rem; }
    .slot-pill { padding: 0.5rem 0.6rem; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; text-align: center; line-height: 1.2; }
    .slot-pill small { display: block; color: #6b7280; font-size: 0.75rem; margin-top: 2px; }
    .slot-pill.full { background: #f3f4f6; color: #9ca3af; }
    .field { display: block; margin-bottom: 0.85rem; }
    .field span { display: block; font-size: 0.9rem; color: #374151; margin-bottom: 0.25rem; font-weight: 500; }
    .field input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; box-sizing: border-box; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
    .btn { padding: 0.65rem 1.1rem; border-radius: 8px; font-weight: 600; border: 0; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-light { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; }
    .ok { color: #16a34a; margin-top: 0.5rem; }
    .err { color: #dc2626; margin-top: 0.5rem; }
    input[readonly] { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; font-size: 0.85rem; box-sizing: border-box; margin: 0.4rem 0; }
  `]
})
export class ShopManagePageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly today = signal<ShopTodayResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly tab = signal<'today' | 'config' | 'share'>('today');
  protected readonly selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly savingConfig = signal(false);
  protected readonly configMessage = signal<string | null>(null);
  protected readonly configError = signal<string | null>(null);
  private accessToken = '';

  protected readonly configForm = this.fb.nonNullable.group({
    openTime: ['07:00'],
    closeTime: ['22:00'],
    slotDurationMinutes: [30, [Validators.min(5), Validators.max(240)]],
    maxOnlinePerSlot: [3, [Validators.min(1), Validators.max(50)]],
    earlyCloseToday: [''],
    pausedUntil: ['']
  });

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.accessToken = token;
    if (!token) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const t = await this.api.getShopToday(this.accessToken, this.selectedDate());
      this.today.set(t);
      this.configForm.patchValue({
        openTime: t.shop.openTime,
        closeTime: t.shop.closeTime,
        slotDurationMinutes: t.shop.slotDurationMinutes,
        maxOnlinePerSlot: t.shop.maxOnlinePerSlot,
        earlyCloseToday: t.shop.earlyCloseToday ?? '',
        pausedUntil: t.shop.pausedUntil ? t.shop.pausedUntil.slice(0, 16) : ''
      });
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async onDateChange(value: string): Promise<void> {
    this.selectedDate.set(value);
    await this.refresh();
  }

  async cancelBooking(b: ShopBookingRow): Promise<void> {
    const reason = prompt('Lý do huỷ (gửi tới khách):', '') ?? '';
    if (!confirm(`Xác nhận huỷ lịch của ${b.customerName} lúc ${b.slotTime}?`)) return;
    try {
      await this.api.cancelBookingFromShop(this.accessToken, b.bookingToken, reason);
      await this.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể huỷ lịch.');
    }
  }

  async saveConfig(): Promise<void> {
    this.savingConfig.set(true);
    this.configMessage.set(null);
    this.configError.set(null);
    try {
      const v = this.configForm.getRawValue();
      await this.api.updateShopConfig(this.accessToken, {
        openTime: v.openTime || undefined,
        closeTime: v.closeTime || undefined,
        slotDurationMinutes: v.slotDurationMinutes ?? undefined,
        maxOnlinePerSlot: v.maxOnlinePerSlot ?? undefined,
        earlyCloseToday: v.earlyCloseToday || undefined,
        pausedUntil: v.pausedUntil ? new Date(v.pausedUntil).toISOString() : null
      });
      this.configMessage.set('Đã lưu cấu hình.');
      await this.refresh();
    } catch (err) {
      this.configError.set(err instanceof Error ? err.message : 'Không thể lưu cấu hình.');
    } finally {
      this.savingConfig.set(false);
    }
  }

  totalToday(t: ShopTodayResponse): number { return t.bookings.length; }
  countByStatus(t: ShopTodayResponse, status: string): number { return t.bookings.filter(b => b.status === status).length; }

  statusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã huỷ';
      case 'completed': return 'Đã hoàn thành';
      default: return status;
    }
  }

  publicShopUrl(shop: ShopOwnerView): string {
    if (typeof window === 'undefined') return shop.publicUrl;
    return `${window.location.origin}/shops/${shop.slug}`;
  }

  manageUrl(): string {
    if (typeof window === 'undefined') return `/m/${this.accessToken}`;
    return `${window.location.origin}/m/${this.accessToken}`;
  }

  async copy(input: HTMLInputElement): Promise<void> {
    input.select();
    try { await navigator.clipboard.writeText(input.value); }
    catch { document.execCommand('copy'); }
  }
}