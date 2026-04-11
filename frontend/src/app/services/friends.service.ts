import { Injectable, inject, signal } from '@angular/core';

import { Friend, FriendRequest, SentFriendRequest, UserSearchResult } from '@app/models';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private readonly api = inject(ApiService);

  private readonly _friends = signal<Friend[]>([]);
  private readonly _incomingRequests = signal<FriendRequest[]>([]);
  private readonly _sentRequests = signal<SentFriendRequest[]>([]);

  readonly friends = this._friends.asReadonly();
  readonly incomingRequests = this._incomingRequests.asReadonly();
  readonly sentRequests = this._sentRequests.asReadonly();

  async loadFriends(): Promise<void> {
    const friends = await this.api.get<Friend[]>('/friends');
    this._friends.set(friends);
  }

  async loadIncomingRequests(): Promise<void> {
    const requests = await this.api.get<FriendRequest[]>('/friends/requests');
    this._incomingRequests.set(requests);
  }

  async loadSentRequests(): Promise<void> {
    const requests = await this.api.get<SentFriendRequest[]>('/friends/sent');
    this._sentRequests.set(requests);
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
