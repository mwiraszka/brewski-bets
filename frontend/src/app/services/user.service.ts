import { type AvatarEditorCropState } from '@eagami/ui';

import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  clerkImageUrl: string | null;
  avatarUrl: string | null;
  avatarOriginalUrl: string | null;
  avatarCropState: AvatarEditorCropState | null;
  lastModifiedDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);
  private readonly clerk = inject(ClerkService);

  private readonly _user = signal<UserRecord | null>(null);

  readonly user = this._user.asReadonly();

  // Direct R2 URL of the uncropped original, used by the avatar editor to
  // re-crop. The key is stable so a cache-buster forces a reload after re-upload.
  readonly fullSizeAvatarUrl = computed((): string | undefined => {
    const user = this._user();
    if (user?.avatarOriginalUrl) {
      const cacheBuster = new Date(user.lastModifiedDate).getTime();
      return `${user.avatarOriginalUrl}?t=${cacheBuster}`;
    }
    return undefined;
  });

  readonly avatarUrl = computed((): string | undefined => {
    return this.fullSizeAvatarUrl() ?? this.clerkAvatarUrl();
  });

  private readonly clerkAvatarUrl = computed((): string | undefined => {
    const clerkUser = this.clerk.user();
    return clerkUser?.hasImage ? clerkUser.imageUrl : undefined;
  });

  readonly avatarCropState = computed(() => this._user()?.avatarCropState ?? null);

  readonly hasAvatar = computed(() => !!this.avatarUrl());

  async load(): Promise<void> {
    if (!this.clerk.isLoggedIn()) {
      return;
    }
    try {
      const user = await this.api.get<UserRecord>('/users/me');
      this._user.set(user);
    } catch {
      // silently ignore; app still works without user record
    }
  }

  setUser(user: UserRecord): void {
    this._user.set(user);
  }

  clearAvatar(): void {
    const current = this._user();
    if (current) {
      this._user.set({
        ...current,
        avatarUrl: null,
        avatarOriginalUrl: null,
        avatarCropState: null,
      });
    }
  }
}
