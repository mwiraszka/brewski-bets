import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  MenuIconComponent,
  ToastService,
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
  private readonly toast = inject(ToastService);
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
  readonly approvingAll = signal(false);

  readonly pendingPreview = computed(() => this.pendingBets().slice(0, 5));
  readonly pendingOverflow = computed(() =>
    Math.max(0, this.pendingBets().length - this.pendingPreview().length),
  );

  formatOpponent(bet: { opponent?: { firstName: string; lastName: string } }): string {
    return bet.opponent ? `${bet.opponent.firstName} ${bet.opponent.lastName}` : '';
  }

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

  async approveAllPending(): Promise<void> {
    if (this.approvingAll() || this.pendingBets().length === 0) return;
    this.approvingAll.set(true);

    const ids = this.pendingBets().map(b => b.id);
    const results = await Promise.allSettled(
      ids.map(id => this.betsService.updateBet(id, { action: 'accept' })),
    );

    const failures = results.filter(r => r.status === 'rejected').length;
    try {
      await Promise.all([
        this.betsService.loadBets(),
        this.betsService.loadPendingCount(),
      ]);
    } catch {
      // counts will refresh on next page load
    }

    if (failures === 0) {
      this.toast.success('All bets approved');
      this.menuOpen.set(false);
    } else if (failures < ids.length) {
      this.toast.error(`${failures} of ${ids.length} bets could not be approved`);
    } else {
      this.toast.error('Failed to approve bets');
    }

    this.approvingAll.set(false);
  }

  async onLogOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.clerk.logOut();
  }
}
