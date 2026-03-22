import {
  AvatarComponent,
  AvatarEditorComponent,
  AvatarEditorCropEvent,
  ButtonComponent,
  CardComponent,
  InputComponent,
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

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly editingAvatar = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

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
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    try {
      await this.clerk.updateProfile(this.firstName(), this.lastName());

      if (this.croppedBlob()) {
        await this.clerk.setProfileImage(this.croppedBlob());
        this.croppedBlob.set(null);
        this.croppedPreview.set(null);
      } else if (this.removeAvatar()) {
        await this.clerk.setProfileImage(null);
        this.removeAvatar.set(false);
      }

      this.success.set('Changes saved');
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
