import {
  AvatarEditorComponent,
  AvatarEditorCropState,
  ButtonComponent,
  CardComponent,
  DialogComponent,
  DividerComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';
import { UserRecord, UserService } from '@app/services/user.service';

@Component({
  selector: 'bb-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  imports: [
    AvatarEditorComponent,
    ButtonComponent,
    CardComponent,
    DialogComponent,
    DividerComponent,
    InputComponent,
  ],
})
export class AccountPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly clerk = inject(ClerkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  private readonly avatarEditor = viewChild(AvatarEditorComponent);

  readonly firstName = signal('');
  readonly lastName = signal('');
  private readonly originalFirstName = signal('');
  private readonly originalLastName = signal('');
  readonly firstNameError = signal('');
  readonly lastNameError = signal('');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly deleteDialogOpen = signal(false);
  readonly avatarDirty = signal(false);

  readonly editorSrc = signal<string | undefined>(undefined);
  readonly revertSrc = signal<string | undefined>(undefined);
  readonly removeAvatar = signal(false);
  readonly savedCropState = signal<AvatarEditorCropState | null>(null);
  readonly liveCropState = signal<AvatarEditorCropState | null>(null);
  originalFile: File | null = null;

  readonly hasChanges = computed(() => {
    return (
      this.firstName() !== this.originalFirstName() ||
      this.lastName() !== this.originalLastName() ||
      this.avatarDirty() ||
      this.isCropChanged()
    );
  });

  ngOnInit(): void {
    const user = this.clerk.user();
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
    this.originalFirstName.set(user?.firstName ?? '');
    this.originalLastName.set(user?.lastName ?? '');

    const cropState = this.userService.avatarCropState();
    this.savedCropState.set(cropState);
    this.liveCropState.set(cropState);

    this.editorSrc.set(this.userService.avatarUrl());

    const clerkUser = this.clerk.user();
    this.revertSrc.set(clerkUser?.hasImage ? clerkUser.imageUrl : undefined);

    this.refreshFromClerk(false);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.refreshFromClerk(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  private async refreshFromClerk(notify: boolean): Promise<void> {
    const previousRevertSrc = this.revertSrc();

    await this.clerk.reloadUser();
    await this.userService.load();

    const changes: string[] = [];

    const user = this.userService.user();
    if (user) {
      const currentFirst = this.originalFirstName();
      const currentLast = this.originalLastName();

      if (currentFirst && user.firstName !== currentFirst) {
        changes.push('first name');
      }
      if (currentLast && user.lastName !== currentLast) {
        changes.push('last name');
      }

      this.firstName.set(user.firstName);
      this.lastName.set(user.lastName);
      this.originalFirstName.set(user.firstName);
      this.originalLastName.set(user.lastName);
    }

    const clerkUser = this.clerk.user();
    const newRevertSrc = clerkUser?.hasImage ? clerkUser.imageUrl : undefined;

    if (newRevertSrc !== previousRevertSrc) {
      changes.push('photo');
      this.revertSrc.set(newRevertSrc);
      this.editorSrc.set(this.userService.avatarUrl() ?? newRevertSrc);
    }

    if (notify && changes.length) {
      this.toast.success(this.buildSuccessMessage(changes));
    }
  }

  onFileSelected(file: File): void {
    this.originalFile = file;
    this.avatarDirty.set(true);
    this.removeAvatar.set(false);
    this.liveCropState.set(null);
  }

  onCropStateChange(state: AvatarEditorCropState): void {
    this.liveCropState.set(state);
  }

  onRemoveAvatar(): void {
    this.avatarDirty.set(true);
    this.removeAvatar.set(true);
    this.originalFile = null;
  }

  async onSave(): Promise<void> {
    if (!this.validate()) return;

    this.saving.set(true);

    try {
      const changes = await this.applyChanges();

      if (changes.length) {
        this.toast.success(this.buildSuccessMessage(changes));
      }

      this.originalFirstName.set(this.firstName());
      this.originalLastName.set(this.lastName());
      this.avatarDirty.set(false);
      this.removeAvatar.set(false);
      this.originalFile = null;
    } catch (e: unknown) {
      this.toast.error(this.clerk.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  private validate(): boolean {
    this.firstNameError.set('');
    this.lastNameError.set('');

    const firstEmpty = !this.firstName().trim();
    const lastEmpty = !this.lastName().trim();

    if (firstEmpty) this.firstNameError.set('First name is required');
    if (lastEmpty) this.lastNameError.set('Last name is required');

    return !firstEmpty && !lastEmpty;
  }

  private async applyChanges(): Promise<string[]> {
    const changes: string[] = [];

    const firstChanged = this.firstName() !== this.originalFirstName();
    const lastChanged = this.lastName() !== this.originalLastName();
    const photoChanged =
      this.avatarDirty() && !this.removeAvatar() && !!this.originalFile;
    const photoRemoved =
      this.avatarDirty() && this.removeAvatar() && this.userService.hasAvatar();
    const cropChanged = this.isCropChanged();

    if (firstChanged || lastChanged) {
      await this.clerk.updateProfile(this.firstName(), this.lastName());
      await this.saveNameToBackend(firstChanged, lastChanged);
      if (firstChanged) changes.push('first name');
      if (lastChanged) changes.push('last name');
    }

    if (photoChanged) {
      await this.savePhoto();
      changes.push('photo');
    } else if (photoRemoved) {
      await this.removePhoto();
      changes.push('photo');
    } else if (cropChanged) {
      await this.saveCropState();
      changes.push('photo');
    }

    return changes;
  }

  private async saveNameToBackend(
    firstChanged: boolean,
    lastChanged: boolean,
  ): Promise<void> {
    const body: { firstName?: string; lastName?: string } = {};
    if (firstChanged) body.firstName = this.firstName();
    if (lastChanged) body.lastName = this.lastName();
    await this.api.patch('/users/me', body);
  }

  private async savePhoto(): Promise<void> {
    const blob = await this.exportCrop();
    const cropState = this.liveCropState() ?? { zoom: 1, offsetX: 0, offsetY: 0 };
    const clerkImageUrl = await this.clerk.setProfileImage(blob);

    await this.api.patch('/users/me', { clerkImageUrl });

    if (this.originalFile) {
      try {
        await this.uploadOriginalAvatar(this.originalFile, cropState, clerkImageUrl);
      } catch {
        this.toast.error('Full-size image could not be saved for future editing');
      }
    }
  }

  private async removePhoto(): Promise<void> {
    const clerkImageUrl = await this.clerk.setProfileImage(null);

    try {
      await this.deleteOriginalAvatar(clerkImageUrl);
    } catch {
      this.toast.error('Full-size image could not be removed');
    }
  }

  private async saveCropState(): Promise<void> {
    const cropState = this.liveCropState();
    if (!cropState) return;
    const blob = await this.exportCrop();
    const clerkImageUrl = await this.clerk.setProfileImage(blob);
    await this.api.patch('/users/me', { avatarCropState: cropState, clerkImageUrl });
    this.savedCropState.set(cropState);
  }

  private buildSuccessMessage(changes: string[]): string {
    const label =
      changes.length <= 2
        ? changes.join(' and ')
        : `${changes.slice(0, -1).join(', ')} and ${changes.at(-1)}`;
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} updated`;
  }

  private isCropChanged(): boolean {
    if (this.avatarDirty()) return false;
    const saved = this.savedCropState();
    const live = this.liveCropState();
    if (!live) return false;
    if (!saved) {
      return live.zoom !== 1 || live.offsetX !== 0 || live.offsetY !== 0;
    }
    return (
      live.zoom !== saved.zoom ||
      live.offsetX !== saved.offsetX ||
      live.offsetY !== saved.offsetY
    );
  }

  private async uploadOriginalAvatar(
    file: File,
    cropState: AvatarEditorCropState,
    clerkImageUrl?: string,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cropState', JSON.stringify(cropState));
    if (clerkImageUrl) {
      formData.append('clerkImageUrl', clerkImageUrl);
    }
    const user = await this.api.post<UserRecord>('/users/me/avatar', formData);
    this.userService.setUser(user);
    this.savedCropState.set(cropState);
    this.liveCropState.set(cropState);
  }

  private async deleteOriginalAvatar(clerkImageUrl?: string): Promise<void> {
    const query = clerkImageUrl
      ? `?clerkImageUrl=${encodeURIComponent(clerkImageUrl)}`
      : '';
    await this.api.delete(`/users/me/avatar${query}`);
    this.userService.clearAvatar();
    this.editorSrc.set(undefined);
    this.savedCropState.set(null);
    this.liveCropState.set(null);
  }

  async onConfirmDelete(): Promise<void> {
    this.deleting.set(true);

    try {
      this.clerk.expectSessionEnd();
      await this.api.delete('/users/me');
      this.deleteDialogOpen.set(false);

      try {
        await this.clerk.logOut();
      } catch {
        // session may already be invalidated
      }

      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.toast.error(this.clerk.extractError(e));
    } finally {
      this.deleting.set(false);
    }
  }

  exportCrop(): Promise<Blob> {
    return this.avatarEditor()!.exportCrop();
  }
}
