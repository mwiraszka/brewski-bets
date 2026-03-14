import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'bb-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class ForgotPasswordPageComponent implements OnDestroy {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  email = signal('');
  code = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  emailError = signal('');
  codeError = signal('');
  newPasswordError = signal('');
  confirmPasswordError = signal('');
  error = signal('');
  loading = signal(false);
  codeSent = signal(false);

  ngOnDestroy(): void {
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  onEmailBlur(): void {
    if (!this.email()) {
      this.emailError.set('Email is required');
    } else if (!EMAIL_REGEX.test(this.email())) {
      this.emailError.set('Please enter a valid email address');
    } else {
      this.emailError.set('');
    }
  }

  onCodeBlur(): void {
    if (!this.code()) {
      this.codeError.set('Reset code is required');
    } else {
      this.codeError.set('');
    }
  }

  onNewPasswordBlur(): void {
    if (!this.newPassword()) {
      this.newPasswordError.set('Password is required');
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

  async onSendCode(): Promise<void> {
    this.onEmailBlur();

    if (this.emailError()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.sendPasswordResetCode(this.email());
      this.codeSent.set(true);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async onResetPassword(): Promise<void> {
    this.onCodeBlur();
    this.onNewPasswordBlur();
    this.onConfirmPasswordBlur();

    if (this.codeError() || this.newPasswordError() || this.confirmPasswordError()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.resetPassword(this.code(), this.newPassword());
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }
}
