import { EagamiWordmarkComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bb-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, EagamiWordmarkComponent],
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
