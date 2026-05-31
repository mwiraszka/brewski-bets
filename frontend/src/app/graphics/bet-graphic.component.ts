import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { graphicBySlug } from './graphics.catalog';

@Component({
  selector: 'bb-bet-graphic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    @if (entry(); as graphic) {
      <span
        class="bet-graphic"
        [class.bet-graphic--brand]="graphic.brandFont"
        [style.font-size.px]="size()"
        [style.color]="tint()">
        @if (graphic.component) {
          <ng-container *ngComponentOutlet="graphic.component" />
        } @else {
          {{ graphic.glyph }}
        }
      </span>
    }
  `,
  styleUrl: './bet-graphic.component.scss',
})
export class BetGraphicComponent {
  readonly slug = input<string | null>(null);
  readonly color = input<string | null>(null);
  readonly size = input(20);

  protected readonly entry = computed(() => graphicBySlug(this.slug()));

  protected readonly tint = computed(() => {
    const graphic = this.entry();
    return graphic?.colorable ? this.color() : null;
  });
}
