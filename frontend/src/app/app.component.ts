import { ToastComponent, ToastService } from '@eagami/ui';

import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { FooterComponent } from '@app/components/footer/footer.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
})
export class AppComponent {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  constructor() {
    effect(() => {
      if (this.clerk.externallyDeleted()) {
        this.toast.success('Account deleted');
        this.router.navigate(['/']);
      }
    });
  }
}
