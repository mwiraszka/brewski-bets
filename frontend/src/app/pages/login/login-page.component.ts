import {
  ButtonComponent,
  CardComponent,
  CodeInputComponent,
  DividerComponent,
  InputComponent,
} from '@eagami/ui';

import { Component, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { GoogleIconComponent } from '@app/icons/google-icon.component';
import { ClerkService } from '@app/services/clerk.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'bb-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  imports: [
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    CodeInputComponent,
    DividerComponent,
    InputComponent,
    GoogleIconComponent,
  ],
})
export class LoginPageComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  private readonly codeInput = viewChild<ElementRef>('codeInput');

  email = signal('');
  password = signal('');

  verificationCode = signal('');

  emailError = signal('');
  passwordError = signal('');
  verificationCodeError = signal('');
  error = signal('');
  loading = signal(false);
  googleLoading = signal(false);
  pendingSecondFactor = signal(false);

  onEmailBlur(): void {
    if (!this.email()) {
      return;
    }
    this.emailError.set(
      EMAIL_REGEX.test(this.email()) ? '' : 'Please enter a valid email address',
    );
  }

  onPasswordBlur(): void {
    // No format validation needed for login password
  }

  private validateAll(): boolean {
    if (!this.email()) {
      this.emailError.set('Email is required');
    } else if (!EMAIL_REGEX.test(this.email())) {
      this.emailError.set('Please enter a valid email address');
    } else {
      this.emailError.set('');
    }

    if (!this.password()) {
      this.passwordError.set('Password is required');
    } else {
      this.passwordError.set('');
    }

    return !this.emailError() && !this.passwordError();
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

  async onVerify(): Promise<void> {
    this.verificationCodeError.set('');
    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.verifyLoginCode(this.verificationCode());
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.validateAll()) {
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      const { needsSecondFactor } = await this.clerk.logIn(this.email(), this.password());

      if (needsSecondFactor) {
        this.pendingSecondFactor.set(true);
        setTimeout(() => this.codeInput()?.nativeElement.querySelector('input')?.focus());
      } else {
        await this.router.navigate(['/']);
      }
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }
}
