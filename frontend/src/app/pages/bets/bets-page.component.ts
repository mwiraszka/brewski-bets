import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  DataTableColumn,
  DataTableComponent,
  DataTableSortState,
  DropdownComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import {
  Component,
  OnInit,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { UserService } from '@app/services/user.service';

@Component({
  selector: 'bb-bets-page',
  templateUrl: './bets-page.component.html',
  styleUrl: './bets-page.component.scss',
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DataTableComponent,
    DropdownComponent,
    InputComponent,
  ],
})
export class BetsPageComponent implements OnInit {
  private readonly betsService = inject(BetsService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly filterText = signal('');
  readonly filterStatus = signal('all');
  readonly sort = signal<DataTableSortState>({ column: '', direction: null });

  readonly opponentCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>(
      'opponentCell',
    );
  readonly statusCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>('statusCell');
  readonly actionCell =
    viewChild<TemplateRef<{ $implicit: BetWithOpponent; value: unknown }>>('actionCell');

  readonly columns = computed((): DataTableColumn<BetWithOpponent>[] => [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'opponent', label: 'Opponent', cellTemplate: this.opponentCell() },
    { key: 'status', label: 'Status', sortable: true, cellTemplate: this.statusCell() },
    { key: 'pendingAction', label: '', width: '120px', cellTemplate: this.actionCell() },
  ]);

  readonly statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Complete', value: 'complete' },
  ];

  readonly filteredBets = computed(() => {
    let bets = this.betsService.bets();

    const text = this.filterText().toLowerCase().trim();
    if (text) {
      bets = bets.filter(
        b =>
          b.title.toLowerCase().includes(text) ||
          b.description.toLowerCase().includes(text),
      );
    }

    const status = this.filterStatus();
    if (status !== 'all') {
      bets = bets.filter(b => b.status === status);
    }

    return bets;
  });

  private readonly currentUserId = computed(() => this.userService.user()?.id);

  async ngOnInit(): Promise<void> {
    try {
      await this.betsService.loadBets();
    } catch {
      this.toast.error('Failed to load bets');
    } finally {
      this.loading.set(false);
    }
  }

  onRowClick(bet: BetWithOpponent): void {
    this.router.navigate(['/bets', bet.id]);
  }

  isMyTurn(bet: BetWithOpponent): boolean {
    const userId = this.currentUserId();
    if (!userId || !bet.pendingAction) return false;
    return (
      (bet.pendingAction === 'user1' && bet.user1Id === userId) ||
      (bet.pendingAction === 'user2' && bet.user2Id === userId)
    );
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'default' | 'info' | 'error' {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  }

  getAvatarSrc(clerkImageUrl: string | null): string | undefined {
    return clerkImageUrl ?? undefined;
  }

  getInitials(firstName: string, lastName: string): string | undefined {
    const initials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
    return initials || undefined;
  }
}
