import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  Booking360ApiService,
  ReviewEligibilityResponse,
  PublicReview
} from '../booking360-api.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="b360-hero" style="padding: clamp(2rem,5vw,3rem) 0 0; background: var(--b360-bg-darker);">
      <div class="b360-container b360-container--narrow">
        <a routerLink="/" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m15 18-6-6 6-6"/></svg>
          Trang chủ
        </a>
        <span class="b360-eyebrow" style="margin-top:.75rem; display:inline-block;">Đánh giá khách hàng</span>
        <h1 class="b360-display" style="font-size: clamp(1.75rem,3.5vw,2.4rem); margin-top:.65rem; color:#fff;">
          Cảm ơn bạn đã chọn book360
        </h1>
        <p class="b360-lead" style="color: var(--b360-fg-on-dark-muted); margin-top:.65rem; max-width: 60ch;">
          Đánh giá thật từ bạn giúp các khách khác chọn quán phù hợp và giúp quán phục vụ tốt hơn.
        </p>
      </div>
    </section>

    <section class="b360-section--tight" style="padding-bottom: clamp(3rem, 6vw, 5rem);">
      <div class="b360-container b360-container--narrow">
        @if (loading()) {
          <div class="b360-skeleton" style="height: 360px; border-radius: var(--b360-r-lg);"></div>
        } @else if (eligibility(); as e) {
          @if (submitted(); as s) {
            <!-- ============ SUCCESS ============ -->
            <article class="b360-card success-card">
              <div class="success-emoji">⭐</div>
              <span class="b360-eyebrow" style="color: var(--b360-success); display:inline-block;">Đã ghi nhận</span>
              <h2 class="b360-h1" style="margin: .5rem 0 .5rem;">Cảm ơn đánh giá của bạn!</h2>
              <p class="b360-lead" style="margin: 0 0 1.25rem;">
                Đánh giá của bạn đã hiển thị công khai và giúp ích cho các khách tiếp theo của quán.
              </p>

              <div class="reviewbox">
                <div class="b360-stars b360-stars--lg" [attr.aria-label]="s.rating + ' sao'">
                  @for (n of [1,2,3,4,5]; track n) {
                    <span [class.on]="n <= s.rating">★</span>
                  }
                </div>
                @if (s.comment) {
                  <p class="quote">"{{ s.comment }}"</p>
                }
                @if (e.shop?.name) {
                  <div class="quote-attr">— Đánh giá quán {{ e.shop?.name }}</div>
                }
              </div>

              <div class="b360-row" style="justify-content:center; margin-top:1.5rem; gap:.75rem; flex-wrap:wrap;">
                @if (e.shop; as shop) {
                  <a [routerLink]="['/shops', shop.slug]" class="b360-btn b360-btn--primary">Xem trang quán</a>
                }
                <a routerLink="/shops" class="b360-btn b360-btn--ghost">Tìm quán khác</a>
              </div>
            </article>

          } @else if (!e.eligible) {
            <!-- ============ INELIGIBLE ============ -->
            <article class="b360-card warn-card">
              <div class="b360-notice b360-notice--warning" style="margin-bottom:1.25rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                <div>
                  <strong>Không thể đánh giá</strong>
                  <div>{{ e.reason ?? 'Liên kết đánh giá không hợp lệ hoặc đã hết hạn.' }}</div>
                </div>
              </div>

              @if (e.existing; as ex) {
                <p class="b360-mute" style="margin: 0 0 .85rem;">Bạn đã đánh giá lịch này trước đó:</p>
                <div class="reviewbox">
                  <div class="b360-stars b360-stars--lg">
                    @for (n of [1,2,3,4,5]; track n) {
                      <span [class.on]="n <= ex.rating">★</span>
                    }
                  </div>
                  @if (ex.comment) { <p class="quote">"{{ ex.comment }}"</p> }
                </div>
              }

              <div class="b360-row" style="justify-content:center; margin-top:1.5rem; gap:.75rem; flex-wrap:wrap;">
                @if (e.shop; as shop) {
                  <a [routerLink]="['/shops', shop.slug]" class="b360-btn b360-btn--primary">Quay về quán</a>
                } @else {
                  <a routerLink="/shops" class="b360-btn b360-btn--primary">Xem các quán</a>
                }
              </div>
            </article>

          } @else {
            <!-- ============ ELIGIBLE — FORM ============ -->
            <article class="b360-card" style="padding: clamp(1.5rem, 3vw, 2.25rem);">
              @if (e.shop; as shop) {
                <div class="shop-header">
                  <div class="shop-avatar">{{ shop.name.charAt(0) }}</div>
                  <div>
                    <span class="b360-eyebrow">Đánh giá quán</span>
                    <h2 class="b360-h2" style="margin: .25rem 0 .25rem;">{{ shop.name }}</h2>
                    <div class="b360-mute2" style="font-size: .85rem;">{{ shop.address }}</div>
                  </div>
                </div>
              }

              @if (e.booking; as b) {
                <div class="booking-meta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  <span>Lịch <strong>{{ b.slotTime | date:'HH:mm' }}</strong> · {{ b.slotTime | date:'EEEE, dd/MM/yyyy':'+0700':'vi' }}</span>
                </div>
              }

              <hr class="b360-divider" />

              <div class="rate-section">
                <h3 class="b360-h3" style="margin: 0 0 .15rem;">Bạn cảm thấy thế nào?</h3>
                <p class="b360-mute2" style="font-size: .88rem; margin: 0 0 1rem;">Chọn từ 1 đến 5 sao</p>

                <div class="b360-stars b360-stars--xl b360-stars--clickable" role="radiogroup" aria-label="Chọn số sao">
                  @for (n of [1,2,3,4,5]; track n) {
                    <button
                      type="button"
                      [class.on]="n <= rating()"
                      role="radio"
                      [attr.aria-checked]="n === rating()"
                      [attr.aria-label]="n + ' sao'"
                      (click)="rating.set(n)">★</button>
                  }
                </div>

                @if (rating() > 0) {
                  <p class="rate-label">{{ ratingLabel() }}</p>
                }
              </div>

              <hr class="b360-divider" />

              <label class="b360-field">
                <span class="b360-field-label">Nhận xét chi tiết (tuỳ chọn)</span>
                <textarea
                  class="b360-textarea"
                  rows="4"
                  maxlength="2000"
                  [value]="comment()"
                  (input)="comment.set($any($event.target).value)"
                  placeholder="Chia sẻ trải nghiệm, phong cách phục vụ, không gian quán...">
                </textarea>
                <div class="b360-mute2" style="font-size: .78rem; margin-top: .35rem; text-align:right;">
                  {{ comment().length }} / 2000
                </div>
              </label>

              <button type="button"
                      class="b360-btn b360-btn--primary b360-btn--lg b360-btn--block"
                      [disabled]="submitting() || rating() < 1"
                      (click)="submit()">
                @if (submitting()) { Đang gửi... }
                @else {
                  Gửi đánh giá
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="b360-icon-md"><path d="m9 18 6-6-6-6"/></svg>
                }
              </button>

              @if (errorMessage()) {
                <div class="b360-notice b360-notice--danger" style="margin-top: .85rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <p class="b360-mute2" style="font-size: .78rem; text-align:center; margin: 1.25rem 0 0;">
                Đánh giá thật giúp cộng đồng chọn được quán tốt nhất. Chỉ khách đặt qua book360 mới đánh giá được.
              </p>
            </article>
          }
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

    .success-card {
      text-align: center;
      padding: clamp(1.75rem, 3vw, 2.5rem);
      background: linear-gradient(135deg, var(--b360-bg) 0%, var(--b360-success-bg) 100%);
      border: 1px solid rgba(22,163,74,.25);
    }
    .success-emoji { font-size: 3.5rem; line-height: 1; margin-bottom: .5rem; }

    .warn-card { padding: clamp(1.5rem, 3vw, 2rem); }

    .shop-header { display: flex; align-items: flex-start; gap: 1rem; }
    .shop-avatar {
      width: 56px; height: 56px; border-radius: 14px;
      background: linear-gradient(135deg, var(--b360-brand), var(--b360-ink));
      color: #fff;
      font-family: var(--b360-font-display); font-weight: 800;
      font-size: 1.4rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .booking-meta {
      display: inline-flex; align-items: center; gap: .55rem;
      margin-top: .85rem;
      padding: .55rem 1rem;
      background: var(--b360-bg-soft);
      border-radius: var(--b360-r-pill);
      color: var(--b360-fg-muted);
      font-size: .9rem;
    }
    .booking-meta svg { color: var(--b360-brand); flex-shrink: 0; }
    .booking-meta strong { color: var(--b360-fg); }

    .rate-section { text-align: center; padding: .5rem 0; }
    .rate-label {
      margin: .85rem 0 0;
      font-family: var(--b360-font-display); font-weight: 700;
      font-size: 1.15rem; color: var(--b360-fg);
    }

    .reviewbox {
      padding: 1.25rem;
      background: var(--b360-bg-soft);
      border-radius: var(--b360-r-md);
      border: 1px solid var(--b360-line);
      text-align: center;
    }
    .reviewbox .quote {
      margin: .85rem 0 0;
      font-style: italic; color: var(--b360-fg);
      line-height: 1.6;
    }
    .quote-attr {
      margin-top: .55rem;
      font-size: .85rem; color: var(--b360-fg-muted);
    }
  `]
})
export class ReviewPageComponent implements OnInit {
  private readonly api = inject(Booking360ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly eligibility = signal<ReviewEligibilityResponse | null>(null);
  protected readonly rating = signal(0);
  protected readonly comment = signal('');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitted = signal<PublicReview | null>(null);

  protected ratingLabel(): string {
    switch (this.rating()) {
      case 1: return 'Rất tệ';
      case 2: return 'Chưa hài lòng';
      case 3: return 'Bình thường';
      case 4: return 'Hài lòng';
      case 5: return 'Tuyệt vời!';
      default: return '';
    }
  }

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token) {
      this.eligibility.set({ eligible: false, reason: 'Liên kết không hợp lệ', booking: null, shop: null, existing: null });
      this.loading.set(false);
      return;
    }
    try {
      const e = await this.api.getReviewEligibility(token);
      this.eligibility.set(e);
    } catch (err) {
      this.eligibility.set({ eligible: false, reason: err instanceof Error ? err.message : 'Không thể tải', booking: null, shop: null, existing: null });
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    const e = this.eligibility();
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token || !e?.eligible) return;
    if (this.rating() < 1 || this.rating() > 5) {
      this.errorMessage.set('Vui lòng chọn số sao từ 1 đến 5');
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      const res = await this.api.submitPublicReview(token, {
        rating: this.rating(),
        comment: this.comment().trim() || null,
      });
      this.submitted.set(res.review);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      this.submitting.set(false);
    }
  }
}