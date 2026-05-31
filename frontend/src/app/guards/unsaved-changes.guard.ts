import { type CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  confirmLeave(): boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = component =>
  component.confirmLeave();
