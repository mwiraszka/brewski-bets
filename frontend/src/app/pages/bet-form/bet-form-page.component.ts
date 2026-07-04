import {
  AlertCircleIconComponent,
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  CheckIconComponent,
  DatePickerComponent,
  DialogComponent,
  DropdownComponent,
  InputComponent,
  PlusIconComponent,
  RadioComponent,
  RadioGroupComponent,
  SearchIconComponent,
  SkeletonComponent,
  SliderComponent,
  TextareaComponent,
  ToastService,
  TooltipDirective,
  TrashIconComponent,
} from '@eagami/ui';

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  type OnInit,
  type QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  BetGraphicComponent,
  GRAPHICS,
  graphicBySlug,
  isColorableGraphic,
} from '@app/graphics';
import { type CanComponentDeactivate } from '@app/guards/unsaved-changes.guard';
import { type BetResult, type BetSnapshot, type BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { FriendsService } from '@app/services/friends.service';
import { UserService } from '@app/services/user.service';
import { avatarSrc, initialsOf } from '@app/util';

const ICON_COLORS = [
  '#e53935',
  '#fb8c00',
  '#cba855',
  '#43a047',
  '#29b6f6',
  '#1e88e5',
  '#5e35b1',
  '#e91e63',
];

const DEFAULT_ICON_COLOR = '#cba855';
const MAX_BREWSKI_COUNT = 6;
const MAX_OUTCOMES = 5;
const TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 300;
const OUTCOME_MAX_LENGTH = 50;
const ICON_FILTER_MAX_LENGTH = 30;
const NOTCH_VALUES: ReadonlyArray<number> = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6];

type ActionInFlight = 'submit' | 'accept' | 'settle' | 'reject' | 'delete' | null;

interface ReviewOutcome {
  status: 'unchanged' | 'changed' | 'added' | 'removed';
  name: string;
  stakeLabel: string;
  previousName?: string;
  previousStakeLabel?: string;
}

@Component({
  selector: 'bb-bet-form-page',
  templateUrl: './bet-form-page.component.html',
  styleUrl: './bet-form-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DatePipe,
    AlertCircleIconComponent,
    AvatarComponent,
    BadgeComponent,
    BetGraphicComponent,
    ButtonComponent,
    CardComponent,
    CheckIconComponent,
    DatePickerComponent,
    DialogComponent,
    DropdownComponent,
    InputComponent,
    PlusIconComponent,
    RadioComponent,
    RadioGroupComponent,
    RouterLink,
    SearchIconComponent,
    SkeletonComponent,
    SliderComponent,
    TextareaComponent,
    TooltipDirective,
    TrashIconComponent,
  ],
})
export class BetFormPageComponent implements OnInit, CanComponentDeactivate {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly betsService = inject(BetsService);
  private readonly friendsService = inject(FriendsService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  @ViewChild('titleInputRef', { read: ElementRef })
  private titleInputRef?: ElementRef<HTMLElement>;
  @ViewChild('iconFilterInputRef', { read: ElementRef })
  private iconFilterInputRef?: ElementRef<HTMLElement>;
  @ViewChildren('outcomeInputRef', { read: ElementRef })
  private outcomeInputRefs?: QueryList<ElementRef<HTMLElement>>;

  readonly graphics = GRAPHICS;
  readonly iconColors = ICON_COLORS;
  readonly skeletonFields = Array.from({ length: 4 });
  readonly maxBrewskiCount = MAX_BREWSKI_COUNT;
  readonly maxOutcomes = MAX_OUTCOMES;
  readonly titleMaxLength = TITLE_MAX_LENGTH;
  readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
  readonly outcomeMaxLength = OUTCOME_MAX_LENGTH;
  readonly sliderTicks = NOTCH_VALUES;

  readonly mode = signal<'create' | 'edit'>('create');
  readonly loading = signal(true);
  readonly actionInFlight = signal<ActionInFlight>(null);
  readonly deleteDialogOpen = signal(false);
  readonly settleDialogOpen = signal(false);
  readonly leaveDialogOpen = signal(false);
  readonly counterProposing = signal(false);
  private readonly previousSnapshot = signal<BetSnapshot | null>(null);

  // Snapshot of the form taken once it loads; `formSnapshot` diverging from it
  // means there are unsaved edits. `allowNavigation` is flipped on right before
  // a save/delete navigates away so the deactivate guard lets it through.
  private initialSnapshot = '';
  private allowNavigation = false;
  private leaveResolver: ((leave: boolean) => void) | null = null;

  readonly title = signal('');
  readonly description = signal('');
  readonly iconSlug = signal<string | null>(null);
  readonly iconColor = signal<string>(DEFAULT_ICON_COLOR);
  readonly iconFilter = signal('');
  readonly iconEditing = signal(true);
  readonly selectedFriendId = signal('');
  readonly resolutionDate = signal<Date | null>(null);
  readonly outcomes = signal<BetResult[]>([
    { name: '', brewskiCount: MAX_BREWSKI_COUNT, assignedTo: 'user1' },
  ]);
  readonly settleIndex = signal('');

  readonly titleTouched = signal(false);
  readonly friendTouched = signal(false);
  readonly iconTouched = signal(false);
  readonly outcomeDescriptionTouched = signal<Set<number>>(new Set());
  readonly outcomeAmountTouched = signal<Set<number>>(new Set());
  readonly submitAttempted = signal(false);

  readonly titleError = computed(() => {
    const empty = !this.title().trim();
    if (!empty) {
      return '';
    }
    if (this.titleTouched() || this.submitAttempted()) {
      return 'Title is required';
    }
    return '';
  });

  readonly friendError = computed(() => {
    if (this.mode() !== 'create') {
      return '';
    }
    if (this.selectedFriendId()) {
      return '';
    }
    if (this.friendTouched() || this.submitAttempted()) {
      return 'Select a friend to bet against';
    }
    return '';
  });

  readonly iconError = computed(() => {
    if (this.iconSlug()) {
      return '';
    }
    if (this.iconTouched() || this.submitAttempted()) {
      return 'Graphic is required';
    }
    return '';
  });

  private bet: BetWithOpponent | null = null;

  readonly friends = this.friendsService.friends;
  readonly friendOptions = computed(() =>
    this.friends().map(f => ({
      value: f.id,
      label: `${f.firstName} ${f.lastName}`,
    })),
  );

  readonly currentUserId = computed(() => this.userService.user()?.id);

  readonly isBusy = computed(() => this.actionInFlight() !== null);

  readonly filteredGraphics = computed(() => {
    const filter = this.iconFilter().trim().toLowerCase();
    if (!filter) {
      return this.graphics;
    }
    const tokens = filter.split(/\s+/).filter(Boolean);
    return this.graphics.filter(graphic =>
      tokens.every(token => graphic.tags.some(tag => tag.toLowerCase().includes(token))),
    );
  });

  readonly selectedGraphic = computed(() => graphicBySlug(this.iconSlug()));

  readonly selectedColorable = computed(() => isColorableGraphic(this.iconSlug()));

  readonly myPosition = computed((): 'user1' | 'user2' | null => {
    if (!this.bet) {
      return null;
    }
    return this.bet.user1Id === this.currentUserId() ? 'user1' : 'user2';
  });

  readonly isMyTurn = computed(() => {
    if (!this.bet) {
      return true;
    }
    return this.bet.pendingAction === this.myPosition();
  });

  readonly betStatus = computed(() => this.bet?.status ?? null);
  readonly settlementProposed = computed(() => this.bet?.settlementProposed ?? false);
  readonly changesPending = computed(() => this.bet?.pendingAction != null);
  readonly activeResting = computed(
    () => this.betStatus() === 'active' && this.bet?.pendingAction == null,
  );
  readonly isSettled = computed(() => this.betStatus() === 'settled');

  readonly statusTagVariant = computed((): 'success' | 'default' =>
    this.betStatus() === 'active' ? 'success' : 'default',
  );

  readonly canEditTerms = computed(() => {
    if (this.mode() === 'create') {
      return true;
    }
    if (this.isSettled() || this.settlementProposed()) {
      return false;
    }
    return this.isMyTurn() || this.activeResting() || this.counterProposing();
  });

  readonly isViewing = computed(() => !this.canEditTerms());

  readonly canApproveTerms = computed(
    () =>
      this.mode() === 'edit' &&
      !this.isSettled() &&
      !this.settlementProposed() &&
      this.isMyTurn(),
  );

  readonly canApproveSettlement = computed(
    () => this.settlementProposed() && this.isMyTurn(),
  );

  // The party who submitted a still-pending bet or change can review it read-only
  // too, and either re-edit or withdraw it while it waits on the other side.
  // Includes a brand-new bet awaiting first acceptance (no previous state).
  readonly isPendingRequester = computed(
    () =>
      this.mode() === 'edit' &&
      !this.isSettled() &&
      !this.settlementProposed() &&
      this.changesPending() &&
      !this.isMyTurn(),
  );

  // Both parties see the bet read-only with proposed terms highlighted until
  // they choose to edit/counter-propose, which reopens the editable form.
  readonly isReviewing = computed(
    () =>
      (this.canApproveTerms() || this.isPendingRequester()) && !this.counterProposing(),
  );

  readonly hasPreviousState = computed(() => this.previousSnapshot() != null);

  readonly titleChanged = computed(() => {
    const prev = this.previousSnapshot();
    return prev != null && prev.title !== this.title();
  });
  readonly previousTitle = computed(() => this.previousSnapshot()?.title ?? '');

  readonly descriptionChanged = computed(() => {
    const prev = this.previousSnapshot();
    return prev != null && (prev.description ?? '') !== this.description();
  });
  readonly previousDescription = computed(
    () => this.previousSnapshot()?.description ?? '',
  );

  readonly resolutionChanged = computed(() => {
    const prev = this.previousSnapshot();
    if (!prev) {
      return false;
    }
    return prev.resolutionDate !== (this.resolutionDate()?.toISOString() ?? null);
  });
  readonly previousResolutionDate = computed(() => {
    const iso = this.previousSnapshot()?.resolutionDate;
    return iso ? new Date(iso) : null;
  });

  readonly graphicChanged = computed(() => {
    const prev = this.previousSnapshot();
    if (!prev) {
      return false;
    }
    const proposedColor = this.selectedColorable() ? this.iconColor() : null;
    return (
      prev.iconSlug !== this.iconSlug() || (prev.iconColor ?? null) !== proposedColor
    );
  });
  readonly previousIconSlug = computed(() => this.previousSnapshot()?.iconSlug ?? null);
  readonly previousIconColor = computed(() => this.previousSnapshot()?.iconColor ?? null);

  readonly reviewOutcomes = computed<ReviewOutcome[]>(() => {
    const me = (this.bet ? this.myPosition() : 'user1') ?? 'user1';
    const stake = (result: BetResult): string =>
      `${result.assignedTo === me ? 'YOU' : 'THEM'} ${result.brewskiCount}`;
    const proposed = this.outcomes();
    const prev = this.previousSnapshot();

    if (!prev) {
      return proposed.map(outcome => ({
        status: 'unchanged' as const,
        name: outcome.name,
        stakeLabel: stake(outcome),
      }));
    }

    const previousResults = prev.results.filter(result => !result.isSpecial);
    const rows: ReviewOutcome[] = [];
    const count = Math.max(proposed.length, previousResults.length);
    for (let i = 0; i < count; i++) {
      const next = proposed[i];
      const before = previousResults[i];
      if (next && before) {
        const changed =
          next.name !== before.name ||
          next.brewskiCount !== before.brewskiCount ||
          next.assignedTo !== before.assignedTo;
        rows.push({
          status: changed ? 'changed' : 'unchanged',
          name: next.name,
          stakeLabel: stake(next),
          previousName: changed ? before.name : undefined,
          previousStakeLabel: changed ? stake(before) : undefined,
        });
      } else if (next) {
        rows.push({ status: 'added', name: next.name, stakeLabel: stake(next) });
      } else if (before) {
        rows.push({ status: 'removed', name: before.name, stakeLabel: stake(before) });
      }
    }
    return rows;
  });

  readonly canSubmitChanges = computed(
    () =>
      this.mode() === 'edit' &&
      !this.isSettled() &&
      !this.settlementProposed() &&
      (this.isMyTurn() || this.activeResting()),
  );

  readonly canSettle = computed(
    () =>
      this.betStatus() === 'active' &&
      !this.settlementProposed() &&
      (this.isMyTurn() || this.activeResting()),
  );

  readonly canDelete = computed(
    () => this.mode() === 'edit' && !this.isSettled() && !this.settlementProposed(),
  );

  readonly isWaiting = computed(
    () =>
      this.mode() === 'edit' &&
      !this.isSettled() &&
      !this.isMyTurn() &&
      !this.activeResting(),
  );

  readonly tagTooltip = computed(() =>
    this.changesPending() && !this.isSettled()
      ? 'The bet is read-only while changes are pending'
      : '',
  );

  readonly winnerLabel = computed(() => {
    const idx = this.bet?.selectedResultIndex;
    if (this.bet == null || idx == null) {
      return '';
    }
    const result = this.bet.results[idx];
    if (!result) {
      return '';
    }
    return result.isSpecial === 'void' ? 'Void' : result.name;
  });

  readonly settleOptions = computed(() => {
    if (!this.bet) {
      return [] as { value: string; label: string }[];
    }
    return this.bet.results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => !result.isSpecial || result.isSpecial === 'void')
      .map(({ result, index }) => ({
        value: String(index),
        label: result.isSpecial === 'void' ? 'Void the bet' : result.name,
      }));
  });

  readonly opponentName = computed(() => {
    if (this.bet?.opponent) {
      return `${this.bet.opponent.firstName} ${this.bet.opponent.lastName}`;
    }
    const friend = this.friends().find(f => f.id === this.selectedFriendId());
    return friend ? `${friend.firstName} ${friend.lastName}` : '';
  });

  readonly opponentAvatar = computed(() => avatarSrc(this.bet?.opponent?.avatarUrl));

  readonly opponentInitials = computed(() =>
    initialsOf(this.bet?.opponent?.firstName, this.bet?.opponent?.lastName),
  );

  readonly isFormValid = computed(() => {
    if (!this.title().trim()) {
      return false;
    }
    if (this.mode() === 'create' && !this.selectedFriendId()) {
      return false;
    }
    if (!this.iconSlug()) {
      return false;
    }
    if (!this.outcomes().length) {
      return false;
    }
    if (this.outcomes().some(outcome => !outcome.name.trim())) {
      return false;
    }
    if (this.outcomes().some(outcome => outcome.brewskiCount <= 0)) {
      return false;
    }
    return true;
  });

  readonly formSnapshot = computed(() =>
    JSON.stringify({
      title: this.title(),
      description: this.description(),
      iconSlug: this.iconSlug(),
      iconColor: this.iconColor(),
      resolutionDate: this.resolutionDate()?.toISOString() ?? null,
      selectedFriendId: this.selectedFriendId(),
      outcomes: this.outcomes(),
    }),
  );

  readonly isDirty = computed(() => this.formSnapshot() !== this.initialSnapshot);

  readonly minResolutionDate = new Date();

  graphicName(slug: string): string {
    return graphicBySlug(slug)?.label ?? slug;
  }

  signedBrewskiCount(outcome: BetResult): number {
    const me = this.bet ? this.myPosition() : 'user1';
    return outcome.assignedTo === me ? -outcome.brewskiCount : outcome.brewskiCount;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.mode.set('edit');
      try {
        this.bet = await this.betsService.getBet(id);
        this.applyBetToForm(this.bet);
        this.previousSnapshot.set(this.bet.previousState ?? null);
      } catch {
        this.toast.error('Failed to load bet');
        this.allowNavigation = true;
        await this.router.navigate(['/bets']);
        return;
      }
    }

    await this.friendsService.loadFriends();
    this.initialSnapshot = this.formSnapshot();
    this.loading.set(false);
  }

  private applyBetToForm(bet: BetWithOpponent): void {
    this.title.set(bet.title);
    this.description.set(bet.description ?? '');
    this.iconSlug.set(bet.iconSlug);
    this.iconColor.set(bet.iconColor ?? DEFAULT_ICON_COLOR);
    this.iconEditing.set(!bet.iconSlug);
    this.resolutionDate.set(bet.resolutionDate ? new Date(bet.resolutionDate) : null);
    this.outcomes.set(bet.results.filter(outcome => !outcome.isSpecial));
  }

  startCounter(): void {
    this.counterProposing.set(true);
  }

  cancelCounter(): void {
    if (this.bet) {
      this.applyBetToForm(this.bet);
    }
    this.counterProposing.set(false);
  }

  selectIcon(slug: string): void {
    this.iconSlug.set(this.iconSlug() === slug ? null : slug);
    this.iconTouched.set(true);
  }

  selectColor(color: string): void {
    this.iconColor.set(color);
  }

  confirmIcon(): void {
    if (!this.iconSlug()) {
      return;
    }
    this.iconEditing.set(false);
  }

  editIcon(): void {
    this.iconEditing.set(true);
  }

  addOutcome(): void {
    if (this.outcomes().length >= MAX_OUTCOMES) {
      return;
    }
    const me = (this.bet ? this.myPosition() : 'user1') ?? 'user1';
    this.outcomes.update(outcomes => [
      ...outcomes,
      { name: '', brewskiCount: MAX_BREWSKI_COUNT, assignedTo: me },
    ]);
  }

  removeOutcome(index: number): void {
    this.outcomes.update(outcomes => outcomes.filter((_, i) => i !== index));
    this.outcomeDescriptionTouched.update(s => {
      const next = new Set<number>();
      for (const i of s) {
        if (i < index) {
          next.add(i);
        } else if (i > index) {
          next.add(i - 1);
        }
      }
      return next;
    });
    this.outcomeAmountTouched.update(s => {
      const next = new Set<number>();
      for (const i of s) {
        if (i < index) {
          next.add(i);
        } else if (i > index) {
          next.add(i - 1);
        }
      }
      return next;
    });
  }

  updateOutcomeDescription(index: number, description: string): void {
    const trimmed = description.slice(0, OUTCOME_MAX_LENGTH);
    this.outcomes.update(outcomes =>
      outcomes.map((outcome, i) =>
        i === index ? { ...outcome, name: trimmed } : outcome,
      ),
    );
    if (description !== trimmed) {
      this.syncNativeInput(this.outcomeInputRefs?.toArray()[index], trimmed);
    }
  }

  setTitle(value: string): void {
    const trimmed = value.slice(0, TITLE_MAX_LENGTH);
    this.title.set(trimmed);
    if (value !== trimmed) {
      this.syncNativeInput(this.titleInputRef, trimmed);
    }
  }

  setIconFilter(value: string): void {
    const trimmed = value.slice(0, ICON_FILTER_MAX_LENGTH);
    this.iconFilter.set(trimmed);
    if (value !== trimmed) {
      this.syncNativeInput(this.iconFilterInputRef, trimmed);
    }
  }

  private syncNativeInput(
    host: ElementRef<HTMLElement> | undefined,
    value: string,
  ): void {
    const input = host?.nativeElement.querySelector('input');
    if (input && input.value !== value) {
      input.value = value;
    }
  }

  updateOutcomeSigned(index: number, signedValue: number): void {
    const me = this.bet ? this.myPosition() : 'user1';
    const other: 'user1' | 'user2' = me === 'user1' ? 'user2' : 'user1';
    const brewskiCount = Math.abs(signedValue);
    const assignedTo: 'user1' | 'user2' = signedValue < 0 ? (me ?? 'user1') : other;
    this.outcomes.update(outcomes =>
      outcomes.map((outcome, i) =>
        i === index ? { ...outcome, brewskiCount, assignedTo } : outcome,
      ),
    );
    this.outcomeAmountTouched.update(s => new Set(s).add(index));
  }

  markOutcomeDescriptionTouched(index: number): void {
    this.outcomeDescriptionTouched.update(s => new Set(s).add(index));
  }

  outcomeDescriptionError(index: number, description: string): string {
    const empty = !description.trim();
    if (!empty) {
      return '';
    }
    if (this.outcomeDescriptionTouched().has(index) || this.submitAttempted()) {
      return 'Outcome description is required';
    }
    return '';
  }

  outcomeAmountError(outcome: BetResult, index: number): string {
    if (outcome.brewskiCount > 0) {
      return '';
    }
    if (this.submitAttempted()) {
      return 'At least one brewski must be bet';
    }
    if (
      this.outcomeAmountTouched().has(index) &&
      this.outcomeDescriptionTouched().has(index)
    ) {
      return 'At least one brewski must be bet';
    }
    return '';
  }

  private validate(): boolean {
    this.submitAttempted.set(true);

    if (!this.title().trim()) {
      return false;
    }
    if (this.mode() === 'create' && !this.selectedFriendId()) {
      return false;
    }
    if (!this.iconSlug()) {
      return false;
    }
    if (!this.outcomes().length) {
      return false;
    }
    if (this.outcomes().some(outcome => !outcome.name.trim())) {
      return false;
    }
    if (this.outcomes().some(outcome => outcome.brewskiCount <= 0)) {
      return false;
    }

    return true;
  }

  async onSubmitForReview(): Promise<void> {
    if (!this.validate()) {
      return;
    }
    this.actionInFlight.set('submit');

    try {
      if (this.mode() === 'create') {
        await this.betsService.createBet({
          title: this.title(),
          description: this.description(),
          iconSlug: this.iconSlug(),
          iconColor: this.selectedColorable() ? this.iconColor() : null,
          resolutionDate: this.resolutionDate()?.toISOString() ?? null,
          user2Id: this.selectedFriendId(),
          results: this.outcomes().map(outcome => ({
            name: outcome.name,
            brewskiCount: outcome.brewskiCount,
            assignedTo: outcome.assignedTo,
          })),
        });
        this.toast.success('Bet submitted for review');
      } else if (this.bet) {
        await this.betsService.updateBet(this.bet.id, {
          title: this.title(),
          description: this.description(),
          iconSlug: this.iconSlug(),
          iconColor: this.selectedColorable() ? this.iconColor() : null,
          resolutionDate: this.resolutionDate()?.toISOString() ?? null,
          results: this.outcomes().map(outcome => ({
            name: outcome.name,
            brewskiCount: outcome.brewskiCount,
            assignedTo: outcome.assignedTo,
          })),
          action: 'submit',
        });
        this.toast.success('Changes submitted for review');
      }
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to submit bet');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  async onAccept(): Promise<void> {
    if (!this.bet) {
      return;
    }
    this.actionInFlight.set('accept');

    try {
      await this.betsService.updateBet(this.bet.id, { action: 'accept' });
      this.toast.success(this.settlementProposed() ? 'Bet settled' : 'Bet accepted');
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to accept bet');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  async onWithdraw(): Promise<void> {
    if (!this.bet) {
      return;
    }
    this.actionInFlight.set('reject');

    try {
      await this.betsService.updateBet(this.bet.id, { action: 'reject' });
      this.toast.success('Changes withdrawn');
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to withdraw changes');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  async onReject(): Promise<void> {
    if (!this.bet) {
      return;
    }
    const rejectingSettlement = this.settlementProposed();
    this.actionInFlight.set('reject');

    try {
      await this.betsService.updateBet(this.bet.id, { action: 'reject' });
      this.toast.success(
        rejectingSettlement ? 'Settlement rejected' : 'Changes rejected',
      );
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to reject');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  openSettleDialog(): void {
    this.settleIndex.set('');
    this.settleDialogOpen.set(true);
  }

  cancelSettle(): void {
    this.settleDialogOpen.set(false);
  }

  async onSettle(): Promise<void> {
    if (!this.bet || this.settleIndex() === '') {
      return;
    }
    this.actionInFlight.set('settle');

    try {
      await this.betsService.updateBet(this.bet.id, {
        selectedResultIndex: Number(this.settleIndex()),
        action: 'settle',
      });
      this.settleDialogOpen.set(false);
      this.toast.success('Settlement proposed');
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to propose settlement');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  openDeleteDialog(): void {
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    if (!this.bet) {
      return;
    }
    this.actionInFlight.set('delete');

    try {
      await this.betsService.deleteBet(this.bet.id);
      this.deleteDialogOpen.set(false);
      this.toast.success('Bet deleted');
      this.allowNavigation = true;
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to delete bet');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  confirmLeave(): boolean | Promise<boolean> {
    if (this.allowNavigation || !this.isDirty()) {
      return true;
    }
    this.leaveDialogOpen.set(true);
    return new Promise<boolean>(resolve => {
      this.leaveResolver = resolve;
    });
  }

  onLeaveDialogOpenChange(open: boolean): void {
    this.leaveDialogOpen.set(open);
    if (!open && this.leaveResolver) {
      this.leaveResolver(false);
      this.leaveResolver = null;
    }
  }

  confirmDiscard(): void {
    this.leaveResolver?.(true);
    this.leaveResolver = null;
    this.leaveDialogOpen.set(false);
  }

  cancelLeave(): void {
    this.leaveDialogOpen.set(false);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty() && !this.allowNavigation) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
