import {
  APP_INITIALIZER,
  ApplicationConfig,
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
    {
      provide: APP_INITIALIZER,
      useFactory: (clerk: ClerkService, user: UserService) => async () => {
        await clerk.load();
        await user.load();
      },
      deps: [ClerkService, UserService],
      multi: true,
    },
  ],
};
