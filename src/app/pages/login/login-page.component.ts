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
    if (!this.email() || !this.password()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email())) {
      this.error.set('Please enter a valid email address');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    try {
      await this.clerk.signIn(this.email(), this.password());
      await this.router.navigate(['/']);
    } catch (e: unknown) {
      this.error.set(this.clerk.extractError(e));
    } finally {
      this.loading.set(false);
    }
  }
}
