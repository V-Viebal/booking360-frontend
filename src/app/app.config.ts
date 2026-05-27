import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, PLATFORM_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

function storageFactory(platformId: object): OAuthStorage {
  if (isPlatformBrowser(platformId)) {
    return localStorage;
  }

  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  } as OAuthStorage;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideOAuthClient(),
    {
      provide: OAuthStorage,
      useFactory: storageFactory,
      deps: [PLATFORM_ID]
    }
  ]
};
