import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CardComponent } from '@eagami/ui';

@Component({
  selector: 'bb-privacy-policy-page',
  templateUrl: './privacy-policy-page.component.html',
  styleUrl: './privacy-policy-page.component.scss',
  imports: [CardComponent, RouterLink],
})
export class PrivacyPolicyPageComponent {}
