import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class ForgotPasswordPageComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  email = signal('');
  code = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  error = signal('');
  loading = signal(false);
  codeSent = signal(false);

  async onSendCode(): Promise<void> {
    if (!this.email()) {
      this.error.set('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) {
      this.error.set('Please enter a valid email address');
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
    if (!this.code() || !this.newPassword() || !this.confirmPassword()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (this.newPassword().length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
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
