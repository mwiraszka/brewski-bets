import { EagamiWordmarkComponent } from '@eagami/ui';

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import packageJson from '../../../../package.json';

@Component({
  selector: 'bb-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  imports: [RouterLink, EagamiWordmarkComponent],
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly version = packageJson.version;
  readonly releaseUrl = `https://github.com/mwiraszka/brewski-bets/releases/tag/v${packageJson.version}`;
}
