import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { OAuthStorage, provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    const memoryStore: Record<string, string> = {};
    const memoryStorage: OAuthStorage = {
      getItem: (key: string) => memoryStore[key] ?? null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      }
    } as OAuthStorage;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideOAuthClient(),
        { provide: OAuthStorage, useValue: memoryStorage }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render workspace navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Booking360');
    expect(compiled.textContent).toContain('Bookings');
    expect(compiled.textContent).toContain('Resources');
    expect(compiled.textContent).toContain('Calendar');
    expect(compiled.textContent).toContain('Reports');
  });
});