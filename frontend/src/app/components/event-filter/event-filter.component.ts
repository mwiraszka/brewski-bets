import { CheckboxComponent, RadioComponent, RadioGroupComponent } from '@eagami/ui';

import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'bb-event-filter',
  templateUrl: './event-filter.component.html',
  styleUrl: './event-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CheckboxComponent, RadioComponent, RadioGroupComponent],
})
export class EventFilterComponent {
  readonly events = input.required<string[]>();
  readonly mode = input<'multi' | 'single'>('multi');

  // Multi mode: newly seen events are visible by default, so the unchecked
  // (hidden) events are tracked rather than the checked ones.
  readonly hiddenEvents = model<ReadonlySet<string>>(new Set<string>());

  // Single mode: exactly one event is selected at a time. The parent guarantees
  // the value is always one of `events`.
  readonly selectedEvent = model<string>('');

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
