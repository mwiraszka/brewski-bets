import { FileTextIconComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-terms-of-service-page',
  templateUrl: './terms-of-service-page.component.html',
  styleUrl: './terms-of-service-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, FileTextIconComponent],
})
export class TermsOfServicePageComponent {
  private readonly clerk = inject(ClerkService);

  readonly showReturnHome = computed(
    () => this.clerk.isLoaded() && !this.clerk.isLoggedIn(),
  );
}
