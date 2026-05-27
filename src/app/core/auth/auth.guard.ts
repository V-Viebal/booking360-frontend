import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn } from '@angular/router';
import { from, map } from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return from(authService.initPromise).pipe(
    map(() => {
      if (authService.authenticated()) {
        return true;
      }

      void authService.login(state.url);
      return false;
    })
  );
};
