import {
  AvatarComponent,
  BadgeComponent,
  BottleIconComponent,
  ButtonComponent,
  CardComponent,
  type DataTableColumn,
  DataTableComponent,
  type DataTableSortState,
  DialogComponent,
  DropdownComponent,
  EditIconComponent,
  EmptyStateComponent,
  InputComponent,
  SkeletonComponent,
  TabComponent,
  TabsComponent,
  ToastService,
  TooltipDirective,
  TrashIconComponent,
} from '@eagami/ui';

import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  type TemplateRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BetGraphicComponent } from '@app/graphics';
import { type BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { UserService } from '@app/services/user.service';
import {
  avatarSrc,
  initialsOf,
  isAwaitingOutcome,
  isPendingRequester,
  withAgreedTerms,
} from '@app/util';

import { StandingsComponent } from './standings.component';

@Component({
  selector: 'bb-bets-page',
  templateUrl: './bets-page.component.html',
  styleUrl: './bets-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    AvatarComponent,
    BadgeComponent,
    BetGraphicComponent,
    BottleIconComponent,
    ButtonComponent,
    CardComponent,
    DataTableComponent,
    DialogComponent,
    DropdownComponent,
    EditIconComponent,
    EmptyStateComponent,
    InputComponent,
    SkeletonComponent,
    StandingsComponent,
    TabComponent,
    TabsComponent,
    TooltipDirective,
    TrashIconComponent,
  ],
})
export class BetsPageComponent implements OnInit {
  private readonly betsService = inject(BetsService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly skeletonRows = Array.from({ length: 4 });
  private readonly toast = inject(ToastService);

  private static readonly validTabs = ['bets', 'standings'];

  readonly loading = signal(true);
  readonly activeTab = signal(this.initialTab());
  readonly allBets = this.betsService.bets;
  readonly filterText = signal('');
  readonly filterStatus = signal('all');
  readonly sort = signal<DataTableSortState>({ column: '', direction: null });

  readonly deleteDialogOpen = signal(false);
  readonly deleting = signal(false);
  private betToDelete: BetWithOpponent | null = null;

  readonly titleCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>('titleCell');
  readonly opponentCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>(
      'opponentCell',
    );
  readonly statusCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>('statusCell');
  readonly actionCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>('actionCell');

  readonly columns = computed((): DataTableColumn<BetWithOpponent>[] => [
    { key: 'title', label: 'Title', sortable: true, cellTemplate: this.titleCell() },
    { key: 'opponent', label: 'Opponent', cellTemplate: this.opponentCell() },
    { key: 'status', label: 'Status', sortable: true, cellTemplate: this.statusCell() },
    { key: 'pendingAction', label: '', width: '96px', cellTemplate: this.actionCell() },
  ]);

  readonly statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Changes pending', value: 'changes-pending' },
    { label: 'Active', value: 'active' },
    { label: 'Settled', value: 'settled' },
  ];

  readonly emptyState = computed(() => {
    switch (this.filterStatus()) {
      case 'changes-pending':
        return { title: 'No bets with changes pending', description: '' };
      case 'active':
        return { title: 'No active bets', description: '' };
      case 'settled':
        return { title: 'No settled bets', description: '' };
      default:
        return {
          title: 'No bets yet',
          description: 'Kick things off with your first wager!',
        };
    }
  });

  readonly filteredBets = computed(() => {
    // Show the agreed terms, not an unaccepted pending proposal
    let bets = this.betsService.bets().map(withAgreedTerms);

    const text = this.filterText().toLowerCase().trim();
    if (text) {
      bets = bets.filter(
        b =>
          b.title.toLowerCase().includes(text) ||
          (b.description?.toLowerCase().includes(text) ?? false),
      );
    }

    const status = this.filterStatus();
    if (status === 'changes-pending') {
      bets = bets.filter(b => this.isChangesPending(b));
    } else if (status !== 'all') {
      bets = bets.filter(b => b.status === status);
    }

    return bets;
  });

  readonly currentUserId = computed(() => this.userService.user()?.id);

  constructor() {
    effect(() => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: this.activeTab() },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  private initialTab(): string {
    const queryTab = this.route.snapshot.queryParamMap.get('tab');
    return queryTab && BetsPageComponent.validTabs.includes(queryTab) ? queryTab : 'bets';
  }

  async ngOnInit(): Promise<void> {
    // Render cached bets immediately and refresh in the background
    this.loading.set(!this.betsService.loaded());
    try {
      await this.betsService.loadBets();
    } catch {
      if (!this.betsService.loaded()) {
        this.toast.error('Failed to load bets');
      }
    } finally {
      this.loading.set(false);
    }
  }

  onTableClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('[data-row-action]')) {
      return;
    }

    const betId = target.closest('tr')?.querySelector<HTMLElement>('[data-bet-id]')
      ?.dataset['betId'];
    if (betId) {
      void this.router.navigate(['/bets', betId]);
    }
  }

  onEdit(bet: BetWithOpponent): void {
    void this.router.navigate(['/bets', bet.id, 'edit']);
  }

  openDeleteDialog(bet: BetWithOpponent): void {
    this.betToDelete = bet;
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.betToDelete = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.betToDelete) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.betsService.deleteBet(this.betToDelete.id);
      this.deleteDialogOpen.set(false);
      this.betToDelete = null;
      await Promise.allSettled([
        this.betsService.loadBets(),
        this.betsService.loadPendingCount(),
      ]);
    } catch {
      this.toast.error('Failed to delete bet');
    } finally {
      this.deleting.set(false);
    }
  }

  private isMyTurn(bet: BetWithOpponent): boolean {
    const userId = this.currentUserId();
    if (!userId || !bet.pendingAction) {
      return false;
    }
    return (
      (bet.pendingAction === 'user1' && bet.user1Id === userId) ||
      (bet.pendingAction === 'user2' && bet.user2Id === userId)
    );
  }

  isChangesPending(bet: BetWithOpponent): boolean {
    return bet.pendingAction != null && bet.status !== 'settled';
  }

  isAwaitingOutcome(bet: BetWithOpponent): boolean {
    return isAwaitingOutcome(bet);
  }

  canAct(bet: BetWithOpponent): boolean {
    if (bet.status === 'settled') {
      return false;
    }
    return (
      this.isMyTurn(bet) ||
      (bet.status === 'active' && bet.pendingAction == null) ||
      isPendingRequester(bet, this.currentUserId())
    );
  }

  canDelete(bet: BetWithOpponent): boolean {
    return bet.status !== 'settled' && !bet.settlementProposed;
  }

  getAvatarSrc(avatarUrl: string | null): string | undefined {
    return avatarSrc(avatarUrl);
  }

  getInitials(firstName: string, lastName: string): string | undefined {
    return initialsOf(firstName, lastName);
  }
}
