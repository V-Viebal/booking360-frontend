import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthConfig, OAuthEvent, OAuthService } from 'angular-oauth2-oidc';

import { getBooking360RuntimeConfig } from '../config/app-runtime';

export interface AuthSessionUser {
  subject: string;
  displayName: string;
  email: string;
  username: string;
  roles: string[];
  scopes: string[];
}

const redirectStorageKey = 'Booking360_auth_redirect';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly ready = signal(!this.isBrowser);
  readonly authenticated = signal(false);
  readonly user = signal<AuthSessionUser | null>(null);

  readonly initPromise: Promise<boolean>;

  constructor() {
    this.initPromise = this.isBrowser ? this.initialize() : Promise.resolve(false);

    if (this.isBrowser) {
      this.oauthService.events.subscribe((event: OAuthEvent) => {
        if (
          event.type === 'token_received' ||
          event.type === 'token_refreshed' ||
          event.type === 'session_terminated' ||
          event.type === 'logout'
        ) {
          this.syncSessionFromTokens();
        }
      });
    }
  }

  async login(targetUrl = '/workspace'): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    if (targetUrl && !targetUrl.startsWith('/callback')) {
      window.localStorage.setItem(redirectStorageKey, targetUrl);
    }

    await this.initPromise;
    const runtime = getBooking360RuntimeConfig();
    this.oauthService.initCodeFlow(undefined, { resource: runtime.apiResource });
  }

  async completeLogin(): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }

    await this.initPromise;
    if (!this.authenticated()) {
      return false;
    }

    const returnUrl = window.localStorage.getItem(redirectStorageKey) || '/workspace';
    window.localStorage.removeItem(redirectStorageKey);
    await this.router.navigateByUrl(returnUrl);
    return true;
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    const runtime = getBooking360RuntimeConfig();
    const postLogoutRedirectUri = encodeURIComponent(runtime.frontendOrigin);

    this.oauthService.logOut(true);
    this.user.set(null);
    this.authenticated.set(false);
    window.localStorage.removeItem(redirectStorageKey);
    window.location.assign(
      `${runtime.authOrigin}/session/end?client_id=${runtime.clientId}&post_logout_redirect_uri=${postLogoutRedirectUri}`
    );
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return this.oauthService.getAccessToken() || null;
  }

  hasRole(role: string): boolean {
    return this.user()?.roles.some((value) => value.toLowerCase() === role.toLowerCase()) ?? false;
  }

  hasScope(scope: string): boolean {
    return this.user()?.scopes.includes(scope) ?? false;
  }

  private async initialize(): Promise<boolean> {
    const runtime = getBooking360RuntimeConfig();
    const authConfig: AuthConfig = {
      issuer: runtime.authIssuer,
      clientId: runtime.clientId,
      redirectUri: `${runtime.frontendOrigin}/callback`,
      postLogoutRedirectUri: runtime.frontendOrigin,
      responseType: 'code',
      scope: runtime.scope,
      showDebugInformation: runtime.isLocal,
      strictDiscoveryDocumentValidation: false,
      requireHttps: !runtime.isLocal,
      customQueryParams: {
        resource: runtime.apiResource
      }
    };

    this.oauthService.configure(authConfig);
    this.oauthService.setupAutomaticSilentRefresh();

    try {
      await this.oauthService.loadDiscoveryDocumentAndTryLogin();

      if (!this.oauthService.hasValidAccessToken() && this.oauthService.getRefreshToken()) {
        try {
          await this.oauthService.refreshToken();
        } catch (error) {
          console.warn('Token refresh failed during auth bootstrap.', error);
        }
      }

      this.syncSessionFromTokens();
      return this.authenticated();
    } catch (error) {
      console.error('Booking360 auth initialization failed.', error);
      this.authenticated.set(false);
      this.user.set(null);
      return false;
    } finally {
      this.ready.set(true);
    }
  }

  private syncSessionFromTokens(): void {
    if (!this.isBrowser || !this.oauthService.hasValidAccessToken()) {
      this.authenticated.set(false);
      this.user.set(null);
      return;
    }

    const identityClaims = (this.oauthService.getIdentityClaims() as Record<string, unknown> | null) ?? {};
    const accessTokenPayload = decodeJwtPayload(this.oauthService.getAccessToken());
    const roles = dedupe([
      ...readStringArray(identityClaims['roles']),
      ...readStringArray(accessTokenPayload?.['roles'])
    ]);
    const scopes = dedupe(readSpaceDelimitedValue(accessTokenPayload?.['scope']));

    this.user.set({
      subject: readString(identityClaims['sub']) || readString(accessTokenPayload?.['sub']) || '',
      displayName:
        readString(identityClaims['name']) ||
        readString(identityClaims['preferred_username']) ||
        readString(identityClaims['username']) ||
        readString(identityClaims['email']) ||
        'Booking360 user',
      email: readString(identityClaims['email']) || '',
      username:
        readString(identityClaims['preferred_username']) ||
        readString(identityClaims['username']) ||
        deriveUsername(readString(identityClaims['email'])) ||
        'Booking360-user',
      roles,
      scopes
    });
    this.authenticated.set(true);
  }
}

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function readSpaceDelimitedValue(value: unknown): string[] {
  return typeof value === 'string'
    ? value.split(' ').map((item) => item.trim()).filter(Boolean)
    : [];
}

function deriveUsername(email: string): string {
  const [username] = email.split('@');
  return username || '';
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
