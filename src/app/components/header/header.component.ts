import { ButtonComponent } from '@eagami/ui';

import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [RouterLink, ButtonComponent],
})
export class HeaderComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  async onLogOut(): Promise<void> {
    await this.clerk.signOut();
    await this.router.navigate(['/login']);
  }
}
