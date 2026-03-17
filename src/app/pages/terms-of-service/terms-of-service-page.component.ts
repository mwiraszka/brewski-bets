import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardComponent } from '@eagami/ui';

@Component({
  selector: 'bb-terms-of-service-page',
  templateUrl: './terms-of-service-page.component.html',
  styleUrl: './terms-of-service-page.component.scss',
  imports: [CardComponent, RouterLink],
})
export class TermsOfServicePageComponent {}
