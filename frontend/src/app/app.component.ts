import { ToastComponent } from '@eagami/ui';

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '@app/components/header/header.component';

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet, HeaderComponent, ToastComponent],
})
export class AppComponent {}
