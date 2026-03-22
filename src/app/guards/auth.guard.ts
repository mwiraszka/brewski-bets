import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

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
