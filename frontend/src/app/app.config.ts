import { provideStaleBuildReload } from '@eagami/ui/router';
import * as Sentry from '@sentry/angular';

import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';
import { UserService } from '@app/services/user.service';

import { version } from '../../package.json';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideStaleBuildReload({
      version,
      onReport: ({ outcome, route, fromVersion, toVersion }) =>
        Sentry.logger.info('Stale build reload', {
          outcome,
          route,
          from_version: fromVersion,
          to_version: toVersion,
        }),
    }),
    provideAppInitializer(async () => {
      const clerk = inject(ClerkService);
      const user = inject(UserService);
      await clerk.load();
      await user.load();
    }),
  ],
};
