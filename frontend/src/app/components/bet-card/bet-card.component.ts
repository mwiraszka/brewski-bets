import { AvatarComponent, BadgeComponent, CalendarIconComponent } from '@eagami/ui';

import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BetGraphicComponent } from '@app/graphics';
import { type BetWithOpponent } from '@app/models';
import { avatarSrc, initialsOf, isAwaitingOutcome, isMyTurn } from '@app/util';

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

  readonly myTurn = computed(() => isMyTurn(this.bet(), this.currentUserId()));
  readonly awaitingOutcome = computed(() => isAwaitingOutcome(this.bet()));

  readonly changesPending = computed(
    () => this.bet().pendingAction != null && this.bet().status !== 'settled',
  );
}
