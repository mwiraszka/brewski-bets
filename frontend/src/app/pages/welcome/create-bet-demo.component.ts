import {
  AutocompleteComponent,
  CardComponent,
  DropdownComponent,
  InputComponent,
} from '@eagami/ui';

import { ChangeDetectionStrategy, Component } from '@angular/core';

// Static, non-interactive replica of the create-bet form for the welcome screen
@Component({
  selector: 'bb-create-bet-demo',
  templateUrl: './create-bet-demo.component.html',
  styleUrl: './create-bet-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AutocompleteComponent, CardComponent, DropdownComponent, InputComponent],
})
export class CreateBetDemoComponent {
  readonly friendOptions = [{ value: 'barry', label: 'Barry Duffman' }];
}
