import { type Bet } from '@app/models';

export type BetPosition = 'user1' | 'user2';

export function positionOf(bet: Bet, userId: string | undefined): BetPosition | null {
  if (!userId) {
    return null;
  }
  if (bet.user1Id === userId) {
    return 'user1';
  }
  return bet.user2Id === userId ? 'user2' : null;
}

export function isMyTurn(bet: Bet, userId: string | undefined): boolean {
  const position = positionOf(bet, userId);
  return position != null && bet.pendingAction === position;
}

// True when the user proposed a change that now awaits the other side, so they
// can re-edit or withdraw it rather than just wait.
export function isPendingRequester(bet: Bet, userId: string | undefined): boolean {
  return (
    bet.status !== 'settled' &&
    !bet.settlementProposed &&
    bet.previousState != null &&
    bet.pendingAction != null &&
    !isMyTurn(bet, userId)
  );
}

// The agreed view of a bet for display. While a change is pending, the bet's main
// fields hold the unaccepted proposal and previousState holds the agreed terms,
// so swap them back. Lifecycle fields (status, pendingAction, outcome) stay live.
// Settled bets and bets with no pending change are returned unchanged.
export function withAgreedTerms<T extends Bet>(bet: T): T {
  const prev = bet.previousState;
  if (prev == null) {
    return bet;
  }
  return {
    ...bet,
    title: prev.title,
    description: prev.description,
    iconSlug: prev.iconSlug,
    iconColor: prev.iconColor,
    resolutionDate: prev.resolutionDate,
    results: prev.results,
  };
}

export function isAwaitingOutcome(bet: Bet, now: Date = new Date()): boolean {
  return (
    bet.status === 'active' &&
    !bet.settlementProposed &&
    bet.resolutionDate != null &&
    new Date(bet.resolutionDate) <= now
  );
}

// The largest single non-void outcome assigned to one side, since exactly one
// outcome ever resolves. Voided outcomes never pay out, so they are ignored.
function bestOutcomeFor(bet: Bet, side: BetPosition | null): number {
  if (side == null) {
    return 0;
  }
  return bet.results.reduce(
    (max, result) =>
      result.isSpecial !== 'void' && result.assignedTo === side
        ? Math.max(max, result.brewskiCount)
        : max,
    0,
  );
}

// The most brewskis the user stands to win from a bet (their best-case outcome).
export function brewskisAtStake(bet: Bet, userId: string | undefined): number {
  return bestOutcomeFor(bet, positionOf(bet, userId));
}

// The most brewskis the user stands to lose from a bet: the opponent's best-case
// outcome, which the user pays out if it resolves.
export function brewskisAtRisk(bet: Bet, userId: string | undefined): number {
  const me = positionOf(bet, userId);
  const opponent = me == null ? null : me === 'user1' ? 'user2' : 'user1';
  return bestOutcomeFor(bet, opponent);
}

export type BetSortKey = 'title' | 'resolution' | 'brewskis' | 'modified';

// Orders bets for the dashboard. Title, resolution date, and brewskis are read
// from the agreed terms so the order matches what the cards display. The latter
// three keys fall back to bet title when their primary value ties or is absent
// (e.g. a bet with no resolution date), so the order is always deterministic.
export function sortBetsBy<T extends Bet>(
  bets: readonly T[],
  key: BetSortKey,
  userId: string | undefined,
): T[] {
  const decorated = bets.map(bet => {
    const agreed = withAgreedTerms(bet);
    return {
      bet,
      title: agreed.title,
      resolution: agreed.resolutionDate
        ? new Date(agreed.resolutionDate).getTime()
        : Number.POSITIVE_INFINITY,
      brewskis: brewskisAtStake(agreed, userId),
      modified: new Date(bet.lastModifiedDate).getTime(),
    };
  });

  const byTitle = (
    a: (typeof decorated)[number],
    b: (typeof decorated)[number],
  ): number => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

  decorated.sort((a, b) => {
    switch (key) {
      case 'title':
        return byTitle(a, b);
      case 'resolution':
        return a.resolution - b.resolution || byTitle(a, b);
      case 'brewskis':
        return b.brewskis - a.brewskis || byTitle(a, b);
      case 'modified':
        return b.modified - a.modified || byTitle(a, b);
    }
  });

  return decorated.map(entry => entry.bet);
}

// Net brewskis for a settled bet from the user's perspective: positive means
// the opponent owes the user, negative means the user owes the opponent.
// `assignedTo` is the winner of the outcome, so a result assigned to the user
// means the opponent owes them.
export function settledNet(bet: Bet, userId: string | undefined): number {
  if (bet.status !== 'settled' || bet.outcome !== 'resolved') {
    return 0;
  }
  const index = bet.selectedResultIndex;
  const winner = index != null ? bet.results[index] : undefined;
  if (!winner || winner.assignedTo == null) {
    return 0;
  }
  const me = positionOf(bet, userId);
  return winner.assignedTo === me ? winner.brewskiCount : -winner.brewskiCount;
}
