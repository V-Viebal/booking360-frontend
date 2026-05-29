import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  Booking360ApiService,
  ReviewEligibilityResponse,
  PublicReview
} from '../booking360-api.service';

// W5 — public review write page (linked from review-link notification at T+45).
@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <a routerLink="/" class="back-link">← Trang chủ</a>

      @if (loading()) {
        <p class="muted">Đang tải...</p>
      } @else if (eligibility(); as e) {
        @if (submitted(); as s) {
          <div class="card success">
            <span class="kicker">Cảm ơn bạn</span>
            <h1>Đã ghi nhận đánh giá</h1>
            <p class="muted">Đánh giá của bạn giúp các khách khác chọn quán phù hợp.</p>
            <div class="reviewbox">
              <div class="stars" aria-label="Số sao đã chấm">
                @for (n of [1,2,3,4,5]; track n) {
                  <span class="star" [class.on]="n <= s.rating">★</span>
                }
              </div>
              @if (s.comment) { <p class="quote">{{ s.comment }}</p> }
            </div>
            <div class="actions">
              @if (e.shop; as shop) {
                <a [routerLink]="['/shops', shop.slug]" class="btn btn-primary">Xem quán</a>
              }
              <a routerLink="/shops" class="btn btn-light">Tìm quán khác</a>
            </div>
          </div>
        } @else if (!e.eligible) {
          <div class="card warn">
            <h1>Không thể đánh giá</h1>
            <p>{{ e.reason ?? 'Liên kết đánh giá không hợp lệ' }}</p>
            @if (e.existing; as ex) {
              <div class="reviewbox">
                <div class="stars">
                  @for (n of [1,2,3,4,5]; track n) {
                    <span class="star" [class.on]="n <= ex.rating">★</span>
                  }
                </div>
                @if (ex.comment) { <p class="quote">{{ ex.comment }}</p> }
              </div>
            }
            @if (e.shop; as shop) {
              <a [routerLink]="['/shops', shop.slug]" class="btn btn-primary">Quay về quán</a>
            } @else {
              <a routerLink="/shops" class="btn btn-primary">Xem các quán</a>
            }
          </div>
        } @else {
          <div class="card">
            @if (e.shop; as shop) {
              <span class="kicker">Đánh giá tại {{ shop.name }}</span>
              <h1>Bạn cảm thấy trải nghiệm thế nào?</h1>
              <p class="muted">{{ shop.address }}</p>
            }
            @if (e.booking; as b) {
              <p class="muted">Lịch lúc {{ b.slotTime | date:'HH:mm · EEEE, dd/MM/yyyy' }}</p>
            }

            <div class="rate">
              <span class="rate-label">Số sao</span>
              <div class="stars stars--clickable" role="radiogroup" aria-label="Chọn số sao">
                @for (n of [1,2,3,4,5]; track n) {
                  <button
                    type="button"
                    class="star"
                    [class.on]="n <= rating()"
                    role="radio"
                    [attr.aria-checked]="n === rating()"
                    [attr.aria-label]="n + ' sao'"
                    (click)="rating.set(n)">★</button>
                }
              </div>
            </div>

            <label class="comment">
              <span>Nhận xét (tuỳ chọn)</span>
              <textarea
                rows="4"
                maxlength="2000"
                [value]="comment()"
                (input)="comment.set($any($event.target).value)"
                placeholder="Chia sẻ trải nghiệm của bạn (tối đa 2000 ký tự)"></textarea>
            </label>

            <button type="button" class="btn btn-primary" [disabled]="submitting() || rating() < 1" (click)="submit()">
              {{ submitting() ? 'Đang gửi...' : 'Gửi đánh giá' }}
            </button>
            @if (errorMessage()) { <p class="err">{{ errorMessage() }}</p> }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page { padding: 2rem 1rem 4rem; max-width: 720px; margin: 0 auto; }
    .back-link { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .muted { color: #6b7280; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
    .card.success { background: #f0fdf4; border-color: #bbf7d0; }
    .card.warn { background: #fffbeb; border-color: #fde68a; }
    .kicker { color: #2563eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.8rem; }
    h1 { margin: 0.4rem 0 0.25rem; font-size: 1.5rem; }
    .rate { margin: 1.25rem 0 0.75rem; }
    .rate-label { display: block; color: #6b7280; margin-bottom: 0.25rem; font-size: 0.9rem; }
    .stars { display: inline-flex; gap: 0.35rem; }
    .star { background: none; border: 0; padding: 0; font-size: 2rem; color: #d1d5db; cursor: default; line-height: 1; }
    .stars--clickable .star { cursor: pointer; }
    .star.on { color: #f59e0b; }
    .comment { display: block; margin: 1rem 0; }
    .comment > span { display: block; color: #374151; margin-bottom: 0.25rem; font-weight: 500; }
    .comment textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; box-sizing: border-box; }
    .btn { padding: 0.6rem 1.1rem; border-radius: 8px; font-weight: 600; border: 0; cursor: pointer; text-decoration: none; display: inline-block; margin-right: 0.5rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-light { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; }
    .err { color: #dc2626; font-size: 0.9rem; margin-top: 0.5rem; }
    .reviewbox { margin: 1rem 0; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
    .quote { margin: 0.5rem 0 0; color: #1f2937; font-style: italic; }
    .actions { margin-top: 0.5rem; }
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
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      this.submitting.set(false);
    }
  }
}
