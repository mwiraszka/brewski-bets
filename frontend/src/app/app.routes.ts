import { Routes } from '@angular/router';

import { authGuard, guestGuard, ssoCallbackGuard } from '@app/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home-page.component').then(c => c.HomePageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./pages/account/account-page.component').then(c => c.AccountPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(
        c => c.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'create-account',
        loadComponent: () =>
          import('./pages/create-account/create-account-page.component').then(
            c => c.CreateAccountPageComponent,
          ),
        canActivate: [guestGuard],
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login-page.component').then(c => c.LoginPageComponent),
        canActivate: [guestGuard],
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password-page.component').then(
            c => c.ForgotPasswordPageComponent,
          ),
        canActivate: [guestGuard],
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password-page.component').then(
            c => c.ChangePasswordPageComponent,
          ),
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy-page.component').then(
        c => c.PrivacyPolicyPageComponent,
      ),
  },
  {
    path: 'terms-of-service',
    loadComponent: () =>
      import('./pages/terms-of-service/terms-of-service-page.component').then(
        c => c.TermsOfServicePageComponent,
      ),
  },
  {
    path: 'sso-callback',
    canActivate: [ssoCallbackGuard],
    loadComponent: () =>
      import('./pages/sso-callback/sso-callback-page.component').then(
        c => c.SSOCallbackPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
