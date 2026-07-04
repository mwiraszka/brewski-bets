import {
  AvatarComponent,
  BadgeComponent,
  BottleIconComponent,
  ButtonComponent,
  CalendarIconComponent,
  CardComponent,
  EditIconComponent,
  SkeletonComponent,
  ToastService,
  TrophyIconComponent,
} from '@eagami/ui';

import { DatePipe } from '@angular/common';
import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BetGraphicComponent } from '@app/graphics';
import { type BetResult, type BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { UserService } from '@app/services/user.service';
import {
  type BetPosition,
  avatarSrc,
  initialsOf,
  isAwaitingOutcome,
  isMyTurn,
  isPendingRequester,
  positionOf,
  withAgreedTerms,
} from '@app/util';

interface OutcomeView {
  name: string;
  beers: number;
  iOwe: boolean;
  stakeLabel: string;
  isWinner: boolean;
}

@Component({
  selector: 'bb-bet-detail-page',
  templateUrl: './bet-detail-page.component.html',
  styleUrl: './bet-detail-page.component.scss',
  imports: [
    DatePipe,
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    BottleIconComponent,
    ButtonComponent,
    CalendarIconComponent,
    CardComponent,
    EditIconComponent,
    SkeletonComponent,
    BetGraphicComponent,
    TrophyIconComponent,
  ],
})
export class BetDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly betsService = inject(BetsService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly bet = signal<BetWithOpponent | null>(null);

  private readonly currentUserId = computed(() => this.userService.user()?.id);

  private readonly myPosition = computed((): BetPosition | null => {
    const bet = this.bet();
    return bet ? positionOf(bet, this.currentUserId()) : null;
  });

  readonly opponentName = computed(() => {
    const opponent = this.bet()?.opponent;
    return opponent ? `${opponent.firstName} ${opponent.lastName}` : '';
  });

  readonly opponentAvatar = computed(() => avatarSrc(this.bet()?.opponent?.avatarUrl));

  readonly opponentInitials = computed(() =>
    initialsOf(this.bet()?.opponent?.firstName, this.bet()?.opponent?.lastName),
  );

  // Display the agreed terms; an unaccepted pending change stays hidden until
  // both parties accept it (the diff is reviewed on the edit screen instead).
  private readonly view = computed(() => {
    const bet = this.bet();
    return bet ? withAgreedTerms(bet) : null;
  });

  readonly displayTitle = computed(() => this.view()?.title ?? '');
  readonly displayIconSlug = computed(() => this.view()?.iconSlug ?? null);
  readonly displayIconColor = computed(() => this.view()?.iconColor ?? null);
  readonly displayDescription = computed(() => this.view()?.description ?? null);
  readonly displayResolutionDate = computed(() => this.view()?.resolutionDate ?? null);

  readonly isSettled = computed(() => this.bet()?.status === 'settled');
  readonly isVoid = computed(() => this.bet()?.outcome === 'void');
  readonly settlementProposed = computed(() => this.bet()?.settlementProposed ?? false);
  readonly changesPending = computed(
    () => this.bet()?.pendingAction != null && !this.isSettled(),
  );
  readonly awaitingOutcome = computed(() => {
    const bet = this.bet();
    return bet ? isAwaitingOutcome(bet) : false;
  });

  private readonly myTurn = computed(() => {
    const bet = this.bet();
    return bet ? isMyTurn(bet, this.currentUserId()) : false;
  });

  readonly outcomes = computed((): OutcomeView[] => {
    const bet = this.view();
    if (!bet) {
      return [];
    }
    const me = this.myPosition();
    return bet.results
      .filter(result => result.isSpecial !== 'void')
      .map((result, index) => this.toOutcomeView(result, index, me, bet));
  });

  readonly winnerLabel = computed(() => {
    const bet = this.view();
    const index = bet?.selectedResultIndex;
    if (!bet || index == null) {
      return '';
    }
    const result = bet.results[index];
    if (!result) {
      return '';
    }
    return result.isSpecial === 'void' ? 'Void' : result.name;
  });

  readonly resultBannerLabel = computed(() =>
    this.isSettled() ? 'Settled result' : 'Proposed result',
  );

  // True when the viewer can move the bet forward (their turn, or an active
  // bet at rest they can edit or settle); routes them to the edit screen
  readonly canAct = computed(() => {
    const bet = this.bet();
    if (!bet || this.isSettled()) {
      return false;
    }
    return (
      this.myTurn() ||
      (bet.status === 'active' && bet.pendingAction == null) ||
      isPendingRequester(bet, this.currentUserId())
    );
  });

  readonly actionLabel = computed(() => {
    const bet = this.bet();
    if (this.settlementProposed() && this.myTurn()) {
      return 'Review settlement';
    }
    if (this.changesPending() && this.myTurn()) {
      return 'Review changes';
    }
    if (
      bet &&
      bet.previousState != null &&
      isPendingRequester(bet, this.currentUserId())
    ) {
      return 'Review changes';
    }
    return 'Edit bet';
  });

  readonly waitingForOpponent = computed(
    () => !this.isSettled() && this.changesPending() && !this.myTurn(),
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/bets']);
      return;
    }
    try {
      this.bet.set(await this.betsService.getBet(id));
    } catch {
      this.toast.error('Failed to load bet');
      await this.router.navigate(['/bets']);
      return;
    } finally {
      this.loading.set(false);
    }
  }

  private toOutcomeView(
    result: BetResult,
    index: number,
    me: BetPosition | null,
    bet: BetWithOpponent,
  ): OutcomeView {
    const iWin = result.assignedTo === me;
    return {
      name: result.name,
      beers: result.brewskiCount,
      iOwe: !iWin,
      stakeLabel: iWin ? 'You win' : 'You owe',
      isWinner: bet.selectedResultIndex === index,
    };
  }
}
