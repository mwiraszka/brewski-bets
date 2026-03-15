import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ClerkService } from '@app/services/clerk.service';

@Component({
  selector: 'bb-sso-callback-page',
  template: '',
})
export class SSOCallbackPageComponent implements OnInit {
  private readonly clerk = inject(ClerkService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    try {
      await this.clerk.handleSSOCallback();
    } catch {
      await this.router.navigate(['/login']);
    }
  }
}
