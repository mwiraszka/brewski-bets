import {
  ButtonComponent,
  CardComponent,
  DialogComponent,
  DropdownComponent,
  InputComponent,
  RadioComponent,
  RadioGroupComponent,
  TagComponent,
  TextareaComponent,
  ToastService,
} from '@eagami/ui';

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BetResult, BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { FriendsService } from '@app/services/friends.service';
import { UserService } from '@app/services/user.service';

const STOCK_IMAGES = [
  { slug: 'beer-cheers', label: 'Beer Cheers' },
  { slug: 'pub-night', label: 'Pub Night' },
  { slug: 'beer-garden', label: 'Beer Garden' },
  { slug: 'trophy', label: 'Trophy' },
  { slug: 'dice', label: 'Dice' },
  { slug: 'handshake', label: 'Handshake' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'poker', label: 'Poker' },
  { slug: 'darts', label: 'Darts' },
  { slug: 'pint', label: 'Pint' },
];

@Component({
  selector: 'bb-bet-form-page',
  templateUrl: './bet-form-page.component.html',
  styleUrl: './bet-form-page.component.scss',
  imports: [
    ButtonComponent,
    CardComponent,
    DialogComponent,
    DropdownComponent,
    InputComponent,
    RadioComponent,
    RadioGroupComponent,
    TagComponent,
    TextareaComponent,
  ],
})
export class BetFormPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly betsService = inject(BetsService);
  private readonly friendsService = inject(FriendsService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly stockImages = STOCK_IMAGES;
  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleteDialogOpen = signal(false);

  readonly title = signal('');
  readonly description = signal('');
  readonly imageSlug = signal<string | null>(null);
  readonly selectedFriendId = signal('');
  readonly results = signal<BetResult[]>([
    { name: '', brewskiCount: 1, assignedTo: 'user1' },
    { name: '', brewskiCount: 1, assignedTo: 'user2' },
  ]);
  readonly selectedResultIndex = signal('');

  readonly titleError = signal('');
  readonly descriptionError = signal('');
  readonly friendError = signal('');

  private bet: BetWithOpponent | null = null;

  readonly friends = this.friendsService.friends;
  readonly friendOptions = computed(() =>
    this.friends().map(f => ({
      value: f.id,
      label: `${f.firstName} ${f.lastName}`,
    })),
  );

  readonly currentUserId = computed(() => this.userService.user()?.id);

  readonly myPosition = computed((): 'user1' | 'user2' | null => {
    if (!this.bet) return null;
    return this.bet.user1Id === this.currentUserId() ? 'user1' : 'user2';
  });

  readonly isMyTurn = computed(() => {
    if (!this.bet) return true;
    return this.bet.pendingAction === this.myPosition();
  });

  readonly opponentName = computed(() => {
    if (this.bet?.opponent) {
      return `${this.bet.opponent.firstName} ${this.bet.opponent.lastName}`;
    }
    return '';
  });

  readonly user1Label = computed(() => {
    if (!this.bet) {
      return 'You';
    }
    if (this.myPosition() === 'user1') {
      return 'You';
    }
    return this.opponentName();
  });

  readonly user2Label = computed(() => {
    if (!this.bet) {
      const friend = this.friends().find(f => f.id === this.selectedFriendId());
      return friend ? `${friend.firstName} ${friend.lastName}` : 'Opponent';
    }
    if (this.myPosition() === 'user2') {
      return 'You';
    }
    return this.opponentName();
  });

  readonly assignedToOptions = computed(() => [
    { value: 'user1', label: this.user1Label() },
    { value: 'user2', label: this.user2Label() },
  ]);

  readonly specialResults = computed(() => {
    if (!this.bet) return [];
    return this.bet.results.filter(r => r.isSpecial);
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.mode.set('edit');
      try {
        this.bet = await this.betsService.getBet(id);
        this.title.set(this.bet.title);
        this.description.set(this.bet.description);
        this.imageSlug.set(this.bet.imageSlug);
        this.results.set(this.bet.results.filter(r => !r.isSpecial));
        this.selectedResultIndex.set(
          this.bet.selectedResultIndex != null
            ? String(this.bet.selectedResultIndex)
            : '',
        );
      } catch {
        this.toast.error('Failed to load bet');
        await this.router.navigate(['/bets']);
        return;
      }
    }

    await this.friendsService.loadFriends();
    this.loading.set(false);
  }

  selectImage(slug: string): void {
    this.imageSlug.set(this.imageSlug() === slug ? null : slug);
  }

  addResult(): void {
    if (this.results().length >= 20) return;
    this.results.update(r => [...r, { name: '', brewskiCount: 1, assignedTo: null }]);
  }

  removeResult(index: number): void {
    if (this.results().length <= 1) return;
    this.results.update(r => r.filter((_, i) => i !== index));
  }

  updateResultName(index: number, name: string): void {
    this.results.update(r =>
      r.map((item, i) => (i === index ? { ...item, name } : item)),
    );
  }

  updateResultBrewskiCount(index: number, value: string): void {
    const brewskiCount = Math.max(0, parseInt(value, 10) || 0);
    this.results.update(r =>
      r.map((item, i) => (i === index ? { ...item, brewskiCount } : item)),
    );
  }

  updateResultAssignedTo(index: number, value: string): void {
    const assignedTo = value === 'user1' || value === 'user2' ? value : null;
    this.results.update(r =>
      r.map((item, i) => (i === index ? { ...item, assignedTo } : item)),
    );
  }

  private validate(): boolean {
    this.titleError.set('');
    this.descriptionError.set('');
    this.friendError.set('');

    let valid = true;

    if (!this.title().trim()) {
      this.titleError.set('Title is required');
      valid = false;
    }

    if (!this.description().trim()) {
      this.descriptionError.set('Description is required');
      valid = false;
    }

    if (this.mode() === 'create' && !this.selectedFriendId()) {
      this.friendError.set('Select a friend to bet against');
      valid = false;
    }

    const hasEmptyResult = this.results().some(r => !r.name.trim());
    if (hasEmptyResult) {
      this.toast.error('All results must have a name');
      valid = false;
    }

    return valid;
  }

  async onSubmitForReview(): Promise<void> {
    if (!this.validate()) return;
    this.saving.set(true);

    try {
      if (this.mode() === 'create') {
        await this.betsService.createBet({
          title: this.title(),
          description: this.description(),
          imageSlug: this.imageSlug(),
          user2Id: this.selectedFriendId(),
          results: this.results().map(r => ({
            name: r.name,
            brewskiCount: r.brewskiCount,
            assignedTo: r.assignedTo,
          })),
        });
        this.toast.success('Bet submitted for review');
      } else if (this.bet) {
        await this.betsService.updateBet(this.bet.id, {
          title: this.title(),
          description: this.description(),
          imageSlug: this.imageSlug(),
          results: this.results().map(r => ({
            name: r.name,
            brewskiCount: r.brewskiCount,
            assignedTo: r.assignedTo,
          })),
          selectedResultIndex: this.selectedResultIndex()
            ? Number(this.selectedResultIndex())
            : undefined,
          action: 'submit',
        });
        this.toast.success('Changes submitted for review');
      }
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to submit bet');
    } finally {
      this.saving.set(false);
    }
  }

  async onAccept(): Promise<void> {
    if (!this.bet) return;
    this.saving.set(true);

    try {
      await this.betsService.updateBet(this.bet.id, {
        selectedResultIndex: this.selectedResultIndex()
          ? Number(this.selectedResultIndex())
          : undefined,
        action: 'accept',
      });
      this.toast.success('Bet accepted');
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to accept bet');
    } finally {
      this.saving.set(false);
    }
  }

  openDeleteDialog(): void {
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    if (!this.bet) return;
    this.saving.set(true);

    try {
      await this.betsService.deleteBet(this.bet.id);
      this.deleteDialogOpen.set(false);
      this.toast.success('Bet deleted');
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to delete bet');
    } finally {
      this.saving.set(false);
    }
  }

  async onProposeVoid(): Promise<void> {
    if (!this.bet) return;

    const voidIndex = this.bet.results.findIndex(r => r.isSpecial === 'void');
    if (voidIndex === -1) return;

    this.saving.set(true);
    try {
      await this.betsService.updateBet(this.bet.id, {
        selectedResultIndex: voidIndex,
        action: 'submit',
      });
      this.toast.success('Void proposed');
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to propose void');
    } finally {
      this.saving.set(false);
    }
  }
}
