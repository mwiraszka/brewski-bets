import {
  AvatarComponent,
  ButtonComponent,
  CardComponent,
  DialogComponent,
  EmptyStateComponent,
  InboxIconComponent,
  InputComponent,
  SearchIconComponent,
  SkeletonComponent,
  TabComponent,
  TabsComponent,
  ToastService,
  UsersIconComponent,
} from '@eagami/ui';

import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Friend, FriendRequest, SentFriendRequest, UserSearchResult } from '@app/models';
import { FriendsService } from '@app/services/friends.service';

const ACTIVE_TAB_STORAGE_KEY = 'brewskibets.friendsActiveTab';
const VALID_TABS = ['friends', 'requests', 'find'] as const;
type FriendsTab = (typeof VALID_TABS)[number];

function readStoredTab(): FriendsTab {
  const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return VALID_TABS.includes(stored as FriendsTab) ? (stored as FriendsTab) : 'friends';
}

@Component({
  selector: 'bb-friends-page',
  templateUrl: './friends-page.component.html',
  styleUrl: './friends-page.component.scss',
  imports: [
    AvatarComponent,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    EmptyStateComponent,
    InboxIconComponent,
    InputComponent,
    SearchIconComponent,
    SkeletonComponent,
    TabComponent,
    TabsComponent,
    UsersIconComponent,
  ],
})
export class FriendsPageComponent implements OnInit {
  private readonly friendsService = inject(FriendsService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<FriendsTab>(
    (() => {
      const queryTab = this.route.snapshot.queryParamMap.get('tab');
      if (queryTab && VALID_TABS.includes(queryTab as FriendsTab)) {
        return queryTab as FriendsTab;
      }
      return readStoredTab();
    })(),
  );
  readonly loading = signal(true);
  readonly skeletonRows = Array.from({ length: 4 });

  constructor() {
    effect(() => {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, this.activeTab());
    });
  }

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

  // Per-row in-flight tracking so each button shows its own spinner and stays
  // clickable independently of its neighbours. Keyed by user id for the
  // "Add friend" action (no request yet exists) and by friendship/request id
  // for accept / decline / cancel.
  readonly sendingUserIds = signal<ReadonlySet<string>>(new Set());
  readonly processingRequestIds = signal<ReadonlySet<string>>(new Set());

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      await this.friendsService.loadOverview();
    } catch {
      this.toast.error('Failed to load friends');
    } finally {
      this.loading.set(false);
    }
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

  isSending(userId: string): boolean {
    return this.sendingUserIds().has(userId);
  }

  isProcessing(requestId: string): boolean {
    return this.processingRequestIds().has(requestId);
  }

  private markSending(userId: string, sending: boolean): void {
    this.sendingUserIds.update(set => {
      const next = new Set(set);
      if (sending) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }

  private markProcessing(requestId: string, processing: boolean): void {
    this.processingRequestIds.update(set => {
      const next = new Set(set);
      if (processing) {
        next.add(requestId);
      } else {
        next.delete(requestId);
      }
      return next;
    });
  }

  async onSendRequest(user: UserSearchResult): Promise<void> {
    this.markSending(user.id, true);
    try {
      await this.friendsService.sendRequest(user.id);
      // Swap the button to "Pending" right away, then reconcile in the
      // background so the server's real request id replaces the optimistic
      // placeholder without re-running the search (which would flicker the
      // list out behind a "Searching…" state).
      this.friendsService.addOptimisticSentRequest(user);
      this.toast.success('Friend request sent');
      void this.friendsService.loadSentRequests();
    } catch {
      this.toast.error('Failed to send friend request');
    } finally {
      this.markSending(user.id, false);
    }
  }

  async onAcceptRequest(request: FriendRequest): Promise<void> {
    this.markProcessing(request.id, true);
    try {
      await this.friendsService.acceptRequest(request.id);
      this.friendsService.acceptOptimistic(request);
      this.toast.success(
        `${request.requester.firstName} ${request.requester.lastName} added as a friend`,
      );
      void this.friendsService.loadFriends();
      void this.friendsService.loadIncomingRequests();
    } catch {
      this.toast.error('Failed to accept friend request');
    } finally {
      this.markProcessing(request.id, false);
    }
  }

  async onDeclineRequest(request: FriendRequest): Promise<void> {
    this.markProcessing(request.id, true);
    try {
      await this.friendsService.declineOrRemove(request.id);
      this.friendsService.removeOptimisticIncomingRequest(request.id);
      void this.friendsService.loadIncomingRequests();
    } catch {
      this.toast.error('Failed to decline friend request');
    } finally {
      this.markProcessing(request.id, false);
    }
  }

  async onCancelSentRequest(request: SentFriendRequest): Promise<void> {
    this.markProcessing(request.id, true);
    try {
      await this.friendsService.declineOrRemove(request.id);
      this.friendsService.removeOptimisticSentRequest(request.id);
      void this.friendsService.loadSentRequests();
    } catch {
      this.toast.error('Failed to cancel friend request');
    } finally {
      this.markProcessing(request.id, false);
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
