import {
  ButtonComponent,
  CardComponent,
  InputComponent,
  PlusIconComponent,
  SliderComponent,
} from '@eagami/ui';

import { ChangeDetectionStrategy, Component } from '@angular/core';

// Static, non-interactive replica of the bet form's outcomes section for the
// welcome screen
@Component({
  selector: 'bb-outcomes-demo',
  templateUrl: './outcomes-demo.component.html',
  styleUrl: './outcomes-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ButtonComponent,
    CardComponent,
    InputComponent,
    PlusIconComponent,
    SliderComponent,
  ],
})
export class OutcomesDemoComponent {
  readonly maxBrewskiCount = 6;
  readonly sliderTicks: ReadonlyArray<number> = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6];

  readonly outcomes = [
    { name: '2-1 for Spain', amount: -4 },
    { name: '1-0 for Spain', amount: -2 },
    { name: '2-0 for Argentina', amount: 2 },
    { name: '5-0 for Argentina', amount: 6 },
  ];
}
