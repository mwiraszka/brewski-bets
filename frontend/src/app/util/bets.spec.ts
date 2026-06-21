import { type Bet, type BetResult } from '@app/models';

import {
  brewskisAtStake,
  isAwaitingOutcome,
  isMyTurn,
  positionOf,
  settledNet,
  sortBetsBy,
} from './bets';

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
    previousState: null,
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
      results: [result({ assignedTo: 'user1', brewskiCount: 4 })],
    });

    expect(settledNet(bet, 'user-a')).toBe(4);
  });

  it('is negative when the user owes the opponent', () => {
    const bet = makeBet({
      status: 'settled',
      outcome: 'resolved',
      selectedResultIndex: 0,
      results: [result({ assignedTo: 'user2', brewskiCount: 4 })],
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

describe('brewskisAtStake', () => {
  it('returns the largest outcome the user can win', () => {
    const bet = makeBet({
      results: [
        result({ assignedTo: 'user1', brewskiCount: 3 }),
        result({ assignedTo: 'user2', brewskiCount: 5 }),
        result({ assignedTo: 'user1', brewskiCount: 7 }),
      ],
    });

    expect(brewskisAtStake(bet, 'user-a')).toBe(7);
    expect(brewskisAtStake(bet, 'user-b')).toBe(5);
  });

  it('ignores voided outcomes', () => {
    const bet = makeBet({
      results: [
        result({ assignedTo: 'user1', brewskiCount: 9, isSpecial: 'void' }),
        result({ assignedTo: 'user1', brewskiCount: 2 }),
      ],
    });

    expect(brewskisAtStake(bet, 'user-a')).toBe(2);
  });

  it('is zero when the user is not part of the bet', () => {
    const bet = makeBet({ results: [result({ assignedTo: 'user1', brewskiCount: 4 })] });

    expect(brewskisAtStake(bet, 'stranger')).toBe(0);
    expect(brewskisAtStake(bet, undefined)).toBe(0);
  });
});

describe('sortBetsBy', () => {
  it('sorts by title alphabetically, case-insensitively', () => {
    const bets = [
      makeBet({ id: '1', title: 'banana' }),
      makeBet({ id: '2', title: 'Apple' }),
      makeBet({ id: '3', title: 'cherry' }),
    ];

    expect(sortBetsBy(bets, 'title', 'user-a').map(bet => bet.title)).toEqual([
      'Apple',
      'banana',
      'cherry',
    ]);
  });

  it('sorts by resolution date soonest first, undated bets last by title', () => {
    const bets = [
      makeBet({ id: '1', title: 'Zebra', resolutionDate: null }),
      makeBet({ id: '2', title: 'later', resolutionDate: '2026-12-01T00:00:00.000Z' }),
      makeBet({ id: '3', title: 'Alpha', resolutionDate: null }),
      makeBet({ id: '4', title: 'sooner', resolutionDate: '2026-06-01T00:00:00.000Z' }),
    ];

    expect(sortBetsBy(bets, 'resolution', 'user-a').map(bet => bet.title)).toEqual([
      'sooner',
      'later',
      'Alpha',
      'Zebra',
    ]);
  });

  it('sorts by brewskis at stake descending, ties broken by title', () => {
    const big = result({ assignedTo: 'user1', brewskiCount: 8 });
    const small = result({ assignedTo: 'user1', brewskiCount: 2 });
    const bets = [
      makeBet({ id: '1', title: 'small', results: [small] }),
      makeBet({ id: '2', title: 'big', results: [big] }),
      makeBet({ id: '3', title: 'also-small', results: [small] }),
    ];

    expect(sortBetsBy(bets, 'brewskis', 'user-a').map(bet => bet.title)).toEqual([
      'big',
      'also-small',
      'small',
    ]);
  });

  it('sorts by last modified date most recent first', () => {
    const bets = [
      makeBet({ id: '1', title: 'old', lastModifiedDate: '2026-01-01T00:00:00.000Z' }),
      makeBet({ id: '2', title: 'new', lastModifiedDate: '2026-06-01T00:00:00.000Z' }),
    ];

    expect(sortBetsBy(bets, 'modified', 'user-a').map(bet => bet.title)).toEqual([
      'new',
      'old',
    ]);
  });

  it('does not mutate the input array', () => {
    const bets = [makeBet({ id: '1', title: 'b' }), makeBet({ id: '2', title: 'a' })];
    const original = [...bets];

    sortBetsBy(bets, 'title', 'user-a');

    expect(bets).toEqual(original);
  });
});
