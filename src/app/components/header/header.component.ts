import { AvatarComponent, ButtonComponent } from '@eagami/ui';

import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [RouterLink, AvatarComponent, ButtonComponent],
})
export class HeaderComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  readonly isLoggedIn = computed(() => this.clerk.isLoggedIn());
  readonly showLoginButton = computed(() => !this.isLoggedIn() && this.router.url !== '/login');
  readonly menuOpen = signal(false);

  readonly avatarSrc = computed(() => {
    const user = this.clerk.user();
    return user?.hasImage ? user.imageUrl : undefined;
  });
  readonly initials = computed(() => {
    const user = this.clerk.user();
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || undefined;
  });

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async onLogOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.clerk.logOut();
  }
}
