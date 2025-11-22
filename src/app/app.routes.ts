import { Routes } from '@angular/router';

import { Page } from '@app/models';

export const homePage: Page = {
  title: 'brewski bets',
  path: '',
};

export const routes: Routes = [
  {
    path: homePage.path,
    loadComponent: () =>
      import('./pages/home/home-page.component').then(c => c.HomePageComponent),
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
