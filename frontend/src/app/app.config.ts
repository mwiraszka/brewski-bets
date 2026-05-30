import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';
import { UserService } from '@app/services/user.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAppInitializer(async () => {
      const clerk = inject(ClerkService);
      const user = inject(UserService);
      await clerk.load();
      await user.load();
    }),
  ],
};
