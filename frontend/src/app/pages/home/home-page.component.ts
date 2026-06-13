import {
  BottleIconComponent,
  ButtonComponent,
  EmptyStateComponent,
  SkeletonComponent,
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
import { type BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { UserService } from '@app/services/user.service';
import { isAwaitingOutcome, isMyTurn, settledNet } from '@app/util';

@Component({
  selector: 'bb-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    BetCardComponent,
    BottleIconComponent,
    ButtonComponent,
    EmptyStateComponent,
    SkeletonComponent,
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

  readonly openBets = computed(() =>
    this.bets()
      .filter(bet => bet.status !== 'settled')
      .sort((a, b) => this.sortRank(a) - this.sortRank(b)),
  );

  readonly netStanding = computed(() =>
    this.bets().reduce((sum, bet) => sum + settledNet(bet, this.currentUserId()), 0),
  );

  readonly activeBetsCount = computed(
    () => this.bets().filter(bet => bet.status === 'active').length,
  );

  readonly attentionCount = computed(() => this.attentionBets().length);

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

  private sortRank(bet: BetWithOpponent): number {
    if (isMyTurn(bet, this.currentUserId()) || isAwaitingOutcome(bet)) {
      return 0;
    }
    if (bet.status === 'active') {
      return 1;
    }
    return 2;
  }
}
