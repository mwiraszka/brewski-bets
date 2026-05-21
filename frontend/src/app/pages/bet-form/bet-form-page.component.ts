import {
  AlertCircleIconComponent,
  AnchorIconComponent,
  AwardIconComponent,
  BatteryIconComponent,
  BellIconComponent,
  BookIconComponent,
  BookmarkIconComponent,
  BottleIconComponent,
  BoxIconComponent,
  BriefcaseIconComponent,
  ButtonComponent,
  CalendarIconComponent,
  CameraIconComponent,
  CandleIconComponent,
  CardComponent,
  CheckIconComponent,
  ClipboardIconComponent,
  ClockIconComponent,
  CoffeeIconComponent,
  CompassIconComponent,
  CreditCardIconComponent,
  DialogComponent,
  DiscIconComponent,
  DropdownComponent,
  EditIconComponent,
  FilmIconComponent,
  FlagIconComponent,
  FolderIconComponent,
  GiftIconComponent,
  GlobeIconComponent,
  HeadphonesIconComponent,
  HeartIconComponent,
  HomeIconComponent,
  type IconComponentType,
  InboxIconComponent,
  InputComponent,
  KeyIconComponent,
  LampIconComponent,
  LockIconComponent,
  MailIconComponent,
  MapIconComponent,
  MonitorIconComponent,
  MoonIconComponent,
  MusicIconComponent,
  PackageIconComponent,
  PaperclipIconComponent,
  PenToolIconComponent,
  PencilIconComponent,
  PhoneIconComponent,
  PlusIconComponent,
  PrinterIconComponent,
  RadioComponent,
  RadioGroupComponent,
  RadioIconComponent,
  ScissorsIconComponent,
  SearchIconComponent,
  ServerIconComponent,
  ShieldIconComponent,
  ShoppingCartIconComponent,
  SliderComponent,
  SmartphoneIconComponent,
  SoccerBallIconComponent,
  StarIconComponent,
  SunIconComponent,
  TableIconComponent,
  TagComponent,
  TagIconComponent,
  TargetIconComponent,
  TextareaComponent,
  ThermometerIconComponent,
  ToastService,
  ToolIconComponent,
  TooltipDirective,
  TrashIconComponent,
  TrophyIconComponent,
  UmbrellaIconComponent,
} from '@eagami/ui';

import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BetResult, BetWithOpponent } from '@app/models';
import { BetsService } from '@app/services/bets.service';
import { FriendsService } from '@app/services/friends.service';
import { UserService } from '@app/services/user.service';

const STOCK_ICONS: IconComponentType[] = [
  AnchorIconComponent,
  AwardIconComponent,
  BatteryIconComponent,
  BellIconComponent,
  BookIconComponent,
  BookmarkIconComponent,
  BottleIconComponent,
  BoxIconComponent,
  BriefcaseIconComponent,
  CalendarIconComponent,
  CameraIconComponent,
  CandleIconComponent,
  ClipboardIconComponent,
  ClockIconComponent,
  CoffeeIconComponent,
  CompassIconComponent,
  CreditCardIconComponent,
  DiscIconComponent,
  FilmIconComponent,
  FlagIconComponent,
  FolderIconComponent,
  GiftIconComponent,
  GlobeIconComponent,
  HeadphonesIconComponent,
  HeartIconComponent,
  HomeIconComponent,
  InboxIconComponent,
  KeyIconComponent,
  LampIconComponent,
  LockIconComponent,
  MailIconComponent,
  MapIconComponent,
  MonitorIconComponent,
  MoonIconComponent,
  MusicIconComponent,
  PackageIconComponent,
  PaperclipIconComponent,
  PenToolIconComponent,
  PencilIconComponent,
  PhoneIconComponent,
  PrinterIconComponent,
  RadioIconComponent,
  ScissorsIconComponent,
  ServerIconComponent,
  ShieldIconComponent,
  ShoppingCartIconComponent,
  SmartphoneIconComponent,
  SoccerBallIconComponent,
  StarIconComponent,
  SunIconComponent,
  TableIconComponent,
  TagIconComponent,
  TargetIconComponent,
  ThermometerIconComponent,
  ToolIconComponent,
  TrashIconComponent,
  TrophyIconComponent,
  UmbrellaIconComponent,
];

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

type ActionInFlight = 'submit' | 'accept' | 'void' | 'delete' | null;

@Component({
  selector: 'bb-bet-form-page',
  templateUrl: './bet-form-page.component.html',
  styleUrl: './bet-form-page.component.scss',
  imports: [
    NgComponentOutlet,
    AlertCircleIconComponent,
    ButtonComponent,
    CardComponent,
    CheckIconComponent,
    DialogComponent,
    DropdownComponent,
    EditIconComponent,
    InputComponent,
    PlusIconComponent,
    RadioComponent,
    RadioGroupComponent,
    RouterLink,
    SearchIconComponent,
    SliderComponent,
    TagComponent,
    TextareaComponent,
    TooltipDirective,
    TrashIconComponent,
  ],
})
export class BetFormPageComponent implements OnInit {
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

  readonly stockIcons = STOCK_ICONS;
  readonly iconColors = ICON_COLORS;
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

  readonly title = signal('');
  readonly description = signal('');
  readonly iconSlug = signal<string | null>(null);
  readonly iconColor = signal<string>(DEFAULT_ICON_COLOR);
  readonly iconFilter = signal('');
  readonly iconEditing = signal(true);
  readonly selectedFriendId = signal('');
  readonly outcomes = signal<BetResult[]>([
    { name: '', brewskiCount: 0, assignedTo: null },
  ]);
  readonly selectedOutcomeIndex = signal('');

  readonly titleTouched = signal(false);
  readonly descriptionTouched = signal(false);
  readonly friendTouched = signal(false);
  readonly iconTouched = signal(false);
  readonly outcomeDescriptionTouched = signal<Set<number>>(new Set());
  readonly outcomeAmountTouched = signal<Set<number>>(new Set());
  readonly submitAttempted = signal(false);

  readonly titleError = computed(() => {
    const empty = !this.title().trim();
    if (!empty) return '';
    if (this.titleTouched() || this.submitAttempted()) return 'Title is required';
    return '';
  });

  readonly descriptionError = computed(() => {
    const empty = !this.description().trim();
    if (!empty) return '';
    if (this.descriptionTouched() || this.submitAttempted())
      return 'Description is required';
    return '';
  });

  readonly friendError = computed(() => {
    if (this.mode() !== 'create') return '';
    if (this.selectedFriendId()) return '';
    if (this.friendTouched() || this.submitAttempted())
      return 'Select a friend to bet against';
    return '';
  });

  readonly iconError = computed(() => {
    if (this.iconSlug()) return '';
    if (this.iconTouched() || this.submitAttempted()) return 'Icon is required';
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

  readonly filteredIcons = computed(() => {
    const filter = this.iconFilter().trim().toLowerCase();
    if (!filter) return this.stockIcons;
    const tokens = filter.split(/\s+/).filter(Boolean);
    return this.stockIcons.filter(icon =>
      tokens.every(token => icon.tags.some(tag => tag.toLowerCase().includes(token))),
    );
  });

  readonly selectedIcon = computed(() =>
    this.stockIcons.find(icon => icon.slug === this.iconSlug()),
  );

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

  readonly youLabel = computed(() => {
    if (!this.bet) return 'You';
    return this.myPosition() === 'user1' ? 'You' : this.opponentName();
  });

  readonly themLabel = computed(() => {
    if (!this.bet) {
      const friend = this.friends().find(f => f.id === this.selectedFriendId());
      return friend ? `${friend.firstName} ${friend.lastName}` : 'Them';
    }
    return this.myPosition() === 'user2' ? 'You' : this.opponentName();
  });

  readonly specialOutcomes = computed(() => {
    if (!this.bet) return [];
    return this.bet.results.filter(outcome => outcome.isSpecial);
  });

  readonly isFormValid = computed(() => {
    if (!this.title().trim()) return false;
    if (!this.description().trim()) return false;
    if (this.mode() === 'create' && !this.selectedFriendId()) return false;
    if (!this.iconSlug()) return false;
    if (!this.outcomes().length) return false;
    if (this.outcomes().some(outcome => !outcome.name.trim())) return false;
    if (this.outcomes().some(outcome => outcome.brewskiCount <= 0)) return false;
    return true;
  });

  readonly absFormat = (value: number): string => `${Math.abs(value)}`;

  iconName(slug: string): string {
    return slug
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
        this.title.set(this.bet.title);
        this.description.set(this.bet.description);
        this.iconSlug.set(this.bet.iconSlug);
        this.iconColor.set(this.bet.iconColor ?? DEFAULT_ICON_COLOR);
        this.iconEditing.set(!this.bet.iconSlug);
        this.outcomes.set(this.bet.results.filter(outcome => !outcome.isSpecial));
        this.selectedOutcomeIndex.set(
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

  selectIcon(slug: string): void {
    this.iconSlug.set(this.iconSlug() === slug ? null : slug);
    this.iconTouched.set(true);
  }

  selectColor(color: string): void {
    this.iconColor.set(color);
  }

  confirmIcon(): void {
    if (!this.iconSlug()) return;
    this.iconEditing.set(false);
  }

  editIcon(): void {
    this.iconEditing.set(true);
  }

  addOutcome(): void {
    if (this.outcomes().length >= MAX_OUTCOMES) return;
    this.outcomes.update(outcomes => [
      ...outcomes,
      { name: '', brewskiCount: 1, assignedTo: 'user2' },
    ]);
  }

  removeOutcome(index: number): void {
    this.outcomes.update(outcomes => outcomes.filter((_, i) => i !== index));
    this.outcomeDescriptionTouched.update(s => {
      const next = new Set<number>();
      for (const i of s) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      }
      return next;
    });
    this.outcomeAmountTouched.update(s => {
      const next = new Set<number>();
      for (const i of s) {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
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
    if (!empty) return '';
    if (this.outcomeDescriptionTouched().has(index) || this.submitAttempted())
      return 'Outcome description is required';
    return '';
  }

  outcomeAmountError(outcome: BetResult, index: number): string {
    if (outcome.brewskiCount > 0) return '';
    if (this.submitAttempted()) return 'At least one brewski must be bet';
    if (
      this.outcomeAmountTouched().has(index) &&
      this.outcomeDescriptionTouched().has(index)
    )
      return 'At least one brewski must be bet';
    return '';
  }

  private validate(): boolean {
    this.submitAttempted.set(true);

    if (!this.title().trim()) return false;
    if (!this.description().trim()) return false;
    if (this.mode() === 'create' && !this.selectedFriendId()) return false;
    if (!this.iconSlug()) return false;
    if (!this.outcomes().length) return false;
    if (this.outcomes().some(outcome => !outcome.name.trim())) return false;
    if (this.outcomes().some(outcome => outcome.brewskiCount <= 0)) return false;

    return true;
  }

  async onSubmitForReview(): Promise<void> {
    if (!this.validate()) return;
    this.actionInFlight.set('submit');

    try {
      if (this.mode() === 'create') {
        await this.betsService.createBet({
          title: this.title(),
          description: this.description(),
          iconSlug: this.iconSlug(),
          iconColor: this.iconSlug() ? this.iconColor() : null,
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
          iconColor: this.iconSlug() ? this.iconColor() : null,
          results: this.outcomes().map(outcome => ({
            name: outcome.name,
            brewskiCount: outcome.brewskiCount,
            assignedTo: outcome.assignedTo,
          })),
          selectedResultIndex: this.selectedOutcomeIndex()
            ? Number(this.selectedOutcomeIndex())
            : undefined,
          action: 'submit',
        });
        this.toast.success('Changes submitted for review');
      }
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to submit bet');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  async onAccept(): Promise<void> {
    if (!this.bet) return;
    this.actionInFlight.set('accept');

    try {
      await this.betsService.updateBet(this.bet.id, {
        selectedResultIndex: this.selectedOutcomeIndex()
          ? Number(this.selectedOutcomeIndex())
          : undefined,
        action: 'accept',
      });
      this.toast.success('Bet accepted');
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to accept bet');
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
    if (!this.bet) return;
    this.actionInFlight.set('delete');

    try {
      await this.betsService.deleteBet(this.bet.id);
      this.deleteDialogOpen.set(false);
      this.toast.success('Bet deleted');
      await this.router.navigate(['/bets']);
    } catch {
      this.toast.error('Failed to delete bet');
    } finally {
      this.actionInFlight.set(null);
    }
  }

  async onProposeVoid(): Promise<void> {
    if (!this.bet) return;

    const voidIndex = this.bet.results.findIndex(outcome => outcome.isSpecial === 'void');
    if (voidIndex === -1) return;

    this.actionInFlight.set('void');
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
      this.actionInFlight.set(null);
    }
  }
}
