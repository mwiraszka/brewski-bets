import {
  AvatarEditorComponent,
  AvatarEditorCropEvent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import { Component, computed, effect, inject, OnInit, signal, viewChild } from '@angular/core';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  imports: [
    AvatarEditorComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
  ],
})
export class AccountPageComponent implements OnInit {
  private readonly clerk = inject(ClerkService);
  private readonly toast = inject(ToastService);

  private readonly avatarEditor = viewChild(AvatarEditorComponent);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly firstNameError = signal('');
  readonly lastNameError = signal('');
  readonly saving = signal(false);
  readonly avatarDirty = signal(false);

  readonly avatarSrc = computed(() => {
    const user = this.clerk.user();
    return user?.hasImage ? user.imageUrl : undefined;
  });

  private readonly removeAvatar = signal(false);
  private cropResolver: ((blob: Blob) => void) | null = null;
  private initialLoadDone = false;

  readonly hasChanges = computed(() => {
    const user = this.clerk.user();
    return (
      this.firstName() !== (user?.firstName ?? '') ||
      this.lastName() !== (user?.lastName ?? '') ||
      this.avatarDirty()
    );
  });

  constructor() {
    effect(() => {
      const editor = this.avatarEditor();
      if (!editor) return;
      const hasImage = editor.hasImage();

      if (!this.initialLoadDone) {
        this.initialLoadDone = true;
        return;
      }

      this.avatarDirty.set(true);
      if (!hasImage) return;
      this.removeAvatar.set(false);
    });
  }

  ngOnInit(): void {
    const user = this.clerk.user();
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
  }

  onCropped(event: AvatarEditorCropEvent): void {
    if (this.cropResolver) {
      this.cropResolver(event.blob);
      this.cropResolver = null;
    }
  }

  onRemoveAvatar(): void {
    this.avatarDirty.set(true);
    this.removeAvatar.set(true);
  }

  async onSave(): Promise<void> {
    this.firstNameError.set('');
    this.lastNameError.set('');

    const firstEmpty = !this.firstName().trim();
    const lastEmpty = !this.lastName().trim();

    if (firstEmpty) this.firstNameError.set('First name is required');
    if (lastEmpty) this.lastNameError.set('Last name is required');
    if (firstEmpty || lastEmpty) return;

    this.saving.set(true);

    try {
      const user = this.clerk.user();
      const changes: string[] = [];

      const firstChanged = this.firstName() !== (user?.firstName ?? '');
      const lastChanged = this.lastName() !== (user?.lastName ?? '');
      const photoRemoved = this.removeAvatar() && this.avatarSrc();
      const editor = this.avatarEditor();
      const photoChanged = this.avatarDirty() && !this.removeAvatar() && editor?.hasImage();

      await this.clerk.updateProfile(this.firstName(), this.lastName());

      if (photoChanged) {
        const blob = await this.exportCrop();
        await this.clerk.setProfileImage(blob);
      } else if (photoRemoved) {
        await this.clerk.setProfileImage(null);
      }

      if (firstChanged) changes.push('first name');
      if (lastChanged) changes.push('last name');
      if (photoChanged || photoRemoved) changes.push('photo');

      if (changes.length) {
        const label =
          changes.length <= 2
            ? changes.join(' and ')
            : `${changes.slice(0, -1).join(', ')} and ${changes.at(-1)}`;
        this.toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} updated`);
      }

      this.avatarDirty.set(false);
      this.removeAvatar.set(false);
    } catch (e: unknown) {
      this.toast.error(this.clerk.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  private exportCrop(): Promise<Blob> {
    return new Promise(resolve => {
      this.cropResolver = resolve;
      this.avatarEditor()!.exportCrop();
    });
  }
}
