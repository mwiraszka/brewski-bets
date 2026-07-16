import { ChangeDetectionStrategy, Component } from '@angular/core';

// Tipped-over, spilling beer bottle for empty states. Drawn in the same Feather
// line style as @eagami/ui's icons (24x24, currentColor) so it inherits the
// media colour and 1em sizing exactly like ea-icon-bottle does.
@Component({
  selector: 'bb-spilled-bottle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">
      <g transform="rotate(-20 5 9)">
        <path d="M3 7h4l2-2h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-2-2H3z" />
        <path d="M5 7v4" />
      </g>
      <path d="M3.2 12.2c-1 1.5-1 3 .4 4.5" />
      <path d="M1.5 19q1.5-1.5 3 0t3 0" />
      <circle
        cx="6"
        cy="16.2"
        r=".75"
        fill="currentColor"
        stroke="none" />
    </svg>
  `,
  styleUrl: './spilled-bottle.component.scss',
})
export class SpilledBottleComponent {}
