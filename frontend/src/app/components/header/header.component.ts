import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  MenuIconComponent,
  XIconComponent,
} from '@eagami/ui';
import { filter, map } from 'rxjs';

import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';

import { BetsService } from '@app/services/bets.service';
import { ClerkService } from '@app/services/clerk.service';
import { UserService } from '@app/services/user.service';

import { environment } from '@env';

@Component({
  selector: 'bb-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    MenuIconComponent,
    XIconComponent,
  ],
})
export class HeaderComponent implements OnInit {
  private readonly betsService = inject(BetsService);
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly scrolled = input(false);

  readonly previewInfo = environment.preview;

  readonly isLoggedIn = computed(() => this.clerk.isLoggedIn());
  private readonly hideLoginButtonRoutes = new Set(['/', '/login']);
  readonly showLoginButton = computed(
    () =>
      this.clerk.isLoaded() &&
      !this.isLoggedIn() &&
      !this.hideLoginButtonRoutes.has(this.currentUrl()),
  );
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

  readonly pendingCount = this.betsService.pendingCount;
  readonly pendingBets = this.betsService.pendingBets;

  async ngOnInit(): Promise<void> {
    if (this.clerk.isLoggedIn()) {
      const user = this.userService.user();
      if (user) {
        this.betsService.setCurrentUserId(user.id);
      }
      try {
        await this.betsService.loadPendingCount();
        await this.betsService.loadBets();
      } catch {
        // silently ignore — badge still works without data
      }
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  navigateToBet(betId: string): void {
    this.menuOpen.set(false);
    this.router.navigate(['/bets', betId]);
  }

  async onLogOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.clerk.logOut();
  }
}
