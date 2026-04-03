import {
  AvatarEditorComponent,
  AvatarEditorCropState,
  ButtonComponent,
  CardComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';

import { ApiError, ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

import { environment } from '@env';

interface UserResponse {
  id: string;
  avatarOriginalUrl: string | null;
  avatarCropState: AvatarEditorCropState | null;
  lastModifiedDate: string;
}

@Component({
  selector: 'bb-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  imports: [AvatarEditorComponent, ButtonComponent, CardComponent, InputComponent],
})
export class AccountPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly clerk = inject(ClerkService);
  private readonly toast = inject(ToastService);

  private readonly avatarEditor = viewChild(AvatarEditorComponent);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly firstNameError = signal('');
  readonly lastNameError = signal('');
  readonly saving = signal(false);
  readonly avatarDirty = signal(false);

  readonly avatarOriginalUrl = signal<string | null>(null);
  readonly editorSrc = signal<string | undefined>(undefined);
  readonly removeAvatar = signal(false);
  readonly savedCropState = signal<AvatarEditorCropState | null>(null);
  readonly liveCropState = signal<AvatarEditorCropState | null>(null);
  originalFile: File | null = null;

  readonly hasChanges = computed(() => {
    const user = this.clerk.user();
    return (
      this.firstName() !== (user?.firstName ?? '') ||
      this.lastName() !== (user?.lastName ?? '') ||
      this.avatarDirty() ||
      this.isCropChanged()
    );
  });

  ngOnInit(): void {
    const user = this.clerk.user();
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
    if (user?.hasImage) {
      this.editorSrc.set(user.imageUrl);
    }
    this.fetchAvatarOriginalUrl();
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
    const user = this.clerk.user();
    const changes: string[] = [];

    const firstChanged = this.firstName() !== (user?.firstName ?? '');
    const lastChanged = this.lastName() !== (user?.lastName ?? '');
    const photoChanged =
      this.avatarDirty() && !this.removeAvatar() && !!this.originalFile;
    const photoRemoved =
      this.avatarDirty() &&
      this.removeAvatar() &&
      (!!this.avatarOriginalUrl() || !!this.clerk.user()?.hasImage);
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
    await this.clerk.setProfileImage(blob);

    if (this.originalFile) {
      try {
        await this.uploadOriginalAvatar(this.originalFile, cropState);
      } catch {
        this.toast.error('Full-size image could not be saved for future editing');
      }
    }
  }

  private async removePhoto(): Promise<void> {
    await this.clerk.setProfileImage(null);

    try {
      await this.deleteOriginalAvatar();
    } catch {
      this.toast.error('Full-size image could not be removed');
    }
  }

  private async saveCropState(): Promise<void> {
    const cropState = this.liveCropState();
    if (!cropState) return;
    await this.api.patch('/users/me', { avatarCropState: cropState });
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
    if (!live || !saved) return false;
    return (
      live.zoom !== saved.zoom ||
      live.offsetX !== saved.offsetX ||
      live.offsetY !== saved.offsetY
    );
  }

  async fetchAvatarOriginalUrl(): Promise<void> {
    try {
      const user = await this.api.get<UserResponse>('/users/me');

      if (user.avatarOriginalUrl) {
        const cacheBuster = new Date(user.lastModifiedDate).getTime();
        const url = `${environment.apiUrl}/users/${user.id}/avatar?t=${cacheBuster}`;
        this.avatarOriginalUrl.set(url);
        if (user.avatarCropState) {
          this.savedCropState.set(user.avatarCropState);
          this.liveCropState.set(user.avatarCropState);
        }
        this.editorSrc.set(url);
      }
    } catch (e: unknown) {
      if (!(e instanceof ApiError) || e.status === 401) {
        return;
      }
      this.toast.error('Full-size image could not be loaded');
    }
  }

  private async uploadOriginalAvatar(
    file: File,
    cropState: AvatarEditorCropState,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cropState', JSON.stringify(cropState));
    await this.api.post<UserResponse>('/users/me/avatar', formData);
    this.savedCropState.set(cropState);
    this.liveCropState.set(cropState);
  }

  private async deleteOriginalAvatar(): Promise<void> {
    await this.api.delete('/users/me/avatar');
    this.avatarOriginalUrl.set(null);
    this.editorSrc.set(undefined);
    this.savedCropState.set(null);
    this.liveCropState.set(null);
  }

  exportCrop(): Promise<Blob> {
    return this.avatarEditor()!.exportCrop();
  }
}
