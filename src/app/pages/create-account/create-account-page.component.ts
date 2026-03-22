import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { GoogleIconComponent } from '@app/icons/google-icon.component';
import { ClerkService } from '@app/services/clerk.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'bb-create-account-page',
  templateUrl: './create-account-page.component.html',
  styleUrl: './create-account-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent, GoogleIconComponent],
})
export class CreateAccountPageComponent implements OnDestroy {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  firstName = signal('');
  lastName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  verificationCode = signal('');

  firstNameError = signal('');
  lastNameError = signal('');
  emailError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');
  verificationCodeError = signal('');
  error = signal('');
  loading = signal(false);
  googleLoading = signal(false);
  pendingVerification = signal(false);

  ngOnDestroy(): void {
    this.password.set('');
    this.confirmPassword.set('');
  }

  onEmailBlur(): void {
    if (!this.email()) return;
    this.emailError.set(
      EMAIL_REGEX.test(this.email()) ? '' : 'Please enter a valid email address',
    );
  }

  onPasswordBlur(): void {
    if (!this.password()) return;
    this.passwordError.set(
      this.password().length >= 8 ? '' : 'Must be at least 8 characters',
    );
  }

  onConfirmPasswordBlur(): void {
    if (!this.confirmPassword()) return;
    this.confirmPasswordError.set(
      !this.password() || this.confirmPassword() === this.password()
        ? ''
        : 'Passwords do not match',
    );
  }

  onVerificationCodeBlur(): void {
    // No format validation needed for code
  }

  async onContinueWithGoogle(): Promise<void> {
    this.googleLoading.set(true);
    try {
      await this.clerk.continueWithGoogle();
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
      this.googleLoading.set(false);
    }
  }

  private validateAll(): boolean {
    this.firstNameError.set(!this.firstName() ? 'First name is required' : '');
    this.lastNameError.set(!this.lastName() ? 'Last name is required' : '');

    if (!this.email()) {
      this.emailError.set('Email is required');
    } else if (!EMAIL_REGEX.test(this.email())) {
      this.emailError.set('Please enter a valid email address');
    } else {
      this.emailError.set('');
    }

    if (!this.password()) {
      this.passwordError.set('Password is required');
    } else if (this.password().length < 8) {
      this.passwordError.set('Must be at least 8 characters');
    } else {
      this.passwordError.set('');
    }

    if (!this.confirmPassword()) {
      this.confirmPasswordError.set('Please confirm your password');
    } else if (this.password() && this.confirmPassword() !== this.password()) {
      this.confirmPasswordError.set('Passwords do not match');
    } else {
      this.confirmPasswordError.set('');
    }

    return !this.firstNameError() && !this.lastNameError() &&
      !this.emailError() && !this.passwordError() && !this.confirmPasswordError();
  }

  async onSubmit(): Promise<void> {
    if (!this.validateAll()) return;

    this.error.set('');
    this.loading.set(true);

    try {
      const { needsVerification } = await this.clerk.createAccount(
        this.email(),
        this.password(),
        this.firstName(),
        this.lastName(),
      );

      if (needsVerification) {
        this.pendingVerification.set(true);
      } else {
        await this.router.navigate(['/']);
      }
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async onVerify(): Promise<void> {
    if (!this.verificationCode()) {
      this.verificationCodeError.set('Verification code is required');
      return;
    }

    this.verificationCodeError.set('');
    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.verifyEmail(this.verificationCode());
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

}
