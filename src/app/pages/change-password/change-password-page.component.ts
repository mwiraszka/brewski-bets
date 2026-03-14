import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-change-password-page',
  templateUrl: './change-password-page.component.html',
  styleUrl: './change-password-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class ChangePasswordPageComponent implements OnDestroy {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  currentPasswordError = signal('');
  newPasswordError = signal('');
  confirmPasswordError = signal('');
  error = signal('');
  loading = signal(false);

  ngOnDestroy(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  onCurrentPasswordBlur(): void {
    if (!this.currentPassword()) {
      this.currentPasswordError.set('Current password is required');
    } else {
      this.currentPasswordError.set('');
    }
  }

  onNewPasswordBlur(): void {
    if (!this.newPassword()) {
      this.newPasswordError.set('New password is required');
    } else if (this.newPassword().length < 8) {
      this.newPasswordError.set('Must be at least 8 characters');
    } else {
      this.newPasswordError.set('');
    }
  }

  onConfirmPasswordBlur(): void {
    if (!this.confirmPassword()) {
      this.confirmPasswordError.set('Please confirm your password');
    } else if (this.newPassword() && this.confirmPassword() !== this.newPassword()) {
      this.confirmPasswordError.set('Passwords do not match');
    } else {
      this.confirmPasswordError.set('');
    }
  }

  async onSubmit(): Promise<void> {
    this.onCurrentPasswordBlur();
    this.onNewPasswordBlur();
    this.onConfirmPasswordBlur();

    if (this.currentPasswordError() || this.newPasswordError() || this.confirmPasswordError()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.changePassword(
        this.currentPassword(),
        this.newPassword(),
      );
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }
}
