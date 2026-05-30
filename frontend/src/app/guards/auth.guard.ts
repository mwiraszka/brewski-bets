import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

export const authGuard: CanActivateFn = () => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (clerk.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  if (!clerk.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const ssoCallbackGuard: CanActivateFn = async () => {
  const clerk = inject(ClerkService);
  const router = inject(Router);

  try {
    await clerk.handleSSOCallback();
    return router.createUrlTree(['/']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
