import {
  AvatarComponent,
  BottleIconComponent,
  DropdownComponent,
  EmptyStateComponent,
} from '@eagami/ui';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BetGraphicComponent } from '@app/graphics';
import { type BetWithOpponent } from '@app/models';
import { avatarSrc, settledNet } from '@app/util';

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

interface SettledBet {
  id: string;
  title: string;
  iconSlug: string | null;
  iconColor: string | null;
  opponentName: string;
  outcome: 'resolved' | 'void';
  net: number;
  settledDate: number;
}

type SettledSortKey = 'settlement' | 'name' | 'result';

@Component({
  selector: 'bb-standings',
  templateUrl: './standings.component.html',
  styleUrl: './standings.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    AvatarComponent,
    BetGraphicComponent,
    BottleIconComponent,
    DropdownComponent,
    EmptyStateComponent,
  ],
})
export class StandingsComponent {
  readonly bets = input.required<BetWithOpponent[]>();
  readonly currentUserId = input<string | undefined>(undefined);

  readonly sortKey = signal<SettledSortKey>('settlement');

  readonly sortOptions = [
    { label: 'Settlement date', value: 'settlement' },
    { label: 'Name', value: 'name' },
    { label: 'Result', value: 'result' },
  ];

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

  // Every settled bet gets a card: resolved ones show the net beers won or lost,
  // voided ones are struck through. Voids settle to no beers, so their net is 0.
  readonly settledBets = computed<SettledBet[]>(() => {
    const userId = this.currentUserId();
    const items = this.bets()
      .filter(bet => bet.status === 'settled')
      .map((bet): SettledBet => ({
        id: bet.id,
        title: bet.title,
        iconSlug: bet.iconSlug,
        iconColor: bet.iconColor,
        opponentName: bet.opponent
          ? `${bet.opponent.firstName} ${bet.opponent.lastName}`
          : '',
        outcome: bet.outcome === 'void' ? 'void' : 'resolved',
        net: settledNet(bet, userId),
        settledDate: new Date(bet.lastModifiedDate).getTime(),
      }));

    const byName = (a: SettledBet, b: SettledBet): number =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

    const key = this.sortKey();
    return items.sort((a, b) => {
      switch (key) {
        case 'name':
          return byName(a, b);
        // Most won at the top down to most lost, with voids (net 0) in the centre
        case 'result':
          return b.net - a.net || byName(a, b);
        case 'settlement':
          return b.settledDate - a.settledDate || byName(a, b);
      }
    });
  });

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

  onSortChange(value: string): void {
    this.sortKey.set(value as SettledSortKey);
  }

  resultLabel(net: number): string {
    return net > 0 ? `+${net}` : String(net);
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
