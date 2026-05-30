import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Booking360ApiService,
  PublicShopDetail,
  SlotListResponse,
  SlotResponse,
  PublicReview,
  ShopReviewsResponse
} from '../booking360-api.service';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    @if (shop(); as s) {
      <!-- ============ HERO GALLERY ============ -->
      <section class="b360-hero" style="padding: 0; background: var(--b360-bg-darker);">
        <div class="b360-container">
          <a routerLink="/shops" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Tất cả quán
          </a>

          <div class="hero-grid">
            <div class="gallery-block">
              @if (gallery().length > 0) {
                <figure class="gallery-hero">
                  <img [src]="activePhoto()" [alt]="s.name" loading="eager" fetchpriority="high"/>
                </figure>
                @if (gallery().length > 1) {
                  <div class="gallery-thumbs" role="tablist" aria-label="Bộ ảnh quán">
                    @for (url of gallery(); track url; let i = $index) {
                      <button type="button"
                              class="thumb"
                              [class.thumb--active]="i === activeIndex()"
                              (click)="setActiveIndex(i)"
                              [attr.aria-selected]="i === activeIndex()"
                              [attr.aria-label]="'Ảnh ' + (i + 1)">
                        <img [src]="url" [alt]="s.name + ' ' + (i + 1)" loading="lazy" />
                      </button>
                    }
                  </div>
                }
              } @else {
                <figure class="gallery-hero gallery-empty">
                  <span class="initial">{{ s.name.charAt(0) }}</span>
                </figure>
              }
            </div>

            <aside class="info-block">
              <span class="b360-eyebrow">Barbershop</span>
              <h1 class="b360-h1" style="color:#fff; margin-top:.5rem;">{{ s.name }}</h1>

              <ul class="info-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><circle cx="12" cy="11" r="3"/><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/></svg>
                  <span>{{ s.address }}</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  <span>Mở cửa <strong>{{ s.openTime }} – {{ s.closeTime }}</strong></span>
                </li>
                @if (s.phone) {
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="M22 16.92V20a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h3.09a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
                    <a [href]="'tel:' + s.phone">{{ s.phone }}</a>
                  </li>
                }
              </ul>

              <div class="badges-row">
                @if (s.district) { <span class="b360-badge b360-badge--brand">{{ s.district }}</span> }
                @if (s.priceSegment) { <span class="b360-badge">{{ s.priceSegment }}</span> }
                @if (s.status === 'active' && !s.pausedUntil) {
                  <span class="b360-badge b360-badge--success b360-badge--dot">Đang mở</span>
                }
              </div>

              <div class="rating-row">
                @if ((s.reviewCount ?? 0) > 0) {
                  <div class="rating-block">
                    <div class="rating-num">{{ (s.happyScore ?? 0) | number:'1.1-2' }}</div>
                    <div class="rating-meta">
                      <div class="b360-stars" aria-hidden="true">
                        @for (n of [1,2,3,4,5]; track n) {
                          <span [class.on]="n <= Math.round(s.happyScore ?? 0)">★</span>
                        }
                      </div>
                      <div class="rating-count">{{ s.reviewCount }} đánh giá thật</div>
                    </div>
                  </div>
                } @else {
                  <div class="rating-block">
                    <div class="rating-num" style="font-size:1.5rem; color: var(--b360-fg-on-dark-muted);">—</div>
                    <div class="rating-meta">
                      <div class="rating-count" style="color: var(--b360-fg-on-dark-muted);">Chưa có đánh giá</div>
                    </div>
                  </div>
                }
                @if (s.reliability && s.reliability.badge !== 'unknown') {
                  <div class="reliability-pill" [attr.data-tier]="s.reliability.badge">
                    {{ reliabilityLabel(s.reliability.badge) }}
                    <small>{{ s.reliability.cancelCount30d }}/{{ s.reliability.totalBookings30d }} 30N</small>
                  </div>
                }
              </div>

              @if (s.status !== 'active') {
                <div class="b360-notice b360-notice--warning" style="margin-top:1.25rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  <div>
                    <strong>Quán đang tạm dừng nhận lịch</strong>
                    <div>Bạn có thể quay lại sau khi quán mở cửa.</div>
                  </div>
                </div>
              } @else if (s.pausedUntil) {
                <div class="b360-notice b360-notice--warning" style="margin-top:1.25rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  <div>Quán tạm nghỉ tới <strong>{{ s.pausedUntil | date:'HH:mm dd/MM/yyyy' }}</strong></div>
                </div>
              }
            </aside>
          </div>
        </div>
      </section>

      <!-- ============ BOOKING + DETAILS ============ -->
      <section class="b360-section">
        <div class="b360-container">
          <div class="booking-grid">
            <!-- Booking column (sticky on desktop) -->
            <div class="booking-col">
              <div class="b360-card booking-card">
                <h2 class="b360-h2" style="margin-bottom:1rem;">Đặt lịch trong 30 giây</h2>

                <label class="b360-field" style="margin-bottom:1rem;">
                  <span class="b360-field-label">📅 Ngày đặt</span>
                  <input type="date"
                         class="b360-input"
                         [value]="selectedDate()"
                         [min]="todayDate()"
                         (change)="onDateChange($any($event.target).value)" />
                </label>

                <div class="b360-field-label" style="margin-bottom:.5rem;">
                  ⏰ Khung giờ
                  <span style="float:right; font-weight:400; color: var(--b360-fg-mute2);">30 phút/slot</span>
                </div>

                @if (slotsLoading()) {
                  <div class="b360-slots">
                    @for (i of [1,2,3,4,5,6,7,8]; track i) {
                      <div class="b360-skeleton" style="height:48px"></div>
                    }
                  </div>
                } @else if ((slotList()?.slots ?? []).length === 0) {
                  <div class="b360-empty" style="padding: 1.5rem;">
                    <div class="icon">⏰</div>
                    <h3 style="font-size:1rem;">Hôm nay không có khung giờ</h3>
                    <p>Hãy thử ngày khác.</p>
                  </div>
                } @else {
                  <div class="b360-slots" role="listbox" aria-label="Chọn khung giờ">
                    @for (slot of slotList()?.slots ?? []; track slot.slotTime) {
                      <button type="button"
                              role="option"
                              class="b360-slot"
                              [class.b360-slot--active]="isSelected(slot)"
                              [class.b360-slot--full]="!slot.available"
                              [attr.aria-selected]="isSelected(slot)"
                              [disabled]="!slot.available"
                              (click)="selectSlot(slot)">
                        <span>{{ slot.slotTime | date:'HH:mm' }}</span>
                      </button>
                    }
                  </div>
                  <div class="slot-legend">
                    <span><i class="dot dot-on"></i>Còn chỗ</span>
                    <span><i class="dot dot-off"></i>Đã đầy</span>
                    <span><i class="dot dot-active"></i>Đang chọn</span>
                  </div>
                }

                @if (selectedSlot(); as slot) {
                  <div class="selected-slot">
                    <strong>Bạn chọn:</strong> {{ slot.slotTime | date:'HH:mm' }} ngày {{ slot.slotTime | date:'EEEE dd/MM/yyyy':'+0700':'vi' }}
                  </div>
                }

                <hr class="b360-divider" />

                <form [formGroup]="form" (ngSubmit)="submit()" class="b360-stack">
                  <label class="b360-field">
                    <span class="b360-field-label">Họ tên *</span>
                    <input type="text" class="b360-input" formControlName="customerName" placeholder="Nguyễn Văn A" autocomplete="name" />
                    @if (form.controls.customerName.touched && form.controls.customerName.invalid) {
                      <small class="b360-field-error">Vui lòng nhập họ tên (ít nhất 2 ký tự).</small>
                    }
                  </label>
                  <label class="b360-field">
                    <span class="b360-field-label">Số điện thoại *</span>
                    <input type="tel" class="b360-input" formControlName="customerPhone" placeholder="0901 234 567" inputmode="tel" autocomplete="tel" />
                    @if (form.controls.customerPhone.touched && form.controls.customerPhone.invalid) {
                      <small class="b360-field-error">Số điện thoại không hợp lệ.</small>
                    }
                  </label>
                  <label class="b360-field">
                    <span class="b360-field-label">Ghi chú (tuỳ chọn)</span>
                    <textarea class="b360-textarea" formControlName="note" rows="2" placeholder="Cắt 4 phân, kiểu undercut..."></textarea>
                  </label>

                  <button type="submit"
                          class="b360-btn b360-btn--primary b360-btn--lg b360-btn--block"
                          [disabled]="submitting() || !selectedSlot() || form.invalid">
                    @if (submitting()) {
                      Đang đặt...
                    } @else {
                      Xác nhận đặt chỗ
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m9 18 6-6-6-6"/></svg>
                    }
                  </button>
                  @if (errorMessage()) {
                    <div class="b360-notice b360-notice--danger">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      <span>{{ errorMessage() }}</span>
                    </div>
                  }
                  <p class="b360-mute2" style="font-size:.78rem; text-align:center; margin:.5rem 0 0;">
                    Đặt chỗ miễn phí · Không trả trước · Hủy không tính phí
                  </p>
                </form>
              </div>
            </div>

            <!-- Details column -->
            <div class="details-col b360-stack-lg">

              <!-- Trust callout -->
              <div class="trust-row">
                <div class="trust-tile">
                  <div class="ico">⚡</div>
                  <div>
                    <strong>Xác nhận tức thì</strong>
                    <small>Nhận thông báo trên Zalo/SMS dưới 5 giây</small>
                  </div>
                </div>
                <div class="trust-tile">
                  <div class="ico">🔒</div>
                  <div>
                    <strong>Không trả trước</strong>
                    <small>Trả tiền trực tiếp ở quán, hủy miễn phí</small>
                  </div>
                </div>
                <div class="trust-tile">
                  <div class="ico">⭐</div>
                  <div>
                    <strong>Đánh giá thật</strong>
                    <small>Chỉ khách đặt qua book360 mới đánh giá được</small>
                  </div>
                </div>
              </div>

              <!-- Reviews -->
              <section class="b360-card b360-card--flat" style="background: var(--b360-bg-soft); padding: 1.5rem;">
                <div class="b360-spread" style="margin-bottom:1rem;">
                  <div>
                    <span class="b360-eyebrow">Đánh giá khách hàng</span>
                    <h2 class="b360-h2" style="margin:.25rem 0 0;">Khách nói gì về quán?</h2>
                  </div>
                  @if ((s.reviewCount ?? 0) > 0) {
                    <div style="text-align:right;">
                      <div style="font-family: var(--b360-font-display); font-size: 1.5rem; font-weight: 800; color: var(--b360-fg);">★ {{ (s.happyScore ?? 0) | number:'1.1-2' }}</div>
                      <div class="b360-mute2" style="font-size:.85rem;">{{ s.reviewCount }} đánh giá</div>
                    </div>
                  }
                </div>

                @if (reviewsLoading()) {
                  <div class="b360-stack">
                    <div class="b360-skeleton" style="height:80px"></div>
                    <div class="b360-skeleton" style="height:80px"></div>
                  </div>
                } @else if (reviews().length === 0) {
                  <div class="b360-empty">
                    <div class="icon">💬</div>
                    <h3>Chưa có đánh giá</h3>
                    <p>Hãy là khách đầu tiên đánh giá quán này sau khi cắt tóc.</p>
                  </div>
                } @else {
                  @for (r of reviews(); track r.id) {
                    <article class="b360-review">
                      <div class="b360-review-head">
                        <div class="b360-review-avatar">{{ (r.customerDisplay || 'K').charAt(0).toUpperCase() }}</div>
                        <div class="b360-review-meta">
                          <span class="name">{{ r.customerDisplay || 'Khách book360' }}</span>
                          <span class="when">{{ r.createdAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <span class="b360-stars" style="margin-left:auto;" [attr.aria-label]="r.rating + ' sao'">
                          @for (n of [1,2,3,4,5]; track n) {
                            <span [class.on]="n <= r.rating">★</span>
                          }
                        </span>
                      </div>
                      @if (r.comment) {
                        <p class="b360-review-body">{{ r.comment }}</p>
                      }
                      @if (r.shopReply) {
                        <div class="b360-review-reply">
                          <strong>Phản hồi của quán · {{ r.shopRepliedAt | date:'dd/MM/yyyy' }}</strong>
                          {{ r.shopReply }}
                        </div>
                      }
                      <div style="margin-top:.6rem;">
                        <button type="button"
                                class="b360-btn b360-btn--ghost b360-btn--sm"
                                [disabled]="reportingId() === r.id || reportedIds().has(r.id)"
                                (click)="report(r.id)">
                          {{ reportedIds().has(r.id) ? '✓ Đã báo cáo' : 'Báo cáo' }}
                        </button>
                      </div>
                    </article>
                  }
                }
              </section>
            </div>
          </div>
        </div>
      </section>

      <!-- Sticky mobile booking CTA -->
      @if (selectedSlot(); as slot) {
        <div class="b360-stickybar mobile-only">
          <div class="b360-stickybar-inner">
            <div>
              <div style="font-weight:700;">{{ slot.slotTime | date:'HH:mm' }} · {{ slot.slotTime | date:'dd/MM' }}</div>
              <div class="b360-mute2" style="font-size:.78rem;">{{ s.name }}</div>
            </div>
            <button type="button" class="b360-btn b360-btn--primary" (click)="scrollToBookingForm()">
              Tiếp tục
            </button>
          </div>
        </div>
      }
    } @else if (loading()) {
      <section class="b360-section">
        <div class="b360-container">
          <div class="b360-skeleton" style="height: 60vh; min-height: 380px; border-radius: var(--b360-r-lg);"></div>
        </div>
      </section>
    } @else if (notFound()) {
      <section class="b360-section">
        <div class="b360-container b360-container--narrow">
          <div class="b360-empty">
            <div class="icon">🔍</div>
            <h3>Không tìm thấy quán</h3>
            <p>Quán này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
            <a routerLink="/shops" class="b360-btn b360-btn--primary" style="margin-top:1rem;">Xem tất cả quán</a>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    :host { display: block; }
    .back-link {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: 1rem 0 .5rem;
      text-decoration: none;
      color: var(--b360-fg-on-dark-muted);
      font-size: .9rem;
      font-weight: 500;
    }
    .back-link:hover { color: #fff; }

    .hero-grid {
      display: grid; gap: 1.5rem;
      grid-template-columns: 1fr;
      padding-bottom: clamp(2rem, 4vw, 3rem);
    }
    @media (min-width: 880px) { .hero-grid { grid-template-columns: 1.15fr 1fr; gap: 2.25rem; } }

    .gallery-block { display: flex; flex-direction: column; gap: .65rem; }
    .gallery-hero {
      margin: 0;
      aspect-ratio: 4 / 3;
      border-radius: var(--b360-r-lg);
      overflow: hidden;
      background: linear-gradient(135deg, var(--b360-ink), var(--b360-bg-darker));
      box-shadow: var(--b360-shadow-lg);
    }
    .gallery-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-empty {
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.5);
    }
    .gallery-empty .initial {
      font-family: var(--b360-font-display); font-weight: 800;
      font-size: clamp(4rem, 12vw, 7rem); letter-spacing: -.04em;
    }
    .gallery-thumbs { display: flex; gap: .4rem; flex-wrap: wrap; }
    .thumb {
      width: 72px; height: 56px; padding: 0;
      border: 2px solid transparent;
      border-radius: var(--b360-r-sm);
      overflow: hidden;
      background: rgba(255,255,255,.05);
      cursor: pointer;
      transition: border-color .15s var(--b360-ease), opacity .15s var(--b360-ease);
      opacity: .6;
    }
    .thumb:hover { opacity: 1; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb--active { border-color: var(--b360-brand); opacity: 1; }

    .info-block { color: var(--b360-fg-on-dark); }
    .info-list { list-style: none; padding: 0; margin: 1.25rem 0 0; display: grid; gap: .65rem; }
    .info-list li { display: flex; align-items: flex-start; gap: .65rem; color: var(--b360-fg-on-dark-muted); }
    .info-list li svg { color: var(--b360-brand); flex-shrink: 0; margin-top: .15rem; }
    .info-list a { color: var(--b360-fg-on-dark); text-decoration: none; }
    .info-list a:hover { text-decoration: underline; }
    .info-list strong { color: #fff; }

    .badges-row { display: flex; gap: .4rem; flex-wrap: wrap; margin: 1.25rem 0 0; }

    .rating-row {
      margin-top: 1.5rem; padding-top: 1.25rem;
      border-top: 1px solid rgba(255,255,255,.08);
      display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem;
    }
    .rating-block { display: flex; align-items: center; gap: .85rem; }
    .rating-num { font-family: var(--b360-font-display); font-weight: 800; font-size: 2.5rem; line-height: 1; color: #fff; letter-spacing: -.02em; }
    .rating-meta { display: flex; flex-direction: column; gap: .15rem; }
    .rating-count { font-size: .82rem; color: var(--b360-fg-on-dark-muted); }
    .reliability-pill {
      padding: .55rem 1rem; border-radius: var(--b360-r-pill);
      background: rgba(255,255,255,.08);
      font-size: .85rem; font-weight: 600; color: #fff;
      display: inline-flex; flex-direction: column; gap: 2px; line-height: 1.2;
    }
    .reliability-pill[data-tier="excellent"] { background: rgba(22,163,74,.22); color: #86efac; }
    .reliability-pill[data-tier="good"]      { background: rgba(37,99,235,.22); color: #93c5fd; }
    .reliability-pill[data-tier="fair"]      { background: rgba(217,119,6,.22); color: #fcd34d; }
    .reliability-pill[data-tier="poor"]      { background: rgba(220,38,38,.22); color: #fca5a5; }
    .reliability-pill small { font-weight: 400; opacity: .8; font-size: .7rem; }

    /* ============ Booking layout ============ */
    .booking-grid {
      display: grid; gap: 2rem;
      grid-template-columns: 1fr;
    }
    @media (min-width: 960px) {
      .booking-grid { grid-template-columns: 1fr 1.05fr; }
      .booking-col { order: 1; }
      .details-col { order: 2; }
      .booking-card { position: sticky; top: calc(var(--b360-header-h) + 1rem); }
    }

    .booking-card { padding: 1.5rem; }
    .slot-legend {
      display: flex; gap: 1rem; flex-wrap: wrap;
      margin: .75rem 0 0; font-size: .78rem;
      color: var(--b360-fg-mute2);
    }
    .slot-legend span { display: inline-flex; align-items: center; gap: .35rem; }
    .slot-legend .dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; border: 1.5px solid var(--b360-line); }
    .slot-legend .dot-on { background: #fff; border-color: var(--b360-line); }
    .slot-legend .dot-active { background: var(--b360-brand); border-color: var(--b360-brand); }
    .slot-legend .dot-off { background: var(--b360-bg-soft); border-style: dashed; }

    .selected-slot {
      margin: 1rem 0 0;
      padding: .75rem 1rem;
      background: var(--b360-brand-50);
      border: 1px solid var(--b360-brand-100);
      border-radius: var(--b360-r-sm);
      color: var(--b360-brand-700);
      font-size: .92rem;
    }

    /* Trust tiles */
    .trust-row {
      display: grid; gap: .85rem;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
    .trust-tile {
      display: flex; gap: .85rem; align-items: flex-start;
      padding: 1rem 1.15rem;
      background: var(--b360-bg);
      border: 1px solid var(--b360-line);
      border-radius: var(--b360-r-md);
    }
    .trust-tile .ico { font-size: 1.6rem; line-height: 1; }
    .trust-tile strong { display: block; font-family: var(--b360-font-display); font-weight: 700; font-size: .98rem; color: var(--b360-fg); }
    .trust-tile small { display: block; font-size: .82rem; color: var(--b360-fg-muted); margin-top: 2px; }

    .mobile-only { display: none; }
    @media (max-width: 959px) {
      .mobile-only { display: block; }
    }
  `]
})
export class ShopDetailPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly Math = Math;
  protected readonly activeIndex = signal(0);

  protected readonly shop = signal<PublicShopDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly slotList = signal<SlotListResponse | null>(null);
  protected readonly slotsLoading = signal(false);
  protected readonly selectedSlot = signal<SlotResponse | null>(null);
  protected readonly selectedDate = signal<string>(new Date().toISOString().slice(0, 10));
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly reviews = signal<PublicReview[]>([]);
  protected readonly reviewsLoading = signal(false);
  protected readonly reportingId = signal<string | null>(null);
  protected readonly reportedIds = signal<Set<string>>(new Set<string>());

  protected readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^[+0-9 \-]{9,15}$/)]],
    note: ['']
  });

  protected todayDate(): string { return new Date().toISOString().slice(0, 10); }

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
      await Promise.all([
        this.loadSlots(detail.slug, this.selectedDate()),
        this.loadReviews(detail.slug),
      ]);
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

  scrollToBookingForm(): void {
    if (typeof document === 'undefined') return;
    document.querySelector('.booking-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  private async loadReviews(slug: string): Promise<void> {
    this.reviewsLoading.set(true);
    try {
      const res: ShopReviewsResponse = await this.api.listPublicShopReviews(slug, 20);
      this.reviews.set(res.reviews ?? []);
    } catch {
      this.reviews.set([]);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  gallery(): string[] {
    const s = this.shop();
    if (!s) return [];
    const list = (s.photoUrls ?? []).filter(u => !!u);
    if (list.length > 0) return list;
    return s.photoUrl ? [s.photoUrl] : [];
  }
  activePhoto(): string {
    const list = this.gallery();
    if (list.length === 0) return '';
    const i = Math.min(this.activeIndex(), list.length - 1);
    return list[i];
  }
  setActiveIndex(i: number): void { this.activeIndex.set(i); }

  reliabilityLabel(badge: string): string {
    switch (badge) {
      case 'excellent': return 'Rất uy tín';
      case 'good': return 'Uy tín';
      case 'fair': return 'Cần cải thiện';
      case 'poor': return 'Hay huỷ lịch';
      default: return '';
    }
  }

  async report(reviewId: string): Promise<void> {
    if (this.reportedIds().has(reviewId) || this.reportingId() === reviewId) return;
    if (typeof confirm === 'function' && !confirm('Báo cáo đánh giá này là không phù hợp?')) return;
    this.reportingId.set(reviewId);
    try {
      await this.api.reportPublicReview(reviewId);
      const next = new Set(this.reportedIds());
      next.add(reviewId);
      this.reportedIds.set(next);
    } catch {
      // intentionally swallow — UI surfaces only success state
    } finally {
      this.reportingId.set(null);
    }
  }
}