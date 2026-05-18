import { Injectable, inject, signal } from '@angular/core';

import { Bet, BetResult, BetWithOpponent } from '@app/models';

import { ApiService } from './api.service';

export interface CreateBetPayload {
  title: string;
  description: string;
  imageSlug: string | null;
  user2Id: string;
  results: Omit<BetResult, 'isSpecial'>[];
}

export interface UpdateBetPayload {
  title?: string;
  description?: string;
  imageSlug?: string | null;
  results?: Omit<BetResult, 'isSpecial'>[];
  selectedResultIndex?: number;
  action: 'submit' | 'accept';
}

@Injectable({
  providedIn: 'root',
})
export class BetsService {
  private readonly api = inject(ApiService);

  private readonly _bets = signal<BetWithOpponent[]>([]);
  private readonly _pendingCount = signal(0);

  readonly bets = this._bets.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();

  async loadBets(): Promise<void> {
    const bets = await this.api.get<BetWithOpponent[]>('/bets');
    this._bets.set(bets);
  }

  async loadPendingCount(): Promise<void> {
    const result = await this.api.get<{ count: number }>('/bets/pending-count');
    this._pendingCount.set(result.count);
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
