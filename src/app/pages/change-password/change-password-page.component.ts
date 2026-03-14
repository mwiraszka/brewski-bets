import { ButtonComponent, CardComponent, InputComponent } from '@eagami/ui';

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-change-password-page',
  templateUrl: './change-password-page.component.html',
  styleUrl: './change-password-page.component.scss',
  imports: [FormsModule, RouterLink, ButtonComponent, CardComponent, InputComponent],
})
export class ChangePasswordPageComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  error = signal('');
  loading = signal(false);

  async onSubmit(): Promise<void> {
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
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
