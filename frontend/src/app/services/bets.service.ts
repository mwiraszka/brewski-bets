import { Injectable, inject, signal } from '@angular/core';

import { type Bet, type BetResult, type BetWithOpponent } from '@app/models';

import { ApiService } from './api.service';

export interface CreateBetPayload {
  title: string;
  description: string | null;
  iconSlug: string | null;
  iconColor: string | null;
  user2Id: string;
  results: Omit<BetResult, 'isSpecial'>[];
}

export interface UpdateBetPayload {
  title?: string;
  description?: string | null;
  iconSlug?: string | null;
  iconColor?: string | null;
  results?: Omit<BetResult, 'isSpecial'>[];
  selectedResultIndex?: number;
  action: 'submit' | 'accept' | 'settle' | 'reject';
}

const POLL_INTERVAL_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class BetsService {
  private readonly api = inject(ApiService);

  private readonly _bets = signal<BetWithOpponent[]>([]);
  private readonly _pendingCount = signal(0);

  readonly bets = this._bets.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  async loadBets(): Promise<void> {
    const bets = await this.api.get<BetWithOpponent[]>('/bets');
    this._bets.set(bets);
  }

  async loadPendingCount(): Promise<void> {
    const result = await this.api.get<{ count: number }>('/bets/pending-count');
    this._pendingCount.set(result.count);
  }

  startPolling(): void {
    if (this.pollIntervalId !== null || typeof document === 'undefined') {
      return;
    }

    const refresh = (): void => {
      if (document.visibilityState === 'visible') {
        void this.loadBets();
        void this.loadPendingCount();
      }
    };

    this.pollIntervalId = setInterval(refresh, POLL_INTERVAL_MS);

    this.visibilityHandler = refresh;
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stopPolling(): void {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  async getBet(id: string): Promise<BetWithOpponent> {
    return this.api.get<BetWithOpponent>(`/bets/${id}`);
  }

  async createBet(payload: CreateBetPayload): Promise<Bet> {
    return this.api.post<Bet>('/bets', payload);
  }

  async updateBet(id: string, payload: UpdateBetPayload): Promise<Bet> {
    return this.api.patch<Bet>(`/bets/${id}`, payload);
  }

  async deleteBet(id: string): Promise<void> {
    await this.api.delete(`/bets/${id}`);
  }
}
