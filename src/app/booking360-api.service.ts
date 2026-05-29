import { PLATFORM_ID, PendingTasks, Injectable, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './core/auth/auth.service';
import { getBooking360RuntimeConfig } from './core/config/app-runtime';

// --- Response types ---

export interface FoundationResponse {
  service: string;
  status: string;
}

export interface CurrentUserResponse {
  subject: string;
  email: string;
  username: string;
  displayName: string;
  roles: string[];
  scopes: string[];
  createdAt: string;
  lastSeenAt: string;
}

export interface ResourceResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  capacity: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface BookingResponse {
  id: string;
  resourceId: string;
  resourceName: string;
  ownerSubject: string;
  ownerDisplayName: string;
  title: string;
  notes: string | null;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  resourceId: string;
  title: string;
  notes?: string;
  startAt: string;
  endAt: string;
}

export interface ResourceWriteRequest {
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  capacity: number;
  hourlyRate: number;
  isActive: boolean;
}

export interface FileAssetResponse {
  id: string;
  ownerSubject: string;
  ownerDisplayName: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  bucketName: string;
}

export interface AdminOverviewResponse {
  counts: {
    users: number;
    resources: number;
    bookings: number;
    assets: number;
  };
  latestUsers: {
    subject: string;
    email: string;
    username: string;
    displayName: string;
    roles: string[];
    createdAt: string;
    lastSeenAt: string;
  }[];
  latestBookings: {
    id: string;
    resourceName: string;
    ownerDisplayName: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
    createdAt: string;
  }[];
}


// --- Booking360 public (Wave 1) types ---

export interface PublicShopListItem {
  id: string;
  slug: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  openTime: string;
  closeTime: string;
  status: string;
  photoUrl: string | null;
  priceSegment: string | null;
  happyScore: number | null;
  reviewCount: number;
  distanceKm: number | null;
}

export interface PublicShopDetail extends PublicShopListItem {
  workingDays: number[];
  slotDurationMinutes: number;
  maxOnlinePerSlot: number;
  pausedUntil: string | null;
  earlyCloseToday: string | null;
}

export interface ShopRegistrationRequest {
  name: string;
  phone: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  openTime: string;
  closeTime: string;
  workingDays?: number[];
}

export interface ShopRegistrationResponse {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  shopAccessToken: string;
  manageUrl: string;
  publicUrl: string;
}

export interface SlotResponse {
  slotTime: string;
  onlineCount: number;
  capacity: number;
  available: boolean;
}

export interface SlotListResponse {
  shopSlug: string;
  date: string;
  slotDurationMinutes: number;
  maxOnlinePerSlot: number;
  openTime: string;
  closeTime: string;
  slots: SlotResponse[];
}

export interface PublicBookingRequest {
  shopId: string;
  customerName: string;
  customerPhone: string;
  slotTime: string;
  note?: string | null;
}

export interface PublicBookingResponse {
  bookingToken: string;
  shopId: string;
  shopSlug: string | null;
  shopName: string | null;
  shopAddress?: string | null;
  customerName: string;
  customerPhone: string;
  slotTime: string;
  note: string | null;
  status: string;
  cancelledBy: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  manageUrl?: string;
}

export interface ShopOwnerView {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  openTime: string;
  closeTime: string;
  workingDays: number[];
  slotDurationMinutes: number;
  maxOnlinePerSlot: number;
  status: string;
  pausedUntil: string | null;
  earlyCloseToday: string | null;
  cancelCount30d: number;
  publicUrl: string;
}

export interface ShopBookingRow {
  bookingToken: string;
  customerName: string;
  customerPhone: string;
  slotTime: string;
  note: string | null;
  status: string;
  cancelledBy: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ShopTodayResponse {
  shop: ShopOwnerView;
  date: string;
  bookings: ShopBookingRow[];
  slots: SlotResponse[];
}

export interface ShopConfigRequest {
  openTime?: string;
  closeTime?: string;
  workingDays?: number[];
  slotDurationMinutes?: number;
  maxOnlinePerSlot?: number;
  earlyCloseToday?: string;
  pausedUntil?: string | null;
}

// --- Booking360 reviews (Wave 5) types ---

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  shopReply: string | null;
  shopRepliedAt: string | null;
  createdAt: string;
  customerDisplay: string | null;
}

export interface ReviewEligibilityResponse {
  eligible: boolean;
  reason: string | null;
  booking: {
    bookingToken: string;
    slotTime: string;
    customerName: string;
    status: string;
  } | null;
  shop: {
    id: string;
    slug: string;
    name: string;
    address: string;
  } | null;
  existing: PublicReview | null;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string | null;
}

export interface CreateReviewResponse {
  review: PublicReview;
  shopSlug: string;
}

export interface ReportReviewResponse {
  reportedCount: number;
  weight: number;
  suppressed: boolean;
}

export interface ShopReviewsResponse {
  shopSlug: string;
  happyScore: number | null;
  reviewCount: number;
  reviews: PublicReview[];
}

export interface ShopReviewRow extends PublicReview {
  reportedCount: number;
  weight: number;
  suppressed: boolean;
}

export interface ShopReviewsListResponse {
  shop: { id: string; slug: string; happyScore: number | null; reviewCount: number };
  reviews: ShopReviewRow[];
}

export interface ShopReplyRequest {
  reply: string;
}
@Injectable({ providedIn: 'root' })
export class Booking360ApiService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly auth = inject(AuthService);

  // --- Foundation ---

  async loadHealth(): Promise<FoundationResponse> {
    return this.fetchJson<FoundationResponse>('/health');
  }

  // --- Users ---

  async loadCurrentUser(): Promise<CurrentUserResponse> {
    return this.fetchJson<CurrentUserResponse>('/api/users/me', undefined, true);
  }

  // --- Resources ---

  async listResources(includeInactive = false): Promise<ResourceResponse[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return this.fetchJson<ResourceResponse[]>("/api/resources" + query, undefined, true);
  }

  async getResource(id: string): Promise<ResourceResponse> {
    return this.fetchJson<ResourceResponse>("/api/resources/" + id, undefined, true);
  }

  async createResource(request: ResourceWriteRequest): Promise<ResourceResponse> {
    return this.fetchJson<ResourceResponse>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(request),
    }, true);
  }

  async updateResource(id: string, request: ResourceWriteRequest): Promise<ResourceResponse> {
    return this.fetchJson<ResourceResponse>("/api/resources/" + id, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, true);
  }

  async deleteResource(id: string): Promise<void> {
    await this.send("/api/resources/" + id, { method: 'DELETE' }, true);
  }

  // --- Bookings ---

  async listBookings(options?: {
    all?: boolean;
    resourceId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<BookingResponse[]> {
    const params = new URLSearchParams();
    if (options?.all) params.set('all', 'true');
    if (options?.resourceId) params.set('resourceId', options.resourceId);
    if (options?.from) params.set('from', options.from);
    if (options?.to) params.set('to', options.to);
    if (options?.limit) params.set('limit', options.limit.toString());
    const query = params.toString() ? '?' + params.toString() : '';
    return this.fetchJson<BookingResponse[]>('/api/bookings' + query, undefined, true);
  }

  async getBooking(id: string): Promise<BookingResponse> {
    return this.fetchJson<BookingResponse>("/api/bookings/" + id, undefined, true);
  }

  async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
    return this.fetchJson<BookingResponse>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(request),
    }, true);
  }

  async cancelBooking(id: string): Promise<BookingResponse> {
    return this.fetchJson<BookingResponse>("/api/bookings/" + id + "/cancel", {
      method: 'POST',
    }, true);
  }

  // --- Files ---

  async listFiles(limit = 50, all = false): Promise<FileAssetResponse[]> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (all) params.set('all', 'true');
    return this.fetchJson<FileAssetResponse[]>('/api/files?' + params.toString(), undefined, true);
  }

  async uploadFile(file: File): Promise<FileAssetResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.send('/api/files', {
      method: 'POST',
      body: formData,
    }, true);
    return (await response.json()) as FileAssetResponse;
  }

  async getFileDownloadUrl(id: string): Promise<{ url: string; expiresInSeconds: number }> {
    return this.fetchJson<{ url: string; expiresInSeconds: number }>("/api/files/" + id + "/download-url", undefined, true);
  }

  // --- Admin ---

  async loadAdminOverview(): Promise<AdminOverviewResponse> {
    return this.fetchJson<AdminOverviewResponse>('/api/admin/overview', undefined, true);
  }


// --- Booking360 public discovery (Wave 1) ---

  async listPublicShops(opts?: { lat?: number; lng?: number; radiusKm?: number; limit?: number }): Promise<PublicShopListItem[]> {
    const params = new URLSearchParams();
    if (opts?.lat != null) params.set('lat', String(opts.lat));
    if (opts?.lng != null) params.set('lng', String(opts.lng));
    if (opts?.radiusKm != null) params.set('radiusKm', String(opts.radiusKm));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const query = params.toString() ? '?' + params.toString() : '';
    return this.fetchJson<PublicShopListItem[]>('/api/public/shops' + query, undefined, false);
  }

  async getPublicShop(slug: string): Promise<PublicShopDetail> {
    return this.fetchJson<PublicShopDetail>('/api/public/shops/' + encodeURIComponent(slug), undefined, false);
  }

  async listPublicShopSlots(slug: string, date?: string): Promise<SlotListResponse> {
    const query = date ? ('?date=' + encodeURIComponent(date)) : '';
    return this.fetchJson<SlotListResponse>('/api/public/shops/' + encodeURIComponent(slug) + '/slots' + query, undefined, false);
  }

  async registerPublicShop(request: ShopRegistrationRequest): Promise<ShopRegistrationResponse> {
    return this.fetchJson<ShopRegistrationResponse>('/api/public/shops/register', {
      method: 'POST',
      body: JSON.stringify(request)
    }, false);
  }

  async createPublicBooking(request: PublicBookingRequest): Promise<PublicBookingResponse> {
    return this.fetchJson<PublicBookingResponse>('/api/public/bookings/', {
      method: 'POST',
      body: JSON.stringify(request)
    }, false);
  }

  async getPublicBookingByToken(token: string): Promise<PublicBookingResponse> {
    return this.fetchJson<PublicBookingResponse>('/api/public/bookings/' + encodeURIComponent(token), undefined, false);
  }

  async cancelPublicBookingByToken(token: string, reason?: string): Promise<PublicBookingResponse> {
    return this.fetchJson<PublicBookingResponse>('/api/public/bookings/' + encodeURIComponent(token) + '/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? null })
    }, false);
  }

  // --- Booking360 shop self-management (Wave 1) ---

  async getShopToday(token: string, date?: string): Promise<ShopTodayResponse> {
    const query = date ? ('?date=' + encodeURIComponent(date)) : '';
    return this.fetchJson<ShopTodayResponse>('/api/shop/m/' + encodeURIComponent(token) + '/today' + query, undefined, false);
  }

  async updateShopConfig(token: string, req: ShopConfigRequest): Promise<ShopOwnerView> {
    return this.fetchJson<ShopOwnerView>('/api/shop/m/' + encodeURIComponent(token) + '/configure', {
      method: 'PATCH',
      body: JSON.stringify(req)
    }, false);
  }

  async cancelBookingFromShop(token: string, bookingToken: string, reason?: string): Promise<ShopBookingRow> {
    return this.fetchJson<ShopBookingRow>('/api/shop/m/' + encodeURIComponent(token) + '/bookings/' + encodeURIComponent(bookingToken) + '/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? null })
    }, false);
  }

  // --- Booking360 reviews (Wave 5) ---

  async getReviewEligibility(bookingToken: string): Promise<ReviewEligibilityResponse> {
    return this.fetchJson<ReviewEligibilityResponse>('/api/public/reviews/' + encodeURIComponent(bookingToken), undefined, false);
  }

  async submitPublicReview(bookingToken: string, request: CreateReviewRequest): Promise<CreateReviewResponse> {
    return this.fetchJson<CreateReviewResponse>('/api/public/reviews/' + encodeURIComponent(bookingToken), {
      method: 'POST',
      body: JSON.stringify(request)
    }, false);
  }

  async reportPublicReview(reviewId: string): Promise<ReportReviewResponse> {
    return this.fetchJson<ReportReviewResponse>('/api/public/reviews/' + encodeURIComponent(reviewId) + '/report', {
      method: 'POST',
      body: JSON.stringify({})
    }, false);
  }

  async listPublicShopReviews(slug: string, limit?: number): Promise<ShopReviewsResponse> {
    const query = limit != null ? ('?limit=' + encodeURIComponent(String(limit))) : '';
    return this.fetchJson<ShopReviewsResponse>('/api/public/shops/' + encodeURIComponent(slug) + '/reviews' + query, undefined, false);
  }

  async listShopReviewsForOwner(token: string, limit?: number): Promise<ShopReviewsListResponse> {
    const query = limit != null ? ('?limit=' + encodeURIComponent(String(limit))) : '';
    return this.fetchJson<ShopReviewsListResponse>('/api/shop/m/' + encodeURIComponent(token) + '/reviews' + query, undefined, false);
  }

  async replyToReview(token: string, reviewId: string, reply: string): Promise<PublicReview> {
    return this.fetchJson<PublicReview>('/api/shop/m/' + encodeURIComponent(token) + '/reviews/' + encodeURIComponent(reviewId) + '/reply', {
      method: 'POST',
      body: JSON.stringify({ reply })
    }, false);
  }

  // --- Helpers ---

  buildApiUrl(path: string): string {
    return this.resolveApiBaseUrl() + path;
  }

  private async fetchJson<T>(path: string, init?: RequestInit, requiresAuth = false): Promise<T> {
    const removeTask = this.pendingTasks.add();
    try {
      const response = await this.send(path, init, requiresAuth);
      return (await response.json()) as T;
    } finally {
      removeTask();
    }
  }

  private async send(path: string, init?: RequestInit, requiresAuth = false): Promise<Response> {
    const headers = new Headers(init?.headers);
    const token = this.auth.getAccessToken();

    if (token) {
      headers.set('Authorization', 'Bearer ' + token);
    } else if (requiresAuth) {
      throw new Error('Authentication is required for this request.');
    }

    if (init?.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(this.resolveApiBaseUrl() + path, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error('Backend returned ' + response.status);
    }

    return response;
  }

  private resolveApiBaseUrl(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return getBooking360RuntimeConfig().apiBaseUrl;
    }
    return getBooking360RuntimeConfig().apiBaseUrl;
  }
}

