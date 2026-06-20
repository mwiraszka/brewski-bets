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
