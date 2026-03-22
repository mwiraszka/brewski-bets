import {
  AvatarComponent,
  AvatarEditorComponent,
  AvatarEditorCropEvent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  imports: [
    AvatarComponent,
    AvatarEditorComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
  ],
})
export class AccountPageComponent implements OnInit {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly firstNameError = signal('');
  readonly lastNameError = signal('');
  readonly editingAvatar = signal(false);
  readonly saving = signal(false);

  readonly avatarSrc = computed(() => {
    const user = this.clerk.user();
    return user?.hasImage ? user.imageUrl : undefined;
  });
  readonly initials = computed(() => {
    const user = this.clerk.user();
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || undefined;
  });

  private readonly croppedBlob = signal<Blob | null>(null);
  private readonly croppedPreview = signal<string | null>(null);
  private readonly removeAvatar = signal(false);

  readonly previewSrc = computed(() => {
    if (this.removeAvatar()) return undefined;
    return this.croppedPreview() ?? this.avatarSrc();
  });
  readonly hasPhoto = computed(() => !!this.previewSrc());
  readonly hasChanges = computed(() => {
    const user = this.clerk.user();
    return (
      this.firstName() !== (user?.firstName ?? '') ||
      this.lastName() !== (user?.lastName ?? '') ||
      !!this.croppedBlob() ||
      (this.removeAvatar() && !!this.avatarSrc())
    );
  });

  ngOnInit(): void {
    const user = this.clerk.user();
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
  }

  onCropped(event: AvatarEditorCropEvent): void {
    this.croppedBlob.set(event.blob);
    this.croppedPreview.set(event.dataUrl);
    this.editingAvatar.set(false);
  }

  onRemoveAvatar(): void {
    this.croppedBlob.set(null);
    this.croppedPreview.set(null);
    this.removeAvatar.set(true);
    this.editingAvatar.set(false);
  }

  onCancelAvatarEdit(): void {
    this.editingAvatar.set(false);
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
      const photoAdded = !!this.croppedBlob();
      const photoRemoved = this.removeAvatar() && this.avatarSrc();

      await this.clerk.updateProfile(this.firstName(), this.lastName());

      if (photoAdded) {
        await this.clerk.setProfileImage(this.croppedBlob());
        this.croppedBlob.set(null);
        this.croppedPreview.set(null);
      } else if (photoRemoved) {
        await this.clerk.setProfileImage(null);
        this.removeAvatar.set(false);
      }

      if (firstChanged) changes.push('first name');
      if (lastChanged) changes.push('last name');
      if (photoAdded) changes.push('photo');
      if (photoRemoved) changes.push('photo');

      if (changes.length) {
        const label =
          changes.length <= 2
            ? changes.join(' and ')
            : `${changes.slice(0, -1).join(', ')} and ${changes.at(-1)}`;
        this.toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} updated`);
      }
    } catch (e: unknown) {
      this.toast.error(this.clerk.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
