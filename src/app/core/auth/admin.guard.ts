import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { from, map } from 'rxjs';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return from(authService.initPromise).pipe(
    map(() => {
      if (!authService.authenticated()) {
        void authService.login('/admin');
        return false;
      }

      return authService.hasRole('Admin') || authService.hasScope('admin:all')
        ? true
        : router.parseUrl('/workspace');
    })
  );
};
