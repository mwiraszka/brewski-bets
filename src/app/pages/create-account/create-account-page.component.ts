import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-create-account-page',
  templateUrl: './create-account-page.component.html',
  styleUrl: './create-account-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class CreateAccountPageComponent implements OnDestroy {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  verificationCode = signal('');

  error = signal('');
  loading = signal(false);
  pendingVerification = signal(false);

  ngOnDestroy(): void {
    this.password.set('');
    this.confirmPassword.set('');
  }

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email())) {
      this.error.set('Please enter a valid email address');
      return;
    }

    if (this.password().length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      const { needsVerification } = await this.clerk.signUp(
        this.email(),
        this.password(),
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
      this.error.set('Please enter the verification code');
      return;
    }

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
