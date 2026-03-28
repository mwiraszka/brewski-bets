import {
  AvatarEditorComponent,
  AvatarEditorCropEvent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  ToastService,
} from '@eagami/ui';

import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';

import { ApiError, ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

interface UserResponse {
  avatarOriginalUrl: string | null;
}

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
  private readonly api = inject(ApiService);
  private readonly clerk = inject(ClerkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  private readonly avatarEditor = viewChild(AvatarEditorComponent);
  private readonly avatarEditorEl = viewChild(AvatarEditorComponent, { read: ElementRef });

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly firstNameError = signal('');
  readonly lastNameError = signal('');
  readonly saving = signal(false);
  readonly avatarDirty = signal(false);

  private readonly avatarOriginalUrl = signal<string | null>(null);

  readonly avatarSrc = computed(() => {
    const originalUrl = this.avatarOriginalUrl();
    if (originalUrl) return originalUrl;

    const user = this.clerk.user();
    return user?.hasImage ? user.imageUrl : undefined;
  });

  private readonly removeAvatar = signal(false);
  private cropResolver: ((blob: Blob) => void) | null = null;
  private originalFile: File | null = null;
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

    effect(() => {
      const editorEl = this.avatarEditorEl();
      if (!editorEl) return;
      this.listenForOriginalFile(editorEl.nativeElement);
    });
  }

  ngOnInit(): void {
    const user = this.clerk.user();
    this.firstName.set(user?.firstName ?? '');
    this.lastName.set(user?.lastName ?? '');
    this.fetchAvatarOriginalUrl();
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
    this.originalFile = null;
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
      const photoRemoved = this.removeAvatar() && !!this.avatarSrc();
      const editor = this.avatarEditor();
      const photoChanged = this.avatarDirty() && !this.removeAvatar() && !!editor?.hasImage();

      await this.clerk.updateProfile(this.firstName(), this.lastName());

      if (firstChanged || lastChanged) {
        const body: { firstName?: string; lastName?: string } = {};
        if (firstChanged) body.firstName = this.firstName();
        if (lastChanged) body.lastName = this.lastName();
        await this.api.patch('/users/me', body);
      }

      if (photoChanged) {
        const blob = await this.exportCrop();
        await this.clerk.setProfileImage(blob);

        if (this.originalFile) {
          try {
            await this.uploadOriginalAvatar(this.originalFile);
          } catch {
            this.toast.error('Full-size image could not be saved for future editing');
          }
        }
      } else if (photoRemoved) {
        await this.clerk.setProfileImage(null);

        try {
          await this.deleteOriginalAvatar();
        } catch {
          this.toast.error('Full-size image could not be removed');
        }
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
      this.originalFile = null;
    } catch (e: unknown) {
      this.toast.error(this.clerk.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  private async fetchAvatarOriginalUrl(): Promise<void> {
    try {
      const user = await this.api.get<UserResponse>('/users/me');
      this.avatarOriginalUrl.set(user.avatarOriginalUrl);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 404) {
        return;
      }
      this.toast.error('Full-size image could not be loaded');
    }
  }

  private async uploadOriginalAvatar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    const user = await this.api.post<UserResponse>('/users/me/avatar', formData);
    this.avatarOriginalUrl.set(user.avatarOriginalUrl);
  }

  private async deleteOriginalAvatar(): Promise<void> {
    await this.api.delete('/users/me/avatar');
    this.avatarOriginalUrl.set(null);
  }

  private listenForOriginalFile(hostEl: HTMLElement): void {
    const onFileCapture = (event: Event): void => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) this.originalFile = file;
    };

    const onDropCapture = (event: DragEvent): void => {
      const file = event.dataTransfer?.files[0];
      if (file) this.originalFile = file;
    };

    hostEl.addEventListener('change', onFileCapture, { capture: true });
    hostEl.addEventListener('drop', onDropCapture, { capture: true });

    this.destroyRef.onDestroy(() => {
      hostEl.removeEventListener('change', onFileCapture, { capture: true });
      hostEl.removeEventListener('drop', onDropCapture, { capture: true });
    });
  }

  private exportCrop(): Promise<Blob> {
    return new Promise(resolve => {
      this.cropResolver = resolve;
      this.avatarEditor()!.exportCrop();
    });
  }
}
