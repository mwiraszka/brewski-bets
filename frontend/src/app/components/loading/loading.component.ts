import { SpinnerComponent } from '@eagami/ui';

import { Component, input } from '@angular/core';

@Component({
  selector: 'bb-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
  imports: [SpinnerComponent],
})
export class LoadingComponent {
  readonly label = input.required<string>();
}
