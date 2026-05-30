import { Injectable, inject, signal } from '@angular/core';

import {
  type Friend,
  type FriendRequest,
  type FriendsOverview,
  type SentFriendRequest,
  type UserSearchResult,
} from '@app/models';

import { ApiService } from './api.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private readonly api = inject(ApiService);

  private readonly _friends = signal<Friend[]>([]);
  private readonly _incomingRequests = signal<FriendRequest[]>([]);
  private readonly _sentRequests = signal<SentFriendRequest[]>([]);
  private readonly _incomingRequestsCount = signal(0);

  readonly friends = this._friends.asReadonly();
  readonly incomingRequests = this._incomingRequests.asReadonly();
  readonly sentRequests = this._sentRequests.asReadonly();
  readonly incomingRequestsCount = this._incomingRequestsCount.asReadonly();

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;

  async loadFriends(): Promise<void> {
    const friends = await this.api.get<Friend[]>('/friends');
    this._friends.set(friends);
  }

  async loadIncomingRequests(): Promise<void> {
    const requests = await this.api.get<FriendRequest[]>('/friends/requests');
    this._incomingRequests.set(requests);
    this._incomingRequestsCount.set(requests.length);
  }

  async loadIncomingRequestsCount(): Promise<void> {
    const result = await this.api.get<{ count: number }>('/friends/requests/count');
    this._incomingRequestsCount.set(result.count);
  }

  async loadSentRequests(): Promise<void> {
    const requests = await this.api.get<SentFriendRequest[]>('/friends/sent');
    this._sentRequests.set(requests);
  }

  async loadOverview(): Promise<void> {
    const overview = await this.api.get<FriendsOverview>('/friends/overview');
    this._friends.set(overview.friends);
    this._incomingRequests.set(overview.incomingRequests);
    this._sentRequests.set(overview.sentRequests);
    this._incomingRequestsCount.set(overview.incomingRequests.length);
  }

  startPolling(): void {
    if (this.pollIntervalId !== null || typeof document === 'undefined') {
      return;
    }

    this.pollIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void this.loadIncomingRequests();
      }
    }, POLL_INTERVAL_MS);

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        void this.loadIncomingRequests();
      }
    };
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

  addOptimisticSentRequest(addressee: UserSearchResult): void {
    this._sentRequests.update(list => {
      if (list.some(r => r.addressee.id === addressee.id)) {
        return list;
      }
      return [
        ...list,
        {
          id: `optimistic-${addressee.id}`,
          status: 'pending',
          createdDate: new Date().toISOString(),
          addressee: { ...addressee },
        },
      ];
    });
  }

  removeOptimisticSentRequest(id: string): void {
    this._sentRequests.update(list => list.filter(r => r.id !== id));
  }

  acceptOptimistic(request: FriendRequest): void {
    this._incomingRequests.update(list => list.filter(r => r.id !== request.id));
    this._incomingRequestsCount.update(c => Math.max(0, c - 1));
    this._friends.update(list => {
      if (list.some(f => f.id === request.requester.id)) {
        return list;
      }
      return [
        ...list,
        {
          id: request.requester.id,
          firstName: request.requester.firstName,
          lastName: request.requester.lastName,
          clerkImageUrl: request.requester.clerkImageUrl,
          friendshipId: request.id,
        },
      ];
    });
  }

  removeOptimisticIncomingRequest(id: string): void {
    this._incomingRequests.update(list => list.filter(r => r.id !== id));
    this._incomingRequestsCount.update(c => Math.max(0, c - 1));
  }

  async sendRequest(addresseeId: string): Promise<void> {
    await this.api.post('/friends/request', { addresseeId });
  }

  async acceptRequest(friendshipId: string): Promise<void> {
    await this.api.post(`/friends/${friendshipId}/accept`);
  }

  async declineOrRemove(friendshipId: string): Promise<void> {
    await this.api.delete(`/friends/${friendshipId}`);
  }

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    return this.api.get<UserSearchResult[]>(
      `/users/search?q=${encodeURIComponent(query)}`,
    );
  }
}
