import { type Bet, type BetResult } from '@app/models';

import { isAwaitingOutcome, isMyTurn, positionOf, settledNet } from './bets';

function makeBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'bet-1',
    title: 'Test bet',
    description: null,
    iconSlug: null,
    iconColor: null,
    resolutionDate: null,
    user1Id: 'user-a',
    user2Id: 'user-b',
    results: [],
    selectedResultIndex: null,
    status: 'active',
    outcome: 'open',
    pendingAction: null,
    settlementProposed: false,
    createdBy: 'user-a',
    lastModifiedBy: 'user-a',
    createdDate: '2026-01-01T00:00:00.000Z',
    lastModifiedDate: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const result = (over: Partial<BetResult>): BetResult => ({
  name: 'Outcome',
  brewskiCount: 3,
  assignedTo: null,
  ...over,
});

describe('positionOf', () => {
  it('identifies which side of the bet a user is on', () => {
    const bet = makeBet();

    expect(positionOf(bet, 'user-a')).toBe('user1');
    expect(positionOf(bet, 'user-b')).toBe('user2');
    expect(positionOf(bet, 'stranger')).toBeNull();
    expect(positionOf(bet, undefined)).toBeNull();
  });
});

describe('isMyTurn', () => {
  it('is true only when the pending action matches the user position', () => {
    const bet = makeBet({ pendingAction: 'user2' });

    expect(isMyTurn(bet, 'user-b')).toBe(true);
    expect(isMyTurn(bet, 'user-a')).toBe(false);
  });

  it('is false when no action is pending', () => {
    expect(isMyTurn(makeBet({ pendingAction: null }), 'user-a')).toBe(false);
  });
});

describe('isAwaitingOutcome', () => {
  const now = new Date('2026-06-13T12:00:00.000Z');

  it('is true for an active bet past its resolution date', () => {
    const bet = makeBet({ resolutionDate: '2026-06-10T00:00:00.000Z' });

    expect(isAwaitingOutcome(bet, now)).toBe(true);
  });

  it('is false before the resolution date', () => {
    const bet = makeBet({ resolutionDate: '2026-06-20T00:00:00.000Z' });

    expect(isAwaitingOutcome(bet, now)).toBe(false);
  });

  it('is false without a resolution date or when not active', () => {
    expect(isAwaitingOutcome(makeBet({ resolutionDate: null }), now)).toBe(false);
    expect(
      isAwaitingOutcome(
        makeBet({ status: 'settled', resolutionDate: '2026-06-10T00:00:00.000Z' }),
        now,
      ),
    ).toBe(false);
  });

  it('is false while a settlement is already proposed', () => {
    const bet = makeBet({
      resolutionDate: '2026-06-10T00:00:00.000Z',
      settlementProposed: true,
    });

    expect(isAwaitingOutcome(bet, now)).toBe(false);
  });
});

describe('settledNet', () => {
  it('is positive when the opponent owes the user', () => {
    const bet = makeBet({
      status: 'settled',
      outcome: 'resolved',
      selectedResultIndex: 0,
      results: [result({ assignedTo: 'user2', brewskiCount: 4 })],
    });

    expect(settledNet(bet, 'user-a')).toBe(4);
  });

  it('is negative when the user owes the opponent', () => {
    const bet = makeBet({
      status: 'settled',
      outcome: 'resolved',
      selectedResultIndex: 0,
      results: [result({ assignedTo: 'user1', brewskiCount: 4 })],
    });

    expect(settledNet(bet, 'user-a')).toBe(-4);
  });

  it('is zero for unsettled or voided bets', () => {
    expect(settledNet(makeBet({ status: 'active' }), 'user-a')).toBe(0);
    expect(
      settledNet(
        makeBet({ status: 'settled', outcome: 'void', selectedResultIndex: 0 }),
        'user-a',
      ),
    ).toBe(0);
  });
});
