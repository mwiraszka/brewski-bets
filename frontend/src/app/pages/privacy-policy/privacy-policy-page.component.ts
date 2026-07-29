import { ShieldIconComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-privacy-policy-page',
  templateUrl: './privacy-policy-page.component.html',
  styleUrl: './privacy-policy-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, ShieldIconComponent],
})
export class PrivacyPolicyPageComponent {
  private readonly clerk = inject(ClerkService);

  readonly showReturnHome = computed(
    () => this.clerk.isLoaded() && !this.clerk.isLoggedIn(),
  );
}
