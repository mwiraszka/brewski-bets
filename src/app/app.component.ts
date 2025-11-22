import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CdkScrollableModule, RouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly SCROLL_DELAY_MS = 100;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private readonly _document: Document,
  ) {}

  public ngOnInit(): void {
    this.activatedRoute.fragment
      .pipe(untilDestroyed(this))
      .subscribe((fragment: string | null) => {
        setTimeout(() => {
          if (fragment) {
            const element = document.getElementById(fragment);
            if (element) {
              element.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
              });
            }
          }
        }, this.SCROLL_DELAY_MS);
      });
  }

  public scrollToTop(): void {
    this._document.querySelector('main')!.scrollTo({ top: 0 });
  }
}
