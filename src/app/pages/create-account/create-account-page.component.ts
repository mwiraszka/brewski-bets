import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-create-account-page',
  templateUrl: './create-account-page.component.html',
  styleUrl: './create-account-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class CreateAccountPageComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  verificationCode = signal('');

  error = signal('');
  loading = signal(false);
  pendingVerification = signal(false);

  async onSubmit(): Promise<void> {
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
