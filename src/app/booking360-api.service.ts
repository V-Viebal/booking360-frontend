import { PLATFORM_ID, Injectable, inject } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class Booking360ApiService {
  private readonly platformId = inject(PLATFORM_ID);
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

  // --- Helpers ---

  buildApiUrl(path: string): string {
    return this.resolveApiBaseUrl() + path;
  }

  private async fetchJson<T>(path: string, init?: RequestInit, requiresAuth = false): Promise<T> {
    const response = await this.send(path, init, requiresAuth);
    return (await response.json()) as T;
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
