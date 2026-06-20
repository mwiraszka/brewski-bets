import {
  AvatarComponent,
  BadgeComponent,
  BottleIconComponent,
  CalendarIconComponent,
} from '@eagami/ui';

import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BetGraphicComponent } from '@app/graphics';
import { type BetWithOpponent } from '@app/models';
import {
  avatarSrc,
  initialsOf,
  isAwaitingOutcome,
  isMyTurn,
  positionOf,
} from '@app/util';

@Component({
  selector: 'bb-bet-card',
  templateUrl: './bet-card.component.html',
  styleUrl: './bet-card.component.scss',
  imports: [
    DatePipe,
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    BetGraphicComponent,
    BottleIconComponent,
    CalendarIconComponent,
  ],
})
export class BetCardComponent {
  readonly bet = input.required<BetWithOpponent>();
  readonly currentUserId = input<string | undefined>(undefined);

  readonly opponentName = computed(() => {
    const opponent = this.bet().opponent;
    return opponent ? `${opponent.firstName} ${opponent.lastName}` : '';
  });

  readonly opponentAvatar = computed(() => avatarSrc(this.bet().opponent?.avatarUrl));

  readonly opponentInitials = computed(() =>
    initialsOf(this.bet().opponent?.firstName, this.bet().opponent?.lastName),
  );

  // Pending edits live on the bet's main fields while the prior agreed terms sit
  // in previousState; the dashboard must show the agreed terms until both parties
  // accept, so proposed-but-unaccepted changes never leak here.
  private readonly displayTerms = computed(() => this.bet().previousState ?? this.bet());

  readonly displayTitle = computed(() => this.displayTerms().title);
  readonly displayIconSlug = computed(() => this.displayTerms().iconSlug);
  readonly displayIconColor = computed(() => this.displayTerms().iconColor);
  readonly displayResolutionDate = computed(() => this.displayTerms().resolutionDate);

  readonly outcomes = computed(() => {
    const me = positionOf(this.bet(), this.currentUserId());
    return this.displayTerms()
      .results.filter(result => result.isSpecial !== 'void')
      .map(result => {
        const iWin = result.assignedTo === me;
        return {
          name: result.name,
          beers: result.brewskiCount,
          iWin,
          stakeLabel: iWin ? 'You win' : 'You owe',
        };
      });
  });

  readonly myTurn = computed(() => isMyTurn(this.bet(), this.currentUserId()));
  readonly awaitingOutcome = computed(() => isAwaitingOutcome(this.bet()));

  readonly changesPending = computed(
    () => this.bet().pendingAction != null && this.bet().status !== 'settled',
  );
}
