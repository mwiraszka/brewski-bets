import {
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
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
const MAX_RESULTS = 5;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 500;
const OUTCOME_MAX_LENGTH = 60;
const NOTCH_VALUES: ReadonlyArray<number> = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6];

type ActionInFlight = 'submit' | 'accept' | 'void' | 'delete' | null;

@Component({
  selector: 'bb-bet-form-page',
  templateUrl: './bet-form-page.component.html',
  styleUrl: './bet-form-page.component.scss',
  imports: [
    NgComponentOutlet,
    ButtonComponent,
    CardComponent,
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

  readonly stockIcons = STOCK_ICONS;
  readonly iconColors = ICON_COLORS;
  readonly maxBrewskiCount = MAX_BREWSKI_COUNT;
  readonly maxResults = MAX_RESULTS;
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
  readonly results = signal<BetResult[]>([
    { name: '', brewskiCount: 0, assignedTo: null },
  ]);
  readonly selectedResultIndex = signal('');

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

  readonly specialResults = computed(() => {
    if (!this.bet) return [];
    return this.bet.results.filter(r => r.isSpecial);
  });

  readonly isFormValid = computed(() => {
    if (!this.title().trim()) return false;
    if (!this.description().trim()) return false;
    if (this.mode() === 'create' && !this.selectedFriendId()) return false;
    if (!this.iconSlug()) return false;
    if (!this.results().length) return false;
    if (this.results().some(r => !r.name.trim())) return false;
    if (this.results().some(r => r.brewskiCount <= 0)) return false;
    return true;
  });

  readonly absFormat = (value: number): string => `${Math.abs(value)}`;

  signedBrewskiCount(result: BetResult): number {
    const me = this.bet ? this.myPosition() : 'user1';
    return result.assignedTo === me ? -result.brewskiCount : result.brewskiCount;
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

  addResult(): void {
    if (this.results().length >= MAX_RESULTS) return;
    this.results.update(r => [...r, { name: '', brewskiCount: 1, assignedTo: 'user2' }]);
  }

  removeResult(index: number): void {
    this.results.update(r => r.filter((_, i) => i !== index));
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

  updateResultName(index: number, name: string): void {
    const trimmed = name.slice(0, OUTCOME_MAX_LENGTH);
    this.results.update(r =>
      r.map((item, i) => (i === index ? { ...item, name: trimmed } : item)),
    );
  }

  setTitle(value: string): void {
    this.title.set(value.slice(0, TITLE_MAX_LENGTH));
  }

  updateResultSigned(index: number, signedValue: number): void {
    const me = this.bet ? this.myPosition() : 'user1';
    const other: 'user1' | 'user2' = me === 'user1' ? 'user2' : 'user1';
    const brewskiCount = Math.abs(signedValue);
    const assignedTo: 'user1' | 'user2' = signedValue < 0 ? (me ?? 'user1') : other;
    this.results.update(r =>
      r.map((item, i) => (i === index ? { ...item, brewskiCount, assignedTo } : item)),
    );
    this.outcomeAmountTouched.update(s => new Set(s).add(index));
  }

  markOutcomeDescriptionTouched(index: number): void {
    this.outcomeDescriptionTouched.update(s => new Set(s).add(index));
  }

  outcomeDescriptionError(index: number, name: string): string {
    const empty = !name.trim();
    if (!empty) return '';
    if (this.outcomeDescriptionTouched().has(index) || this.submitAttempted())
      return 'Outcome description is required';
    return '';
  }

  outcomeAmountError(result: BetResult, index: number): string {
    if (result.brewskiCount > 0) return '';
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
    if (!this.results().length) return false;
    if (this.results().some(r => !r.name.trim())) return false;
    if (this.results().some(r => r.brewskiCount <= 0)) return false;

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
          iconSlug: this.iconSlug(),
          iconColor: this.iconSlug() ? this.iconColor() : null,
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
      this.actionInFlight.set(null);
    }
  }

  async onAccept(): Promise<void> {
    if (!this.bet) return;
    this.actionInFlight.set('accept');

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

    const voidIndex = this.bet.results.findIndex(r => r.isSpecial === 'void');
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
