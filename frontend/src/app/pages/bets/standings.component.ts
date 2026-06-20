import { AvatarComponent, BottleIconComponent, EmptyStateComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BetGraphicComponent } from '@app/graphics';
import { type BetWithOpponent } from '@app/models';
import { avatarSrc } from '@app/util';

interface StandingBreakdownItem {
  title: string;
  iconSlug: string | null;
  iconColor: string | null;
  beers: number;
  iOwe: boolean;
}

interface OpponentStanding {
  opponentId: string;
  name: string;
  avatarUrl: string | null;
  net: number;
  breakdown: StandingBreakdownItem[];
}

interface VoidBet {
  id: string;
  title: string;
  iconSlug: string | null;
  iconColor: string | null;
  opponentName: string;
}

@Component({
  selector: 'bb-standings',
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AvatarComponent,
    BetGraphicComponent,
    BottleIconComponent,
    EmptyStateComponent,
  ],
})
export class StandingsComponent {
  readonly bets = input.required<BetWithOpponent[]>();
  readonly currentUserId = input<string | undefined>(undefined);

  readonly standings = computed<OpponentStanding[]>(() => {
    const userId = this.currentUserId();
    const byOpponent = new Map<string, OpponentStanding>();

    for (const bet of this.bets()) {
      if (bet.status !== 'settled' || bet.outcome !== 'resolved') {
        continue;
      }

      const index = bet.selectedResultIndex;
      const winner = index != null ? bet.results[index] : undefined;
      if (!winner || winner.assignedTo == null || !bet.opponent) {
        continue;
      }

      const myPosition = bet.user1Id === userId ? 'user1' : 'user2';
      const iOwe = winner.assignedTo !== myPosition;
      const beers = winner.brewskiCount;

      let standing = byOpponent.get(bet.opponent.id);
      if (!standing) {
        standing = {
          opponentId: bet.opponent.id,
          name: `${bet.opponent.firstName} ${bet.opponent.lastName}`,
          avatarUrl: bet.opponent.avatarUrl,
          net: 0,
          breakdown: [],
        };
        byOpponent.set(bet.opponent.id, standing);
      }

      standing.net += iOwe ? -beers : beers;
      standing.breakdown.push({
        title: bet.title,
        iconSlug: bet.iconSlug,
        iconColor: bet.iconColor,
        beers,
        iOwe,
      });
    }

    return [...byOpponent.values()].sort((a, b) => b.net - a.net);
  });

  // Voided bets settle to no beers, so they carry no net but are still shown,
  // struck through, so a resolved bet board does not look empty when the only
  // settled bets were voided
  readonly voidBets = computed<VoidBet[]>(() =>
    this.bets()
      .filter(bet => bet.status === 'settled' && bet.outcome === 'void')
      .map(bet => ({
        id: bet.id,
        title: bet.title,
        iconSlug: bet.iconSlug,
        iconColor: bet.iconColor,
        opponentName: bet.opponent
          ? `${bet.opponent.firstName} ${bet.opponent.lastName}`
          : '',
      })),
  );

  private readonly maxAbsNet = computed(() =>
    Math.max(1, ...this.standings().map(s => Math.abs(s.net))),
  );

  barWidth(net: number): number {
    return (Math.abs(net) / this.maxAbsNet()) * 50;
  }

  summary(net: number): string {
    if (net > 0) {
      return `Owes you ${net}`;
    }
    if (net < 0) {
      return `You owe ${Math.abs(net)}`;
    }
    return 'All square';
  }

  getAvatarSrc(avatarUrl: string | null): string | undefined {
    return avatarSrc(avatarUrl);
  }

  getInitials(name: string): string | undefined {
    const initials = name
      .split(' ')
      .map(part => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || undefined;
  }
}
