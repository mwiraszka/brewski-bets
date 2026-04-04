import { AvatarEditorCropState } from '@eagami/ui';

import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

import { environment } from '@env';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
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

  readonly avatarUrl = computed((): string | undefined => {
    const user = this._user();
    if (user?.avatarOriginalUrl) {
      const cacheBuster = new Date(user.lastModifiedDate).getTime();
      return `${environment.apiUrl}/users/${user.id}/avatar?t=${cacheBuster}`;
    }
    const clerkUser = this.clerk.user();
    return clerkUser?.hasImage ? clerkUser.imageUrl : undefined;
  });

  readonly avatarCropState = computed(() => this._user()?.avatarCropState ?? null);

  readonly hasAvatar = computed(() => !!this.avatarUrl());

  async load(): Promise<void> {
    if (!this.clerk.isLoggedIn()) return;
    try {
      const user = await this.api.get<UserRecord>('/users/me');
      this._user.set(user);
    } catch {
      // silently ignore — app still works without user record
    }
  }

  setUser(user: UserRecord): void {
    this._user.set(user);
  }

  clearAvatar(): void {
    const current = this._user();
    if (current) {
      this._user.set({ ...current, avatarOriginalUrl: null, avatarCropState: null });
    }
  }
}
