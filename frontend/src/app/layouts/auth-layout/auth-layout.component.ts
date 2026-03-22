import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'bb-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  imports: [RouterOutlet],
})
export class AuthLayoutComponent {}
