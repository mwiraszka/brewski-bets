import { StepComponent, StepperComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CreateBetDemoComponent } from './create-bet-demo.component';
import { OutcomesDemoComponent } from './outcomes-demo.component';
import { StandingsDemoComponent } from './standings-demo.component';

@Component({
  selector: 'bb-welcome-page',
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    StepperComponent,
    StepComponent,
    CreateBetDemoComponent,
    OutcomesDemoComponent,
    StandingsDemoComponent,
  ],
})
export class WelcomePageComponent {}
