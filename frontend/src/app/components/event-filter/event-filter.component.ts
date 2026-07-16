import { CheckboxComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

// Newly seen events are visible by default, so the unchecked (hidden) events are
// tracked rather than the checked ones.
@Component({
  selector: 'bb-event-filter',
  templateUrl: './event-filter.component.html',
  styleUrl: './event-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CheckboxComponent],
})
export class EventFilterComponent {
  readonly events = input.required<string[]>();
  readonly hiddenEvents = model<ReadonlySet<string>>(new Set<string>());

  isChecked(event: string): boolean {
    return !this.hiddenEvents().has(event);
  }

  toggle(event: string, checked: boolean): void {
    this.hiddenEvents.update(hidden => {
      const next = new Set(hidden);
      if (checked) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  }
}
