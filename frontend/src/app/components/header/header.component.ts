import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  MenuIconComponent,
  MoonIconComponent,
  SunIconComponent,
  SwitchComponent,
  XIconComponent,
} from '@eagami/ui';
import { filter, map } from 'rxjs';

import {
  Component,
  DestroyRef,
  type OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';

import { BetsService } from '@app/services/bets.service';
import { ClerkService } from '@app/services/clerk.service';
import { FriendsService } from '@app/services/friends.service';
import { ThemeService } from '@app/services/theme.service';

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
    MoonIconComponent,
    SunIconComponent,
    SwitchComponent,
    XIconComponent,
  ],
})
export class HeaderComponent implements OnInit {
  private readonly betsService = inject(BetsService);
  private readonly friendsService = inject(FriendsService);
  private readonly clerk = inject(ClerkService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isDarkMode = computed(() => this.theme.mode() === 'dark');

  onDarkModeToggle(checked: boolean): void {
    this.theme.set(checked ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.theme.cycle();
  }
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
  readonly friendRequestCount = this.friendsService.incomingRequestsCount;
  readonly mobileBadgeCount = computed(
    () => this.pendingCount() + this.friendRequestCount(),
  );

  constructor() {
    effect(() => {
      if (this.clerk.isLoggedIn()) {
        this.friendsService.startPolling();
        this.betsService.startPolling();
      } else {
        this.friendsService.stopPolling();
        this.betsService.stopPolling();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.friendsService.stopPolling();
      this.betsService.stopPolling();
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.clerk.isLoggedIn()) {
      await Promise.allSettled([
        this.betsService.loadPendingCount(),
        this.friendsService.loadIncomingRequestsCount(),
      ]);
    }
  }

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
