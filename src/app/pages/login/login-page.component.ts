import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class LoginPageComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  email = signal('');
  password = signal('');

  error = signal('');
  loading = signal(false);

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.signIn(this.email(), this.password());
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private extractError(e: unknown): string {
    if (e && typeof e === 'object' && 'errors' in e) {
      const errors = (e as { errors: Array<{ longMessage?: string }> }).errors;
      return errors[0]?.longMessage ?? 'An unexpected error occurred.';
    }
    return 'An unexpected error occurred.';
  }
}
