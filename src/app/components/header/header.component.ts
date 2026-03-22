import { AvatarComponent, ButtonComponent } from '@eagami/ui';

import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

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
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isLoggedIn = computed(() => this.clerk.isLoggedIn());
  readonly showLoginButton = computed(() => !this.isLoggedIn() && this.currentUrl() !== '/login');
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
