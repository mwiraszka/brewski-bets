import { ButtonComponent } from '@eagami/ui';

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  imports: [ButtonComponent],
})
export class HomePageComponent {
  readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  async onSignOut(): Promise<void> {
    await this.clerk.signOut();
    await this.router.navigate(['/create-account']);
  }
}
