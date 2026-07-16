import {
  BottleIconComponent,
  ButtonComponent,
  DropdownComponent,
  EmptyStateComponent,
  SkeletonComponent,
  TooltipDirective,
} from '@eagami/ui';

import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BetCardComponent } from '@app/components/bet-card/bet-card.component';
import { EventFilterComponent } from '@app/components/event-filter/event-filter.component';
import { SpilledBottleComponent } from '@app/graphics';
import { BetsService } from '@app/services/bets.service';
import { UserService } from '@app/services/user.service';
import {
  type BetSortKey,
  agreedEvent,
  brewskisAtRisk,
  brewskisAtStake,
  isAwaitingOutcome,
  isMyTurn,
  settledNet,
  sortBetsBy,
  withAgreedTerms,
} from '@app/util';

@Component({
  selector: 'bb-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    BetCardComponent,
    EventFilterComponent,
    SpilledBottleComponent,
    BottleIconComponent,
    ButtonComponent,
    DropdownComponent,
    EmptyStateComponent,
    SkeletonComponent,
    TooltipDirective,
  ],
})
export class HomePageComponent implements OnInit {
  private readonly betsService = inject(BetsService);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly skeletonCards = Array.from({ length: 4 });

  readonly currentUserId = computed(() => this.userService.user()?.id);

  readonly firstName = computed(() => this.userService.user()?.firstName ?? '');

  private readonly bets = this.betsService.bets;

  readonly hasBets = computed(() => this.bets().length > 0);

  // Bets that need the user to do something next: their turn to respond, or an
  // active bet whose resolution date has passed and needs settling
  readonly attentionBets = computed(() =>
    this.bets().filter(
      bet => isMyTurn(bet, this.currentUserId()) || isAwaitingOutcome(bet),
    ),
  );

  readonly sortKey = signal<BetSortKey>('title');

  readonly sortOptions = [
    { label: 'Last modified', value: 'modified' },
    { label: 'Resolution date', value: 'resolution' },
    { label: 'Brewskis at stake', value: 'brewskis' },
    { label: 'Bet title', value: 'title' },
  ];

  readonly events = this.betsService.events;
  readonly hiddenEvents = this.betsService.hiddenEvents;

  readonly hasOpenBets = computed(() =>
    this.bets().some(bet => bet.status !== 'settled'),
  );

  readonly openBets = computed(() =>
    sortBetsBy(
      this.bets().filter(
        bet => bet.status !== 'settled' && !this.hiddenEvents().has(agreedEvent(bet)),
      ),
      this.sortKey(),
      this.currentUserId(),
    ),
  );

  readonly netStanding = computed(() =>
    this.bets().reduce((sum, bet) => sum + settledNet(bet, this.currentUserId()), 0),
  );

  private readonly activeBets = computed(() =>
    this.bets().filter(bet => bet.status === 'active'),
  );

  readonly activeBetsCount = computed(() => this.activeBets().length);

  // Best-case totals across all active bets: the most the user could still win,
  // and the most they could still lose, if every active bet broke their way (or
  // against them). Read from agreed terms so they match what the cards show.
  readonly possibleWin = computed(() =>
    this.activeBets().reduce(
      (sum, bet) => sum + brewskisAtStake(withAgreedTerms(bet), this.currentUserId()),
      0,
    ),
  );

  readonly possibleLoss = computed(() =>
    this.activeBets().reduce(
      (sum, bet) => sum + brewskisAtRisk(withAgreedTerms(bet), this.currentUserId()),
      0,
    ),
  );

  readonly standingLabel = computed(() => {
    const net = this.netStanding();
    if (net > 0) {
      return 'owed to you';
    }
    if (net < 0) {
      return 'you owe';
    }
    return 'all square';
  });

  readonly standingValue = computed(() => Math.abs(this.netStanding()));

  async ngOnInit(): Promise<void> {
    this.loading.set(!this.betsService.loaded());
    try {
      await this.betsService.loadBets();
    } catch {
      // dashboard still renders any cached bets
    } finally {
      this.loading.set(false);
    }
  }

  onSortChange(value: string): void {
    this.sortKey.set(value as BetSortKey);
  }
}
