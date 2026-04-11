import {
  AvatarComponent,
  ButtonComponent,
  CardComponent,
  DialogComponent,
  InputComponent,
  TabComponent,
  TabsComponent,
  ToastService,
} from '@eagami/ui';

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Friend, FriendRequest, SentFriendRequest, UserSearchResult } from '@app/models';
import { ClerkService } from '@app/services/clerk.service';
import { FriendsService } from '@app/services/friends.service';

@Component({
  selector: 'bb-friends-page',
  templateUrl: './friends-page.component.html',
  styleUrl: './friends-page.component.scss',
  imports: [
    AvatarComponent,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    InputComponent,
    TabComponent,
    TabsComponent,
  ],
})
export class FriendsPageComponent implements OnInit {
  private readonly friendsService = inject(FriendsService);
  private readonly clerk = inject(ClerkService);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal('friends');
  readonly loading = signal(true);

  readonly friends = this.friendsService.friends;
  readonly incomingRequests = this.friendsService.incomingRequests;
  readonly sentRequests = this.friendsService.sentRequests;

  readonly requestsTabLabel = computed(() => {
    const count = this.incomingRequests().length;
    return count > 0 ? `Requests (${count})` : 'Requests';
  });

  readonly searchQuery = signal('');
  readonly searchResults = signal<UserSearchResult[]>([]);
  readonly searching = signal(false);

  readonly removeDialogOpen = signal(false);
  private friendToRemove: Friend | null = null;
  readonly removingId = signal<string | null>(null);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.friendsService.loadFriends(),
      this.friendsService.loadIncomingRequests(),
      this.friendsService.loadSentRequests(),
    ]);
    this.loading.set(false);
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.searchTimeout = setTimeout(() => this.performSearch(query), 300);
  }

  private async performSearch(query: string): Promise<void> {
    this.searching.set(true);
    try {
      const results = await this.friendsService.searchUsers(query);
      this.searchResults.set(results);
    } catch {
      this.toast.error('Failed to search users');
    } finally {
      this.searching.set(false);
    }
  }

  async onSendRequest(userId: string): Promise<void> {
    try {
      await this.friendsService.sendRequest(userId);
      this.toast.success('Friend request sent');
      await this.friendsService.loadSentRequests();

      if (this.searchQuery().trim().length >= 2) {
        await this.performSearch(this.searchQuery());
      }
    } catch {
      this.toast.error('Failed to send friend request');
    }
  }

  async onAcceptRequest(request: FriendRequest): Promise<void> {
    try {
      await this.friendsService.acceptRequest(request.id);
      this.toast.success(
        `${request.requester.firstName} ${request.requester.lastName} added as a friend`,
      );
      await Promise.all([
        this.friendsService.loadFriends(),
        this.friendsService.loadIncomingRequests(),
      ]);
    } catch {
      this.toast.error('Failed to accept friend request');
    }
  }

  async onDeclineRequest(request: FriendRequest): Promise<void> {
    try {
      await this.friendsService.declineOrRemove(request.id);
      await this.friendsService.loadIncomingRequests();
    } catch {
      this.toast.error('Failed to decline friend request');
    }
  }

  async onCancelSentRequest(request: SentFriendRequest): Promise<void> {
    try {
      await this.friendsService.declineOrRemove(request.id);
      await this.friendsService.loadSentRequests();
    } catch {
      this.toast.error('Failed to cancel friend request');
    }
  }

  confirmRemoveFriend(friend: Friend): void {
    this.friendToRemove = friend;
    this.removeDialogOpen.set(true);
  }

  async onConfirmRemove(): Promise<void> {
    if (!this.friendToRemove) return;
    this.removingId.set(this.friendToRemove.friendshipId);

    try {
      await this.friendsService.declineOrRemove(this.friendToRemove.friendshipId);
      this.removeDialogOpen.set(false);
      this.friendToRemove = null;
      await this.friendsService.loadFriends();
    } catch {
      this.toast.error('Failed to remove friend');
    } finally {
      this.removingId.set(null);
    }
  }

  isAlreadyFriend(userId: string): boolean {
    return this.friends().some(f => f.id === userId);
  }

  hasPendingRequest(userId: string): boolean {
    return (
      this.sentRequests().some(r => r.addressee.id === userId) ||
      this.incomingRequests().some(r => r.requester.id === userId)
    );
  }

  getAvatarSrc(clerkImageUrl: string | null): string | undefined {
    return clerkImageUrl ?? undefined;
  }

  getInitials(firstName: string, lastName: string): string | undefined {
    const initials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
    return initials || undefined;
  }
}
