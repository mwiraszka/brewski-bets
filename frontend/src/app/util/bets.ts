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
